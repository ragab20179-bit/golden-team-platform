/**
 * Construction Division — Golden Team For Investment Co.
 * Public-facing page showcasing construction services and ongoing/completed projects
 * Design: Prestige Dark — Deep teal/charcoal, gold accents
 * Bilingual: Full Arabic/English support via useLanguage context
 */

import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ArrowLeft, ArrowRight, Building2, TreePine, Layers,
  MapPin, Calendar, ChevronRight, HardHat, Ruler, Award
} from "lucide-react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_03_0c8a692c.jpg";
const KDP_THUMB = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_04_a3e5f6a0.jpg";
const KDP_THUMB2 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_06_5c8c0577.jpg";
const KDP_THUMB3 = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/CGI_Page_07_cde473d2.jpg";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function Construction() {
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();

  const SERVICES = [
    {
      icon: Building2,
      title: t("Buildings & Architecture", "المباني والعمارة"),
      desc: t(
        "Commercial, residential, and mixed-use building construction with full MEP integration, structural works, and finishing.",
        "إنشاء المباني التجارية والسكنية ومتعددة الاستخدامات مع التكامل الكامل لأنظمة MEP والأعمال الإنشائية والتشطيبات."
      ),
      color: "#C8A830"
    },
    {
      icon: TreePine,
      title: t("Landscape & Urban Design", "التصميم البيئي والحضري"),
      desc: t(
        "Planting, irrigation systems, pedestrian movement networks, cycling routes, and public realm design.",
        "أعمال الزراعة وأنظمة الري وشبكات حركة المشاة ومسارات الدراجات وتصميم الفضاء العام."
      ),
      color: "#5A6446"
    },
    {
      icon: Layers,
      title: t("Infrastructure & Civil Works", "البنية التحتية والأعمال المدنية"),
      desc: t(
        "Roads, drainage, utilities, site access hierarchy, phasing plans, and comprehensive underground infrastructure.",
        "الطرق والصرف الصحي والمرافق وتسلسل الوصول إلى الموقع وخطط التنفيذ المرحلي والبنية التحتية الشاملة تحت الأرض."
      ),
      color: "#1A6070"
    },
  ];

  const STATS = [
    { value: "15+", label: t("Years Experience", "سنة خبرة") },
    { value: "200+", label: t("Projects Delivered", "مشروع منجز") },
    { value: "50+", label: t("Enterprise Clients", "عميل مؤسسي") },
    { value: "ISO 9001", label: t("Certified Quality", "جودة معتمدة") },
  ];

  const UPCOMING_PROJECTS = [
    {
      title: t("Al Khobar Corniche Landscape", "مشروع كورنيش الخبر - التشجير"),
      status: t("Upcoming", "قادم"),
      tags: [t("Landscape", "تشجير"), t("Infrastructure", "بنية تحتية")]
    },
    {
      title: t("Eastern Province Mixed-Use Development", "مشروع متعدد الاستخدامات - المنطقة الشرقية"),
      status: t("Upcoming", "قادم"),
      tags: [t("Buildings", "مباني"), t("MEP", "ميكانيكا وكهرباء")]
    },
  ];

  const CERTS = ["ISO 9001:2015", "OHSAS 18001", "ISO 14001", t("MOMRA Registered", "مسجل لدى وزارة الشؤون البلدية"), "CIOB Member"];

  return (
    <div className={`min-h-screen bg-[#050E10] text-white font-sans overflow-x-hidden ${isRTL ? "rtl" : "ltr"}`}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050E10]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-white/60 hover:text-[#FADC96] transition-colors text-sm"
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {t("Back to Home", "العودة للرئيسية")}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#C8A830] to-[#FADC96] flex items-center justify-center">
              <span className="text-[#050E10] font-bold text-xs">GT</span>
            </div>
            <span className="text-white/70 text-sm hidden sm:block">
              {t("Golden Team For Investment Co.", "شركة الفريق الذهبي للاستثمار")}
            </span>
          </div>
          <Button
            size="sm"
            className="bg-[#C8A830] hover:bg-[#FADC96] text-[#050E10] font-semibold text-xs"
            onClick={() => setLocation("/contact")}
          >
            {t("Contact Us", "تواصل معنا")}
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative h-[70vh] overflow-hidden">
        <img src={HERO_IMG} alt={t("KDP Masterplan", "المخطط الرئيسي لمشروع KDP")} className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,14,16,0.4) 0%, rgba(5,14,16,0.2) 40%, rgba(5,14,16,0.85) 80%, rgba(5,14,16,1) 100%)" }} />
        <div className="absolute inset-0" style={{ background: isRTL ? "linear-gradient(to left, rgba(5,14,16,0.7) 0%, transparent 60%)" : "linear-gradient(to right, rgba(5,14,16,0.7) 0%, transparent 60%)" }} />
        <div className={`absolute inset-0 flex flex-col justify-end pb-16 px-6 max-w-7xl mx-auto ${isRTL ? "items-end text-right" : ""}`}>
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
              <HardHat className="w-3 h-3" />
              {t("Construction Division", "قسم الإنشاءات")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold leading-tight mb-4">
              {isRTL ? (
                <>
                  <span className="text-white">بناء</span>{" "}
                  <span style={{ background: "linear-gradient(135deg, #C8A830, #FADC96)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    مستقبل المملكة
                  </span>
                </>
              ) : (
                <>
                  <span className="text-white">Building</span>{" "}
                  <span style={{ background: "linear-gradient(135deg, #C8A830, #FADC96)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    Saudi Arabia's
                  </span>
                  <br />
                  <span className="text-white">Future</span>
                </>
              )}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-lg max-w-2xl leading-relaxed">
              {t(
                "Delivering landmark construction projects across landscape, infrastructure, and buildings — with 15+ years of proven excellence in the Eastern Province.",
                "تنفيذ مشاريع إنشائية بارزة في مجالات التشجير والبنية التحتية والمباني — بخبرة تتجاوز 15 عامًا من التميز المثبت في المنطقة الشرقية."
              )}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gradient-to-r from-[#0A323C]/80 via-[#0A323C]/60 to-[#0A323C]/80 border-y border-[#C8A830]/20 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-bold text-[#C8A830] mb-1">{value}</div>
                <div className="text-white/60 text-sm tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#5A6446]/40 bg-[#5A6446]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
              <Ruler className="w-3 h-3" />
              {t("Our Expertise", "خبراتنا")}
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              {t("Three Core", "ثلاثة محاور")}<br />
              <span className="text-[#C8A830]">{t("Construction Pillars", "رئيسية للإنشاء")}</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.map(({ icon: Icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                className="p-8 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <h3 className="text-white font-bold text-xl mb-3 font-display">{title}</h3>
                <p className="text-white/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Ongoing Projects ── */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#0A323C]/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-end justify-between mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
                  <div className="w-2 h-2 rounded-full bg-[#C8A830] animate-pulse" />
                  {t("Ongoing Projects", "المشاريع الجارية")}
                </div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
                  {t("Active", "مواقع")}<br />
                  <span className="text-[#C8A830]">{t("Construction Sites", "إنشاء نشطة")}</span>
                </h2>
              </div>
            </motion.div>

            {/* KDP Project Card — Featured */}
            <motion.div
              variants={fadeUp}
              className="group relative rounded-3xl overflow-hidden border border-[#C8A830]/20 hover:border-[#C8A830]/50 transition-all duration-500 cursor-pointer"
              onClick={() => setLocation("/construction/kdp")}
            >
              <div className="relative h-[520px] overflow-hidden">
                <img
                  src={KDP_THUMB}
                  alt={t("KDP Masterplan", "المخطط الرئيسي لمشروع KDP")}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0" style={{ background: isRTL
                  ? "linear-gradient(to left, rgba(5,14,16,0.92) 0%, rgba(5,14,16,0.6) 50%, rgba(5,14,16,0.2) 100%)"
                  : "linear-gradient(to right, rgba(5,14,16,0.92) 0%, rgba(5,14,16,0.6) 50%, rgba(5,14,16,0.2) 100%)"
                }} />

                {/* Thumbnail strip */}
                <div className={`absolute ${isRTL ? "left-6" : "right-6"} top-1/2 -translate-y-1/2 flex-col gap-3 hidden lg:flex`}>
                  {[KDP_THUMB2, KDP_THUMB3].map((src, i) => (
                    <div key={i} className="w-28 h-20 rounded-xl overflow-hidden border border-white/20 opacity-70 group-hover:opacity-100 transition-opacity">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-28 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/50 text-xs">
                    {t("+10 more", "+١٠ أخرى")}
                  </div>
                </div>

                {/* Content */}
                <div className={`absolute inset-0 flex flex-col justify-center px-10 max-w-2xl ${isRTL ? "mr-auto" : ""}`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C8A830]/20 border border-[#C8A830]/40 text-[#FADC96] text-xs font-semibold tracking-wide">
                      <div className="w-2 h-2 rounded-full bg-[#C8A830] animate-pulse" />
                      {t("Ongoing", "جارٍ")}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <MapPin className="w-3 h-3" />
                      {t("Al Khobar, Eastern Province", "الخبر، المنطقة الشرقية")}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <Calendar className="w-3 h-3" />
                      2024
                    </div>
                  </div>

                  <div className="text-[#C8A830] text-sm font-semibold tracking-widest uppercase mb-2">
                    {t("KDP — Khobar Development Project", "KDP — مشروع تطوير الخبر")}
                  </div>
                  <h3 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                    {isRTL ? (
                      <>إعادة تطوير<br />وسط المدينة والفرضة التاريخية</>
                    ) : (
                      <>Redevelopment of<br />City Center & Historic Furdha</>
                    )}
                  </h3>
                  <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
                    {t(
                      "Major urban regeneration of Al Khobar City Center (Site A) — transforming the historic Furdha district into a modern mixed-use environment. Client: Khobar Development Authority.",
                      "مشروع تجديد حضري كبير لوسط مدينة الخبر (الموقع أ) — تحويل حي الفرضة التاريخي إلى بيئة حضرية حديثة متعددة الاستخدامات. العميل: هيئة تطوير الخبر."
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-8">
                    {[
                      t("Infrastructure", "بنية تحتية"),
                      t("Landscape", "تشجير"),
                      t("Buildings", "مباني"),
                      t("MEP", "ميكانيكا وكهرباء"),
                      t("Lighting", "إضاءة"),
                      t("Structure", "هياكل")
                    ].map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/60 text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      className="bg-[#C8A830] hover:bg-[#FADC96] text-[#050E10] font-bold px-6 py-5 shadow-lg shadow-[#C8A830]/20"
                      onClick={() => setLocation("/construction/kdp")}
                    >
                      {t("View Full Project", "عرض المشروع كاملاً")}
                      {isRTL ? <ArrowLeft className="mr-2 w-4 h-4" /> : <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                    <div className="text-white/40 text-sm">
                      {t("588 documents · 7.18 GB · AE7-23790201", "٥٨٨ وثيقة · ٧.١٨ جيجابايت · AE7-23790201")}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Nadheem Project Card */}
            <motion.div variants={fadeUp} className="mt-6">
              <div
                className="group relative rounded-2xl border border-green-400/20 bg-white/3 hover:bg-green-400/5 hover:border-green-400/35 transition-all duration-500 overflow-hidden cursor-pointer"
                onClick={() => setLocation("/construction/nadheem")}
              >
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image side */}
                  <div className="relative h-64 md:h-auto overflow-hidden">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_green2_eebf5935.jpg"
                      alt={t("An-Nadheem Landscape", "مشروع النظيم")}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050E10]/60" />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-green-400 text-xs font-semibold">
                        {t("Active", "جارٍ")}
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-[#050E10]/70 border border-white/15 text-white/60 text-xs">
                        {t("Green Riyadh", "الرياض الخضراء")}
                      </div>
                    </div>
                  </div>

                  {/* Content side */}
                  <div className="p-8 flex flex-col justify-between">
                    <div>
                      <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm">{t("Riyadh, Saudi Arabia", "الرياض، المملكة العربية السعودية")}</span>
                      </div>
                      <h3 className={`font-display text-2xl font-bold text-white mb-3 ${isRTL ? "text-right" : ""}`}>
                        {t("An-Nadheem Landscape Development", "مشروع تطوير النظيم — أعمال التشجير")}
                      </h3>
                      <p className={`text-white/55 text-sm leading-relaxed mb-5 ${isRTL ? "text-right" : ""}`}>
                        {t(
                          "Sector 1 landscape works under the Green Riyadh Initiative (Vision 2030). 136 BOQ items across 18 work categories including earthworks, hardscape, softscape & planting, irrigation, and site furnishings.",
                          "أعمال التشجير والمناظر الطبيعية للقطاع 1 ضمن مبادرة الرياض الخضراء (رؤية 2030). 136 بنداً في جدول الكميات تشمل الترابة، الرصف، التشجير، الري، والأثاث الحضري."
                        )}
                      </p>

                      {/* Mini stats */}
                      <div className={`grid grid-cols-3 gap-3 mb-5 ${isRTL ? "direction-rtl" : ""}`}>
                        {[
                          { value: "SAR 33.2M", label: t("Contract Value", "قيمة العقد") },
                          { value: "136",       label: t("BOQ Items", "بنود BOQ") },
                          { value: "8 mo",      label: t("Duration", "المدة") },
                        ].map(({ value, label }) => (
                          <div key={label} className={`p-3 rounded-lg border border-white/8 bg-white/3 text-center`}>
                            <div className="text-green-400 font-bold text-sm">{value}</div>
                            <div className="text-white/40 text-xs mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Tags */}
                      <div className={`flex flex-wrap gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                        {["Vision 2030", "Green Riyadh", t("Landscape", "تشجير"), "MOBCO", "Riyadh"].map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-full bg-green-400/8 border border-green-400/20 text-green-400/70 text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>

                    <Button
                      className="bg-green-600 hover:bg-green-500 text-white font-bold w-full py-5 shadow-lg shadow-green-500/20"
                      onClick={(e) => { e.stopPropagation(); setLocation("/construction/nadheem"); }}
                    >
                      {t("View Full Project", "عرض المشروع كاملاً")}
                      {isRTL ? <ArrowLeft className="mr-2 w-4 h-4" /> : <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Certifications ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
          <motion.div variants={fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C8A830]/30 bg-[#C8A830]/10 text-[#FADC96] text-xs tracking-widest uppercase mb-4">
              <Award className="w-3 h-3" />
              {t("Certifications", "الشهادات والاعتمادات")}
            </div>
            <h2 className="font-display text-3xl font-bold text-white">
              {t("Quality You Can ", "جودة يمكنك ")}<span className="text-[#C8A830]">{t("Trust", "الوثوق بها")}</span>
            </h2>
          </motion.div>
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
            {CERTS.map(cert => (
              <div key={cert} className="px-6 py-3 rounded-xl border border-[#C8A830]/20 bg-[#C8A830]/5 text-[#FADC96] text-sm font-medium">
                {cert}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t border-white/8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            {t("Ready to Build", "هل أنت مستعد لبناء")}<br />
            <span className="text-[#C8A830]">{t("Something Great?", "شيء عظيم؟")}</span>
          </h2>
          <p className="text-white/50 text-lg mb-8">
            {t(
              "Contact our construction team to discuss your next project.",
              "تواصل مع فريق الإنشاءات لدينا لمناقشة مشروعك القادم."
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-[#C8A830] hover:bg-[#FADC96] text-[#050E10] font-bold px-8 py-6"
              onClick={() => setLocation("/contact")}
            >
              {t("Get In Touch", "تواصل معنا")} <ChevronRight className="ml-1 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-6"
              onClick={() => setLocation("/")}
            >
              {t("Back to Home", "العودة للرئيسية")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
