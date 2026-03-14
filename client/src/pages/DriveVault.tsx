/**
 * Drive Vault — Universal Document Repository
 * Bilingual Arabic/English. Supports PDF, Excel, CSV, Word, Markdown, JSON, Images.
 * Files are stored in S3, parsed server-side, and summarized by NEO AI.
 */
import { useState } from "react";
import {
  FolderOpen, Search, Download, Trash2, FileText, FileSpreadsheet,
  File, Image, Eye, Sparkles, Clock, User, ChevronRight, HardDrive,
  Filter, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import PortalLayout from "@/components/PortalLayout";
import FileUploadZone from "@/components/FileUploadZone";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

const FOLDER_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  all:         { en: "All Files",      ar: "جميع الملفات",    color: "text-white" },
  general:     { en: "General",        ar: "عام",             color: "text-white/60" },
  hr:          { en: "HR",             ar: "الموارد البشرية", color: "text-cyan-400" },
  erp:         { en: "ERP",            ar: "تخطيط الموارد",   color: "text-emerald-400" },
  crm:         { en: "CRM",            ar: "إدارة العملاء",   color: "text-violet-400" },
  kpi:         { en: "KPI",            ar: "مؤشرات الأداء",   color: "text-amber-400" },
  procurement: { en: "Procurement",    ar: "المشتريات",       color: "text-orange-400" },
  qms:         { en: "QMS",            ar: "الجودة",          color: "text-teal-400" },
  legal:       { en: "Legal",          ar: "الشؤون القانونية", color: "text-rose-400" },
  comms:       { en: "Comms",          ar: "الاتصالات",       color: "text-sky-400" },
  audit:       { en: "Audit",          ar: "التدقيق",         color: "text-slate-400" },
  governance:  { en: "Governance",     ar: "الحوكمة",         color: "text-red-400" },
  meetings:    { en: "Meetings",       ar: "الاجتماعات",      color: "text-blue-300" },
  "neo-core":  { en: "NEO Core",       ar: "محرك NEO",        color: "text-violet-300" },
  finance:     { en: "Finance",        ar: "المالية",         color: "text-yellow-400" },
  technical:   { en: "Technical",      ar: "التقني",          color: "text-indigo-400" },
};

const MIME_ICONS: Record<string, React.ReactNode> = {
  "application/pdf": <FileText className="w-5 h-5 text-red-400" />,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
  "application/vnd.ms-excel": <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
  "text/csv": <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": <FileText className="w-5 h-5 text-blue-400" />,
  "text/markdown": <FileText className="w-5 h-5 text-white/60" />,
  "text/plain": <FileText className="w-5 h-5 text-white/60" />,
  "application/json": <File className="w-5 h-5 text-amber-400" />,
};

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-400" />;
  return MIME_ICONS[mimeType] ?? <File className="w-5 h-5 text-white/40" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(date: Date, lang: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (lang === "ar") {
    if (days > 0) return `منذ ${days} يوم`;
    if (hours > 0) return `منذ ${hours} ساعة`;
    return `منذ ${minutes} دقيقة`;
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
}

interface VaultFileRow {
  id: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
  aiSummary?: string | null;
  parsedText?: string | null;
  parsedMeta?: unknown;
  s3Url: string;
  createdAt: Date;
  uploadedBy: number;
}

export default function DriveVault() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [activeFolder, setActiveFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [previewFile, setPreviewFile] = useState<VaultFileRow | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const utils = trpc.useUtils();

  const { data: files = [], isLoading, refetch } = trpc.vault.listFiles.useQuery(
    { folder: activeFolder === "all" ? undefined : activeFolder, limit: 100 },
    { refetchOnWindowFocus: false }
  );

  const { data: searchResults } = trpc.vault.searchFiles.useQuery(
    { query: searchQuery, folder: activeFolder === "all" ? undefined : activeFolder },
    { enabled: searchQuery.length > 1 }
  );

  const { data: downloadData, refetch: fetchDownload } = trpc.vault.getDownloadUrl.useQuery(
    { id: previewFile?.id ?? 0 },
    { enabled: false }
  );

  const deleteMutation = trpc.vault.deleteFile.useMutation({
    onSuccess: () => {
      utils.vault.listFiles.invalidate();
      toast.success(t("File deleted", "تم حذف الملف"));
    },
    onError: (err) => toast.error(err.message),
  });

  const displayFiles: VaultFileRow[] = searchQuery.length > 1 ? (searchResults ?? []) : (files ?? []);

  const handleDownload = async (file: VaultFileRow) => {
    setPreviewFile(file);
    const result = await utils.vault.getDownloadUrl.fetch({ id: file.id });
    if (result?.url) {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = file.originalName;
      a.target = "_blank";
      a.click();
    }
  };

  const handleDelete = (file: VaultFileRow) => {
    if (confirm(t(`Delete "${file.originalName}"?`, `حذف "${file.originalName}"؟`))) {
      deleteMutation.mutate({ id: file.id });
    }
  };

  const folderList = Object.entries(FOLDER_LABELS);

  return (
    <PortalLayout title={t("Drive Vault", "مستودع الملفات")} subtitle={t("Universal document repository — PDF, Excel, Word, CSV, and more", "مستودع المستندات الشامل — PDF، Excel، Word، CSV والمزيد")}>
      <div className="flex flex-col gap-6 h-full">

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg font-display">
                {t("Drive Vault", "مستودع الملفات")}
              </h1>
              <p className="text-white/40 text-xs">
                {displayFiles.length} {t("files", "ملف")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-white/20 text-white/60 hover:text-white bg-transparent"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
              className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold"
            >
              {showUpload ? t("Hide Upload", "إخفاء الرفع") : t("Upload Files", "رفع ملفات")}
            </Button>
          </div>
        </div>

        {/* Upload Zone (collapsible) */}
        {showUpload && (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <h3 className="text-amber-400 font-semibold text-sm mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              {t(`Upload to: ${FOLDER_LABELS[activeFolder]?.en ?? activeFolder}`, `رفع إلى: ${FOLDER_LABELS[activeFolder]?.ar ?? activeFolder}`)}
            </h3>
            <FileUploadZone
              folder={activeFolder === "all" ? "general" : activeFolder}
              onUploadComplete={() => {
                utils.vault.listFiles.invalidate();
                setShowUpload(false);
              }}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearchQuery(searchInput)}
            placeholder={t("Search files by name, content, or AI summary…", "ابحث في الملفات بالاسم أو المحتوى أو ملخص NEO…")}
            className="pl-9 bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-400/50"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setSearchQuery(""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex gap-6 flex-1 min-h-0">
          {/* Folder Sidebar */}
          <div className="hidden lg:flex flex-col gap-1 w-44 shrink-0">
            <p className="text-white/30 text-xs uppercase tracking-widest px-2 mb-2">
              {t("Folders", "المجلدات")}
            </p>
            {folderList.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveFolder(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                  activeFolder === key
                    ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${label.color}`} />
                <span className="truncate">{lang === "ar" ? label.ar : label.en}</span>
              </button>
            ))}
          </div>

          {/* File Grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile folder selector */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4">
              {folderList.slice(0, 8).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveFolder(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    activeFolder === key
                      ? "bg-amber-400/15 text-amber-400 border-amber-400/30"
                      : "text-white/50 border-white/15 hover:border-white/30"
                  }`}
                >
                  {lang === "ar" ? label.ar : label.en}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <HardDrive className="w-12 h-12 text-white/20 mb-4" />
                <p className="text-white/40 font-medium">
                  {searchQuery
                    ? t("No files match your search", "لا توجد ملفات تطابق بحثك")
                    : t("No files in this folder yet", "لا توجد ملفات في هذا المجلد بعد")}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 border-amber-400/30 text-amber-400 hover:bg-amber-400/10 bg-transparent"
                    onClick={() => setShowUpload(true)}
                  >
                    {t("Upload your first file", "ارفع أول ملف")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {displayFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group p-4 rounded-xl border border-white/10 bg-white/3 hover:bg-white/6 hover:border-amber-400/20 transition-all duration-200"
                  >
                    {/* File Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-white/40 text-xs">{formatBytes(file.sizeBytes)}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 border-white/15 ${FOLDER_LABELS[file.folder]?.color ?? "text-white/60"}`}
                          >
                            {lang === "ar"
                              ? FOLDER_LABELS[file.folder]?.ar ?? file.folder
                              : FOLDER_LABELS[file.folder]?.en ?? file.folder}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* AI Summary */}
                    {file.aiSummary && (
                      <div className="mb-3 p-2.5 rounded-lg bg-violet-500/8 border border-violet-400/15">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <span className="text-violet-400 text-[10px] font-medium uppercase tracking-wider">
                            {t("NEO Summary", "ملخص NEO")}
                          </span>
                        </div>
                        <p className="text-white/60 text-xs leading-relaxed line-clamp-3">
                          {file.aiSummary}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/30 text-xs">
                        <Clock className="w-3 h-3" />
                        {timeAgo(file.createdAt, lang)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          title={t("Preview", "معاينة")}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          title={t("Download", "تحميل")}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {(user?.role === "admin" || file.uploadedBy === user?.id) && (
                          <button
                            onClick={() => handleDelete(file)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                            title={t("Delete", "حذف")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="bg-[#0A0F1E] border-white/15 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getFileIcon(previewFile.mimeType)}
                <span className="truncate">{previewFile.originalName}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("Size", "الحجم"), value: formatBytes(previewFile.sizeBytes) },
                  { label: t("Type", "النوع"), value: previewFile.mimeType.split("/").pop()?.toUpperCase() ?? "—" },
                  { label: t("Folder", "المجلد"), value: lang === "ar" ? FOLDER_LABELS[previewFile.folder]?.ar : FOLDER_LABELS[previewFile.folder]?.en },
                  { label: t("Uploaded", "تاريخ الرفع"), value: new Date(previewFile.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB") },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-white/40 text-xs mb-1">{label}</p>
                    <p className="text-white text-sm font-medium">{value ?? "—"}</p>
                  </div>
                ))}
              </div>

              {/* AI Summary */}
              {previewFile.aiSummary && (
                <div className="p-4 rounded-xl bg-violet-500/8 border border-violet-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-400 text-sm font-semibold">
                      {t("NEO AI Summary", "ملخص NEO الذكي")}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{previewFile.aiSummary}</p>
                </div>
              )}

              {/* Parsed Text Preview */}
              {previewFile.parsedText && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-2">
                    {t("Content Preview", "معاينة المحتوى")}
                  </p>
                  <div className="p-3 rounded-lg bg-black/30 border border-white/10 max-h-48 overflow-y-auto">
                    <pre className="text-white/60 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                      {previewFile.parsedText.slice(0, 2000)}
                      {previewFile.parsedText.length > 2000 && "\n\n[...]"}
                    </pre>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleDownload(previewFile)}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("Download File", "تحميل الملف")}
                </Button>
                {(user?.role === "admin" || previewFile.uploadedBy === user?.id) && (
                  <Button
                    variant="outline"
                    onClick={() => { handleDelete(previewFile); setPreviewFile(null); }}
                    className="border-red-400/30 text-red-400 hover:bg-red-400/10 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PortalLayout>
  );
}
