/**
 * ASTRA PM — Public Product Page
 * Design: "Prestige Dark" — Deep navy/charcoal, violet/purple accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, violet-400 accent, amber-400 secondary accent
 * Layout: Hero → features → modules → NEO AI integration → pricing → CTA
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  BarChart3, Calendar, Users, FileText, Brain, CheckCircle,
  ArrowRight, ChevronRight, Layers, GitBranch, Bell, Shield,
  Zap, Globe, Clock, TrendingUp, MessageSquare, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ASTRA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-astra-pm-HFtSuwmFhd8RXqX7n7bRpw.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const FEATURES = [
  { icon: BarChart3, title: "Intelligent Project Dashboard", desc: "Real-time project health, milestone tracking, and predictive completion analytics powered by NEO AI." },
  { icon: Calendar, title: "AI-Assisted Scheduling", desc: "Smart Gantt charts with automatic resource leveling, conflict detection, and schedule optimization." },
  { icon: Users, title: "Resource Management", desc: "Capacity planning, skill-based assignment, and utilization tracking across your entire project portfolio." },
  { icon: Brain, title: "NEO AI Meeting Assistant", desc: "Automated meeting transcription, action item extraction, and bilingual Arabic/English meeting summaries." },
  { icon: FileText, title: "Document Management", desc: "Centralized document repository with version control, approval workflows, and ISO 9001 compliance tracking." },
  { icon: Shield, title: "ASTRA AMG Governance", desc: "Built-in governance framework with authority matrices, approval chains, and audit trails for every decision." },
  { icon: TrendingUp, title: "KPI & Performance Analytics", desc: "Customizable KPI dashboards with drill-down analytics and automated performance reports for stakeholders." },
  { icon: Bell, title: "Smart Notifications", desc: "Context-aware alerts for deadlines, approvals, risks, and escalations delivered to the right person at the right time." },
];

const MODULES = [
  {
    title: "Project Planning & Control",
    color: "violet",
    items: ["Work breakdown structure (WBS)", "Critical path analysis", "Baseline vs. actual tracking", "Change request management", "Risk register & mitigation"]
  },
  {
    title: "Procurement & Contracts",
    color: "blue",
    items: ["Vendor RFQ & evaluation", "Contract lifecycle management", "PO approval workflows", "Supplier performance tracking", "NEO AI procurement assistant"]
  },
  {
    title: "Quality Management",
    color: "emerald",
    items: ["ISO 9001 compliance checklists", "Non-conformance reporting", "Inspection & test plans", "Corrective action tracking", "Quality audit scheduling"]
  },
  {
    title: "Financial Control",
    color: "amber",
    items: ["Budget planning & tracking", "Earned value management (EVM)", "Cost forecasting & variance", "Invoice approval workflows", "Financial AI insights"]
  },
];

const NEO_CAPABILITIES = [
  { icon: MessageSquare, title: "Conversational Project Control", desc: "Describe what you need in plain language — NEO AI creates tasks, updates schedules, and notifies team members automatically." },
  { icon: Brain, title: "Predictive Risk Intelligence", desc: "NEO analyzes project patterns to predict schedule slippage, cost overruns, and resource conflicts before they occur." },
  { icon: Video, title: "Meeting Intelligence", desc: "Every meeting is automatically transcribed, summarized, and converted into action items assigned to the right team members." },
  { icon: FileText, title: "Automated Reporting", desc: "Weekly status reports, executive dashboards, and stakeholder presentations generated automatically from live project data." },
];

const PRICING = [
  {
    name: "Starter", price: "SAR 2,500", period: "/month", color: "white",
    desc: "For small teams and single projects",
    features: ["Up to 10 users", "5 active projects", "Basic Gantt & scheduling", "Document management", "Email support"]
  },
  {
    name: "Professional", price: "SAR 6,500", period: "/month", color: "violet", popular: true,
    desc: "For growing organizations with multiple projects",
    features: ["Up to 50 users", "Unlimited projects", "NEO AI Meeting Assistant", "Full procurement module", "KPI dashboards", "Priority support"]
  },
  {
    name: "Enterprise", price: "Custom", period: "", color: "amber",
    desc: "For large enterprises requiring full customization",
    features: ["Unlimited users", "Full NEO AI Core integration", "ASTRA AMG governance", "Custom integrations", "Dedicated success manager", "SLA guarantee"]
  },
];

const colorMap: Record<string, { badge: string; border: string; btn: string }> = {
  violet: { badge: "bg-violet-500/10 text-violet-300 border-violet-500/20", border: "border-violet-500/30", btn: "bg-violet-600 hover:bg-violet-500 text-white" },
  blue: { badge: "bg-blue-500/10 text-blue-300 border-blue-500/20", border: "border-blue-500/20", btn: "bg-blue-600 hover:bg-blue-500 text-white" },
  emerald: { badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", border: "border-emerald-500/20", btn: "bg-emerald-600 hover:bg-emerald-500 text-white" },
  amber: { badge: "bg-amber-500/10 text-amber-300 border-amber-500/20", border: "border-amber-500/30", btn: "bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold" },
  white: { badge: "bg-white/5 text-white/60 border-white/10", border: "border-white/10", btn: "bg-white/10 hover:bg-white/15 text-white" },
};

export default function AstraPM() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#05080F] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ── Top Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05080F]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span className="text-[#05080F] font-bold text-base" style={{ fontFamily: "'Playfair Display', serif" }}>GT</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>GOLDEN TEAM</div>
              <div className="text-amber-400/60 text-[9px] tracking-widest uppercase">Trading Services</div>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Home", path: "/" },
              { label: "IT Solutions", path: "/it-solutions" },
              { label: "ASTRA PM", path: "/astra-pm" },
              { label: "Consultancy", path: "/consultancy" },
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className={`text-sm tracking-wide transition-colors ${path === "/astra-pm" ? "text-violet-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/login")}
            className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-xs tracking-widest uppercase px-5">
            Employee Portal
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-[65vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={ASTRA_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">Home</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-violet-400 text-sm">ASTRA PM</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300 text-xs tracking-widest uppercase mb-6">
              <Layers className="w-3 h-3" /> AI-Powered Project Management
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              ASTRA PM<br /><span className="text-violet-400">Intelligent Project</span><br />
              <span className="text-amber-400">Management Platform</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mb-10 leading-relaxed">
              The enterprise project management platform built for the GCC — combining AI-powered intelligence, ISO 9001 governance, and bilingual Arabic/English support in one unified platform.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/contact")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 text-sm tracking-wide">
                Request a Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/contact")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-sm">
                View Pricing
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-8">
              {["ISO 9001 Compliant", "Arabic/English Bilingual", "NEO AI Integrated", "GCC Data Residency"].map((tag) => (
                <div key={tag} className="flex items-center gap-2 text-white/50 text-sm">
                  <CheckCircle className="w-4 h-4 text-violet-400" /> {tag}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Built for Enterprise<br /><span className="text-violet-400">Project Excellence</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              Every feature is designed to reduce administrative overhead, improve visibility, and enable data-driven project decisions.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}
                className="group p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-violet-500/5 hover:border-violet-500/25 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors">
                  <Icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Module Breakdown ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Four Integrated Modules
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              ASTRA PM covers the full project lifecycle — from planning through procurement, quality, and financial control.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULES.map(({ title, color, items }) => {
              const c = colorMap[color];
              return (
                <motion.div key={title} variants={fadeUp}
                  className={`p-6 rounded-2xl border ${c.border} bg-white/2`}>
                  <Badge className={`${c.badge} text-xs mb-4`}>{title}</Badge>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-xs text-white/50">
                        <CheckCircle className="w-3 h-3 mt-0.5 shrink-0 text-white/30" />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── NEO AI Integration ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300 text-xs tracking-widest uppercase mb-6">
                <Brain className="w-3 h-3" /> NEO AI Integration
              </div>
              <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                Your AI Project<br /><span className="text-violet-400">Intelligence Layer</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                ASTRA PM is the first GCC project management platform with a native AI orchestration layer. NEO AI doesn't just assist — it actively manages, predicts, and executes project tasks on your behalf.
              </p>
              <div className="space-y-4">
                {NEO_CAPABILITIES.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/2">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm mb-1">{title}</div>
                      <div className="text-white/40 text-xs leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="relative">
              <div className="rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-500/10">
                <img src={ASTRA_IMG} alt="ASTRA PM Platform" className="w-full h-80 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05080F]/60 to-transparent rounded-2xl" />
              </div>
              <div className="absolute -bottom-6 -left-6 p-4 rounded-xl border border-violet-500/30 bg-[#080D1A] shadow-xl">
                <div className="text-violet-400 font-bold text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>71%</div>
                <div className="text-white/50 text-xs">Cost Savings vs. Traditional PM</div>
              </div>
              <div className="absolute -top-6 -right-6 p-4 rounded-xl border border-amber-500/30 bg-[#080D1A] shadow-xl">
                <div className="text-amber-400 font-bold text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>2s</div>
                <div className="text-white/50 text-xs">NEO AI Response Time</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-28 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Transparent Pricing
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              Choose the plan that fits your organization. All plans include a 30-day free trial with no credit card required.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-3 gap-8">
            {PRICING.map(({ name, price, period, color, popular, desc, features }) => {
              const c = colorMap[color];
              return (
                <motion.div key={name} variants={fadeUp}
                  className={`relative p-8 rounded-2xl border ${c.border} bg-white/2 ${popular ? "scale-105 shadow-2xl shadow-violet-500/15" : ""}`}>
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-600 text-white border-0 text-xs px-4">Most Popular</Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="text-white/60 text-xs tracking-widest uppercase mb-2">{name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{price}</span>
                      <span className="text-white/40 text-sm">{period}</span>
                    </div>
                    <div className="text-white/40 text-sm mt-2">{desc}</div>
                  </div>
                  <div className="space-y-3 mb-8">
                    {features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <CheckCircle className="w-4 h-4 text-violet-400 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => navigate("/contact")} className={`w-full ${c.btn}`}>
                    {name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              See ASTRA PM in Action
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10">
              Book a personalized 30-minute demo with our product team and see how ASTRA PM transforms project delivery.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-4 text-sm">
                Book a Demo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/contact")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                Download Brochure
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-sm">© 2026 Golden Team Trading Services. All rights reserved.</div>
          <div className="flex gap-6">
            {["/", "/it-solutions", "/astra-pm", "/consultancy", "/about", "/contact"].map((path, i) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-white/30 hover:text-white/60 text-sm transition-colors">
                {["Home", "IT Solutions", "ASTRA PM", "Consultancy", "About", "Contact"][i]}
              </button>
            ))}
          </div>
          <div className="text-white/30 text-sm">ISO 9001:2015 · Powered by NEO AI</div>
        </div>
      </footer>
    </div>
  );
}
