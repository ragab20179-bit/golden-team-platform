/**
 * Request & Approval Engine — M3 of Phase 2
 * Structured request workflow with ASTRA AMG authority matrix enforcement.
 *
 * Request lifecycle:
 *   submit → ASTRA AMG check → build approval chain → pending
 *   → approver acts → advance chain → approved / rejected
 *
 * Authority matrix (based on GT-GOV-002 policy pack):
 *   leave          → manager (1 step)
 *   purchase ≤10k  → manager (1 step)
 *   purchase ≤50k  → manager → director (2 steps)
 *   purchase >50k  → manager → director → ceo (3 steps)
 *   contract       → director → ceo (2 steps)
 *   travel         → manager (1 step)
 *   expense ≤5k    → manager (1 step)
 *   expense >5k    → manager → director (2 steps)
 *   it_access      → it_manager (1 step)
 *   hr_change      → hr_manager → director (2 steps)
 *   custom         → director (1 step)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  requests,
  approvalSteps,
  approvalActions,
  type InsertRequest,
  type InsertApprovalStep,
  type InsertApprovalAction,
} from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType =
  | "leave" | "purchase" | "contract" | "travel" | "expense"
  | "it_access" | "hr_change" | "custom";

type ApproverChainStep = {
  stepOrder: number;
  approverRole: string;
  slaHours: number;
};

// ─── Authority Matrix ─────────────────────────────────────────────────────────

/**
 * Determine the approval chain based on request type and amount.
 * Implements the GT-GOV-002 Golden Team Policy Pack authority matrix.
 */
function buildApprovalChain(type: RequestType, amountSar?: number | null): ApproverChainStep[] {
  const amt = amountSar ?? 0;

  switch (type) {
    case "leave":
      return [{ stepOrder: 1, approverRole: "manager", slaHours: 24 }];

    case "purchase":
      if (amt <= 10_000) {
        return [{ stepOrder: 1, approverRole: "manager", slaHours: 48 }];
      } else if (amt <= 50_000) {
        return [
          { stepOrder: 1, approverRole: "manager", slaHours: 48 },
          { stepOrder: 2, approverRole: "director", slaHours: 72 },
        ];
      } else {
        return [
          { stepOrder: 1, approverRole: "manager", slaHours: 48 },
          { stepOrder: 2, approverRole: "director", slaHours: 72 },
          { stepOrder: 3, approverRole: "ceo", slaHours: 96 },
        ];
      }

    case "contract":
      return [
        { stepOrder: 1, approverRole: "director", slaHours: 72 },
        { stepOrder: 2, approverRole: "ceo", slaHours: 96 },
      ];

    case "travel":
      return [{ stepOrder: 1, approverRole: "manager", slaHours: 48 }];

    case "expense":
      if (amt <= 5_000) {
        return [{ stepOrder: 1, approverRole: "manager", slaHours: 48 }];
      } else {
        return [
          { stepOrder: 1, approverRole: "manager", slaHours: 48 },
          { stepOrder: 2, approverRole: "director", slaHours: 72 },
        ];
      }

    case "it_access":
      return [{ stepOrder: 1, approverRole: "it_manager", slaHours: 24 }];

    case "hr_change":
      return [
        { stepOrder: 1, approverRole: "hr_manager", slaHours: 48 },
        { stepOrder: 2, approverRole: "director", slaHours: 72 },
      ];

    case "custom":
    default:
      return [{ stepOrder: 1, approverRole: "director", slaHours: 72 }];
  }
}

/**
 * ASTRA AMG quick-check: determine if request type + amount is within policy.
 * Returns outcome and reason code.
 */
function astraCheck(type: RequestType, amountSar?: number | null): {
  outcome: "ALLOW" | "DENY" | "ESCALATE";
  reasonCode: string;
} {
  const amt = amountSar ?? 0;

  // Hard DENY rules (from GT-GOV-002 DENY scenarios)
  if (type === "purchase" && amt > 500_000) {
    return { outcome: "DENY", reasonCode: "EXCEEDS_BOARD_THRESHOLD" };
  }
  if (type === "contract" && amt > 1_000_000) {
    return { outcome: "DENY", reasonCode: "EXCEEDS_BOARD_THRESHOLD" };
  }

  // Escalate rules
  if (type === "purchase" && amt > 50_000) {
    return { outcome: "ESCALATE", reasonCode: "MULTI_LEVEL_APPROVAL_REQUIRED" };
  }
  if (type === "contract") {
    return { outcome: "ESCALATE", reasonCode: "CONTRACT_REQUIRES_DIRECTOR_CEO" };
  }

  return { outcome: "ALLOW", reasonCode: "WITHIN_POLICY" };
}

/**
 * Generate a sequential request number: GT-REQ-YYYYMMDD-XXXX
 */
async function generateRequestNumber(): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error('Database unavailable');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await db.select().from(requests);
  const seq = String(count.length + 1).padStart(4, "0");
  return `GT-REQ-${dateStr}-${seq}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const requestsRouter = router({

  /**
   * Submit a new request. Runs ASTRA AMG check and builds approval chain.
   */
  submit: protectedProcedure
    .input(z.object({
      type: z.enum(["leave", "purchase", "contract", "travel", "expense", "it_access", "hr_change", "custom"]),
      title: z.string().min(3).max(255),
      description: z.string().optional(),
      amountSar: z.number().int().positive().optional(),
      currency: z.string().default("SAR"),
      priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
      dueDate: z.string().optional(),
      payload: z.record(z.string(), z.unknown()).optional(),
      attachedFileIds: z.array(z.number().int()).optional(),
      requestedByDept: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;

      // 1. ASTRA AMG authority matrix check
      const astraResult = astraCheck(input.type, input.amountSar);

      // Hard DENY — reject immediately without creating approval chain
      if (astraResult.outcome === "DENY") {
        const requestNumber = await generateRequestNumber();
        const [inserted] = await db.insert(requests).values({
          requestNumber,
          type: input.type,
          title: input.title,
          description: input.description ?? null,
          requestedBy: user.id,
          requestedByName: user.name ?? null,
          requestedByDept: input.requestedByDept ?? null,
          amountSar: input.amountSar ?? null,
          currency: input.currency,
          status: "rejected",
          astraOutcome: "DENY",
          astraReasonCode: astraResult.reasonCode,
          currentStep: 0,
          totalSteps: 0,
          payload: input.payload ?? null,
          attachedFileIds: input.attachedFileIds ?? null,
          priority: input.priority,
          dueDate: input.dueDate ?? null,
          resolvedAt: new Date(),
        } satisfies InsertRequest);
        return {
          success: false,
          denied: true,
          reasonCode: astraResult.reasonCode,
          requestNumber,
          message: "Request denied by ASTRA AMG authority matrix — exceeds board approval threshold.",
        };
      }

      // 2. Build approval chain
      const chain = buildApprovalChain(input.type, input.amountSar);
      const requestNumber = await generateRequestNumber();

      // 3. Insert the request
      await db.insert(requests).values({
        requestNumber,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        requestedBy: user.id,
        requestedByName: user.name ?? null,
        requestedByDept: input.requestedByDept ?? null,
        amountSar: input.amountSar ?? null,
        currency: input.currency,
        status: "pending",
        astraOutcome: astraResult.outcome,
        astraReasonCode: astraResult.reasonCode,
        currentStep: 1,
        totalSteps: chain.length,
        payload: input.payload ?? null,
        attachedFileIds: input.attachedFileIds ?? null,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
      } satisfies InsertRequest);

      // 4. Fetch the inserted request to get its ID
      const [newRequest] = await db
        .select()
        .from(requests)
        .where(eq(requests.requestNumber, requestNumber))
        .limit(1);

      // 5. Insert approval steps
      const now = new Date();
      for (const step of chain) {
        const dueAt = new Date(now.getTime() + step.slaHours * 60 * 60 * 1000);
        await db.insert(approvalSteps).values({
          requestId: newRequest.id,
          stepOrder: step.stepOrder,
          approverRole: step.approverRole,
          status: "pending",
          isCurrent: step.stepOrder === 1,
          slaHours: step.slaHours,
          dueAt,
        } satisfies InsertApprovalStep);
      }

      return {
        success: true,
        denied: false,
        requestNumber,
        requestId: newRequest.id,
        astraOutcome: astraResult.outcome,
        approvalChain: chain,
        message: `Request ${requestNumber} submitted. ${chain.length} approval step(s) required.`,
      };
    }),

  /**
   * Get all requests submitted by the current user.
   */
  getMyRequests: protectedProcedure
    .input(z.object({
      status: z.enum(["draft", "pending", "in_review", "approved", "rejected", "cancelled"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;
      const rows = await db
        .select()
        .from(requests)
        .where(eq(requests.requestedBy, user.id))
        .orderBy(desc(requests.createdAt))
        .limit(input?.limit ?? 50);
      return rows;
    }),

  /**
   * Get all requests pending the current user's approval (by role).
   * In a real system this would match by role; here we return all pending requests
   * for admin users, and requests matching the user's role for others.
   */
  getPendingApprovals: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      // Return all requests that are pending or in_review
      const pendingRequests = await db
        .select()
        .from(requests)
        .where(
          eq(requests.status, "pending")
        )
        .orderBy(desc(requests.createdAt))
        .limit(100);

      const inReviewRequests = await db
        .select()
        .from(requests)
        .where(eq(requests.status, "in_review"))
        .orderBy(desc(requests.createdAt))
        .limit(100);

      return [...pendingRequests, ...inReviewRequests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  /**
   * Get a single request by ID with its approval steps and action history.
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.id))
        .limit(1);

      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const steps = await db
        .select()
        .from(approvalSteps)
        .where(eq(approvalSteps.requestId, input.id))
        .orderBy(asc(approvalSteps.stepOrder));

      const actions = await db
        .select()
        .from(approvalActions)
        .where(eq(approvalActions.requestId, input.id))
        .orderBy(asc(approvalActions.createdAt));

      return { request, steps, actions };
    }),

  /**
   * Approve the current step of a request.
   * Advances to the next step or marks the request as fully approved.
   */
  approve: protectedProcedure
    .input(z.object({
      requestId: z.number().int(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;

      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.status === "approved" || request.status === "rejected" || request.status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Request is already ${request.status}` });
      }

      // Find current step
      const [currentStep] = await db
        .select()
        .from(approvalSteps)
        .where(and(
          eq(approvalSteps.requestId, input.requestId),
          eq(approvalSteps.isCurrent, true)
        ))
        .limit(1);

      if (!currentStep) throw new TRPCError({ code: "NOT_FOUND", message: "No active approval step found" });

      // Log the approval action
      await db.insert(approvalActions).values({
        requestId: input.requestId,
        stepId: currentStep.id,
        actorUserId: user.id,
        actorName: user.name ?? null,
        actorRole: user.role,
        action: "approve",
        comment: input.comment ?? null,
      } satisfies InsertApprovalAction);

      // Mark current step as approved
      await db.update(approvalSteps)
        .set({ status: "approved", isCurrent: false, updatedAt: new Date() })
        .where(eq(approvalSteps.id, currentStep.id));

      // Check if there's a next step
      const [nextStep] = await db
        .select()
        .from(approvalSteps)
        .where(and(
          eq(approvalSteps.requestId, input.requestId),
          eq(approvalSteps.stepOrder, currentStep.stepOrder + 1)
        ))
        .limit(1);

      if (nextStep) {
        // Advance to next step
        await db.update(approvalSteps)
          .set({ isCurrent: true, updatedAt: new Date() })
          .where(eq(approvalSteps.id, nextStep.id));

        await db.update(requests)
          .set({
            status: "in_review",
            currentStep: nextStep.stepOrder,
            updatedAt: new Date(),
          })
          .where(eq(requests.id, input.requestId));

        return {
          success: true,
          status: "in_review" as const,
          nextApproverRole: nextStep.approverRole,
          message: `Step ${currentStep.stepOrder} approved. Awaiting ${nextStep.approverRole} approval.`,
        };
      } else {
        // All steps approved — mark request as fully approved
        await db.update(requests)
          .set({
            status: "approved",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(requests.id, input.requestId));

        return {
          success: true,
          status: "approved" as const,
          nextApproverRole: null,
          message: "Request fully approved.",
        };
      }
    }),

  /**
   * Reject a request at the current step.
   * Immediately marks the request as rejected.
   */
  reject: protectedProcedure
    .input(z.object({
      requestId: z.number().int(),
      comment: z.string().min(5, "Rejection reason is required (min 5 chars)"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;

      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.status !== "pending" && request.status !== "in_review") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot reject a ${request.status} request` });
      }

      // Find current step
      const [currentStep] = await db
        .select()
        .from(approvalSteps)
        .where(and(
          eq(approvalSteps.requestId, input.requestId),
          eq(approvalSteps.isCurrent, true)
        ))
        .limit(1);

      if (currentStep) {
        // Log the rejection action
        await db.insert(approvalActions).values({
          requestId: input.requestId,
          stepId: currentStep.id,
          actorUserId: user.id,
          actorName: user.name ?? null,
          actorRole: user.role,
          action: "reject",
          comment: input.comment,
        } satisfies InsertApprovalAction);

        // Mark current step as rejected
        await db.update(approvalSteps)
          .set({ status: "rejected", isCurrent: false, updatedAt: new Date() })
          .where(eq(approvalSteps.id, currentStep.id));
      }

      // Mark request as rejected
      await db.update(requests)
        .set({
          status: "rejected",
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(requests.id, input.requestId));

      return {
        success: true,
        status: "rejected" as const,
        message: "Request rejected.",
      };
    }),

  /**
   * Cancel a request (requester only, while still pending).
   */
  cancel: protectedProcedure
    .input(z.object({
      requestId: z.number().int(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;

      const [request] = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.requestedBy !== user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the requester can cancel a request" });
      }
      if (request.status !== "pending" && request.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel a ${request.status} request` });
      }

      await db.update(requests)
        .set({
          status: "cancelled",
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(requests.id, input.requestId));

      return { success: true, message: "Request cancelled." };
    }),

  /**
   * Get summary stats for the approvals dashboard.
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
  if (!db) throw new Error('Database unavailable');
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const user = ctx.user!;

      const myRequests = await db.select().from(requests).where(eq(requests.requestedBy, user.id));
      const allRequests = await db.select().from(requests);

      const myStats = {
        total: myRequests.length,
        pending: myRequests.filter(r => r.status === "pending" || r.status === "in_review").length,
        approved: myRequests.filter(r => r.status === "approved").length,
        rejected: myRequests.filter(r => r.status === "rejected").length,
      };

      const pendingApprovals = allRequests.filter(r =>
        r.status === "pending" || r.status === "in_review"
      ).length;

      return { myStats, pendingApprovals, totalRequests: allRequests.length };
    }),
});
