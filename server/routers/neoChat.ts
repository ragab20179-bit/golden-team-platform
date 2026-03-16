/**
 * NEO Chat/Intercom Router — M1 of Phase 2
 *
 * Provides tRPC procedures for the unified NEO chat workspace:
 * - Conversation management (create, list, archive, delete)
 * - Message sending with AI routing (Manus/GPT/Hybrid)
 * - Message history retrieval
 * - AI routing engine with scoring algorithm from NEO_v2_Technical_Delivery_Pack
 *
 * DUAL AI ENGINE (real integration):
 *   - Manus (invokeLLM): gemini-2.5-flash via Manus Forge — operational tasks, 80% of traffic
 *   - GPT-4o (invokeGPT): OpenAI GPT-4o — analytical, financial, engineering tasks, 20% of traffic
 *   - Hybrid: calls GPT-4o with combined operational+analytical system prompt
 *
 * AI Response Policy: docs/AI_RESPONSE_POLICY.md
 * All AI responses must be verifiable, cite sources, and disclose uncertainty.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { neoConversations, neoMessages } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { invokeGPT, isGPTConfigured, buildAnalyticalSystemPrompt } from "../_core/gpt";
import { TRPCError } from "@trpc/server";

// ─── AI Routing Engine ────────────────────────────────────────────────────────

const SIMPLE_ACTION_WORDS = [
  "show", "list", "open", "status", "send", "schedule", "create", "add",
  "update", "delete", "get", "fetch", "display", "find", "search",
  "عرض", "قائمة", "افتح", "حالة", "أرسل", "جدول", "أنشئ", "أضف",
];

const ANALYTICAL_WORDS = [
  "analyze", "compare", "evaluate", "recommend", "why", "what-if", "feasibility",
  "optimize", "assess", "forecast", "predict", "risk", "impact", "strategy",
  "حلل", "قارن", "قيّم", "أوصي", "لماذا", "جدوى", "تحسين", "تقييم", "توقع",
];

const ENGINEERING_WORDS = [
  "structural", "mechanical", "electrical", "civil", "design", "specification",
  "drawing", "calculation", "load", "capacity", "material", "construction",
  "هيكلي", "ميكانيكي", "كهربائي", "مدني", "تصميم", "مواصفات", "رسم", "حساب",
];

const FINANCE_WORDS = [
  "invoice", "payment", "budget", "cost", "expense", "revenue", "profit",
  "financial", "accounting", "payroll", "tax", "vat", "sar", "amount",
  "فاتورة", "دفع", "ميزانية", "تكلفة", "مصروف", "إيراد", "ربح", "محاسبة", "رواتب",
];

const MEETING_OP_WORDS = [
  "meeting", "transcript", "minutes", "agenda", "attendees", "schedule meeting",
  "اجتماع", "محضر", "جدول أعمال", "حضور",
];

const INTERNAL_MAIL_WORDS = [
  "notify", "alert", "message to", "inform", "tell", "forward",
  "أبلغ", "نبّه", "رسالة إلى", "أعلم",
];

export type EngineChoice = "manus" | "gpt" | "hybrid";

export interface RoutingDecision {
  engine: EngineChoice;
  reason: string;
  confidence: number;
  complexityScore: number;
  riskScore: number;
  breakdown: {
    manusScore: number;
    gptScore: number;
    hybridBoost: number;
    keywordHits: string[];
  };
}

export function routeMessage(messageText: string, requiresApproval = false, financialAmount = 0): RoutingDecision {
  let manusScore = 0;
  let gptScore = 0;
  let hybridBoost = 0;
  const keywordHits: string[] = [];

  const text = messageText.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // 1. Intent detection
  for (const w of SIMPLE_ACTION_WORDS) {
    if (text.includes(w)) { manusScore += 5; keywordHits.push(w); break; }
  }
  for (const w of INTERNAL_MAIL_WORDS) {
    if (text.includes(w)) { manusScore += 10; keywordHits.push(w); break; }
  }
  for (const w of MEETING_OP_WORDS) {
    if (text.includes(w)) { manusScore += 10; keywordHits.push(w); break; }
  }
  for (const w of ANALYTICAL_WORDS) {
    if (text.includes(w)) { gptScore += 20; keywordHits.push(w); break; }
  }
  for (const w of ENGINEERING_WORDS) {
    if (text.includes(w)) { gptScore += 25; keywordHits.push(w); break; }
  }
  for (const w of FINANCE_WORDS) {
    if (text.includes(w)) { gptScore += 25; keywordHits.push(w); break; }
  }

  // 2. Complexity from word count
  if (wordCount > 35) gptScore += 20;
  else if (wordCount > 15) gptScore += 10;
  else if (wordCount < 6) manusScore += 10;

  // 3. Risk and approval
  if (requiresApproval) hybridBoost += 15;
  if (financialAmount >= 50000) hybridBoost += 15;
  if (financialAmount >= 10000) gptScore += 10;

  // 4. Hybrid detection: if both operational + analytical signals present
  if (manusScore >= 10 && gptScore >= 20) hybridBoost += 20;

  // 5. Final selection
  const complexityScore = Math.min(100, wordCount * 2 + gptScore);
  const riskScore = Math.min(100, (requiresApproval ? 40 : 0) + (financialAmount > 0 ? Math.min(60, financialAmount / 1000) : 0));

  let engine: EngineChoice;
  let reason: string;
  let confidence: number;

  if (hybridBoost >= 25 && manusScore >= 10 && gptScore >= 20) {
    engine = "hybrid";
    reason = "Request contains both operational workflow and analytical/approval components.";
    confidence = Math.min(0.95, 0.7 + hybridBoost / 100);
  } else if (gptScore >= manusScore + 15) {
    engine = "gpt";
    reason = "Request requires analytical reasoning, financial analysis, or engineering expertise.";
    confidence = Math.min(0.95, 0.65 + gptScore / 100);
  } else {
    engine = "manus";
    reason = "Request is operational — navigation, workflow, or simple action.";
    confidence = Math.min(0.95, 0.70 + manusScore / 100);
  }

  return { engine, reason, confidence, complexityScore, riskScore, breakdown: { manusScore, gptScore, hybridBoost, keywordHits } };
}

// ─── System Prompts ───────────────────────────────────────────────────────────

const POLICY_ADDENDUM = `
ACCURACY POLICY: Only state facts you can verify from the data in this conversation.
If you cannot verify a claim, say "I cannot confirm this without additional data."
Cite the specific data source for every numerical figure.
Label analytical conclusions as "Analysis:" to distinguish from verified facts.
Do not fabricate statistics, benchmarks, or external references.`;

const MANUS_SYSTEM_PROMPT = `You are NEO, the AI operational assistant of Golden Team Trading Services.
You help with internal operations, navigation, task management, meeting coordination, and workflow execution.
Be concise, actionable, and professional. Support both Arabic and English responses based on the user's language.

CONVERSATION RULES (strictly follow):
- If the user greets you (e.g. "hi", "hello", "ازيك", "عامل ايه", "كيف حالك", "مرحبا", "صباح الخير"), respond warmly and naturally in the SAME language they used. Do NOT list your capabilities.
- If the user makes small talk or asks how you are, respond naturally like a helpful colleague would.
- Only describe your capabilities when the user explicitly asks "what can you do" or "ايش تقدر تسوي".
- Always reply in the same language the user used (Arabic or English).
- Never repeat the same canned introduction message twice.${POLICY_ADDENDUM}`;

const GPT_SYSTEM_PROMPT = `You are NEO, the AI analytical core of Golden Team Trading Services.
You specialize in financial analysis, engineering evaluation, risk assessment, and strategic recommendations.
The company manages IT projects and a 33M SAR construction project.
Be precise, structured, and professional. Support both Arabic and English responses based on the user's language.${POLICY_ADDENDUM}`;

const HYBRID_SYSTEM_PROMPT = `You are NEO, the AI operational and analytical assistant of Golden Team Trading Services.
Handle both the operational workflow aspects and the analytical evaluation in your response.
Provide structured output: first the analysis/recommendation, then the next action steps.
Support both Arabic and English.${POLICY_ADDENDUM}`;

// ─── DB Helpers ───────────────────────────────────────────────────────────────

async function getConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [conv] = await db
    .select()
    .from(neoConversations)
    .where(and(eq(neoConversations.id, id), eq(neoConversations.createdBy, userId)));
  return conv ?? null;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const neoChatRouter = router({
  /**
   * Create a new conversation thread.
   * type 'ai' = NEO AI assistant (default), 'direct' = 1-on-1, 'group' = team channel
   */
  createConversation: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      type: z.enum(["ai", "direct", "group"]).default("ai"),
      participants: z.array(z.number().int().positive()).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [result] = await db.insert(neoConversations).values({
        title: input.title,
        type: input.type,
        createdBy: ctx.user.id,
        participantIds: input.participants,
        lastMessageAt: new Date(),
      });
      const id = (result as any).insertId as number;
      const [conv] = await db.select().from(neoConversations).where(eq(neoConversations.id, id));
      return conv;
    }),

  /**
   * List all conversations for the current user (non-archived, newest first).
   */
  listConversations: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(50),
      includeArchived: z.boolean().default(false),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const limit = input?.limit ?? 50;
      const includeArchived = input?.includeArchived ?? false;
      const rows = await db
        .select()
        .from(neoConversations)
        .where(
          includeArchived
            ? eq(neoConversations.createdBy, ctx.user.id)
            : and(eq(neoConversations.createdBy, ctx.user.id), eq(neoConversations.isArchived, false))
        )
        .orderBy(desc(neoConversations.lastMessageAt))
        .limit(limit);
      return rows;
    }),

  /**
   * Get all messages in a conversation (oldest first).
   */
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.number().int().positive(),
      limit: z.number().int().min(1).max(200).default(100),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const conv = await getConversation(input.conversationId, ctx.user.id);
      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      const messages = await db
        .select()
        .from(neoMessages)
        .where(and(
          eq(neoMessages.conversationId, input.conversationId),
          eq(neoMessages.isDeleted, false),
        ))
        .orderBy(neoMessages.createdAt)
        .limit(input.limit);
      return messages;
    }),

  /**
   * Send a message and get an AI response.
   *
   * REAL DUAL-ENGINE ROUTING:
   * - engine === "gpt" or "hybrid" → OpenAI GPT-4o (invokeGPT)
   * - engine === "manus" → Manus Forge gemini-2.5-flash (invokeLLM)
   * - Falls back to Manus if OPENAI_API_KEY is not configured
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number().int().positive(),
      body: z.string().min(1).max(10000),
      attachments: z.array(z.object({
        name: z.string(),
        url: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      })).optional().default([]),
      // Optional hints for routing
      requiresApproval: z.boolean().optional().default(false),
      financialAmount: z.number().optional().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Verify conversation ownership
      const conv = await getConversation(input.conversationId, ctx.user.id);
      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });

      // 1. Save user message
      const [userMsgResult] = await db.insert(neoMessages).values({
        conversationId: input.conversationId,
        senderType: "user",
        senderUserId: ctx.user.id,
        body: input.body,
        attachments: input.attachments,
        isRead: true,
      });
      const userMsgId = (userMsgResult as any).insertId as number;

      // 2. Run routing algorithm
      const routing = routeMessage(input.body, input.requiresApproval, input.financialAmount);

      // 3. Build conversation history for context (last 10 messages)
      const history = await db
        .select()
        .from(neoMessages)
        .where(and(
          eq(neoMessages.conversationId, input.conversationId),
          eq(neoMessages.isDeleted, false),
        ))
        .orderBy(desc(neoMessages.createdAt))
        .limit(10);

      const historyMessages: { role: "user" | "assistant"; content: string }[] = history
        .reverse()
        .filter((m: typeof history[0]) => m.id !== userMsgId)
        .map((m: typeof history[0]) => ({
          role: (m.senderType === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.body,
        }));

      // 4. Call the correct AI engine based on routing decision
      let aiBody = "";
      let actualEngine = routing.engine;

      try {
        if ((routing.engine === "gpt" || routing.engine === "hybrid") && isGPTConfigured()) {
          // ── GPT-4o path (OpenAI) ──────────────────────────────────────────
          const systemPrompt = routing.engine === "hybrid" ? HYBRID_SYSTEM_PROMPT : GPT_SYSTEM_PROMPT;
          const gptMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt },
            ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user", content: input.body },
          ];
          const gptResult = await invokeGPT({ messages: gptMessages });
          aiBody = gptResult.content;
          actualEngine = routing.engine; // gpt or hybrid — confirmed
        } else {
          // ── Manus Forge path (gemini-2.5-flash) ──────────────────────────
          // Also used as fallback if OPENAI_API_KEY is not configured
          if ((routing.engine === "gpt" || routing.engine === "hybrid") && !isGPTConfigured()) {
            actualEngine = "manus"; // downgrade: GPT key not available, using Manus
          }
          const systemPrompt = routing.engine === "gpt" ? GPT_SYSTEM_PROMPT
            : routing.engine === "hybrid" ? HYBRID_SYSTEM_PROMPT
            : MANUS_SYSTEM_PROMPT;
          const response = await invokeLLM({
            messages: [
              { role: "system" as const, content: systemPrompt },
              ...historyMessages.map(m => ({ role: m.role, content: m.content as string })),
              { role: "user" as const, content: input.body },
            ],
          });
          const rawContent = response.choices?.[0]?.message?.content;
          aiBody = typeof rawContent === "string" ? rawContent : "I'm unable to process that request right now. Please try again.";
        }
      } catch (err) {
        // If GPT-4o fails, fall back to Manus Forge
        if (routing.engine !== "manus") {
          try {
            const response = await invokeLLM({
              messages: [
                { role: "system" as const, content: MANUS_SYSTEM_PROMPT },
                { role: "user" as const, content: input.body },
              ],
            });
            const rawContent = response.choices?.[0]?.message?.content;
            aiBody = typeof rawContent === "string" ? rawContent : "I'm unable to process that request right now. Please try again.";
            actualEngine = "manus"; // fallback confirmed
          } catch {
            aiBody = "NEO is temporarily unavailable. Please try again in a moment.";
          }
        } else {
          aiBody = "NEO is temporarily unavailable. Please try again in a moment.";
        }
      }

      // 5. Save AI response message
      const [aiMsgResult] = await db.insert(neoMessages).values({
        conversationId: input.conversationId,
        senderType: "ai",
        senderUserId: null,
        body: aiBody,
        engine: actualEngine,
        routingScore: routing.breakdown,
        contextUsed: null,
        isRead: false,
      });
      const aiMsgId = (aiMsgResult as any).insertId as number;

      // 6. Update conversation metadata
      await db
        .update(neoConversations)
        .set({
          lastMessageAt: new Date(),
          lastMessagePreview: aiBody.slice(0, 120),
          lastEngine: actualEngine,
        })
        .where(eq(neoConversations.id, input.conversationId));

      // 7. Return both messages
      const [userMsg] = await db.select().from(neoMessages).where(eq(neoMessages.id, userMsgId));
      const [aiMsg] = await db.select().from(neoMessages).where(eq(neoMessages.id, aiMsgId));

      return {
        userMessage: userMsg,
        aiMessage: aiMsg,
        routing: { ...routing, actualEngine },
      };
    }),

  /**
   * Archive a conversation (soft delete from list).
   */
  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const conv = await getConversation(input.conversationId, ctx.user.id);
      if (!conv) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
      await db
        .update(neoConversations)
        .set({ isArchived: true })
        .where(eq(neoConversations.id, input.conversationId));
      return { success: true };
    }),

  /**
   * Delete a specific message (soft delete).
   */
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [msg] = await db.select().from(neoMessages).where(eq(neoMessages.id, input.messageId));
      if (!msg) throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
      if (msg.senderUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete another user's message" });
      await db.update(neoMessages).set({ isDeleted: true }).where(eq(neoMessages.id, input.messageId));
      return { success: true };
    }),

  /**
   * Get routing decision for a message without sending it (preview/debug).
   */
  previewRouting: protectedProcedure
    .input(z.object({
      messageText: z.string().min(1),
      requiresApproval: z.boolean().optional().default(false),
      financialAmount: z.number().optional().default(0),
    }))
    .query(({ input }) => {
      const decision = routeMessage(input.messageText, input.requiresApproval, input.financialAmount);
      return {
        ...decision,
        gptAvailable: isGPTConfigured(),
      };
    }),
});
