/**
 * An-Nadheem Landscape Development Project Page
 * Green Riyadh Initiative — Sector 1 Landscape Works
 * Contract: Nadh-Co-A-5-34 | SAR 33.2M | 136 BOQ items
 * Bilingual: Arabic (RTL) / English (LTR)
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, MapPin, Calendar, DollarSign,
  Layers, TreePine, Leaf, Droplets, Building2, CheckCircle2,
  ChevronRight, ExternalLink, FileText, BarChart3, Award
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// ── CDN URLs ──────────────────────────────────────────────────────────────────
const IMG_AERIAL    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_aerial_6b968801.jpg";
const IMG_PARK      = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_park_d458c9ff.jpg";
const IMG_LANDSCAPE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_landscape_278df834.png";
const IMG_GREEN1    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_green1_463baf46.jpg";
const IMG_GREEN2    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_green2_eebf5935.jpg";
const IMG_TREES     = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_trees_b1b483b6.jpg";
const IMG_VISION    = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_vision2030_ccc5b877.jpg";
const IMG_PARK2     = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/nadheem_park2_7152d5cb.jpg";

const GALLERY = [
  { url: IMG_AERIAL,    captionAR: "منظر جوي — حي النظيم، الرياض",          captionEN: "Aerial View — An-Nadheem District, Riyadh" },
  { url: IMG_PARK,      captionAR: "حدائق الرياض الخضراء — مناطق الترفيه",   captionEN: "Green Riyadh Parks — Leisure Zones" },
  { url: IMG_LANDSCAPE, captionAR: "التصميم الشامل للمناظر الطبيعية",         captionEN: "Master Landscape Design" },
  { url: IMG_GREEN1,    captionAR: "الممرات الخضراء والأشجار",               captionEN: "Green Corridors & Tree Planting" },
  { url: IMG_GREEN2,    captionAR: "المساحات العامة والتشجير الحضري",         captionEN: "Public Spaces & Urban Greening" },
  { url: IMG_TREES,     captionAR: "زراعة الأشجار — 7.5 مليون شجرة",        captionEN: "Tree Planting — 7.5M Trees Initiative" },
  { url: IMG_VISION,    captionAR: "رؤية 2030 — الرياض الخضراء",            captionEN: "Vision 2030 — Green Riyadh Program" },
  { url: IMG_PARK2,     captionAR: "الحدائق والمناطق الترفيهية",             captionEN: "Parks & Recreational Areas" },
];

const fadeUp = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

export default function NadheemProject() {
  const [, setLocation] = useLocation();
  const { lang, isRTL, t } = useLanguage();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const prevImg = () => setLightboxIdx(i => i !== null ? (i - 1 + GALLERY.length) % GALLERY.length : null);
  const nextImg = () => setLightboxIdx(i => i !== null ? (i + 1) % GALLERY.length : null);

  return (
    <div className={`min-h-screen bg-[#050E10] text-white font-sans overflow-x-hidden ${isRTL ? "rtl" : "ltr"}`}>

      {/* ── Back Nav ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#050E10]/90 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setLocation("/construction")}
            className={`flex items-center gap-2 text-white/60 hover:text-[#FADC96] transition-colors text-sm ${isRTL ? "flex-row-reverse" : ""}`}
          >
            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRTL ? "العودة إلى المشاريع" : "Back to Projects"}
          </button>
          <div className={`flex items-center gap-2 text-xs text-white/40 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {isRTL ? "مشروع جارٍ" : "Active Project"}
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={IMG_GREEN2} alt="An-Nadheem Project" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(5,14,16,0.3) 0%, rgba(5,14,16,0.5) 50%, rgba(5,14,16,0.95) 100%)" }} />
          {/* Green tint overlay */}
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(34,197,94,0.3) 0%, transparent 60%)" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="px-3 py-1.5 rounded-full border border-green-400/40 bg-green-400/10 text-green-400 text-xs tracking-widest uppercase">
                {isRTL ? "الرياض الخضراء" : "Green Riyadh Initiative"}
              </div>
              <div className="px-3 py-1.5 rounded-full border border-[#FADC96]/30 bg-[#FADC96]/8 text-[#FADC96] text-xs tracking-widest uppercase">
                {isRTL ? "مشروع جارٍ" : "Ongoing"}
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className={`font-display text-4xl md:text-6xl font-bold leading-tight mb-4 ${isRTL ? "text-right" : ""}`}>
              {isRTL ? (
                <>مشروع <span className="text-green-400">تطوير النظيم</span><br /><span className="text-white/70 text-3xl md:text-4xl">أعمال التشجير والمناظر الطبيعية — القطاع 1</span></>
              ) : (
                <>An-Nadheem <span className="text-green-400">Landscape Development</span><br /><span className="text-white/70 text-3xl md:text-4xl">Sector 1 — Green Riyadh Initiative</span></>
              )}
            </motion.h1>

            {/* Quick stats */}
            <motion.div variants={fadeUp} className={`flex flex-wrap gap-6 ${isRTL ? "flex-row-reverse" : ""}`}>
              {[
                { icon: DollarSign, value: "SAR 33.2M", label: isRTL ? "قيمة العقد" : "Contract Value" },
                { icon: MapPin,     value: isRTL ? "الرياض، المملكة العربية السعودية" : "Riyadh, KSA", label: isRTL ? "الموقع" : "Location" },
                { icon: Calendar,   value: isRTL ? "8 أشهر" : "8 Months", label: isRTL ? "مدة التنفيذ" : "Duration" },
                { icon: Layers,     value: "136", label: isRTL ? "بنداً في BOQ" : "BOQ Items" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className={`flex items-center gap-2 text-white/70 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <Icon className="w-4 h-4 text-green-400" />
                  <span className="font-semibold text-white">{value}</span>
                  <span className="text-white/40 text-sm">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Project Overview ── */}
      <section className="py-20 bg-gradient-to-b from-[#050E10] to-[#071510]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className={`grid lg:grid-cols-2 gap-16 items-center ${isRTL ? "direction-rtl" : ""}`}>

            {/* Text */}
            <motion.div variants={fadeUp} className={isRTL ? "text-right" : ""}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/30 bg-green-400/8 text-green-400 text-xs tracking-widest uppercase mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Leaf className="w-3 h-3" />
                {isRTL ? "نبذة عن المشروع" : "Project Overview"}
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                {isRTL
                  ? <>تشجير حضري <span className="text-green-400">بمعايير رؤية 2030</span></>
                  : <>Urban Greening to <span className="text-green-400">Vision 2030 Standards</span></>}
              </h2>
              <p className="text-white/60 text-base leading-relaxed mb-6">
                {isRTL
                  ? "مشروع النظيم هو مشروع تطوير مناظر طبيعية ضمن مبادرة الرياض الخضراء التابعة لرؤية 2030، يشمل القطاع 1 من حي النظيم في الرياض. تضطلع شركة الفريق الذهبي للاستثمار بتنفيذ أعمال التشجير والبنية التحتية الخضراء بموجب عقد من الباطن مع شركة MOBCO بقيمة SAR 33.2 مليون."
                  : "An-Nadheem is a landscape development project under the Green Riyadh Initiative (Vision 2030), covering Sector 1 of the An-Nadheem district in Riyadh. Golden Team For Investment Co. executes the landscape and green infrastructure works under a subcontract with MOBCO valued at SAR 33.2 million."}
              </p>
              <p className="text-white/60 text-base leading-relaxed mb-8">
                {isRTL
                  ? "يشمل نطاق العمل 136 بنداً في جدول الكميات موزعة على 18 فئة عمل، تغطي أعمال الترابة، الرصف، التشجير والزراعة، الري، الأثاث الحضري، والإنارة. المشروع يُنفَّذ وفق مواصفات SOP المعتمدة من الهيئة الملكية لمدينة الرياض ومعايير Mostadam للاستدامة."
                  : "The scope covers 136 BOQ items across 18 work categories: earthworks, paving, softscape & planting, irrigation, site furnishings, and lighting. Works are executed to the Royal Commission for Riyadh City SOP specifications and Mostadam sustainability standards."}
              </p>

              {/* Contract details */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: isRTL ? "رقم العقد" : "Contract Ref", value: "Nadh-Co-A-5-34" },
                  { label: isRTL ? "المقاول الرئيسي" : "Main Contractor", value: "MOBCO" },
                  { label: isRTL ? "المصمم" : "Designer", value: "D.G. Jones & Partners" },
                  { label: isRTL ? "المالك" : "Client", value: isRTL ? "أمانة الرياض" : "Riyadh Municipality" },
                ].map(({ label, value }) => (
                  <div key={label} className={`p-3 rounded-lg border border-white/8 bg-white/3 ${isRTL ? "text-right" : ""}`}>
                    <div className="text-white/40 text-xs mb-1">{label}</div>
                    <div className="text-white font-semibold text-sm">{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Image */}
            <motion.div variants={fadeUp} className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/8 h-[420px]">
              <img src={IMG_PARK} alt="An-Nadheem Landscape" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050E10]/60 to-transparent" />
              {/* Floating badge */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="px-3 py-2 rounded-lg bg-[#050E10]/80 backdrop-blur border border-green-400/30 text-green-400 text-xs font-semibold">
                  {isRTL ? "القطاع 1 — حي النظيم" : "Sector 1 — An-Nadheem District"}
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#050E10]/80 backdrop-blur border border-[#FADC96]/30 text-[#FADC96] text-xs font-semibold">
                  {isRTL ? "ديسمبر 2023" : "Dec 2023 SOP"}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Key Metrics ── */}
      <section className="py-16 bg-gradient-to-b from-[#071510] to-[#050E10]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} className={`text-center mb-12 ${isRTL ? "text-right" : ""}`}>
              <h2 className="font-display text-3xl font-bold text-white mb-3">
                {isRTL ? "الأرقام الرئيسية" : "Key Project Metrics"}
              </h2>
              <p className="text-white/40 text-sm">
                {isRTL ? "مستخرجة من وثائق العقد وجدول الكميات المعتمد" : "Extracted from contract documents and approved BOQ"}
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { icon: DollarSign, value: "SAR 33.2M", subValue: "SAR 38.2M incl. VAT", label: isRTL ? "قيمة العقد" : "Contract Value", color: "text-[#FADC96]", border: "border-[#FADC96]/20", bg: "bg-[#FADC96]/5" },
                { icon: Layers,     value: "136",        subValue: isRTL ? "18 فئة عمل" : "18 work categories", label: isRTL ? "بنود BOQ" : "BOQ Line Items", color: "text-green-400", border: "border-green-400/20", bg: "bg-green-400/5" },
                { icon: TreePine,   value: "35.4%",      subValue: "SAR 11.76M", label: isRTL ? "أعمال التشجير والزراعة" : "Softscape & Planting", color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/5" },
                { icon: Calendar,   value: "8",          subValue: isRTL ? "من تاريخ المباشرة" : "from commencement", label: isRTL ? "أشهر التنفيذ" : "Execution Months", color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/5" },
              ].map(({ icon: Icon, value, subValue, label, color, border, bg }) => (
                <motion.div key={label} variants={fadeUp} className={`p-6 rounded-2xl border ${border} ${bg} text-center`}>
                  <div className={`w-12 h-12 rounded-xl ${bg} border ${border} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div className={`font-display text-3xl font-bold ${color} mb-1`}>{value}</div>
                  <div className="text-white/40 text-xs mb-2">{subValue}</div>
                  <div className="text-white/70 text-sm font-medium">{label}</div>
                </motion.div>
              ))}
            </div>

            {/* Cost breakdown bar */}
            <motion.div variants={fadeUp} className="p-6 rounded-2xl border border-white/8 bg-white/3">
              <h3 className={`font-display text-lg font-bold text-white mb-6 ${isRTL ? "text-right" : ""}`}>
                {isRTL ? "توزيع التكاليف حسب الفئة" : "Cost Breakdown by Category"}
              </h3>
              <div className="space-y-4">
                {[
                  { label: isRTL ? "التشجير والزراعة" : "Softscape & Planting",   pct: 35.4, color: "bg-green-500",   value: "SAR 11.76M" },
                  { label: isRTL ? "أعمال الترابة" : "Earthworks",               pct: 23.5, color: "bg-amber-500",   value: "SAR 7.80M"  },
                  { label: isRTL ? "الرصف والأسطح الصلبة" : "Hardscape & Paving", pct: 18.0, color: "bg-blue-500",   value: "SAR 5.98M"  },
                  { label: isRTL ? "الري والبنية التحتية" : "Irrigation & MEP",   pct: 12.5, color: "bg-cyan-500",   value: "SAR 4.15M"  },
                  { label: isRTL ? "الأثاث الحضري والإنارة" : "Furnishings & Lighting", pct: 6.5, color: "bg-purple-500", value: "SAR 2.16M" },
                  { label: isRTL ? "أخرى" : "Other",                              pct: 4.1,  color: "bg-gray-500",   value: "SAR 1.36M"  },
                ].map(({ label, pct, color, value }) => (
                  <div key={label} className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`text-white/60 text-sm ${isRTL ? "text-right" : ""}`} style={{ width: "200px", flexShrink: 0 }}>{label}</div>
                    <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-white/60 text-sm font-mono" style={{ width: "90px", flexShrink: 0, textAlign: isRTL ? "left" : "right" }}>{pct}%</div>
                    <div className="text-[#FADC96] text-sm font-semibold" style={{ width: "80px", flexShrink: 0 }}>{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Scope of Work ── */}
      <section className="py-20 bg-[#050E10]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
            <motion.div variants={fadeUp} className={`text-center mb-14 ${isRTL ? "text-right" : ""}`}>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/30 bg-green-400/8 text-green-400 text-xs tracking-widest uppercase mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="w-3 h-3" />
                {isRTL ? "نطاق الأعمال" : "Scope of Work"}
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                {isRTL ? "18 فئة عمل — 136 بنداً" : "18 Work Categories — 136 Items"}
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Layers,    titleAR: "أعمال الترابة",              titleEN: "Earthworks",              descAR: "تسوية الموقع، الحفر، الردم، الدك — SAR 7.8M",          descEN: "Site clearance, excavation, fill & compaction — SAR 7.8M" },
                { icon: Building2, titleAR: "الرصف والأسطح الصلبة",       titleEN: "Hardscape & Paving",       descAR: "أسفلت، خرسانة، إنترلوك، حجر رياض — SAR 6.0M",         descEN: "Asphalt, concrete, interlocking, Riyadh limestone — SAR 6.0M" },
                { icon: TreePine,  titleAR: "التشجير والزراعة",            titleEN: "Softscape & Planting",     descAR: "أشجار، شجيرات، عشب، تغطية أرضية — SAR 11.76M",        descEN: "Trees, shrubs, turf, groundcover — SAR 11.76M" },
                { icon: Droplets,  titleAR: "شبكة الري",                  titleEN: "Irrigation Network",       descAR: "شبكة ري رئيسية، منطقة 1 — مواصفات FINAL",             descEN: "Main irrigation network, Zone 1 — FINAL specifications" },
                { icon: Leaf,      titleAR: "الأثاث الحضري",              titleEN: "Site Furnishings",         descAR: "شبكات الأشجار، مقاعد، مظلات، علامات — SAR 0.44M",    descEN: "Tree grills, benches, shelters, signage — SAR 0.44M" },
                { icon: Award,     titleAR: "معايير الاستدامة",            titleEN: "Sustainability Standards", descAR: "مطابقة Mostadam، ISO 14001، مواصفات RCRC SOP",        descEN: "Mostadam compliant, ISO 14001, RCRC SOP specifications" },
              ].map(({ icon: Icon, titleAR, titleEN, descAR, descEN }) => (
                <motion.div key={titleEN} variants={fadeUp}
                  className="group p-6 rounded-xl border border-white/8 bg-white/3 hover:bg-green-400/5 hover:border-green-400/25 transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mb-4 group-hover:bg-green-400/20 transition-colors">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className={`font-display font-semibold text-white mb-2 ${isRTL ? "text-right" : ""}`}>
                    {isRTL ? titleAR : titleEN}
                  </h3>
                  <p className={`text-white/50 text-sm leading-relaxed ${isRTL ? "text-right" : ""}`}>
                    {isRTL ? descAR : descEN}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Photo Gallery ── */}
      <section className="py-20 bg-gradient-to-b from-[#050E10] to-[#071510]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-400/30 bg-green-400/8 text-green-400 text-xs tracking-widest uppercase mb-6">
                <FileText className="w-3 h-3" />
                {isRTL ? "معرض الصور" : "Photo Gallery"}
              </div>
              <h2 className="font-display text-3xl font-bold text-white">
                {isRTL ? "الرياض الخضراء — صور المشروع" : "Green Riyadh — Project Images"}
              </h2>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GALLERY.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden border border-white/8 cursor-pointer group ${idx === 0 ? "col-span-2 row-span-2 h-72" : "h-36"}`}
                  onClick={() => setLightboxIdx(idx)}
                >
                  <img src={img.url} alt={isRTL ? img.captionAR : img.captionEN} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-2 left-2 right-2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isRTL ? img.captionAR : img.captionEN}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Compliance & Standards ── */}
      <section className="py-16 bg-[#050E10]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
            <motion.div variants={fadeUp} className="p-8 rounded-2xl border border-green-400/15 bg-green-400/3">
              <div className={`flex items-start gap-4 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-12 h-12 rounded-xl bg-green-400/15 border border-green-400/25 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-green-400" />
                </div>
                <div className={isRTL ? "text-right" : ""}>
                  <h3 className="font-display text-xl font-bold text-white mb-1">
                    {isRTL ? "المعايير والمواصفات التقنية" : "Technical Standards & Compliance"}
                  </h3>
                  <p className="text-white/50 text-sm">
                    {isRTL ? "جميع الأعمال تُنفَّذ وفق المواصفات المعتمدة" : "All works executed to approved specifications"}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { code: "RCRC SOP",       desc: isRTL ? "مواصفات الهيئة الملكية لمدينة الرياض" : "Royal Commission for Riyadh City SOP" },
                  { code: "Mostadam",       desc: isRTL ? "معايير الاستدامة السعودية" : "Saudi Sustainability Rating System" },
                  { code: "ASTM / AASHTO", desc: isRTL ? "مواصفات الأسفلت والركام" : "Asphalt & Aggregate Standards" },
                  { code: "BS EN 13108",   desc: isRTL ? "مواصفات خلطة الأسفلت الساخنة" : "Hot Mix Asphalt Specification" },
                ].map(({ code, desc }) => (
                  <div key={code} className={`p-4 rounded-xl border border-white/8 bg-white/3 ${isRTL ? "text-right" : ""}`}>
                    <div className="font-mono text-green-400 font-bold text-sm mb-1">{code}</div>
                    <div className="text-white/50 text-xs leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-b from-[#050E10] to-[#071510]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              {isRTL ? "مهتم بمشاريع مماثلة؟" : "Interested in Similar Projects?"}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
              {isRTL
                ? "تواصل مع فريق الفريق الذهبي للاستثمار لمناقشة مشاريع التشجير والبنية التحتية الخضراء"
                : "Contact Golden Team For Investment Co. to discuss landscape and green infrastructure projects"}
            </motion.p>
            <motion.div variants={fadeUp} className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <Button
                className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-5 shadow-xl shadow-green-500/20"
                onClick={() => setLocation("/contact")}
              >
                {isRTL ? "تواصل معنا" : "Get In Touch"}
                <ChevronRight className={`${isRTL ? "mr-2 rotate-180" : "ml-2"} w-4 h-4`} />
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-5"
                onClick={() => setLocation("/construction")}
              >
                {isRTL ? "جميع المشاريع" : "All Projects"}
                <ExternalLink className={`${isRTL ? "mr-2" : "ml-2"} w-4 h-4`} />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Lightbox ── */}
      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightboxIdx(null)}>
          <button onClick={e => { e.stopPropagation(); prevImg(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={GALLERY[lightboxIdx].url} alt="" className="w-full max-h-[80vh] object-contain rounded-xl" />
            <p className="text-white/60 text-center text-sm mt-4">
              {isRTL ? GALLERY[lightboxIdx].captionAR : GALLERY[lightboxIdx].captionEN}
            </p>
            <p className="text-white/30 text-center text-xs mt-1">{lightboxIdx + 1} / {GALLERY.length}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); nextImg(); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
