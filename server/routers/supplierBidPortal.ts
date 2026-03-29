/**
 * Supplier Bid Portal — tRPC Router
 * Handles one-time token invite generation, public token validation,
 * and public bid submission without portal authentication.
 *
 * Security model:
 *  - Invite generation: protectedProcedure (portal users only)
 *  - Token validation + bid submission: publicProcedure (suppliers, no login)
 *  - Tokens are cryptographically random (32 bytes hex = 64 chars)
 *  - Tokens expire after configurable TTL (default: 7 days)
 *  - Each token can only be used once (status: pending → submitted)
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  supplierInvites, rfqs, rfqItems, bidCriteria, bidSubmissions, bidScores,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import crypto from "crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64-char hex token
}

function getExpiryDate(days = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function isExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const supplierBidPortalRouter = router({

  // ── PROTECTED: Invite management (portal users only) ──────────────────────

  /** Generate a one-time invite link for a supplier */
  inviteSupplier: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      supplierEmail: z.string().email(),
      supplierName: z.string().min(2).max(300),
      supplierCompany: z.string().max(300).optional(),
      expiryDays: z.number().int().min(1).max(30).default(7),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify RFQ exists and is open
      const rfqRows = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
      if (!rfqRows[0]) throw new Error("RFQ not found");
      if (!["draft", "open"].includes(rfqRows[0].status)) {
        throw new Error("RFQ is not accepting bids");
      }

      // Check for existing pending invite for same email+rfq
      const existing = await db.select().from(supplierInvites)
        .where(and(
          eq(supplierInvites.rfqId, input.rfqId),
          eq(supplierInvites.supplierEmail, input.supplierEmail),
          eq(supplierInvites.status, "pending"),
        )).limit(1);

      if (existing[0] && !isExpired(existing[0].expiresAt)) {
        // Return existing token instead of creating duplicate
        return {
          inviteId: existing[0].id,
          token: existing[0].token,
          expiresAt: existing[0].expiresAt,
          isExisting: true,
        };
      }

      const token = generateToken();
      const expiresAt = getExpiryDate(input.expiryDays);

      const result = await db.insert(supplierInvites).values({
        rfqId: input.rfqId,
        token,
        supplierEmail: input.supplierEmail,
        supplierName: input.supplierName,
        supplierCompany: input.supplierCompany ?? null,
        status: "pending",
        expiresAt,
        invitedBy: ctx.user.name ?? ctx.user.email ?? "portal-user",
      });

      return {
        inviteId: Number(result[0].insertId),
        token,
        expiresAt,
        isExisting: false,
      };
    }),

  /** List all invites for an RFQ */
  listInvites: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(supplierInvites)
        .where(eq(supplierInvites.rfqId, input.rfqId))
        .orderBy(desc(supplierInvites.createdAt));
    }),

  /** Revoke an invite (mark as revoked) */
  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(supplierInvites)
        .set({ status: "revoked" })
        .where(eq(supplierInvites.id, input.inviteId));
      return { success: true };
    }),

  /** Resend / extend an invite (regenerate token + reset expiry) */
  resendInvite: protectedProcedure
    .input(z.object({
      inviteId: z.number().int(),
      expiryDays: z.number().int().min(1).max(30).default(7),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const token = generateToken();
      const expiresAt = getExpiryDate(input.expiryDays);
      await db.update(supplierInvites)
        .set({ token, expiresAt, status: "pending" })
        .where(eq(supplierInvites.id, input.inviteId));
      return { token, expiresAt };
    }),

  // ── PUBLIC: Supplier-facing (no authentication required) ──────────────────

  /** Validate a token and return RFQ details for the supplier */
  validateToken: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Service temporarily unavailable");

      const inviteRows = await db.select().from(supplierInvites)
        .where(eq(supplierInvites.token, input.token)).limit(1);

      const invite = inviteRows[0];
      if (!invite) return { valid: false, reason: "Invalid link" as const };
      if (invite.status === "revoked") return { valid: false, reason: "Link has been revoked" as const };
      if (invite.status === "submitted") return { valid: false, reason: "Bid already submitted" as const };
      if (isExpired(invite.expiresAt)) {
        // Auto-mark as expired
        await db.update(supplierInvites)
          .set({ status: "expired" })
          .where(eq(supplierInvites.id, invite.id));
        return { valid: false, reason: "Link has expired" as const };
      }

      // Fetch RFQ details
      const rfqRows = await db.select().from(rfqs).where(eq(rfqs.id, invite.rfqId)).limit(1);
      const rfq = rfqRows[0];
      if (!rfq) return { valid: false, reason: "RFQ not found" as const };

      // Fetch RFQ items
      const items = await db.select().from(rfqItems).where(eq(rfqItems.rfqId, invite.rfqId));

      // Fetch evaluation criteria
      const criteria = await db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, invite.rfqId));

      return {
        valid: true,
        invite: {
          id: invite.id,
          supplierName: invite.supplierName,
          supplierEmail: invite.supplierEmail,
          supplierCompany: invite.supplierCompany,
          expiresAt: invite.expiresAt,
        },
        rfq: {
          id: rfq.id,
          rfqNumber: rfq.rfqNumber,
          title: rfq.title,
          description: rfq.description,
          technicalWeight: rfq.technicalWeight,
          economicWeight: rfq.economicWeight,
          deadline: rfq.deadline,
        },
        items,
        criteria,
      };
    }),

  /** Submit a bid via public token (no auth required) */
  submitPublicBid: publicProcedure
    .input(z.object({
      token: z.string().length(64),
      totalPrice: z.number().int().min(0),
      deliveryDays: z.number().int().min(1).max(3650),
      notes: z.string().max(2000).optional(),
      // Per-criterion raw values keyed by criterion ID
      criterionValues: z.record(z.string(), z.number()),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Service temporarily unavailable");

      // Re-validate token (atomic check)
      const inviteRows = await db.select().from(supplierInvites)
        .where(eq(supplierInvites.token, input.token)).limit(1);

      const invite = inviteRows[0];
      if (!invite) throw new Error("Invalid submission link");
      if (invite.status !== "pending") throw new Error("This link has already been used or is no longer valid");
      if (isExpired(invite.expiresAt)) {
        await db.update(supplierInvites).set({ status: "expired" }).where(eq(supplierInvites.id, invite.id));
        throw new Error("Submission link has expired");
      }

      // Insert bid submission
      const subResult = await db.insert(bidSubmissions).values({
        rfqId: invite.rfqId,
        supplierName: invite.supplierName,
        supplierEmail: invite.supplierEmail,
        totalPrice: input.totalPrice,
        deliveryDays: input.deliveryDays,
        notes: input.notes ?? null,
        status: "submitted",
      });
      const submissionId = Number(subResult[0].insertId);

      // Insert per-criterion scores (raw values — scoring engine runs later)
      const criteriaRows = await db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, invite.rfqId));
      for (const crit of criteriaRows) {
        const rawValue = input.criterionValues[String(crit.id)];
        if (rawValue !== undefined) {
          await db.insert(bidScores).values({
            submissionId,
            criterionId: crit.id,
            rawValue: Math.round(rawValue),
            score: null, // scored by FastAPI engine when evaluation runs
          });
        }
      }

      // Mark invite as submitted (one-time use enforced)
      await db.update(supplierInvites).set({
        status: "submitted",
        submittedAt: new Date(),
        submissionId,
      }).where(eq(supplierInvites.id, invite.id));

      return {
        success: true,
        submissionId,
        message: "Your bid has been submitted successfully. You will be notified of the evaluation results.",
      };
    }),
});
