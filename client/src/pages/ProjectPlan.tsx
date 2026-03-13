/**
 * Project Plan Page — Interactive roadmap and specification viewer
 * Design: "Neural Depth"
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ChevronLeft, CheckCircle, Clock, Circle, ArrowRight, FileText, Brain, Shield, Database, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    id: "P1", phase: "Phase 1", weeks: "Weeks 1–4", title: "Foundation & Core Platform",
    color: "border-l-blue-500", dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    status: "In Progress",
    deliverables: [
      "Corporate website with full branding (Golden Team identity)",
      "Employee login portal with JWT + OAuth authentication",
      "Main dashboard shell with sidebar navigation",
      "NEO AI chat interface UI (frontend)",
      "Initial cloud infrastructure setup",
      "CI/CD pipeline configuration",
    ]
  },
  {
    id: "P2", phase: "Phase 2", weeks: "Weeks 5–12", title: "Business Module Integration",
    color: "border-l-cyan-500", dot: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    status: "Planned",
    deliverables: [
      "HR System — employee management, payroll, leave tracking",
      "Odoo ERP full integration — accounting, inventory, AP/AR",
      "AI-assisted CRM — pipeline management, lead scoring",
      "KPI Dashboard — real-time analytics across all departments",
      "Procurement Module — PO management, vendor evaluation",
      "Legal Module — contract register, compliance tracking",
      "Role-based access control (RBAC) implementation",
    ]
  },
  {
    id: "P3", phase: "Phase 3", weeks: "Weeks 13–20", title: "NEO AI Core & ASTRA AMG",
    color: "border-l-emerald-500", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    status: "Planned",
    deliverables: [
      "NEO AI Core live integration (80% Manus + 20% GPT-4)",
      "7 specialized AI modules deployment",
      "ASTRA AMG governance layer — policy enforcement",
      "Inter-corporate communications & decision approvals",
      "Full audit & logs system with real-time monitoring",
      "QMS / ISO 9001 full compliance module",
      "AI-powered document analysis and generation",
    ]
  },
  {
    id: "P4", phase: "Phase 4", weeks: "Weeks 21–24", title: "Testing, Optimization & Deployment",
    color: "border-l-amber-500", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    status: "Planned",
    deliverables: [
      "Comprehensive QA testing — all modules",
      "Performance optimization — sub-2s AI response times",
      "Security penetration testing",
      "Production deployment on enterprise cloud",
      "Employee training program (all departments)",
      "Full technical documentation and handover",
      "Post-launch support and monitoring setup",
    ]
  },
];

const techStack = [
  { category: "Frontend", items: ["React 19", "TypeScript", "Tailwind CSS 4", "Framer Motion", "Recharts"] },
  { category: "Backend", items: ["Node.js", "tRPC", "PostgreSQL", "Redis", "Odoo API"] },
  { category: "AI Layer", items: ["Manus AI Platform", "GPT-4 Turbo API", "NEO Orchestrator", "Vector DB"] },
  { category: "Infrastructure", items: ["AWS / Azure", "Docker", "CI/CD", "JWT + OAuth", "ASTRA AMG"] },
];

const modules = [
  { icon: Users, name: "HR System", desc: "Employee management, payroll, leave, performance", color: "text-cyan-400" },
  { icon: Database, name: "Odoo ERP", desc: "Full ERP integration — finance, inventory, operations", color: "text-emerald-400" },
  { icon: BarChart3, name: "CRM + KPIs", desc: "AI-assisted CRM and real-time KPI analytics", color: "text-violet-400" },
  { icon: Brain, name: "NEO AI Core", desc: "7-module hybrid AI orchestration engine", color: "text-blue-400" },
  { icon: Shield, name: "ASTRA AMG", desc: "Governance, audit, compliance, policy enforcement", color: "text-red-400" },
  { icon: FileText, name: "QMS + Legal", desc: "ISO 9001 compliance and contract management", color: "text-teal-400" },
];

export default function ProjectPlan() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#060B14] text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 h-14 flex items-center px-6" style={{ background: "rgba(6,11,20,0.9)", backdropFilter: "blur(20px)" }}>
        <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mr-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Project Plan</span>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setLocation("/login")} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
            Access Portal <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        </div>
      </nav>

      <div className="pt-14 container py-12 space-y-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">24-Week Implementation Plan</Badge>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Golden Team Enterprise Platform
          </h1>
          <p className="text-white/50 max-w-2xl mx-auto">
            A comprehensive enterprise platform combining 12 integrated modules, NEO AI Core, and ASTRA AMG governance — built for Golden Team Trading Services.
          </p>
        </motion.div>

        {/* Module Overview */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Platform Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card border border-white/5 p-5 rounded-xl flex items-start gap-4">
                <m.icon className={`w-5 h-5 ${m.color} mt-0.5 shrink-0`} />
                <div>
                  <div className="text-sm font-semibold text-white mb-1">{m.name}</div>
                  <div className="text-xs text-white/40">{m.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Phase Timeline */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Implementation Phases</h2>
          <div className="space-y-6">
            {phases.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`glass-card border border-white/5 border-l-2 ${p.color} p-6 rounded-xl`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${p.dot}`} />
                    <div>
                      <div className="text-xs text-white/40">{p.phase} · {p.weeks}</div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.title}</h3>
                    </div>
                  </div>
                  <Badge className={`text-[10px] border ${p.badge}`}>{p.status}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {p.deliverables.map((d, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm text-white/55">
                      {p.status === "In Progress" && j < 2
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        : p.status === "In Progress"
                          ? <Clock className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          : <Circle className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                      }
                      {d}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {techStack.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="glass-card border border-white/5 p-5 rounded-xl">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">{t.category}</div>
                <div className="flex flex-wrap gap-2">
                  {t.items.map((item, j) => (
                    <span key={j} className="text-xs px-2 py-1 rounded-md border border-white/8 text-white/60 bg-white/3">{item}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pb-8">
          <Button onClick={() => setLocation("/login")} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-10">
            Access Employee Portal <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
