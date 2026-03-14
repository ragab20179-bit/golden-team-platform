/**
 * Universal File Parser
 * Supports: PDF, Excel (XLSX/XLS), CSV, Word (DOCX), Markdown, JSON, plain text
 * Returns extracted text + structured metadata for AI summarization and search.
 */

export interface ParsedFile {
  text: string;
  meta: {
    pageCount?: number;
    sheetNames?: string[];
    rowCount?: number;
    columnHeaders?: string[];
    wordCount?: number;
    [key: string]: unknown;
  };
}

export async function parseFile(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ParsedFile> {
  const mime = mimeType.toLowerCase();

  // PDF
  if (mime === "application/pdf") {
    return parsePdf(buffer);
  }

  // Excel
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel" ||
    filename.endsWith(".xlsx") ||
    filename.endsWith(".xls")
  ) {
    return parseExcel(buffer);
  }

  // CSV
  if (mime === "text/csv" || filename.endsWith(".csv")) {
    return parseCsv(buffer);
  }

  // Word DOCX
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    filename.endsWith(".docx") ||
    filename.endsWith(".doc")
  ) {
    return parseDocx(buffer);
  }

  // JSON
  if (mime === "application/json" || filename.endsWith(".json")) {
    return parseJson(buffer);
  }

  // Markdown / plain text
  if (
    mime === "text/markdown" ||
    mime === "text/plain" ||
    filename.endsWith(".md") ||
    filename.endsWith(".txt")
  ) {
    return parsePlainText(buffer);
  }

  // Images and other binary — no text extraction
  return {
    text: "",
    meta: { note: "Binary file — no text extraction available" },
  };
}

async function parsePdf(buffer: Buffer): Promise<ParsedFile> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return {
      text: (data.text ?? "").trim().slice(0, 50000),
      meta: {
        pageCount: data.numpages,
        wordCount: data.text?.split(/\s+/).filter(Boolean).length ?? 0,
        info: data.info,
      },
    };
  } catch (err) {
    return { text: "", meta: { error: String(err) } };
  }
}

async function parseExcel(buffer: Buffer): Promise<ParsedFile> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const XLSX = require("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames: string[] = workbook.SheetNames;
    const allText: string[] = [];
    let totalRows = 0;
    let columnHeaders: string[] = [];

    for (const sheetName of sheetNames.slice(0, 5)) {
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (rows.length > 0 && columnHeaders.length === 0) {
        columnHeaders = (rows[0] as string[]).map(String).filter(Boolean);
      }
      totalRows += Math.max(0, rows.length - 1);
      // Extract first 50 rows as text
      const preview = rows.slice(0, 50).map((row: string[]) => row.join("\t")).join("\n");
      allText.push(`[Sheet: ${sheetName}]\n${preview}`);
    }

    return {
      text: allText.join("\n\n").slice(0, 50000),
      meta: { sheetNames, rowCount: totalRows, columnHeaders },
    };
  } catch (err) {
    return { text: "", meta: { error: String(err) } };
  }
}

function parseCsv(buffer: Buffer): ParsedFile {
  try {
    const text = buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    const columnHeaders = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, "")) ?? [];
    const rowCount = Math.max(0, lines.length - 1);
    const preview = lines.slice(0, 100).join("\n");
    return {
      text: preview.slice(0, 50000),
      meta: { rowCount, columnHeaders },
    };
  } catch (err) {
    return { text: "", meta: { error: String(err) } };
  }
}

async function parseDocx(buffer: Buffer): Promise<ParsedFile> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value ?? "").trim();
    return {
      text: text.slice(0, 50000),
      meta: { wordCount: text.split(/\s+/).filter(Boolean).length },
    };
  } catch (err) {
    return { text: "", meta: { error: String(err) } };
  }
}

function parseJson(buffer: Buffer): ParsedFile {
  try {
    const text = buffer.toString("utf-8");
    const obj = JSON.parse(text);
    const keys = typeof obj === "object" && obj !== null ? Object.keys(obj) : [];
    return {
      text: text.slice(0, 50000),
      meta: { topLevelKeys: keys, isArray: Array.isArray(obj), length: Array.isArray(obj) ? obj.length : undefined },
    };
  } catch (err) {
    return { text: "", meta: { error: String(err) } };
  }
}

function parsePlainText(buffer: Buffer): ParsedFile {
  const text = buffer.toString("utf-8").trim();
  return {
    text: text.slice(0, 50000),
    meta: { wordCount: text.split(/\s+/).filter(Boolean).length },
  };
}
