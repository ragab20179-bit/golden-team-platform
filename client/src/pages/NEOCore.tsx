/**
 * Hybrid NEO Core — AI Orchestration Architecture
 * Design: Neural Depth — deep space dark, glass morphism, Space Grotesk
 * Shows: 80% Manus + 20% GPT-4 hybrid router, 7 specialized AI modules,
 *        data sources, intelligent routing logic, and live metrics
 */
import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Brain, Zap, Network, Database, FileText, Mic, BarChart2,
  Shield, Scale, Users, ShoppingCart, CheckSquare, MessageSquare,
  Activity, Clock, TrendingUp, AlertTriangle, Cpu, Globe,
  ChevronRight, Info, Play, RefreshCw, Eye, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// The 7 Specialized AI Modules (Engineering → QMS AI, Architecture → Business Management AI)
const AI_MODULES = [
  {
    id: "conversational", label: "Conversational AI", icon: MessageSquare,
    color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10",
    glow: "shadow-blue-500/20",
    desc: "Natural language understanding, intent detection, context management across all employee interactions",
    capabilities: ["Intent classification", "Context memory", "Multi-turn dialogue", "AR/EN bilingual"],
    traffic: 35, latency: "< 0.8s",
  },
  {
    id: "decision", label: "Decision-Making AI", icon: Zap,
    color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10",
    glow: "shadow-amber-500/20",
    desc: "Multi-criteria decision analysis, approval routing, authority matrix enforcement via ASTRA AMG",
    capabilities: ["MCDA scoring", "Approval routing", "Authority limits", "Risk weighting"],
    traffic: 18, latency: "< 1.2s",
  },
  {
    id: "financial", label: "Financial AI", icon: BarChart2,
    color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10",
    glow: "shadow-emerald-500/20",
    desc: "Accounting intelligence, financial analysis, budget forecasting, and Odoo ERP transaction processing",
    capabilities: ["Invoice processing", "Budget forecasting", "Variance analysis", "Odoo integration"],
    traffic: 22, latency: "< 1.5s",
  },
  {
    id: "risk", label: "Risk Management AI", icon: AlertTriangle,
    color: "text-rose-400", border: "border-rose-500/30", bg: "bg-rose-500/10",
    glow: "shadow-rose-500/20",
    desc: "Real-time risk scoring, compliance monitoring, ISO 9001 non-conformance detection and escalation",
    capabilities: ["Risk scoring", "Compliance checks", "NCR detection", "Escalation logic"],
    traffic: 12, latency: "< 0.9s",
  },
  {
    id: "critical", label: "Critical Thinking AI", icon: Brain,
    color: "text-violet-400", border: "border-violet-500/30", bg: "bg-violet-500/10",
    glow: "shadow-violet-500/20",
    desc: "Complex problem decomposition, root cause analysis, scenario planning, and strategic recommendation",
    capabilities: ["Root cause analysis", "Scenario planning", "Problem decomposition", "Strategic advice"],
    traffic: 8, latency: "< 2.1s",
  },
  {
    id: "qms", label: "QMS AI", icon: CheckSquare,
    color: "text-teal-400", border: "border-teal-500/30", bg: "bg-teal-500/10",
    glow: "shadow-teal-500/20",
    desc: "ISO 9001 process intelligence, document control, audit management, and continuous improvement tracking",
    capabilities: ["ISO 9001 compliance", "Document control", "Audit scheduling", "CAPA management"],
    traffic: 10, latency: "< 1.1s",
  },
  {
    id: "business", label: "Business Management AI", icon: TrendingUp,
    color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/20",
    desc: "Business intelligence, KPI monitoring, market analysis, CRM insights, and strategic planning support",
    capabilities: ["KPI monitoring", "Market analysis", "CRM intelligence", "Strategic planning"],
    traffic: 15, latency: "< 1.4s",
  },
];

const DATA_SOURCES = [
  { label: "Odoo 19 ERP", icon: Database, color: "text-emerald-400" },
  { label: "OrangeHRM", icon: Users, color: "text-cyan-400" },
  { label: "OpenProject", icon: CheckSquare, color: "text-violet-400" },
  { label: "Meeting Transcripts", icon: Mic, color: "text-blue-400" },
  { label: "Documents & PDFs", icon: FileText, color: "text-amber-400" },
  { label: "Metabase KPIs", icon: BarChart2, color: "text-rose-400" },
  { label: "Audit Logs", icon: Shield, color: "text-slate-400" },
  { label: "Knowledge Base", icon: Brain, color: "text-teal-400" },
];

const APPLICATIONS = [
  { label: "ASTRA Meeting Assistant", icon: Mic, color: "text-blue-400" },
  { label: "Smart Procurement", icon: ShoppingCart, color: "text-amber-400" },
  { label: "HR Self-Service", icon: Users, color: "text-cyan-400" },
  { label: "Financial Processing", icon: BarChart2, color: "text-emerald-400" },
  { label: "Legal AI", icon: Scale, color: "text-rose-400" },
  { label: "Project Planning", icon: CheckSquare, color: "text-violet-400" },
  { label: "ASTRA AMG Governance", icon: Shield, color: "text-red-400" },
  { label: "Knowledge Base", icon: Brain, color: "text-teal-400" },
];

const ROUTING_RULES = [
  { condition: "Simple queries, conversational tasks", route: "Manus AI (80%)", confidence: 95, color: "text-blue-400" },
  { condition: "Complex financial analysis, legal review", route: "GPT-4 Turbo (20%)", confidence: 88, color: "text-violet-400" },
  { condition: "Multi-step workflows, tool execution", route: "Manus AI (80%)", confidence: 97, color: "text-blue-400" },
  { condition: "Specialized domain expertise required", route: "GPT-4 Turbo (20%)", confidence: 82, color: "text-violet-400" },
  { condition: "Real-time data queries, API calls", route: "Manus AI (80%)", confidence: 99, color: "text-blue-400" },
];

const LIVE_METRICS = [
  { label: "Requests Today", value: "1,847", icon: Activity, color: "text-blue-400", trend: "+12%" },
  { label: "Avg Response Time", value: "1.3s", icon: Clock, color: "text-emerald-400", trend: "-0.2s" },
  { label: "Manus Traffic", value: "80%", icon: Cpu, color: "text-cyan-400", trend: "Stable" },
  { label: "GPT-4 Traffic", value: "20%", icon: Brain, color: "text-violet-400", trend: "Stable" },
  { label: "Cost Savings", value: "71%", icon: TrendingUp, color: "text-amber-400", trend: "vs full GPT-4" },
  { label: "Uptime", value: "99.97%", icon: Globe, color: "text-teal-400", trend: "30 days" },
];

export default function NEOCore() {
  const { t } = useLanguage();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"architecture" | "modules" | "routing" | "metrics">("architecture");

  return (
    <PortalLayout
      title={t("Hybrid NEO Core", "نواة NEO الهجينة")}
      subtitle={t("AI Orchestration Engine — 80% Manus + 20% GPT-4", "محرك تنسيق الذكاء الاصطناعي — 80% Manus + 20% GPT-4")}
      badge={t("ONLINE", "متصل")}
      badgeColor="text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
    >
      <div className="p-4 md:p-6 space-y-6">

        {/* Live Metrics Strip */}
        <motion.div variants={FADE} initial="hidden" animate="show"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LIVE_METRICS.map((m, i) => (
            <motion.div key={i} variants={FADE} transition={{ delay: i * 0.06 }}
              className="glass-card rounded-xl p-3 border border-white/5 text-center">
              <m.icon className={`w-4 h-4 ${m.color} mx-auto mb-1`} />
              <div className={`text-xl font-bold ${m.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{m.label}</div>
              <div className="text-[10px] text-white/20 mt-0.5">{m.trend}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Hybrid AI Banner */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.1 }}
          className="rounded-xl p-5 border border-blue-500/20 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 50%, rgba(6,182,212,0.05) 100%)" }}>
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 50%)" }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NEO Orchestration Core</div>
                <div className="text-xs text-white/40">Hybrid AI Engine · Enterprise Intelligence Platform</div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:ml-6">
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-blue-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>80%</div>
                <div className="text-[11px] text-blue-300/60 mt-0.5">Manus AI Platform</div>
                <div className="text-[10px] text-white/20">Primary Engine</div>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-violet-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>20%</div>
                <div className="text-[11px] text-violet-300/60 mt-0.5">GPT-4 Turbo</div>
                <div className="text-[10px] text-white/20">Specialist Engine</div>
              </div>
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>7</div>
                <div className="text-[11px] text-emerald-300/60 mt-0.5">AI Modules</div>
                <div className="text-[10px] text-white/20">Specialized</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>125+</div>
                <div className="text-[11px] text-amber-300/60 mt-0.5">API Procedures</div>
                <div className="text-[10px] text-white/20">Registered Tools</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
          {(["architecture", "modules", "routing", "metrics"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                ${activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}>
              {tab === "architecture" ? `🏗 ${t("Architecture", "الهيكل")}` : tab === "modules" ? `🧠 ${t("AI Modules", "وحدات AI")}` : tab === "routing" ? `⚡ ${t("Routing Logic", "منطق التوجيه")}` : `📊 ${t("Live Metrics", "مقاييس مباشرة")}`}
            </button>
          ))}
        </div>

        {/* Architecture Tab — Full Visual Diagram */}
        {activeTab === "architecture" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-4">
            <div className="glass-card rounded-xl border border-white/5 p-5 overflow-x-auto">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-5">{t("NEO AI Architecture — 4 Layer Model", "هيكل NEO AI — نموذج 4 طبقات")}</h3>

              {/* Architecture Layers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[700px]">

                {/* Layer 1: Data Sources */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mb-3">{t("Data Sources Layer", "طبقة مصادر البيانات")}</div>
                  {DATA_SOURCES.map((ds, i) => (
                    <div key={i} className="rounded-lg bg-white/3 border border-white/5 p-2.5 flex items-center gap-2">
                      <ds.icon className={`w-3.5 h-3.5 ${ds.color} shrink-0`} />
                      <span className="text-[11px] text-white/60">{ds.label}</span>
                    </div>
                  ))}
                </div>

                {/* Layer 2: AI Infrastructure */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mb-3">{t("AI Infrastructure Layer", "طبقة بنية AI")}</div>
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 h-full">
                    <div className="text-xs font-bold text-blue-300 mb-3 text-center">Manus AI Platform</div>
                    {[
                      { label: "Multi-Model Orchestration", icon: Network },
                      { label: "Context Management System", icon: Brain },
                      { label: "Tool Integration Framework", icon: Cpu },
                      { label: "Real-Time Processing Engine", icon: Activity },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10 mb-2">
                        <item.icon className="w-3 h-3 text-blue-400 shrink-0" />
                        <span className="text-[10px] text-blue-200/60">{item.label}</span>
                      </div>
                    ))}
                    <div className="mt-3 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5">
                      <div className="text-[10px] font-bold text-violet-300 mb-1 text-center">GPT-4 Turbo API</div>
                      <div className="text-[9px] text-violet-200/40 text-center">Specialized Domain Expertise</div>
                    </div>
                  </div>
                </div>

                {/* Layer 3: NEO Core Engine */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mb-3">{t("NEO Core Engine", "محرك NEO الأساسي")}</div>
                  {/* Intelligent Router */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-3 mb-3">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Network className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300">Intelligent Router</span>
                    </div>
                    <div className="text-[10px] text-cyan-200/40 text-center">80% → Manus · 20% → GPT-4</div>
                  </div>
                  {/* NEO Orchestration Core */}
                  <div className="rounded-xl border border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center mx-auto mb-2 neo-pulse">
                      <Brain className="w-6 h-6 text-blue-300" />
                    </div>
                    <div className="text-xs font-bold text-blue-200">NEO Orchestration Core</div>
                    <div className="text-[9px] text-white/30 mt-1">Hybrid: Manus + GPT-4</div>
                  </div>
                  {/* 7 Modules compact */}
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {AI_MODULES.map((mod) => (
                      <div key={mod.id} className={`rounded-lg border ${mod.border} ${mod.bg} p-1.5 text-center`}>
                        <mod.icon className={`w-3 h-3 ${mod.color} mx-auto mb-0.5`} />
                        <div className={`text-[9px] font-semibold ${mod.color} leading-tight`}>{mod.label.replace(" AI", "")}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Layer 4: Applications */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-center mb-3">{t("Applications Layer", "طبقة التطبيقات")}</div>
                  {APPLICATIONS.map((app, i) => (
                    <div key={i} className="rounded-lg bg-white/3 border border-white/5 p-2.5 flex items-center gap-2 hover:border-white/10 transition-colors cursor-pointer"
                      onClick={() => toast.info(`Opening ${app.label}...`)}>
                      <app.icon className={`w-3.5 h-3.5 ${app.color} shrink-0`} />
                      <span className="text-[11px] text-white/60">{app.label}</span>
                      <ChevronRight className="w-3 h-3 text-white/20 ml-auto" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Flow arrows legend */}
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-8 h-0.5 bg-blue-500/50" />
                  <span>80% Manus Traffic</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-8 h-0.5 bg-violet-500/50" />
                  <span>20% GPT-4 Traffic</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-8 h-0.5 bg-emerald-500/50" />
                  <span>Data Sync</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <div className="w-8 h-0.5 bg-amber-500/50" />
                  <span>API Response</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modules Tab */}
        {activeTab === "modules" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_MODULES.map((mod, i) => (
                <motion.div key={mod.id} variants={FADE} transition={{ delay: i * 0.07 }}
                  className={`rounded-xl border ${mod.border} ${mod.bg} p-4 cursor-pointer transition-all hover:shadow-lg hover:${mod.glow}`}
                  onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${mod.bg} border ${mod.border} flex items-center justify-center shrink-0`}>
                      <mod.icon className={`w-5 h-5 ${mod.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold ${mod.color}`}>{mod.label}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] border ${mod.border} ${mod.bg} ${mod.color}`}>{mod.traffic}% traffic</Badge>
                          <span className="text-[10px] text-white/30">{mod.latency}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mt-1 leading-relaxed">{mod.desc}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-white/20 mb-1">
                          <span>Traffic share</span><span className={mod.color}>{mod.traffic}%</span>
                        </div>
                        <Progress value={mod.traffic * 2.5} className="h-1" />
                      </div>
                    </div>
                  </div>
                  {activeModule === mod.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Key Capabilities</div>
                      <div className="grid grid-cols-2 gap-2">
                        {mod.capabilities.map((cap, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-xs text-white/50">
                            <div className={`w-1.5 h-1.5 rounded-full ${mod.color.replace("text-", "bg-")}`} />
                            {cap}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Routing Logic Tab */}
        {activeTab === "routing" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-4">
            {/* Routing Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-300">Manus AI Platform</div>
                    <div className="text-xs text-blue-200/40">Primary Engine — 80% of all traffic</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-white/50">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />Multi-model orchestration with tool use</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />Real-time API execution (Odoo, HR, PM)</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />Context management across sessions</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />Autonomous task execution with approval gates</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" />71% cost savings vs full GPT-4 routing</div>
                </div>
                <div className="mt-4 rounded-lg bg-blue-500/10 p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-blue-300">Traffic Share</span>
                    <span className="text-blue-400 font-bold">80%</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
              </div>

              <div className="glass-card rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-violet-300">GPT-4 Turbo API</div>
                    <div className="text-xs text-violet-200/40">Specialist Engine — 20% of all traffic</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-white/50">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" />Deep domain expertise (legal, financial)</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" />Complex reasoning and analysis tasks</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" />Long-form document generation</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" />Critical thinking and strategic advice</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-400" />Fallback for high-stakes decisions</div>
                </div>
                <div className="mt-4 rounded-lg bg-violet-500/10 p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-violet-300">Traffic Share</span>
                    <span className="text-violet-400 font-bold">20%</span>
                  </div>
                  <Progress value={20} className="h-2" />
                </div>
              </div>
            </div>

            {/* Routing Decision Table */}
            <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">{t("Intelligent Router Decision Rules", "قواعد قرار الموجّه الذكي")}</span>
              </div>
              <div className="divide-y divide-white/5">
                {ROUTING_RULES.map((rule, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-4 hover:bg-white/2 transition-colors">
                    <div className="flex-1">
                      <div className="text-xs text-white/60">{rule.condition}</div>
                    </div>
                    <div className={`text-xs font-semibold ${rule.color} shrink-0`}>{rule.route}</div>
                    <div className="shrink-0 w-20">
                      <div className="flex justify-between text-[10px] text-white/30 mb-1">
                        <span>Confidence</span><span className={rule.color}>{rule.confidence}%</span>
                      </div>
                      <Progress value={rule.confidence} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction Flow */}
            <div className="glass-card rounded-xl border border-white/5 p-5">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">{t("NEO Transaction Execution Flow", "تدفق تنفيذ معاملات NEO")}</h3>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                {[
                  { step: "1", label: "Intent Capture", desc: "Employee describes task in natural language (AR/EN)", color: "bg-blue-500" },
                  { step: "2", label: "Router Decision", desc: "Intelligent router selects Manus (80%) or GPT-4 (20%)", color: "bg-cyan-500" },
                  { step: "3", label: "Data Gathering", desc: "NEO queries required data from Odoo, HR, PM systems", color: "bg-violet-500" },
                  { step: "4", label: "User Confirmation", desc: "NEO presents all fields and asks for explicit approval", color: "bg-amber-500" },
                  { step: "5", label: "ASTRA AMG Check", desc: "Governance module validates authority and compliance", color: "bg-rose-500" },
                  { step: "6", label: "Execute & Sync", desc: "Transaction processed and dashboard data updated", color: "bg-emerald-500" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${step.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {step.step}
                      </div>
                      <div className="text-[11px] font-semibold text-white text-center">{step.label}</div>
                      <div className="text-[10px] text-white/30 text-center leading-tight hidden md:block">{step.desc}</div>
                    </div>
                    {i < 5 && <ChevronRight className="w-4 h-4 text-white/20 shrink-0 hidden md:block" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Metrics Tab */}
        {activeTab === "metrics" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Module Traffic Distribution */}
              <div className="glass-card rounded-xl border border-white/5 p-5">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">{t("Module Traffic Distribution", "توزيع حركة الوحدات")}</h3>
                <div className="space-y-3">
                  {AI_MODULES.map((mod) => (
                    <div key={mod.id} className="flex items-center gap-3">
                      <mod.icon className={`w-3.5 h-3.5 ${mod.color} shrink-0`} />
                      <span className="text-xs text-white/50 w-36 shrink-0">{mod.label}</span>
                      <div className="flex-1">
                        <Progress value={mod.traffic * 2.5} className="h-2" />
                      </div>
                      <span className={`text-xs font-semibold ${mod.color} w-8 text-right shrink-0`}>{mod.traffic}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Stats */}
              <div className="glass-card rounded-xl border border-white/5 p-5">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">{t("Performance Statistics", "إحصائيات الأداء")}</h3>
                <div className="space-y-4">
                  {[
                    { label: "Response Time P50", value: "0.9s", target: "< 1s", status: "good" },
                    { label: "Response Time P95", value: "2.1s", target: "< 3s", status: "good" },
                    { label: "Response Time P99", value: "4.3s", target: "< 5s", status: "good" },
                    { label: "Error Rate", value: "0.03%", target: "< 0.1%", status: "good" },
                    { label: "Cache Hit Rate", value: "68%", target: "> 60%", status: "good" },
                    { label: "Queue Depth", value: "12", target: "< 100", status: "good" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{stat.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/20">Target: {stat.target}</span>
                        <span className="text-xs font-semibold text-emerald-400">{stat.value}</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="glass-card rounded-xl border border-amber-500/10 bg-amber-500/3 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">{t("Hybrid AI Cost Efficiency Analysis", "تحليل كفاءة تكلفة AI الهجين")}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-white/3 border border-white/5 p-4 text-center">
                  <div className="text-2xl font-bold text-rose-400 mb-1">$0.045</div>
                  <div className="text-xs text-white/40">Per request — Full GPT-4</div>
                  <div className="text-[10px] text-white/20 mt-1">Baseline (100% GPT-4)</div>
                </div>
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">$0.013</div>
                  <div className="text-xs text-white/40">Per request — Hybrid NEO</div>
                  <div className="text-[10px] text-emerald-300/40 mt-1">80% Manus + 20% GPT-4</div>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400 mb-1">71%</div>
                  <div className="text-xs text-white/40">Cost savings</div>
                  <div className="text-[10px] text-amber-300/40 mt-1">~SAR 8,400/month saved</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PortalLayout>
  );
}
