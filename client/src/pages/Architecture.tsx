/**
 * Website Architecture Page — Interactive system architecture visualization
 * Design: "Neural Depth" — Deep space dark, glass morphism, bioluminescent accents
 * Shows: Full platform layers, data flows, module interconnections, tech stack
 */
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  ChevronLeft, ArrowRight, Layers, Database, Brain, Shield,
  Users, BarChart3, ShoppingCart, FileCheck, Scale, MessageSquare,
  ScrollText, UserCheck, Globe, Lock, Server, Cpu, Zap,
  GitBranch, Activity, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ── Layer definitions ──────────────────────────────────────────────────────
const LAYERS = [
  {
    id: "presentation",
    label: "Layer 1 — Presentation",
    sublabel: "Public Website + Employee Portal",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.3)",
    icon: Globe,
    nodes: [
      { id: "home", label: "Corporate Website", sub: "React 19 + Tailwind 4", icon: Globe },
      { id: "login", label: "Login / Auth", sub: "JWT + OAuth 2.0", icon: Lock },
      { id: "portal", label: "Employee Portal", sub: "Dashboard + NEO Chat", icon: Users },
    ]
  },
  {
    id: "modules",
    label: "Layer 2 — Enterprise Modules",
    sublabel: "12 Integrated Business Applications",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.25)",
    icon: Layers,
    nodes: [
      { id: "hr", label: "HR System", sub: "Employees · Payroll · Leave", icon: Users },
      { id: "erp", label: "Odoo ERP", sub: "Finance · Inventory · AP/AR", icon: Database },
      { id: "crm", label: "CRM", sub: "Leads · Pipeline · AI Scoring", icon: UserCheck },
      { id: "kpi", label: "KPI Dashboard", sub: "Real-time Analytics", icon: BarChart3 },
      { id: "proc", label: "Procurement", sub: "PO · Vendors · Contracts", icon: ShoppingCart },
      { id: "qms", label: "QMS / ISO 9001", sub: "Compliance · CAPA · Audit", icon: FileCheck },
      { id: "legal", label: "Legal Module", sub: "Contracts · Compliance", icon: Scale },
      { id: "comms", label: "Inter-Corp Comms", sub: "Approvals · Decisions", icon: MessageSquare },
      { id: "audit", label: "Audit & Logs", sub: "Full Activity Trail", icon: ScrollText },
    ]
  },
  {
    id: "ai",
    label: "Layer 3 — NEO AI Core",
    sublabel: "Hybrid AI Orchestration Engine (80% Manus + 20% GPT-4)",
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.3)",
    icon: Brain,
    nodes: [
      { id: "neo", label: "NEO Orchestrator", sub: "Core Engine", icon: Brain },
      { id: "conv", label: "Conversational AI", sub: "NLP Interface", icon: MessageSquare },
      { id: "decision", label: "Decision-Making AI", sub: "Multi-criteria", icon: GitBranch },
      { id: "financial", label: "Financial AI", sub: "Accounting & Analysis", icon: BarChart3 },
      { id: "qmsai", label: "QMS AI", sub: "ISO 9001 Compliance", icon: FileCheck },
      { id: "risk", label: "Risk Management AI", sub: "Critical Thinking", icon: Shield },
      { id: "bizai", label: "Business Mgmt AI", sub: "Operations & Strategy", icon: Cpu },
      { id: "logic", label: "Logic & Reasoning AI", sub: "Constraint Solving", icon: Zap },
    ]
  },
  {
    id: "governance",
    label: "Layer 4 — ASTRA AMG Governance",
    sublabel: "Audit · Management · Governance — Policy Enforcement",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.25)",
    icon: Shield,
    nodes: [
      { id: "amg", label: "ASTRA AMG Core", sub: "Policy Engine", icon: Shield },
      { id: "rbac", label: "RBAC", sub: "Role-Based Access", icon: Lock },
      { id: "auditeng", label: "Audit Engine", sub: "Immutable Logs", icon: ScrollText },
      { id: "compliance", label: "Compliance Monitor", sub: "ISO 9001 + Legal", icon: FileCheck },
    ]
  },
  {
    id: "data",
    label: "Layer 5 — Data & Infrastructure",
    sublabel: "PostgreSQL · Redis · Odoo API · Cloud · CI/CD",
    color: "#10B981",
    bg: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.25)",
    icon: Server,
    nodes: [
      { id: "pg", label: "PostgreSQL", sub: "Primary Database", icon: Database },
      { id: "redis", label: "Redis Cache", sub: "Session + Queue", icon: Activity },
      { id: "odoo", label: "Odoo ERP API", sub: "External Integration", icon: Server },
      { id: "manus", label: "Manus AI Platform", sub: "80% AI Traffic", icon: Brain },
      { id: "gpt", label: "GPT-4 Turbo API", sub: "20% AI Traffic", icon: Cpu },
      { id: "cloud", label: "Cloud Infrastructure", sub: "AWS / Azure", icon: Globe },
    ]
  },
];

const FLOW_ITEMS = [
  { from: "Employee", to: "Portal Dashboard", via: "HTTPS + JWT Auth", color: "#3B82F6" },
  { from: "Portal Chat", to: "NEO Orchestrator", via: "WebSocket / REST", color: "#8B5CF6" },
  { from: "NEO Core", to: "7 AI Modules", via: "Internal Routing (80/20)", color: "#8B5CF6" },
  { from: "NEO Core", to: "Enterprise Modules", via: "tRPC API Calls", color: "#06B6D4" },
  { from: "All Modules", to: "ASTRA AMG", via: "Policy Enforcement Layer", color: "#EF4444" },
  { from: "ASTRA AMG", to: "Audit Engine", via: "Immutable Event Stream", color: "#EF4444" },
  { from: "ERP Module", to: "Odoo API", via: "REST Sync (real-time)", color: "#10B981" },
  { from: "All Data", to: "PostgreSQL + Redis", via: "ORM + Cache Layer", color: "#10B981" },
];

const TECH_STACK = [
  { layer: "Frontend", items: ["React 19", "TypeScript 5.6", "Tailwind CSS 4", "Framer Motion", "Wouter", "Recharts", "shadcn/ui"] },
  { layer: "AI Infrastructure", items: ["Manus AI Platform", "GPT-4 Turbo API", "NEO Orchestrator", "Vector DB", "Context Manager"] },
  { layer: "Backend (Phase 2)", items: ["Node.js", "tRPC", "Express", "JWT + OAuth 2.0", "WebSocket"] },
  { layer: "Database", items: ["PostgreSQL", "Redis", "Odoo ERP DB", "S3 File Storage"] },
  { layer: "Governance", items: ["ASTRA AMG Engine", "RBAC", "Audit Logs", "ISO 9001 Engine"] },
  { layer: "DevOps", items: ["Docker", "CI/CD Pipeline", "AWS / Azure", "Monitoring", "Backup"] },
];

const STATS = [
  { value: "5", label: "Architecture Layers", color: "text-blue-400" },
  { value: "12", label: "Enterprise Modules", color: "text-cyan-400" },
  { value: "7", label: "AI Specialist Modules", color: "text-violet-400" },
  { value: "125+", label: "API Procedures", color: "text-emerald-400" },
  { value: "80/20", label: "Hybrid AI Split", color: "text-amber-400" },
  { value: "<2s", label: "Response Time", color: "text-red-400" },
];

export default function Architecture() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [expandedLayer, setExpandedLayer] = useState<string | null>("presentation");
  const [activeTab, setActiveTab] = useState<"layers" | "flow" | "stack">("layers");

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 h-14 flex items-center px-6"
        style={{ background: "rgba(6,11,20,0.92)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mr-6">
          <ChevronLeft className="w-4 h-4" /> {t("Back", "رجوع")}
        </button>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t("Platform Architecture", "هيكل المنصة")}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px]">v1.0 — Phase 1</Badge>
          <Button onClick={() => setLocation("/login")} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
            {t("Access Portal", "دخول البوابة")} <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        </div>
      </nav>

      <div className="pt-14">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-white/5" style={{ background: "linear-gradient(135deg, #060B14 0%, #0D1B3E 50%, #060B14 100%)" }}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, #3B82F6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8B5CF6 0%, transparent 40%)"
          }} />
          <div className="container py-12 relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20">{t("System Architecture", "هيكل النظام")}</Badge>
              <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("Golden Team Enterprise Platform", "منصة الفريق الذهبي المؤسسية")}
              </h1>
              <p className="text-white/50 max-w-2xl mb-8">
                {t("A 5-layer architecture combining a React frontend, 12 enterprise modules, NEO AI Core with 7 specialized AI modules, ASTRA AMG governance, and a cloud-native data infrastructure.", "هيكل من 5 طبقات يجمع واجهة React وأمامية، و12 وحدة مؤسسية، ونواة NEO AI بـ7 وحدات ذكاء اصطناعي متخصصة، وحوكمة ASTRA AMG، وبنية تحتية سحابية للبيانات.")}
              </p>
              {/* Stats */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {STATS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                    className="glass-card border border-white/5 p-3 rounded-xl text-center">
                    <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{s.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-14 z-40 border-b border-white/5" style={{ background: "rgba(6,11,20,0.95)", backdropFilter: "blur(20px)" }}>
          <div className="container flex gap-1 py-2">
            {(["layers", "flow", "stack"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                  ${activeTab === tab ? "bg-blue-600 text-white" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                {tab === "layers" ? t("Architecture Layers", "طبقات الهيكل") : tab === "flow" ? t("Data Flow", "تدفق البيانات") : t("Tech Stack", "التقنيات المستخدمة")}
              </button>
            ))}
          </div>
        </div>

        <div className="container py-8">
          <AnimatePresence mode="wait">

            {/* ── LAYERS TAB ── */}
            {activeTab === "layers" && (
              <motion.div key="layers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {LAYERS.map((layer, li) => {
                  const expanded = expandedLayer === layer.id;
                  const Icon = layer.icon;
                  return (
                    <motion.div key={layer.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: li * 0.08 }}>
                      {/* Layer header */}
                      <button onClick={() => setExpandedLayer(expanded ? null : layer.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left"
                        style={{ background: expanded ? layer.bg : "rgba(255,255,255,0.02)", borderColor: expanded ? layer.border : "rgba(255,255,255,0.06)" }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${layer.color}20`, border: `1px solid ${layer.color}40` }}>
                          <Icon className="w-5 h-5" style={{ color: layer.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{layer.label}</div>
                          <div className="text-xs text-white/40">{layer.sublabel}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="text-[10px] border" style={{ background: `${layer.color}15`, color: layer.color, borderColor: `${layer.color}30` }}>
                            {layer.nodes.length} components
                          </Badge>
                          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                        </div>
                      </button>

                      {/* Layer nodes */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 pl-4">
                              {layer.nodes.map((node, ni) => {
                                const NIcon = node.icon;
                                return (
                                  <motion.div key={node.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ni * 0.04 }}
                                    className="glass-card border border-white/5 p-4 rounded-xl hover:border-white/15 transition-all group"
                                    style={{ borderLeft: `3px solid ${layer.color}60` }}>
                                    <NIcon className="w-4 h-4 mb-2" style={{ color: layer.color }} />
                                    <div className="text-sm font-semibold text-white group-hover:text-white transition-colors">{node.label}</div>
                                    <div className="text-[11px] text-white/40 mt-0.5">{node.sub}</div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

                {/* Architecture Summary Diagram */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="mt-8 glass-card border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Architecture Overview Diagram</h3>
                  <div className="overflow-x-auto">
                    <svg viewBox="0 0 900 520" className="w-full" style={{ minWidth: "600px" }}>
                      <defs>
                        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L8,3 z" fill="rgba(255,255,255,0.3)" />
                        </marker>
                        <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L8,3 z" fill="#3B82F6" />
                        </marker>
                        <marker id="arrow-violet" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L8,3 z" fill="#8B5CF6" />
                        </marker>
                        <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L8,3 z" fill="#EF4444" />
                        </marker>
                        <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                          <path d="M0,0 L0,6 L8,3 z" fill="#10B981" />
                        </marker>
                        <filter id="glow-blue">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="glow-violet">
                          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>

                      {/* Background layers */}
                      {/* Layer 1 - Presentation */}
                      <rect x="10" y="10" width="880" height="70" rx="10" fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.2)" strokeWidth="1"/>
                      <text x="24" y="30" fill="#3B82F6" fontSize="10" fontFamily="Space Grotesk, sans-serif" fontWeight="600">LAYER 1 — PRESENTATION</text>
                      <rect x="30" y="38" width="130" height="32" rx="6" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
                      <text x="95" y="57" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Corporate Website</text>
                      <rect x="180" y="38" width="110" height="32" rx="6" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth="1"/>
                      <text x="235" y="57" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif">Login / Auth</text>
                      <rect x="310" y="38" width="130" height="32" rx="6" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5" filter="url(#glow-blue)"/>
                      <text x="375" y="57" fill="white" fontSize="10" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">Employee Portal + NEO Chat</text>

                      {/* Layer 2 - Modules */}
                      <rect x="10" y="100" width="880" height="80" rx="10" fill="rgba(6,182,212,0.05)" stroke="rgba(6,182,212,0.2)" strokeWidth="1"/>
                      <text x="24" y="118" fill="#06B6D4" fontSize="10" fontFamily="Space Grotesk, sans-serif" fontWeight="600">LAYER 2 — ENTERPRISE MODULES (12)</text>
                      {["HR", "Odoo ERP", "CRM", "KPI", "Procurement", "QMS", "Legal", "Comms", "Audit"].map((m, i) => (
                        <g key={m}>
                          <rect x={30 + i * 96} y="124" width="88" height="44" rx="6" fill="rgba(6,182,212,0.1)" stroke="rgba(6,182,212,0.3)" strokeWidth="1"/>
                          <text x={74 + i * 96} y="150" fill="rgba(255,255,255,0.85)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">{m}</text>
                        </g>
                      ))}

                      {/* Layer 3 - NEO AI */}
                      <rect x="10" y="200" width="880" height="90" rx="10" fill="rgba(139,92,246,0.07)" stroke="rgba(139,92,246,0.25)" strokeWidth="1"/>
                      <text x="24" y="218" fill="#8B5CF6" fontSize="10" fontFamily="Space Grotesk, sans-serif" fontWeight="600">LAYER 3 — NEO AI CORE (7 MODULES)</text>
                      {/* NEO Core center */}
                      <rect x="30" y="224" width="120" height="56" rx="8" fill="rgba(139,92,246,0.25)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" filter="url(#glow-violet)"/>
                      <text x="90" y="246" fill="white" fontSize="10" textAnchor="middle" fontFamily="Space Grotesk, sans-serif" fontWeight="bold">NEO</text>
                      <text x="90" y="260" fill="rgba(255,255,255,0.6)" fontSize="8" textAnchor="middle" fontFamily="sans-serif">Orchestrator Core</text>
                      <text x="90" y="272" fill="#8B5CF6" fontSize="8" textAnchor="middle" fontFamily="sans-serif">80% Manus + 20% GPT-4</text>
                      {/* AI Modules */}
                      {["Conv AI", "Decision AI", "Financial AI", "QMS AI", "Risk AI", "Biz Mgmt AI", "Logic AI"].map((m, i) => (
                        <g key={m}>
                          <rect x={170 + i * 104} y="224" width="96" height="56" rx="6" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.25)" strokeWidth="1"/>
                          <text x={218 + i * 104} y="256" fill="rgba(255,255,255,0.8)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">{m}</text>
                        </g>
                      ))}

                      {/* Layer 4 - Governance */}
                      <rect x="10" y="310" width="880" height="70" rx="10" fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.2)" strokeWidth="1"/>
                      <text x="24" y="328" fill="#EF4444" fontSize="10" fontFamily="Space Grotesk, sans-serif" fontWeight="600">LAYER 4 — ASTRA AMG GOVERNANCE</text>
                      {["ASTRA AMG Core", "RBAC Engine", "Audit Engine", "Compliance Monitor", "Policy Enforcer"].map((m, i) => (
                        <g key={m}>
                          <rect x={30 + i * 170} y="334" width="158" height="36" rx="6" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth="1"/>
                          <text x={109 + i * 170} y="356" fill="rgba(255,255,255,0.8)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">{m}</text>
                        </g>
                      ))}

                      {/* Layer 5 - Data */}
                      <rect x="10" y="400" width="880" height="70" rx="10" fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.2)" strokeWidth="1"/>
                      <text x="24" y="418" fill="#10B981" fontSize="10" fontFamily="Space Grotesk, sans-serif" fontWeight="600">LAYER 5 — DATA & INFRASTRUCTURE</text>
                      {["PostgreSQL", "Redis Cache", "Odoo API", "Manus AI", "GPT-4 API", "Cloud (AWS/Azure)"].map((m, i) => (
                        <g key={m}>
                          <rect x={30 + i * 143} y="424" width="135" height="36" rx="6" fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.3)" strokeWidth="1"/>
                          <text x={97 + i * 143} y="446" fill="rgba(255,255,255,0.8)" fontSize="9" textAnchor="middle" fontFamily="sans-serif">{m}</text>
                        </g>
                      ))}

                      {/* Flow arrows */}
                      {/* L1 → L2 */}
                      <line x1="375" y1="80" x2="375" y2="98" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arrow-blue)"/>
                      {/* L2 → L3 */}
                      <line x1="450" y1="182" x2="450" y2="198" stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arrow)"/>
                      {/* L3 → L4 */}
                      <line x1="450" y1="292" x2="450" y2="308" stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arrow-violet)"/>
                      {/* L4 → L5 */}
                      <line x1="450" y1="382" x2="450" y2="398" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arrow-red)"/>
                      {/* Governance wraps all */}
                      <path d="M 892 155 Q 920 155 920 252 Q 920 350 892 350" stroke="rgba(239,68,68,0.4)" strokeWidth="1.5" fill="none" strokeDasharray="6,3"/>
                      <text x="925" y="255" fill="rgba(239,68,68,0.6)" fontSize="9" fontFamily="sans-serif" transform="rotate(90,925,255)">ASTRA AMG GOVERNS ALL LAYERS</text>
                    </svg>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── FLOW TAB ── */}
            {activeTab === "flow" && (
              <motion.div key="flow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Data Flow & Integration Map</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FLOW_ITEMS.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="glass-card border border-white/5 p-5 rounded-xl flex items-center gap-4">
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-white">{f.from}</div>
                        <div className="text-[10px] text-white/30">Source</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full h-px" style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
                        <div className="text-[10px] text-white/40 mt-1 text-center">{f.via}</div>
                        <div className="w-full h-px mt-1" style={{ background: `linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
                      </div>
                      <div className="shrink-0">
                        <div className="text-sm font-semibold" style={{ color: f.color }}>{f.to}</div>
                        <div className="text-[10px] text-white/30">Destination</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* NEO AI Routing Detail */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="glass-card border border-violet-500/20 rounded-2xl p-6 mt-4">
                  <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    NEO AI Intelligent Router — Traffic Split
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl border border-violet-500/20" style={{ background: "rgba(139,92,246,0.08)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-violet-300">Manus AI Platform</span>
                        <span className="text-2xl font-bold text-violet-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>80%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 mb-3">
                        <div className="h-2 rounded-full bg-violet-500" style={{ width: "80%" }} />
                      </div>
                      <ul className="space-y-1 text-xs text-white/50">
                        <li>• Multi-model orchestration</li>
                        <li>• Context management system</li>
                        <li>• Tool integration framework</li>
                        <li>• Real-time processing engine</li>
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl border border-blue-500/20" style={{ background: "rgba(59,130,246,0.08)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-blue-300">GPT-4 Turbo API</span>
                        <span className="text-2xl font-bold text-blue-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>20%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 mb-3">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: "20%" }} />
                      </div>
                      <ul className="space-y-1 text-xs text-white/50">
                        <li>• Specialized domain expertise</li>
                        <li>• Complex reasoning tasks</li>
                        <li>• Document analysis</li>
                        <li>• Fallback intelligence layer</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── STACK TAB ── */}
            {activeTab === "stack" && (
              <motion.div key="stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-lg font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Full Technology Stack</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {TECH_STACK.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="glass-card border border-white/5 p-5 rounded-xl">
                      <div className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">{t.layer}</div>
                      <div className="flex flex-wrap gap-2">
                        {t.items.map((item, j) => (
                          <span key={j} className="text-xs px-2.5 py-1 rounded-lg border border-white/8 text-white/65 bg-white/3 font-medium">{item}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Phase roadmap */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="mt-8 glass-card border border-white/5 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Implementation Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Phase 1 — Frontend Platform", pct: 85, color: "bg-blue-500", status: "In Progress" },
                      { label: "Phase 2 — Module Integration", pct: 15, color: "bg-cyan-500", status: "Planned" },
                      { label: "Phase 3 — NEO AI Live", pct: 5, color: "bg-violet-500", status: "Planned" },
                      { label: "Phase 4 — Production Deploy", pct: 0, color: "bg-emerald-500", status: "Planned" },
                    ].map((p, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/70">{p.label}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] border ${p.status === "In Progress" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/5 text-white/30 border-white/10"}`}>{p.status}</Badge>
                            <span className="text-xs text-white/40">{p.pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <motion.div className={`h-1.5 rounded-full ${p.color}`}
                            initial={{ width: 0 }} whileInView={{ width: `${p.pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
