/**
 * IT Solutions — Public Service Page
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent, blue-400 tech accent
 * Layout: Full-width hero → service grid → tech stack → process → CTA
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Server, Shield, Cloud, Code, Network, Database, Cpu, Lock,
  CheckCircle, ArrowRight, Phone, Mail, ChevronRight, Monitor,
  Wifi, HardDrive, Settings, Zap, Globe, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const IT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-it-solutions-kBJmggmFapCwtnocCUjwuj.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const SERVICES = [
  {
    icon: Server, color: "blue", title: "IT Infrastructure & Data Centers",
    desc: "Design, deployment, and management of enterprise-grade server infrastructure, storage systems, and data center solutions tailored for GCC regulatory requirements.",
    features: ["On-premise & hybrid server setup", "Storage area networks (SAN/NAS)", "Virtualization (VMware, Hyper-V)", "Data center design & cabling"]
  },
  {
    icon: Cloud, color: "cyan", title: "Cloud Solutions & Migration",
    desc: "End-to-end cloud strategy, migration, and managed services across AWS, Azure, and Google Cloud — with full compliance and cost optimization.",
    features: ["Cloud readiness assessment", "Lift-and-shift & re-architecture", "Multi-cloud management", "FinOps & cost governance"]
  },
  {
    icon: Shield, color: "red", title: "Cybersecurity & Compliance",
    desc: "Comprehensive security posture management, threat detection, and compliance frameworks aligned with NCA, SAMA, and ISO 27001 standards.",
    features: ["Vulnerability assessment & pen testing", "SOC monitoring & SIEM", "NCA ECC compliance", "Security awareness training"]
  },
  {
    icon: Network, color: "green", title: "Network Design & Management",
    desc: "Enterprise networking solutions from campus LAN/WAN to SD-WAN and zero-trust network architectures for distributed organizations.",
    features: ["Cisco, Fortinet, Aruba solutions", "SD-WAN & MPLS", "Wi-Fi 6 enterprise deployment", "Network monitoring & NOC"]
  },
  {
    icon: Code, color: "purple", title: "Software Development & Integration",
    desc: "Custom enterprise application development, API integrations, and digital transformation projects using modern technology stacks.",
    features: ["Custom ERP/CRM development", "API & middleware integration", "Mobile & web applications", "Legacy system modernization"]
  },
  {
    icon: Cpu, color: "amber", title: "AI & Automation Solutions",
    desc: "NEO AI Core integration, RPA deployment, and intelligent automation that transforms business processes and decision-making.",
    features: ["NEO AI Core implementation", "Robotic process automation (RPA)", "AI-powered analytics", "Chatbot & virtual assistant development"]
  },
  {
    icon: Database, color: "orange", title: "Database Administration & BI",
    desc: "Enterprise database management, data warehousing, and business intelligence solutions that turn raw data into actionable insights.",
    features: ["PostgreSQL, Oracle, MSSQL", "Data warehouse design", "Power BI & Metabase dashboards", "ETL pipeline development"]
  },
  {
    icon: Monitor, color: "teal", title: "IT Support & Managed Services",
    desc: "24/7 managed IT services, helpdesk support, and proactive monitoring ensuring maximum uptime and business continuity.",
    features: ["L1/L2/L3 helpdesk support", "Proactive monitoring & alerting", "SLA-driven service delivery", "Asset lifecycle management"]
  },
];

const TECH_STACK = [
  { category: "Cloud", items: ["AWS", "Azure", "GCP", "Alibaba Cloud"] },
  { category: "Security", items: ["Fortinet", "Palo Alto", "CrowdStrike", "Splunk"] },
  { category: "Infrastructure", items: ["Cisco", "HPE", "Dell EMC", "VMware"] },
  { category: "Development", items: ["React", "Node.js", "Python", "PostgreSQL"] },
  { category: "AI & Automation", items: ["NEO AI Core", "UiPath", "Power Automate", "OpenAI"] },
  { category: "Monitoring", items: ["Zabbix", "Grafana", "Prometheus", "PagerDuty"] },
];

const PROCESS = [
  { step: "01", title: "Discovery & Assessment", desc: "We conduct a thorough analysis of your current IT landscape, business objectives, and pain points to define the optimal solution." },
  { step: "02", title: "Solution Architecture", desc: "Our architects design a tailored solution blueprint with clear technical specifications, timelines, and investment requirements." },
  { step: "03", title: "Implementation", desc: "Certified engineers execute the deployment with minimal business disruption, following ITIL best practices and change management protocols." },
  { step: "04", title: "Testing & Handover", desc: "Rigorous UAT, security testing, and staff training ensure a smooth transition before formal sign-off and knowledge transfer." },
  { step: "05", title: "Managed Support", desc: "Ongoing monitoring, maintenance, and optimization through our 24/7 NOC/SOC ensures your IT investment delivers continuous value." },
];

const STATS = [
  { value: "200+", label: "Projects Delivered" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "15+", label: "Years Experience" },
  { value: "50+", label: "Certified Engineers" },
];

const colorMap: Record<string, string> = {
  blue: "from-blue-500 to-blue-600 border-blue-500/20 text-blue-400 bg-blue-500/10",
  cyan: "from-cyan-500 to-cyan-600 border-cyan-500/20 text-cyan-400 bg-cyan-500/10",
  red: "from-red-500 to-red-600 border-red-500/20 text-red-400 bg-red-500/10",
  green: "from-emerald-500 to-emerald-600 border-emerald-500/20 text-emerald-400 bg-emerald-500/10",
  purple: "from-purple-500 to-purple-600 border-purple-500/20 text-purple-400 bg-purple-500/10",
  amber: "from-amber-500 to-amber-600 border-amber-500/20 text-amber-400 bg-amber-500/10",
  orange: "from-orange-500 to-orange-600 border-orange-500/20 text-orange-400 bg-orange-500/10",
  teal: "from-teal-500 to-teal-600 border-teal-500/20 text-teal-400 bg-teal-500/10",
};

export default function ITSolutions() {
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
                className={`text-sm tracking-wide transition-colors ${path === "/it-solutions" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
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
      <section className="relative pt-16 min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={IT_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">Home</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">IT Solutions</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs tracking-widest uppercase mb-6">
              <Cpu className="w-3 h-3" /> Enterprise IT Services
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Technology That<br /><span className="text-amber-400">Drives Your Business</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mb-10 leading-relaxed">
              From infrastructure to AI integration, Golden Team delivers end-to-end IT solutions that modernize operations, strengthen security, and accelerate growth across the GCC.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-8 py-3 text-sm tracking-wide">
                Request a Consultation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/about")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-sm">
                Our Certifications
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="border-y border-white/8 bg-white/2 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <motion.div key={label} variants={fadeUp}>
                <div className="text-3xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-white/50 text-sm">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/60 text-xs tracking-widest uppercase mb-6">
              Our Services
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Complete IT Service Portfolio
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              Eight specialized service lines covering every dimension of enterprise IT — from physical infrastructure to intelligent AI systems.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {SERVICES.map(({ icon: Icon, color, title, desc, features }) => {
              const c = colorMap[color].split(" ");
              return (
                <motion.div key={title} variants={fadeUp}
                  className={`group p-7 rounded-2xl border bg-white/2 hover:bg-white/4 transition-all duration-300 border-white/8 hover:border-white/15`}>
                  <div className="flex items-start gap-5 mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-white/40">
                        <CheckCircle className={`w-3 h-3 shrink-0 ${c[3]}`} />
                        {f}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Technology Stack ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Technology Partnerships
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              We work with the world's leading technology vendors to deliver best-in-class solutions.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH_STACK.map(({ category, items }) => (
              <motion.div key={category} variants={fadeUp}
                className="p-5 rounded-xl border border-white/8 bg-white/2 text-center">
                <div className="text-amber-400 text-xs font-semibold tracking-widest uppercase mb-3">{category}</div>
                {items.map((item) => (
                  <div key={item} className="text-white/50 text-sm py-1 hover:text-white/80 transition-colors">{item}</div>
                ))}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Engagement Process ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Our Engagement Process
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              A structured, transparent methodology that ensures every project is delivered on time, on budget, and to specification.
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-5 gap-6">
            {PROCESS.map(({ step, title, desc }, i) => (
              <motion.div key={step} variants={fadeUp} className="relative text-center">
                {i < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-[#05080F] font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{step}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-16 bg-gradient-to-r from-amber-500/8 via-amber-400/4 to-amber-500/8 border-y border-amber-400/15">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="flex flex-wrap items-center justify-center gap-8">
            <motion.div variants={fadeUp} className="text-white/50 text-sm tracking-widest uppercase">Certifications & Compliance</motion.div>
            {["ISO 9001:2015", "ISO 27001", "NCA ECC", "SAMA CSF", "Cisco Partner", "Microsoft Partner", "AWS Partner"].map((cert) => (
              <motion.div key={cert} variants={fadeUp}
                className="px-4 py-2 rounded-full border border-amber-400/25 bg-amber-500/8 text-amber-300 text-xs font-semibold tracking-wide">
                {cert}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ready to Transform<br /><span className="text-amber-400">Your IT Infrastructure?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10 max-w-2xl mx-auto">
              Schedule a free discovery session with our senior architects and receive a tailored IT roadmap within 5 business days.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-4 text-sm tracking-wide">
                Schedule Free Discovery <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/contact")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                <Phone className="w-4 h-4 mr-2" /> Call Us Now
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
