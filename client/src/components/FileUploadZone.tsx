/**
 * FileUploadZone — Reusable drag-and-drop file upload component.
 * Supports PDF, Excel, CSV, Word, Markdown, JSON, images, and plain text.
 * Converts file to base64 and calls trpc.vault.uploadFile.
 */
import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText, FileSpreadsheet, File, Image, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const MAX_SIZE_BYTES = 16 * 1024 * 1024; // 16MB

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel",
  "application/vnd.ms-excel": "Excel",
  "text/csv": "CSV",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word",
  "application/msword": "Word",
  "text/markdown": "Markdown",
  "text/plain": "Text",
  "application/json": "JSON",
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/webp": "WebP",
};

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
  if (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType === "text/csv")
    return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-400" />;
  return <File className="w-5 h-5 text-white/60" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  errorMsg?: string;
  resultId?: number;
}

interface FileUploadZoneProps {
  folder?: string;
  onUploadComplete?: (fileId: number, filename: string) => void;
  compact?: boolean;
  className?: string;
}

export default function FileUploadZone({
  folder = "general",
  onUploadComplete,
  compact = false,
  className = "",
}: FileUploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.vault.uploadFile.useMutation();

  const processFile = useCallback(
    async (file: File) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Validate type
      if (!ACCEPTED_TYPES[file.type] && !file.name.match(/\.(pdf|xlsx|xls|csv|docx|doc|md|txt|json|png|jpg|jpeg|webp)$/i)) {
        toast.error(t(`File type not supported: ${file.name}`, `نوع الملف غير مدعوم: ${file.name}`));
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(t(`File too large (max 16MB): ${file.name}`, `الملف كبير جداً (الحد 16MB): ${file.name}`));
        return;
      }

      const uploadFile: UploadedFile = {
        id,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        status: "uploading",
        progress: 10,
      };

      setFiles((prev) => [...prev, uploadFile]);

      try {
        // Read as base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data URL prefix (data:mime;base64,)
            resolve(result.split(",")[1] ?? "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress: 50 } : f))
        );

        const result = await uploadMutation.mutateAsync({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          base64Data,
          folder: folder as Parameters<typeof uploadMutation.mutateAsync>[0]["folder"],
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "done", progress: 100, resultId: result.id } : f
          )
        );

        toast.success(t(`${file.name} uploaded successfully`, `تم رفع ${file.name} بنجاح`));
        onUploadComplete?.(result.id, file.name);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "error", progress: 0, errorMsg: msg } : f
          )
        );
        toast.error(t(`Upload failed: ${file.name}`, `فشل الرفع: ${file.name}`));
      }
    },
    [folder, uploadMutation, onUploadComplete, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      Array.from(e.dataTransfer.files).forEach(processFile);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files ?? []).forEach(processFile);
      e.target.value = "";
    },
    [processFile]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${compact ? "p-4" : "p-8"}
          ${isDragging
            ? "border-amber-400 bg-amber-400/10 scale-[1.01]"
            : "border-white/20 bg-white/3 hover:border-amber-400/50 hover:bg-amber-400/5"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.md,.txt,.json,.png,.jpg,.jpeg,.webp"
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
          <div className={`rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center ${compact ? "w-10 h-10" : "w-14 h-14"}`}>
            <Upload className={`text-amber-400 ${compact ? "w-5 h-5" : "w-6 h-6"}`} />
          </div>
          {!compact && (
            <>
              <div>
                <p className="text-white font-medium text-sm">
                  {t("Drop files here or click to browse", "أسقط الملفات هنا أو انقر للتصفح")}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {t("PDF, Excel, CSV, Word, Markdown, JSON, Images — Max 16MB", "PDF، Excel، CSV، Word، Markdown، JSON، صور — الحد الأقصى 16MB")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 bg-transparent pointer-events-auto"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                {t("Browse Files", "تصفح الملفات")}
              </Button>
            </>
          )}
          {compact && (
            <p className="text-white/50 text-xs">
              {t("Drop or click to upload", "أسقط أو انقر للرفع")}
            </p>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
            >
              {getFileIcon(file.mimeType)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white text-sm font-medium truncate">{file.name}</p>
                  <span className="text-white/40 text-xs shrink-0">{formatBytes(file.size)}</span>
                </div>
                {file.status === "uploading" && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={file.progress} className="h-1 flex-1" />
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin shrink-0" />
                  </div>
                )}
                {file.status === "done" && (
                  <p className="text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("Uploaded — parsing in background", "تم الرفع — جاري التحليل في الخلفية")}
                  </p>
                )}
                {file.status === "error" && (
                  <p className="text-red-400 text-xs mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {file.errorMsg ?? t("Upload failed", "فشل الرفع")}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeFile(file.id)}
                className="text-white/30 hover:text-white/70 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
