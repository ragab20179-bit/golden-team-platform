/**
 * Bid Evaluation Matrix — tRPC Router
 * Handles RFQ management, bid submissions, and evaluation via the FastAPI scoring engine.
 *
 * Procedures:
 *   rfq.create           — create a new RFQ with items and criteria
 *   rfq.list             — list all RFQs with summary stats
 *   rfq.get              — get full RFQ detail (items + criteria + bids)
 *   rfq.updateStatus     — change RFQ lifecycle status
 *   rfq.delete           — soft-delete (cancel) an RFQ
 *   bid.submit           — submit a vendor bid with criterion scores
 *   bid.list             — list all bids for an RFQ
 *   bid.updateStatus     — shortlist / reject a bid
 *   evaluation.run       — call FastAPI engine and persist ranked results
 *   evaluation.getResults — retrieve the latest evaluation session for an RFQ
 *   evaluation.award     — record award decision + trigger ASTRA AMG approval
 */

import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  rfqs, rfqItems, bidCriteria, bidSubmissions, bidScores, evaluationSessions,
  InsertRfq, InsertRfqItem, InsertBidCriterion, InsertBidSubmission, InsertBidScore, InsertEvaluationSession,
} from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

// ── FastAPI bid engine base URL ───────────────────────────────────────────────
const BID_ENGINE_URL = process.env.BID_ENGINE_URL ?? "http://localhost:8001";

// ── Zod schemas ───────────────────────────────────────────────────────────────

const criterionSchema = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  criterionType: z.enum(["price", "linear", "threshold", "direct", "formula"]),
  weight: z.number().int().min(1).max(100),
  higherIsBetter: z.boolean().default(true),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  formula: z.string().optional(),
  thresholds: z.array(z.array(z.number())).optional(),
  inputScale: z.number().int().default(100),
  sortOrder: z.number().int().default(0),
});

const rfqItemSchema = z.object({
  itemName: z.string().min(1),
  itemNameAr: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  unit: z.string().default("unit"),
  estimatedUnitPrice: z.number().optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRfqNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RFQ-${y}${m}-${rand}`;
}

async function callBidEngine(endpoint: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${BID_ENGINE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Bid engine error (${res.status}): ${err}`);
  }
  return res.json();
}

// ── Router ────────────────────────────────────────────────────────────────────

export const bidEvaluationRouter = router({

  // ─── RFQ Management ────────────────────────────────────────────────────────

  rfq: router({

    /** Create a new RFQ with line items and evaluation criteria. */
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        titleAr: z.string().optional(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        category: z.string().optional(),
        budget: z.number().optional(),
        currency: z.string().default("SAR"),
        submissionDeadline: z.string().optional(),
        evaluationDeadline: z.string().optional(),
        items: z.array(rfqItemSchema).min(1),
        criteria: z.array(criterionSchema).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        const rfqNumber = generateRfqNumber();

        // Insert RFQ
        const [rfqResult] = await db.insert(rfqs).values({
          rfqNumber,
          title: input.title,
          titleAr: input.titleAr ?? null,
          description: input.description ?? null,
          descriptionAr: input.descriptionAr ?? null,
          category: input.category ?? null,
          budget: input.budget ?? null,
          currency: input.currency,
          submissionDeadline: input.submissionDeadline ?? null,
          evaluationDeadline: input.evaluationDeadline ?? null,
          status: "draft",
          createdBy: ctx.user?.id ?? null,
        } satisfies InsertRfq);

        const rfqId = (rfqResult as any).insertId as number;

        // Insert items
        if (input.items.length > 0) {
          await db.insert(rfqItems).values(
            input.items.map((item, i) => ({
              rfqId,
              itemName: item.itemName,
              itemNameAr: item.itemNameAr ?? null,
              description: item.description ?? null,
              quantity: item.quantity,
              unit: item.unit,
              estimatedUnitPrice: item.estimatedUnitPrice ?? null,
            } satisfies InsertRfqItem))
          );
        }

        // Insert criteria
        if (input.criteria.length > 0) {
          await db.insert(bidCriteria).values(
            input.criteria.map((c, i) => ({
              rfqId,
              name: c.name,
              nameAr: c.nameAr ?? null,
              description: c.description ?? null,
              criterionType: c.criterionType,
              weight: c.weight,
              higherIsBetter: c.higherIsBetter,
              minValue: c.minValue ?? null,
              maxValue: c.maxValue ?? null,
              formula: c.formula ?? null,
              thresholds: c.thresholds ?? null,
              inputScale: c.inputScale,
              sortOrder: c.sortOrder ?? i,
            } satisfies InsertBidCriterion))
          );
        }

        return { rfqId, rfqNumber };
      }),

    /** List all RFQs with bid count summary. */
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().default(50) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const limit = input?.limit ?? 50;
        const rows = await db.select().from(rfqs).orderBy(desc(rfqs.createdAt)).limit(limit);
        return rows;
      }),

    /** Get full RFQ detail including items, criteria, and bids. */
    get: protectedProcedure
      .input(z.object({ rfqId: z.number().int() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
        if (!rfq) return null;

        const items = await db.select().from(rfqItems).where(eq(rfqItems.rfqId, input.rfqId));
        const criteria = await db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, input.rfqId))
          .orderBy(bidCriteria.sortOrder);
        const bids = await db.select().from(bidSubmissions).where(eq(bidSubmissions.rfqId, input.rfqId))
          .orderBy(desc(bidSubmissions.submittedAt));

        // Fetch scores for all bids
        const bidIds = bids.map(b => b.id);
        const scores = bidIds.length > 0
          ? await db.select().from(bidScores).where(inArray(bidScores.bidId, bidIds))
          : [];

        const bidsWithScores = bids.map(bid => ({
          ...bid,
          scores: scores.filter(s => s.bidId === bid.id),
        }));

        return { rfq, items, criteria, bids: bidsWithScores };
      }),

    /** Update RFQ lifecycle status. */
    updateStatus: protectedProcedure
      .input(z.object({
        rfqId: z.number().int(),
        status: z.enum(["draft", "published", "evaluation", "awarded", "closed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(rfqs).set({ status: input.status }).where(eq(rfqs.id, input.rfqId));
        return { success: true };
      }),

    /** Delete (cancel) an RFQ. */
    delete: protectedProcedure
      .input(z.object({ rfqId: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(rfqs).set({ status: "cancelled" }).where(eq(rfqs.id, input.rfqId));
        return { success: true };
      }),
  }),

  // ─── Bid Submissions ────────────────────────────────────────────────────────

  bid: router({

    /** Submit a vendor bid with raw criterion values. */
    submit: protectedProcedure
      .input(z.object({
        rfqId: z.number().int(),
        vendorName: z.string().min(1),
        vendorNameAr: z.string().optional(),
        vendorEmail: z.string().email().optional(),
        vendorPhone: z.string().optional(),
        totalBidAmount: z.number().optional(),
        currency: z.string().default("SAR"),
        deliveryDays: z.number().int().optional(),
        warrantyMonths: z.number().int().optional(),
        notes: z.string().optional(),
        notesAr: z.string().optional(),
        /** Map of criterionId → rawValue */
        criterionValues: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Insert bid submission
        const [bidResult] = await db.insert(bidSubmissions).values({
          rfqId: input.rfqId,
          vendorName: input.vendorName,
          vendorNameAr: input.vendorNameAr ?? null,
          vendorEmail: input.vendorEmail ?? null,
          vendorPhone: input.vendorPhone ?? null,
          totalBidAmount: input.totalBidAmount ?? null,
          currency: input.currency,
          deliveryDays: input.deliveryDays ?? null,
          warrantyMonths: input.warrantyMonths ?? null,
          notes: input.notes ?? null,
          notesAr: input.notesAr ?? null,
          status: "submitted",
        } satisfies InsertBidSubmission);

        const bidId = (bidResult as any).insertId as number;

        // Insert criterion scores (raw values only; computed scores set after evaluation)
        const scoreRows: InsertBidScore[] = Object.entries(input.criterionValues).map(([criterionId, rawValue]) => ({
          bidId,
          criterionId: parseInt(criterionId, 10),
          rawValue,
          computedScore: null,
        }));

        if (scoreRows.length > 0) {
          await db.insert(bidScores).values(scoreRows);
        }

        return { bidId };
      }),

    /** List all bids for an RFQ. */
    list: protectedProcedure
      .input(z.object({ rfqId: z.number().int() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const bids = await db.select().from(bidSubmissions)
          .where(eq(bidSubmissions.rfqId, input.rfqId))
          .orderBy(desc(bidSubmissions.submittedAt));
        return bids;
      }),

    /** Update bid status (shortlist / reject). */
    updateStatus: protectedProcedure
      .input(z.object({
        bidId: z.number().int(),
        status: z.enum(["submitted", "under_review", "shortlisted", "rejected", "awarded"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");
        await db.update(bidSubmissions).set({ status: input.status }).where(eq(bidSubmissions.id, input.bidId));
        return { success: true };
      }),
  }),

  // ─── Evaluation Engine ──────────────────────────────────────────────────────

  evaluation: router({

    /**
     * Run the bid evaluation engine for an RFQ.
     * Fetches all submitted bids + criteria, calls the FastAPI engine,
     * persists ranked results, and updates computed scores in bid_scores.
     */
    run: protectedProcedure
      .input(z.object({
        rfqId: z.number().int(),
        staged: z.boolean().default(false),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Fetch criteria
        const criteria = await db.select().from(bidCriteria)
          .where(eq(bidCriteria.rfqId, input.rfqId))
          .orderBy(bidCriteria.sortOrder);

        if (criteria.length === 0) throw new Error("No evaluation criteria defined for this RFQ");

        // Fetch bids + scores
        const bids = await db.select().from(bidSubmissions)
          .where(and(
            eq(bidSubmissions.rfqId, input.rfqId),
            // Only evaluate active bids (not rejected)
          ));

        const activeBids = bids.filter(b => b.status !== "rejected" && b.status !== "awarded");
        if (activeBids.length === 0) throw new Error("No active bids to evaluate");

        const bidIds = activeBids.map(b => b.id);
        const scores = await db.select().from(bidScores).where(inArray(bidScores.bidId, bidIds));

        // Build bid data for engine
        const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

        const engineBids = activeBids.map(bid => {
          const bidScoreMap: Record<string, number> = {};
          for (const criterion of criteria) {
            const score = scores.find(s => s.bidId === bid.id && s.criterionId === criterion.id);
            // Use rawValue if available; fall back to totalBidAmount for price criteria
            if (score?.rawValue != null) {
              bidScoreMap[`crit_${criterion.id}`] = score.rawValue;
            } else if (criterion.criterionType === "price" && bid.totalBidAmount != null) {
              bidScoreMap[`crit_${criterion.id}`] = bid.totalBidAmount;
            } else {
              bidScoreMap[`crit_${criterion.id}`] = 0;
            }
          }
          return { vendor: bid.vendorName, values: bidScoreMap };
        });

        const engineCriteria = criteria.map(c => ({
          column: `crit_${c.id}`,
          type: c.criterionType === "price" ? "price" : c.criterionType,
          weight: c.weight / totalWeight, // normalize to 0-1
          higher_is_better: c.higherIsBetter,
          input_scale: c.inputScale,
          formula: c.formula ?? undefined,
          thresholds: (c.thresholds as number[][] | null) ?? undefined,
        }));

        // Call FastAPI engine
        const engineResult = await callBidEngine("/evaluate", {
          bids: engineBids,
          criteria: engineCriteria,
          normalize_weights: false, // already normalized above
        }) as {
          success: boolean;
          ranked_results: Array<{
            vendor: string;
            ranking: number;
            final_score: number;
            criterion_scores: Record<string, number | null>;
          }>;
          summary: Record<string, unknown>;
        };

        if (!engineResult.success) throw new Error("Bid engine returned failure");

        // Persist evaluation session
        const [sessionResult] = await db.insert(evaluationSessions).values({
          rfqId: input.rfqId,
          rankedResults: engineResult.ranked_results,
          engineVersion: "1.0",
          evaluatedBy: ctx.user?.id ?? null,
          notes: input.notes ?? null,
        } satisfies InsertEvaluationSession);

        const sessionId = (sessionResult as any).insertId as number;

        // Update computed scores in bid_scores table
        for (const ranked of engineResult.ranked_results) {
          const bid = activeBids.find(b => b.vendorName === ranked.vendor);
          if (!bid) continue;
          for (const criterion of criteria) {
            const colKey = `crit_${criterion.id}`;
            const computedScore = ranked.criterion_scores[colKey];
            if (computedScore != null) {
              await db.update(bidScores)
                .set({ computedScore: Math.round(computedScore) })
                .where(and(eq(bidScores.bidId, bid.id), eq(bidScores.criterionId, criterion.id)));
            }
          }
        }

        // Move RFQ to evaluation status
        await db.update(rfqs).set({ status: "evaluation" }).where(eq(rfqs.id, input.rfqId));

        return {
          sessionId,
          rankedResults: engineResult.ranked_results,
          summary: engineResult.summary,
        };
      }),

    /** Get the latest evaluation session results for an RFQ. */
    getResults: protectedProcedure
      .input(z.object({ rfqId: z.number().int() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const [session] = await db.select().from(evaluationSessions)
          .where(eq(evaluationSessions.rfqId, input.rfqId))
          .orderBy(desc(evaluationSessions.evaluatedAt))
          .limit(1);
        return session ?? null;
      }),

    /** Record award decision for the winning vendor. */
    award: protectedProcedure
      .input(z.object({
        rfqId: z.number().int(),
        awardedVendor: z.string().min(1),
        awardedAmount: z.number().optional(),
        awardJustification: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database unavailable");

        // Update RFQ with award details
        await db.update(rfqs).set({
          status: "awarded",
          awardedVendor: input.awardedVendor,
          awardedAmount: input.awardedAmount ?? null,
          awardJustification: input.awardJustification,
        }).where(eq(rfqs.id, input.rfqId));

        // Mark awarded vendor's bid
        await db.update(bidSubmissions)
          .set({ status: "awarded" })
          .where(and(
            eq(bidSubmissions.rfqId, input.rfqId),
            eq(bidSubmissions.vendorName, input.awardedVendor),
          ));

        // Reject all other bids
        const allBids = await db.select().from(bidSubmissions).where(eq(bidSubmissions.rfqId, input.rfqId));
        for (const bid of allBids) {
          if (bid.vendorName !== input.awardedVendor && bid.status === "submitted") {
            await db.update(bidSubmissions).set({ status: "rejected" }).where(eq(bidSubmissions.id, bid.id));
          }
        }

        return { success: true };
      }),
  }),
});
