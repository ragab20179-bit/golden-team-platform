import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  insertAstraDecision,
  getAstraDecisions,
  getAstraDecisionsByOutcome,
  clearAstraDecisions,
  getAstraPolicyRules,
  upsertAstraPolicyRule,
  deleteAstraPolicyRule,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── ASTRA AMG — Decision Log ──────────────────────────────────────────────
  astra: router({
    /**
     * Persist a single ASTRA decision to the append-only audit log.
     * Called from the frontend after every engine decision.
     */
    logDecision: publicProcedure
      .input(z.object({
        decisionId: z.string(),
        requestId: z.string(),
        actorId: z.string(),
        actorRole: z.string(),
        domain: z.string(),
        action: z.string(),
        outcome: z.enum(["ALLOW", "DENY", "ESCALATE", "DEGRADE"]),
        reasonCode: z.string(),
        policyPackVersion: z.string(),
        latencyMs: z.number().int().default(0),
        contextSnapshot: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        await insertAstraDecision({
          decisionId: input.decisionId,
          requestId: input.requestId,
          actorId: input.actorId,
          actorRole: input.actorRole,
          domain: input.domain,
          action: input.action,
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          policyPackVersion: input.policyPackVersion,
          latencyMs: input.latencyMs,
          contextSnapshot: input.contextSnapshot ?? null,
        });
        return { success: true };
      }),

    /** Clear all decisions from the audit log (admin action). */
    clearLog: publicProcedure.mutation(async () => {
      const cleared = await clearAstraDecisions();
      return { cleared };
    }),

    /** Retrieve the most recent decisions (default 200). */
    getDecisions: publicProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(500).default(200),
        outcome: z.enum(["ALLOW", "DENY", "ESCALATE", "DEGRADE"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 200;
        const outcome = input?.outcome;
        if (outcome) return getAstraDecisionsByOutcome(outcome, limit);
        return getAstraDecisions(limit);
      }),

    // ─── ASTRA AMG — Dynamic Policy Rules ──────────────────────────────────
    /** Return all dynamic policy rule overrides (Authority Matrix editor). */
    getPolicyRules: publicProcedure.query(async () => {
      return getAstraPolicyRules();
    }),

    /** Create or update a policy rule override. */
    upsertPolicyRule: protectedProcedure
      .input(z.object({
        domain: z.string(),
        action: z.string(),
        role: z.string(),
        allowed: z.boolean(),
        requireConsent: z.boolean().default(false),
        requireJustification: z.boolean().default(false),
        maxAmountSar: z.number().int().positive().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertAstraPolicyRule({
          domain: input.domain,
          action: input.action,
          role: input.role,
          allowed: input.allowed,
          requireConsent: input.requireConsent,
          requireJustification: input.requireJustification,
          maxAmountSar: input.maxAmountSar ?? null,
          notes: input.notes ?? null,
          createdBy: ctx.user?.name ?? ctx.user?.openId ?? "unknown",
        });
        return { success: true };
      }),

    /** Delete a policy rule override by id. */
    deletePolicyRule: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteAstraPolicyRule(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
