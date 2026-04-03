/**
 * AIModuleQueryPanel — Reusable AI Query Interface with Universal File Upload
 *
 * Renders a query input + submit button that calls any neoModules tRPC procedure.
 * Now includes:
 *   - Drag-and-drop file upload zone
 *   - Paperclip attach button + Trash2 (bin) icon for removing files
 *   - Chunked upload pipeline → parsed file content injected into AI context via uploadIds
 *   - Full transparency: engine, data source, context summary, tokens, cost, latency
 *
 * Per AI Response Policy (docs/AI_RESPONSE_POLICY.md):
 *   All AI responses are labeled as "AI Analysis" to distinguish from verified facts.
 *   The context summary is shown so users can verify what data the AI used.
 */

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Brain, Send, Loader2, ChevronDown, ChevronRight,
  Database, Cpu, DollarSign, Clock, AlertCircle, Info,
  Paperclip, Trash2, FileText, CheckCircle2, Upload, X,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { toast as sonnerToast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AIModuleType =
  | "financial"
  | "risk"
  | "decision"
  | "critical"
  | "qms"
  | "business"
  | "conversational";

interface AIModuleQueryPanelProps {
  module: AIModuleType;
  /** Optional: pre-fill the query input */
  defaultQuery?: string;
  /** Optional: placeholder text for the query input */
  placeholder?: string;
  /** Optional: title override (defaults to module name) */
  title?: string;
  /** Optional: show/hide the context summary section (default: true) */
  showContext?: boolean;
  /** Optional: additional input fields for specific modules */
  extraInput?: Record<string, unknown>;
  className?: string;
}

interface AIResponse {
  response: string;
  engine: "gpt" | "manus";
  dataSource: string;
  contextSummary?: string;
  tokens?: number;
  estimatedCostUsd?: string;
  latencyMs?: number;
  recordsAnalyzed?: number;
}

/** Tracks a file being uploaded through the universal upload pipeline */
interface PendingUpload {
  id: string;
  file: File;
  uploadId?: string;
  status: "uploading" | "parsing" | "ready" | "error";
  progress: number;
  error?: string;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB

const ACCEPTED_TYPES = [
  "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv", "text/plain", "text/xml", "application/xml", "text/markdown",
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/tiff", "image/bmp",
  "application/vnd.apple.pages", "application/vnd.apple.numbers",
  "application/rtf", "application/vnd.oasis.opendocument.text",
].join(",");

// ─── Module config ────────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<AIModuleType, {
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  color: string;
  placeholderEn: string;
  placeholderAr: string;
}> = {
  financial: {
    labelEn: "Financial AI",
    labelAr: "الذكاء المالي",
    descEn: "Analyzes procurement spend, budget variance, and financial patterns from live DB data.",
    descAr: "يحلل الإنفاق والتباين في الميزانية والأنماط المالية من بيانات قاعدة البيانات المباشرة.",
    color: "text-emerald-400",
    placeholderEn: "e.g. What is the total procurement spend by category? Which items are pending approval?",
    placeholderAr: "مثال: ما هو إجمالي الإنفاق على المشتريات حسب الفئة؟",
  },
  risk: {
    labelEn: "Risk Management AI",
    labelAr: "ذكاء إدارة المخاطر",
    descEn: "Assesses risk from pending requests, approval bottlenecks, and ASTRA AMG decisions.",
    descAr: "يقيّم المخاطر من الطلبات المعلقة وقرارات ASTRA AMG.",
    color: "text-red-400",
    placeholderEn: "e.g. What are the highest-risk pending requests? Are there any ASTRA DENY patterns?",
    placeholderAr: "مثال: ما هي الطلبات المعلقة الأعلى خطورة؟",
  },
  decision: {
    labelEn: "Decision-Making AI",
    labelAr: "ذكاء اتخاذ القرار",
    descEn: "Applies ASTRA AMG policy rules to support multi-criteria decision analysis.",
    descAr: "يطبق قواعد سياسة ASTRA AMG لدعم تحليل القرارات متعددة المعايير.",
    color: "text-blue-400",
    placeholderEn: "e.g. Should we approve this 200K SAR procurement request? What policy rules apply?",
    placeholderAr: "مثال: هل يجب الموافقة على طلب المشتريات هذا؟",
  },
  critical: {
    labelEn: "Critical Thinking AI",
    labelAr: "ذكاء التفكير النقدي",
    descEn: "Complex problem decomposition, root cause analysis, and scenario planning using KPI and procurement data.",
    descAr: "تحليل المشكلات المعقدة وتحليل الأسباب الجذرية باستخدام بيانات KPI والمشتريات.",
    color: "text-purple-400",
    placeholderEn: "e.g. Why are our KPIs off-track? What are the root causes of procurement delays?",
    placeholderAr: "مثال: لماذا مؤشرات الأداء متأخرة؟ ما هي الأسباب الجذرية؟",
  },
  qms: {
    labelEn: "QMS AI",
    labelAr: "ذكاء نظام إدارة الجودة",
    descEn: "ISO 9001 process intelligence using uploaded QMS documents from Drive Vault.",
    descAr: "ذكاء عمليات ISO 9001 باستخدام وثائق QMS المرفوعة في Drive Vault.",
    color: "text-yellow-400",
    placeholderEn: "e.g. What ISO 9001 clause applies to our supplier evaluation process?",
    placeholderAr: "مثال: ما بند ISO 9001 الذي ينطبق على عملية تقييم الموردين؟",
  },
  business: {
    labelEn: "Business Management AI",
    labelAr: "ذكاء إدارة الأعمال",
    descEn: "Business intelligence from KPI targets, HR data, and procurement records.",
    descAr: "ذكاء الأعمال من أهداف KPI وبيانات الموارد البشرية وسجلات المشتريات.",
    color: "text-amber-400",
    placeholderEn: "e.g. How are we performing against our KPI targets? What is our headcount by department?",
    placeholderAr: "مثال: كيف أداؤنا مقارنة بأهداف KPI؟",
  },
  conversational: {
    labelEn: "Conversational AI",
    labelAr: "الذكاء الحواري",
    descEn: "Operational assistant for navigation, task management, and workflow guidance.",
    descAr: "مساعد تشغيلي للتنقل وإدارة المهام وإرشادات سير العمل.",
    color: "text-cyan-400",
    placeholderEn: "e.g. How do I submit a leave request? Where can I find the procurement module?",
    placeholderAr: "مثال: كيف أقدم طلب إجازة؟",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AIModuleQueryPanel({
  module,
  defaultQuery = "",
  placeholder,
  title,
  showContext = true,
  extraInput = {},
  className = "",
}: AIModuleQueryPanelProps) {
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";
  const config = MODULE_CONFIG[module];

  const [query, setQuery] = useState(defaultQuery);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // ── tRPC mutations ──────────────────────────────────────────────────────────

  const financialMutation = trpc.neoModules.analyzeFinancials.useMutation();
  const riskMutation = trpc.neoModules.assessRisk.useMutation();
  const decisionMutation = trpc.neoModules.makeDecision.useMutation();
  const criticalMutation = trpc.neoModules.analyzeProblems.useMutation();
  const qmsMutation = trpc.neoModules.qmsAnalysis.useMutation();
  const businessMutation = trpc.neoModules.businessIntelligence.useMutation();
  const chatMutation = trpc.neoModules.chat.useMutation();

  const isLoading =
    financialMutation.isPending || riskMutation.isPending || decisionMutation.isPending ||
    criticalMutation.isPending || qmsMutation.isPending || businessMutation.isPending ||
    chatMutation.isPending;

  const error =
    financialMutation.error || riskMutation.error || decisionMutation.error ||
    criticalMutation.error || qmsMutation.error || businessMutation.error ||
    chatMutation.error;

  // ── File upload pipeline ────────────────────────────────────────────────────

  const uploadFileThroughPipeline = useCallback(async (file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending: PendingUpload = { id, file, status: "uploading", progress: 0 };
    setPendingUploads(prev => [...prev, pending]);

    try {
      const client = (utils as any).client;
      // 1. Initiate upload
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      const initResult = await client.universalUpload.initiate.mutate({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileSize: file.size,
        totalChunks,
        context: "global",
      });
      const uploadId = initResult.uploadId;

      // 2. Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();
        const base64 = btoa(
          Array.from(new Uint8Array(buffer))
            .map(b => String.fromCharCode(b))
            .join("")
        );
        await client.universalUpload.uploadChunk.mutate({
          uploadId,
          chunkIndex: i,
          chunkData: base64,
        });
        const progress = Math.round(((i + 1) / totalChunks) * 80);
        setPendingUploads(prev =>
          prev.map(p => p.id === id ? { ...p, progress, uploadId } : p)
        );
      }

      // 3. Finalize
      await client.universalUpload.finalize.mutate({ uploadId });
      setPendingUploads(prev =>
        prev.map(p => p.id === id ? { ...p, status: "parsing", progress: 85 } : p)
      );

      // 4. Poll for parse completion
      let attempts = 0;
      while (attempts < 60) {
        const status = await client.universalUpload.getStatus.query({ uploadId });
        if (status.status === "complete") {
          setPendingUploads(prev =>
            prev.map(p => p.id === id ? { ...p, status: "ready", progress: 100, uploadId } : p)
          );
          return;
        }
        if (status.status === "error") {
          throw new Error(status.error || "Parse failed");
        }
        await new Promise(r => setTimeout(r, 1000));
        attempts++;
        setPendingUploads(prev =>
          prev.map(p => p.id === id ? { ...p, progress: 85 + Math.min(attempts, 14) } : p)
        );
      }
      throw new Error("Parse timeout");
    } catch (err: any) {
      setPendingUploads(prev =>
        prev.map(p => p.id === id ? { ...p, status: "error", error: err.message } : p)
      );
      sonnerToast.error(`Upload failed: ${file.name}`, { description: err.message });
    }
  }, [module, utils]);

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    arr.forEach(f => uploadFileThroughPipeline(f));
  }, [uploadFileThroughPipeline]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const removeUpload = useCallback((id: string) => {
    setPendingUploads(prev => prev.filter(p => p.id !== id));
  }, []);

  const clearAllUploads = useCallback(() => {
    setPendingUploads([]);
  }, []);

  // ── Submit handler ──────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!query.trim() || isLoading) return;

    // Collect ready uploadIds
    const readyUploadIds = pendingUploads
      .filter(p => p.status === "ready" && p.uploadId)
      .map(p => p.uploadId!);

    try {
      let res: AIResponse;

      switch (module) {
        case "financial":
          res = await financialMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { limit?: number } });
          break;
        case "risk":
          res = await riskMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { limit?: number } });
          break;
        case "decision":
          res = await decisionMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { domain?: string } });
          break;
        case "critical":
          res = await criticalMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { includeKpi?: boolean; includeProcurement?: boolean } });
          break;
        case "qms":
          res = await qmsMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { isoClause?: string } });
          break;
        case "business":
          res = await businessMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, ...extraInput as { focus?: "kpi" | "hr" | "procurement" | "all" } });
          break;
        case "conversational":
          res = await chatMutation.mutateAsync({ query, uploadIds: readyUploadIds.length ? readyUploadIds : undefined, language: isAr ? "ar" : "en" });
          break;
        default:
          return;
      }

      setResult(res);
      setContextOpen(false);
    } catch {
      // Error is surfaced via mutation.error
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const displayTitle = title ?? (isAr ? config.labelAr : config.labelEn);
  const displayPlaceholder = placeholder ?? (isAr ? config.placeholderAr : config.placeholderEn);
  const readyCount = pendingUploads.filter(p => p.status === "ready").length;
  const uploadingCount = pendingUploads.filter(p => ["uploading", "parsing"].includes(p.status)).length;

  return (
    <TooltipProvider>
      <Card
        className={`border border-white/10 bg-white/5 ${isDragging ? "ring-2 ring-primary/50 border-primary/40" : ""} ${className}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Brain className={`w-5 h-5 ${config.color}`} />
            <CardTitle className="text-base font-semibold text-white">{displayTitle}</CardTitle>
            <Badge variant="outline" className={`text-xs border-white/20 ${config.color} ml-auto`}>
              {module === "conversational" ? "Manus Forge" : "GPT-4o"}
            </Badge>
          </div>
          <p className="text-xs text-white/50 mt-1">
            {isAr ? config.descAr : config.descEn}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Drag overlay */}
          {isDragging && (
            <div className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 text-primary text-sm">
              <Upload className="w-5 h-5" />
              {isAr ? "أفلت الملفات هنا" : "Drop files here"}
            </div>
          )}

          {/* Query Input */}
          <Textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={displayPlaceholder}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none text-sm min-h-[80px]"
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
            dir={isAr ? "rtl" : "ltr"}
          />

          {/* Pending uploads list */}
          {pendingUploads.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">
                  {readyCount}/{pendingUploads.length} {isAr ? "ملفات جاهزة" : "files ready"}
                  {uploadingCount > 0 && ` · ${uploadingCount} ${isAr ? "قيد الرفع" : "uploading"}`}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs text-white/40 hover:text-red-400"
                  onClick={clearAllUploads}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  {isAr ? "مسح الكل" : "Clear all"}
                </Button>
              </div>
              {pendingUploads.map(pu => (
                <div key={pu.id} className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10">
                  {pu.status === "ready" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : pu.status === "error" ? (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 truncate">{pu.file.name}</p>
                    {pu.status !== "ready" && pu.status !== "error" && (
                      <Progress value={pu.progress} className="h-1 mt-1" />
                    )}
                    {pu.error && <p className="text-xs text-red-400 mt-0.5">{pu.error}</p>}
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => removeUpload(pu.id)}
                        className="text-white/30 hover:text-red-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "إزالة" : "Remove"}</TooltipContent>
                  </Tooltip>
                </div>
              ))}
            </div>
          )}

          {/* Action bar: attach + submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                className="hidden"
                onChange={e => {
                  if (e.target.files) handleFileSelect(e.target.files);
                  e.target.value = "";
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white/40 hover:text-primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAr ? "إرفاق ملفات (PDF, Excel, صور...)" : "Attach files (PDF, Excel, images...)"}
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-white/30">
                {isAr ? "Ctrl+Enter للإرسال · اسحب وأفلت الملفات" : "Ctrl+Enter to submit · Drag & drop files"}
              </span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold gap-2"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />{isAr ? "جارٍ التحليل..." : "Analyzing..."}</>
              ) : (
                <><Send className="w-4 h-4" />{isAr ? "تحليل" : "Analyze"}</>
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3 pt-1">
              {/* Engine + metadata strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center gap-1 text-white/50">
                  <Cpu className="w-3 h-3" />
                  <span className={result.engine === "gpt" ? "text-blue-400 font-medium" : "text-cyan-400 font-medium"}>
                    {result.engine === "gpt" ? "GPT-4o" : "Manus Forge"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-white/50">
                  <Database className="w-3 h-3" />
                  <span>{result.dataSource}</span>
                </div>
                {result.recordsAnalyzed !== undefined && (
                  <span className="text-white/40">{result.recordsAnalyzed} records</span>
                )}
                {result.tokens !== undefined && result.tokens > 0 && (
                  <div className="flex items-center gap-1 text-white/50">
                    <span>{result.tokens.toLocaleString()} tokens</span>
                  </div>
                )}
                {result.estimatedCostUsd && parseFloat(result.estimatedCostUsd) > 0 && (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <DollarSign className="w-3 h-3" />
                    <span>${result.estimatedCostUsd}</span>
                  </div>
                )}
                {result.latencyMs !== undefined && (
                  <div className="flex items-center gap-1 text-white/40">
                    <Clock className="w-3 h-3" />
                    <span>{result.latencyMs}ms</span>
                  </div>
                )}
              </div>

              {/* AI Response */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-1.5 text-xs text-amber-400/70 mb-2 font-medium uppercase tracking-wider">
                  <Info className="w-3 h-3" />
                  {isAr ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}
                </div>
                <div className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
                  {result.response}
                </div>
              </div>

              {/* Context Summary (collapsible) */}
              {showContext && result.contextSummary && (
                <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                  <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
                    {contextOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    <Database className="w-3 h-3" />
                    {isAr ? "بيانات السياق المُرسلة إلى الذكاء الاصطناعي" : "Context data sent to AI"}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 rounded-lg border border-white/5 bg-white/3 p-3">
                      <p className="text-xs text-white/30 mb-1.5 font-medium uppercase tracking-wider">
                        {isAr ? "السياق الموثق من قاعدة البيانات" : "Verified DB context"}
                      </p>
                      <pre className="text-xs text-white/50 whitespace-pre-wrap font-mono leading-relaxed">
                        {result.contextSummary}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
