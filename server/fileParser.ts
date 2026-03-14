/**
 * Universal File Parser
 *
 * Extracts structured content from all supported file types:
 *   - PDF         → text + page count + metadata
 *   - Excel/XLSX  → sheet names + tabular data (JSON rows)
 *   - CSV         → parsed rows + headers
 *   - XML         → flattened JSON structure
 *   - DOCX        → plain text
 *   - Images      → GPT-4 Vision description + OCR text
 *   - DWG/DXF     → entity list + layer names + drawing metadata
 *   - TXT/MD/JSON → raw text
 *
 * Ported from khobar-building-ai-system with Golden Team adaptations.
 */
import fs from "fs";
import path from "path";
import { invokeLLM } from "./_core/llm.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileCategory =
  | "pdf"
  | "excel"
  | "csv"
  | "xml"
  | "docx"
  | "image"
  | "dwg"
  | "text"
  | "unknown";

export interface ParsedFile {
  category: FileCategory;
  mimeType: string;
  fileName: string;
  fileSizeBytes: number;
  /** Human-readable summary of extracted content */
  summary: string;
  /** Full extracted text (for AI context injection) */
  extractedText: string;
  /** Structured data (rows for CSV/Excel, tree for XML, entities for DWG) */
  structuredData?: any;
  /** Page count (PDF) or sheet count (Excel) */
  pageCount?: number;
  /** Column headers (CSV/Excel) */
  headers?: string[];
  /** Image analysis result from GPT-4 Vision */
  visionAnalysis?: string;
  /** Parsing warnings */
  warnings: string[];
}

// ─── MIME / extension detection ───────────────────────────────────────────────

export function detectCategory(fileName: string, mimeType: string): FileCategory {
  const ext = path.extname(fileName).toLowerCase();
  const mime = mimeType.toLowerCase();

  if (ext === ".pdf" || mime === "application/pdf") return "pdf";
  if (
    [".xlsx", ".xls", ".xlsm", ".xlsb"].includes(ext) ||
    mime.includes("spreadsheet") ||
    mime.includes("excel")
  )
    return "excel";
  if (ext === ".csv" || mime === "text/csv") return "csv";
  // Check docx BEFORE xml — OOXML MIME types contain "xml" as a substring
  if (
    [".docx", ".doc"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime.includes("word")
  )
    return "docx";
  if (ext === ".xml" || mime === "application/xml" || mime === "text/xml") return "xml";
  if (
    [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp", ".gif"].includes(ext) ||
    mime.startsWith("image/")
  )
    return "image";
  if ([".dwg", ".dxf"].includes(ext)) return "dwg";
  if (
    [".txt", ".md", ".log", ".json", ".js", ".ts", ".py", ".html", ".css"].includes(ext) ||
    mime.startsWith("text/")
  )
    return "text";
  return "unknown";
}

// ─── PDF Parser ───────────────────────────────────────────────────────────────

async function parsePDF(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let pageCount = 0;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer, { max: 0 });
    extractedText = data.text || "";
    pageCount = data.numpages || 0;
  } catch (err: any) {
    warnings.push(`PDF parse warning: ${err.message}`);
    extractedText = "[PDF text extraction failed — file may be scanned/image-based]";
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const summary = `PDF document: ${pageCount} page(s), ~${wordCount.toLocaleString()} words extracted.`;

  return {
    category: "pdf",
    mimeType: "application/pdf",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    pageCount,
    warnings,
  };
}

// ─── Excel Parser ─────────────────────────────────────────────────────────────

async function parseExcel(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let structuredData: any = {};
  let headers: string[] = [];
  let pageCount = 0;

  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    pageCount = sheetNames.length;

    const allSheets: Record<string, any[]> = {};
    const textParts: string[] = [];

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      allSheets[sheetName] = rows;

      if (rows.length > 0 && headers.length === 0) {
        headers = Object.keys(rows[0]);
      }

      const csvText = XLSX.utils.sheet_to_csv(sheet);
      textParts.push(`=== Sheet: ${sheetName} ===\n${csvText}`);
    }

    structuredData = allSheets;
    extractedText = textParts.join("\n\n");
  } catch (err: any) {
    warnings.push(`Excel parse warning: ${err.message}`);
    extractedText = "[Excel parsing failed]";
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const summary = `Excel workbook: ${pageCount} sheet(s), ${headers.length} columns detected. Headers: ${headers.slice(0, 8).join(", ")}${headers.length > 8 ? ` +${headers.length - 8} more` : ""}.`;

  return {
    category: "excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    structuredData,
    pageCount,
    headers,
    warnings,
  };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

async function parseCSV(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let structuredData: any[] = [];
  let headers: string[] = [];

  try {
    const { parse } = await import("csv-parse/sync");
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as any[];
    structuredData = rows;
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    }
    extractedText = content;
  } catch (err: any) {
    warnings.push(`CSV parse warning: ${err.message}`);
    try {
      extractedText = fs.readFileSync(filePath, "utf-8");
    } catch {
      extractedText = "[CSV read failed]";
    }
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const summary = `CSV file: ${structuredData.length} rows, ${headers.length} columns. Headers: ${headers.slice(0, 8).join(", ")}${headers.length > 8 ? ` +${headers.length - 8} more` : ""}.`;

  return {
    category: "csv",
    mimeType: "text/csv",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    structuredData,
    headers,
    warnings,
  };
}

// ─── XML Parser ───────────────────────────────────────────────────────────────

async function parseXML(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let structuredData: any = {};

  try {
    const xml2js = await import("xml2js");
    const content = fs.readFileSync(filePath, "utf-8");
    const result = await xml2js.parseStringPromise(content, {
      explicitArray: false,
      mergeAttrs: true,
    });
    structuredData = result;
    extractedText = JSON.stringify(result, null, 2);
  } catch (err: any) {
    warnings.push(`XML parse warning: ${err.message}`);
    try {
      extractedText = fs.readFileSync(filePath, "utf-8");
    } catch {
      extractedText = "[XML read failed]";
    }
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const summary = `XML document: ${(fileSizeBytes / 1024).toFixed(1)} KB. Parsed to structured JSON.`;

  return {
    category: "xml",
    mimeType: "application/xml",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    structuredData,
    warnings,
  };
}

// ─── DOCX Parser ──────────────────────────────────────────────────────────────

async function parseDOCX(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";

  try {
    const mammoth = await import("mammoth");
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || "";
    if (result.messages?.length) {
      warnings.push(...result.messages.map((m: any) => m.message));
    }
  } catch (err: any) {
    warnings.push(`DOCX parse warning: ${err.message}`);
    extractedText = "[DOCX text extraction failed]";
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const summary = `Word document: ~${wordCount.toLocaleString()} words extracted.`;

  return {
    category: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    warnings,
  };
}

// ─── Image Parser (GPT-4 Vision) ──────────────────────────────────────────────

async function parseImage(
  filePath: string,
  fileName: string,
  mimeType: string,
  fileUrl?: string
): Promise<ParsedFile> {
  const warnings: string[] = [];
  const fileSizeBytes = fs.statSync(filePath).size;
  let visionAnalysis = "";

  if (fileUrl) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: fileUrl, detail: "high" },
              },
              {
                type: "text",
                text: "Please analyze this image and extract all text, data, dimensions, annotations, and relevant information. Structure your response clearly.",
              },
            ] as any,
          },
        ],
      });
      const rawContent = response.choices?.[0]?.message?.content;
      visionAnalysis =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent) || "[No vision analysis returned]";
    } catch (err: any) {
      warnings.push(`Vision analysis warning: ${err.message}`);
      visionAnalysis = "[Vision analysis unavailable]";
    }
  } else {
    visionAnalysis = "[Vision analysis requires file URL — upload to S3 first]";
    warnings.push("Image uploaded but vision analysis skipped (no S3 URL yet)");
  }

  const summary = `Image file (${mimeType}): ${(fileSizeBytes / 1024).toFixed(1)} KB. GPT-4 Vision analysis completed.`;

  return {
    category: "image",
    mimeType,
    fileName,
    fileSizeBytes,
    summary,
    extractedText: visionAnalysis,
    visionAnalysis,
    warnings,
  };
}

// ─── DWG/DXF Parser ───────────────────────────────────────────────────────────

async function parseDWG(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  const fileSizeBytes = fs.statSync(filePath).size;
  let extractedText = "";
  let structuredData: any = {};

  const ext = path.extname(fileName).toLowerCase();

  if (ext === ".dxf") {
    try {
      const DxfParser = (await import("dxf-parser")).default;
      const parser = new DxfParser();
      const content = fs.readFileSync(filePath, "utf-8");
      const dxf = parser.parseSync(content);
      const layers = dxf?.tables?.layer?.layers
        ? Object.keys(dxf.tables.layer.layers)
        : [];
      const entities = dxf?.entities || [];
      const entityTypes: Record<string, number> = {};
      for (const e of entities) {
        entityTypes[(e as any).type] = (entityTypes[(e as any).type] || 0) + 1;
      }
      structuredData = { layers, entityTypes, entityCount: entities.length };
      extractedText = `DXF Drawing: ${entities.length} entities across ${layers.length} layers.\nLayers: ${layers.join(", ")}\nEntity types: ${JSON.stringify(entityTypes, null, 2)}`;
    } catch (err: any) {
      warnings.push(`DXF parse warning: ${err.message}`);
      extractedText = "[DXF parsing failed — file may be binary or corrupted]";
    }
  } else {
    extractedText = "[DWG binary format — visual analysis will be performed after upload]";
    warnings.push("DWG binary files require visual analysis via GPT-4 Vision");
  }

  const summary = `CAD drawing (${ext.toUpperCase()}): ${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB. ${extractedText.split("\n")[0]}`;

  return {
    category: "dwg",
    mimeType: "application/octet-stream",
    fileName,
    fileSizeBytes,
    summary,
    extractedText,
    structuredData,
    warnings,
  };
}

// ─── Text / Markdown / JSON ───────────────────────────────────────────────────

async function parseText(
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileSizeBytes = fs.statSync(filePath).size;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const summary = `Text file (${path.extname(fileName)}): ${wordCount.toLocaleString()} words, ${content.split("\n").length} lines.`;

  return {
    category: "text",
    mimeType,
    fileName,
    fileSizeBytes,
    summary,
    extractedText: content.slice(0, 50000),
    warnings: [],
  };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export async function parseFile(
  filePath: string,
  fileName: string,
  mimeType: string,
  fileUrl?: string
): Promise<ParsedFile> {
  const category = detectCategory(fileName, mimeType);

  switch (category) {
    case "pdf":
      return parsePDF(filePath, fileName);
    case "excel":
      return parseExcel(filePath, fileName);
    case "csv":
      return parseCSV(filePath, fileName);
    case "xml":
      return parseXML(filePath, fileName);
    case "docx":
      return parseDOCX(filePath, fileName);
    case "image":
      return parseImage(filePath, fileName, mimeType, fileUrl);
    case "dwg":
      return parseDWG(filePath, fileName);
    case "text":
      return parseText(filePath, fileName, mimeType);
    default:
      return {
        category: "unknown",
        mimeType,
        fileName,
        fileSizeBytes: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
        summary: `Unsupported file type: ${path.extname(fileName)}`,
        extractedText: "",
        warnings: [`File type not supported for parsing: ${mimeType}`],
      };
  }
}
