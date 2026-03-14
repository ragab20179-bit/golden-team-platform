/**
 * Drive Vault — tRPC Router
 * Handles file upload confirmation, listing, search, and deletion.
 * Upload itself goes directly from client → S3 via presigned URL (no server proxy for bytes).
 */
import fs from "fs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { storagePut, storageGet } from "../storage";
import {
  insertVaultFile,
  getVaultFileById,
  listVaultFiles,
  searchVaultFiles,
  updateVaultFileParsed,
  deleteVaultFile,
} from "../db/vault";
import { parseFile } from "../fileParser";
import { invokeLLM } from "../_core/llm";

const VAULT_FOLDERS = [
  "general", "hr", "erp", "crm", "kpi", "procurement",
  "qms", "legal", "comms", "audit", "governance", "meetings",
  "neo-core", "finance", "technical",
] as const;

type VaultFolder = typeof VAULT_FOLDERS[number];

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export const vaultRouter = router({
  /**
   * Step 1: Upload a file from the client.
   * Client sends the raw file as base64 (for files up to 16MB via tRPC).
   * Server uploads to S3 and triggers parsing + AI summary.
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(128),
        sizeBytes: z.number().int().min(0).max(16 * 1024 * 1024), // 16MB max
        base64Data: z.string(), // base64-encoded file content
        folder: z.enum(VAULT_FOLDERS).default("general"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { filename, mimeType, sizeBytes, base64Data, folder } = input;
      const userId = ctx.user.id;

      // Decode base64 to buffer
      const buffer = Buffer.from(base64Data, "base64");

      // Build S3 key with random suffix to prevent enumeration
      const ext = filename.includes(".") ? filename.split(".").pop() : "bin";
      const s3Key = `vault/${folder}/${userId}-${randomSuffix()}.${ext}`;

      // Upload to S3
      const { url: s3Url } = await storagePut(s3Key, buffer, mimeType);

      // Insert initial record
      const fileId = await insertVaultFile({
        uploadedBy: userId,
        filename: s3Key.split("/").pop() ?? filename,
        originalName: filename,
        mimeType,
        sizeBytes,
        s3Key,
        s3Url,
        folder,
      });

      // Write buffer to temp file for the new filePath-based parser
      const tmpDir = "/tmp/vault-uploads";
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      const tmpPath = `${tmpDir}/${fileId}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      fs.writeFileSync(tmpPath, buffer);

      // Parse file content asynchronously (don't block the response)
      parseAndSummarize(fileId, tmpPath, mimeType, filename, s3Url)
        .finally(() => {
          // Cleanup temp file after parsing
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        })
        .catch((err) => {
          console.error("[Vault] Parse error for file", fileId, err);
        });

      return { id: fileId, s3Url, s3Key, message: "File uploaded successfully" };
    }),

  /**
   * List files in the vault, optionally filtered by folder.
   */
  listFiles: protectedProcedure
    .input(
      z.object({
        folder: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const files = await listVaultFiles({
        folder: input.folder,
        limit: input.limit,
        offset: input.offset,
      });
      return files;
    }),

  /**
   * Get a single file by ID.
   */
  getFile: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const file = await getVaultFileById(input.id);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      return file;
    }),

  /**
   * Get a presigned download URL for a file.
   */
  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const file = await getVaultFileById(input.id);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      const { url } = await storageGet(file.s3Key);
      return { url, filename: file.originalName };
    }),

  /**
   * Search files by name, parsed text, or AI summary.
   */
  searchFiles: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        folder: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return searchVaultFiles(input.query, input.folder);
    }),

  /**
   * Delete a file (admin only or own file).
   */
  deleteFile: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const file = await getVaultFileById(input.id);
      if (!file) throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });

      // Only admin or file owner can delete
      if (ctx.user.role !== "admin" && file.uploadedBy !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this file" });
      }

      await deleteVaultFile(input.id);
      return { success: true };
    }),

  /**
   * Get available vault folders.
   */
  getFolders: protectedProcedure.query(async () => {
    return VAULT_FOLDERS;
  }),
});

/**
 * Background task: parse file content and generate AI summary.
 * Now uses the new filePath-based parseFile API (not buffer-based).
 */
async function parseAndSummarize(
  fileId: number,
  filePath: string,
  mimeType: string,
  filename: string,
  fileUrl?: string
): Promise<void> {
  try {
    const result = await parseFile(filePath, filename, mimeType, fileUrl);
    const text = result.extractedText || "";
    const meta = {
      category: result.category,
      summary: result.summary,
      pageCount: result.pageCount,
      headers: result.headers,
      warnings: result.warnings,
    };

    let aiSummary: string | undefined = result.summary;

    // Generate enhanced AI summary only if there's meaningful text content
    if (text && text.trim().length > 100) {
      try {
        const truncatedText = text.slice(0, 4000); // Limit for LLM context
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a professional document analyst. Provide a concise 2-3 sentence summary of the document content. Focus on key topics, data, and business relevance. Be direct and factual.",
            },
            {
              role: "user",
              content: `Document: ${filename}\n\nContent:\n${truncatedText}`,
            },
          ],
        });
        const rawContent = response.choices?.[0]?.message?.content;
        if (typeof rawContent === "string") aiSummary = rawContent;
      } catch (llmErr) {
        console.warn("[Vault] LLM summary failed:", llmErr);
      }
    }

    await updateVaultFileParsed(fileId, {
      parsedText: text || undefined,
      parsedMeta: meta,
      aiSummary,
    });
  } catch (err) {
    console.error("[Vault] parseAndSummarize error:", err);
  }
}
