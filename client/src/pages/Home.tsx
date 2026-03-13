/**
 * Golden Team Trading Services — Public Corporate Website
 * Design: "Neural Depth" — Deep space dark canvas, bioluminescent accents, glass morphism
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Brain, Shield, BarChart3, Users, ChevronRight,
  Zap, Award, ArrowRight, CheckCircle, Star,
  Building2, Cpu, FileCheck, TrendingUp, Database,
  UserCheck, ShoppingCart, Scale, MessageSquare, ScrollText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/hero-bg-ZYqyXBpXu9NZYcqkMNAPvk.webp";
const NEO_CORE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/neo-ai-core-Ls2GrxCppFSfrqMoUsDX9Q.webp";
const SERVICES_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/services-bg-cpSUzQD77mgc7AELkQcPXU.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55 }
  })
};

const services = [
  { icon: Building2, title: "Administrative Services", desc: "Comprehensive administrative support and business process management for enterprise operations.", color: "text-blue-400", border: "border-blue-500/20", hover: "hover:border-blue-500/50" },
  { icon: TrendingUp, title: "Business Development", desc: "Strategic growth consulting, market analysis, and business expansion services.", color: "text-cyan-400", border: "border-cyan-500/20", hover: "hover:border-cyan-500/50" },
  { icon: Cpu, title: "IT Solutions", desc: "End-to-end IT infrastructure, software development, and digital transformation.", color: "text-emerald-400", border: "border-emerald-500/20", hover: "hover:border-emerald-500/50" },
  { icon: Brain, title: "NEO AI Core", desc: "Hybrid AI orchestration engine — 80% Manus AI + 20% GPT-4 with 7 specialized modules.", color: "text-amber-400", border: "border-amber-500/20", hover: "hover:border-amber-500/50" },
  { icon: Database, title: "Odoo ERP Integration", desc: "Full Odoo ERP system integration for finance, inventory, HR, and operations management.", color: "text-violet-400", border: "border-violet-500/20", hover: "hover:border-violet-500/50" },
  { icon: UserCheck, title: "AI-Assisted CRM", desc: "Intelligent customer relationship management with predictive analytics and automation.", color: "text-sky-400", border: "border-sky-500/20", hover: "hover:border-sky-500/50" },
  { icon: BarChart3, title: "KPI Dashboard", desc: "Real-time key performance indicators and analytics across all business units.", color: "text-orange-400", border: "border-orange-500/20", hover: "hover:border-orange-500/50" },
  { icon: ShoppingCart, title: "Procurement Module", desc: "End-to-end procurement management with vendor evaluation and contract lifecycle.", color: "text-teal-400", border: "border-teal-500/20", hover: "hover:border-teal-500/50" },
  { icon: FileCheck, title: "QMS / ISO 9001", desc: "Full Quality Management System ensuring ISO 9001 compliance and continuous improvement.", color: "text-green-400", border: "border-green-500/20", hover: "hover:border-green-500/50" },
  { icon: Scale, title: "Legal Module", desc: "Contract management, legal document tracking, compliance monitoring, and risk assessment.", color: "text-rose-400", border: "border-rose-500/20", hover: "hover:border-rose-500/50" },
  { icon: MessageSquare, title: "Inter-Corporate Comms", desc: "Secure internal communications, decision approvals, and cross-department workflows.", color: "text-indigo-400", border: "border-indigo-500/20", hover: "hover:border-indigo-500/50" },
  { icon: Shield, title: "ASTRA AMG Governance", desc: "Audit, Management & Governance — policy enforcement, security, and full audit trails.", color: "text-red-400", border: "border-red-500/20", hover: "hover:border-red-500/50" },
];

const aiModules = [
  { name: "Conversational AI", icon: "💬", desc: "Natural language interaction for all employees" },
  { name: "Decision-Making AI", icon: "⚖️", desc: "Multi-criteria analysis for complex decisions" },
  { name: "Critical Thinking AI", icon: "🔍", desc: "Risk analysis and assumption validation" },
  { name: "Logic & Reasoning AI", icon: "🧮", desc: "Logical consistency and constraint solving" },
  { name: "QMS AI", icon: "✅", desc: "ISO 9001 compliance and quality assurance" },
  { name: "Accounting & Financial AI", icon: "📊", desc: "Financial analysis, reporting, and insights" },
  { name: "Business Management AI", icon: "🏢", desc: "Operations, strategy, and administration" },
];

const stats = [
  { value: "7", label: "AI Modules", sub: "Specialized Intelligence" },
  { value: "125+", label: "API Procedures", sub: "Integrated Workflows" },
  { value: "80/20", label: "Hybrid AI", sub: "Manus + GPT-4" },
  { value: "<2s", label: "Response Time", sub: "Real-time Processing" },
];

const phases = [
  { phase: "Phase 1", weeks: "Weeks 1–4", title: "Foundation & Core Platform", color: "border-t-blue-500", dot: "bg-blue-500", items: ["Corporate website & branding", "Employee login & dashboard shell", "NEO AI chat interface (UI)", "Initial infrastructure setup"] },
  { phase: "Phase 2", weeks: "Weeks 5–12", title: "Business Module Integration", color: "border-t-cyan-500", dot: "bg-cyan-500", items: ["HR + Odoo ERP integration", "CRM with AI assistance", "KPI dashboards & analytics", "Procurement & Legal modules"] },
  { phase: "Phase 3", weeks: "Weeks 13–20", title: "NEO AI & ASTRA AMG", color: "border-t-emerald-500", dot: "bg-emerald-500", items: ["NEO AI Core integration", "7 specialized AI modules live", "ASTRA AMG governance layer", "Inter-corporate comms & approvals"] },
  { phase: "Phase 4", weeks: "Weeks 21–24", title: "Testing & Deployment", color: "border-t-amber-500", dot: "bg-amber-500", items: ["Comprehensive QA testing", "Full audit & logs system", "Production deployment", "Employee training & handover"] },
];

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#060B14] text-white overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: "rgba(6,11,20,0.88)", backdropFilter: "blur(20px)" }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-sm text-black">GT</div>
            <div>
              <div className="font-bold text-sm leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Golden Team</div>
              <div className="text-[10px] text-white/40 leading-tight">Trading Services</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#neo-ai" className="hover:text-white transition-colors">NEO AI</a>
            <a href="#roadmap" className="hover:text-white transition-colors">Roadmap</a>
            <button onClick={() => setLocation("/neo-architecture")} className="hover:text-white transition-colors">Architecture</button>
            <button onClick={() => setLocation("/project-plan")} className="hover:text-white transition-colors">Project Plan</button>
          </div>
          <Button onClick={() => setLocation("/login")} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0">
            Employee Portal <ArrowRight className="ml-1 w-3 h-3" />
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,11,20,0.3) 0%, rgba(6,11,20,0.65) 60%, rgba(6,11,20,1) 100%)" }} />
        </div>
        <div className="container relative z-10 py-24">
          <div className="max-w-4xl">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <Badge className="mb-6 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1">
                <Zap className="w-3 h-3 mr-1" /> Enterprise AI Platform — NEO AI Core + ASTRA AMG Governance
              </Badge>
            </motion.div>
            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <span className="text-white">Golden Team</span>
              <br />
              <span className="gradient-text-gold">Trading Services</span>
            </motion.h1>
            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-xl text-white/60 max-w-2xl mb-8 leading-relaxed">
              A unified enterprise platform combining Administrative Excellence, Business Development, IT Solutions, Odoo ERP, AI-assisted CRM, QMS, Legal, Procurement, and the NEO AI Core — all governed by ASTRA AMG.
            </motion.p>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
              <Button onClick={() => setLocation("/login")} size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-8">
                Access Employee Portal <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button onClick={() => setLocation("/neo-architecture")} size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-8">
                Explore NEO AI Architecture
              </Button>
            </motion.div>
          </div>
        </div>
        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/5" style={{ background: "rgba(6,11,20,0.92)", backdropFilter: "blur(20px)" }}>
          <div className="container py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }} className="text-center py-2">
                  <div className="text-2xl font-bold gradient-text-blue" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                  <div className="text-xs font-semibold text-white/80">{s.label}</div>
                  <div className="text-[10px] text-white/40">{s.sub}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 relative">
        <div className="absolute inset-0">
          <img src={SERVICES_BG} alt="" className="w-full h-full object-cover opacity-8" style={{ opacity: 0.08 }} />
          <div className="absolute inset-0 bg-[#060B14]/85" />
        </div>
        <div className="container relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Our Services & Modules</Badge>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              12 Integrated Enterprise Modules
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              From administrative management to AI-powered business intelligence — every module your enterprise needs, unified in one platform.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i % 6}
                className={`glass-card glass-card-hover p-6 border ${s.border} ${s.hover} transition-all duration-300 hover:shadow-lg`}>
                <s.icon className={`w-7 h-7 ${s.color} mb-4`} />
                <h3 className="text-base font-semibold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEO AI Section ── */}
      <section id="neo-ai" className="py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <Badge className="mb-4 bg-amber-500/10 text-amber-400 border border-amber-500/20">NEO AI Core</Badge>
              <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                The Intelligence Engine Behind Your Enterprise
              </h2>
              <p className="text-white/50 mb-8 leading-relaxed">
                NEO (Next-generation Enterprise Orchestrator) is a proprietary hybrid AI combining Manus AI (80%) and GPT-4 (20%), featuring 7 specialized intelligence modules that orchestrate every aspect of your business operations — from accounting to governance.
              </p>
              <div className="grid grid-cols-1 gap-2.5 mb-8">
                {aiModules.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-3 p-3 glass-card border border-white/5 rounded-lg">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{m.name}</div>
                      <div className="text-xs text-white/40">{m.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex gap-4">
                <Button onClick={() => setLocation("/neo-architecture")} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
                  View Full Architecture <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
                <Button onClick={() => setLocation("/login")} variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  Try NEO AI
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
              className="relative flex justify-center">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-full neo-pulse" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
                <img src={NEO_CORE_IMG} alt="NEO AI Core" className="w-full h-full object-contain rounded-full" />
              </div>
              <div className="absolute top-6 right-0 glass-card border border-blue-500/20 px-3 py-2 text-xs rounded-lg">
                <div className="text-blue-400 font-semibold">Manus AI</div>
                <div className="text-white/40">80% Traffic</div>
              </div>
              <div className="absolute bottom-6 left-0 glass-card border border-cyan-500/20 px-3 py-2 text-xs rounded-lg">
                <div className="text-cyan-400 font-semibold">GPT-4 Turbo</div>
                <div className="text-white/40">20% Traffic</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section id="roadmap" className="py-24" style={{ background: "rgba(13,27,62,0.25)" }}>
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Development Roadmap</Badge>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              24-Week Implementation Plan
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              A phased approach ensuring smooth, manageable delivery from foundation to full AI-powered enterprise deployment.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((p, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className={`glass-card p-6 border-t-2 ${p.color} border-l border-r border-b border-white/5`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span className="text-xs text-white/40">{p.weeks}</span>
                </div>
                <div className="text-xs font-semibold text-white/50 mb-1">{p.phase}</div>
                <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.title}</h3>
                <ul className="space-y-2">
                  {p.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-white/45">
                      <CheckCircle className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mt-10">
            <Button onClick={() => setLocation("/project-plan")} size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5">
              View Full Project Plan <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── ASTRA PM Banner ── */}
      <section className="py-16">
        <div className="container">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-card border border-amber-500/20 p-8 md:p-12 relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #F59E0B, transparent)", transform: "translate(30%, -30%)" }} />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 text-sm font-semibold">Flagship Product</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  ASTRA PM — Project Management Platform
                </h3>
                <p className="text-white/50 max-w-xl text-sm leading-relaxed">
                  Golden Team is the proud owner of ASTRA PM, an AI-powered next-generation project management platform for the AEC industry. Reducing timelines by 60% and costs by 40%.
                </p>
              </div>
              <div className="flex flex-col gap-2.5 shrink-0">
                {["95+ Production-Ready Features", "34 Database Tables", "React 19 + tRPC Architecture"].map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {f}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-sm text-black">GT</div>
              <div>
                <div className="font-bold text-sm text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Golden Team Trading Services</div>
                <div className="text-xs text-white/30">Enterprise AI Platform · Powered by NEO AI Core</div>
              </div>
            </div>
            <div className="text-xs text-white/20">© 2026 Golden Team Trading Services. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
