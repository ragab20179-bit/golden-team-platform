/**
 * Universal Upload Router
 *
 * Handles chunked upload of any file type with automatic parsing and extraction.
 * Supports: PDF, Excel, CSV, XML, DOCX, Images (GPT-4 Vision), DWG/DXF, Text
 *
 * Flow:
 *   1. initiate     → create session, get uploadId + category
 *   2. uploadChunk  → send base64 chunks (×N)
 *   3. finalize     → assemble file, upload to S3, trigger async parsing
 *   4. getStatus    → poll for parse completion
 *   5. getResult    → retrieve parsed content + AI summary
 *
 * Ported from khobar-building-ai-system with Golden Team adaptations.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc.js";
import { storagePut } from "../storage.js";
import { parseFile, detectCategory, type FileCategory } from "../fileParser.js";

// ─── Session Store ────────────────────────────────────────────────────────────

const TEMP_DIR = "/tmp/universal-uploads";
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

type ParseStatus = "pending" | "uploading" | "parsing" | "complete" | "error";

interface UploadSession {
  uploadId: string;
  userId: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  totalChunks: number;
  receivedChunks: Set<number>;
  createdAt: number;
  status: ParseStatus;
  // Set after finalize
  fileUrl?: string;
  fileKey?: string;
  parsedResult?: ReturnType<typeof parseFile> extends Promise<infer T> ? T : never;
  errorMessage?: string;
  // Optional context tagging
  context?: "meeting" | "project" | "knowledge" | "vault" | "global";
  contextId?: number;
}

const sessions = new Map<string, UploadSession>();

// ─── AI Context Helper ────────────────────────────────────────────────────────

/**
 * Resolve uploadIds to extracted file content for AI context injection.
 * Call this from any conversation/chat router when user attaches files.
 */
export function getUploadedFileContext(uploadIds: string[], userId: number): string {
  const parts: string[] = [];
  for (const uploadId of uploadIds) {
    const session = sessions.get(uploadId);
    if (!session || session.userId !== userId || session.status !== "complete") continue;
    const result = session.parsedResult as any;
    if (!result) continue;
    const text = result.extractedText || result.text || result.summary || "";
    if (!text) continue;
    const truncated =
      text.length > 12000 ? text.slice(0, 12000) + "\n...[content truncated]" : text;
    parts.push(
      `### File: ${session.fileName} (${result.category || session.mimeType})\n` +
        (result.summary ? `Summary: ${result.summary}\n\n` : "") +
        `Full Content:\n${truncated}`
    );
  }
  return parts.join("\n\n---\n\n");
}

// ─── Session Cleanup (2h TTL) ─────────────────────────────────────────────────

setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, s] of Array.from(sessions.entries())) {
    if (s.createdAt < cutoff) {
      const dir = path.join(TEMP_DIR, id);
      if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
      sessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSession(uploadId: string, userId: number): UploadSession {
  const session = sessions.get(uploadId);
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Upload session not found" });
  if (session.userId !== userId) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  return session;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const universalUploadRouter = router({
  /**
   * Step 1: Initiate upload session.
   * Returns uploadId + detected file category.
   */
  initiate: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(500),
        mimeType: z.string(),
        fileSize: z.number().positive(),
        totalChunks: z.number().int().positive(),
        context: z
          .enum(["meeting", "project", "knowledge", "vault", "global"])
          .optional(),
        contextId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const uploadId = crypto.randomUUID();
      const sessionDir = path.join(TEMP_DIR, uploadId);
      fs.mkdirSync(sessionDir, { recursive: true });

      const session: UploadSession = {
        uploadId,
        userId: ctx.user.id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        totalChunks: input.totalChunks,
        receivedChunks: new Set(),
        createdAt: Date.now(),
        status: "uploading",
        context: input.context,
        contextId: input.contextId,
      };
      sessions.set(uploadId, session);

      const category: FileCategory = detectCategory(input.fileName, input.mimeType);

      return {
        uploadId,
        category,
        maxChunkSize: 5 * 1024 * 1024, // 5 MB
        message: `Upload session created for ${input.fileName} (${formatBytes(input.fileSize)})`,
      };
    }),

  /**
   * Step 2: Upload a single chunk (base64 encoded).
   * Repeat for each chunk until all are received.
   */
  uploadChunk: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        chunkIndex: z.number().int().min(0),
        chunkData: z.string(), // base64
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = getSession(input.uploadId, ctx.user.id);

      if (input.chunkIndex >= session.totalChunks) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Chunk index out of range" });
      }

      const chunkPath = path.join(TEMP_DIR, input.uploadId, `chunk_${input.chunkIndex}`);
      const buffer = Buffer.from(input.chunkData, "base64");
      fs.writeFileSync(chunkPath, buffer);
      session.receivedChunks.add(input.chunkIndex);

      const progress = Math.round((session.receivedChunks.size / session.totalChunks) * 100);
      return {
        received: session.receivedChunks.size,
        total: session.totalChunks,
        progress,
      };
    }),

  /**
   * Step 3: Finalize — assemble chunks, upload to S3, trigger async parsing.
   * Returns immediately; poll getStatus for parse completion.
   */
  finalize: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = getSession(input.uploadId, ctx.user.id);

      // Verify all chunks received
      for (let i = 0; i < session.totalChunks; i++) {
        if (!session.receivedChunks.has(i)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Missing chunk ${i} of ${session.totalChunks}`,
          });
        }
      }

      session.status = "parsing";

      // Assemble chunks into final file
      const assembledPath = path.join(TEMP_DIR, input.uploadId, "assembled");
      const writeStream = fs.createWriteStream(assembledPath);
      for (let i = 0; i < session.totalChunks; i++) {
        const chunkPath = path.join(TEMP_DIR, input.uploadId, `chunk_${i}`);
        const chunk = fs.readFileSync(chunkPath);
        writeStream.write(chunk);
      }
      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      // Upload to S3
      const safeFileName = session.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const fileKey = `universal-uploads/${ctx.user.id}/${crypto.randomUUID()}-${safeFileName}`;
      const fileBuffer = fs.readFileSync(assembledPath);
      const { url: fileUrl } = await storagePut(fileKey, fileBuffer, session.mimeType);
      session.fileUrl = fileUrl;
      session.fileKey = fileKey;

      // Parse file async — don't block response
      parseFile(assembledPath, session.fileName, session.mimeType, fileUrl)
        .then((result) => {
          session.parsedResult = result as any;
          session.status = "complete";
          // Cleanup temp files
          const sessionDir = path.join(TEMP_DIR, input.uploadId);
          if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
          }
        })
        .catch((err) => {
          session.status = "error";
          session.errorMessage = err.message;
        });

      return {
        uploadId: input.uploadId,
        fileUrl,
        fileKey,
        fileName: session.fileName,
        fileSize: session.fileSize,
        status: "parsing" as const,
        message: "File uploaded to S3. Parsing in progress...",
      };
    }),

  /**
   * Step 4: Poll parse status.
   */
  getStatus: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = getSession(input.uploadId, ctx.user.id);
      return {
        uploadId: input.uploadId,
        status: session.status,
        fileName: session.fileName,
        fileSize: session.fileSize,
        fileUrl: session.fileUrl,
        fileKey: session.fileKey,
        errorMessage: session.errorMessage,
        progress:
          session.status === "complete"
            ? 100
            : session.status === "parsing"
            ? 90
            : session.status === "uploading"
            ? Math.round((session.receivedChunks.size / session.totalChunks) * 85)
            : 0,
      };
    }),

  /**
   * Step 5: Get parsed result (only available when status === "complete").
   */
  getResult: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = getSession(input.uploadId, ctx.user.id);
      if (session.status !== "complete") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `File not ready. Status: ${session.status}`,
        });
      }
      return {
        uploadId: input.uploadId,
        fileName: session.fileName,
        fileUrl: session.fileUrl!,
        fileKey: session.fileKey!,
        fileSize: session.fileSize,
        mimeType: session.mimeType,
        parsedResult: session.parsedResult,
      };
    }),

  /**
   * List all completed uploads for a given context.
   */
  listByContext: protectedProcedure
    .input(
      z.object({
        context: z
          .enum(["meeting", "project", "knowledge", "vault", "global"])
          .optional(),
        contextId: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const results = Array.from(sessions.values())
        .filter((s) => {
          if (s.userId !== ctx.user.id) return false;
          if (s.status !== "complete") return false;
          if (input.context && s.context !== input.context) return false;
          if (input.contextId && s.contextId !== input.contextId) return false;
          return true;
        })
        .map((s) => ({
          uploadId: s.uploadId,
          fileName: s.fileName,
          fileSize: s.fileSize,
          mimeType: s.mimeType,
          fileUrl: s.fileUrl,
          fileKey: s.fileKey,
          context: s.context,
          contextId: s.contextId,
          category: (s.parsedResult as any)?.category,
          summary: (s.parsedResult as any)?.summary,
        }));
      return results;
    }),

  /**
   * Cancel an in-progress upload and clean up temp files.
   */
  cancel: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const session = getSession(input.uploadId, ctx.user.id);
      const sessionDir = path.join(TEMP_DIR, input.uploadId);
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
      sessions.delete(input.uploadId);
      return { success: true };
    }),
});
