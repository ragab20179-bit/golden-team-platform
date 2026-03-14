/**
 * UniversalFileUpload Component
 *
 * A production-grade file upload component supporting:
 *   - Drag & drop or click-to-browse
 *   - Multi-file queue with individual progress bars
 *   - Chunked upload (5 MB chunks) for large files up to 500 MB
 *   - Upload speed (MB/s) + ETA display
 *   - File type detection with colored category badges
 *   - Parse status: Uploading → Parsing → Ready
 *   - Extracted content preview (collapsible)
 *   - Cancel, retry, remove controls
 *   - Configurable accepted types, max size, and context tagging
 *   - Bilingual Arabic/English support
 *
 * Ported from khobar-building-ai-system with Golden Team adaptations.
 */
import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode2,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Eye,
  EyeOff,
  Zap,
  Clock,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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

export interface UploadedFile {
  id: string;
  file: File;
  category: FileCategory;
  uploadId?: string;
  status: "queued" | "uploading" | "parsing" | "complete" | "error" | "cancelled";
  progress: number; // 0–100
  speedMBps?: number;
  etaSeconds?: number;
  fileUrl?: string;
  fileKey?: string;
  parsedResult?: any;
  errorMessage?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface UniversalFileUploadProps {
  /** Called when a file finishes uploading and parsing */
  onFileReady?: (file: UploadedFile) => void;
  /** Called when all files in queue are complete */
  onAllComplete?: (files: UploadedFile[]) => void;
  /** Accepted file extensions (e.g. [".pdf", ".xlsx"]) — empty = all */
  acceptedTypes?: string[];
  /** Max file size in MB (default: 500) */
  maxSizeMB?: number;
  /** Context for organizing uploads */
  context?: "meeting" | "project" | "knowledge" | "vault" | "global";
  contextId?: number;
  /** Show extracted content preview panel */
  showPreview?: boolean;
  /** Compact mode (no labels, smaller padding) */
  compact?: boolean;
  /** Custom label for the drop zone */
  label?: string;
  /** Max number of files in queue */
  maxFiles?: number;
}

// ─── Category Config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  FileCategory,
  { label: string; labelAr: string; color: string; bgColor: string; icon: React.ReactNode; accept: string[] }
> = {
  pdf: {
    label: "PDF",
    labelAr: "PDF",
    color: "text-red-400",
    bgColor: "bg-red-500/10 border-red-500/20",
    icon: <FileText className="w-4 h-4" />,
    accept: [".pdf"],
  },
  excel: {
    label: "Excel",
    labelAr: "إكسل",
    color: "text-green-400",
    bgColor: "bg-green-500/10 border-green-500/20",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    accept: [".xlsx", ".xls", ".xlsm"],
  },
  csv: {
    label: "CSV",
    labelAr: "CSV",
    color: "text-teal-400",
    bgColor: "bg-teal-500/10 border-teal-500/20",
    icon: <FileSpreadsheet className="w-4 h-4" />,
    accept: [".csv"],
  },
  xml: {
    label: "XML",
    labelAr: "XML",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 border-orange-500/20",
    icon: <FileCode2 className="w-4 h-4" />,
    accept: [".xml"],
  },
  docx: {
    label: "Word",
    labelAr: "وورد",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    icon: <FileText className="w-4 h-4" />,
    accept: [".docx", ".doc"],
  },
  image: {
    label: "Image",
    labelAr: "صورة",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    icon: <FileImage className="w-4 h-4" />,
    accept: [".png", ".jpg", ".jpeg", ".webp", ".tiff", ".bmp", ".gif"],
  },
  dwg: {
    label: "CAD",
    labelAr: "CAD",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    icon: <FileCode2 className="w-4 h-4" />,
    accept: [".dwg", ".dxf"],
  },
  text: {
    label: "Text",
    labelAr: "نص",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
    icon: <FileText className="w-4 h-4" />,
    accept: [".txt", ".md", ".log", ".json"],
  },
  unknown: {
    label: "File",
    labelAr: "ملف",
    color: "text-muted-foreground",
    bgColor: "bg-muted/50 border-border",
    icon: <File className="w-4 h-4" />,
    accept: [],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

function detectCategory(file: File): FileCategory {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  for (const [cat, config] of Object.entries(CATEGORY_CONFIG)) {
    if (config.accept.includes(ext)) return cat as FileCategory;
  }
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("text/")) return "text";
  return "unknown";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatETA(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.ceil(seconds / 60)}m`;
}

async function readChunkAsBase64(file: File, start: number, end: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file.slice(start, end));
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UniversalFileUpload({
  onFileReady,
  onAllComplete,
  acceptedTypes = [],
  maxSizeMB = 500,
  context,
  contextId,
  showPreview = true,
  compact = false,
  label,
  maxFiles = 20,
}: UniversalFileUploadProps) {
  const { t } = useLanguage();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef<Set<string>>(new Set());

  const utils = trpc.useUtils();
  const initiateMutation = trpc.universalUpload.initiate.useMutation();
  const uploadChunkMutation = trpc.universalUpload.uploadChunk.useMutation();
  const finalizeMutation = trpc.universalUpload.finalize.useMutation();
  const cancelMutation = trpc.universalUpload.cancel.useMutation();

  const acceptString =
    acceptedTypes.length > 0
      ? acceptedTypes.join(",")
      : Object.values(CATEGORY_CONFIG)
          .flatMap((c) => c.accept)
          .join(",");

  // ─── Upload Logic ────────────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (fileEntry: UploadedFile) => {
      if (uploadingRef.current.has(fileEntry.id)) return;
      uploadingRef.current.add(fileEntry.id);

      const updateFile = (updates: Partial<UploadedFile>) => {
        setFiles((prev) => prev.map((f) => (f.id === fileEntry.id ? { ...f, ...updates } : f)));
      };

      try {
        const totalChunks = Math.ceil(fileEntry.file.size / CHUNK_SIZE);

        // Step 1: Initiate
        const { uploadId } = await initiateMutation.mutateAsync({
          fileName: fileEntry.file.name,
          mimeType: fileEntry.file.type || "application/octet-stream",
          fileSize: fileEntry.file.size,
          totalChunks,
          context,
          contextId,
        });
        updateFile({ uploadId, status: "uploading", startedAt: Date.now() });

        // Step 2: Upload chunks
        let uploadedBytes = 0;
        const startTime = Date.now();

        for (let i = 0; i < totalChunks; i++) {
          // Check if cancelled
          const current = files.find((f) => f.id === fileEntry.id);
          if (current?.status === "cancelled") {
            uploadingRef.current.delete(fileEntry.id);
            return;
          }

          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, fileEntry.file.size);
          const chunkData = await readChunkAsBase64(fileEntry.file, start, end);
          await uploadChunkMutation.mutateAsync({ uploadId, chunkIndex: i, chunkData });

          uploadedBytes += end - start;
          const elapsed = (Date.now() - startTime) / 1000;
          const speedMBps = elapsed > 0 ? uploadedBytes / 1024 / 1024 / elapsed : 0;
          const remainingBytes = fileEntry.file.size - uploadedBytes;
          const etaSeconds = speedMBps > 0 ? remainingBytes / 1024 / 1024 / speedMBps : 0;
          const progress = Math.round((uploadedBytes / fileEntry.file.size) * 85);
          updateFile({ progress, speedMBps, etaSeconds });
        }

        // Step 3: Finalize
        updateFile({ progress: 88, status: "parsing", speedMBps: undefined, etaSeconds: undefined });
        await finalizeMutation.mutateAsync({ uploadId });

        // Step 4: Poll for parse completion (60s timeout)
        let attempts = 0;
        const maxAttempts = 60;
        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
          try {
            const status = await utils.universalUpload.getStatus.fetch({ uploadId });
            updateFile({ progress: status.progress });
            if (status.status === "complete") {
              try {
                const result = await utils.universalUpload.getResult.fetch({ uploadId });
                updateFile({
                  status: "complete",
                  progress: 100,
                  fileUrl: result.fileUrl,
                  fileKey: result.fileKey,
                  parsedResult: result.parsedResult,
                  completedAt: Date.now(),
                });
                const completedFile: UploadedFile = {
                  ...fileEntry,
                  status: "complete",
                  fileUrl: result.fileUrl,
                  fileKey: result.fileKey,
                  parsedResult: result.parsedResult,
                };
                onFileReady?.(completedFile);
                toast.success(`${fileEntry.file.name} — ${t("Ready", "جاهز")}`);
              } catch {
                updateFile({
                  status: "complete",
                  progress: 100,
                  fileUrl: status.fileUrl,
                  fileKey: status.fileKey,
                  completedAt: Date.now(),
                });
              }
              break;
            } else if (status.status === "error") {
              updateFile({ status: "error", errorMessage: status.errorMessage || "Parse failed" });
              break;
            }
          } catch {
            // Polling error — continue
          }
          attempts++;
        }

        if (attempts >= maxAttempts) {
          updateFile({
            status: "error",
            errorMessage: t(
              "Parse timeout — file uploaded but analysis incomplete",
              "انتهت مهلة التحليل — تم الرفع لكن التحليل غير مكتمل"
            ),
          });
        }

        // Check if all files complete
        setFiles((prev) => {
          const allDone = prev.every((f) =>
            ["complete", "error", "cancelled"].includes(f.status)
          );
          if (allDone) {
            onAllComplete?.(prev);
          }
          return prev;
        });
      } catch (err: any) {
        updateFile({ status: "error", errorMessage: err.message || "Upload failed" });
        toast.error(`${fileEntry.file.name}: ${err.message}`);
      } finally {
        uploadingRef.current.delete(fileEntry.id);
      }
    },
    [
      initiateMutation,
      uploadChunkMutation,
      finalizeMutation,
      utils,
      context,
      contextId,
      onFileReady,
      onAllComplete,
      files,
      t,
    ]
  );

  // ─── File Queue Management ───────────────────────────────────────────────

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const maxSize = maxSizeMB * 1024 * 1024;
      const added: UploadedFile[] = [];

      for (const file of fileArray) {
        if (files.length + added.length >= maxFiles) {
          toast.error(t(`Maximum ${maxFiles} files allowed`, `الحد الأقصى ${maxFiles} ملفات`));
          break;
        }
        if (file.size > maxSize) {
          toast.error(
            t(`${file.name} exceeds ${maxSizeMB}MB limit`, `${file.name} يتجاوز الحد ${maxSizeMB}MB`)
          );
          continue;
        }
        if (acceptedTypes.length > 0) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();
          if (!acceptedTypes.includes(ext)) {
            toast.error(t(`${file.name}: unsupported type`, `${file.name}: نوع غير مدعوم`));
            continue;
          }
        }

        const entry: UploadedFile = {
          id: crypto.randomUUID(),
          file,
          category: detectCategory(file),
          status: "queued",
          progress: 0,
        };
        added.push(entry);
      }

      if (added.length > 0) {
        setFiles((prev) => [...prev, ...added]);
        // Start uploading each added file
        for (const entry of added) {
          setTimeout(() => uploadFile(entry), 0);
        }
      }
    },
    [files, maxFiles, maxSizeMB, acceptedTypes, uploadFile, t]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleCancel = async (file: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, status: "cancelled" } : f))
    );
    if (file.uploadId) {
      try {
        await cancelMutation.mutateAsync({ uploadId: file.uploadId });
      } catch {
        /* ignore */
      }
    }
  };

  const handleRetry = (file: UploadedFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, status: "queued", progress: 0, errorMessage: undefined } : f
      )
    );
    setTimeout(() => uploadFile(file), 0);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const togglePreview = (id: string) => {
    setExpandedPreviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Status Badge ────────────────────────────────────────────────────────

  const StatusBadge = ({ file }: { file: UploadedFile }) => {
    switch (file.status) {
      case "queued":
        return (
          <Badge variant="secondary" className="text-xs">
            {t("Queued", "في الانتظار")}
          </Badge>
        );
      case "uploading":
        return (
          <Badge className="text-xs bg-blue-500/20 text-blue-300 border-blue-500/30">
            {t("Uploading", "جاري الرفع")}
          </Badge>
        );
      case "parsing":
        return (
          <Badge className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
            {t("Parsing", "جاري التحليل")}
          </Badge>
        );
      case "complete":
        return (
          <Badge className="text-xs bg-green-500/20 text-green-300 border-green-500/30">
            {t("Ready", "جاهز")}
          </Badge>
        );
      case "error":
        return (
          <Badge className="text-xs bg-red-500/20 text-red-300 border-red-500/30">
            {t("Error", "خطأ")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="text-xs">
            {t("Cancelled", "ملغى")}
          </Badge>
        );
    }
  };

  // ─── File Row ────────────────────────────────────────────────────────────

  const FileRow = ({ file }: { file: UploadedFile }) => {
    const config = CATEGORY_CONFIG[file.category];
    const isExpanded = expandedPreviews.has(file.id);
    const hasPreview = file.status === "complete" && file.parsedResult;

    return (
      <div className={`rounded-lg border p-3 space-y-2 ${config.bgColor}`}>
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-sm font-medium text-foreground truncate max-w-[200px]"
                title={file.file.name}
              >
                {file.file.name}
              </span>
              <Badge variant="outline" className={`text-xs shrink-0 ${config.color}`}>
                {t(config.label, config.labelAr)}
              </Badge>
              <StatusBadge file={file} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatBytes(file.file.size)}
              {file.speedMBps !== undefined && file.status === "uploading" && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {file.speedMBps.toFixed(1)} MB/s
                  {file.etaSeconds !== undefined && (
                    <span className="ml-1 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatETA(file.etaSeconds)}
                    </span>
                  )}
                </span>
              )}
              {file.status === "complete" && file.completedAt && file.startedAt && (
                <span className="ml-2">
                  {t("Done in", "اكتمل في")} {((file.completedAt - file.startedAt) / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {hasPreview && showPreview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => togglePreview(file.id)}
                title={isExpanded ? t("Hide preview", "إخفاء المعاينة") : t("Show extracted content", "عرض المحتوى المستخرج")}
              >
                {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            )}
            {file.status === "error" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-amber-400"
                onClick={() => handleRetry(file)}
                title={t("Retry", "إعادة المحاولة")}
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            {["uploading", "parsing", "queued"].includes(file.status) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => handleCancel(file)}
                title={t("Cancel", "إلغاء")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
            {["complete", "error", "cancelled"].includes(file.status) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={() => handleRemove(file.id)}
                title={t("Remove", "إزالة")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {["uploading", "parsing"].includes(file.status) && (
          <div className="space-y-1">
            <Progress value={file.progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {file.status === "uploading"
                  ? t("Uploading...", "جاري الرفع...")
                  : t("Analyzing with AI...", "جاري التحليل بالذكاء الاصطناعي...")}
              </span>
              <span>{file.progress}%</span>
            </div>
          </div>
        )}

        {/* Error message */}
        {file.status === "error" && file.errorMessage && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {file.errorMessage}
          </div>
        )}

        {/* Complete indicator */}
        {file.status === "complete" && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            {file.parsedResult?.summary || t("File ready for use", "الملف جاهز للاستخدام")}
          </div>
        )}

        {/* Content preview (collapsible) */}
        {hasPreview && isExpanded && showPreview && (
          <div className="mt-2 border-t border-border/30 pt-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {t("Extracted Content", "المحتوى المستخرج")} — {file.parsedResult.summary}
            </div>
            <ScrollArea className="h-32 rounded bg-background/50 p-2">
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono">
                {file.parsedResult.extractedText?.slice(0, 2000) ||
                  t("[No text extracted]", "[لم يتم استخراج نص]")}
                {(file.parsedResult.extractedText?.length || 0) > 2000 &&
                  t(
                    "\n\n[Content truncated — full text available in AI context]",
                    "\n\n[المحتوى مقتطع — النص الكامل متاح في سياق الذكاء الاصطناعي]"
                  )}
              </pre>
            </ScrollArea>
            {file.parsedResult.headers && file.parsedResult.headers.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                {t("Columns:", "الأعمدة:")} {file.parsedResult.headers.slice(0, 8).join(", ")}
                {file.parsedResult.headers.length > 8 &&
                  ` +${file.parsedResult.headers.length - 8} ${t("more", "أكثر")}`}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const activeCount = files.filter((f) => ["uploading", "parsing"].includes(f.status)).length;
  const completeCount = files.filter((f) => f.status === "complete").length;

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-all cursor-pointer
          ${isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
          }
          ${compact ? "p-4" : "p-8"}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptString}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
          <div className={`rounded-full bg-primary/10 p-3 ${isDragging ? "bg-primary/20" : ""}`}>
            <Upload className={`${compact ? "w-5 h-5" : "w-7 h-7"} text-primary`} />
          </div>
          {!compact && (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {label || t("Drop files here or click to browse", "أسقط الملفات هنا أو انقر للاستعراض")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(
                    `PDF, Excel, CSV, XML, Word, Images, CAD/DXF, Text — up to ${maxSizeMB}MB each`,
                    `PDF، Excel، CSV، XML، Word، صور، CAD/DXF، نص — حتى ${maxSizeMB}MB لكل ملف`
                  )}
                </p>
              </div>
              {/* Supported type badges */}
              <div className="flex flex-wrap gap-1 justify-center">
                {(
                  ["pdf", "excel", "csv", "xml", "docx", "image", "dwg", "text"] as FileCategory[]
                ).map((cat) => (
                  <span
                    key={cat}
                    className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_CONFIG[cat].bgColor} ${CATEGORY_CONFIG[cat].color}`}
                  >
                    {t(CATEGORY_CONFIG[cat].label, CATEGORY_CONFIG[cat].labelAr)}
                  </span>
                ))}
              </div>
            </>
          )}
          {compact && (
            <p className="text-xs text-muted-foreground">
              {label || t(`Drop any file (max ${maxSizeMB}MB)`, `أسقط أي ملف (حد ${maxSizeMB}MB)`)}
            </p>
          )}
        </div>
        {/* Active upload indicator */}
        {activeCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary">
            <Loader2 className="w-3 h-3 animate-spin" />
            {activeCount} {t("uploading", "جاري الرفع")}
          </div>
        )}
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div className="space-y-2">
          {/* Summary bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {completeCount}/{files.length} {t("files ready", "ملفات جاهزة")}
              {activeCount > 0 && ` · ${activeCount} ${t("in progress", "قيد التنفيذ")}`}
            </span>
            {files.every((f) => ["complete", "error", "cancelled"].includes(f.status)) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs"
                onClick={() => setFiles([])}
              >
                {t("Clear all", "مسح الكل")}
              </Button>
            )}
          </div>
          {/* File rows */}
          <div className="space-y-2">
            {files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
