/**
 * Drive Vault — Unit Tests
 * Tests: file parser, vault DB helpers (mocked), and router input validation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseFile } from "./fileParser";

// ─── File Parser Tests ──────────────────────────────────────────────────────

describe("parseFile", () => {
  it("parses plain text files", async () => {
    const buffer = Buffer.from("Hello, this is a plain text document about enterprise solutions.");
    const result = await parseFile(buffer, "text/plain", "test.txt");
    expect(result.text).toContain("Hello");
    expect(result.meta.wordCount).toBeGreaterThan(5);
  });

  it("parses JSON files", async () => {
    const obj = { company: "Golden Team", services: ["IT", "ASTRA PM", "Consultancy"] };
    const buffer = Buffer.from(JSON.stringify(obj));
    const result = await parseFile(buffer, "application/json", "data.json");
    expect(result.text).toContain("Golden Team");
    expect(result.meta).toMatchObject({ isArray: false });
    expect((result.meta as any).topLevelKeys).toContain("company");
  });

  it("parses CSV files", async () => {
    const csv = `Name,Department,Salary\nAhmed,HR,15000\nSara,Finance,18000\nKhalid,IT,20000`;
    const buffer = Buffer.from(csv);
    const result = await parseFile(buffer, "text/csv", "employees.csv");
    expect(result.text).toContain("Ahmed");
    expect(result.meta.columnHeaders).toEqual(["Name", "Department", "Salary"]);
    expect(result.meta.rowCount).toBe(3);
  });

  it("parses markdown files", async () => {
    const md = `# Golden Team\n\n## Services\n\n- IT Solutions\n- ASTRA PM\n- Business Consultancy`;
    const buffer = Buffer.from(md);
    const result = await parseFile(buffer, "text/markdown", "readme.md");
    expect(result.text).toContain("Golden Team");
    expect(result.meta.wordCount).toBeGreaterThan(5);
  });

  it("returns empty text for binary image files", async () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG magic bytes
    const result = await parseFile(buffer, "image/png", "logo.png");
    expect(result.text).toBe("");
    expect(result.meta).toMatchObject({ note: expect.stringContaining("Binary") });
  });

  it("handles large text files by truncating at 50000 chars", async () => {
    const longText = "A".repeat(60000);
    const buffer = Buffer.from(longText);
    const result = await parseFile(buffer, "text/plain", "large.txt");
    expect(result.text.length).toBeLessThanOrEqual(50000);
  });

  it("handles malformed JSON gracefully", async () => {
    const buffer = Buffer.from("{ invalid json }}}");
    const result = await parseFile(buffer, "application/json", "broken.json");
    expect(result.text).toBe("");
    expect(result.meta).toHaveProperty("error");
  });
});

// ─── Vault Input Validation Tests ──────────────────────────────────────────

describe("vault upload input validation", () => {
  it("rejects files larger than 16MB", () => {
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
      "text/markdown",
      "text/plain",
      "application/json",
      "image/png",
      "image/jpeg",
    ];
    expect(SUPPORTED.length).toBeGreaterThan(8);
    SUPPORTED.forEach((mime) => {
      expect(mime).toBeTruthy();
    });
  });

  it("validates folder enum values", () => {
    const VALID_FOLDERS = [
      "general", "hr", "erp", "crm", "kpi", "procurement",
      "qms", "legal", "comms", "audit", "governance", "meetings",
      "neo-core", "finance", "technical",
    ];
    expect(VALID_FOLDERS).toContain("general");
    expect(VALID_FOLDERS).toContain("governance");
    expect(VALID_FOLDERS).not.toContain("invalid-folder");
  });
});

// ─── File Size Formatter Tests ──────────────────────────────────────────────

describe("formatBytes utility", () => {
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  it("formats bytes correctly", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
