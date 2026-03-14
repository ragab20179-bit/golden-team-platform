/**
 * BulkImportDialog — Universal CSV/Excel Bulk Import Wizard
 *
 * Ported from khobar-building-ai-system/KnowledgeBulkImport.tsx
 * Adapted for Golden Team modules: HR, KPI, Procurement
 *
 * Steps:
 *   1. Upload  — drop a CSV or Excel file
 *   2. Map     — map CSV columns → target fields
 *   3. Preview — review first 10 rows + validation summary
 *   4. Import  — batch import with progress
 *   5. Done    — success/error report
 */
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FileSpreadsheet,
  RotateCcw,
  Download,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportStep = "upload" | "map" | "preview" | "importing" | "done";

interface ParsedRow {
  [key: string]: string;
}

interface FieldMapping {
  [targetField: string]: string; // targetField → csvColumn
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

export interface TargetField {
  key: string;
  labelEn: string;
  labelAr: string;
  required: boolean;
  type: "text" | "number" | "date" | "enum";
  hint?: string;
  enumValues?: string[];
}

export interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Module name for display */
  moduleEn: string;
  moduleAr: string;
  /** Target fields to map CSV columns to */
  fields: TargetField[];
  /** Template CSV content (header row + 1 example row) */
  templateCsv: string;
  /** Template filename */
  templateFilename: string;
  /** Called with parsed + mapped rows for the actual import */
  onImport: (rows: Record<string, unknown>[]) => Promise<{ imported: number; failed: number; errors?: string[] }>;
  /** Called after successful import */
  onSuccess?: () => void;
}

// ─── CSV/Excel Parser (client-side) ──────────────────────────────────────────

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const row: ParsedRow = {};
    headers.forEach((h, j) => { row[h] = cells[j] ?? ""; });
    rows.push(row);
  }
  return { headers, rows };
}

async function parseFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    const text = await file.text();
    return parseCSV(text);
  }
  if (ext === "xlsx" || ext === "xls") {
    // Use SheetJS if available, otherwise fall back to CSV parse attempt
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_csv(ws);
      return parseCSV(data);
    } catch {
      throw new Error("Excel parsing requires the xlsx package. Please use CSV format.");
    }
  }
  throw new Error(`Unsupported file type: .${ext}. Please use CSV or Excel.`);
}

// ─── Auto-mapping helper ──────────────────────────────────────────────────────

function autoMap(fields: TargetField[], headers: string[]): FieldMapping {
  const mapping: FieldMapping = {};
  for (const field of fields) {
    const target = [field.key, field.labelEn, field.labelAr].map((s) => s.toLowerCase());
    const match = headers.find((h) =>
      target.some((t) => h.toLowerCase().includes(t) || t.includes(h.toLowerCase()))
    );
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BulkImportDialog({
  open,
  onOpenChange,
  moduleEn,
  moduleAr,
  fields,
  templateCsv,
  templateFilename,
  onImport,
  onSuccess,
}: BulkImportDialogProps) {
  const { t, lang } = useLanguage();
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<ParsedRow[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // ─── File handling ────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setIsParsingFile(true);
    try {
      const { headers, rows } = await parseFile(file);
      if (headers.length === 0) throw new Error("No columns found in file");
      if (rows.length === 0) throw new Error("No data rows found in file");
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMapping = autoMap(fields, headers);
      setFieldMapping(autoMapping);
      setStep("map");
      toast.success(t(`Loaded ${rows.length} rows`, `تم تحميل ${rows.length} صف`));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsParsingFile(false);
    }
  }, [fields, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ─── Build import entries ─────────────────────────────────────────────────

  const buildEntries = useCallback(() => {
    const entries: Record<string, unknown>[] = [];
    const errors: string[] = [];
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const entry: Record<string, unknown> = {};
      for (const field of fields) {
        const col = fieldMapping[field.key];
        if (!col) {
          if (field.required) errors.push(t(`Row ${i + 2}: missing required field "${field.labelEn}"`, `الصف ${i + 2}: الحقل المطلوب "${field.labelAr}" غير محدد`));
          continue;
        }
        const raw = row[col]?.trim() ?? "";
        if (field.required && !raw) {
          errors.push(t(`Row ${i + 2}: "${field.labelEn}" is empty`, `الصف ${i + 2}: "${field.labelAr}" فارغ`));
          continue;
        }
        if (field.type === "number") {
          entry[field.key] = raw ? (parseFloat(raw) || raw) : undefined;
        } else if (field.type === "enum" && field.enumValues) {
          const normalized = field.enumValues.find((v) => v.toLowerCase() === raw.toLowerCase());
          if (!normalized && field.required) {
            errors.push(t(`Row ${i + 2}: invalid value "${raw}" for "${field.labelEn}"`, `الصف ${i + 2}: قيمة غير صالحة "${raw}" في "${field.labelAr}"`));
            continue;
          }
          entry[field.key] = normalized ?? raw;
        } else {
          entry[field.key] = raw || undefined;
        }
      }
      const hasAllRequired = fields.filter((f) => f.required).every((f) => entry[f.key]);
      if (hasAllRequired) entries.push(entry);
    }
    return { entries, errors };
  }, [csvRows, fieldMapping, fields, t]);

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleImport = async () => {
    const { entries, errors } = buildEntries();
    if (entries.length === 0) {
      toast.error(t("No valid entries to import — check field mapping", "لا توجد إدخالات صالحة — تحقق من تعيين الحقول"));
      return;
    }
    setStep("importing");
    setImportProgress(0);
    const BATCH_SIZE = 50;
    let imported = 0;
    let failed = 0;
    const allErrors: string[] = [...errors];
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      try {
        const result = await onImport(batch);
        imported += result.imported;
        failed += result.failed;
        if (result.errors) allErrors.push(...result.errors);
      } catch (err: unknown) {
        failed += batch.length;
        allErrors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
      setImportProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / entries.length) * 100)));
    }
    setImportResult({ imported, failed, errors: allErrors });
    setStep("done");
    if (imported > 0) {
      toast.success(t(`Imported ${imported} records`, `تم استيراد ${imported} سجل`));
      onSuccess?.();
    }
  };

  // ─── Reset ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setFieldMapping({});
    setImportResult(null);
    setImportProgress(0);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // ─── Template download ────────────────────────────────────────────────────

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewRows = csvRows.slice(0, 10);
  const { entries: validEntries, errors: validationErrors } =
    step === "preview" ? buildEntries() : { entries: [], errors: [] };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            {t(`Bulk Import — ${moduleEn}`, `استيراد جماعي — ${moduleAr}`)}
          </DialogTitle>
          <DialogDescription className="text-white/40">
            {t(
              "Upload a CSV or Excel file to import multiple records at once.",
              "ارفع ملف CSV أو Excel لاستيراد سجلات متعددة دفعة واحدة."
            )}{" "}
            <button className="text-emerald-400 underline" onClick={downloadTemplate}>
              {t("Download template", "تحميل القالب")}
            </button>
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {(["upload", "map", "preview", "importing", "done"] as ImportStep[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors
                ${step === s ? "bg-emerald-500 text-white" : 
                  (["upload","map","preview","importing","done"].indexOf(step) > i) ? "bg-emerald-500/30 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                {i + 1}
              </div>
              {i < 4 && <div className="w-6 h-px bg-white/10" />}
            </div>
          ))}
          <span className="ml-2 text-xs text-white/40 capitalize">{step}</span>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="py-2 pr-2">

            {/* ── Step 1: Upload ── */}
            {step === "upload" && (
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer
                  ${isDragging ? "border-emerald-400 bg-emerald-400/5" : "border-white/10 hover:border-white/20"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("bulk-file-input")?.click()}
              >
                <input id="bulk-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
                {isParsingFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                    <p className="text-white/60">{t("Parsing file...", "جارٍ تحليل الملف...")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <FileSpreadsheet className="w-12 h-12 text-white/20" />
                    <p className="text-white/60 text-sm">
                      {t("Drop your CSV or Excel file here, or click to browse", "اسحب ملف CSV أو Excel هنا، أو انقر للتصفح")}
                    </p>
                    <div className="flex gap-2">
                      <Badge className="border border-white/10 bg-white/5 text-white/40">.csv</Badge>
                      <Badge className="border border-white/10 bg-white/5 text-white/40">.xlsx</Badge>
                      <Badge className="border border-white/10 bg-white/5 text-white/40">.xls</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="border-white/10 text-white/50 bg-transparent mt-2" onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}>
                      <Download className="w-3 h-3 mr-1" /> {t("Download Template", "تحميل القالب")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 2: Map ── */}
            {step === "map" && (
              <div className="space-y-4">
                <p className="text-sm text-white/50">
                  {t(`Map your ${csvHeaders.length} CSV columns to the target fields. ${csvRows.length} rows detected.`,
                     `عيّن أعمدة CSV الـ ${csvHeaders.length} على الحقول المستهدفة. تم اكتشاف ${csvRows.length} صف.`)}
                </p>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.key} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/5">
                      <div className="w-40 shrink-0">
                        <div className="text-xs font-medium text-white">
                          {lang === "ar" ? field.labelAr : field.labelEn}
                          {field.required && <span className="text-rose-400 ml-1">*</span>}
                        </div>
                        {field.hint && <div className="text-[10px] text-white/30 mt-0.5">{field.hint}</div>}
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/20 shrink-0" />
                      <Select
                        value={fieldMapping[field.key] ?? ""}
                        onValueChange={(val) => setFieldMapping((prev) => ({ ...prev, [field.key]: val === "__none__" ? "" : val }))}
                      >
                        <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white text-xs h-8">
                          <SelectValue placeholder={t("Select column...", "اختر عموداً...")} />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0A0F1E] border-white/10">
                          <SelectItem value="__none__" className="text-white/40 text-xs">{t("— skip —", "— تخطي —")}</SelectItem>
                          {csvHeaders.map((h) => (
                            <SelectItem key={h} value={h} className="text-white text-xs">{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldMapping[field.key] ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : field.required ? (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Step 3: Preview ── */}
            {step === "preview" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={`border ${validEntries.length > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                    {validEntries.length} {t("valid rows", "صف صالح")}
                  </Badge>
                  {validationErrors.length > 0 && (
                    <Badge className="border border-amber-500/30 bg-amber-500/10 text-amber-300">
                      {validationErrors.length} {t("warnings", "تحذير")}
                    </Badge>
                  )}
                </div>
                {validationErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1">
                    {validationErrors.slice(0, 5).map((e, i) => (
                      <div key={i} className="text-xs text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {e}
                      </div>
                    ))}
                    {validationErrors.length > 5 && (
                      <div className="text-xs text-amber-300/60">+{validationErrors.length - 5} more warnings</div>
                    )}
                  </div>
                )}
                <div className="overflow-x-auto rounded-lg border border-white/5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/3">
                        {fields.filter((f) => fieldMapping[f.key]).map((f) => (
                          <th key={f.key} className="px-3 py-2 text-left text-white/50 font-medium whitespace-nowrap">
                            {lang === "ar" ? f.labelAr : f.labelEn}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/2">
                          {fields.filter((f) => fieldMapping[f.key]).map((f) => (
                            <td key={f.key} className="px-3 py-2 text-white/70 max-w-[200px] truncate">
                              {row[fieldMapping[f.key]] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 10 && (
                  <p className="text-xs text-white/30 text-center">
                    {t(`Showing first 10 of ${csvRows.length} rows`, `عرض أول 10 من ${csvRows.length} صف`)}
                  </p>
                )}
              </div>
            )}

            {/* ── Step 4: Importing ── */}
            {step === "importing" && (
              <div className="flex flex-col items-center gap-6 py-8">
                <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-white/50 mb-2">
                    <span>{t("Importing...", "جارٍ الاستيراد...")}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${importProgress}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 5: Done ── */}
            {step === "done" && importResult && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">
                      {t("Import Complete", "اكتمل الاستيراد")}
                    </div>
                    <div className="text-sm text-white/50">
                      {importResult.imported} {t("records imported", "سجل مستورد")}
                      {importResult.failed > 0 && `, ${importResult.failed} ${t("failed", "فشل")}`}
                    </div>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-1">
                    <div className="text-xs font-semibold text-rose-300 mb-2">{t("Errors", "الأخطاء")}</div>
                    {importResult.errors.slice(0, 8).map((e, i) => (
                      <div key={i} className="text-xs text-rose-300/70 flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                        {e}
                      </div>
                    ))}
                    {importResult.errors.length > 8 && (
                      <div className="text-xs text-rose-300/40">+{importResult.errors.length - 8} more errors</div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center gap-2 pt-4 border-t border-white/5">
          {step !== "done" && step !== "importing" && (
            <Button variant="outline" onClick={handleReset} className="border-white/10 text-white/50 bg-transparent">
              <RotateCcw className="w-3 h-3 mr-1" /> {t("Reset", "إعادة تعيين")}
            </Button>
          )}
          <div className="flex-1" />
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose} className="border-white/10 text-white/50 bg-transparent">
              {t("Cancel", "إلغاء")}
            </Button>
          )}
          {step === "map" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")} className="border-white/10 text-white/50 bg-transparent">
                {t("Back", "رجوع")}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={() => setStep("preview")}
                disabled={fields.filter((f) => f.required).some((f) => !fieldMapping[f.key])}
              >
                {t("Preview", "معاينة")} <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("map")} className="border-white/10 text-white/50 bg-transparent">
                {t("Back", "رجوع")}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={handleImport}
                disabled={validEntries.length === 0}
              >
                {t(`Import ${validEntries.length} Records`, `استيراد ${validEntries.length} سجل`)}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </>
          )}
          {step === "done" && (
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleClose}>
              {t("Close", "إغلاق")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
