/**
 * Universal File Parser
 *
 * Extracts structured content from all supported file types:
 *   - PDF         → text + page count + metadata (+ Tesseract OCR fallback for scanned PDFs)
 *   - Excel/XLSX  → sheet names + tabular data (JSON rows)
 *   - CSV         → parsed rows + headers
 *   - XML         → flattened JSON structure
 *   - DOCX/DOC    → plain text via mammoth (DOC via LibreOffice → DOCX)
 *   - PPTX/PPT    → text extraction via LibreOffice headless → PDF → text
 *   - Images      → GPT-4 Vision description + Tesseract OCR (Arabic + English)
 *   - DWG/DXF     → entity list + layer names + drawing metadata
 *   - Pages/Numbers/Keynote → LibreOffice headless conversion → re-parse
 *   - ODT/ODS/ODP → LibreOffice headless conversion → re-parse
 *   - RTF         → LibreOffice headless conversion → DOCX → text
 *   - TXT/MD/JSON → raw text
 *
 * Ported from khobar-building-ai-system with Golden Team adaptations.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { invokeLLM } from "./_core/llm.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FileCategory =
  | "pdf"
  | "excel"
  | "csv"
  | "xml"
  | "docx"
  | "pptx"
  | "image"
  | "dwg"
  | "text"
  | "libreoffice"
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
  /** OCR text extracted via Tesseract */
  ocrText?: string;
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

  // PPTX/PPT — check before docx since both are OOXML
  if (
    [".pptx", ".ppt"].includes(ext) ||
    mime.includes("presentationml") ||
    mime.includes("powerpoint")
  )
    return "pptx";

  // Check docx BEFORE xml — OOXML MIME types contain "xml" as a substring
  if (
    [".docx", ".doc"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime.includes("word")
  )
    return "docx";
  if (ext === ".xml" || mime === "application/xml" || mime === "text/xml") return "xml";
  if (
    [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp", ".gif", ".heic", ".heif"].includes(ext) ||
    mime.startsWith("image/")
  )
    return "image";
  if ([".dwg", ".dxf"].includes(ext)) return "dwg";

  // Apple iWork + ODF + RTF → LibreOffice conversion
  if (
    [".pages", ".numbers", ".key", ".odt", ".ods", ".odp", ".rtf"].includes(ext) ||
    mime.includes("apple.pages") ||
    mime.includes("apple.numbers") ||
    mime.includes("apple.keynote") ||
    mime.includes("opendocument") ||
    mime === "application/rtf"
  )
    return "libreoffice";

  if (
    [".txt", ".md", ".log", ".json", ".js", ".ts", ".py", ".html", ".css"].includes(ext) ||
    mime.startsWith("text/")
  )
    return "text";
  return "unknown";
}

// ─── Tesseract OCR Helper ────────────────────────────────────────────────────

/**
 * Run Tesseract OCR on an image file with Arabic + English support.
 * Requires: tesseract-ocr, tesseract-ocr-ara installed on the system.
 */
async function runTesseractOCR(imagePath: string): Promise<string> {
  try {
    // Run Tesseract with both Arabic and English language packs
    const result = execSync(
      `tesseract "${imagePath}" stdout -l ara+eng --psm 3 2>/dev/null`,
      { encoding: "utf-8", timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim();
  } catch (err: any) {
    // Fallback to English only if Arabic pack fails
    try {
      const result = execSync(
        `tesseract "${imagePath}" stdout -l eng --psm 3 2>/dev/null`,
        { encoding: "utf-8", timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
      );
      return result.trim();
    } catch {
      return "";
    }
  }
}

/**
 * Preprocess image with sharp for better OCR accuracy:
 * - Convert to grayscale
 * - Increase contrast
 * - Resize if too small
 */
async function preprocessImageForOCR(inputPath: string): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const outputPath = inputPath + ".ocr-preprocessed.png";
    const metadata = await sharp(inputPath).metadata();
    let pipeline = sharp(inputPath).grayscale().normalize();

    // Upscale small images for better OCR
    if (metadata.width && metadata.width < 1000) {
      pipeline = pipeline.resize({ width: Math.max(metadata.width * 2, 1000), fit: "inside" });
    }

    await pipeline.png().toFile(outputPath);
    return outputPath;
  } catch {
    return inputPath; // fallback to original
  }
}

// ─── LibreOffice Conversion Helper ───────────────────────────────────────────

/**
 * Convert a file to a target format using LibreOffice headless.
 * Returns the path to the converted file.
 */
function libreOfficeConvert(inputPath: string, outputFormat: string): string | null {
  const outputDir = path.dirname(inputPath);
  try {
    execSync(
      `libreoffice --headless --convert-to ${outputFormat} --outdir "${outputDir}" "${inputPath}" 2>/dev/null`,
      { timeout: 120000 }
    );
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const convertedPath = path.join(outputDir, `${baseName}.${outputFormat}`);
    if (fs.existsSync(convertedPath)) return convertedPath;
    return null;
  } catch {
    return null;
  }
}

// ─── PDF Parser ───────────────────────────────────────────────────────────────

async function parsePDF(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let pageCount = 0;
  let ocrText = "";

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer, { max: 0 });
    extractedText = data.text || "";
    pageCount = data.numpages || 0;
  } catch (err: any) {
    warnings.push(`PDF parse warning: ${err.message}`);
    extractedText = "";
  }

  // Scanned PDF OCR fallback — if text extraction yields very little content
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50 && pageCount > 0) {
    warnings.push("Low text content detected — attempting Tesseract OCR on PDF pages");
    try {
      // Convert PDF pages to images using pdftoppm (poppler-utils)
      const tmpDir = `/tmp/pdf-ocr-${Date.now()}`;
      fs.mkdirSync(tmpDir, { recursive: true });
      const maxPages = Math.min(pageCount, 20); // Limit to 20 pages for performance
      execSync(
        `pdftoppm -png -r 300 -l ${maxPages} "${filePath}" "${tmpDir}/page" 2>/dev/null`,
        { timeout: 120000 }
      );
      const pageImages = fs.readdirSync(tmpDir)
        .filter(f => f.endsWith(".png"))
        .sort();

      const ocrParts: string[] = [];
      for (const img of pageImages) {
        const imgPath = path.join(tmpDir, img);
        const pageOcr = await runTesseractOCR(imgPath);
        if (pageOcr) ocrParts.push(`--- Page ${ocrParts.length + 1} ---\n${pageOcr}`);
      }
      ocrText = ocrParts.join("\n\n");

      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });

      if (ocrText.length > extractedText.length) {
        extractedText = ocrText;
        warnings.push(`OCR extracted ${ocrText.split(/\s+/).filter(Boolean).length} words from scanned pages`);
      }
    } catch (err: any) {
      warnings.push(`PDF OCR fallback warning: ${err.message}`);
    }
  }

  const finalWordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const fileSizeBytes = fs.statSync(filePath).size;
  const summary = `PDF document: ${pageCount} page(s), ~${finalWordCount.toLocaleString()} words extracted.${ocrText ? " (OCR applied)" : ""}`;

  return {
    category: "pdf",
    mimeType: "application/pdf",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    ocrText: ocrText ? ocrText.slice(0, 20000) : undefined,
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
  const ext = path.extname(fileName).toLowerCase();

  // .doc files → convert to .docx via LibreOffice first
  let docxPath = filePath;
  if (ext === ".doc") {
    const converted = libreOfficeConvert(filePath, "docx");
    if (converted) {
      docxPath = converted;
      warnings.push("Converted .doc to .docx via LibreOffice");
    } else {
      warnings.push("LibreOffice .doc conversion failed — attempting direct parse");
    }
  }

  try {
    const mammoth = await import("mammoth");
    const buffer = fs.readFileSync(docxPath);
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value || "";
    if (result.messages?.length) {
      warnings.push(...result.messages.map((m: any) => m.message));
    }
  } catch (err: any) {
    warnings.push(`DOCX parse warning: ${err.message}`);
    extractedText = "[DOCX text extraction failed]";
  }

  // Cleanup converted file
  if (docxPath !== filePath && fs.existsSync(docxPath)) {
    fs.unlinkSync(docxPath);
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

// ─── PPTX/PPT Parser ─────────────────────────────────────────────────────────

async function parsePPTX(filePath: string, fileName: string): Promise<ParsedFile> {
  const warnings: string[] = [];
  let extractedText = "";
  let pageCount = 0;

  // Convert to PDF via LibreOffice headless, then extract text from PDF
  const pdfPath = libreOfficeConvert(filePath, "pdf");
  if (pdfPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const buffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(buffer, { max: 0 });
      extractedText = data.text || "";
      pageCount = data.numpages || 0;
    } catch (err: any) {
      warnings.push(`PPTX→PDF text extraction warning: ${err.message}`);
    }
    // Cleanup
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
  } else {
    warnings.push("LibreOffice PPTX conversion failed");
    extractedText = "[PPTX text extraction failed — LibreOffice unavailable]";
  }

  const fileSizeBytes = fs.statSync(filePath).size;
  const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
  const summary = `PowerPoint presentation: ${pageCount} slide(s), ~${wordCount.toLocaleString()} words extracted.`;

  return {
    category: "pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    fileName,
    fileSizeBytes,
    summary,
    extractedText: extractedText.slice(0, 50000),
    pageCount,
    warnings,
  };
}

// ─── Image Parser (GPT-4 Vision + Tesseract OCR) ─────────────────────────────

async function parseImage(
  filePath: string,
  fileName: string,
  mimeType: string,
  fileUrl?: string
): Promise<ParsedFile> {
  const warnings: string[] = [];
  const fileSizeBytes = fs.statSync(filePath).size;
  let visionAnalysis = "";
  let ocrText = "";

  // 1. Tesseract OCR (always run — works offline, fast)
  try {
    const preprocessedPath = await preprocessImageForOCR(filePath);
    ocrText = await runTesseractOCR(preprocessedPath);
    // Cleanup preprocessed file
    if (preprocessedPath !== filePath && fs.existsSync(preprocessedPath)) {
      fs.unlinkSync(preprocessedPath);
    }
    if (ocrText) {
      warnings.push(`Tesseract OCR extracted ${ocrText.split(/\s+/).filter(Boolean).length} words`);
    }
  } catch (err: any) {
    warnings.push(`Tesseract OCR warning: ${err.message}`);
  }

  // 2. GPT-4 Vision analysis (requires S3 URL)
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

  // Combine both results — OCR text is more reliable for structured text,
  // Vision analysis is better for understanding context and visual elements
  const combinedText = [
    visionAnalysis ? `## GPT-4 Vision Analysis\n${visionAnalysis}` : "",
    ocrText ? `## Tesseract OCR Text\n${ocrText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const summary = `Image file (${mimeType}): ${(fileSizeBytes / 1024).toFixed(1)} KB. GPT-4 Vision + Tesseract OCR analysis completed.`;

  return {
    category: "image",
    mimeType,
    fileName,
    fileSizeBytes,
    summary,
    extractedText: combinedText.slice(0, 50000),
    visionAnalysis,
    ocrText: ocrText || undefined,
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

// ─── LibreOffice Conversion Parser (Pages, Numbers, Keynote, ODT, ODS, ODP, RTF) ──

async function parseLibreOffice(
  filePath: string,
  fileName: string,
  mimeType: string
): Promise<ParsedFile> {
  const warnings: string[] = [];
  const ext = path.extname(fileName).toLowerCase();
  const fileSizeBytes = fs.statSync(filePath).size;

  // Determine target conversion format based on source type
  let targetFormat: string;
  let reParseCategory: FileCategory;

  switch (ext) {
    case ".pages":
    case ".odt":
    case ".rtf":
      targetFormat = "docx";
      reParseCategory = "docx";
      break;
    case ".numbers":
    case ".ods":
      targetFormat = "xlsx";
      reParseCategory = "excel";
      break;
    case ".key":
    case ".odp":
      targetFormat = "pdf";
      reParseCategory = "pptx"; // We'll parse the PDF
      break;
    default:
      targetFormat = "pdf";
      reParseCategory = "text";
  }

  const convertedPath = libreOfficeConvert(filePath, targetFormat);
  if (!convertedPath) {
    return {
      category: "libreoffice",
      mimeType,
      fileName,
      fileSizeBytes,
      summary: `${ext.toUpperCase()} file: LibreOffice conversion failed.`,
      extractedText: `[Conversion of ${ext} file failed — LibreOffice unavailable or file corrupted]`,
      warnings: [`LibreOffice conversion to ${targetFormat} failed for ${fileName}`],
    };
  }

  warnings.push(`Converted ${ext} → .${targetFormat} via LibreOffice`);

  // Re-parse the converted file using the appropriate parser
  let result: ParsedFile;
  try {
    switch (reParseCategory) {
      case "docx":
        result = await parseDOCX(convertedPath, fileName.replace(ext, `.${targetFormat}`));
        break;
      case "excel":
        result = await parseExcel(convertedPath, fileName.replace(ext, `.${targetFormat}`));
        break;
      default: {
        // For PDF conversions (Keynote, ODP)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const buffer = fs.readFileSync(convertedPath);
        const data = await pdfParse(buffer, { max: 0 });
        result = {
          category: "pptx",
          mimeType,
          fileName,
          fileSizeBytes,
          summary: `Presentation (${ext}): ${data.numpages || 0} slide(s), ~${(data.text || "").split(/\s+/).filter(Boolean).length} words.`,
          extractedText: (data.text || "").slice(0, 50000),
          pageCount: data.numpages || 0,
          warnings: [],
        };
        break;
      }
    }
  } catch (err: any) {
    warnings.push(`Re-parse warning: ${err.message}`);
    result = {
      category: "libreoffice",
      mimeType,
      fileName,
      fileSizeBytes,
      summary: `${ext.toUpperCase()} file converted but re-parse failed.`,
      extractedText: "[Re-parse of converted file failed]",
      warnings,
    };
  }

  // Cleanup converted file
  if (fs.existsSync(convertedPath)) fs.unlinkSync(convertedPath);

  // Override category to reflect original file type
  result.category = "libreoffice";
  result.warnings = [...warnings, ...result.warnings];
  result.fileSizeBytes = fileSizeBytes;

  return result;
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
    case "pptx":
      return parsePPTX(filePath, fileName);
    case "image":
      return parseImage(filePath, fileName, mimeType, fileUrl);
    case "dwg":
      return parseDWG(filePath, fileName);
    case "libreoffice":
      return parseLibreOffice(filePath, fileName, mimeType);
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
