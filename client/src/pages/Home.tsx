/**
 * Golden Team Trading Services — Corporate Website (Public)
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * This is the CLIENT-FACING company website. The Employee Portal is a completely separate world.
 * Three main service pillars: IT Solutions | ASTRA PM | Business Consultancy
 */

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ChevronRight, Monitor, Cpu, Shield, Cloud, Network, Code2,
  FolderKanban, BarChart3, Users2, Calendar, CheckSquare, Layers,
  Briefcase, TrendingUp, Award, Globe, Building2, Lightbulb,
  Phone, Mail, MapPin, Star, ChevronDown, Menu, X, Zap
} from "lucide-react";
import { useState, useEffect } from "react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-corporate-LAR4ea7VBJH3jL9DF5uSJy.webp";
const IT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-it-solutions-kBJmggmFapCwtnocCUjwuj.webp";
const ASTRA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-astra-pm-HFtSuwmFhd8RXqX7n7bRpw.webp";
const CONSULT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-consulting-NxW47h5uQRtwgqAX4Dbu4R.webp";

const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

const IT_SERVICES = [
  { icon: Cloud, title: "Cloud Infrastructure", desc: "AWS, Azure, and hybrid cloud architecture design, migration, and managed operations." },
  { icon: Shield, title: "Cybersecurity", desc: "End-to-end security audits, penetration testing, SOC monitoring, and compliance frameworks." },
  { icon: Network, title: "Network Solutions", desc: "Enterprise networking, SD-WAN, VPN infrastructure, and 24/7 NOC support." },
  { icon: Code2, title: "Custom Software", desc: "Bespoke enterprise applications, API integrations, and digital transformation programs." },
  { icon: Monitor, title: "IT Managed Services", desc: "Full-spectrum IT outsourcing — helpdesk, infrastructure, and proactive monitoring." },
  { icon: Cpu, title: "AI & Automation", desc: "NEO AI-powered business automation, RPA, and intelligent process optimization." },
];

const ASTRA_FEATURES = [
  { icon: FolderKanban, title: "Project Lifecycle", desc: "Full project lifecycle management from initiation to closeout with PMBOK-aligned workflows." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Live dashboards for budget, schedule, resource, and risk performance indicators." },
  { icon: Users2, title: "Resource Management", desc: "Intelligent resource allocation, capacity planning, and team performance tracking." },
  { icon: Calendar, title: "Gantt & Scheduling", desc: "Interactive Gantt charts with critical path analysis and milestone tracking." },
  { icon: CheckSquare, title: "Quality Assurance", desc: "Built-in ISO 9001 quality gates, inspection checklists, and non-conformance management." },
  { icon: Layers, title: "ASTRA AMG Governance", desc: "Enterprise governance layer with audit trails, approval workflows, and compliance monitoring." },
];

const CONSULT_SERVICES = [
  { icon: Briefcase, title: "Business Development", desc: "Market entry strategy, growth planning, and business model innovation for regional expansion." },
  { icon: TrendingUp, title: "Administrative Excellence", desc: "Organizational design, process optimization, and operational efficiency programs." },
  { icon: Award, title: "ISO 9001 Certification", desc: "End-to-end ISO 9001:2015 implementation, gap analysis, and certification support." },
  { icon: Globe, title: "International Trade", desc: "Import/export facilitation, trade compliance, and cross-border business advisory." },
  { icon: Building2, title: "Corporate Governance", desc: "Board advisory, governance frameworks, and regulatory compliance consulting." },
  { icon: Lightbulb, title: "Strategic Planning", desc: "C-suite advisory, strategic roadmaps, and transformation program management." },
];

const STATS = [
  { value: "15+", label: "Years Experience" },
  { value: "200+", label: "Projects Delivered" },
  { value: "50+", label: "Enterprise Clients" },
  { value: "ISO 9001", label: "Certified Quality" },
];

const TESTIMONIALS = [
  { name: "Ahmed Al-Rashidi", role: "CEO, Al-Rashidi Group", text: "Golden Team transformed our entire IT infrastructure and delivered ASTRA PM which now manages all our construction projects. Exceptional quality and professionalism." },
  { name: "Sara Mohammed", role: "COO, Gulf Ventures", text: "Their business consultancy team helped us achieve ISO 9001 certification in record time. The strategic advisory was invaluable for our regional expansion." },
  { name: "Khalid Al-Mansouri", role: "Director, Mansouri Holdings", text: "The NEO AI integration through their IT solutions division has automated 70% of our administrative processes. Truly transformative technology." },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#05080F] text-white font-sans overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#05080F]/95 backdrop-blur-md border-b border-white/10 shadow-xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-[#05080F] font-bold text-lg font-display">GT</span>
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight font-display">GOLDEN TEAM</div>
              <div className="text-amber-400/70 text-[10px] tracking-widest uppercase">Trading Services</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: "IT Solutions", path: "/it-solutions" },
              { label: "ASTRA PM", path: "/astra-pm" },
              { label: "Consultancy", path: "/consultancy" },
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => setLocation(path)} className="text-white/60 hover:text-amber-400 transition-colors duration-200 tracking-wide">
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/login")}
              className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 bg-transparent text-xs tracking-widest uppercase"
            >
              Employee Portal
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0A0F1E]/98 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-4">
            {[
              { label: "IT Solutions", path: "/it-solutions" },
              { label: "ASTRA PM", path: "/astra-pm" },
              { label: "Consultancy", path: "/consultancy" },
              { label: "About", path: "/about" },
              { label: "Contact", path: "/contact" },
            ].map(({ label, path }) => (
              <button key={label} onClick={() => { setLocation(path); setMobileOpen(false); }} className="text-white/70 hover:text-amber-400 text-sm py-2 border-b border-white/5 text-left">
                {label}
              </button>
            ))}
            <Button onClick={() => setLocation("/login")} className="mt-2 bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold">
              Employee Portal
            </Button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,8,15,0.55) 0%, rgba(5,8,15,0.4) 40%, rgba(5,8,15,0.85) 80%, rgba(5,8,15,1) 100%)" }} />
          {/* Gold shimmer overlay */}
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(251,191,36,0.15) 0%, transparent 60%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-24 pb-16">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs tracking-widest uppercase mb-8">
              <Zap className="w-3 h-3" />
              AI-Powered Enterprise Solutions
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6">
              <span className="text-white">Golden Team</span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                Trading Services
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-4">
              Administrative & Business Development Services · IT Solutions · ASTRA PM Project Management
            </motion.p>

            <motion.p variants={fadeUp} className="text-white/40 text-base max-w-2xl mx-auto mb-12">
              Empowering organizations with enterprise-grade technology, intelligent AI systems, and strategic consultancy to drive sustainable growth.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-base px-8 py-6 shadow-xl shadow-amber-500/30 transition-all duration-300"
                onClick={() => setLocation("/it-solutions")}
              >
                Explore Our Services <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 bg-transparent text-base px-8 py-6"
                onClick={() => setLocation("/contact")}
              >
                Get In Touch
              </Button>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 text-xs"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-y border-amber-400/20 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-amber-400 mb-1">{value}</div>
                <div className="text-white/50 text-sm tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── IT Solutions ── */}
      <section id="it-solutions" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={IT_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/80 to-[#05080F]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center mb-20"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 text-blue-400 text-xs tracking-widest uppercase mb-6">
                <Monitor className="w-3 h-3" /> IT Solutions
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Enterprise Technology<br />
                <span className="text-blue-400">That Scales With You</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                From cloud infrastructure and cybersecurity to custom software and AI-powered automation, Golden Team delivers end-to-end IT solutions that modernize your operations and protect your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-6">
                  IT Solutions Overview <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  Request Assessment
                </Button>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white/10">
              <img src={IT_IMG} alt="IT Solutions" className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080F]/60 to-transparent" />
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {IT_SERVICES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title} variants={fadeUp}
                className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-blue-500/8 hover:border-blue-400/30 transition-all duration-300 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/25 transition-colors">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ASTRA PM ── */}
      <section id="astra-pm" className="py-28 bg-gradient-to-b from-[#05080F] via-[#080D1A] to-[#05080F] relative overflow-hidden">
        {/* Violet glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center mb-20"
          >
            <motion.div variants={fadeUp} className="order-2 lg:order-1 relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/20 border border-white/10">
              <img src={ASTRA_IMG} alt="ASTRA PM" className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080F]/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-2 bg-[#05080F]/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-violet-400/20">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-violet-300 text-xs font-medium">ASTRA PM — Live Platform</span>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-400 text-xs tracking-widest uppercase mb-6">
                <FolderKanban className="w-3 h-3" /> ASTRA PM
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Intelligent Project<br />
                <span className="text-violet-400">Management Platform</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                ASTRA PM is Golden Team's flagship project management platform — a comprehensive SaaS solution designed for enterprise project delivery. Built with PMBOK methodology, AI-powered insights, and the ASTRA AMG governance framework.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { label: "ISO 9001", sublabel: "Quality Gates" },
                  { label: "NEO AI", sublabel: "Smart Insights" },
                  { label: "ASTRA AMG", sublabel: "Governance" },
                  { label: "Real-Time", sublabel: "Analytics" },
                ].map(({ label, sublabel }) => (
                  <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-white/4 border border-white/8">
                    <div className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
                    <div>
                      <div className="text-white text-sm font-semibold">{label}</div>
                      <div className="text-white/40 text-xs">{sublabel}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-violet-600 hover:bg-violet-500 text-white border-0 px-6">
                  Explore ASTRA PM <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  Request Demo
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {ASTRA_FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title} variants={fadeUp}
                className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-violet-500/8 hover:border-violet-400/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors">
                  <Icon className="w-6 h-6 text-violet-400" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Consultancy ── */}
      <section id="consultancy" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <img src={CONSULT_IMG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/70 to-[#05080F]" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center mb-20"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs tracking-widest uppercase mb-6">
                <Briefcase className="w-3 h-3" /> Business Consultancy
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Strategic Advisory for<br />
                <span className="text-amber-400">Sustainable Growth</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                Our consultancy practice combines deep regional expertise with international best practices to help organizations navigate complexity, optimize operations, and achieve their strategic ambitions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-6">
                  Consultancy Services <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  Schedule Consultation
                </Button>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-white/10">
              <img src={CONSULT_IMG} alt="Business Consultancy" className="w-full h-72 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05080F]/60 to-transparent" />
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {CONSULT_SERVICES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title} variants={fadeUp}
                className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-amber-500/8 hover:border-amber-400/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/25 transition-colors">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── About / Why Golden Team ── */}
      <section id="about" className="py-28 bg-gradient-to-b from-[#05080F] to-[#080D1A]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/60 text-xs tracking-widest uppercase mb-6">
              Why Golden Team
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              One Partner for Your<br /><span className="text-amber-400">Entire Enterprise Journey</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              Golden Team uniquely combines IT infrastructure, AI-powered platforms, and strategic consultancy under one roof — delivering integrated solutions that create real business value.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-3 gap-8 mb-20"
          >
            {[
              { icon: "🏆", title: "Proven Excellence", desc: "15+ years delivering enterprise solutions across the GCC region with measurable outcomes and client satisfaction." },
              { icon: "🤖", title: "AI-First Approach", desc: "NEO AI Core integration across all services ensures intelligent automation and data-driven decision making." },
              { icon: "🛡️", title: "ISO 9001 Quality", desc: "Every engagement is governed by our ISO 9001:2015 certified quality management system for consistent excellence." },
            ].map(({ icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp} className="text-center p-8 rounded-2xl border border-white/8 bg-white/3">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text }) => (
              <motion.div key={name} variants={fadeUp} className="p-6 rounded-xl border border-white/8 bg-white/3">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-6 italic">"{text}"</p>
                <div>
                  <div className="text-white font-semibold text-sm">{name}</div>
                  <div className="text-white/40 text-xs">{role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-amber-400/8 to-amber-500/15 border-y border-amber-400/20" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform<br /><span className="text-amber-400">Your Enterprise?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 text-lg mb-10">
              Let's discuss how Golden Team can accelerate your business with cutting-edge IT, intelligent AI, and strategic advisory.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-6 text-base shadow-xl shadow-amber-500/30"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Start a Conversation <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-6 text-base"
                onClick={() => setLocation("/login")}
              >
                Employee Portal Login
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-28 bg-[#080D1A]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Get In Touch
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg">
              Our team is ready to help you achieve your business goals.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {[
              { icon: Phone, label: "Phone", value: "+966 XX XXX XXXX", sub: "Sun–Thu, 8am–6pm" },
              { icon: Mail, label: "Email", value: "info@goldenteam.sa", sub: "Response within 24 hours" },
              { icon: MapPin, label: "Office", value: "Riyadh, Saudi Arabia", sub: "GCC Region Coverage" },
            ].map(({ icon: Icon, label, value, sub }) => (
              <motion.div key={label} variants={fadeUp} className="text-center p-8 rounded-xl border border-white/8 bg-white/3">
                <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-white/40 text-xs tracking-widest uppercase mb-2">{label}</div>
                <div className="text-white font-semibold mb-1">{value}</div>
                <div className="text-white/40 text-sm">{sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                  <span className="text-[#05080F] font-bold text-lg font-display">GT</span>
                </div>
                <div>
                  <div className="text-white font-bold font-display">GOLDEN TEAM</div>
                  <div className="text-amber-400/60 text-[10px] tracking-widest uppercase">Trading Services</div>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Administrative & Business Development Services · IT Solutions · ASTRA PM Project Management Platform
              </p>
            </div>
            <div>
              <div className="text-white/60 text-xs tracking-widest uppercase mb-4">Services</div>
              {[
                { label: "IT Solutions", path: "/it-solutions" },
                { label: "ASTRA PM", path: "/astra-pm" },
                { label: "Business Consultancy", path: "/consultancy" },
                { label: "ISO 9001 Advisory", path: "/consultancy" },
                { label: "AI Integration", path: "/it-solutions" },
              ].map(({ label, path }) => (
                <button key={label} onClick={() => setLocation(path)} className="block text-white/40 text-sm py-1 hover:text-white/70 transition-colors text-left">{label}</button>
              ))}
            </div>
            <div>
              <div className="text-white/60 text-xs tracking-widest uppercase mb-4">Company</div>
              {[
                { label: "About Us", path: "/about" },
                { label: "Our Team", path: "/about" },
                { label: "Careers", path: "/contact" },
                { label: "Contact", path: "/contact" },
                { label: "Employee Portal", path: "/login" },
              ].map(({ label, path }) => (
                <button key={label} onClick={() => setLocation(path)} className="block text-white/40 text-sm py-1 hover:text-white/70 transition-colors text-left">{label}</button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/30 text-sm">© 2026 Golden Team Trading Services. All rights reserved.</div>
            <div className="text-white/30 text-sm">ISO 9001:2015 Certified · Powered by NEO AI</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
