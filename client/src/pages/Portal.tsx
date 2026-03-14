/**
 * Employee Portal — Main Dashboard
 * NEO AI Chat occupies 55% of the screen (right panel)
 * NEO Transaction Engine: 5-stage conversational flow (Intent → Data → Confirm → AMG → Execute)
 * Design: "Neural Depth" — deep space dark, glass morphism, bioluminescent accents
 */
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Users, Database, UserCheck,
  BarChart3, ShoppingCart, FileCheck, Scale, MessageSquare,
  Shield, ScrollText, TrendingUp, TrendingDown, Activity,
  Zap, ChevronRight, RefreshCw, Bot, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import NEOTransactionFlow from "@/components/NEOTransactionFlow";
import {
  detectIntent,
  createTransaction,
  getNextQuestion,
  getNextFieldKey,
  isDataComplete,
  checkAMGRequired,
  buildConfirmMessage,
  buildExecuteMessage,
  getAMGMessage,
  TRANSACTION_DEFINITIONS,
  TransactionState,
} from "@/lib/neoTransactionEngine";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number;
  role: "user" | "neo";
  content: string;
  time: string;
  module?: string;
  transaction?: TransactionState;
  isTransactionCard?: boolean;
}

// ── Static NEO responses ──────────────────────────────────────────────────────
const NEO_RESPONSES: Record<string, { content: string; module: string }> = {
  default: {
    content: "I'm **NEO**, your AI Business Management Core — 80% Manus + 20% GPT-4.\n\nI can execute real enterprise transactions for you. Try:\n- **\"Create a PO for SAR 30,000 for office supplies\"**\n- **\"Create a quote for Saudi Aramco\"**\n- **\"Approve leave for Ahmed\"**\n- **\"Schedule a meeting with the management team\"**\n- **\"Draft an NDA\"**\n- **\"Submit an expense claim\"**\n- **\"Open an IT support ticket\"**\n\nAll actions go through ASTRA AMG governance and are fully audited.",
    module: "NEO Core"
  },
  hr: { content: "**HR System Status:**\n- Active Employees: 47\n- Pending Leave Requests: 3\n- New Hires This Month: 2\n- Open Positions: 5\n- Payroll Run: Scheduled March 25\n\nWould you like me to process a leave request, onboard a new employee, or pull a payroll report?", module: "HR AI" },
  kpi: { content: "**KPI Dashboard — Today:**\n- Revenue MTD: SAR 2.4M (+12% vs last month)\n- Active Projects: 18 (+3)\n- Customer Satisfaction: 94.2%\n- ISO Compliance: 98.1%\n- Open Tickets: 24 (-5)\n\nShall I generate a full board-level KPI report?", module: "Decision-Making AI" },
  procurement: { content: "**Procurement Status:**\n- Open POs: 12 (SAR 890K total)\n- Pending Approvals: 3 POs awaiting sign-off\n- Overdue Deliveries: 1\n- Top Vendor: Al-Futtaim Office Supplies\n\nWould you like me to create a new Purchase Order? Just describe what you need.", module: "Procurement AI" },
  legal: { content: "**Legal Module Status:**\n- Active Contracts: 23\n- Expiring in 30 days: 4 (action required)\n- Pending Signatures: 2\n- Compliance Score: 96.8%\n\nShall I draft a contract, review an existing one, or flag a legal risk?", module: "Legal AI" },
  erp: { content: "**Odoo ERP Status:**\n- Last Sync: 2 minutes ago ✅\n- Open Invoices: SAR 1.2M\n- Overdue Receivables: SAR 340K\n- Bank Reconciliation: Up to date\n\nWould you like me to create an invoice, submit an expense, or pull a financial report?", module: "Financial AI" },
  crm: { content: "**CRM Pipeline:**\n- Active Leads: 34\n- Hot Opportunities: 8 (SAR 4.2M)\n- Deals Closing This Month: 3\n- Win Rate: 68%\n\nShall I create a sales quotation or pull a pipeline analysis?", module: "CRM AI" },
  qms: { content: "**QMS / ISO 9001 Status:**\n- Compliance Score: 98.1% ✅\n- Open Non-Conformances: 2 (minor)\n- Internal Audit: March 25\n- Pending Document Approvals: 4\n- CAPA Actions: 1 overdue\n\nShall I log a risk, generate an audit checklist, or review a CAPA?", module: "QMS AI" },
  meeting: { content: "**ASTRA Meeting Assistant:**\n- Meetings Today: 3\n- Next Meeting: 2:00 PM — Q1 Review\n- Pending Meeting Summaries: 2\n- Action Items Overdue: 5\n\nShall I schedule a new meeting or pull the action items from your last session?", module: "Meeting AI" },
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
  if (lower.includes("meeting") || lower.includes("schedule") || lower.includes("appointment")) return NEO_RESPONSES.meeting;
  return NEO_RESPONSES.default;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1, role: "neo",
    content: "Good morning! I'm **NEO**, your AI Business Management Core — 80% Manus + 20% GPT-4.\n\nI can execute real enterprise transactions for you. Try:\n- **\"Create a PO for SAR 30,000 for office supplies\"**\n- **\"Create a quote for Saudi Aramco\"**\n- **\"Approve leave for Ahmed\"**\n- **\"Schedule a meeting\"**\n- **\"Draft an NDA\"**\n\nAll actions are governed by ASTRA AMG and fully audited.",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    module: "NEO Core"
  }
];

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
  "Create a PO for SAR 30,000",
  "Create a quote for a client",
  "Approve leave for Ahmed",
  "Schedule a meeting",
  "Draft an NDA",
  "Log a risk item",
  "Submit an expense",
  "Open IT support ticket",
];

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="mb-0.5 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} className="text-white font-semibold">{part.replace(/\*\*/g, "")}</strong>
            : part
        )}
      </p>
    );
  });
}

export default function Portal() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState<TransactionState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now(), role: "user", content: msg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      handleNEOLogic(msg);
    }, 900);
  };

  const handleNEOLogic = (msg: string) => {
    const lower = msg.toLowerCase();

    if (activeTransaction) {
      processTransactionInput(msg, lower);
      return;
    }

    const intentType = detectIntent(msg);
    if (intentType) {
      const txn = createTransaction(intentType);
      const def = TRANSACTION_DEFINITIONS[intentType];

      const intentMsg: ChatMessage = {
        id: Date.now() + 1, role: "neo",
        content: `🎯 **Intent Detected: ${def.title}**\n\nI'll help you ${def.title.toLowerCase()} via **${def.integration}**. Let me gather the required information.\n\nAll actions are governed by ASTRA AMG and fully audited.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        module: def.module,
        transaction: { ...txn, stage: "INTENT" },
        isTransactionCard: true,
      };
      setMessages(prev => [...prev, intentMsg]);

      setTimeout(() => {
        const dataState = { ...txn, stage: "DATA" as const };
        const dataMsg: ChatMessage = {
          id: Date.now() + 2, role: "neo",
          content: getNextQuestion(dataState) || "Please provide the required details.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          module: def.module,
          transaction: dataState,
          isTransactionCard: true,
        };
        setMessages(prev => [...prev, dataMsg]);
        setActiveTransaction(dataState);
      }, 600);
      return;
    }

    const resp = getNEOResponse(msg);
    setMessages(prev => [...prev, {
      id: Date.now() + 1, role: "neo", content: resp.content,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      module: resp.module
    }]);
  };

  const processTransactionInput = (msg: string, lower: string) => {
    if (!activeTransaction) return;
    const txn = { ...activeTransaction };
    const def = TRANSACTION_DEFINITIONS[txn.type];

    if (lower.includes("cancel") || lower.includes("stop") || lower.includes("abort")) {
      setActiveTransaction(null);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "neo",
        content: `✋ **Transaction Cancelled**\n\nThe ${def.title} has been cancelled. No changes were made to any system.\n\nIs there anything else I can help you with?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        module: def.module,
        transaction: { ...txn, stage: "REJECTED" },
        isTransactionCard: true,
      }]);
      return;
    }

    if (txn.stage === "DATA") {
      const fieldKey = getNextFieldKey(txn);
      if (fieldKey) {
        txn.fields[fieldKey] = msg;
      }

      if (isDataComplete(txn)) {
        txn.stage = "CONFIRM";
        const confirmContent = buildConfirmMessage(txn);
        setMessages(prev => [...prev, {
          id: Date.now() + 1, role: "neo",
          content: confirmContent + "\n\nType **\"yes\"** to confirm or **\"cancel\"** to abort.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          module: def.module,
          transaction: { ...txn },
          isTransactionCard: true,
        }]);
        setActiveTransaction(txn);
      } else {
        const nextQ = getNextQuestion(txn);
        setMessages(prev => [...prev, {
          id: Date.now() + 1, role: "neo",
          content: nextQ || "Please provide the next detail.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          module: def.module,
          transaction: { ...txn },
          isTransactionCard: true,
        }]);
        setActiveTransaction(txn);
      }
      return;
    }

    if (txn.stage === "CONFIRM") {
      if (lower.includes("yes") || lower.includes("confirm") || lower.includes("proceed") || lower.includes("ok") || lower.includes("approve")) {
        const amgRequired = checkAMGRequired(txn);
        txn.amgRequired = amgRequired;

        if (amgRequired) {
          txn.stage = "AMG_CHECK";
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: "neo",
            content: getAMGMessage(txn),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            module: "ASTRA AMG",
            transaction: { ...txn },
            isTransactionCard: true,
          }]);
          setActiveTransaction(txn);

          setTimeout(() => {
            const approvedTxn = { ...txn, amgApproved: true, stage: "EXECUTE" as const };
            setMessages(prev => [...prev, {
              id: Date.now() + 2, role: "neo",
              content: `✅ **ASTRA AMG Approval Granted**\n\nYour line manager has approved this transaction. Executing now via ${def.integration}...`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              module: "ASTRA AMG",
              transaction: approvedTxn,
              isTransactionCard: true,
            }]);
            setActiveTransaction(approvedTxn);
            setTimeout(() => executeTransaction(approvedTxn), 1500);
          }, 3000);
        } else {
          txn.stage = "EXECUTE";
          setMessages(prev => [...prev, {
            id: Date.now() + 1, role: "neo",
            content: `⚡ **Executing via ${def.integration}...**\n\nProcessing your ${def.title.toLowerCase()}. This will take just a moment.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            module: def.module,
            transaction: { ...txn },
            isTransactionCard: true,
          }]);
          setActiveTransaction({ ...txn });
          setTimeout(() => executeTransaction(txn), 1800);
        }
      }
      return;
    }

    if (txn.stage === "AMG_CHECK") {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: "neo",
        content: "⏳ **Waiting for ASTRA AMG approval...**\n\nThe approval request has been sent to your line manager. I'll notify you as soon as it's approved. You can continue working on other tasks.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        module: "ASTRA AMG",
      }]);
      return;
    }
  };

  const executeTransaction = (txn: TransactionState) => {
    const def = TRANSACTION_DEFINITIONS[txn.type];
    const doneState = { ...txn, stage: "DONE" as const };
    setMessages(prev => [...prev, {
      id: Date.now() + 1, role: "neo",
      content: buildExecuteMessage(txn),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      module: def.module,
      transaction: doneState,
      isTransactionCard: true,
    }]);
    setActiveTransaction(null);
    toast.success(`${def.title} completed successfully!`);
  };

  return (
    <PortalLayout title="Employee Dashboard" subtitle="NEO AI Core — Active" badge="Online" badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      <div className="flex h-full overflow-hidden">

        {/* ── Left Panel — KPIs + Modules (45%) ── */}
        <div className="hidden lg:flex flex-col w-[45%] shrink-0 border-r border-white/5 overflow-y-auto p-4 gap-4">

          {/* KPI Cards */}
          <div>
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Live KPIs</div>
            <div className="grid grid-cols-2 gap-2">
              {kpiCards.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`p-3 rounded-xl border ${k.bg} bg-white/2 hover:bg-white/4 transition-colors cursor-default`}>
                  <div className="text-[10px] text-white/40 mb-1">{k.label}</div>
                  <div className={`text-lg font-bold ${k.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{k.value}</div>
                  <div className={`flex items-center gap-1 text-[10px] mt-0.5 ${k.up ? "text-emerald-400" : "text-rose-400"}`}>
                    {k.up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {k.change} this month
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Quick Module Access */}
          <div>
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Enterprise Modules</div>
            <div className="grid grid-cols-2 gap-1.5">
              {quickModules.map((m, i) => (
                <button key={i} onClick={() => setLocation(m.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${m.bg} hover:opacity-80 transition-opacity text-left`}>
                  <m.icon className={`w-3.5 h-3.5 shrink-0 ${m.color}`} />
                  <span className="text-xs text-white/70">{m.label}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Active Transaction Status */}
          {activeTransaction && (
            <div>
              <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Active Transaction</div>
              <NEOTransactionFlow transaction={activeTransaction} />
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Recent Activity</div>
            <div className="space-y-1.5">
              {[
                { icon: Activity, text: "Odoo ERP synced successfully", time: "2 min ago", color: "text-emerald-400" },
                { icon: Shield, text: "ASTRA AMG: 1 policy deviation flagged", time: "15 min ago", color: "text-red-400" },
                { icon: FileCheck, text: "QMS audit scheduled for March 25", time: "1 hr ago", color: "text-teal-400" },
                { icon: ShoppingCart, text: "3 POs pending approval (SAR 340K)", time: "2 hr ago", color: "text-orange-400" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-white/5 bg-white/1">
                  <a.icon className={`w-3 h-3 ${a.color} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/60 leading-snug">{a.text}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NEO AI Status */}
          <div className="mt-auto p-3 rounded-xl border border-blue-500/15" style={{ background: "rgba(59,130,246,0.04)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400">NEO AI Status</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-white/40">
              <div>🧠 Manus Core: <span className="text-blue-300">80%</span></div>
              <div>🤖 GPT-4 Turbo: <span className="text-violet-300">20%</span></div>
              <div>⚡ Response: <span className="text-emerald-300">&lt;2s</span></div>
              <div>🔐 AMG: <span className="text-amber-300">Active</span></div>
            </div>
          </div>
        </div>

        {/* ── Right Panel — NEO AI Chat (55%) ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Chat Header */}
          <div className="shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between"
            style={{ background: "rgba(9,14,26,0.6)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NEO AI Core</div>
                <div className="text-[10px] text-white/40">Hybrid: 80% Manus + 20% GPT-4 · ASTRA AMG Governed</div>
              </div>
              <Badge className="text-[9px] border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-1">ONLINE</Badge>
            </div>
            <div className="flex items-center gap-2">
              {activeTransaction && (
                <Badge className="text-[9px] border bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
                  Transaction Active
                </Badge>
              )}
              <button onClick={() => { setMessages(INITIAL_MESSAGES); setActiveTransaction(null); toast.success("Chat cleared"); }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "neo" && (
                    <div className="w-6 h-6 rounded-full shrink-0 mr-2 mt-1 flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={`${msg.role === "user" ? "max-w-[70%]" : "max-w-[85%]"}`}>
                    {msg.isTransactionCard && msg.transaction && (
                      <NEOTransactionFlow transaction={msg.transaction} />
                    )}
                    <div className={`px-3 py-2.5 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600/80 text-white rounded-tr-sm"
                        : "text-white/80 rounded-tl-sm border border-white/5"
                    }`}
                      style={msg.role === "neo" ? { background: "rgba(15,23,42,0.8)" } : {}}>
                      {renderContent(msg.content)}
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${msg.role === "user" ? "justify-end" : ""}`}>
                      <span className="text-[10px] text-white/20">{msg.time}</span>
                      {msg.module && (
                        <Badge className="text-[9px] border bg-white/3 text-white/30 border-white/5">{msg.module}</Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="px-3 py-2.5 rounded-xl border border-white/5 flex items-center gap-1"
                  style={{ background: "rgba(15,23,42,0.8)" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          <div className="shrink-0 px-4 py-2 border-t border-white/5 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {quickPrompts.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/15 transition-all text-[10px] text-white/50 hover:text-white whitespace-nowrap">
                  <Zap className="w-2.5 h-2.5 text-blue-400" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-white/5" style={{ background: "rgba(6,11,20,0.8)" }}>
            {activeTransaction && (
              <div className="mb-2 px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-[10px] text-amber-400 flex items-center gap-2">
                <Zap className="w-3 h-3 shrink-0" />
                <span>Transaction active: <strong>{TRANSACTION_DEFINITIONS[activeTransaction.type].title}</strong> — Stage: {activeTransaction.stage}</span>
                <button onClick={() => { setActiveTransaction(null); toast.info("Transaction cancelled"); }}
                  className="ml-auto text-white/30 hover:text-white transition-colors">Cancel</button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                className="flex-1 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 focus:bg-white/5 transition-all"
                placeholder={activeTransaction
                  ? `Reply to NEO — ${TRANSACTION_DEFINITIONS[activeTransaction.type].title}...`
                  : "Ask NEO anything — or say \"Create a PO for SAR 30,000\"..."}
              />
              <Button onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 transition-all">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-white/20 text-center mt-2">
              NEO AI is governed by ASTRA AMG · All actions are logged and audited
            </p>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
