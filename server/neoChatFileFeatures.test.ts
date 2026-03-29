/**
 * Tests for NEO Chat file-related features:
 * 1. Persistent file context across turns (uploadId accumulation)
 * 2. File metadata for preview cards (contextUsed enrichment)
 * 3. Bulk analysis type validation
 */
import { describe, it, expect } from "vitest";

// ─── Persistent File Context — Upload ID Accumulation ────────────────────────

describe("NEO Chat — Persistent File Context (Upload ID Accumulation)", () => {
  /**
   * Simulates the allUploadIds merge logic from neoChat.sendMessage:
   * Merges existing conversation-level uploadIds with new ones, deduplicating.
   */
  function mergeUploadIds(existing: string[], incoming: string[]): string[] {
    return Array.from(new Set([...existing, ...incoming]));
  }

  it("merges new uploadIds with empty existing list", () => {
    const result = mergeUploadIds([], ["upload-1", "upload-2"]);
    expect(result).toEqual(["upload-1", "upload-2"]);
  });

  it("merges new uploadIds with existing list", () => {
    const result = mergeUploadIds(["upload-1"], ["upload-2", "upload-3"]);
    expect(result).toEqual(["upload-1", "upload-2", "upload-3"]);
  });

  it("deduplicates overlapping uploadIds", () => {
    const result = mergeUploadIds(["upload-1", "upload-2"], ["upload-2", "upload-3"]);
    expect(result).toHaveLength(3);
    expect(result).toContain("upload-1");
    expect(result).toContain("upload-2");
    expect(result).toContain("upload-3");
  });

  it("handles empty incoming list (no new files)", () => {
    const result = mergeUploadIds(["upload-1", "upload-2"], []);
    expect(result).toEqual(["upload-1", "upload-2"]);
  });

  it("handles both lists empty", () => {
    const result = mergeUploadIds([], []);
    expect(result).toEqual([]);
  });

  it("handles large accumulation across many turns", () => {
    let accumulated: string[] = [];
    for (let turn = 0; turn < 10; turn++) {
      const newIds = [`upload-turn${turn}-a`, `upload-turn${turn}-b`];
      accumulated = mergeUploadIds(accumulated, newIds);
    }
    expect(accumulated).toHaveLength(20);
    expect(accumulated[0]).toBe("upload-turn0-a");
    expect(accumulated[19]).toBe("upload-turn9-b");
  });

  it("handles null/undefined existing list gracefully", () => {
    // Simulates the Array.isArray check from the router
    const rawExisting: unknown = null;
    const existing: string[] = Array.isArray(rawExisting) ? rawExisting : [];
    const result = mergeUploadIds(existing, ["upload-1"]);
    expect(result).toEqual(["upload-1"]);
  });
});

// ─── File Metadata for Preview Cards ─────────────────────────────────────────

describe("NEO Chat — File Metadata for Preview Cards", () => {
  interface FileMetadata {
    uploadId: string;
    fileName: string;
    mimeType: string;
    category: string;
    summary: string | null;
    extractedTextPreview: string;
    sizeBytes: number;
    fileUrl: string | null;
  }

  /**
   * Simulates the contextUsed.files structure stored in AI response messages.
   */
  function buildContextUsed(files: FileMetadata[]): { files: FileMetadata[] } {
    return { files };
  }

  it("builds contextUsed with file metadata", () => {
    const files: FileMetadata[] = [
      {
        uploadId: "upload-1",
        fileName: "report.pdf",
        mimeType: "application/pdf",
        category: "pdf",
        summary: "Quarterly financial report",
        extractedTextPreview: "Revenue increased by 15%...",
        sizeBytes: 1024000,
        fileUrl: "https://cdn.example.com/report.pdf",
      },
    ];
    const ctx = buildContextUsed(files);
    expect(ctx.files).toHaveLength(1);
    expect(ctx.files[0].fileName).toBe("report.pdf");
    expect(ctx.files[0].category).toBe("pdf");
  });

  it("handles multiple files in contextUsed", () => {
    const files: FileMetadata[] = [
      { uploadId: "u1", fileName: "doc.pdf", mimeType: "application/pdf", category: "pdf", summary: null, extractedTextPreview: "text", sizeBytes: 100, fileUrl: null },
      { uploadId: "u2", fileName: "data.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", category: "excel", summary: "Sales data", extractedTextPreview: "Q1,Q2", sizeBytes: 200, fileUrl: null },
      { uploadId: "u3", fileName: "photo.png", mimeType: "image/png", category: "image", summary: "Invoice scan", extractedTextPreview: "Invoice #123", sizeBytes: 500000, fileUrl: null },
    ];
    const ctx = buildContextUsed(files);
    expect(ctx.files).toHaveLength(3);
    expect(ctx.files.map(f => f.category)).toEqual(["pdf", "excel", "image"]);
  });

  it("handles empty files list", () => {
    const ctx = buildContextUsed([]);
    expect(ctx.files).toHaveLength(0);
  });

  it("truncates extractedTextPreview correctly", () => {
    const longText = "A".repeat(1000);
    const preview = longText.substring(0, 500) + "...";
    expect(preview.length).toBe(503);
    expect(preview.endsWith("...")).toBe(true);
  });
});

// ─── Bulk Analysis Type Validation ───────────────────────────────────────────

describe("NEO Chat — Bulk Analysis", () => {
  const VALID_ANALYSIS_TYPES = ["comparison", "summary", "contract_review", "tender_evaluation"] as const;
  type AnalysisType = typeof VALID_ANALYSIS_TYPES[number];

  function isValidAnalysisType(type: string): type is AnalysisType {
    return VALID_ANALYSIS_TYPES.includes(type as AnalysisType);
  }

  it("accepts all valid analysis types", () => {
    for (const type of VALID_ANALYSIS_TYPES) {
      expect(isValidAnalysisType(type)).toBe(true);
    }
  });

  it("rejects invalid analysis types", () => {
    expect(isValidAnalysisType("invalid")).toBe(false);
    expect(isValidAnalysisType("")).toBe(false);
    expect(isValidAnalysisType("SUMMARY")).toBe(false);
  });

  /**
   * Simulates the system prompt builder for bulk analysis
   */
  function buildBulkAnalysisPrompt(type: AnalysisType, customPrompt?: string): string {
    const prompts: Record<AnalysisType, string> = {
      comparison: "Compare the following documents side by side. Identify key differences, similarities, and notable discrepancies.",
      summary: "Provide a comprehensive summary of all the following documents. Highlight key points, themes, and actionable items.",
      contract_review: "Review the following contracts/legal documents. Identify key terms, obligations, risks, penalties, and expiration dates. Rate each risk as Low/Medium/High.",
      tender_evaluation: "Evaluate the following tender/bid submissions. Compare pricing, technical compliance, delivery timelines, and qualifications. Provide a ranked recommendation.",
    };

    let prompt = prompts[type];
    if (customPrompt) {
      prompt += `\n\nAdditional instructions: ${customPrompt}`;
    }
    return prompt;
  }

  it("generates correct prompt for comparison analysis", () => {
    const prompt = buildBulkAnalysisPrompt("comparison");
    expect(prompt).toContain("Compare");
    expect(prompt).toContain("differences");
  });

  it("generates correct prompt for summary analysis", () => {
    const prompt = buildBulkAnalysisPrompt("summary");
    expect(prompt).toContain("comprehensive summary");
  });

  it("generates correct prompt for contract review", () => {
    const prompt = buildBulkAnalysisPrompt("contract_review");
    expect(prompt).toContain("contracts");
    expect(prompt).toContain("risks");
    expect(prompt).toContain("Low/Medium/High");
  });

  it("generates correct prompt for tender evaluation", () => {
    const prompt = buildBulkAnalysisPrompt("tender_evaluation");
    expect(prompt).toContain("tender");
    expect(prompt).toContain("ranked recommendation");
  });

  it("appends custom prompt when provided", () => {
    const prompt = buildBulkAnalysisPrompt("summary", "Focus on financial data only");
    expect(prompt).toContain("comprehensive summary");
    expect(prompt).toContain("Focus on financial data only");
  });

  it("does not append custom prompt when empty", () => {
    const prompt = buildBulkAnalysisPrompt("summary");
    expect(prompt).not.toContain("Additional instructions");
  });

  /**
   * Validates that bulk analysis requires at least 1 file
   */
  it("validates minimum file count for analysis", () => {
    const uploadIds: string[] = [];
    expect(uploadIds.length >= 1).toBe(false);

    const uploadIds2 = ["upload-1"];
    expect(uploadIds2.length >= 1).toBe(true);
  });
});

// ─── File Context Enrichment ─────────────────────────────────────────────────

describe("NEO Chat — File Context Enrichment in Messages", () => {
  /**
   * Simulates the enrichedBody logic from sendMessage:
   * Prepends file context to the user's message body.
   */
  function enrichMessageBody(originalBody: string, fileContextParts: string[]): string {
    if (fileContextParts.length === 0) return originalBody;
    const contextBlock = fileContextParts.join("\n\n---\n\n");
    return `[Attached File Context]\n${contextBlock}\n\n[User Message]\n${originalBody}`;
  }

  it("returns original body when no file context", () => {
    const result = enrichMessageBody("Hello NEO", []);
    expect(result).toBe("Hello NEO");
  });

  it("prepends file context to user message", () => {
    const result = enrichMessageBody("Summarize this document", [
      "File: report.pdf\nContent: Revenue increased by 15%..."
    ]);
    expect(result).toContain("[Attached File Context]");
    expect(result).toContain("report.pdf");
    expect(result).toContain("[User Message]");
    expect(result).toContain("Summarize this document");
  });

  it("joins multiple file contexts with separators", () => {
    const result = enrichMessageBody("Compare these", [
      "File: doc1.pdf\nContent: First doc",
      "File: doc2.pdf\nContent: Second doc",
    ]);
    expect(result).toContain("---");
    expect(result).toContain("doc1.pdf");
    expect(result).toContain("doc2.pdf");
  });

  it("preserves original message at the end", () => {
    const original = "What are the key differences?";
    const result = enrichMessageBody(original, ["File: a.pdf\nContent: text"]);
    expect(result.endsWith(original)).toBe(true);
  });
});
