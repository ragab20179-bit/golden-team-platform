/**
 * BulkAnalysisDialog — Modal for uploading multiple files and running structured analysis.
 * Supports: comparison, summary, contract review, tender evaluation.
 * Integrates with universalUpload pipeline and neoChat.bulkAnalyze procedure.
 */
import { useState, useRef, useCallback } from "react";
import {
  FileSearch, Upload, X, Loader2, FileText, FileSpreadsheet,
  Image as ImageIcon, File, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface BulkAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL?: boolean;
}

interface PendingFile {
  id: string;
  file: File;
  uploadId?: string;
  status: "uploading" | "parsing" | "ready" | "error";
  errorMessage?: string;
}

const ANALYSIS_TYPES = [
  { value: "summary", labelEn: "Summary", labelAr: "ملخص", descEn: "Comprehensive summary of all documents", descAr: "ملخص شامل لجميع المستندات" },
  { value: "comparison", labelEn: "Comparison", labelAr: "مقارنة", descEn: "Compare documents side by side", descAr: "مقارنة المستندات جنبًا إلى جنب" },
  { value: "contract_review", labelEn: "Contract Review", labelAr: "مراجعة العقود", descEn: "Legal review with risk ratings", descAr: "مراجعة قانونية مع تصنيف المخاطر" },
  { value: "tender_evaluation", labelEn: "Tender Evaluation", labelAr: "تقييم العطاءات", descEn: "Evaluate bid/tender submissions", descAr: "تقييم العروض والمناقصات" },
];

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.json,.xml,.pptx,.pages,.numbers,.odt,.rtf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff";

const CATEGORY_ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  word: FileText,
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  image: ImageIcon,
  text: FileText,
};

export default function BulkAnalysisDialog({ open, onOpenChange, isRTL }: BulkAnalysisDialogProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [analysisType, setAnalysisType] = useState("summary");
  const [customPrompt, setCustomPrompt] = useState("");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const bulkAnalyzeMutation = trpc.neoChat.bulkAnalyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setIsAnalyzing(false);
    },
    onError: (err) => {
      toast.error(err.message);
      setIsAnalyzing(false);
    },
  });

  const uploadFile = useCallback(async (file: File, localId: string) => {
    try {
      const client = utils.client;

      // 1. Initiate upload
      const CHUNK_SIZE = 512 * 1024;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const initiated = await client.universalUpload.initiate.mutate({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        totalChunks,
      });
      const { uploadId } = initiated;
      setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, uploadId, status: "uploading" } : f));

      // 2. Chunk upload
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = bytes.slice(start, end);
        const base64 = btoa(Array.from(chunk).map(b => String.fromCharCode(b)).join(""));
        await client.universalUpload.uploadChunk.mutate({ uploadId, chunkIndex: i, chunkData: base64 });
      }

      // 3. Finalize
      await client.universalUpload.finalize.mutate({ uploadId });
      setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, status: "parsing" } : f));

      // 4. Poll for parsing completion
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 1000));
        const status = await client.universalUpload.getStatus.query({ uploadId });
        if (status.status === "complete") {
          setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, status: "ready" } : f));
          return;
        }
        if (status.status === "error") {
          setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, status: "error", errorMessage: status.errorMessage } : f));
          return;
        }
      }
      setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, status: "error", errorMessage: "Parsing timed out" } : f));
    } catch (err: any) {
      setPendingFiles(prev => prev.map(f => f.id === localId ? { ...f, status: "error", errorMessage: err.message } : f));
    }
  }, [utils]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      status: "uploading" as const,
    }));
    setPendingFiles(prev => [...prev, ...newFiles]);
    newFiles.forEach(f => uploadFile(f.file, f.id));
  }, [uploadFile]);

  const removeFile = (id: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== id));
  };

  const readyFiles = pendingFiles.filter(f => f.status === "ready" && f.uploadId);
  const isUploading = pendingFiles.some(f => f.status === "uploading" || f.status === "parsing");

  const handleAnalyze = () => {
    if (readyFiles.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    bulkAnalyzeMutation.mutate({
      uploadIds: readyFiles.map(f => f.uploadId!),
      analysisType: analysisType as any,
      customPrompt: customPrompt.trim() || undefined,
    });
  };

  const handleReset = () => {
    setPendingFiles([]);
    setAnalysisResult(null);
    setCustomPrompt("");
    setIsAnalyzing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#0A0F1E] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <FileSearch className="w-5 h-5 text-amber-400" />
            {isRTL ? "تحليل المستندات" : "Analyse Documents"}
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {isRTL
              ? "ارفع عدة ملفات واحصل على تقرير تحليل منظم"
              : "Upload multiple files and get a structured analysis report"
            }
          </DialogDescription>
        </DialogHeader>

        {/* Analysis result view */}
        {analysisResult ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
              <div className="text-xs text-amber-400/70 mb-2 font-medium">
                {isRTL ? "نتيجة التحليل" : "Analysis Result"} — {ANALYSIS_TYPES.find(t => t.value === analysisType)?.[isRTL ? "labelAr" : "labelEn"]}
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <Streamdown>{analysisResult}</Streamdown>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" className="border-white/20 text-white/70 bg-transparent hover:bg-white/10">
                {isRTL ? "تحليل جديد" : "New Analysis"}
              </Button>
              <Button onClick={() => onOpenChange(false)} className="bg-amber-500 hover:bg-amber-400 text-[#05080F]">
                {isRTL ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File upload area */}
            <div
              className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-amber-400/30 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={e => { e.preventDefault(); e.stopPropagation(); handleFileSelect(e.dataTransfer.files); }}
            >
              <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <div className="text-sm text-white/50">
                {isRTL ? "اسحب الملفات هنا أو انقر للاختيار" : "Drag files here or click to select"}
              </div>
              <div className="text-[10px] text-white/25 mt-1">
                PDF, Word, Excel, CSV, Images, PowerPoint, Pages, Numbers, and more
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={e => handleFileSelect(e.target.files)}
              />
            </div>

            {/* Pending files list */}
            {pendingFiles.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {pendingFiles.map(pf => (
                  <div key={pf.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                    {pf.status === "ready" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : pf.status === "error" ? (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/80 truncate">{pf.file.name}</div>
                      <div className="text-[10px] text-white/30">
                        {pf.status === "uploading" && (isRTL ? "جاري الرفع..." : "Uploading...")}
                        {pf.status === "parsing" && (isRTL ? "جاري التحليل..." : "Parsing...")}
                        {pf.status === "ready" && (isRTL ? "جاهز" : "Ready")}
                        {pf.status === "error" && (pf.errorMessage || (isRTL ? "خطأ" : "Error"))}
                      </div>
                    </div>
                    <button onClick={() => removeFile(pf.id)} className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/60">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Analysis type selector */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 font-medium">
                {isRTL ? "نوع التحليل" : "Analysis Type"}
              </label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10">
                  {ANALYSIS_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white/80 focus:bg-white/10 focus:text-white">
                      <div>
                        <div className="text-sm">{isRTL ? t.labelAr : t.labelEn}</div>
                        <div className="text-[10px] text-white/40">{isRTL ? t.descAr : t.descEn}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom prompt */}
            <div className="space-y-2">
              <label className="text-xs text-white/50 font-medium">
                {isRTL ? "تعليمات إضافية (اختياري)" : "Custom Instructions (optional)"}
              </label>
              <Textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder={isRTL ? "أضف تعليمات محددة للتحليل..." : "Add specific analysis instructions..."}
                className="bg-white/5 border-white/10 text-white/80 placeholder:text-white/20 resize-none h-20"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white/70 bg-transparent hover:bg-white/10"
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={readyFiles.length === 0 || isUploading || isAnalyzing}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {isRTL ? "جاري التحليل..." : "Analyzing..."}</>
                ) : (
                  <><FileSearch className="w-4 h-4 mr-2" /> {isRTL ? `تحليل ${readyFiles.length} ملفات` : `Analyze ${readyFiles.length} Files`}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
