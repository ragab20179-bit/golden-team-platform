/**
 * Employee Portal — Main Dashboard
 * NEO AI Chat occupies 55% of the screen (right panel)
 * Left panel: KPI cards + module shortcuts
 * Design: "Neural Depth"
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Brain, Send, Paperclip, Mic, Users, Database, UserCheck,
  BarChart3, ShoppingCart, FileCheck, Scale, MessageSquare,
  Shield, ScrollText, TrendingUp, TrendingDown, Activity,
  Zap, ChevronRight, RefreshCw, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

interface ChatMessage {
  id: number;
  role: "user" | "neo";
  content: string;
  time: string;
  module?: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1, role: "neo",
    content: "Good morning! I'm **NEO**, your AI Business Management Core. I'm connected to all 12 enterprise modules including Odoo ERP, CRM, HR, QMS, Legal, and Procurement.\n\nHow can I assist you today? You can ask me to:\n- Pull KPI reports across departments\n- Draft a procurement request\n- Check ISO 9001 compliance status\n- Review pending decision approvals\n- Analyze CRM pipeline\n- Or anything else across your enterprise",
    time: "09:00 AM", module: "Core"
  }
];

const NEO_RESPONSES: Record<string, { content: string; module: string }> = {
  default: { content: "I've analyzed your request using the Decision-Making AI and Critical Thinking modules. Based on current enterprise data, I recommend reviewing the KPI dashboard for Q1 performance metrics. Shall I generate a detailed report?", module: "Decision AI" },
  hr: { content: "**HR Module Analysis:**\n- 47 active employees across 6 departments\n- 3 pending leave approvals require your attention\n- Monthly payroll processing scheduled for March 28\n- 2 new onboarding requests from IT Solutions team\n\nShall I process the leave approvals or generate the payroll summary?", module: "HR AI" },
  kpi: { content: "**KPI Dashboard Summary — March 2026:**\n- Revenue: SAR 2.4M (+12% MoM) ✅\n- Client Satisfaction: 94.2% ✅\n- Project Delivery Rate: 87% ⚠️\n- ISO 9001 Compliance: 98.1% ✅\n- Procurement Savings: SAR 180K\n\nThe project delivery rate is below the 90% target. Shall I identify the bottlenecks?", module: "Analytics AI" },
  procurement: { content: "**Procurement Status:**\n- 8 active RFQs awaiting vendor responses\n- 3 purchase orders pending approval (total: SAR 340K)\n- 2 contracts expiring within 30 days\n- Odoo ERP sync: Last updated 2 minutes ago\n\nI can auto-generate renewal reminders or escalate the pending approvals. What would you prefer?", module: "Procurement AI" },
  legal: { content: "**Legal Module Alert:**\n- 1 contract requires signature by March 20\n- NDA renewal for IT vendor due in 15 days\n- 2 compliance documents pending review\n- ASTRA AMG flagged 1 policy deviation for review\n\nShall I prepare the signature workflow or schedule a compliance review meeting?", module: "Legal AI" },
  erp: { content: "**Odoo ERP Integration Status:**\n- Sync Status: ✅ Connected (last sync: 3 min ago)\n- Open Invoices: 12 (SAR 890K total)\n- Inventory Alerts: 3 items below reorder point\n- Accounts Payable: 5 payments due this week\n\nI can process the payments or generate an AR aging report. Which do you need?", module: "Financial AI" },
  crm: { content: "**CRM Pipeline Analysis:**\n- Active Leads: 34 (SAR 4.2M pipeline value)\n- Hot Opportunities: 8 requiring follow-up today\n- Won this month: 6 deals (SAR 780K)\n- AI Prediction: 73% probability of closing 3 more by month-end\n\nShall I draft follow-up emails for the hot opportunities?", module: "CRM AI" },
  qms: { content: "**QMS / ISO 9001 Status:**\n- Overall Compliance Score: 98.1% ✅\n- Open Non-Conformances: 2 (minor)\n- Internal Audit scheduled: March 25\n- Document Control: 4 documents pending approval\n- CAPA Actions: 1 overdue\n\nShall I generate the audit preparation checklist?", module: "QMS AI" },
};

function getNEOResponse(input: string): { content: string; module: string } {
  const lower = input.toLowerCase();
  if (lower.includes("hr") || lower.includes("employee") || lower.includes("leave")) return NEO_RESPONSES.hr;
  if (lower.includes("kpi") || lower.includes("performance") || lower.includes("metric")) return NEO_RESPONSES.kpi;
  if (lower.includes("procurement") || lower.includes("purchase") || lower.includes("vendor")) return NEO_RESPONSES.procurement;
  if (lower.includes("legal") || lower.includes("contract") || lower.includes("compliance")) return NEO_RESPONSES.legal;
  if (lower.includes("erp") || lower.includes("odoo") || lower.includes("invoice") || lower.includes("finance")) return NEO_RESPONSES.erp;
  if (lower.includes("crm") || lower.includes("lead") || lower.includes("customer") || lower.includes("sales")) return NEO_RESPONSES.crm;
  if (lower.includes("qms") || lower.includes("iso") || lower.includes("quality") || lower.includes("audit")) return NEO_RESPONSES.qms;
  return NEO_RESPONSES.default;
}

const kpiCards = [
  { label: "Revenue MTD", value: "SAR 2.4M", change: "+12%", up: true, color: "text-emerald-400", bg: "border-emerald-500/20" },
  { label: "Active Projects", value: "18", change: "+3", up: true, color: "text-blue-400", bg: "border-blue-500/20" },
  { label: "Open Tickets", value: "24", change: "-5", up: false, color: "text-amber-400", bg: "border-amber-500/20" },
  { label: "ISO Compliance", value: "98.1%", change: "+0.4%", up: true, color: "text-teal-400", bg: "border-teal-500/20" },
];

const quickModules = [
  { label: "HR System", icon: Users, path: "/portal/hr", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { label: "Odoo ERP", icon: Database, path: "/portal/erp", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { label: "CRM", icon: UserCheck, path: "/portal/crm", color: "text-violet-400", bg: "bg-violet-500/10" },
  { label: "KPI Dashboard", icon: BarChart3, path: "/portal/kpi", color: "text-amber-400", bg: "bg-amber-500/10" },
  { label: "Procurement", icon: ShoppingCart, path: "/portal/procurement", color: "text-orange-400", bg: "bg-orange-500/10" },
  { label: "QMS / ISO", icon: FileCheck, path: "/portal/qms", color: "text-teal-400", bg: "bg-teal-500/10" },
  { label: "Legal", icon: Scale, path: "/portal/legal", color: "text-rose-400", bg: "bg-rose-500/10" },
  { label: "Comms", icon: MessageSquare, path: "/portal/comms", color: "text-sky-400", bg: "bg-sky-500/10" },
  { label: "Audit & Logs", icon: ScrollText, path: "/portal/audit", color: "text-slate-400", bg: "bg-slate-500/10" },
  { label: "ASTRA AMG", icon: Shield, path: "/portal/governance", color: "text-red-400", bg: "bg-red-500/10" },
];

const quickPrompts = [
  "Show me today's KPI summary",
  "Any pending approvals?",
  "Odoo ERP sync status",
  "ISO 9001 compliance report",
  "Open CRM opportunities",
  "Procurement alerts",
];

export default function Portal() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    const userMsg: ChatMessage = { id: Date.now(), role: "user", content: msg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setTimeout(() => {
      const resp = getNEOResponse(msg);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "neo", content: resp.content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        module: resp.module
      }]);
    }, 1400);
  };

  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-bold text-white mb-1">{line.replace(/\*\*/g, "")}</p>;
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className="mb-0.5">
          {parts.map((part, j) =>
            part.startsWith("**") ? <strong key={j} className="text-white font-semibold">{part.replace(/\*\*/g, "")}</strong> : part
          )}
        </p>
      );
    });
  };

  return (
    <PortalLayout title="Employee Dashboard" subtitle="NEO AI Core — Active" badge="Online" badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      <div className="flex h-full">
        {/* ── Left Panel — KPIs + Modules (45%) ── */}
        <div className="w-[45%] shrink-0 border-r border-white/5 overflow-y-auto p-5 space-y-5">
          {/* KPI Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white/70" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Live KPIs</h2>
              <button className="text-white/30 hover:text-white/60 transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {kpiCards.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`glass-card p-4 border ${k.bg} rounded-xl`}>
                  <div className="text-xs text-white/40 mb-1">{k.label}</div>
                  <div className={`text-xl font-bold ${k.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{k.value}</div>
                  <div className={`flex items-center gap-1 text-xs mt-1 ${k.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {k.change} vs last month
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Module Access */}
          <div>
            <h2 className="text-sm font-semibold text-white/70 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Enterprise Modules</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickModules.map((m, i) => (
                <motion.button key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.04 }}
                  onClick={() => setLocation(m.path)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border border-white/5 hover:border-white/15 ${m.bg} transition-all duration-200 text-left group`}>
                  <m.icon className={`w-4 h-4 ${m.color} shrink-0`} />
                  <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">{m.label}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 ml-auto group-hover:text-white/50 transition-colors" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-sm font-semibold text-white/70 mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Activity</h2>
            <div className="space-y-2">
              {[
                { icon: Activity, text: "Odoo ERP synced successfully", time: "2 min ago", color: "text-emerald-400" },
                { icon: Shield, text: "ASTRA AMG: 1 policy deviation flagged", time: "15 min ago", color: "text-red-400" },
                { icon: FileCheck, text: "QMS audit scheduled for March 25", time: "1 hr ago", color: "text-teal-400" },
                { icon: ShoppingCart, text: "3 POs pending approval (SAR 340K)", time: "2 hr ago", color: "text-orange-400" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-white/5 glass-card">
                  <a.icon className={`w-3.5 h-3.5 ${a.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Panel — NEO AI Chat (55%) ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "rgba(6,11,20,0.6)" }}>
          {/* Chat header */}
          <div className="shrink-0 px-5 py-4 border-b border-white/5 flex items-center justify-between" style={{ background: "rgba(13,27,62,0.4)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center neo-pulse">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NEO AI Core</div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online · 80% Manus + 20% GPT-4 · 7 Modules Active
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-1" /> ASTRA AMG Governed
              </Badge>
              <button onClick={() => { setMessages(INITIAL_MESSAGES); toast.success("Chat cleared"); }}
                className="text-white/30 hover:text-white/60 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick prompts */}
          <div className="shrink-0 px-5 py-2.5 border-b border-white/5 flex gap-2 overflow-x-auto scrollbar-hide">
            {quickPrompts.map((p, i) => (
              <button key={i} onClick={() => sendMessage(p)}
                className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-white/50 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/5 transition-all whitespace-nowrap">
                {p}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "neo" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {msg.role === "neo" && msg.module && (
                    <span className="text-[10px] text-blue-400/70 font-medium px-1">{msg.module}</span>
                  )}
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "glass-card border border-white/8 text-white/80 rounded-tl-sm"}`}>
                    {renderContent(msg.content)}
                  </div>
                  <span className="text-[10px] text-white/25 px-1">{msg.time}</span>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                  <Brain className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="glass-card border border-white/8 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                        style={{ animation: `blink 1.2s ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-4 border-t border-white/5">
            <div className="flex items-end gap-2 glass-card border border-white/10 rounded-2xl p-2 focus-within:border-blue-500/30 transition-colors">
              <button onClick={() => toast.info("File upload coming soon")} className="p-2 text-white/30 hover:text-white/60 transition-colors shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask NEO anything — HR, ERP, CRM, KPIs, Legal, Procurement, QMS..."
                rows={1}
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 resize-none outline-none py-1.5 min-h-[36px] max-h-[120px]"
                style={{ lineHeight: "1.5" }}
              />
              <button onClick={() => toast.info("Voice input coming soon")} className="p-2 text-white/30 hover:text-white/60 transition-colors shrink-0">
                <Mic className="w-4 h-4" />
              </button>
              <Button onClick={() => sendMessage()} disabled={!input.trim() || isTyping} size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl px-3 shrink-0 h-9">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-white/20 text-center mt-2">NEO AI is governed by ASTRA AMG · All actions are logged and audited</p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
