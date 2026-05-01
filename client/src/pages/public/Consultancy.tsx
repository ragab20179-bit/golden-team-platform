/**
 * Consultancy — Public Service Page
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent, emerald-400 secondary
 * Layout: Hero → services → methodology → sectors → team → CTA
 */
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import {
  TrendingUp, Target, Users, BarChart3, Shield, Globe, BookOpen,
  ArrowRight, ChevronRight, CheckCircle, Lightbulb, Award,
  Briefcase, Building, Factory, Landmark, HeartPulse, Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GT_LOGO_MAIN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt_main_logo_4ff8866b.png";

const CONSULT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-consulting-NxW47h5uQRtwgqAX4Dbu4R.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const SERVICES = [
  {
    icon: TrendingUp, color: "amber",
    titleEn: "Business Development Strategy", titleAr: "استراتيجية تطوير الأعمال",
    descEn: "We help organizations identify growth opportunities, develop market entry strategies, and build sustainable competitive advantages across the GCC and MENA region.",
    descAr: "نساعد المنظمات على تحديد فرص النمو وتطوير استراتيجيات دخول الأسواق وبناء مزايا تنافسية مستدامة في منطقة الخليج والشرق الأوسط.",
    deliverablesEn: ["Market opportunity assessment", "Competitive landscape analysis", "Growth strategy roadmap", "Business model innovation", "Strategic partnership facilitation"],
    deliverablesAr: ["تقييم فرص السوق", "تحليل المشهد التنافسي", "خارطة طريق استراتيجية النمو", "ابتكار نماذج الأعمال", "تيسير الشراكات الاستراتيجية"]
  },
  {
    icon: Target, color: "blue",
    titleEn: "Organizational Excellence", titleAr: "التميز المؤسسي",
    descEn: "Transforming organizational structures, processes, and culture to achieve peak operational performance aligned with your strategic objectives.",
    descAr: "تحويل الهياكل التنظيمية والعمليات والثقافة لتحقيق أعلى مستويات الأداء التشغيلي المتوافق مع أهدافك الاستراتيجية.",
    deliverablesEn: ["Organizational design & restructuring", "Process reengineering (BPR)", "Performance management systems", "Change management programs", "Leadership development"],
    deliverablesAr: ["تصميم وإعادة هيكلة المنظمة", "إعادة هندسة العمليات (BPR)", "أنظمة إدارة الأداء", "برامج إدارة التغيير", "تطوير القيادة"]
  },
  {
    icon: Shield, color: "emerald",
    titleEn: "ISO 9001 & Quality Advisory", titleAr: "استشارات ISO 9001 والجودة",
    descEn: "End-to-end ISO 9001:2015 implementation, certification support, and quality management system optimization for sustainable compliance.",
    descAr: "تطبيق شامل لمعيار ISO 9001:2015 ودعم الاعتماد وتحسين نظام إدارة الجودة لضمان الامتثال المستدام.",
    deliverablesEn: ["Gap analysis & readiness assessment", "QMS documentation development", "Internal auditor training", "Certification audit support", "Continuous improvement programs"],
    deliverablesAr: ["تحليل الفجوات وتقييم الجاهزية", "تطوير وثائق نظام إدارة الجودة", "تدريب المدققين الداخليين", "دعم تدقيق الاعتماد", "برامج التحسين المستمر"]
  },
  {
    icon: BarChart3, color: "violet",
    titleEn: "Digital Transformation", titleAr: "التحول الرقمي",
    descEn: "Strategic guidance on technology adoption, AI integration, and digital operating model design to future-proof your organization.",
    descAr: "توجيه استراتيجي حول تبني التقنية وتكامل الذكاء الاصطناعي وتصميم نموذج التشغيل الرقمي لمستقبل مؤسستك.",
    deliverablesEn: ["Digital maturity assessment", "Technology roadmap development", "AI & automation strategy", "Data governance framework", "Change enablement & adoption"],
    deliverablesAr: ["تقييم النضج الرقمي", "تطوير خارطة طريق التقنية", "استراتيجية الذكاء الاصطناعي والأتمتة", "إطار حوكمة البيانات", "تمكين التغيير والتبني"]
  },
  {
    icon: Briefcase, color: "red",
    titleEn: "Administrative Modernization", titleAr: "تحديث الإدارة",
    descEn: "Streamlining administrative functions through process automation, policy development, and governance framework implementation.",
    descAr: "تبسيط الوظائف الإدارية من خلال أتمتة العمليات وتطوير السياسات وتطبيق أطر الحوكمة.",
    deliverablesEn: ["Administrative process audit", "Policy & procedure development", "Delegation of authority matrix", "Document management systems", "Compliance framework design"],
    deliverablesAr: ["تدقيق العمليات الإدارية", "تطوير السياسات والإجراءات", "مصفوفة تفويض الصلاحيات", "أنظمة إدارة الوثائق", "تصميم إطار الامتثال"]
  },
  {
    icon: Globe, color: "cyan",
    titleEn: "GCC Market Entry", titleAr: "الدخول إلى أسواق الخليج",
    descEn: "Comprehensive support for organizations entering Saudi Arabia, UAE, and wider GCC markets — from regulatory compliance to local partnership development.",
    descAr: "دعم شامل للمنظمات الراغبة في دخول أسواق المملكة العربية السعودية والإمارات ودول الخليج — من الامتثال التنظيمي إلى بناء الشراكات المحلية.",
    deliverablesEn: ["Regulatory compliance advisory", "Entity setup & licensing", "Local partner identification", "Cultural adaptation strategy", "Government relations support"],
    deliverablesAr: ["استشارات الامتثال التنظيمي", "إعداد الكيان والترخيص", "تحديد الشركاء المحليين", "استراتيجية التكيف الثقافي", "دعم العلاقات الحكومية"]
  },
];

const METHODOLOGY = [
  { phaseEn: "Diagnose", phaseAr: "التشخيص", icon: "🔍", descEn: "Deep-dive assessment of your current state, challenges, and aspirations through stakeholder interviews, data analysis, and benchmarking.", descAr: "تقييم معمّق لوضعك الحالي وتحدياتك وطموحاتك من خلال مقابلات أصحاب المصلحة وتحليل البيانات والمقارنة المرجعية." },
  { phaseEn: "Design", phaseAr: "التصميم", icon: "📐", descEn: "Co-creation of tailored solutions with your team — ensuring buy-in, feasibility, and alignment with your organizational culture and constraints.", descAr: "الإبداع المشترك لحلول مخصصة مع فريقك — لضمان القبول والجدوى والتوافق مع ثقافتك المؤسسية وقيودك." },
  { phaseEn: "Deploy", phaseAr: "التنفيذ", icon: "🚀", descEn: "Structured implementation with clear milestones, accountability frameworks, and progress tracking to ensure execution excellence.", descAr: "تنفيذ منظم بمعالم واضحة وأطر مساءلة وتتبع للتقدم لضمان التميز في التنفيذ." },
  { phaseEn: "Sustain", phaseAr: "الاستدامة", icon: "♻️", descEn: "Capability building, knowledge transfer, and ongoing advisory support to ensure lasting impact beyond the engagement.", descAr: "بناء القدرات ونقل المعرفة والدعم الاستشاري المستمر لضمان أثر دائم يتجاوز نطاق التعامل." },
];

const SECTORS = [
  { icon: Building, labelEn: "Government & Public Sector", labelAr: "الحكومة والقطاع العام" },
  { icon: Factory, labelEn: "Manufacturing & Industry", labelAr: "التصنيع والصناعة" },
  { icon: Landmark, labelEn: "Financial Services", labelAr: "الخدمات المالية" },
  { icon: HeartPulse, labelEn: "Healthcare", labelAr: "الرعاية الصحية" },
  { icon: Truck, labelEn: "Logistics & Supply Chain", labelAr: "اللوجستيات وسلسلة الإمداد" },
  { icon: Globe, labelEn: "Technology & Telecoms", labelAr: "التقنية والاتصالات" },
];

const OUTCOMES = [
  { value: "40%", labelEn: "Average Process Efficiency Gain", labelAr: "متوسط تحسين كفاءة العمليات" },
  { value: "18mo", labelEn: "Typical ISO 9001 Certification Timeline", labelAr: "الجدول الزمني المعتاد لشهادة ISO 9001" },
  { value: "95%", labelEn: "Client Satisfaction Score", labelAr: "معدل رضا العملاء" },
  { value: "60+", labelEn: "Engagements Delivered", labelAr: "تعامل مُنجز" },
];

const colorMap: Record<string, string> = {
  amber: "from-amber-500 to-amber-600 text-amber-400 bg-amber-500/10 border-amber-500/20",
  blue: "from-blue-500 to-blue-600 text-blue-400 bg-blue-500/10 border-blue-500/20",
  emerald: "from-emerald-500 to-emerald-600 text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  violet: "from-violet-500 to-violet-600 text-violet-400 bg-violet-500/10 border-violet-500/20",
  red: "from-red-500 to-red-600 text-red-400 bg-red-500/10 border-red-500/20",
  cyan: "from-cyan-500 to-cyan-600 text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
};

export default function Consultancy() {
  const [, navigate] = useLocation();
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen bg-[#05080F] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* ── Top Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#05080F]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src={GT_LOGO_MAIN} alt="Golden Team" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-white font-bold text-sm tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>GOLDEN TEAM</div>
              <div className="text-amber-400/60 text-[9px] tracking-widest uppercase">{t("Trading Services", "خدمات تجارية")}</div>
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
                className={`text-sm tracking-wide transition-colors ${path === "/consultancy" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
                {label}
              </button>
            ))}
          </div>
          <Button onClick={() => navigate("/login")}
            className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold text-xs tracking-widest uppercase px-5">
            {t("Employee Portal", "بوابة الموظفين")}
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-16 min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={CONSULT_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">{t("Home", "الرئيسية")}</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">{t("Consultancy", "الاستشارات")}</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs tracking-widest uppercase mb-6">
              <Lightbulb className="w-3 h-3" /> {t("Strategic Business Advisory", "استشارات أعمال استراتيجية")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Strategic Advisory", "استشارات استراتيجية")}<br /><span className="text-amber-400">{t("That Delivers", "تحقق نتائج")}</span><br />{t("Measurable Results", "ملموسة وقابلة للقياس")}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mb-10 leading-relaxed">
              {t("Golden Team's consultancy practice combines deep GCC regional expertise with international best practices to help organizations navigate complexity, optimize operations, and achieve their strategic ambitions.", "تجمع ممارسة الاستشارة في الفريق الذهبي خبرة خليجية عميقة مع أفضل الممارسات الدولية لمساعدة المنظمات على تحقيق طموحاتها الاستراتيجية.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-8 py-3 text-sm tracking-wide">
                {t("Schedule a Consultation", "حجز استشارة")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/about")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-sm">
                {t("Our Approach", "منهجيتنا")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Outcomes Bar ── */}
      <section className="border-y border-white/8 bg-white/2 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {OUTCOMES.map(({ value, labelEn, labelAr }) => (
              <motion.div key={labelEn} variants={fadeUp}>
                <div className="text-3xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-white/50 text-sm">{t(labelEn, labelAr)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Our Consultancy Services", "خدمات الاستشارة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              {t("Six specialized practice areas covering the full spectrum of business transformation and organizational excellence.", "ست مجالات متخصصة تغطي طيف كامل من التحول التجاري والتميز المؤسسي.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(({ icon: Icon, color, titleEn, titleAr, descEn, descAr, deliverablesEn, deliverablesAr }) => {
              const c = colorMap[color].split(" ");
              const deliverables = lang === "ar" ? deliverablesAr : deliverablesEn;
              return (
                <motion.div key={titleEn} variants={fadeUp}
                  className="group p-7 rounded-2xl border border-white/8 bg-white/2 hover:bg-amber-500/3 hover:border-amber-400/20 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} flex items-center justify-center mb-5`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{t(titleEn, titleAr)}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mb-5">{t(descEn, descAr)}</p>
                  <div className="space-y-1.5">
                    {deliverables.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                        <CheckCircle className={`w-3 h-3 shrink-0 ${c[2]}`} />
                        {d}
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Methodology ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Our 4D Methodology", "منهجية 4D المتكاملة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t("A proven, structured approach that ensures every engagement delivers measurable, sustainable outcomes.", "منهج مجرب ومنظم يضمن أن كل تعامل يحقق نتائج ملموسة ومستدامة.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-4 gap-6">
            {METHODOLOGY.map(({ phaseEn, phaseAr, icon, descEn, descAr }, i) => (
              <motion.div key={phaseEn} variants={fadeUp}
                className="relative p-6 rounded-2xl border border-white/8 bg-white/2 text-center">
                {i < METHODOLOGY.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[70%] w-full h-px bg-gradient-to-r from-amber-400/30 to-transparent z-10" />
                )}
                <div className="text-4xl mb-4">{icon}</div>
                <div className="text-amber-400 font-bold text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{t(phaseEn, phaseAr)}</div>
                <p className="text-white/40 text-xs leading-relaxed">{t(descEn, descAr)}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Sectors We Serve", "القطاعات التي نخدمها")}
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SECTORS.map(({ icon: Icon, labelEn, labelAr }) => (
              <motion.div key={labelEn} variants={fadeUp}
                className="group p-5 rounded-xl border border-white/8 bg-white/2 hover:bg-amber-500/5 hover:border-amber-400/20 transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-white/60 text-xs leading-tight">{t(labelEn, labelAr)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Start Your Transformation", "ابدأ رحلتك")}<br /><span className="text-amber-400">{t("Journey Today", "نحو التحول الآن")}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10 max-w-2xl mx-auto">
              {t("Our senior consultants are ready to discuss your challenges and design a tailored engagement that delivers real results.", "مستشارونا الكبار مستعدون لمناقشة تحدياتك وتصميم تدخل مخصص يحقق نتائج حقيقية.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-4 text-sm tracking-wide">
                {t("Book a Free Consultation", "احجز استشارة مجانية")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/about")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                {t("Meet Our Team", "تعرف على فريقنا")}
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
