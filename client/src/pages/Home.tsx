/**
 * Golden Team Trading Services — Corporate Website (Public)
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * This is the CLIENT-FACING company website. The Employee Portal is a completely separate world.
 * Three main service pillars: IT Solutions | ASTRA PM | Business Consultancy
 * Bilingual: Arabic / English — semantic trade language (not literal)
 */

import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ChevronRight, Monitor, Cpu, Shield, Cloud, Network, Code2,
  FolderKanban, BarChart3, Users2, Calendar, CheckSquare, Layers,
  Briefcase, TrendingUp, Award, Globe, Building2, Lightbulb,
  Phone, Mail, MapPin, Star, ChevronDown, Menu, X, Zap, Languages
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import ParticleNetwork from "@/components/ParticleNetwork";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/i18n";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-clean-dubai_424dffdd.jpeg";
const GT_LOGO_MAIN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt_main_logo_4ff8866b.png";
const IT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-it-solutions-kBJmggmFapCwtnocCUjwuj.webp";
const ASTRA_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-astra-pm-HFtSuwmFhd8RXqX7n7bRpw.webp";
const CONSULT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-consulting-NxW47h5uQRtwgqAX4Dbu4R.webp";

const fadeUp = { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };

const IT_ICONS = [Cloud, Shield, Network, Code2, Monitor, Cpu];
const ASTRA_ICONS = [FolderKanban, BarChart3, Users2, Calendar, CheckSquare, Layers];
const CONSULT_ICONS = [Briefcase, TrendingUp, Award, Globe, Building2, Lightbulb];

export default function Home() {
  useAuth();
  const { lang, toggleLang, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const L = t("landing", lang);
  const G = t("global", lang);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className="min-h-screen bg-[#05080F] text-white font-sans overflow-x-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#05080F]/95 backdrop-blur-md border-b border-white/10 shadow-xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <img
              src={GT_LOGO_MAIN}
              alt="Golden Team"
              className="h-12 w-auto object-contain"
            />
            <div>
              <div className="text-white font-bold text-sm leading-tight font-display">
                {isRTL ? "الفريق الذهبي" : "GOLDEN TEAM"}
              </div>
              <div className="text-amber-400/70 text-[10px] tracking-widest uppercase">
                {isRTL ? "للخدمات التجارية" : "Trading Services"}
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {[
              { label: L.nav.itSolutions, path: "/it-solutions" },
              { label: L.nav.astraPm, path: "/astra-pm" },
              { label: L.nav.consultancy, path: "/consultancy" },
              { label: L.nav.about, path: "/about" },
              { label: L.nav.contact, path: "/contact" },
            ].map(({ label, path }) => (
              <button key={path} onClick={() => setLocation(path)} className="text-white/60 hover:text-amber-400 transition-colors duration-200 tracking-wide">
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-white/50 hover:text-amber-400 hover:border-amber-400/40 transition-all text-xs"
              title={lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="font-medium">{lang === "en" ? "عربي" : "EN"}</span>
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/login")}
              className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 bg-transparent text-xs tracking-widest uppercase"
            >
              {G.employeePortal}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1 rounded border border-white/20 text-white/50 text-xs"
            >
              <Languages className="w-3 h-3" />
              {lang === "en" ? "ع" : "EN"}
            </button>
            <button className="text-white/70 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0A0F1E]/98 backdrop-blur-xl border-t border-white/10 px-6 py-6 flex flex-col gap-4">
            {[
              { label: L.nav.itSolutions, path: "/it-solutions" },
              { label: L.nav.astraPm, path: "/astra-pm" },
              { label: L.nav.consultancy, path: "/consultancy" },
              { label: L.nav.about, path: "/about" },
              { label: L.nav.contact, path: "/contact" },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => { setLocation(path); setMobileOpen(false); }}
                className={`text-white/70 hover:text-amber-400 text-sm py-2 border-b border-white/5 ${isRTL ? "text-right" : "text-left"}`}
              >
                {label}
              </button>
            ))}
            <Button onClick={() => setLocation("/login")} className="mt-2 bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold">
              {G.employeePortal}
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
          {/* Particle network overlay */}
          <ParticleNetwork
            particleCount={80}
            connectionDistance={150}
            particleColor="rgba(251, 191, 36,"
            lineColor="rgba(251, 191, 36,"
            speed={0.35}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-24 pb-16">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs tracking-widest uppercase mb-8">
              <Zap className="w-3 h-3" />
              {L.hero.badge}
            </motion.div>

            <motion.h1 variants={fadeUp} className={`font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] mb-6 ${isRTL ? "font-arabic" : ""}`}>
              <span className="text-white">{L.hero.headline1}</span>
              <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                {L.hero.headline2}
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-4">
              {L.hero.sub}
            </motion.p>

            <motion.p variants={fadeUp} className="text-white/40 text-base max-w-2xl mx-auto mb-12">
              {L.hero.body}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-base px-8 py-6 shadow-xl shadow-amber-500/30 transition-all duration-300"
                onClick={() => setLocation("/it-solutions")}
              >
                {L.hero.ctaPrimary} <ArrowRight className={`${isRTL ? "mr-2 rotate-180" : "ml-2"} w-5 h-5`} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 bg-transparent text-base px-8 py-6"
                onClick={() => setLocation("/contact")}
              >
                {L.hero.ctaSecondary}
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
            {(L.stats as Array<{value: string; label: string}>).map(({ value, label }) => (
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
                <Monitor className="w-3 h-3" /> {L.itSection.badge}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {L.itSection.headline1}<br />
                <span className="text-blue-400">{L.itSection.headline2}</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                {L.itSection.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white border-0 px-6">
                  {L.itSection.ctaPrimary} <ChevronRight className={`${isRTL ? "mr-1 rotate-180" : "ml-1"} w-4 h-4`} />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  {L.itSection.ctaSecondary}
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
            {(L.itServices as Array<{title: string; desc: string}>).map(({ title, desc }, idx: number) => {
              const Icon = IT_ICONS[idx];
              return (
                <motion.div
                  key={idx} variants={fadeUp}
                  className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-blue-500/8 hover:border-blue-400/30 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/25 transition-colors">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
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
                  <span className="text-violet-300 text-xs font-medium">{L.astraSection.liveBadge}</span>
                </div>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 text-violet-400 text-xs tracking-widest uppercase mb-6">
                <FolderKanban className="w-3 h-3" /> {L.astraSection.badge}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {L.astraSection.headline1}<br />
                <span className="text-violet-400">{L.astraSection.headline2}</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                {L.astraSection.body}
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {(L.astraSection.features as Array<{label: string; sublabel: string}>).map(({ label, sublabel }) => (
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
                  {L.astraSection.ctaPrimary} <ChevronRight className={`${isRTL ? "mr-1 rotate-180" : "ml-1"} w-4 h-4`} />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  {L.astraSection.ctaSecondary}
                </Button>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(L.astraFeatures as Array<{title: string; desc: string}>).map(({ title, desc }, idx: number) => {
              const Icon = ASTRA_ICONS[idx];
              return (
                <motion.div
                  key={idx} variants={fadeUp}
                  className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-violet-500/8 hover:border-violet-400/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors">
                    <Icon className="w-6 h-6 text-violet-400" />
                  </div>
                  <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
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
                <Briefcase className="w-3 h-3" /> {L.consultSection.badge}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {L.consultSection.headline1}<br />
                <span className="text-amber-400">{L.consultSection.headline2}</span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">
                {L.consultSection.body}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-6">
                  {L.consultSection.ctaPrimary} <ChevronRight className={`${isRTL ? "mr-1 rotate-180" : "ml-1"} w-4 h-4`} />
                </Button>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent px-6">
                  {L.consultSection.ctaSecondary}
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
            {(L.consultServices as Array<{title: string; desc: string}>).map(({ title, desc }, idx: number) => {
              const Icon = CONSULT_ICONS[idx];
              return (
                <motion.div
                  key={idx} variants={fadeUp}
                  className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-amber-500/8 hover:border-amber-400/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/25 transition-colors">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="font-display font-semibold text-white mb-2 text-lg">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── About / Why Golden Team ── */}
      <section id="about" className="py-28 bg-gradient-to-b from-[#05080F] to-[#080D1A]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 text-white/60 text-xs tracking-widest uppercase mb-6">
              {L.about.badge}
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              {L.about.headline1}<br /><span className="text-amber-400">{L.about.headline2}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              {L.about.body}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-3 gap-8 mb-20"
          >
            {(L.about.pillars as Array<{icon: string; title: string; desc: string}>).map(({ icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp} className="text-center p-8 rounded-2xl border border-white/8 bg-white/3">
                <div className="text-5xl mb-4">{icon}</div>
                <h3 className="font-display text-xl font-bold text-white mb-3">{title}</h3>
                <p className="text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Testimonials */}
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {(L.testimonials as Array<{name: string; role: string; text: string}>).map(({ name, role, text }) => (
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
              {L.cta.headline1}<br /><span className="text-amber-400">{L.cta.headline2}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 text-lg mb-10">
              {L.cta.body}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-6 text-base shadow-xl shadow-amber-500/30"
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                {L.cta.ctaPrimary} <ArrowRight className={`${isRTL ? "mr-2 rotate-180" : "ml-2"} w-5 h-5`} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-6 text-base"
                onClick={() => setLocation("/login")}
              >
                {L.cta.ctaSecondary}
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
              {L.contact.headline}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg">
              {L.contact.sub}
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-3 gap-8 mb-16"
          >
            {[
              { Icon: Phone, ...L.contact.cards[0] },
              { Icon: Mail, ...L.contact.cards[1] },
              { Icon: MapPin, ...L.contact.cards[2] },
            ].map(({ Icon, label, value, sub }) => (
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
                <img src={GT_LOGO_MAIN} alt="Golden Team" className="h-12 w-auto object-contain" />
                <div>
                  <div className="text-white font-bold font-display">
                    {isRTL ? "الفريق الذهبي" : "GOLDEN TEAM"}
                  </div>
                  <div className="text-amber-400/60 text-[10px] tracking-widest uppercase">
                    {isRTL ? "للخدمات التجارية" : "Trading Services"}
                  </div>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                {L.footer.tagline}
              </p>
            </div>
            <div>
              <div className="text-white/60 text-xs tracking-widest uppercase mb-4">{L.footer.servicesTitle}</div>
              {[
                { label: L.footer.services[0].label, path: "/it-solutions" },
                { label: L.footer.services[1].label, path: "/astra-pm" },
                { label: L.footer.services[2].label, path: "/consultancy" },
                { label: L.footer.services[3].label, path: "/consultancy" },
                { label: L.footer.services[4].label, path: "/it-solutions" },
              ].map(({ label, path }) => (
                <button key={label} onClick={() => setLocation(path)} className={`block text-white/40 text-sm py-1 hover:text-white/70 transition-colors ${isRTL ? "text-right" : "text-left"}`}>{label}</button>
              ))}
            </div>
            <div>
              <div className="text-white/60 text-xs tracking-widest uppercase mb-4">{L.footer.companyTitle}</div>
              {[
                { label: L.footer.company[0].label, path: "/about" },
                { label: L.footer.company[1].label, path: "/about" },
                { label: L.footer.company[2].label, path: "/contact" },
                { label: L.footer.company[3].label, path: "/contact" },
                { label: L.footer.company[4].label, path: "/login" },
              ].map(({ label, path }) => (
                <button key={label} onClick={() => setLocation(path)} className={`block text-white/40 text-sm py-1 hover:text-white/70 transition-colors ${isRTL ? "text-right" : "text-left"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/30 text-sm">{L.footer.copyright}</div>
            <div className="flex items-center gap-4">
              <div className="text-white/30 text-sm">{L.footer.certLine}</div>
              {/* Language toggle in footer */}
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/15 text-white/30 hover:text-amber-400 hover:border-amber-400/30 transition-all text-xs"
              >
                <Languages className="w-3 h-3" />
                {lang === "en" ? "عربي" : "English"}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
