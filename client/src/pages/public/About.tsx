/**
 * About Us — Public Page
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent
 * Layout: Hero → story → values → team → milestones → certifications → CTA
 */
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Award, Shield, Globe, Users, Target, Lightbulb, Heart,
  ArrowRight, ChevronRight, CheckCircle, Star, TrendingUp, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const GT_LOGO_MAIN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt_main_logo_4ff8866b.png";
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-hero-corporate-LAR4ea7VBJH3jL9DF5uSJy.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const VALUES_EN = [
  { icon: Shield, titleEn: "Integrity First", titleAr: "النزاهة أولاً", descEn: "Every engagement is governed by transparency, honesty, and ethical conduct. We build trust through consistent delivery and open communication.", descAr: "كل تعامل يحكمه الشفافية والأمانة والسلوك الأخلاقي. نبني الثقة عبر التسليم المتسق والتواصل المفتوح." },
  { icon: Target, titleEn: "Results-Driven", titleAr: "موجّه بالنتائج", descEn: "We measure our success by your outcomes. Every project has clear KPIs, and we hold ourselves accountable to delivering measurable value.", descAr: "نقيس نجاحنا بنتائجك. لكل مشروع مؤشرات أداء واضحة ونتحمل المسؤولية عن تحقيق قيمة ملموسة." },
  { icon: Lightbulb, titleEn: "Innovation-Led", titleAr: "ريادة الابتكار", descEn: "We continuously invest in emerging technologies — particularly AI — to ensure our clients always have access to cutting-edge solutions.", descAr: "نستثمر باستمرار في التقنيات الناشئة — لا سيما الذكاء الاصطناعي — لضمان حصول عملائنا دائماً على حلول متطورة." },
  { icon: Globe, titleEn: "GCC-Rooted", titleAr: "جذور خليجية", descEn: "Deep regional expertise, cultural understanding, and established government relationships across Saudi Arabia, UAE, and the wider GCC.", descAr: "خبرة إقليمية عميقة وفهم ثقافي وعلاقات حكومية راسخة عبر السعودية والإمارات ودول الخليج." },
  { icon: Users, titleEn: "Partnership Mindset", titleAr: "عقلية الشراكة", descEn: "We work as an extension of your team, not as external vendors. Long-term relationships and client success are our primary metrics.", descAr: "نعمل كامتداد لفريقك، لا كموردين خارجيين. العلاقات طويلة الأمد ونجاح العميل هما مقياسانا الأساسيان." },
  { icon: Heart, titleEn: "People-Centered", titleAr: "محورية الإنسان", descEn: "Technology serves people, not the other way around. We design solutions that empower employees and improve the human experience at work.", descAr: "التقنية في خدمة الإنسان لا العكس. نصمم حلولاً تمكّن الموظفين وتحسّن تجربة العمل." },
];

const MILESTONES = [
  { year: "2010", titleEn: "Founded in Riyadh", titleAr: "التأسيس في الرياض", descEn: "Golden Team established as an IT services and business consultancy firm serving the Saudi market.", descAr: "تأسيس الفريق الذهبي كشركة خدمات تقنية واستشارات أعمال تخدم السوق السعودي." },
  { year: "2014", titleEn: "ISO 9001 Certification", titleAr: "شهادة ISO 9001", descEn: "Achieved ISO 9001:2008 certification, demonstrating commitment to quality management excellence.", descAr: "حصلنا على شهادة ISO 9001:2008 تجسيداً لالتزامنا بالتميز في إدارة الجودة." },
  { year: "2017", titleEn: "GCC Expansion", titleAr: "التوسع الخليجي", descEn: "Extended operations to UAE and Bahrain, establishing Golden Team as a regional enterprise services provider.", descAr: "توسعنا إلى الإمارات والبحرين ليصبح الفريق الذهبي مزود خدمات مؤسسية إقليمياً." },
  { year: "2019", titleEn: "ASTRA PM Launch", titleAr: "إطلاق ASTRA PM", descEn: "Launched the ASTRA Project Management platform, purpose-built for GCC construction and infrastructure projects.", descAr: "إطلاق منصة ASTRA لإدارة المشاريع المصممة لمشاريع البناء والبنية التحتية في الخليج." },
  { year: "2022", titleEn: "AI Division Established", titleAr: "تأسيس قسم الذكاء الاصطناعي", descEn: "Formed the AI & Digital Transformation practice, beginning development of the NEO AI Core platform.", descAr: "تأسيس ممارسة الذكاء الاصطناعي والتحول الرقمي وبدء تطوير منصة NEO AI Core." },
  { year: "2024", titleEn: "NEO AI Core v1.0", titleAr: "NEO AI Core v1.0", descEn: "Released NEO AI Core — the first hybrid Manus + GPT-4 enterprise AI orchestration platform for the GCC market.", descAr: "إصدار NEO AI Core — أول منصة ذكاء اصطناعي هجينة للمؤسسات في سوق الخليج." },
  { year: "2026", titleEn: "Golden Team Enterprise Platform", titleAr: "منصة الفريق الذهبي المؤسسية", descEn: "Launched the fully integrated enterprise platform combining all services, NEO AI, and ASTRA PM in one unified ecosystem.", descAr: "إطلاق المنصة المؤسسية المتكاملة التي تجمع جميع الخدمات و NEO AI و ASTRA PM في نظام بيئي موحد." },
];

const TEAM = [
  { name: "محمد الراشدي", roleEn: "Chief Executive Officer", roleAr: "الرئيس التنفيذي", expertiseEn: "20+ years in enterprise IT and business development across the GCC", expertiseAr: "أكثر من 20 عاماً في تقنية المعلومات المؤسسية وتطوير الأعمال عبر الخليج" },
  { name: "سارة المحمود", roleEn: "Chief Technology Officer", roleAr: "رئيسة قسم التقنية", expertiseEn: "AI/ML architecture, cloud infrastructure, and digital transformation", expertiseAr: "هندسة الذكاء الاصطناعي والبنية السحابية والتحول الرقمي" },
  { name: "أحمد الفارسي", roleEn: "Head of Consultancy", roleAr: "رئيس قسم الاستشارات", expertiseEn: "ISO 9001, organizational excellence, and GCC regulatory compliance", expertiseAr: "ISO 9001 والتميز المؤسسي والامتثال التنظيمي في الخليج" },
  { name: "فاطمة الزهراء", roleEn: "Head of ASTRA PM", roleAr: "رئيسة قسم ASTRA PM", expertiseEn: "Project management, construction technology, and PMO establishment", expertiseAr: "إدارة المشاريع وتقنية البناء وتأسيس مكتب إدارة المشاريع" },
  { name: "خالد العتيبي", roleEn: "Head of Cybersecurity", roleAr: "رئيس قسم الأمن السيبراني", expertiseEn: "NCA ECC, SAMA CSF, ISO 27001, and enterprise security architecture", expertiseAr: "NCA ECC وSAMA CSF وISO 27001 وهندسة أمن المؤسسات" },
  { name: "نور الحسن", roleEn: "NEO AI Lead Architect", roleAr: "كبير مهندسي NEO AI", expertiseEn: "LLM orchestration, RAG systems, and enterprise AI integration", expertiseAr: "تنسيق نماذج LLM وأنظمة RAG وتكامل الذكاء الاصطناعي المؤسسي" },
];

const STATS = [
  { value: "15+", labelEn: "Years of Excellence", labelAr: "سنة من التميز" },
  { value: "200+", labelEn: "Projects Delivered", labelAr: "مشروع مُنجز" },
  { value: "50+", labelEn: "Expert Team Members", labelAr: "خبير في الفريق" },
  { value: "3", labelEn: "GCC Countries", labelAr: "دولة خليجية" },
];

export default function About() {
  const [, navigate] = useLocation();
  const { t, lang } = useLanguage();
  const VALUES = VALUES_EN.map(v => ({ icon: v.icon, title: lang === "ar" ? v.titleAr : v.titleEn, desc: lang === "ar" ? v.descAr : v.descEn }));

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
                className={`text-sm tracking-wide transition-colors ${path === "/about" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
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
      <section className="relative pt-16 min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/90 to-[#05080F]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">{t("Home", "الرئيسية")}</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">{t("About Us", "من نحن")}</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs tracking-widest uppercase mb-6">
              <Star className="w-3 h-3" /> {t("Our Story", "قصتنا")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Fifteen Years of", "خمسة عشر عاماً من")}<br /><span className="text-amber-400">{t("Building the Future", "بناء مستقبل")}</span><br />{t("of GCC Enterprise", "مؤسسات الخليج")}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl leading-relaxed">
              {t("Golden Team Trading Services was founded with a singular mission: to help GCC organizations harness the power of technology and strategic thinking to achieve their full potential.", "تأسست شركة الفريق الذهبي بمهمة واحدة: مساعدة منظمات الخليج على تسخير قوة التكنولوجيا والتفكير الاستراتيجي لتحقيق كامل إمكاناتها.")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-white/8 bg-white/2 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, labelEn, labelAr }) => (
              <motion.div key={labelEn} variants={fadeUp}>
                <div className="text-3xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-white/50 text-sm">{t(labelEn, labelAr)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger}
            className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp}>
              <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("Who We Are", "من نحن")}
              </h2>
              <div className="space-y-4 text-white/60 leading-relaxed">
                <p>
                  {t(
                    "Golden Team Trading Services is a Riyadh-headquartered enterprise services company operating across Saudi Arabia, the UAE, and Bahrain. We specialize in three interconnected domains: IT Solutions, Project Management (ASTRA PM), and Strategic Business Consultancy.",
                    "شركة الفريق الذهبي للخدمات التجارية شركة خدمات مؤسسية مقرها الرياض تعمل عبر المملكة العربية السعودية والإمارات والبحرين. نتخصص في ثلاثة مجالات مترابطة: حلول تقنية المعلومات وإدارة المشاريع (ASTRA PM) والاستشارة التجارية الاستراتيجية."
                  )}
                </p>
                <p>
                  {t(
                    "What distinguishes us is our integration of cutting-edge AI technology — specifically our proprietary NEO AI Core platform — into every service we deliver. NEO AI is not a bolt-on feature; it is the intelligence layer that runs through our entire service portfolio, enabling our clients to operate faster, smarter, and with greater confidence.",
                    "ما يميزنا هو دمج تقنية الذكاء الاصطناعي — وتحديداً منصة NEO AI Core الخاصة — في كل خدمة نقدمها. NEO AI ليست ميزة إضافية، بل هي طبقة الذكاء التي تسري عبر محفظتنا الكاملة من الخدمات."
                  )}
                </p>
                <p>
                  {t(
                    "We are ISO 9001:2015 certified and operate under a rigorous quality management framework that ensures every engagement meets the highest standards of delivery, documentation, and client satisfaction.",
                    "نحن حاصلون على شهادة ISO 9001:2015 ونعمل وفق إطار صارم لإدارة الجودة يضمن أن يستوفي كل تعامل أعلى معايير التسليم والتوثيق ورضا العملاء."
                  )}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  { en: "ISO 9001:2015 Certified", ar: "معتمد ISO 9001:2015" },
                  { en: "NCA ECC Compliant", ar: "متوافق NCA ECC" },
                  { en: "Saudi Vision 2030 Aligned", ar: "متوافق رؤية 2030" },
                  { en: "GDPR & PDPL Ready", ar: "جاهز GDPR و PDPL" },
                ].map(({ en, ar }) => (
                  <div key={en} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/20 bg-amber-500/8 text-amber-300 text-xs">
                    <CheckCircle className="w-3 h-3" /> {t(en, ar)}
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, titleEn: "Growth-Focused", titleAr: "موجّه بالنمو", descEn: "Every solution is designed to scale with your business and deliver compounding returns over time.", descAr: "كل حل مصمم ليتوسع مع أعمالك ويحقق عوائد متراكمة عبر الزمن." },
                { icon: Shield, titleEn: "Security-First", titleAr: "الأمن أولاً", descEn: "All our solutions are built with security and compliance as foundational requirements, not afterthoughts.", descAr: "جميع حلولنا مبنية بالأمن والامتثال كمتطلبات أساسية لا كإضافات لاحقة." },
                { icon: Zap, titleEn: "AI-Powered", titleAr: "مدعوم بالذكاء الاصطناعي", descEn: "NEO AI Core is embedded in every service, delivering intelligence and automation at enterprise scale.", descAr: "NEO AI Core مدمج في كل خدمة، يقدم الذكاء والأتمتة على مستوى المؤسسة." },
                { icon: Award, titleEn: "Excellence-Driven", titleAr: "مدفوع بالتميز", descEn: "ISO 9001 certified processes ensure consistent, high-quality delivery across every engagement.", descAr: "عمليات معتمدة ISO 9001 تضمن تسليماً متسقاً وعالي الجودة في كل تعامل." },
              ].map(({ icon: Icon, titleEn, titleAr, descEn, descAr }) => (
                <div key={titleEn} className="p-5 rounded-xl border border-white/8 bg-white/2">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-white font-semibold text-sm mb-1">{t(titleEn, titleAr)}</div>
                  <div className="text-white/40 text-xs leading-relaxed">{t(descEn, descAr)}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Our Core Values", "قيمنا الجوهرية")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t("Six principles that guide every decision, every engagement, and every interaction.", "ستة مبادئ توجّه كل قرار وكل تعامل وكل تفاعل.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}
                className="group p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-amber-500/3 hover:border-amber-400/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Our Journey", "مسيرتنا")}
            </motion.h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent hidden lg:block" />
            <div className="space-y-8">
              {MILESTONES.map(({ year, titleEn, titleAr, descEn, descAr }, i) => (
                <motion.div key={year} variants={fadeUp}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                    <div className="p-6 rounded-2xl border border-white/8 bg-white/2 inline-block text-left">
                      <div className="text-amber-400 font-bold text-sm tracking-widest mb-2">{year}</div>
                      <div className="text-white font-semibold mb-1">{t(titleEn, titleAr)}</div>
                      <div className="text-white/40 text-sm">{t(descEn, descAr)}</div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0 z-10 shadow-lg shadow-amber-500/30">
                    <div className="w-3 h-3 rounded-full bg-[#05080F]" />
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Leadership Team ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Leadership Team", "فريق القيادة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t("Experienced leaders with deep GCC expertise and a shared commitment to client success.", "قادة متمرسون بخبرة خليجية عميقة والتزام مشترك بنجاح العميل.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map(({ name, roleEn, roleAr, expertiseEn, expertiseAr }) => (
              <motion.div key={name} variants={fadeUp}
                className="group p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-amber-500/3 hover:border-amber-400/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mb-4">
                  <span className="text-[#05080F] font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </span>
                </div>
                <div className="text-white font-semibold text-base mb-1">{name}</div>
                <div className="text-amber-400 text-xs font-semibold tracking-wide mb-3">{t(roleEn, roleAr)}</div>
                <div className="text-white/40 text-xs leading-relaxed">{t(expertiseEn, expertiseAr)}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-4xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Ready to Work", "هل أنت مستعد")}<br /><span className="text-amber-400">{t("With Golden Team?", "للعمل مع الفريق الذهبي؟")}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10">
              {t("Let us show you how our integrated approach to IT, project management, and consultancy can transform your organization.", "دعنا نريك كيف يمكن لنهجنا المتكامل في تقنية المعلومات وإدارة المشاريع والاستشارة أن يحوّل منظمتك.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-4 text-sm tracking-wide">
                {t("Get In Touch", "تواصل معنا")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/it-solutions")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                {t("Explore Our Services", "اكتشف خدماتنا")}
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
