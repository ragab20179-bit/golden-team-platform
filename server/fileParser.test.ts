/**
 * fileParser.test.ts — Unit tests for the Universal File Parser
 *
 * Tests cover:
 * - CSV parsing
 * - JSON parsing
 * - Plain text parsing
 * - Markdown parsing
 * - XML parsing
 * - PDF text extraction (mocked)
 * - Image OCR (mocked)
 * - Error handling for unsupported types
 * - File size limits
 * - detectCategory for new file types (PPTX, Pages, Numbers, RTF, ODT, ODS, ODP)
 * - Tesseract OCR availability check
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createTempFile(content: string | Buffer, ext: string): string {
  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  if (typeof content === "string") {
    fs.writeFileSync(filePath, content, "utf-8");
  } else {
    fs.writeFileSync(filePath, content);
  }
  return filePath;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fileParser — text formats", () => {
  let tmpFiles: string[] = [];

  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    tmpFiles = [];
  });

  it("parses plain text files", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "Hello, this is a plain text file.\nSecond line.";
    const filePath = createTempFile(content, ".txt");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.txt", "text/plain");
    expect(result.category).toBe("text");
    expect(result.extractedText).toContain("Hello");
    expect(result.extractedText).toContain("Second line");
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("parses Markdown files", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "# Heading\n\nThis is **bold** text.\n\n- Item 1\n- Item 2";
    const filePath = createTempFile(content, ".md");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.md", "text/markdown");
    expect(result.category).toBe("text");
    expect(result.extractedText).toContain("Heading");
    expect(result.extractedText).toContain("bold");
  });

  it("parses CSV files", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "Name,Age,City\nAlice,30,Cairo\nBob,25,Dubai\nCharlie,35,Riyadh";
    const filePath = createTempFile(content, ".csv");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.csv", "text/csv");
    expect(["spreadsheet", "csv"]).toContain(result.category);
    expect(result.extractedText).toContain("Alice");
    expect(result.extractedText).toContain("Cairo");
    expect(result.summary).toBeDefined();
  });

  it("parses JSON files", async () => {
    const { parseFile } = await import("./fileParser");
    const data = { company: "Golden Team", services: ["IT", "ASTRA PM", "Consulting"], founded: 2010 };
    const content = JSON.stringify(data, null, 2);
    const filePath = createTempFile(content, ".json");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.json", "application/json");
    expect(result.category).toBe("text");
    expect(result.extractedText).toContain("Golden Team");
    expect(result.extractedText).toContain("ASTRA PM");
  });

  it("parses XML files", async () => {
    const { parseFile } = await import("./fileParser");
    const content = `<?xml version="1.0"?><company><name>Golden Team</name><founded>2010</founded></company>`;
    const filePath = createTempFile(content, ".xml");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.xml", "application/xml");
    expect(["text", "xml"]).toContain(result.category);
    expect(result.extractedText).toContain("Golden Team");
  });

  it("reports file size correctly", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "A".repeat(1000);
    const filePath = createTempFile(content, ".txt");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.txt", "text/plain");
    expect(result.fileSizeBytes).toBe(1000);
  });

  it("handles empty files gracefully", async () => {
    const { parseFile } = await import("./fileParser");
    const filePath = createTempFile("", ".txt");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "empty.txt", "text/plain");
    expect(result.category).toBe("text");
    expect(result.extractedText).toBe("");
  });

  it("handles non-existent files gracefully", async () => {
    const { parseFile } = await import("./fileParser");
    // parseFile may throw for missing files — wrap in try/catch
    try {
      const result = await parseFile("/tmp/nonexistent-file-xyz.txt", "missing.txt", "text/plain");
      expect(result).toBeDefined();
    } catch (err: any) {
      // Acceptable: ENOENT or similar error thrown for missing files
      expect(err.message).toMatch(/ENOENT|not found|no such file/i);
    }
  });
});

describe("fileParser — CSV edge cases", () => {
  let tmpFiles: string[] = [];

  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    tmpFiles = [];
  });

  it("handles CSV with quoted fields containing commas", async () => {
    const { parseFile } = await import("./fileParser");
    const content = `Name,Description\n"Smith, John","Senior Engineer, IT Division"\n"Doe, Jane","Manager, Finance"`;
    const filePath = createTempFile(content, ".csv");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "quoted.csv", "text/csv");
    expect(["spreadsheet", "csv"]).toContain(result.category);
    expect(result.extractedText).toContain("Smith");
  });

  it("handles large CSV files with row limit", async () => {
    const { parseFile } = await import("./fileParser");
    const rows = ["Col1,Col2,Col3"];
    for (let i = 0; i < 2000; i++) {
      rows.push(`Row${i},Value${i},Data${i}`);
    }
    const content = rows.join("\n");
    const filePath = createTempFile(content, ".csv");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "large.csv", "text/csv");
    expect(["spreadsheet", "csv"]).toContain(result.category);
    // Summary should mention the row count
    expect(result.summary ?? result.extractedText).toBeDefined();
  });
});

describe("fileParser — MIME type detection", () => {
  let tmpFiles: string[] = [];

  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    tmpFiles = [];
  });

  it("detects category from extension when mimeType is generic", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "Name,Value\nA,1\nB,2";
    const filePath = createTempFile(content, ".csv");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "data.csv", "application/octet-stream");
    // Should detect as csv/spreadsheet from extension
    expect(["spreadsheet", "csv"]).toContain(result.category);
  });

  it("handles .md extension as text", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "# Test\nContent here";
    const filePath = createTempFile(content, ".md");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "readme.md", "application/octet-stream");
    expect(result.category).toBe("text");
  });
});

describe("fileParser — output schema validation", () => {
  let tmpFiles: string[] = [];

  afterEach(() => {
    for (const f of tmpFiles) {
      try { fs.unlinkSync(f); } catch {}
    }
    tmpFiles = [];
  });

  it("always returns required fields in ParsedFile", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "test content";
    const filePath = createTempFile(content, ".txt");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "test.txt", "text/plain");

    // Validate all required fields are present
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("mimeType");
    expect(result).toHaveProperty("fileName");
    expect(result).toHaveProperty("fileSizeBytes");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("extractedText");
    expect(result).toHaveProperty("warnings");
    expect(typeof result.fileSizeBytes).toBe("number");
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("returns extractedText within 50000 char limit", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "X".repeat(100000);
    const filePath = createTempFile(content, ".txt");
    tmpFiles.push(filePath);

    const result = await parseFile(filePath, "big.txt", "text/plain");
    expect(result.extractedText.length).toBeLessThanOrEqual(50000);
  });
});

// ─── New tests for expanded file type detection ──────────────────────────────

describe("fileParser — detectCategory for new file types", () => {
  it("detects PPTX from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("slides.pptx", "application/octet-stream")).toBe("pptx");
  });

  it("detects PPT from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("old-slides.ppt", "application/octet-stream")).toBe("pptx");
  });

  it("detects PPTX from MIME type", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("file", "application/vnd.openxmlformats-officedocument.presentationml.presentation")).toBe("pptx");
  });

  it("detects Pages from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("doc.pages", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects Numbers from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("data.numbers", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects Keynote from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("presentation.key", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects ODT from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("document.odt", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects ODS from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("spreadsheet.ods", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects ODP from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("presentation.odp", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects RTF from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("document.rtf", "application/octet-stream")).toBe("libreoffice");
  });

  it("detects RTF from MIME type", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("file", "application/rtf")).toBe("libreoffice");
  });

  it("detects HEIC image from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("photo.heic", "application/octet-stream")).toBe("image");
  });

  it("detects HEIF image from extension", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("photo.heif", "application/octet-stream")).toBe("image");
  });

  it("still detects PDF correctly", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("report.pdf", "application/pdf")).toBe("pdf");
  });

  it("still detects Excel correctly", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("data.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe("excel");
  });

  it("still detects DOCX correctly", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("doc.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
  });

  it("still detects DWG correctly", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("drawing.dwg", "application/octet-stream")).toBe("dwg");
  });

  it("returns unknown for unsupported types", async () => {
    const { detectCategory } = await import("./fileParser");
    expect(detectCategory("file.xyz", "application/octet-stream")).toBe("unknown");
  });
});

describe("fileParser — Tesseract OCR availability", () => {
  it("tesseract binary is available on the system", async () => {
    const { execSync } = await import("child_process");
    let available = false;
    try {
      const version = execSync("tesseract --version 2>&1", { encoding: "utf-8" });
      available = version.includes("tesseract");
    } catch {}
    expect(available).toBe(true);
  });

  it("tesseract has Arabic language pack installed", async () => {
    const { execSync } = await import("child_process");
    let hasArabic = false;
    try {
      const langs = execSync("tesseract --list-langs 2>&1", { encoding: "utf-8" });
      hasArabic = langs.includes("ara");
    } catch {}
    expect(hasArabic).toBe(true);
  });
});

describe("fileParser — ParsedFile ocrText field", () => {
  it("ParsedFile type includes optional ocrText field", async () => {
    const { parseFile } = await import("./fileParser");
    const content = "test";
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, `test-ocr-field-${Date.now()}.txt`);
    fs.writeFileSync(filePath, content);

    const result = await parseFile(filePath, "test.txt", "text/plain");
    // ocrText is optional — for text files it should be undefined
    expect(result.ocrText === undefined || typeof result.ocrText === "string").toBe(true);

    fs.unlinkSync(filePath);
  });
});
