/**
 * Bid Evaluation Matrix — tRPC Router
 * Covers: RFQ management, criteria setup, bid submission, scoring via FastAPI engine, evaluation sessions
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  rfqs, rfqItems, bidCriteria, bidSubmissions, bidScores, evaluationSessions,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { odooCreate, odooSearchRead } from "../odoo";
import { invokeLLM } from "../_core/llm";

const BID_ENGINE_URL = process.env.BID_ENGINE_URL ?? "http://localhost:8001";

function generateRFQNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GT-RFQ-${year}-${rand}`;
}

export const bidEvaluationRouter = router({

  listRFQs: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(rfqs).orderBy(desc(rfqs.createdAt)).limit(input.limit);
      if (input.status) return rows.filter((r: typeof rows[0]) => r.status === input.status);
      return rows;
    }),

  getRFQ: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(rfqs).where(eq(rfqs.id, input.id)).limit(1);
      return rows[0] ?? null;
    }),

  createRFQ: protectedProcedure
    .input(z.object({
      title: z.string().min(3).max(500),
      description: z.string().optional(),
      technicalWeight: z.number().int().min(0).max(100).default(40),
      economicWeight: z.number().int().min(0).max(100).default(60),
      deadline: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rfqNumber = generateRFQNumber();
      const result = await db.insert(rfqs).values({
        rfqNumber,
        title: input.title,
        description: input.description ?? null,
        status: "draft",
        deadline: input.deadline ?? null,
        createdBy: ctx.user?.name ?? ctx.user?.openId ?? "unknown",
        technicalWeight: input.technicalWeight,
        economicWeight: input.economicWeight,
      });
      return { id: Number(result[0].insertId), rfqNumber };
    }),

  updateRFQStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["draft", "open", "evaluation", "awarded", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(rfqs).set({ status: input.status }).where(eq(rfqs.id, input.id));
      return { success: true };
    }),

  addRFQItem: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      description: z.string().min(1),
      quantity: z.number().int().min(1).default(1),
      unit: z.string().optional(),
      estimatedPrice: z.number().int().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(rfqItems).values({
        rfqId: input.rfqId,
        description: input.description,
        quantity: input.quantity,
        unit: input.unit ?? null,
        estimatedPrice: input.estimatedPrice ?? null,
      });
      return { id: Number(result[0].insertId) };
    }),

  getRFQItems: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(rfqItems).where(eq(rfqItems.rfqId, input.rfqId));
    }),

  addCriterion: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      name: z.string().min(1).max(200),
      weight: z.number().int().min(1).max(100),
      scoringType: z.enum(["min_ratio", "linear", "direct", "threshold"]).default("linear"),
      stage: z.enum(["technical", "economic"]).default("economic"),
      higherIsBetter: z.number().int().min(0).max(1).default(1),
      thresholdValue: z.number().int().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(bidCriteria).values({
        rfqId: input.rfqId,
        name: input.name,
        weight: input.weight,
        scoringType: input.scoringType,
        stage: input.stage,
        higherIsBetter: input.higherIsBetter,
        thresholdValue: input.thresholdValue ?? null,
        description: input.description ?? null,
      });
      return { id: Number(result[0].insertId) };
    }),

  getCriteria: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, input.rfqId));
    }),

  submitBid: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      supplierName: z.string().min(1).max(300),
      supplierEmail: z.string().email().optional(),
      totalPrice: z.number().int().optional(),
      deliveryDays: z.number().int().optional(),
      notes: z.string().optional(),
      criterionScores: z.array(z.object({
        criterionId: z.number().int(),
        rawValue: z.number().int(),
      })).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(bidSubmissions).values({
        rfqId: input.rfqId,
        supplierName: input.supplierName,
        supplierEmail: input.supplierEmail ?? null,
        totalPrice: input.totalPrice ?? null,
        deliveryDays: input.deliveryDays ?? null,
        notes: input.notes ?? null,
        status: "submitted",
      });
      const submissionId = Number(result[0].insertId);

      if (input.criterionScores?.length) {
        for (const cs of input.criterionScores) {
          await db.insert(bidScores).values({
            submissionId,
            criterionId: cs.criterionId,
            rawValue: cs.rawValue,
            score: null,
          });
        }
      }

      return { id: submissionId };
    }),

  getSubmissions: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bidSubmissions)
        .where(eq(bidSubmissions.rfqId, input.rfqId))
        .orderBy(desc(bidSubmissions.submittedAt));
    }),

  getBidScores: protectedProcedure
    .input(z.object({ submissionId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(bidScores).where(eq(bidScores.submissionId, input.submissionId));
    }),

  evaluate: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const criteria = await db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, input.rfqId));
      const submissions = await db.select().from(bidSubmissions).where(eq(bidSubmissions.rfqId, input.rfqId));

      if (criteria.length === 0) throw new Error("No evaluation criteria defined for this RFQ");
      if (submissions.length < 2) throw new Error("At least 2 bid submissions are required to run evaluation");

      // Build scores map: submissionId → criterionId → rawValue
      const scoresMap: Record<number, Record<number, number>> = {};
      for (const sub of submissions) {
        scoresMap[sub.id] = {};
        const subScores = await db.select().from(bidScores).where(eq(bidScores.submissionId, sub.id));
        for (const sc of subScores) {
          if (sc.criterionId && sc.rawValue !== null) {
            scoresMap[sub.id][sc.criterionId] = sc.rawValue;
          }
        }
        // Auto-map totalPrice to price criterion and deliveryDays to delivery criterion
        if (sub.totalPrice !== null) {
          const priceCrit = criteria.find(c =>
            c.name.toLowerCase().includes("price") || c.scoringType === "min_ratio"
          );
          if (priceCrit && !scoresMap[sub.id][priceCrit.id]) {
            scoresMap[sub.id][priceCrit.id] = sub.totalPrice;
          }
        }
        if (sub.deliveryDays !== null) {
          const deliveryCrit = criteria.find(c =>
            c.name.toLowerCase().includes("delivery") || c.name.toLowerCase().includes("time")
          );
          if (deliveryCrit && !scoresMap[sub.id][deliveryCrit.id]) {
            scoresMap[sub.id][deliveryCrit.id] = sub.deliveryDays;
          }
        }
      }

      // Build FastAPI payload
      const engineCriteria = criteria.map(c => ({
        column: `crit_${c.id}`,
        weight: c.weight / 100,
        scoring_type: c.scoringType,
        higher_is_better: c.higherIsBetter === 1,
        threshold_value: c.thresholdValue ?? undefined,
      }));

      const bids = submissions.map(sub => {
        const row: Record<string, string | number> = { supplier: sub.supplierName };
        for (const c of criteria) {
          row[`crit_${c.id}`] = scoresMap[sub.id]?.[c.id] ?? 0;
        }
        return row;
      });

      type RankedResult = {
        rank: number;
        supplierName: string;
        totalScore: number;
        technicalScore: number;
        economicScore: number;
        criterionScores: Record<string, number>;
      };

      let rankedResults: RankedResult[] = [];

      try {
        const response = await fetch(`${BID_ENGINE_URL}/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria: engineCriteria, bids }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`FastAPI engine error: ${errText}`);
        }

        const engineResult = await response.json() as {
          ranked: Array<{
            rank: number;
            supplier: string;
            total_score: number;
            criterion_scores: Record<string, number>;
          }>;
        };

        const rfqData = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
        const techWeight = rfqData[0]?.technicalWeight ?? 40;
        const ecoWeight = rfqData[0]?.economicWeight ?? 60;

        rankedResults = engineResult.ranked.map(r => {
          const techCriteria = criteria.filter(c => c.stage === "technical");
          const ecoCriteria = criteria.filter(c => c.stage === "economic");

          const techScore = techCriteria.length > 0
            ? techCriteria.reduce((sum, c) => {
                const score = r.criterion_scores[`crit_${c.id}`] ?? 0;
                return sum + score * (c.weight / 100);
              }, 0) * (techWeight / 100) * 100
            : 0;

          const ecoScore = ecoCriteria.length > 0
            ? ecoCriteria.reduce((sum, c) => {
                const score = r.criterion_scores[`crit_${c.id}`] ?? 0;
                return sum + score * (c.weight / 100);
              }, 0) * (ecoWeight / 100) * 100
            : r.total_score;

          return {
            rank: r.rank,
            supplierName: r.supplier,
            totalScore: r.total_score,
            technicalScore: techScore,
            economicScore: ecoScore,
            criterionScores: r.criterion_scores,
          };
        });
      } catch {
        // Fallback: simple weighted average
        const scored = submissions.map(sub => {
          let totalScore = 0;
          const criterionScores: Record<string, number> = {};
          for (const c of criteria) {
            const rawVal = scoresMap[sub.id]?.[c.id] ?? 0;
            criterionScores[`crit_${c.id}`] = rawVal;
            totalScore += rawVal * (c.weight / 100);
          }
          return { supplier: sub.supplierName, totalScore, criterionScores };
        });
        scored.sort((a, b) => b.totalScore - a.totalScore);
        rankedResults = scored.map((s, i) => ({
          rank: i + 1,
          supplierName: s.supplier,
          totalScore: s.totalScore,
          technicalScore: 0,
          economicScore: s.totalScore,
          criterionScores: s.criterionScores,
        }));
      }

      const winner = rankedResults[0];
      const aiJustification = winner
        ? `Based on the weighted evaluation matrix, ${winner.supplierName} is recommended for award with a total score of ${winner.totalScore.toFixed(1)}/100. ` +
          `This supplier achieved the highest combined score across all ${criteria.length} evaluation criteria. ` +
          `The evaluation was conducted in accordance with the defined scoring methodology.`
        : null;

      const recommendedSubmission = submissions.find(s => s.supplierName === winner?.supplierName);
      await db.insert(evaluationSessions).values({
        rfqId: input.rfqId,
        rankedResults: JSON.stringify(rankedResults),
        recommendedSupplierId: recommendedSubmission?.id ?? null,
        aiJustification,
        status: "completed",
        evaluatedBy: ctx.user?.name ?? ctx.user?.openId ?? "system",
      });

      await db.update(rfqs).set({ status: "evaluation" }).where(eq(rfqs.id, input.rfqId));

      return { rankedResults, aiJustification };
    }),

  getEvaluation: protectedProcedure
    .input(z.object({ rfqId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(evaluationSessions)
        .where(eq(evaluationSessions.rfqId, input.rfqId))
        .orderBy(desc(evaluationSessions.evaluatedAt))
        .limit(1);
      return rows[0] ?? null;
    }),

  awardRFQ: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      supplierId: z.number().int(),
      createOdooPO: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // 1. Mark RFQ and winning bid as awarded in local DB
      await db.update(rfqs).set({ status: "awarded" }).where(eq(rfqs.id, input.rfqId));
      await db.update(bidSubmissions)
        .set({ status: "awarded" })
        .where(eq(bidSubmissions.id, input.supplierId));

      // 2. Fetch all data needed for Odoo PO
      const rfqRows = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
      const rfqData = rfqRows[0];
      const winnerRows = await db.select().from(bidSubmissions)
        .where(eq(bidSubmissions.id, input.supplierId)).limit(1);
      const winner = winnerRows[0];
      const items = await db.select().from(rfqItems).where(eq(rfqItems.rfqId, input.rfqId));

      let odooPOId: number | null = null;
      let odooPOName: string | null = null;
      let odooError: string | null = null;

      // 3. Create Purchase Order in Odoo via XML-RPC (if requested)
      if (input.createOdooPO && rfqData && winner) {
        try {
          // Find or create partner in Odoo by supplier name/email
          let partnerId: number | null = null;
          if (winner.supplierEmail) {
            const partners = await odooSearchRead<{ id: number }>("res.partner", [
              ["email", "=", winner.supplierEmail],
            ], ["id"], { limit: 1 });
            if (partners.length > 0) partnerId = partners[0].id;
          }
          if (!partnerId) {
            const partners = await odooSearchRead<{ id: number }>("res.partner", [
              ["name", "ilike", winner.supplierName],
            ], ["id"], { limit: 1 });
            if (partners.length > 0) partnerId = partners[0].id;
          }
          if (!partnerId) {
            // Create new partner in Odoo
            partnerId = await odooCreate("res.partner", {
              name: winner.supplierName,
              email: winner.supplierEmail ?? "",
              supplier_rank: 1,
              comment: `Auto-created from Golden Team Bid Evaluation — RFQ ${rfqData.rfqNumber}`,
            });
          }

          // Build order lines from RFQ items
          const orderLines = items.length > 0
            ? items.map(item => [0, 0, {
                name: item.description,
                product_qty: item.quantity ?? 1,
                price_unit: item.estimatedPrice ?? 0,
                date_planned: new Date().toISOString().slice(0, 10),
              }])
            : [[0, 0, {
                name: rfqData.title,
                product_qty: 1,
                price_unit: winner.totalPrice ?? 0,
                date_planned: new Date().toISOString().slice(0, 10),
              }]];

          // Create the PO
          odooPOId = await odooCreate("purchase.order", {
            partner_id: partnerId,
            name: `GT-PO-${rfqData.rfqNumber}`,
            notes: `Auto-generated from Golden Team Bid Evaluation.\nRFQ: ${rfqData.rfqNumber}\nAwarded to: ${winner.supplierName}\nCreated by: ${ctx.user?.name ?? "system"}`,
            order_line: orderLines,
          });

          // Fetch the PO name Odoo assigned
          if (odooPOId) {
            const poRows = await odooSearchRead<{ id: number; name: string }>("purchase.order", [
              ["id", "=", odooPOId],
            ], ["id", "name"], { limit: 1 });
            odooPOName = poRows[0]?.name ?? `PO-${odooPOId}`;
          }
        } catch (err) {
          // Non-fatal: log the error but don't block the award
          odooError = err instanceof Error ? err.message : String(err);
          console.error("[awardRFQ] Odoo PO creation failed:", odooError);
        }
      }

      return {
        success: true,
        odooPOId,
        odooPOName,
        odooError,
        odooUrl: odooPOId ? `https://goldenteam.odoo.com/odoo/purchase/${odooPOId}` : null,
      };
    }),

  // ── NEO AI Award Justification Memo ─────────────────────────────────────────
  generateAwardMemo: protectedProcedure
    .input(z.object({
      rfqId: z.number().int(),
      language: z.enum(["en", "ar", "both"]).default("both"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch all data for the memo
      const rfqRows = await db.select().from(rfqs).where(eq(rfqs.id, input.rfqId)).limit(1);
      const rfqData = rfqRows[0];
      if (!rfqData) throw new Error("RFQ not found");

      const criteria = await db.select().from(bidCriteria).where(eq(bidCriteria.rfqId, input.rfqId));
      const submissions = await db.select().from(bidSubmissions)
        .where(eq(bidSubmissions.rfqId, input.rfqId))
        .orderBy(desc(bidSubmissions.submittedAt));
      const evalRows = await db.select().from(evaluationSessions)
        .where(eq(evaluationSessions.rfqId, input.rfqId))
        .orderBy(desc(evaluationSessions.evaluatedAt))
        .limit(1);
      const evalSession = evalRows[0];

      const rankedResults = evalSession?.rankedResults
        ? JSON.parse(evalSession.rankedResults as string) as Array<{
            rank: number; supplierName: string; totalScore: number;
            technicalScore: number; economicScore: number;
          }>
        : [];

      const winner = rankedResults[0];
      const winnerBid = submissions.find(s => s.supplierName === winner?.supplierName);

      // Build structured context for the LLM
      const criteriaList = criteria.map(c =>
        `- ${c.name} (weight: ${c.weight}%, stage: ${c.stage}, type: ${c.scoringType})`
      ).join("\n");

      const rankingTable = rankedResults.map(r =>
        `${r.rank}. ${r.supplierName} — Total: ${r.totalScore.toFixed(1)}/100 | Technical: ${r.technicalScore.toFixed(1)} | Economic: ${r.economicScore.toFixed(1)}`
      ).join("\n");

      const winnerDetails = winnerBid
        ? `Price: ${winnerBid.totalPrice ? `SAR ${winnerBid.totalPrice.toLocaleString()}` : "Not specified"} | Delivery: ${winnerBid.deliveryDays ? `${winnerBid.deliveryDays} days` : "Not specified"}`
        : "";

      const today = new Date().toLocaleDateString("en-SA", { year: "numeric", month: "long", day: "numeric" });
      const preparedBy = ctx.user?.name ?? "Procurement Officer";

      const systemPrompt = `You are a senior procurement officer at Golden Team Trading Services (شركة الفريق الذهبي للخدمات التجارية), a Saudi Arabian enterprise. 
You write formal, professional procurement award recommendation memos in both Arabic and English.
Your memos follow Saudi government procurement best practices and NCAR guidelines.
Always use formal business Arabic (فصحى تجارية) and professional English.
Structure the memo with: header, executive summary, evaluation methodology, ranking table, winner justification, recommendation, and signature block.`;

      const userPrompt = `Generate a formal bid award recommendation memo for the following procurement:

RFQ Number: ${rfqData.rfqNumber}
RFQ Title: ${rfqData.title}
Date: ${today}
Prepared by: ${preparedBy}
Total Bidders: ${submissions.length}

Evaluation Criteria:
${criteriaList}

Technical Weight: ${rfqData.technicalWeight}% | Economic Weight: ${rfqData.economicWeight}%

Ranking Results:
${rankingTable}

Recommended Supplier: ${winner?.supplierName ?? "N/A"}
${winnerDetails}

Language: ${input.language === "both" ? "Write the full memo in BOTH Arabic (first) and English (second), clearly separated" : input.language === "ar" ? "Write in Arabic only" : "Write in English only"}

Format the memo professionally with clear sections, formal letterhead style, and management sign-off block.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const memo = response.choices[0]?.message?.content ?? "";

      return {
        memo,
        rfqNumber: rfqData.rfqNumber,
        rfqTitle: rfqData.title,
        winner: winner?.supplierName ?? null,
        totalBidders: submissions.length,
        generatedAt: new Date(),
        preparedBy,
      };
    }),
});
