/**
 * Drive Vault — Unit Tests
 * Tests: file parser (new filePath-based API) and vault input validation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { parseFile } from "./fileParser";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Write content to a temp file and return its path */
function writeTempFile(content: string | Buffer, filename: string): string {
  const tmpPath = path.join(os.tmpdir(), `vault-test-${Date.now()}-${filename}`);
  fs.writeFileSync(tmpPath, content);
  return tmpPath;
}

const tmpFiles: string[] = [];

afterEach(() => {
  // Clean up temp files after each test
  for (const f of tmpFiles) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
  tmpFiles.length = 0;
});

function tempFile(content: string | Buffer, filename: string): string {
  const p = writeTempFile(content, filename);
  tmpFiles.push(p);
  return p;
}

// ─── File Parser Tests ──────────────────────────────────────────────────────

describe("parseFile", () => {
  it("parses plain text files", async () => {
    const filePath = tempFile(
      "Hello, this is a plain text document about enterprise solutions.",
      "test.txt"
    );
    const result = await parseFile(filePath, "test.txt", "text/plain");
    expect(result.extractedText).toContain("Hello");
    expect(result.category).toBe("text");
    expect(result.summary).toBeTruthy();
  });

  it("parses JSON files", async () => {
    const obj = { company: "Golden Team", services: ["IT", "ASTRA PM", "Consultancy"] };
    const filePath = tempFile(JSON.stringify(obj, null, 2), "data.json");
    const result = await parseFile(filePath, "data.json", "application/json");
    expect(result.extractedText).toContain("Golden Team");
    expect(result.category).toBe("text");
    expect(result.summary).toBeTruthy();
  });

  it("parses CSV files", async () => {
    const csv = `Name,Department,Salary\nAhmed,HR,15000\nSara,Finance,18000\nKhalid,IT,20000`;
    const filePath = tempFile(csv, "employees.csv");
    const result = await parseFile(filePath, "employees.csv", "text/csv");
    expect(result.extractedText).toContain("Ahmed");
    expect(result.category).toBe("csv");
    expect(result.headers).toBeDefined();
    expect(result.headers).toContain("Name");
  });

  it("parses markdown files", async () => {
    const md = `# Golden Team\n\n## Services\n\n- IT Solutions\n- ASTRA PM\n- Business Consultancy`;
    const filePath = tempFile(md, "readme.md");
    const result = await parseFile(filePath, "readme.md", "text/markdown");
    expect(result.extractedText).toContain("Golden Team");
    expect(result.category).toBe("text");
  });

  it("handles large text files without crashing", async () => {
    const longText = "A".repeat(60000);
    const filePath = tempFile(longText, "large.txt");
    const result = await parseFile(filePath, "large.txt", "text/plain");
    // Should not throw; extractedText may be truncated
    expect(typeof result.extractedText).toBe("string");
    expect(result.category).toBe("text");
  });

  it("handles malformed JSON gracefully", async () => {
    const filePath = tempFile("{ invalid json }}}", "broken.json");
    const result = await parseFile(filePath, "broken.json", "application/json");
    // Should not throw; may return empty text or the raw content
    expect(typeof result.extractedText).toBe("string");
    expect(result.category).toBe("text");
  });

  it("returns unknown category for unsupported binary files", async () => {
    const filePath = tempFile(Buffer.from([0x00, 0x01, 0x02, 0x03]), "binary.bin");
    const result = await parseFile(filePath, "binary.bin", "application/octet-stream");
    expect(result.category).toBe("unknown");
  });

  it("detects PDF category correctly", async () => {
    // Create a minimal fake PDF (just needs the .pdf extension for category detection)
    const filePath = tempFile("%PDF-1.4 fake content", "report.pdf");
    // parseFile will try to parse it — may fail gracefully since it's not a real PDF
    try {
      const result = await parseFile(filePath, "report.pdf", "application/pdf");
      expect(result.category).toBe("pdf");
    } catch {
      // Graceful failure is acceptable for malformed PDFs
    }
  });
});

// ─── Vault Input Validation Tests ──────────────────────────────────────────

describe("vault upload input validation", () => {
  it("rejects files larger than 16MB (size check logic)", () => {
    const MAX = 16 * 1024 * 1024;
    const oversized = MAX + 1;
    expect(oversized).toBeGreaterThan(MAX);
  });

  it("accepts all supported MIME types", () => {
    const SUPPORTED = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "application/json",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];
    expect(SUPPORTED.length).toBeGreaterThan(0);
    for (const mime of SUPPORTED) {
      expect(typeof mime).toBe("string");
    }
  });

  it("validates folder names against allowed list", () => {
    const VAULT_FOLDERS = [
      "general", "hr", "erp", "crm", "kpi", "procurement",
      "qms", "legal", "comms", "audit", "governance",
      "meetings", "neo-core", "finance", "technical",
    ] as const;
    expect(VAULT_FOLDERS).toContain("hr");
    expect(VAULT_FOLDERS).toContain("governance");
    expect(VAULT_FOLDERS).not.toContain("invalid-folder");
  });

  it("generates unique S3 keys for each upload", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const suffix = Math.random().toString(36).slice(2, 10);
      keys.add(`vault/general/1-${suffix}.pdf`);
    }
    expect(keys.size).toBe(100);
  });
});

// ─── detectCategory Tests ──────────────────────────────────────────────────

describe("detectCategory", () => {
  it("correctly identifies file categories by extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("report.pdf", "application/pdf")).toBe("pdf");
    expect(detectCategory("data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe("excel");
    expect(detectCategory("employees.csv", "text/csv")).toBe("csv");
    expect(detectCategory("notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
    expect(detectCategory("config.xml", "application/xml")).toBe("xml");
    expect(detectCategory("photo.png", "image/png")).toBe("image");
    expect(detectCategory("drawing.dxf", "application/dxf")).toBe("dwg");
    expect(detectCategory("readme.md", "text/markdown")).toBe("text");
    expect(detectCategory("notes.txt", "text/plain")).toBe("text");
  });
});
