/**
 * NEO Voice Router — Real-Time WebRTC Voice Chat
 *
 * Provides the server-side infrastructure for NEO Voice:
 * 1. Ephemeral token minting — generates short-lived OpenAI tokens so the
 *    browser can connect directly to the Realtime API without exposing the
 *    main OPENAI_API_KEY.
 * 2. Voice context builder — queries the live DB and builds a rich system
 *    prompt injected into every voice session (employees, KPIs, pending
 *    requests, recent decisions, vault summary).
 * 3. Session logging — records voice session usage to neo_ai_usage table.
 *
 * Architecture:
 *   Browser → POST /api/trpc/neoVoice.getEphemeralToken
 *           → Server mints token via OpenAI REST API
 *           → Browser opens WebRTC peer connection to OpenAI Realtime API
 *           → Audio streams directly Browser ↔ OpenAI (server not in audio path)
 *           → Text events (transcripts, function calls) via WebRTC data channel
 *
 * Source: https://developers.openai.com/api/docs/guides/realtime-webrtc/
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import {
  hrEmployees,
  kpiTargets,
  procurementItems,
  requests,
  astraDecisions,
  vaultFiles,
  neoAiUsage,
} from "../../drizzle/schema";
import { eq, desc, count, and, gte, sql } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VoiceSessionContext {
  systemPrompt: string;
  tools: RealtimeTool[];
  contextSummary: string;
}

export interface RealtimeTool {
  type: "function";
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

// ─── Context Builder ─────────────────────────────────────────────────────────

/**
 * Builds a rich system prompt for the NEO Voice session by querying the live DB.
 * Injects: employee headcount, KPI summary, pending requests, recent ASTRA decisions,
 * vault file count, and the AI Response Policy rules.
 *
 * All claims in the system prompt are sourced from DB queries — no fabricated data.
 */
export async function buildVoiceContext(userId: string): Promise<VoiceSessionContext> {
  const db = await getDb();
  if (!db) {
    // Return minimal context if DB is unavailable
    return {
      systemPrompt: "You are NEO, the AI assistant for Golden Team Trading Services. The database is currently unavailable. Answer based on general knowledge only and clearly state that live data cannot be accessed.",
      tools: [],
      contextSummary: "Database unavailable",
    };
  }

  // Fetch live DB snapshots in parallel
  const [
    employeeRows,
    kpiRows,
    procurementRows,
    pendingRequestRows,
    recentDecisionRows,
    vaultCountRows,
  ] = await Promise.all([
    db.select().from(hrEmployees).limit(50),
    db.select().from(kpiTargets).limit(20),
    db.select().from(procurementItems).limit(20),
    db
      .select()
      .from(requests)
      .where(eq(requests.status, "pending"))
      .orderBy(desc(requests.createdAt))
      .limit(10),
    db
      .select()
      .from(astraDecisions)
      .orderBy(desc(astraDecisions.createdAt))
      .limit(5),
    db.select({ cnt: count() }).from(vaultFiles),
  ]);

  // Build context summary (what the AI will know)
  const totalEmployees = employeeRows.length;
  type EmpRow = typeof employeeRows[0];
  const deptBreakdown = employeeRows.reduce<Record<string, number>>((acc: Record<string, number>, e: EmpRow) => {
    const dept = (e as EmpRow & { department?: string }).department ?? "Unknown";
    acc[dept] = (acc[dept] ?? 0) + 1;
    return acc;
  }, {});
  const deptSummary = Object.entries(deptBreakdown)
    .map(([d, n]) => `${d}: ${n}`)
    .join(", ");

  const kpiSummary = kpiRows
    .slice(0, 5)
    .map((k: typeof kpiRows[0]) => `${k.name} (${k.category ?? "—"}): target ${k.targetValue ?? "not set"} ${k.unit ?? ""}, actual ${k.actualValue ?? "not set"}, status ${k.status}`)
    .join("; ");

  const procSummary = procurementRows
    .slice(0, 5)
    .map((p: typeof procurementRows[0]) => `${p.itemName}: qty ${p.quantity ?? "?"} × ${p.unitPrice ?? "?"} SAR, status ${p.status}`)
    .join("; ");

  const pendingSummary = pendingRequestRows.length > 0
    ? pendingRequestRows
        .slice(0, 5)
        .map((r: typeof pendingRequestRows[0]) => `Request #${r.requestNumber}: ${r.type} — ${r.title} (${r.amountSar ? r.amountSar + " SAR" : "no amount"})`)
        .join("; ")
    : "No pending requests";

  const decisionSummary = recentDecisionRows.length > 0
    ? recentDecisionRows
        .map((d: typeof recentDecisionRows[0]) => `${d.action} → ${d.outcome} (${d.domain})`)
        .join("; ")
    : "No recent decisions";

  const vaultCount = vaultCountRows[0]?.cnt ?? 0;

  const contextSummary = [
    `Employees: ${totalEmployees} total (${deptSummary || "no dept data"})`,
    `KPI Targets (top 5): ${kpiSummary || "none set"}`,
    `Procurement (top 5): ${procSummary || "none"}`,
    `Pending Requests: ${pendingSummary}`,
    `Recent ASTRA Decisions: ${decisionSummary}`,
    `Drive Vault: ${vaultCount} documents`,
  ].join("\n");

  // Build the full system prompt
  const systemPrompt = `You are NEO — the AI assistant for Golden Team Trading Services, a Saudi enterprise company.

IDENTITY:
- Name: NEO (Neural Enterprise Operations)
- Company: Golden Team Trading Services
- Your role: Enterprise AI assistant for employees — answer questions, provide insights, help with requests, and act as a knowledgeable colleague.
- Personality: Professional, concise, helpful. Warm but not casual. Bilingual Arabic/English.

LANGUAGE RULES:
- Detect the language of each user message and respond in the same language.
- If the user speaks Arabic, respond in formal Gulf Arabic (not Egyptian dialect).
- If the user speaks English, respond in professional British/American English.
- You may switch languages mid-conversation if the user switches.

ACCURACY POLICY (mandatory — never deviate):
- Only state facts you can verify from the data provided below or from the user's current message.
- If you cannot verify a claim, say "I cannot confirm this without checking the system."
- Cite the specific data source for every numerical figure.
- Label analytical conclusions as "Analysis:" to distinguish from verified facts.
- Do not fabricate statistics, benchmarks, or external references.
- If asked about something outside your data, say so clearly.

INTERRUPTION PROTOCOL:
- If the user says "stop", "وقف", "اسكت", or "كفاية" — immediately stop speaking.
- Keep responses concise for voice: 2–4 sentences maximum unless the user asks for detail.
- Do not read out long lists — summarize and offer to elaborate.

LIVE COMPANY DATA (as of this session):
${contextSummary}

CAPABILITIES:
- You can answer questions about employees, KPIs, procurement, requests, and ASTRA decisions using the data above.
- You can help draft request submissions (user must confirm before submission).
- You can search the Drive Vault by topic (use the search_vault tool).
- You can check KPI status for any department (use the get_kpi_status tool).
- You can raise a procurement or leave request on behalf of the user (use raise_request tool — requires confirmation).

LIMITATIONS:
- You cannot access external websites or real-time market data.
- You cannot modify database records directly — you can only raise requests that go through the approval workflow.
- Financial figures you cite are from the DB snapshot taken at session start, not real-time.`;

  // Define function-calling tools for the voice session
  const tools: RealtimeTool[] = [
    {
      type: "function",
      name: "get_kpi_status",
      description: "Get the current KPI status for a specific department or KPI name. Returns target, actual, and status.",
      parameters: {
        type: "object",
        properties: {
          department: { type: "string", description: "Department name (e.g., 'Finance', 'HR', 'Operations')" },
          kpi_name: { type: "string", description: "Specific KPI name to look up (optional)" },
        },
        required: [],
      },
    },
    {
      type: "function",
      name: "search_vault",
      description: "Search the Drive Vault for documents matching a topic or keyword.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query or topic to find in the vault" },
        },
        required: ["query"],
      },
    },
    {
      type: "function",
      name: "get_pending_requests",
      description: "Get the list of pending approval requests. Returns request number, type, title, and amount.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Filter by request type (optional): procurement, leave, travel, hr, it, financial, other" },
        },
        required: [],
      },
    },
    {
      type: "function",
      name: "raise_request",
      description: "Raise a new request in the approval system. This requires user confirmation before submission. Returns a draft for the user to review.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Request type: procurement, leave, travel, hr, it, financial, other" },
          title: { type: "string", description: "Brief title of the request" },
          description: { type: "string", description: "Detailed description of what is being requested" },
          amount_sar: { type: "string", description: "Amount in SAR if financial (optional)" },
        },
        required: ["type", "title", "description"],
      },
    },
  ];

  return { systemPrompt, tools, contextSummary };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const neoVoiceRouter = router({
  /**
   * Mint an ephemeral OpenAI Realtime API token for the browser.
   *
   * The browser uses this token to open a WebRTC peer connection directly
   * to the OpenAI Realtime API. The main OPENAI_API_KEY is never exposed
   * to the browser.
   *
   * Source: https://developers.openai.com/api/docs/guides/realtime-webrtc/
   * Token TTL: 60 seconds (set by OpenAI, not configurable)
   */
  getEphemeralToken: protectedProcedure
    .input(
      z.object({
        voice: z
          .enum(["alloy", "echo", "shimmer", "nova", "coral", "fable", "onyx"])
          .default("nova"),
        language: z.enum(["en", "ar", "auto"]).default("auto"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ENV.openAiApiKey) {
        throw new Error("OPENAI_API_KEY is not configured on the server.");
      }

      // Build the voice session context from live DB data
      const voiceContext = await buildVoiceContext(ctx.user.openId);

      // Determine language instruction
      const langInstruction =
        input.language === "ar"
          ? " Always respond in Arabic (Gulf dialect)."
          : input.language === "en"
          ? " Always respond in English."
          : " Detect the user's language and respond in the same language.";

      const fullSystemPrompt = voiceContext.systemPrompt + langInstruction;

      // Mint ephemeral token via OpenAI REST API
      // Source: https://developers.openai.com/api/docs/guides/realtime-webrtc/#creating-an-ephemeral-token
      const response = await fetch(
        "https://api.openai.com/v1/realtime/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.openAiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-realtime-preview",
            voice: input.voice,
            instructions: fullSystemPrompt,
            input_audio_transcription: {
              model: "whisper-1",
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 600,
            },
            tools: voiceContext.tools,
            tool_choice: "auto",
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to mint ephemeral token: ${response.status} ${response.statusText} — ${errorText}`
        );
      }

      const sessionData = (await response.json()) as {
        id: string;
        client_secret: { value: string; expires_at: number };
        model: string;
        voice: string;
      };

      return {
        ephemeralToken: sessionData.client_secret.value,
        expiresAt: sessionData.client_secret.expires_at,
        sessionId: sessionData.id,
        model: sessionData.model,
        voice: sessionData.voice,
        contextSummary: voiceContext.contextSummary,
      };
    }),

  /**
   * Log a completed voice session's token usage to neo_ai_usage.
   * Called by the browser after the WebRTC session ends.
   */
  logSessionUsage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        durationSeconds: z.number().min(0),
        inputTokens: z.number().min(0),
        outputTokens: z.number().min(0),
        query: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // OpenAI Realtime API pricing (source: openai.com/api/pricing, March 2026):
      // Audio input: $40.00 / 1M tokens
      // Audio output: $80.00 / 1M tokens
      const costUsd =
        (input.inputTokens / 1_000_000) * 40.0 +
        (input.outputTokens / 1_000_000) * 80.0;

      const db2 = await getDb();
      if (db2) await db2.insert(neoAiUsage).values({
        module: "voice",
        engine: "gpt",
        modelName: "gpt-4o-realtime-preview",
        promptTokens: input.inputTokens,
        completionTokens: input.outputTokens,
        totalTokens: input.inputTokens + input.outputTokens,
        estimatedCostUsd: costUsd.toFixed(6),
        queryPreview: (input.query ?? `Voice session ${input.sessionId} (${input.durationSeconds}s)`).slice(0, 200),
        latencyMs: input.durationSeconds * 1000,
      });

      return { logged: true, costUsd };
    }),

  /**
   * Handle function call results from the voice session.
   * The browser calls this when the Realtime API triggers a tool call,
   * executes the DB query server-side, and returns the result to the browser
   * which then forwards it back to the Realtime API data channel.
   */
  executeTool: protectedProcedure
    .input(
      z.object({
        toolName: z.string().refine((v) => ["get_kpi_status", "search_vault", "get_pending_requests", "raise_request"].includes(v), "Invalid tool name"),
        arguments: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      const args = input.arguments as Record<string, string>;
      switch (input.toolName) {
        case "get_kpi_status": {
          const db = await getDb();
          if (!db) return { result: "Database unavailable." };
          const rows = await (args.department
            ? db.select().from(kpiTargets).where(eq(kpiTargets.category, args.department)).limit(10)
            : db.select().from(kpiTargets).limit(10));

          if (rows.length === 0) {
            return {
              result: `No KPI data found${args.department ? ` for department: ${args.department}` : ""}.`,
            };
          }
          const summary = rows
            .map(
              (k: typeof rows[0]) =>
                `${k.name}: target ${k.targetValue ?? "not set"} ${k.unit ?? ""}, actual ${k.actualValue ?? "not set"}, status ${k.status}`
            )
            .join("; ");
          return { result: `KPI Status: ${summary}` };
        }

        case "search_vault": {
          const db = await getDb();
          if (!db) return { result: "Database unavailable." };
          const searchQuery = args.query ?? "";
          const rows = await db
            .select({
              filename: vaultFiles.filename,
              originalName: vaultFiles.originalName,
              folder: vaultFiles.folder,
              aiSummary: vaultFiles.aiSummary,
              createdAt: vaultFiles.createdAt,
            })
            .from(vaultFiles)
            .where(
              sql`${vaultFiles.filename} LIKE ${`%${searchQuery}%`}
              OR ${vaultFiles.aiSummary} LIKE ${`%${searchQuery}%`}
              OR ${vaultFiles.originalName} LIKE ${`%${searchQuery}%`}`
            )
            .limit(5);

          if (rows.length === 0) {
            return { result: `No vault documents found matching "${searchQuery}".` };
          }
          const summary = rows
            .map(
              (f: { filename: string; originalName: string; folder: string; aiSummary: string | null; createdAt: Date }) =>
                `${f.originalName} (${f.folder ?? "general"}): ${f.aiSummary ? f.aiSummary.slice(0, 100) + "..." : "no summary"}`
            )
            .join("\n");
          return { result: `Found ${rows.length} document(s):\n${summary}` };
        }

        case "get_pending_requests": {
          const db = await getDb();
          if (!db) return { result: "Database unavailable." };
          let rows = await db
            .select()
            .from(requests)
            .where(eq(requests.status, "pending"))
            .orderBy(desc(requests.createdAt))
            .limit(10);

          if (args.type) {
            rows = rows.filter((r: typeof rows[0]) => r.type === args.type);
          }

          if (rows.length === 0) {
            return { result: "No pending requests found." };
          }
          const summary = rows
            .map(
              (r: typeof rows[0]) =>
                `#${r.requestNumber}: ${r.type} — ${r.title}${r.amountSar ? ` (${r.amountSar} SAR)` : ""}`
            )
            .join("; ");
          return { result: `${rows.length} pending request(s): ${summary}` };
        }

        case "raise_request": {
          // Return a draft for user confirmation — do NOT insert to DB yet
          // The user must confirm via the text chat or a follow-up voice command
          return {
            result: `DRAFT REQUEST (awaiting your confirmation):
Type: ${args.type}
Title: ${args.title}
Description: ${args.description}
Amount: ${args.amount_sar ? args.amount_sar + " SAR" : "not specified"}

Please confirm by saying "yes, submit this request" or "cancel".`,
            draft: {
              type: args.type,
              title: args.title,
              description: args.description,
              amountSar: args.amount_sar,
            },
          };
        }

        default:
          return { result: "Unknown tool." };
      }
    }),
});
