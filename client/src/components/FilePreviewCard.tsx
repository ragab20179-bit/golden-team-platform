/**
 * FilePreviewCard — Collapsible card showing extracted file content below AI responses.
 * Shows file name, category, summary, and a collapsible extracted text preview.
 * Used in NEOChat to verify what NEO actually read from attached files.
 */
import { useState } from "react";
import {
  ChevronDown, ChevronUp, FileText, FileSpreadsheet, Image as ImageIcon,
  FileCode, File, Eye, Download, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileInfo {
  uploadId: string;
  fileName: string;
  mimeType: string;
  category: string;
  summary: string | null;
  extractedTextPreview: string;
  sizeBytes: number;
  fileUrl: string | null;
}

interface FilePreviewCardProps {
  files: FileInfo[];
  isRTL?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: typeof FileText; label: string; labelAr: string; colorClass: string }> = {
  pdf: { icon: FileText, label: "PDF Document", labelAr: "مستند PDF", colorClass: "text-red-400 bg-red-400/10 border-red-400/20" },
  word: { icon: FileText, label: "Word Document", labelAr: "مستند وورد", colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  excel: { icon: FileSpreadsheet, label: "Spreadsheet", labelAr: "جدول بيانات", colorClass: "text-green-400 bg-green-400/10 border-green-400/20" },
  csv: { icon: FileSpreadsheet, label: "CSV Data", labelAr: "بيانات CSV", colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
  image: { icon: ImageIcon, label: "Image", labelAr: "صورة", colorClass: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  text: { icon: FileText, label: "Text File", labelAr: "ملف نصي", colorClass: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
  markdown: { icon: FileCode, label: "Markdown", labelAr: "ماركداون", colorClass: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  xml: { icon: FileCode, label: "XML", labelAr: "XML", colorClass: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  json: { icon: FileCode, label: "JSON", labelAr: "JSON", colorClass: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  pptx: { icon: FileText, label: "Presentation", labelAr: "عرض تقديمي", colorClass: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  office_convert: { icon: FileText, label: "Office Document", labelAr: "مستند مكتبي", colorClass: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SingleFilePreview({ file, isRTL }: { file: FileInfo; isRTL?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[file.category] || { icon: File, label: file.category, labelAr: file.category, colorClass: "text-white/50 bg-white/5 border-white/10" };
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
      >
        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border ${config.colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white/90 truncate">{file.fileName}</div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span>{isRTL ? config.labelAr : config.label}</span>
            <span>·</span>
            <span>{formatBytes(file.sizeBytes)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {file.fileUrl && (
            <a
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              title={isRTL ? "تحميل" : "Download"}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-white/5 px-3 py-2.5 space-y-2">
          {/* Summary */}
          {file.summary && (
            <div className="text-[11px]">
              <span className="text-amber-400/80 font-medium">{isRTL ? "ملخص:" : "Summary:"}</span>
              <p className="text-white/60 mt-0.5 leading-relaxed">{file.summary}</p>
            </div>
          )}

          {/* Extracted text preview */}
          {file.extractedTextPreview && (
            <div className="text-[11px]">
              <span className="text-amber-400/80 font-medium">{isRTL ? "محتوى مستخرج:" : "Extracted Content:"}</span>
              <pre className="mt-1 text-white/50 leading-relaxed whitespace-pre-wrap font-mono text-[10px] max-h-48 overflow-y-auto bg-white/[0.02] rounded p-2 border border-white/5">
                {file.extractedTextPreview}
              </pre>
            </div>
          )}

          {/* No content extracted */}
          {!file.summary && !file.extractedTextPreview && (
            <div className="text-[10px] text-white/30 italic">
              {isRTL ? "لم يتم استخراج محتوى نصي" : "No text content extracted"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilePreviewCard({ files, isRTL }: FilePreviewCardProps) {
  const [showAll, setShowAll] = useState(false);

  if (!files || files.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {/* Section header */}
      <div className="flex items-center gap-1.5 text-[10px] text-white/30">
        <Eye className="w-3 h-3" />
        <span>
          {isRTL
            ? `NEO قرأ ${files.length} ملف${files.length > 1 ? "ات" : ""}`
            : `NEO read ${files.length} file${files.length > 1 ? "s" : ""}`
          }
        </span>
      </div>

      {/* File cards */}
      {(showAll ? files : files.slice(0, 3)).map(file => (
        <SingleFilePreview key={file.uploadId} file={file} isRTL={isRTL} />
      ))}

      {/* Show more button */}
      {files.length > 3 && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(true)}
          className="text-[10px] text-white/40 hover:text-white/60 h-6 px-2"
        >
          {isRTL ? `عرض ${files.length - 3} ملفات أخرى` : `Show ${files.length - 3} more files`}
        </Button>
      )}
    </div>
  );
}
