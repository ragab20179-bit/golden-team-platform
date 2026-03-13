/**
 * NEO AI Architecture Page — Interactive visualization of the NEO AI system
 * Design: "Neural Depth"
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Brain, ArrowRight, Zap, Database, Cpu, Shield, BarChart3, Scale, FileCheck, MessageSquare, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NEO_CORE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/neo-ai-core-Ls2GrxCppFSfrqMoUsDX9Q.webp";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/portal-bg-eTK56HMMBVDQMWrojwU244.webp";

const layers = [
  {
    title: "Data Sources Layer",
    color: "border-slate-500/30",
    bg: "bg-slate-500/5",
    titleColor: "text-slate-300",
    items: ["IFC / BIM Files", "DXF Drawings", "PDF Documents", "Meeting Transcripts", "Project Data", "ERP/CRM Data", "HR Records", "Financial Data"]
  },
  {
    title: "AI Infrastructure (Manus Platform)",
    color: "border-blue-500/30",
    bg: "bg-blue-500/5",
    titleColor: "text-blue-300",
    items: ["Multi-Model Orchestration", "Context Management System", "Tool Integration Framework", "Real-Time Processing Engine", "80% Traffic Routing", "Enterprise Security Layer"]
  },
  {
    title: "NEO Orchestration Core",
    color: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    titleColor: "text-cyan-300",
    items: ["Intelligent Router", "GPT-4 Turbo API (20%)", "Hybrid Decision Engine", "Module Dispatcher", "Response Aggregator", "ASTRA AMG Gateway"]
  },
];

const modules = [
  { name: "Conversational AI", icon: MessageSquare, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/5", desc: "Natural language interface for all employees. Handles queries, commands, and complex multi-turn conversations across all enterprise modules." },
  { name: "Decision-Making AI", icon: Scale, color: "text-violet-400", border: "border-violet-500/20", bg: "bg-violet-500/5", desc: "Multi-criteria decision analysis. Evaluates options, weighs trade-offs, and provides structured recommendations with confidence scores." },
  { name: "Critical Thinking AI", icon: Brain, color: "text-cyan-400", border: "border-cyan-500/20", bg: "bg-cyan-500/5", desc: "Risk identification, assumption validation, and logical fallacy detection. Challenges proposals to surface hidden risks before decisions are made." },
  { name: "Logic & Reasoning AI", icon: Cpu, color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/5", desc: "Constraint solving, logical consistency checking, and formal reasoning. Ensures all business rules and policies are consistently applied." },
  { name: "QMS AI", icon: FileCheck, color: "text-teal-400", border: "border-teal-500/20", bg: "bg-teal-500/5", desc: "ISO 9001 compliance monitoring, NCR analysis, CAPA tracking, and quality trend analysis. Proactively flags compliance risks." },
  { name: "Accounting & Financial AI", icon: BarChart3, color: "text-amber-400", border: "border-amber-500/20", bg: "bg-amber-500/5", desc: "Financial analysis, budget variance reporting, cash flow forecasting, and Odoo ERP integration for real-time financial intelligence." },
  { name: "Business Management AI", icon: Database, color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5", desc: "Operations management, strategic planning support, KPI monitoring, and cross-department workflow orchestration." },
];

const applications = [
  "HR System", "Odoo ERP", "AI-Assisted CRM", "KPI Dashboard",
  "Procurement", "QMS / ISO 9001", "Legal Module", "Communications",
  "Audit & Logs", "ASTRA AMG", "ASTRA PM", "Knowledge Base"
];

export default function NEOArchitecture() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 h-14 flex items-center px-6" style={{ background: "rgba(6,11,20,0.9)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mr-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>NEO AI Architecture</span>
        </div>
        <div className="ml-auto flex gap-3">
          <Button onClick={() => setLocation("/login")} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
            Access Portal <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        </div>
      </nav>

      <div className="pt-14">
        {/* Hero */}
        <div className="relative py-20 text-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-[#060B14]/80" />
          </div>
          <div className="relative z-10 container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Zap className="w-3 h-3 mr-1" /> Hybrid AI: 80% Manus + 20% GPT-4
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                NEO AI Architecture
              </h1>
              <p className="text-white/50 max-w-2xl mx-auto text-lg">
                A 4-layer hybrid AI system with 7 specialized modules, 125+ API procedures, and sub-2-second response times — orchestrating every aspect of Golden Team's enterprise operations.
              </p>
            </motion.div>
            <div className="flex justify-center gap-8 mt-8">
              {[["7", "AI Modules"], ["125+", "API Procedures"], ["71%", "Cost Savings"], ["<2s", "Response Time"]].map(([v, l], i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }} className="text-center">
                  <div className="text-2xl font-bold gradient-text-blue" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{v}</div>
                  <div className="text-xs text-white/40">{l}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="container py-16 space-y-16">
          {/* Architecture Layers */}
          <div>
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              System Architecture Layers
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {layers.map((layer, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`glass-card border ${layer.color} ${layer.bg} p-6 rounded-xl`}>
                  <h3 className={`text-sm font-bold mb-4 ${layer.titleColor}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{layer.title}</h3>
                  <ul className="space-y-2">
                    {layer.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-xs text-white/50">
                        <div className="w-1 h-1 rounded-full bg-current opacity-50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* NEO Core Visual */}
          <div className="flex flex-col items-center">
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              NEO Orchestration Core
            </motion.h2>
            <div className="relative w-64 h-64 mb-8">
              <div className="absolute inset-0 rounded-full neo-pulse" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)" }} />
              <img src={NEO_CORE_IMG} alt="NEO AI Core" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-2">Manus AI — 80% Traffic</Badge>
              <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-4 py-2">GPT-4 Turbo — 20% Traffic</Badge>
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-2">ASTRA AMG Governed</Badge>
            </div>
          </div>

          {/* 7 Specialized Modules */}
          <div>
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              7 Specialized AI Modules
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className={`glass-card border ${m.border} ${m.bg} p-6 rounded-xl glass-card-hover`}>
                  <m.icon className={`w-6 h-6 ${m.color} mb-3`} />
                  <h3 className="text-sm font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.name}</h3>
                  <p className="text-xs text-white/45 leading-relaxed">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Applications Layer */}
          <div>
            <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-2xl font-bold text-white mb-8 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Applications Layer — 12 Enterprise Modules
            </motion.h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {applications.map((app, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="glass-card border border-white/8 px-4 py-3 rounded-xl text-sm text-white/70 hover:text-white hover:border-blue-500/30 transition-all cursor-default">
                  {app}
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button onClick={() => setLocation("/login")} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-10">
              Access the Employee Portal <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
