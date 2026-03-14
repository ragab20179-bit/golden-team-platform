/**
 * ASTRA PM — Public Product Page
 * Design: "Prestige Dark" — Deep navy/charcoal, violet/purple accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, violet-400 accent, amber-400 secondary accent
 * Layout: Hero → features → VAULT DIAGRAMS GALLERY → modules → NEO AI integration → pricing → CTA
 * Diagrams sourced from Google Drive "ASTRA PM VAULT" folder
 */
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import {
  BarChart3, Calendar, Users, FileText, Brain, CheckCircle,
  ArrowRight, ChevronRight, Layers, Bell, Shield,
  Zap, TrendingUp, MessageSquare, Video, X, ZoomIn,
  ChevronLeft, GitBranch, Network, Database, Clock, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const ASTRA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-astra-pm-HFtSuwmFhd8RXqX7n7bRpw.webp";

// ── CDN URLs for all ASTRA PM diagrams from Google Drive vault ──
const DIAGRAMS = [
  {
    id: "architecture",
    title: "System Architecture",
    titleAr: "هندسة النظام",
    desc: "4-pillar platform: AI-Powered Planning, Smart Procurement, Engineering Intelligence, and Team Collaboration — all orchestrated by NEO AI with 29 database tables and 125+ API procedures.",
    descAr: "منصة من 4 ركائز: التخطيط بالذكاء الاصطناعي، المشتريات الذكية، الذكاء الهندسي، وتعاون الفريق — تنسقها NEO AI مع 29 جدول قاعدة بيانات و125+ إجراء API.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/system_architecture_hybrid_4k_c88375f2.png",
    category: "Technical",
    icon: Layers,
    color: "violet",
  },
  {
    id: "neo-ai-architecture",
    title: "NEO AI Architecture",
    titleAr: "هندسة NEO AI",
    desc: "Hybrid AI system: 7 specialized modules (Conversational, Decision-Making, Critical Thinking, Logic, Financial, Engineering, Architecture AI) routed by an Intelligent Router — 80% Manus AI + 20% GPT-4 Turbo, <2s response time.",
    descAr: "نظام ذكاء اصطناعي هجين: 7 وحدات متخصصة (محادثة، اتخاذ قرار، تفكير نقدي، منطق، مالي، هندسي، معماري) يوجهها موجّه ذكي — 80% Manus AI + 20% GPT-4 Turbo، زمن استجابة أقل من ثانيتين.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/neo_ai_architecture_hybrid_4k_0b9e7214.png",
    category: "Technical",
    icon: Brain,
    color: "violet",
  },
  {
    id: "competitive-advantage",
    title: "Competitive Advantage",
    titleAr: "الميزة التنافسية",
    desc: "ASTRA PM vs. leading competitors: superior AI integration, GCC-native compliance, Arabic-first UX, and 71% cost savings over traditional enterprise PM platforms.",
    descAr: "ASTRA PM مقابل المنافسين الرائدين: تكامل ذكاء اصطناعي متفوق، امتثال خليجي أصيل، تجربة مستخدم عربية أولاً، وتوفير 71% من التكاليف مقارنة بمنصات PM المؤسسية التقليدية.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-competitive-advantage-4k_cf4b804a.png",
    category: "Business",
    icon: TrendingUp,
    color: "amber",
  },
  {
    id: "revenue-model",
    title: "Revenue Model",
    titleAr: "نموذج الإيرادات",
    desc: "SaaS subscription tiers with enterprise add-ons: projected 5-year revenue growth, ARR milestones, and GCC market penetration roadmap.",
    descAr: "مستويات اشتراك SaaS مع إضافات مؤسسية: نمو الإيرادات المتوقع لـ 5 سنوات، معالم ARR، وخارطة طريق اختراق السوق الخليجي.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-revenue-model-4k_b694c892.png",
    category: "Business",
    icon: BarChart3,
    color: "emerald",
  },
  {
    id: "workflow",
    title: "Project Workflow",
    titleAr: "سير عمل المشروع",
    desc: "End-to-end project lifecycle: from initiation and planning through execution, monitoring, and controlled closeout with ASTRA AMG governance gates.",
    descAr: "دورة حياة المشروع الكاملة: من البدء والتخطيط عبر التنفيذ والمراقبة حتى الإغلاق المنضبط بحوكمة ASTRA AMG.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-workflow-4k_c82c77e7.png",
    category: "Process",
    icon: GitBranch,
    color: "blue",
  },
  {
    id: "tech-stack",
    title: "Technology Stack",
    titleAr: "المكدس التقني",
    desc: "Full-stack technology breakdown: React 19, TypeScript, tRPC, Drizzle ORM, PostgreSQL, AWS S3, OpenAI GPT-4, and NEO AI orchestration.",
    descAr: "تفصيل المكدس التقني الكامل: React 19، TypeScript، tRPC، Drizzle ORM، PostgreSQL، AWS S3، OpenAI GPT-4، وتنسيق NEO AI.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-tech-stack-4k_efb78a77.png",
    category: "Technical",
    icon: Database,
    color: "emerald",
  },
  {
    id: "software-integration",
    title: "Software Integrations",
    titleAr: "تكاملات البرمجيات",
    desc: "Seamless integrations with ERP systems, accounting platforms, HR tools, CRM solutions, and third-party APIs for a unified enterprise ecosystem.",
    descAr: "تكاملات سلسة مع أنظمة ERP ومنصات المحاسبة وأدوات الموارد البشرية وحلول CRM وواجهات API لنظام مؤسسي موحد.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-software-integration-4k_08329fcb.png",
    category: "Integration",
    icon: Network,
    color: "amber",
  },
  {
    id: "infra-scaling",
    title: "Infrastructure & Scaling",
    titleAr: "البنية التحتية والتوسع",
    desc: "Auto-scaling cloud infrastructure on AWS with multi-region failover, CDN edge delivery, and 99.9% SLA uptime guarantee for enterprise workloads.",
    descAr: "بنية تحتية سحابية على AWS مع تحجيم تلقائي وتجاوز فشل متعدد المناطق وتسليم CDN وضمان وقت تشغيل 99.9%.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-infra-scaling-4k_2109afac.png",
    category: "Technical",
    icon: Zap,
    color: "violet",
  },
  {
    id: "file-collab",
    title: "File & Collaboration System",
    titleAr: "نظام الملفات والتعاون",
    desc: "Drive Vault document management with contextual file linking, chunked uploads (500MB max), AI-powered parsing, and real-time collaboration.",
    descAr: "إدارة وثائق Drive Vault مع ربط ملفات سياقي ورفع مجزأ (500 ميجابايت كحد أقصى) وتحليل مدعوم بالذكاء الاصطناعي وتعاون فوري.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-file-collab-4k_288e5260.png",
    category: "Features",
    icon: FileText,
    color: "blue",
  },
  {
    id: "team-structure",
    title: "Team Structure & Roles",
    titleAr: "هيكل الفريق والأدوار",
    desc: "Role-based access control with 12 predefined roles: Project Manager, Engineer, QA Lead, Procurement Officer, Finance Controller, and more.",
    descAr: "تحكم في الوصول المستند إلى الأدوار مع 12 دورًا محددة مسبقًا: مدير مشروع، مهندس، قائد ضمان الجودة، مسؤول مشتريات، مراقب مالي، والمزيد.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-team-structure-4k_81c374d3.png",
    category: "Process",
    icon: Users,
    color: "emerald",
  },
  {
    id: "use-cases",
    title: "Use Cases & Scenarios",
    titleAr: "حالات الاستخدام والسيناريوهات",
    desc: "Real-world deployment scenarios: construction megaprojects, IT transformation programs, infrastructure development, and government contracts.",
    descAr: "سيناريوهات نشر واقعية: مشاريع البناء العملاقة، برامج التحول التقني، تطوير البنية التحتية، والعقود الحكومية.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-use-cases-4k_df6a66fe.png",
    category: "Business",
    icon: Globe,
    color: "amber",
  },
  {
    id: "implementation-timeline",
    title: "Implementation Timeline",
    titleAr: "جدول التنفيذ",
    desc: "Phased 12-week onboarding: Week 1-2 setup & configuration, Week 3-6 data migration & training, Week 7-10 go-live & stabilization, Week 11-12 optimization.",
    descAr: "إعداد مرحلي لمدة 12 أسبوعًا: الأسبوع 1-2 إعداد وتهيئة، الأسبوع 3-6 ترحيل البيانات والتدريب، الأسبوع 7-10 إطلاق وتثبيت، الأسبوع 11-12 تحسين.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-implementation-timeline-4k_8bd16adc.png",
    category: "Business",
    icon: Clock,
    color: "violet",
  },
  {
    id: "market-opportunity",
    title: "Market Opportunity",
    titleAr: "فرصة السوق",
    desc: "GCC project management software market: $2.4B TAM by 2028, 34% CAGR in AI-powered PM tools, and 78% of enterprises planning PM platform upgrades.",
    descAr: "سوق برامج إدارة المشاريع في دول الخليج: 2.4 مليار دولار TAM بحلول 2028، نمو 34% في أدوات PM المدعومة بالذكاء الاصطناعي.",
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/astra-db-market-opportunity-4k_0eeb0f16.png",
    category: "Business",
    icon: TrendingUp,
    color: "amber",
  },
];

const CATEGORIES = ["All", "Technical", "Process", "Integration", "Features", "Business"];

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

const colorMap: Record<string, { badge: string; border: string; btn: string; glow: string }> = {
  violet: { badge: "bg-violet-500/10 text-violet-300 border-violet-500/20", border: "border-violet-500/30", btn: "bg-violet-600 hover:bg-violet-500 text-white", glow: "shadow-violet-500/20" },
  blue: { badge: "bg-blue-500/10 text-blue-300 border-blue-500/20", border: "border-blue-500/20", btn: "bg-blue-600 hover:bg-blue-500 text-white", glow: "shadow-blue-500/20" },
  emerald: { badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", border: "border-emerald-500/20", btn: "bg-emerald-600 hover:bg-emerald-500 text-white", glow: "shadow-emerald-500/20" },
  amber: { badge: "bg-amber-500/10 text-amber-300 border-amber-500/20", border: "border-amber-500/30", btn: "bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold", glow: "shadow-amber-500/20" },
  white: { badge: "bg-white/5 text-white/60 border-white/10", border: "border-white/10", btn: "bg-white/10 hover:bg-white/15 text-white", glow: "shadow-white/10" },
};

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function AstraPM() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxDiagram, setLightboxDiagram] = useState<typeof DIAGRAMS[0] | null>(null);

  const filteredDiagrams = activeCategory === "All"
    ? DIAGRAMS
    : DIAGRAMS.filter(d => d.category === activeCategory);

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
              { label: t("Home", "الرئيسية"), path: "/" },
              { label: t("IT Solutions", "حلول تقنية المعلومات"), path: "/it-solutions" },
              { label: t("ASTRA PM", "ASTRA لإدارة المشاريع"), path: "/astra-pm" },
              { label: t("Consultancy", "الاستشارات"), path: "/consultancy" },
              { label: t("About", "من نحن"), path: "/about" },
              { label: t("Contact", "تواصل معنا"), path: "/contact" },
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
          {/* Violet glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.5) 0%, transparent 70%)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">
                {t("Home", "الرئيسية")}
              </button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-violet-400 text-sm">ASTRA PM</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300 text-xs tracking-widest uppercase mb-6">
              <Layers className="w-3 h-3" /> {t("AI-Powered Project Management", "إدارة مشاريع مدعومة بالذكاء الاصطناعي")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              ASTRA PM<br /><span className="text-violet-400">{t("Intelligent Project", "منصة إدارة مشاريع")}</span><br />
              <span className="text-amber-400">{t("Management Platform", "ذكية ومتكاملة")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mb-10 leading-relaxed">
              {t(
                "The enterprise project management platform built for the GCC — combining AI-powered intelligence, ISO 9001 governance, and bilingual Arabic/English support in one unified platform.",
                "منصة إدارة مشاريع مؤسسية مبنية لدول الخليج — تجمع ذكاء اصطناعيًا وحوكمة ISO 9001 ودعمًا ثنائي اللغة في منصة موحدة."
              )}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/contact")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 text-sm tracking-wide">
                {t("Request a Demo", "طلب عرض تجريبي")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => document.getElementById("vault-diagrams")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                className="border-violet-400/30 text-violet-300 hover:bg-violet-500/10 bg-transparent px-8 py-3 text-sm">
                {t("View Architecture Diagrams", "عرض مخططات المعمارية")}
              </Button>
            </motion.div>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-6 mt-8">
              {[
                t("ISO 9001 Compliant", "متوافق مع ISO 9001"),
                t("Arabic/English Bilingual", "ثنائي اللغة عربي/إنجليزي"),
                t("NEO AI Integrated", "متكامل مع NEO AI"),
                t("GCC Data Residency", "إقامة البيانات في الخليج")
              ].map((tag) => (
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
              {t("Built for Enterprise", "مبنية للمؤسسات")}<br /><span className="text-violet-400">{t("Project Excellence", "تميز إدارة المشاريع")}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              {t(
                "Every feature is designed to reduce administrative overhead, improve visibility, and enable data-driven project decisions.",
                "كل ميزة مصممة لتقليل العبء الإداري وتحسين الرؤية وتمكين القرارات المستندة إلى البيانات."
              )}
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

      {/* ── VAULT DIAGRAMS GALLERY ── */}
      <section id="vault-diagrams" className="py-28 bg-gradient-to-b from-[#080D1A] via-[#05080F] to-[#080D1A]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger} className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300 text-xs tracking-widest uppercase mb-6">
              <Database className="w-3 h-3" /> {t("ASTRA PM VAULT — Architecture Diagrams", "مخزن ASTRA PM — مخططات المعمارية")}
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Platform Architecture", "معمارية المنصة")}<br />
              <span className="text-violet-400">{t("& Technical Blueprints", "والمخططات التقنية")}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto mb-10">
              {t(
                "Explore the complete technical architecture, workflow diagrams, and system blueprints that power ASTRA PM — sourced directly from our engineering vault.",
                "استكشف المعمارية التقنية الكاملة ومخططات سير العمل والمخططات الهندسية التي تشغّل ASTRA PM — مستخرجة مباشرة من مخزننا الهندسي."
              )}
            </motion.p>

            {/* Category Filter */}
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 border ${
                    activeCategory === cat
                      ? "bg-violet-600 border-violet-500 text-white"
                      : "border-white/15 text-white/50 hover:border-violet-400/40 hover:text-violet-300 bg-transparent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          </motion.div>

          {/* Diagrams Grid */}
          <motion.div
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredDiagrams.map((diagram) => {
                const c = colorMap[diagram.color];
                const Icon = diagram.icon;
                return (
                  <motion.div
                    key={diagram.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`group relative rounded-2xl border ${c.border} bg-white/2 overflow-hidden cursor-pointer hover:shadow-xl ${c.glow} transition-all duration-300`}
                    onClick={() => setLightboxDiagram(diagram)}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden aspect-video bg-[#080D1A]">
                      <img
                        src={diagram.url}
                        alt={diagram.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-[#05080F]/0 group-hover:bg-[#05080F]/40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                          <ZoomIn className="w-4 h-4" />
                          {t("View Full Size", "عرض بالحجم الكامل")}
                        </div>
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={`${c.badge} text-[10px] border`}>{diagram.category}</Badge>
                      </div>
                    </div>

                    {/* Card content */}
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5`}
                          style={{ background: `rgba(139,92,246,0.15)` }}>
                          <Icon className="w-4 h-4 text-violet-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-sm mb-1.5">
                            {t(diagram.title, diagram.titleAr)}
                          </h3>
                          <p className="text-white/40 text-xs leading-relaxed line-clamp-2">
                            {t(diagram.desc, diagram.descAr)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Vault source note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-10 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/3 text-white/30 text-xs">
              <Database className="w-3 h-3" />
              {t(
                "Diagrams sourced from ASTRA PM VAULT — Google Drive Engineering Repository",
                "المخططات مستخرجة من مخزن ASTRA PM VAULT — مستودع جوجل درايف الهندسي"
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Lightbox Modal ── */}
      <AnimatePresence>
        {lightboxDiagram && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#05080F]/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setLightboxDiagram(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative max-w-6xl w-full max-h-[90vh] rounded-2xl overflow-hidden border border-white/10 bg-[#080D1A] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = lightboxDiagram.icon;
                    return (
                      <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-violet-400" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {t(lightboxDiagram.title, lightboxDiagram.titleAr)}
                    </div>
                    <div className="text-white/40 text-xs">{lightboxDiagram.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Navigation arrows */}
                  <button
                    onClick={() => {
                      const idx = DIAGRAMS.findIndex(d => d.id === lightboxDiagram.id);
                      setLightboxDiagram(DIAGRAMS[(idx - 1 + DIAGRAMS.length) % DIAGRAMS.length]);
                    }}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const idx = DIAGRAMS.findIndex(d => d.id === lightboxDiagram.id);
                      setLightboxDiagram(DIAGRAMS[(idx + 1) % DIAGRAMS.length]);
                    }}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLightboxDiagram(null)}
                    className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="overflow-auto max-h-[70vh] bg-[#060A14]">
                <img
                  src={lightboxDiagram.url}
                  alt={lightboxDiagram.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-white/10">
                <p className="text-white/50 text-sm leading-relaxed">
                  {t(lightboxDiagram.desc, lightboxDiagram.descAr)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Module Breakdown ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Four Integrated Modules", "أربع وحدات متكاملة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t(
                "ASTRA PM covers the full project lifecycle — from planning through procurement, quality, and financial control.",
                "يغطي ASTRA PM دورة حياة المشروع كاملة — من التخطيط حتى المشتريات والجودة والضبط المالي."
              )}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULES.map(({ title, color, items }) => {
              const c = colorMap[color];
              return (
                <motion.div key={title} variants={fadeUp}
                  className={`p-6 rounded-2xl border ${c.border} bg-white/2`}>
                  <Badge className={`${c.badge} text-xs mb-4 border`}>{title}</Badge>
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
                {t("Your AI Project", "طبقة الذكاء")}<br /><span className="text-violet-400">{t("Intelligence Layer", "الاصطناعي لمشاريعك")}</span>
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                {t(
                  "ASTRA PM is the first GCC project management platform with a native AI orchestration layer. NEO AI doesn't just assist — it actively manages, predicts, and executes project tasks on your behalf.",
                  "ASTRA PM هي أول منصة إدارة مشاريع خليجية بطبقة تنسيق ذكاء اصطناعي مدمجة. NEO AI لا يكتفي بالمساعدة — بل يدير ويتوقع وينفذ مهام المشروع نيابةً عنك."
                )}
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
              {/* Show architecture diagram in NEO AI section */}
              <div className="rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-500/10 cursor-pointer"
                onClick={() => setLightboxDiagram(DIAGRAMS[0])}>
                <img
                  src={DIAGRAMS[0].url}
                  alt="ASTRA PM Architecture"
                  className="w-full h-80 object-cover hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05080F]/60 to-transparent rounded-2xl pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                  <div className="flex items-center gap-2 bg-[#05080F]/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-violet-400/20">
                    <ZoomIn className="w-3 h-3 text-violet-400" />
                    <span className="text-violet-300 text-xs">{t("Click to view full architecture diagram", "انقر لعرض مخطط المعمارية الكامل")}</span>
                  </div>
                </div>
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
              {t("Transparent Pricing", "أسعار شفافة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t(
                "Choose the plan that fits your organization. All plans include a 30-day free trial with no credit card required.",
                "اختر الخطة المناسبة لمنظمتك. جميع الخطط تشمل تجربة مجانية لمدة 30 يومًا دون بطاقة ائتمان."
              )}
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
                      <Badge className="bg-violet-600 text-white border-0 text-xs px-4">{t("Most Popular", "الأكثر شيوعًا")}</Badge>
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
                    {name === "Enterprise" ? t("Contact Sales", "تواصل مع المبيعات") : t("Start Free Trial", "ابدأ التجربة المجانية")}
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
              {t("See ASTRA PM in Action", "شاهد ASTRA PM عملياً")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10">
              {t(
                "Book a personalized 30-minute demo with our product team and see how ASTRA PM transforms project delivery.",
                "احجز عرضًا تجريبيًا شخصيًا لمدة 30 دقيقة مع فريق المنتج واكتشف كيف يحوّل ASTRA PM تسليم المشاريع."
              )}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-4 text-sm">
                {t("Book a Demo", "احجز عرضًا تجريبيًا")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => document.getElementById("vault-diagrams")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                {t("View Architecture Diagrams", "عرض مخططات المعمارية")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-sm">{t("© 2026 Golden Team Trading Services. All rights reserved.", "© 2026 شركة الفريق الذهبي للخدمات التجارية. جميع الحقوق محفوظة.")}</div>
          <div className="flex gap-6">
            {["/", "/it-solutions", "/astra-pm", "/consultancy", "/about", "/contact"].map((path, i) => (
              <button key={path} onClick={() => navigate(path)}
                className="text-white/30 hover:text-white/60 text-sm transition-colors">
                {[t("Home","الرئيسية"), t("IT Solutions","حلول تقنية المعلومات"), t("ASTRA PM","ASTRA لإدارة المشاريع"), t("Consultancy","الاستشارات"), t("About","من نحن"), t("Contact","تواصل معنا")][i]}
              </button>
            ))}
          </div>
          <div className="text-white/30 text-sm">{t("ISO 9001:2015 · Powered by NEO AI", "ISO 9001:2015 · مدعوم بـ NEO AI")}</div>
        </div>
      </footer>
    </div>
  );
}
