/**
 * AIModuleQueryPanel — Reusable AI Query Interface
 *
 * Renders a query input + submit button that calls any neoModules tRPC procedure.
 * Displays the AI response with full transparency:
 *   - Which engine answered (GPT-4o or Manus Forge)
 *   - Which DB tables were queried (dataSource)
 *   - The exact context summary sent to the AI (contextSummary)
 *   - Token count and estimated cost (for GPT-4o calls)
 *   - Response latency
 *
 * Per AI Response Policy (docs/AI_RESPONSE_POLICY.md):
 *   All AI responses are labeled as "AI Analysis" to distinguish from verified facts.
 *   The context summary is shown so users can verify what data the AI used.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain, Send, Loader2, ChevronDown, ChevronRight,
  Database, Cpu, DollarSign, Clock, AlertCircle, Info
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

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

  // ── Submit handler ──────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!query.trim() || isLoading) return;

    try {
      let res: AIResponse;

      switch (module) {
        case "financial":
          res = await financialMutation.mutateAsync({ query, ...extraInput as { limit?: number } });
          break;
        case "risk":
          res = await riskMutation.mutateAsync({ query, ...extraInput as { limit?: number } });
          break;
        case "decision":
          res = await decisionMutation.mutateAsync({ query, ...extraInput as { domain?: string } });
          break;
        case "critical":
          res = await criticalMutation.mutateAsync({ query, ...extraInput as { includeKpi?: boolean; includeProcurement?: boolean } });
          break;
        case "qms":
          res = await qmsMutation.mutateAsync({ query, ...extraInput as { isoClause?: string } });
          break;
        case "business":
          res = await businessMutation.mutateAsync({ query, ...extraInput as { focus?: "kpi" | "hr" | "procurement" | "all" } });
          break;
        case "conversational":
          res = await chatMutation.mutateAsync({ query, language: isAr ? "ar" : "en" });
          break;
        default:
          return;
      }

      setResult(res);
      setContextOpen(false); // collapse context on new result
    } catch {
      // Error is surfaced via mutation.error
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const displayTitle = title ?? (isAr ? config.labelAr : config.labelEn);
  const displayPlaceholder = placeholder ?? (isAr ? config.placeholderAr : config.placeholderEn);

  return (
    <Card className={`border border-white/10 bg-white/5 ${className}`}>
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

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">
            {isAr ? "Ctrl+Enter للإرسال" : "Ctrl+Enter to submit"}
          </span>
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
  );
}
