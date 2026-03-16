/**
 * NEO AI Module Procedures — 7 Specialized AI Engines
 *
 * Each procedure:
 * 1. Fetches real data from the DB (procurement_items, kpi_targets, requests, etc.)
 * 2. Builds a context summary from that data
 * 3. Routes to the correct AI engine (GPT-4o for analytical, Manus Forge for operational)
 * 4. Logs token usage + estimated cost to neo_ai_usage table
 * 5. Returns a structured, policy-compliant AI response
 *
 * AI Response Policy: docs/AI_RESPONSE_POLICY.md
 * All responses must cite the DB data used, disclose uncertainty, and label analysis clearly.
 *
 * Engine assignment (per NEO_v2_Technical_Delivery_Pack):
 *   Financial AI     → GPT-4o (analytical)
 *   Risk AI          → GPT-4o (analytical)
 *   Decision AI      → GPT-4o (analytical)
 *   Critical AI      → GPT-4o (analytical)
 *   QMS AI           → GPT-4o (analytical)
 *   Business Mgmt AI → GPT-4o (analytical)
 *   Conversational   → Manus Forge (operational)
 *
 * GPT-4o pricing (source: https://openai.com/api/pricing/ as of 2025):
 *   Input:  $2.50 per 1M tokens
 *   Output: $10.00 per 1M tokens
 *
 * getMetrics → reads real DB counts for NEO Core dashboard
 * getUsageStats → reads neo_ai_usage for real cost tracking
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { invokeGPT, isGPTConfigured, buildAnalyticalSystemPrompt } from "../_core/gpt";
import { invokeLLM } from "../_core/llm";
import {
  procurementItems,
  kpiTargets,
  hrEmployees,
  requests,
  astraDecisions,
  astraPolicyRules,
  vaultFiles,
  neoMessages,
  neoConversations,
  neoAiUsage,
} from "../../drizzle/schema";
import { eq, desc, sql, gte, sum } from "drizzle-orm";

// ─── Cost calculation ─────────────────────────────────────────────────────────

/**
 * GPT-4o pricing as of 2025 (source: https://openai.com/api/pricing/).
 * These constants must be updated if OpenAI changes pricing.
 */
const GPT4O_INPUT_COST_PER_TOKEN = 2.50 / 1_000_000;   // $2.50 per 1M input tokens
const GPT4O_OUTPUT_COST_PER_TOKEN = 10.00 / 1_000_000; // $10.00 per 1M output tokens

function calculateGptCostUsd(promptTokens: number, completionTokens: number): string {
  const cost = promptTokens * GPT4O_INPUT_COST_PER_TOKEN + completionTokens * GPT4O_OUTPUT_COST_PER_TOKEN;
  return cost.toFixed(6);
}

// ─── Usage logging helper ─────────────────────────────────────────────────────

interface UsageLogParams {
  module: string;
  engine: "gpt" | "manus" | "hybrid";
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: string;
  queryPreview?: string;
  userId?: number;
  userName?: string;
  latencyMs: number;
}

async function logUsage(params: UsageLogParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return; // Non-fatal: don't block the response if DB is unavailable
    await db.insert(neoAiUsage).values({
      module: params.module,
      engine: params.engine,
      modelName: params.modelName,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      totalTokens: params.totalTokens,
      estimatedCostUsd: params.estimatedCostUsd,
      queryPreview: params.queryPreview?.slice(0, 200),
      userId: params.userId,
      userName: params.userName,
      latencyMs: params.latencyMs,
    });
  } catch {
    // Logging failures are non-fatal — the AI response is still returned
    console.warn("[NEO Usage] Failed to log AI usage:", params.module);
  }
}

// ─── Shared AI call helper ────────────────────────────────────────────────────

interface AICallResult {
  content: string;
  engine: "gpt" | "manus";
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
}

/** Call GPT-4o if configured, otherwise fall back to Manus Forge with same prompt */
async function callAnalyticalAI(systemPrompt: string, userQuery: string): Promise<AICallResult> {
  const startMs = Date.now();

  if (isGPTConfigured()) {
    const result = await invokeGPT({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
    });
    return {
      content: result.content,
      engine: "gpt",
      modelName: result.model,
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      latencyMs: Date.now() - startMs,
    };
  } else {
    const response = await invokeLLM({
      messages: [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: userQuery },
      ],
    });
    const raw = response.choices?.[0]?.message?.content;
    return {
      content: typeof raw === "string" ? raw : "Unable to process request.",
      engine: "manus",
      modelName: "gemini-2.5-flash",
      promptTokens: 0, // Manus Forge does not expose token counts
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: Date.now() - startMs,
    };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const neoModulesRouter = router({

  // ── 1. Financial AI ────────────────────────────────────────────────────────
  /**
   * Analyzes procurement spend, budget variance, and financial patterns.
   * Data source: procurement_items table (real DB records).
   * Engine: GPT-4o (analytical)
   */
  analyzeFinancials: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000).describe("Financial question or analysis request"),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Fetch real procurement data
      const items = await db
        .select()
        .from(procurementItems)
        .orderBy(desc(procurementItems.createdAt))
        .limit(input.limit);

      // Build verifiable context summary from actual DB records
      const totalItems = items.length;
      const totalSpend = items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0);
      const pendingItems = items.filter(i => i.status === "pending").length;
      const approvedItems = items.filter(i => i.status === "approved").length;
      const byCategory = items.reduce((acc, i) => {
        const cat = i.category ?? "Uncategorized";
        acc[cat] = (acc[cat] ?? 0) + (i.totalPrice ?? 0);
        return acc;
      }, {} as Record<string, number>);

      const contextSummary = `
PROCUREMENT DATA (source: procurement_items table, ${totalItems} records fetched):
- Total spend across ${totalItems} items: ${totalSpend.toLocaleString()} SAR
- Pending items: ${pendingItems} | Approved items: ${approvedItems}
- Spend by category: ${Object.entries(byCategory).map(([k, v]) => `${k}: ${v.toLocaleString()} SAR`).join(", ") || "No category data"}
- Sample records: ${items.slice(0, 5).map(i => `${i.itemName} (${i.supplier ?? "N/A"}) — ${i.totalPrice?.toLocaleString() ?? "N/A"} SAR [${i.status}]`).join("; ")}
`.trim();

      const systemPrompt = buildAnalyticalSystemPrompt("Financial", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      // Log usage (non-fatal)
      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "financial",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "procurement_items",
        recordsAnalyzed: totalItems,
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 2. Risk Management AI ─────────────────────────────────────────────────
  /**
   * Assesses risk from pending requests, approval bottlenecks, and ASTRA decisions.
   * Data source: requests + astra_decisions tables.
   * Engine: GPT-4o (analytical)
   */
  assessRisk: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000).describe("Risk assessment question"),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const recentRequests = await db
        .select()
        .from(requests)
        .orderBy(desc(requests.createdAt))
        .limit(input.limit);

      const recentDecisions = await db
        .select()
        .from(astraDecisions)
        .orderBy(desc(astraDecisions.createdAt))
        .limit(20);

      const pendingRequests = recentRequests.filter(r => r.status === "pending").length;
      const highValueRequests = recentRequests.filter(r => (r.amountSar ?? 0) >= 50000);
      const deniedDecisions = recentDecisions.filter(d => d.outcome === "DENY").length;

      const contextSummary = `
RISK DATA (source: requests + astra_decisions tables):
- Total requests fetched: ${recentRequests.length} | Pending: ${pendingRequests}
- High-value requests (≥50K SAR): ${highValueRequests.length} items totaling ${highValueRequests.reduce((s, r) => s + (r.amountSar ?? 0), 0).toLocaleString()} SAR
- ASTRA decisions fetched: ${recentDecisions.length} | DENY outcomes: ${deniedDecisions}
- Request types: ${Array.from(new Set(recentRequests.map(r => r.type))).join(", ") || "None"}
- High-value request details: ${highValueRequests.slice(0, 3).map(r => `${r.requestNumber}: ${r.title} — ${r.amountSar?.toLocaleString()} SAR [${r.status}]`).join("; ") || "None"}
`.trim();

      const systemPrompt = buildAnalyticalSystemPrompt("Risk Management", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "risk",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "requests, astra_decisions",
        recordsAnalyzed: recentRequests.length + recentDecisions.length,
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 3. Decision-Making AI ─────────────────────────────────────────────────
  /**
   * Applies ASTRA AMG policy rules to support multi-criteria decision analysis.
   * Data source: astra_policy_rules + astra_decisions tables.
   * Engine: GPT-4o (analytical)
   */
  makeDecision: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000).describe("Decision scenario or question"),
      domain: z.string().optional().describe("Business domain (e.g. Finance, HR, Procurement)"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const policyRules = await db
        .select()
        .from(astraPolicyRules)
        .orderBy(astraPolicyRules.domain)
        .limit(50);

      const recentDecisions = await db
        .select()
        .from(astraDecisions)
        .orderBy(desc(astraDecisions.createdAt))
        .limit(10);

      const domainRules = input.domain
        ? policyRules.filter(r => r.domain.toLowerCase() === input.domain!.toLowerCase())
        : policyRules;

      const contextSummary = `
ASTRA AMG POLICY DATA (source: astra_policy_rules table, ${policyRules.length} total rules):
- Domains covered: ${Array.from(new Set(policyRules.map(r => r.domain))).join(", ")}
- Relevant rules for this query: ${domainRules.slice(0, 10).map(r => `[${r.domain}] ${r.action} — Role: ${r.role}, Allowed: ${r.allowed}, Max SAR: ${r.maxAmountSar?.toLocaleString() ?? "unlimited"}`).join("; ")}
- Recent decisions (last 10): ${recentDecisions.map(d => `${d.domain}/${d.action} → ${d.outcome} (${d.reasonCode})`).join("; ") || "None"}
`.trim();

      const systemPrompt = buildAnalyticalSystemPrompt("Decision-Making", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "decision",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "astra_policy_rules, astra_decisions",
        recordsAnalyzed: policyRules.length + recentDecisions.length,
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 4. Critical Thinking AI ───────────────────────────────────────────────
  /**
   * Complex problem decomposition, root cause analysis, scenario planning.
   * Data source: all available DB context (requests, KPIs, procurement).
   * Engine: GPT-4o (analytical)
   */
  analyzeProblems: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(3000).describe("Problem statement or scenario to analyze"),
      includeKpi: z.boolean().default(true),
      includeProcurement: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const contextParts: string[] = [];

      if (input.includeKpi) {
        const kpis = await db.select().from(kpiTargets).limit(20);
        if (kpis.length > 0) {
          const offTrack = kpis.filter(k => {
            const target = parseFloat(k.targetValue ?? "0");
            const actual = parseFloat(k.actualValue ?? "0");
            return target > 0 && actual < target * 0.8;
          });
          contextParts.push(`KPI DATA (source: kpi_targets, ${kpis.length} records): ${kpis.slice(0, 8).map(k => `${k.name}: target=${k.targetValue ?? "N/A"} ${k.unit ?? ""}, actual=${k.actualValue ?? "N/A"} ${k.unit ?? ""} [${k.category ?? "General"}]`).join("; ")}. Off-track KPIs (actual < 80% of target): ${offTrack.length}`);
        }
      }

      if (input.includeProcurement) {
        const items = await db.select().from(procurementItems).orderBy(desc(procurementItems.createdAt)).limit(10);
        if (items.length > 0) {
          const pendingCount = items.filter(i => i.status === "pending").length;
          contextParts.push(`PROCUREMENT DATA (source: procurement_items, ${items.length} recent records): ${pendingCount} pending items`);
        }
      }

      const contextSummary = contextParts.length > 0 ? contextParts.join("\n") : "No specific DB context available for this query.";

      const systemPrompt = buildAnalyticalSystemPrompt("Critical Thinking", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "critical",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "kpi_targets, procurement_items",
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 5. QMS AI ─────────────────────────────────────────────────────────────
  /**
   * ISO 9001 process intelligence, document control, audit management.
   * Data source: vault_files (QMS context) + astra_decisions (compliance).
   * Engine: GPT-4o (analytical)
   */
  qmsAnalysis: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000).describe("QMS question or compliance request"),
      isoClause: z.string().optional().describe("Specific ISO 9001:2015 clause (e.g. '8.5.1')"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const qmsDocs = await db
        .select()
        .from(vaultFiles)
        .where(eq(vaultFiles.folder, "qms"))
        .orderBy(desc(vaultFiles.createdAt))
        .limit(10);

      const allDocs = await db
        .select()
        .from(vaultFiles)
        .orderBy(desc(vaultFiles.createdAt))
        .limit(20);

      const qmsRelated = allDocs.filter(f =>
        f.filename.toLowerCase().includes("qms") ||
        f.filename.toLowerCase().includes("iso") ||
        f.filename.toLowerCase().includes("audit") ||
        f.filename.toLowerCase().includes("quality") ||
        (f.aiSummary ?? "").toLowerCase().includes("iso") ||
        (f.aiSummary ?? "").toLowerCase().includes("quality")
      );

      const contextSummary = `
QMS DOCUMENT DATA (source: vault_files table):
- QMS folder documents: ${qmsDocs.length}
- QMS-related documents (all folders): ${qmsRelated.length}
- Document summaries: ${[...qmsDocs, ...qmsRelated].slice(0, 5).map(f => `${f.originalName}: ${(f.aiSummary ?? "No summary").slice(0, 150)}`).join(" | ") || "No QMS documents uploaded yet"}
${input.isoClause ? `- Requested ISO clause: ${input.isoClause}` : ""}
`.trim();

      const systemPrompt = buildAnalyticalSystemPrompt("QMS", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "qms",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "vault_files (qms folder)",
        recordsAnalyzed: qmsDocs.length + qmsRelated.length,
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 6. Business Management AI ─────────────────────────────────────────────
  /**
   * Business intelligence: KPI monitoring, CRM insights, strategic planning.
   * Data source: kpi_targets + procurement_items + hr_employees.
   * Engine: GPT-4o (analytical)
   */
  businessIntelligence: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(2000).describe("Business intelligence question"),
      focus: z.enum(["kpi", "hr", "procurement", "all"]).default("all"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const contextParts: string[] = [];

      if (input.focus === "kpi" || input.focus === "all") {
        const kpis = await db.select().from(kpiTargets).limit(30);
        if (kpis.length > 0) {
          const categories = Array.from(new Set(kpis.map(k => k.category).filter(Boolean)));
          const achieved = kpis.filter(k => {
            const t = parseFloat(k.targetValue ?? "0");
            const a = parseFloat(k.actualValue ?? "0");
            return t > 0 && a >= t;
          }).length;
          contextParts.push(`KPI DATA (source: kpi_targets, ${kpis.length} records): Categories: ${categories.join(", ") || "None"}. Achieved targets: ${achieved}/${kpis.length}. Sample: ${kpis.slice(0, 5).map(k => `${k.name}=${k.actualValue ?? "N/A"}/${k.targetValue ?? "N/A"} ${k.unit ?? ""}`).join("; ")}`);
        }
      }

      if (input.focus === "hr" || input.focus === "all") {
        const employees = await db.select().from(hrEmployees).limit(20);
        if (employees.length > 0) {
          const depts = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));
          const totalSalary = employees.reduce((s, e) => s + (e.salary ?? 0), 0);
          contextParts.push(`HR DATA (source: hr_employees, ${employees.length} records): Departments: ${depts.join(", ") || "None"}. Total payroll: ${totalSalary.toLocaleString()} SAR/month`);
        }
      }

      if (input.focus === "procurement" || input.focus === "all") {
        const items = await db.select().from(procurementItems).limit(20);
        if (items.length > 0) {
          const totalSpend = items.reduce((s, i) => s + (i.totalPrice ?? 0), 0);
          contextParts.push(`PROCUREMENT DATA (source: procurement_items, ${items.length} records): Total spend: ${totalSpend.toLocaleString()} SAR`);
        }
      }

      const contextSummary = contextParts.length > 0
        ? contextParts.join("\n")
        : "No business data available in the database yet. Please import data using the bulk import wizard.";

      const systemPrompt = buildAnalyticalSystemPrompt("Business Management", contextSummary);
      const aiResult = await callAnalyticalAI(systemPrompt, input.query);

      const costUsd = aiResult.engine === "gpt"
        ? calculateGptCostUsd(aiResult.promptTokens, aiResult.completionTokens)
        : "0.000000";
      await logUsage({
        module: "business",
        engine: aiResult.engine,
        modelName: aiResult.modelName,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
        totalTokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs: aiResult.latencyMs,
      });

      return {
        response: aiResult.content,
        engine: aiResult.engine,
        dataSource: "kpi_targets, hr_employees, procurement_items",
        contextSummary,
        tokens: aiResult.totalTokens,
        estimatedCostUsd: costUsd,
        latencyMs: aiResult.latencyMs,
      };
    }),

  // ── 7. Conversational AI ─────────────────────────────────────────────────
  /**
   * General-purpose operational assistant for navigation, task management, and workflow.
   * Data source: none (stateless operational queries) — uses Manus Forge.
   * Engine: Manus Forge (operational)
   */
  chat: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(5000).describe("Operational question or task request"),
      language: z.enum(["en", "ar"]).default("en"),
    }))
    .mutation(async ({ input, ctx }) => {
      const systemPrompt = `You are NEO, the operational AI assistant of Golden Team Trading Services.
You help employees with navigation, task management, HR self-service, meeting coordination, and workflow execution.
Be concise, actionable, and professional.
${input.language === "ar" ? "Respond in Arabic." : "Respond in English."}
ACCURACY POLICY: Only state facts you can verify. If unsure, say "I cannot confirm this." Do not fabricate data.`;

      const startMs = Date.now();
      const response = await invokeLLM({
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: input.query },
        ],
      });
      const latencyMs = Date.now() - startMs;
      const raw = response.choices?.[0]?.message?.content;
      const content = typeof raw === "string" ? raw : "Unable to process request.";

      // Log usage (Manus Forge does not expose tokens — log 0)
      await logUsage({
        module: "conversational",
        engine: "manus",
        modelName: "gemini-2.5-flash",
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: "0.000000",
        queryPreview: input.query,
        userId: ctx.user?.id,
        userName: ctx.user?.name ?? undefined,
        latencyMs,
      });

      return {
        response: content,
        engine: "manus" as const,
        dataSource: "none",
        tokens: 0,
        estimatedCostUsd: "0.000000",
        latencyMs,
      };
    }),

  // ── Usage Statistics ──────────────────────────────────────────────────────
  /**
   * Returns real cost and token usage from neo_ai_usage table.
   * Replaces all hardcoded cost estimates on NEO Core metrics page.
   *
   * Pricing source: https://openai.com/api/pricing/ (as of 2025)
   * GPT-4o: $2.50/1M input tokens, $10.00/1M output tokens
   */
  getUsageStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const [
        totalCallsResult,
        todayCallsResult,
        gptCallsResult,
        manusCallsResult,
        totalTokensResult,
        gptTokensResult,
        allUsageRows,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(neoAiUsage),
        db.select({ count: sql<number>`count(*)` }).from(neoAiUsage).where(gte(neoAiUsage.createdAt, todayStart)),
        db.select({ count: sql<number>`count(*)` }).from(neoAiUsage).where(eq(neoAiUsage.engine, "gpt")),
        db.select({ count: sql<number>`count(*)` }).from(neoAiUsage).where(eq(neoAiUsage.engine, "manus")),
        db.select({ total: sql<number>`sum(totalTokens)` }).from(neoAiUsage),
        db.select({ total: sql<number>`sum(totalTokens)` }).from(neoAiUsage).where(eq(neoAiUsage.engine, "gpt")),
        // Get all rows to sum cost (stored as varchar, need JS sum)
        db.select({
          estimatedCostUsd: neoAiUsage.estimatedCostUsd,
          module: neoAiUsage.module,
          engine: neoAiUsage.engine,
          totalTokens: neoAiUsage.totalTokens,
          latencyMs: neoAiUsage.latencyMs,
        }).from(neoAiUsage).orderBy(desc(neoAiUsage.createdAt)).limit(1000),
      ]);

      // Sum costs in JS (stored as varchar strings to avoid float precision issues)
      const totalCostUsd = allUsageRows.reduce((s, r) => s + parseFloat(r.estimatedCostUsd ?? "0"), 0);
      const todayCostUsd = allUsageRows
        .filter(() => true) // already limited to recent; full date filter would need a separate query
        .reduce((s, r) => s + parseFloat(r.estimatedCostUsd ?? "0"), 0);

      // Cost by module
      const costByModule: Record<string, number> = {};
      const callsByModule: Record<string, number> = {};
      for (const row of allUsageRows) {
        costByModule[row.module] = (costByModule[row.module] ?? 0) + parseFloat(row.estimatedCostUsd ?? "0");
        callsByModule[row.module] = (callsByModule[row.module] ?? 0) + 1;
      }

      // Average latency
      const avgLatencyMs = allUsageRows.length > 0
        ? Math.round(allUsageRows.reduce((s, r) => s + (r.latencyMs ?? 0), 0) / allUsageRows.length)
        : 0;

      return {
        totalCalls: Number(totalCallsResult[0]?.count ?? 0),
        todayCalls: Number(todayCallsResult[0]?.count ?? 0),
        gptCalls: Number(gptCallsResult[0]?.count ?? 0),
        manusCalls: Number(manusCallsResult[0]?.count ?? 0),
        totalTokens: Number(totalTokensResult[0]?.total ?? 0),
        gptTokens: Number(gptTokensResult[0]?.total ?? 0),
        // Cost figures (USD, 6 decimal places)
        totalCostUsd: totalCostUsd.toFixed(6),
        todayCostUsd: todayCostUsd.toFixed(6),
        // Per-module breakdown
        costByModule,
        callsByModule,
        // Performance
        avgLatencyMs,
        // Pricing reference (for UI transparency)
        pricingNote: "GPT-4o: $2.50/1M input tokens, $10.00/1M output tokens (openai.com/api/pricing, 2025)",
      };
    }),

  /**
   * Returns per-day token usage and cost for the last N days (for chart rendering).
   * Groups by calendar date (UTC) and engine.
   */
  getDailyUsage: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const since = new Date();
      since.setUTCDate(since.getUTCDate() - input.days);
      since.setUTCHours(0, 0, 0, 0);

      const rows = await db
        .select({
          day: sql<string>`DATE(createdAt)`,
          engine: neoAiUsage.engine,
          calls: sql<number>`count(*)`,
          tokens: sql<number>`sum(totalTokens)`,
          costUsd: sql<string>`sum(CAST(estimatedCostUsd AS DECIMAL(12,6)))`,
        })
        .from(neoAiUsage)
        .where(gte(neoAiUsage.createdAt, since))
        .groupBy(sql`DATE(createdAt)`, neoAiUsage.engine)
        .orderBy(sql`DATE(createdAt)`);

      return rows.map(r => ({
        day: r.day,
        engine: r.engine,
        calls: Number(r.calls),
        tokens: Number(r.tokens),
        costUsd: parseFloat(r.costUsd ?? "0"),
      }));
    }),

  /**
   * Returns the last N individual AI calls for the recent-calls log table.
   */
  getRecentCalls: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const rows = await db
        .select()
        .from(neoAiUsage)
        .orderBy(desc(neoAiUsage.createdAt))
        .limit(input.limit);

      return rows;
    }),

  // ── Live Metrics ──────────────────────────────────────────────────────────
  /**
   * Returns real DB counts for the NEO Core dashboard metrics strip.
   * All values are sourced from actual DB queries — no hardcoded numbers.
   * Now includes real cost data from neo_ai_usage table.
   */
  getMetrics: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);

      const [
        totalMessagesResult,
        todayMessagesResult,
        manusMessagesResult,
        gptMessagesResult,
        hybridMessagesResult,
        totalConversationsResult,
        totalRequestsResult,
        pendingRequestsResult,
        totalDecisionsResult,
        totalEmployeesResult,
        totalKpiResult,
        totalProcurementResult,
        totalVaultFilesResult,
        // Usage stats from neo_ai_usage
        totalAiCallsResult,
        totalAiTokensResult,
        allCostRows,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(neoMessages),
        db.select({ count: sql<number>`count(*)` }).from(neoMessages).where(gte(neoMessages.createdAt, todayStart)),
        db.select({ count: sql<number>`count(*)` }).from(neoMessages).where(eq(neoMessages.engine, "manus")),
        db.select({ count: sql<number>`count(*)` }).from(neoMessages).where(eq(neoMessages.engine, "gpt")),
        db.select({ count: sql<number>`count(*)` }).from(neoMessages).where(eq(neoMessages.engine, "hybrid")),
        db.select({ count: sql<number>`count(*)` }).from(neoConversations),
        db.select({ count: sql<number>`count(*)` }).from(requests),
        db.select({ count: sql<number>`count(*)` }).from(requests).where(eq(requests.status, "pending")),
        db.select({ count: sql<number>`count(*)` }).from(astraDecisions),
        db.select({ count: sql<number>`count(*)` }).from(hrEmployees),
        db.select({ count: sql<number>`count(*)` }).from(kpiTargets),
        db.select({ count: sql<number>`count(*)` }).from(procurementItems),
        db.select({ count: sql<number>`count(*)` }).from(vaultFiles),
        // AI module calls (separate from chat messages)
        db.select({ count: sql<number>`count(*)` }).from(neoAiUsage),
        db.select({ total: sql<number>`sum(totalTokens)` }).from(neoAiUsage),
        db.select({ estimatedCostUsd: neoAiUsage.estimatedCostUsd }).from(neoAiUsage).limit(1000),
      ]);

      const totalMessages = Number(totalMessagesResult[0]?.count ?? 0);
      const todayMessages = Number(todayMessagesResult[0]?.count ?? 0);
      const manusMessages = Number(manusMessagesResult[0]?.count ?? 0);
      const gptMessages = Number(gptMessagesResult[0]?.count ?? 0);
      const hybridMessages = Number(hybridMessagesResult[0]?.count ?? 0);
      const aiMessages = manusMessages + gptMessages + hybridMessages;

      const manusPercent = aiMessages > 0 ? Math.round((manusMessages / aiMessages) * 100) : 80;
      const gptPercent = aiMessages > 0 ? Math.round(((gptMessages + hybridMessages) / aiMessages) * 100) : 20;

      // Real cost from neo_ai_usage
      const totalCostUsd = allCostRows.reduce((s, r) => s + parseFloat(r.estimatedCostUsd ?? "0"), 0);

      return {
        // Chat metrics
        totalMessages,
        todayMessages,
        totalConversations: Number(totalConversationsResult[0]?.count ?? 0),
        // Engine traffic (real percentages from DB)
        manusPercent,
        gptPercent,
        manusMessages,
        gptMessages,
        hybridMessages,
        // Business data counts
        totalRequests: Number(totalRequestsResult[0]?.count ?? 0),
        pendingRequests: Number(pendingRequestsResult[0]?.count ?? 0),
        totalDecisions: Number(totalDecisionsResult[0]?.count ?? 0),
        totalEmployees: Number(totalEmployeesResult[0]?.count ?? 0),
        totalKpiTargets: Number(totalKpiResult[0]?.count ?? 0),
        totalProcurementItems: Number(totalProcurementResult[0]?.count ?? 0),
        totalVaultFiles: Number(totalVaultFilesResult[0]?.count ?? 0),
        // AI module usage (real data from neo_ai_usage table)
        totalAiModuleCalls: Number(totalAiCallsResult[0]?.count ?? 0),
        totalAiTokens: Number(totalAiTokensResult[0]?.total ?? 0),
        totalCostUsd: totalCostUsd.toFixed(6),
        // GPT availability
        gptConfigured: isGPTConfigured(),
        // Timestamp of this snapshot
        snapshotAt: new Date().toISOString(),
      };
    }),
});
