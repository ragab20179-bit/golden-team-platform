/**
 * KDP — Khobar Development Project Page
 * Stunning project showcase with real CGI renders from Google Drive
 * Client: Khobar Development Authority | Project No: AE7-23790201
 * Design: Prestige Dark — Deep teal/charcoal, gold accents, immersive full-bleed gallery
 * Bilingual: Full Arabic/English support via useLanguage context
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, MapPin, Calendar, Building2, Layers, TreePine,
  Zap, Droplets, Flame, ChevronLeft, ChevronRight, X,
  ExternalLink, Award, Users, BarChart3, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

// ── CDN URLs for all 12 CGI renders ──────────────────────────────────────────
const CGI_IMAGES_EN = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_03_0c8a692c.jpg",
    caption: "Aerial Masterplan — Gulf Waterfront View",
    captionAr: "المخطط الجوي — منظر الواجهة البحرية",
    description: "Bird's-eye perspective of the full development with the Arabian Gulf coastline visible in the background, showcasing the integrated urban fabric.",
    descriptionAr: "منظور جوي للمشروع الكامل مع ظهور ساحل الخليج العربي في الخلفية، يُبرز النسيج الحضري المتكامل."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_04_a3e5f6a0.jpg",
    caption: "Central Business District — Aerial View",
    captionAr: "منطقة الأعمال المركزية — منظر جوي",
    description: "Traditional Arabian architecture blended with contemporary towers along tree-lined boulevards in the heart of the redevelopment zone.",
    descriptionAr: "العمارة العربية التقليدية ممزوجة بالأبراج المعاصرة على طول الشوارع المشجرة في قلب منطقة إعادة التطوير."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_05_b7f1294b.jpg",
    caption: "Mixed-Use Urban Corridor",
    captionAr: "الممر الحضري متعدد الاستخدامات",
    description: "Pedestrian-friendly streetscape with retail at grade, residential above, and integrated landscape elements throughout.",
    descriptionAr: "واجهة شارع صديقة للمشاة مع محلات تجارية في الطابق الأرضي وسكن فوقها وعناصر تشجير متكاملة."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_06_5c8c0577.jpg",
    caption: "Historic Furdha District — Transformation",
    captionAr: "حي الفرضة التاريخي — التحول",
    description: "Sensitive urban regeneration preserving cultural heritage elements while introducing modern mixed-use programming.",
    descriptionAr: "تجديد حضري حساس يحافظ على عناصر التراث الثقافي مع إدخال برمجة حديثة متعددة الاستخدامات."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_07_cde473d2.jpg",
    caption: "Residential Quarter — Street Level",
    captionAr: "الحي السكني — مستوى الشارع",
    description: "Human-scale residential streets with shaded walkways, mature landscaping, and activated ground-floor retail.",
    descriptionAr: "شوارع سكنية بمقياس إنساني مع ممشيات مظللة وتشجير ناضج ومحلات تجارية نشطة في الطابق الأرضي."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_08_f5129b07.jpg",
    caption: "Public Plaza & Civic Spaces",
    captionAr: "الميدان العام والفضاءات المدنية",
    description: "Generous public realm with shaded plazas, water features, and civic anchors creating vibrant community gathering spaces.",
    descriptionAr: "فضاء عام سخي مع ميادين مظللة ومعالم مائية ومراسي مدنية تخلق فضاءات مجتمعية نابضة بالحياة."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_09_3097638a.jpg",
    caption: "Commercial Boulevard",
    captionAr: "الشارع التجاري الرئيسي",
    description: "Activated commercial frontages with continuous canopy shade, outdoor dining terraces, and integrated cycling infrastructure.",
    descriptionAr: "واجهات تجارية نشطة مع ظل مستمر وتراسات طعام خارجية وبنية تحتية متكاملة للدراجات."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_10_5bd0d8b1.jpg",
    caption: "Landscape & Green Network",
    captionAr: "شبكة التشجير والمساحات الخضراء",
    description: "Interconnected green corridors with native planting, irrigation systems, and pedestrian movement routes linking all districts.",
    descriptionAr: "ممرات خضراء مترابطة مع نباتات محلية وأنظمة ري ومسارات حركة للمشاة تربط جميع الأحياء."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_11_b4b7d24c.jpg",
    caption: "Infrastructure & Utilities Network",
    captionAr: "شبكة البنية التحتية والمرافق",
    description: "Comprehensive underground infrastructure including roads, drainage, potable water, and utility distribution systems.",
    descriptionAr: "بنية تحتية شاملة تحت الأرض تشمل الطرق والصرف الصحي ومياه الشرب وأنظمة توزيع المرافق."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_12_54f66a09.jpg",
    caption: "Lighting & Exterior Environment",
    captionAr: "الإضاءة والبيئة الخارجية",
    description: "Sophisticated exterior lighting design with luminaire schedules and intelligent lighting control systems for safety and ambiance.",
    descriptionAr: "تصميم إضاءة خارجية متطور مع جداول تركيبات الإضاءة وأنظمة تحكم ذكية للسلامة والأجواء."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_13_bee282cf.jpg",
    caption: "Structural & Architectural Facades",
    captionAr: "الواجهات الإنشائية والمعمارية",
    description: "Contemporary facade systems drawing from traditional Arabian architectural motifs, concrete, steel, and bridge elements.",
    descriptionAr: "أنظمة واجهات معاصرة مستوحاة من الزخارف المعمارية العربية التقليدية والخرسانة والصلب وعناصر الجسور."
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_14_a91adc2d.jpg",
    caption: "Masterplan Overview — Full Site A",
    captionAr: "نظرة عامة على المخطط الرئيسي — الموقع أ كاملاً",
    description: "Complete Site A masterplan showing the phased development approach, site access hierarchy, and integration with the existing urban fabric.",
    descriptionAr: "المخطط الرئيسي الكامل للموقع أ يُظهر نهج التطوير المرحلي وتسلسل الوصول وتكاملها مع النسيج الحضري القائم."
  },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function KDPProject() {
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Auto-advance hero image
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImg(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const prevImg = () => setLightboxIdx(i => (i - 1 + CGI_IMAGES_EN.length) % CGI_IMAGES_EN.length);
  const nextImg = () => setLightboxIdx(i => (i + 1) % CGI_IMAGES_EN.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImg();
      if (e.key === "ArrowRight") nextImg();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen]);

  const CGI_IMAGES = CGI_IMAGES_EN.map(img => ({
    ...img,
    caption: isRTL ? img.captionAr : img.caption,
    description: isRTL ? img.descriptionAr : img.description,
  }));

  const DISCIPLINES = [
    { icon: Building2, labelEn: "Infrastructure", labelAr: "البنية التحتية", count: "137", countLabel: t("files", "ملف"), desc: t("Roads, drainage, utilities, site access, phasing plan", "الطرق والصرف الصحي والمرافق والوصول للموقع وخطة التنفيذ المرحلي"), color: "#C8A830" },
    { icon: Zap, labelEn: "Lighting", labelAr: "الإضاءة", count: "162", countLabel: t("files", "ملف"), desc: t("Exterior lighting, luminaire schedules, control systems", "الإضاءة الخارجية وجداول التركيبات وأنظمة التحكم"), color: "#FADC96" },
    { icon: Layers, labelEn: "Structure", labelAr: "الهياكل الإنشائية", count: "74", countLabel: t("files", "ملف"), desc: t("Structural drawings, concrete, steel, bridge elements", "الرسومات الإنشائية والخرسانة والصلب وعناصر الجسور"), color: "#5A6446" },
    { icon: Droplets, labelEn: "Mechanical", labelAr: "الميكانيكا", count: "64", countLabel: t("files", "ملف"), desc: t("HVAC, plumbing, fire suppression, potable water", "التكييف والسباكة وإطفاء الحريق ومياه الشرب"), color: "#1A6070" },
    { icon: TreePine, labelEn: "Landscape", labelAr: "التشجير", count: "52", countLabel: t("files", "ملف"), desc: t("Planting, irrigation, pedestrian movement, cycling", "الزراعة والري وحركة المشاة والدراجات"), color: "#5A6446" },
    { icon: Flame, labelEn: "Electrical", labelAr: "الكهرباء", count: "35", countLabel: t("files", "ملف"), desc: t("Power distribution, earthing, general arrangements", "توزيع الطاقة والتأريض والترتيبات العامة"), color: "#C8A830" },
  ];

  const STATS = [
    { value: "588", label: t("Project Documents", "وثيقة مشروع"), sub: t("7.18 GB total data", "٧.١٨ جيجابايت إجمالي") },
    { value: t("Site A", "الموقع أ"), label: t("Al Khobar City Center", "وسط مدينة الخبر"), sub: t("Historic Furdha District", "حي الفرضة التاريخي") },
    { value: "2024", label: t("Issued for Bidding", "صدر للمناقصة"), sub: t("14 March 2024", "١٤ مارس ٢٠٢٤") },
    { value: "KDA", label: t("Client Authority", "جهة العميل"), sub: t("Khobar Development Authority", "هيئة تطوير الخبر") },
  ];

  const PROJECT_DETAILS = [
    { labelEn: "Project", labelAr: "المشروع", value: t("Redevelopment of City Center & Al Khobar Historic Furdha", "إعادة تطوير وسط المدينة والفرضة التاريخية بالخبر") },
    { labelEn: "Site", labelAr: "الموقع", value: t("Site A — Al Khobar City Center", "الموقع أ — وسط مدينة الخبر") },
    { labelEn: "Client", labelAr: "العميل", value: t("Khobar Development Authority (KDA)", "هيئة تطوير الخبر (KDA)") },
    { labelEn: "Project No.", labelAr: "رقم المشروع", value: "AE7 PROJECT NO. 23790201" },
    { labelEn: "Issued For", labelAr: "صدر لـ", value: t("Bidding — Rev 0", "المناقصة — المراجعة ٠") },
    { labelEn: "Date of Issue", labelAr: "تاريخ الإصدار", value: t("14 March 2024", "١٤ مارس ٢٠٢٤") },
    { labelEn: "Total Documents", labelAr: "إجمالي الوثائق", value: t("588 files · 7.18 GB", "٥٨٨ ملف · ٧.١٨ جيجابايت") },
    { labelEn: "Golden Team Role", labelAr: "دور الفريق الذهبي", value: t("Construction Contractor — Infrastructure, Landscape & Buildings", "مقاول الإنشاء — البنية التحتية والتشجير والمباني") },
  ];

  return (
    <div className={`min-h-screen bg-[#050E10] text-white font-sans overflow-x-hidden ${isRTL ? "rtl" : "ltr"}`}>

      {/* ── Sticky Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050E10]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-white/60 hover:text-[#FADC96] transition-colors text-sm"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t("Back to Golden Team", "العودة للفريق الذهبي")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#C8A830] to-[#FADC96] flex items-center justify-center">
              <span className="text-[#050E10] font-bold text-xs">GT</span>
            </div>
            <span className="text-white/70 text-sm hidden sm:block">
              {t("Golden Team For Investment Co.", "شركة الفريق الذهبي للاستثمار")}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C8A830]/15 border border-[#C8A830]/30">
            <div className="w-2 h-2 rounded-full bg-[#C8A830] animate-pulse" />
            <span className="text-[#FADC96] text-xs font-medium tracking-wide">
              {t("Ongoing Project", "مشروع جارٍ")}
            </span>
          </div>
        </div>
      </nav>

      {/* ── Hero — Full Bleed CGI Slideshow ── */}
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-1500"
            style={{ opacity: activeImg === i ? 1 : 0 }}
          >
            <img
              src={CGI_IMAGES[i].url}
              alt={CGI_IMAGES[i].caption}
              className="w-full h-full object-cover"
              style={{ transform: `translateY(${scrollY * 0.3}px)` }}
            />
          </div>
        ))}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,14,16,0.3) 0%, rgba(5,14,16,0.1) 30%, rgba(5,14,16,0.6) 70%, rgba(5,14,16,1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: isRTL ? "linear-gradient(to left, rgba(5,14,16,0.7) 0%, transparent 60%)" : "linear-gradient(to right, rgba(5,14,16,0.7) 0%, transparent 60%)" }} />

        <div className={`relative z-10 h-full flex flex-col justify-end pb-20 px-6 max-w-7xl mx-auto ${isRTL ? "items-end text-right" : ""}`}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C8A830]/20 border border-[#C8A830]/40 text-[#FADC96] text-xs tracking-widest uppercase">
                <MapPin className="w-3 h-3" />
                {t("Al Khobar, Eastern Province, KSA", "الخبر، المنطقة الشرقية، المملكة العربية السعودية")}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs tracking-widest uppercase">
                <Calendar className="w-3 h-3" />
                {t("Project No. AE7-23790201", "رقم المشروع: AE7-23790201")}
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.0] mb-4 max-w-4xl">
              {isRTL ? (
                <>
                  <span className="text-white">مشروع</span>
                  <br />
                  <span style={{ background: "linear-gradient(135deg, #C8A830, #FADC96, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    تطوير
                  </span>
                  <br />
                  <span className="text-white">الخبر</span>
                </>
              ) : (
                <>
                  <span className="text-white">Khobar</span>
                  <br />
                  <span style={{ background: "linear-gradient(135deg, #C8A830, #FADC96, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Development
                  </span>
                  <br />
                  <span className="text-white">Project</span>
                </>
              )}
            </motion.h1>

            <motion.p variants={fadeUp} className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed mb-8">
              {t(
                "Redevelopment of City Center & Al Khobar Historic Furdha — a landmark urban regeneration initiative transforming the heart of Al Khobar into a modern, mixed-use environment while preserving cultural heritage.",
                "إعادة تطوير وسط المدينة والفرضة التاريخية بالخبر — مبادرة تجديد حضري بارزة تحوّل قلب مدينة الخبر إلى بيئة حديثة متعددة الاستخدامات مع الحفاظ على التراث الثقافي."
              )}
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Globe className="w-4 h-4 text-[#C8A830]" />
                <span>{t("Client:", "العميل:")}</span>
                <span className="text-white font-medium">
                  {t("Khobar Development Authority (KDA)", "هيئة تطوير الخبر (KDA)")}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 right-8 z-10 flex gap-2">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`h-1 rounded-full transition-all duration-300 ${activeImg === i ? "w-8 bg-[#C8A830]" : "w-2 bg-white/30"}`}
            />
          ))}
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-gradient-to-r from-[#0A323C]/80 via-[#0A323C]/60 to-[#0A323C]/80 border-y border-[#C8A830]/20 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label, sub }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-[#C8A830] mb-1">{value}</div>
                <div className="text-white font-medium text-sm mb-0.5">{label}</div>
                <div className="text-white/40 text-xs">{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Project Overview ── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
          className="grid lg:grid-cols-2 gap-16 items-start"
        >
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-6">
              <Award className="w-3 h-3" />
              {t("Project Overview", "نظرة عامة على المشروع")}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {isRTL ? (
                <>تجديد حضري<br /><span className="text-[#C8A830]">على مستوى المدينة</span></>
              ) : (
                <>Urban Regeneration<br /><span className="text-[#C8A830]">at City Scale</span></>
              )}
            </h2>
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              {isRTL ? (
                <><strong className="text-white">إعادة تطوير وسط المدينة والفرضة التاريخية بالخبر</strong> مبادرة تجديد حضري كبرى كلّفت بها هيئة تطوير الخبر. يشمل المشروع إعادة التطوير الشاملة لوسط مدينة الخبر (الموقع أ)، بهدف تحويل حي الفرضة التاريخي إلى بيئة حضرية حديثة متعددة الاستخدامات مع الحفاظ على عناصر التراث الثقافي.</>
              ) : (
                <>The <strong className="text-white">Redevelopment of City Center and Al Khobar Historic Furdha</strong> is a major urban regeneration initiative commissioned by the Khobar Development Authority. The project encompasses the comprehensive redevelopment of Al Khobar City Center (Site A), targeting the transformation of the historic Furdha district into a modern, mixed-use urban environment while preserving cultural heritage elements.</>
              )}
            </p>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
              {isRTL ? (
                <>صدر للمناقصة في <strong className="text-white">١٤ مارس ٢٠٢٤</strong> تحت مشروع AE7 رقم 23790201، ويخضع المشروع لإشراف أمانة الخبر وجميع الجهات ذات الاختصاص في المملكة العربية السعودية، بما فيها مجلس التخطيط العمراني والدفاع المدني السعودي وسابك والمياه الوطنية وشركة الكهرباء السعودية.</>
              ) : (
                <>Issued for bidding on <strong className="text-white">14 March 2024</strong> under AE7 Project No. 23790201, the project is governed by Al Khobar Municipality and all Authorities Having Jurisdiction in the Kingdom of Saudi Arabia, including the Urban Planning Council, Saudi Civil Defense, SASO, NWC, and SEC.</>
              )}
            </p>

            <div className="p-5 rounded-xl border border-[#C8A830]/20 bg-[#C8A830]/5">
              <div className="text-[#FADC96] text-sm font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                {t("Applicable Standards & Codes", "المعايير والأكواد المعتمدة")}
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                {t(
                  "Saudi Building Code (SBC) · SASO · Mostadam Rating System · NFPA 101 · IBC · ASTM · ASCE 7-05 · ACI · AISC · ASME · ASHRAE · CIBSE · IEC",
                  "كود البناء السعودي (SBC) · سابك · نظام التقييم مستدام · NFPA 101 · IBC · ASTM · ASCE 7-05 · ACI · AISC · ASME · ASHRAE · CIBSE · IEC"
                )}
              </p>
              <p className="text-white/40 text-xs mt-2">
                {isRTL ? (
                  <>المواصفات منظمة باستخدام <strong className="text-white/60">CSI/CSC MasterFormat ذو ٤٨ قسمًا</strong> (إصدار ٢٠٠٤ مع تعديلات ٢٠١٦)</>
                ) : (
                  <>Specifications organized using the <strong className="text-white/60">48-Division CSI/CSC MasterFormat</strong> (2004 edition with 2016 amendments)</>
                )}
              </p>
            </div>
          </motion.div>

          {/* Project Details Card */}
          <motion.div variants={fadeUp} className="space-y-4">
            {PROJECT_DETAILS.map(({ labelEn, labelAr, value }) => (
              <div key={labelEn} className="flex gap-4 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 transition-colors">
                <div className="text-[#C8A830] text-sm font-semibold w-36 shrink-0">
                  {isRTL ? labelAr : labelEn}
                </div>
                <div className="text-white/70 text-sm">{value}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Scope of Work ── */}
      <section className="py-20 bg-gradient-to-b from-transparent to-[#0A323C]/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#5A6446]/40 bg-[#5A6446]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
                <Layers className="w-3 h-3" />
                {t("Scope of Work", "نطاق العمل")}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                {isRTL ? (
                  <>حزمة إنشاء<br /><span className="text-[#C8A830]">متعددة التخصصات</span></>
                ) : (
                  <>Multi-Discipline<br /><span className="text-[#C8A830]">Construction Package</span></>
                )}
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                {t(
                  "588 project documents spanning 8 engineering disciplines, totalling 7.18 GB of technical data.",
                  "٥٨٨ وثيقة مشروع تمتد عبر ٨ تخصصات هندسية، بإجمالي ٧.١٨ جيجابايت من البيانات التقنية."
                )}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DISCIPLINES.map(({ icon: Icon, labelEn, labelAr, count, countLabel, desc, color }) => (
                <motion.div
                  key={labelEn}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">{isRTL ? labelAr : labelEn}</div>
                      <div className="text-white/40 text-xs">{count} {countLabel}</div>
                    </div>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CGI Gallery — Full Immersive ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
                <Users className="w-3 h-3" />
                {t("Architectural Visualizations", "التصورات المعمارية")}
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                {isRTL ? (
                  <>تصورات CGI<br /><span className="text-[#C8A830]">رؤية المشروع</span></>
                ) : (
                  <>CGI Renders<br /><span className="text-[#C8A830]">Project Vision</span></>
                )}
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                {t(
                  "Official CGI renders from the Final CGIs Report (March 2024) — click any image to view full resolution.",
                  "تصورات CGI الرسمية من تقرير التصورات النهائية (مارس ٢٠٢٤) — انقر على أي صورة لعرضها بالدقة الكاملة."
                )}
              </p>
            </motion.div>

            {/* Featured image */}
            <motion.div variants={fadeUp} className="mb-6">
              <div
                className="relative w-full rounded-2xl overflow-hidden cursor-pointer group"
                style={{ aspectRatio: "16/7" }}
                onClick={() => openLightbox(0)}
              >
                <img
                  src={CGI_IMAGES[0].url}
                  alt={CGI_IMAGES[0].caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050E10]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div>
                    <div className="text-[#FADC96] text-xs tracking-widest uppercase mb-1">
                      {t("Featured View", "المنظر المميز")}
                    </div>
                    <div className="text-white font-semibold text-xl">{CGI_IMAGES[0].caption}</div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white/70 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    {t("View Full", "عرض كامل")}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {CGI_IMAGES.slice(1, 7).map((img, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: "16/10" }}
                  onClick={() => openLightbox(i + 1)}
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050E10]/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-3 left-3 right-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="text-white text-xs font-medium truncate">{img.caption}</div>
                  </div>
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom row — 2 wide images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CGI_IMAGES.slice(7, 9).map((img, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: "16/8" }}
                  onClick={() => openLightbox(i + 7)}
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050E10]/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="text-white/60 text-xs mb-0.5 tracking-wide">
                      {t("CGI Render", "تصور CGI")}
                    </div>
                    <div className="text-white font-medium">{img.caption}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Last row — 3 images */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {CGI_IMAGES.slice(9, 12).map((img, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="relative rounded-xl overflow-hidden cursor-pointer group"
                  style={{ aspectRatio: "4/3" }}
                  onClick={() => openLightbox(i + 9)}
                >
                  <img
                    src={img.url}
                    alt={img.caption}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050E10]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-white text-xs font-medium">{img.caption}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={CGI_IMAGES[3].url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050E10] via-[#050E10]/80 to-[#050E10]" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-6">
              <Building2 className="w-3 h-3" />
              {t("Golden Team For Investment Co.", "شركة الفريق الذهبي للاستثمار")}
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              {isRTL ? (
                <>تقديم التميز<br /><span className="text-[#C8A830]">في كل تخصص</span></>
              ) : (
                <>Delivering Excellence<br /><span className="text-[#C8A830]">Across Every Discipline</span></>
              )}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/60 text-lg leading-relaxed mb-10">
              {t(
                "From infrastructure and landscape to structural and MEP works, Golden Team For Investment Co. brings comprehensive construction expertise to every phase of the Khobar Development Project.",
                "من البنية التحتية والتشجير إلى الأعمال الإنشائية وأنظمة MEP، تجلب شركة الفريق الذهبي للاستثمار خبرة إنشائية شاملة لكل مرحلة من مراحل مشروع تطوير الخبر."
              )}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#C8A830] hover:bg-[#FADC96] text-[#050E10] font-bold text-base px-8 py-6 shadow-xl"
                onClick={() => setLocation("/contact")}
              >
                {t("Contact Our Team", "تواصل مع فريقنا")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent text-base px-8 py-6"
                onClick={() => setLocation("/construction")}
              >
                {t("View All Projects", "عرض جميع المشاريع")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={closeLightbox}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
              {lightboxIdx + 1} / {CGI_IMAGES.length}
            </div>

            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={e => { e.stopPropagation(); prevImg(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <motion.div
              key={lightboxIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-6xl w-full mx-16 flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={CGI_IMAGES[lightboxIdx].url}
                alt={CGI_IMAGES[lightboxIdx].caption}
                className="w-full rounded-xl object-contain max-h-[75vh]"
              />
              <div className="mt-4 text-center">
                <div className="text-[#FADC96] font-semibold text-lg mb-1">{CGI_IMAGES[lightboxIdx].caption}</div>
                <div className="text-white/50 text-sm max-w-2xl">{CGI_IMAGES[lightboxIdx].description}</div>
              </div>
            </motion.div>

            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
              onClick={e => { e.stopPropagation(); nextImg(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-2xl px-4">
              {CGI_IMAGES.map((img, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                  className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all ${lightboxIdx === i ? "border-[#C8A830]" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
