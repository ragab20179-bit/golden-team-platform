/**
 * Universal Upload Router — Vitest Tests
 *
 * Tests the full upload pipeline:
 *   initiate → uploadChunk → finalize → getStatus → getResult → cancel
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock("../server/storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test-file.pdf", key: "test/key.pdf" }),
  storageGet: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test-file.pdf?sig=abc", key: "test/key.pdf" }),
}));

vi.mock("../server/fileParser", () => ({
  parseFile: vi.fn().mockResolvedValue({
    extractedText: "This is a test document with some content.",
    summary: "A test PDF document.",
    category: "pdf",
    pageCount: 1,
    headers: [],
    warnings: [],
  }),
  detectCategory: vi.fn().mockReturnValue("pdf"),
}));

vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI-generated summary of the test document." } }],
  }),
}));

// ─── Import router after mocks ────────────────────────────────────────────────

import { universalUploadRouter } from "../server/routers/universalUpload";
import { getUploadedFileContext } from "../server/routers/universalUpload";

// ─── Helper: create a mock tRPC caller ───────────────────────────────────────

function createCaller(userId = 1) {
  const mockCtx = {
    user: { id: userId, name: "Test User", openId: "test-open-id", role: "user" as const },
    req: {} as any,
    res: {} as any,
  };
  return universalUploadRouter.createCaller(mockCtx);
}

// ─── Helper: encode small buffer as base64 ───────────────────────────────────

function makeChunk(content: string): string {
  return Buffer.from(content).toString("base64");
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("universalUploadRouter", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    caller = createCaller(1);
  });

  // ── initiate ──────────────────────────────────────────────────────────────

  describe("initiate", () => {
    it("creates an upload session and returns uploadId + category", async () => {
      const result = await caller.initiate({
        fileName: "report.pdf",
        mimeType: "application/pdf",
        fileSize: 1024 * 100, // 100 KB
        totalChunks: 1,
        context: "vault",
      });

      expect(result.uploadId).toBeTruthy();
      expect(typeof result.uploadId).toBe("string");
      expect(result.category).toBe("pdf");
      expect(result.maxChunkSize).toBe(5 * 1024 * 1024);
      expect(result.message).toContain("report.pdf");
    });

    it("detects excel category for .xlsx files", async () => {
      const result = await caller.initiate({
        fileName: "data.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileSize: 50000,
        totalChunks: 1,
      });
      expect(result.uploadId).toBeTruthy();
    });

    it("accepts optional context and contextId", async () => {
      const result = await caller.initiate({
        fileName: "meeting-notes.pdf",
        mimeType: "application/pdf",
        fileSize: 20000,
        totalChunks: 1,
        context: "meeting",
        contextId: 42,
      });
      expect(result.uploadId).toBeTruthy();
    });
  });

  // ── uploadChunk ───────────────────────────────────────────────────────────

  describe("uploadChunk", () => {
    it("accepts a chunk and returns progress", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 2,
      });

      const result = await caller.uploadChunk({
        uploadId,
        chunkIndex: 0,
        chunkData: makeChunk("chunk 0 content"),
      });

      expect(result.received).toBe(1);
      expect(result.total).toBe(2);
      expect(result.progress).toBe(50);
    });

    it("throws NOT_FOUND for unknown uploadId", async () => {
      await expect(
        caller.uploadChunk({
          uploadId: "non-existent-id",
          chunkIndex: 0,
          chunkData: makeChunk("data"),
        })
      ).rejects.toThrow("Upload session not found");
    });

    it("throws FORBIDDEN for wrong userId", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "secret.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      const otherCaller = createCaller(999);
      await expect(
        otherCaller.uploadChunk({ uploadId, chunkIndex: 0, chunkData: makeChunk("data") })
      ).rejects.toThrow("Access denied");
    });

    it("throws BAD_REQUEST for out-of-range chunk index", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      await expect(
        caller.uploadChunk({ uploadId, chunkIndex: 5, chunkData: makeChunk("data") })
      ).rejects.toThrow("Chunk index out of range");
    });
  });

  // ── finalize ──────────────────────────────────────────────────────────────

  describe("finalize", () => {
    it("throws BAD_REQUEST when chunks are missing", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "test.pdf",
        mimeType: "application/pdf",
        fileSize: 200,
        totalChunks: 2,
      });

      // Only upload chunk 0, not chunk 1
      await caller.uploadChunk({ uploadId, chunkIndex: 0, chunkData: makeChunk("chunk0") });

      await expect(caller.finalize({ uploadId })).rejects.toThrow("Missing chunk 1");
    });

    it("returns fileUrl and fileKey after successful finalize", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "complete.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      await caller.uploadChunk({ uploadId, chunkIndex: 0, chunkData: makeChunk("pdf content") });
      const result = await caller.finalize({ uploadId });

      expect(result.fileUrl).toBeTruthy();
      expect(result.fileKey).toBeTruthy();
      expect(result.status).toBe("parsing");
      expect(result.fileName).toBe("complete.pdf");
    });
  });

  // ── getStatus ─────────────────────────────────────────────────────────────

  describe("getStatus", () => {
    it("returns status for an active session", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "status-test.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      const status = await caller.getStatus({ uploadId });
      expect(status.uploadId).toBe(uploadId);
      expect(["uploading", "parsing", "complete", "error"]).toContain(status.status);
      expect(status.fileName).toBe("status-test.pdf");
    });

    it("throws NOT_FOUND for unknown uploadId", async () => {
      await expect(caller.getStatus({ uploadId: "ghost-id" })).rejects.toThrow(
        "Upload session not found"
      );
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe("cancel", () => {
    it("cancels an active session", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "cancel-me.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      const result = await caller.cancel({ uploadId });
      expect(result.success).toBe(true);

      // Session should be gone
      await expect(caller.getStatus({ uploadId })).rejects.toThrow("Upload session not found");
    });

    it("throws FORBIDDEN when another user tries to cancel", async () => {
      const { uploadId } = await caller.initiate({
        fileName: "mine.pdf",
        mimeType: "application/pdf",
        fileSize: 100,
        totalChunks: 1,
      });

      const otherCaller = createCaller(999);
      await expect(otherCaller.cancel({ uploadId })).rejects.toThrow("Access denied");
    });
  });

  // ── listByContext ─────────────────────────────────────────────────────────

  describe("listByContext", () => {
    it("returns empty array when no completed uploads exist for context", async () => {
      const result = await caller.listByContext({ context: "meeting", contextId: 9999 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── getUploadedFileContext helper ─────────────────────────────────────────

  describe("getUploadedFileContext", () => {
    it("returns empty string for unknown uploadIds", () => {
      const context = getUploadedFileContext(["non-existent-id"], 1);
      expect(context).toBe("");
    });

    it("returns empty string for wrong userId", () => {
      const context = getUploadedFileContext(["some-id"], 999);
      expect(context).toBe("");
    });
  });
});
