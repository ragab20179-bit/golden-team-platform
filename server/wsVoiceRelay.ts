/**
 * WebSocket Voice Relay — Real-Time Audio Conversation
 *
 * Architecture:
 *   Browser mic → WebSocket (/ws/voice) → This Server → OpenAI Realtime WS → This Server → WebSocket → Browser speaker
 *
 * The server acts as a relay between the browser and OpenAI's Realtime API:
 * 1. Browser connects via WebSocket with auth token + voice/language config
 * 2. Server opens a WebSocket to OpenAI Realtime API with the real API key
 * 3. Audio flows bidirectionally: browser PCM16 → OpenAI, OpenAI PCM16 → browser
 * 4. Server intercepts function calls, executes them locally, sends results back to OpenAI
 * 5. Transcripts and events are forwarded to the browser for UI display
 *
 * Protocol (browser → server):
 *   { type: "audio", audio: "<base64 PCM16 24kHz mono>" }
 *   { type: "config", voice: "alloy", language: "en" }
 *   { type: "end" }
 *
 * Protocol (server → browser):
 *   { type: "audio", audio: "<base64 PCM16 24kHz mono>" }
 *   { type: "transcript_user", text: "...", isFinal: true }
 *   { type: "transcript_assistant", text: "...", isFinal: true }
 *   { type: "function_call", name: "...", status: "executing"|"complete"|"error", result?: "..." }
 *   { type: "session_started", sessionId: "..." }
 *   { type: "session_ended", usage: { inputTokens, outputTokens, costUsd } }
 *   { type: "vad", event: "speech_started"|"speech_stopped" }
 *   { type: "error", message: "..." }
 *   { type: "ai_speaking", speaking: true|false }
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import type { IncomingMessage } from "http";
import { ENV } from "./_core/env";
import { buildVoiceContext, type RealtimeTool } from "./routers/neoVoice";
import { getDb } from "./db";
import {
  kpiTargets,
  requests,
  vaultFiles,
  neoAiUsage,
} from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "../shared/const";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";

// ─── Tool Executor (same logic as neoVoice.executeTool) ──────────────────────

async function executeToolLocally(
  toolName: string,
  args: Record<string, string>
): Promise<string> {
  switch (toolName) {
    case "get_kpi_status": {
      const db = await getDb();
      if (!db) return "Database unavailable.";
      const rows = await (args.department
        ? db.select().from(kpiTargets).where(eq(kpiTargets.category, args.department)).limit(10)
        : db.select().from(kpiTargets).limit(10));
      if (rows.length === 0)
        return `No KPI data found${args.department ? ` for department: ${args.department}` : ""}.`;
      return rows
        .map(
          (k: (typeof rows)[0]) =>
            `${k.name}: target ${k.targetValue ?? "not set"} ${k.unit ?? ""}, actual ${k.actualValue ?? "not set"}, status ${k.status}`
        )
        .join("; ");
    }
    case "search_vault": {
      const db = await getDb();
      if (!db) return "Database unavailable.";
      const searchQuery = args.query ?? "";
      const rows = await db
        .select({
          filename: vaultFiles.filename,
          originalName: vaultFiles.originalName,
          folder: vaultFiles.folder,
          aiSummary: vaultFiles.aiSummary,
        })
        .from(vaultFiles)
        .where(
          sql`${vaultFiles.filename} LIKE ${`%${searchQuery}%`}
          OR ${vaultFiles.aiSummary} LIKE ${`%${searchQuery}%`}
          OR ${vaultFiles.originalName} LIKE ${`%${searchQuery}%`}`
        )
        .limit(5);
      if (rows.length === 0) return `No vault documents found matching "${searchQuery}".`;
      return rows
        .map(
          (f) =>
            `${f.originalName} (${f.folder ?? "general"}): ${f.aiSummary ? f.aiSummary.slice(0, 100) + "..." : "no summary"}`
        )
        .join("\n");
    }
    case "get_pending_requests": {
      const db = await getDb();
      if (!db) return "Database unavailable.";
      let rows = await db
        .select()
        .from(requests)
        .where(eq(requests.status, "pending"))
        .orderBy(desc(requests.createdAt))
        .limit(10);
      if (args.type) {
        rows = rows.filter((r: (typeof rows)[0]) => r.type === args.type);
      }
      if (rows.length === 0) return "No pending requests found.";
      return rows
        .map(
          (r: (typeof rows)[0]) =>
            `#${r.requestNumber}: ${r.type} — ${r.title}${r.amountSar ? ` (${r.amountSar} SAR)` : ""}`
        )
        .join("; ");
    }
    case "raise_request": {
      return `DRAFT REQUEST (awaiting your confirmation):\nType: ${args.type}\nTitle: ${args.title}\nDescription: ${args.description}\nAmount: ${args.amount_sar ? args.amount_sar + " SAR" : "not specified"}\nPlease confirm by saying "yes, submit this request" or "cancel".`;
    }
    default:
      return "Unknown tool.";
  }
}

// ─── Auth Helper ─────────────────────────────────────────────────────────────

async function authenticateWs(req: IncomingMessage): Promise<{ userId: string } | null> {
  try {
    // Try cookie-based auth first (same session cookie as tRPC)
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      const sessionCookie = cookies[COOKIE_NAME];
      if (sessionCookie) {
        const session = await sdk.verifySession(sessionCookie);
        if (session?.openId) return { userId: session.openId };
      }
    }
    // Fallback: token in query param
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    if (token) {
      const session = await sdk.verifySession(token);
      if (session?.openId) return { userId: session.openId };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Session Manager ─────────────────────────────────────────────────────────

interface VoiceSession {
  id: string;
  userId: string;
  openaiWs: WebSocket | null;
  browserWs: WebSocket;
  startTime: number;
  inputTokens: number;
  outputTokens: number;
  voice: string;
  language: string;
}

const activeSessions = new Map<string, VoiceSession>();

function generateSessionId(): string {
  return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Send to browser safely ──────────────────────────────────────────────────

function sendToBrowser(ws: WebSocket, data: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ─── Connect to OpenAI Realtime API ──────────────────────────────────────────

function connectToOpenAI(
  session: VoiceSession,
  voiceContext: { systemPrompt: string; tools: RealtimeTool[]; contextSummary: string }
): void {
  const apiKey = ENV.openAiApiKey;
  if (!apiKey) {
    sendToBrowser(session.browserWs, { type: "error", message: "OpenAI API key not configured." });
    return;
  }

  const openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  session.openaiWs = openaiWs;

  openaiWs.on("open", () => {
    // Configure the session
    const langInstruction =
      session.language === "ar"
        ? "\n\nIMPORTANT: The user prefers Arabic. Respond in Arabic unless they switch to English."
        : session.language === "auto"
        ? "\n\nDetect the user's language and respond in the same language. Support Arabic and English."
        : "";

    const sessionConfig: Record<string, unknown> = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: voiceContext.systemPrompt + langInstruction,
        voice: session.voice || "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "gpt-4o-mini-transcribe",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 600,
        },
        tools: voiceContext.tools,
      },
    };

    openaiWs.send(JSON.stringify(sessionConfig));

    sendToBrowser(session.browserWs, {
      type: "session_started",
      sessionId: session.id,
    });
  });

  openaiWs.on("message", async (data) => {
    try {
      const event = JSON.parse(data.toString());
      await handleOpenAIEvent(session, event);
    } catch (err) {
      console.error("[WS Voice Relay] Error parsing OpenAI event:", err);
    }
  });

  openaiWs.on("error", (err) => {
    console.error("[WS Voice Relay] OpenAI WS error:", err.message);
    sendToBrowser(session.browserWs, {
      type: "error",
      message: `OpenAI connection error: ${err.message}`,
    });
  });

  openaiWs.on("close", (code, reason) => {
    console.log(`[WS Voice Relay] OpenAI WS closed: ${code} ${reason.toString()}`);
    endSession(session);
  });
}

// ─── Handle OpenAI Events ────────────────────────────────────────────────────

async function handleOpenAIEvent(session: VoiceSession, event: Record<string, unknown>) {
  const eventType = event.type as string;

  switch (eventType) {
    // ── Audio from AI → forward to browser ──
    case "response.audio.delta": {
      sendToBrowser(session.browserWs, {
        type: "audio",
        audio: event.delta,
      });
      break;
    }

    case "response.audio.done": {
      sendToBrowser(session.browserWs, {
        type: "ai_speaking",
        speaking: false,
      });
      break;
    }

    // ── AI started generating audio ──
    case "response.audio_transcript.delta": {
      sendToBrowser(session.browserWs, {
        type: "transcript_assistant",
        text: event.delta,
        isFinal: false,
      });
      break;
    }

    case "response.audio_transcript.done": {
      sendToBrowser(session.browserWs, {
        type: "transcript_assistant",
        text: event.transcript,
        isFinal: true,
      });
      break;
    }

    // ── User speech transcript ──
    case "conversation.item.input_audio_transcription.completed": {
      sendToBrowser(session.browserWs, {
        type: "transcript_user",
        text: event.transcript,
        isFinal: true,
      });
      break;
    }

    // ── VAD events ──
    case "input_audio_buffer.speech_started": {
      sendToBrowser(session.browserWs, { type: "vad", event: "speech_started" });
      break;
    }

    case "input_audio_buffer.speech_stopped": {
      sendToBrowser(session.browserWs, { type: "vad", event: "speech_stopped" });
      break;
    }

    // ── Function calling ──
    case "response.function_call_arguments.done": {
      const callId = event.call_id as string;
      const fnName = event.name as string;
      const fnArgs = JSON.parse((event.arguments as string) || "{}");

      // Notify browser that function is executing
      sendToBrowser(session.browserWs, {
        type: "function_call",
        name: fnName,
        callId,
        status: "executing",
      });

      // Execute the tool locally
      try {
        const result = await executeToolLocally(fnName, fnArgs);

        // Send result back to OpenAI
        if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
          session.openaiWs.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: callId,
                output: result,
              },
            })
          );

          // Trigger AI to respond with the function result
          session.openaiWs.send(
            JSON.stringify({
              type: "response.create",
            })
          );
        }

        // Notify browser
        sendToBrowser(session.browserWs, {
          type: "function_call",
          name: fnName,
          callId,
          status: "complete",
          result: result.slice(0, 200),
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        sendToBrowser(session.browserWs, {
          type: "function_call",
          name: fnName,
          callId,
          status: "error",
          result: errMsg,
        });
      }
      break;
    }

    // ── Response done (usage stats) ──
    case "response.done": {
      const usage = (event.response as Record<string, unknown>)?.usage as
        | Record<string, number>
        | undefined;
      if (usage) {
        session.inputTokens += usage.input_tokens ?? 0;
        session.outputTokens += usage.output_tokens ?? 0;

        sendToBrowser(session.browserWs, {
          type: "usage_update",
          inputTokens: session.inputTokens,
          outputTokens: session.outputTokens,
        });
      }
      break;
    }

    // ── AI starts speaking (first audio delta triggers this) ──
    case "response.created": {
      sendToBrowser(session.browserWs, {
        type: "ai_speaking",
        speaking: true,
      });
      break;
    }

    // ── Session errors ──
    case "error": {
      const errorData = event.error as Record<string, unknown> | undefined;
      sendToBrowser(session.browserWs, {
        type: "error",
        message: (errorData?.message as string) || "Unknown OpenAI error",
        code: errorData?.code,
      });
      break;
    }

    default:
      // Forward other events for debugging (optional)
      break;
  }
}

// ─── End Session ─────────────────────────────────────────────────────────────

async function endSession(session: VoiceSession) {
  const durationSeconds = Math.round((Date.now() - session.startTime) / 1000);

  // Close OpenAI WS
  if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
    session.openaiWs.close();
  }

  // Calculate cost
  const costUsd =
    (session.inputTokens / 1_000_000) * 40.0 +
    (session.outputTokens / 1_000_000) * 80.0;

  // Log usage to DB
  try {
    const db = await getDb();
    if (db) {
      await db.insert(neoAiUsage).values({
        module: "voice-ws",
        engine: "gpt",
        modelName: "gpt-4o-realtime-preview",
        promptTokens: session.inputTokens,
        completionTokens: session.outputTokens,
        totalTokens: session.inputTokens + session.outputTokens,
        estimatedCostUsd: costUsd.toFixed(6),
        queryPreview: `WS Voice session ${session.id} (${durationSeconds}s)`.slice(0, 200),
        latencyMs: durationSeconds * 1000,
      });
    }
  } catch (err) {
    console.error("[WS Voice Relay] Failed to log usage:", err);
  }

  // Notify browser
  sendToBrowser(session.browserWs, {
    type: "session_ended",
    usage: {
      inputTokens: session.inputTokens,
      outputTokens: session.outputTokens,
      costUsd,
      durationSeconds,
    },
  });

  // Cleanup
  activeSessions.delete(session.id);
}

// ─── Handle Browser Messages ─────────────────────────────────────────────────

function handleBrowserMessage(session: VoiceSession, raw: string) {
  try {
    const msg = JSON.parse(raw);

    switch (msg.type) {
      case "audio": {
        // Forward audio to OpenAI
        if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
          session.openaiWs.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: msg.audio,
            })
          );
        }
        break;
      }

      case "config": {
        // Update voice/language (only before session starts)
        if (msg.voice) session.voice = msg.voice;
        if (msg.language) session.language = msg.language;
        break;
      }

      case "end": {
        endSession(session);
        break;
      }

      case "interrupt": {
        // Cancel current AI response (user said "stop" or started talking)
        if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
          session.openaiWs.send(
            JSON.stringify({ type: "response.cancel" })
          );
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[WS Voice Relay] Error parsing browser message:", err);
  }
}

// ─── Attach WebSocket Server to HTTP Server ──────────────────────────────────

export function attachVoiceWebSocket(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url ?? "", `http://${req.headers.host}`).pathname;

    if (pathname === "/ws/voice") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      // Not our endpoint — let other handlers deal with it (e.g., Vite HMR)
      // Don't destroy the socket; the Vite dev server will handle it
    }
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    // Authenticate
    const auth = await authenticateWs(req);
    if (!auth) {
      ws.send(JSON.stringify({ type: "error", message: "Authentication required. Pass ?token=<jwt> in the WebSocket URL." }));
      ws.close(4001, "Unauthorized");
      return;
    }

    // Parse config from query params
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const voice = url.searchParams.get("voice") || "alloy";
    const language = url.searchParams.get("language") || "auto";

    // Create session
    const sessionId = generateSessionId();
    const session: VoiceSession = {
      id: sessionId,
      userId: auth.userId,
      openaiWs: null,
      browserWs: ws,
      startTime: Date.now(),
      inputTokens: 0,
      outputTokens: 0,
      voice,
      language,
    };

    activeSessions.set(sessionId, session);
    console.log(`[WS Voice Relay] New session ${sessionId} for user ${auth.userId} (voice=${voice}, lang=${language})`);

    // Build voice context from DB
    let voiceContext;
    try {
      voiceContext = await buildVoiceContext(auth.userId);
    } catch (err) {
      console.error("[WS Voice Relay] Failed to build voice context:", err);
      voiceContext = {
        systemPrompt:
          "You are NEO, the AI assistant for Golden Team Trading Services. The database is currently unavailable. Answer based on general knowledge only.",
        tools: [] as RealtimeTool[],
        contextSummary: "Database unavailable",
      };
    }

    // Connect to OpenAI
    connectToOpenAI(session, voiceContext);

    // Handle browser messages
    ws.on("message", (data) => {
      handleBrowserMessage(session, data.toString());
    });

    ws.on("close", () => {
      console.log(`[WS Voice Relay] Browser disconnected: session ${sessionId}`);
      if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
        session.openaiWs.close();
      }
      activeSessions.delete(sessionId);
    });

    ws.on("error", (err) => {
      console.error(`[WS Voice Relay] Browser WS error: ${err.message}`);
    });
  });

  console.log("[WS Voice Relay] WebSocket voice relay attached on /ws/voice");
}
