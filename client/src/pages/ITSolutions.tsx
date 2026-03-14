/**
 * IT Solutions — Public Service Page
 * Design: "Prestige Dark" — Deep navy/charcoal, gold accents, Space Grotesk + Playfair Display
 * Color: #05080F bg, amber-400 accent, blue-400 tech accent
 * Layout: Full-width hero → service grid → tech stack (logo grid) → process → CTA
 */
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import {
  Server, Shield, Cloud, Code, Network, Database, Cpu, Monitor,
  CheckCircle, ArrowRight, Phone, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const IT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/gt-it-solutions-kBJmggmFapCwtnocCUjwuj.webp";

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

// Brand logos via Simple Icons CDN (svg) — white/light versions on dark bg
// Using https://cdn.simpleicons.org/{slug}/ffffff for white logos
const TECH_STACK = [
  {
    categoryEn: "Cloud",
    categoryAr: "السحابة",
    color: "blue",
    items: [
      { name: "AWS", logo: "https://cdn.simpleicons.org/amazonaws/FF9900" },
      { name: "Azure", logo: "https://cdn.simpleicons.org/microsoftazure/0078D4" },
      { name: "GCP", logo: "https://cdn.simpleicons.org/googlecloud/4285F4" },
      { name: "Alibaba Cloud", logo: "https://cdn.simpleicons.org/alibabacloud/FF6A00" },
    ],
  },
  {
    categoryEn: "Security",
    categoryAr: "الأمن السيبراني",
    color: "red",
    items: [
      { name: "Fortinet", logo: "https://cdn.simpleicons.org/fortinet/EE3124" },
      { name: "Palo Alto", logo: "https://cdn.simpleicons.org/paloaltonetworks/FA582D" },
      { name: "CrowdStrike", logo: "https://cdn.simpleicons.org/crowdstrike/E00/ffffff" },
      { name: "Splunk", logo: "https://cdn.simpleicons.org/splunk/65A637" },
    ],
  },
  {
    categoryEn: "Infrastructure",
    categoryAr: "البنية التحتية",
    color: "green",
    items: [
      { name: "Cisco", logo: "https://cdn.simpleicons.org/cisco/1BA0D7" },
      { name: "HPE", logo: "https://cdn.simpleicons.org/hpe/01A982" },
      { name: "Dell EMC", logo: "https://cdn.simpleicons.org/dell/007DB8" },
      { name: "VMware", logo: "https://cdn.simpleicons.org/vmware/607078" },
    ],
  },
  {
    categoryEn: "Development",
    categoryAr: "التطوير",
    color: "purple",
    items: [
      { name: "React", logo: "https://cdn.simpleicons.org/react/61DAFB" },
      { name: "Node.js", logo: "https://cdn.simpleicons.org/nodedotjs/339933" },
      { name: "Python", logo: "https://cdn.simpleicons.org/python/3776AB" },
      { name: "PostgreSQL", logo: "https://cdn.simpleicons.org/postgresql/4169E1" },
    ],
  },
  {
    categoryEn: "AI & Automation",
    categoryAr: "الذكاء الاصطناعي والأتمتة",
    color: "amber",
    items: [
      { name: "NEO AI", logo: "https://cdn.simpleicons.org/openai/412991" },
      { name: "UiPath", logo: "https://cdn.simpleicons.org/uipath/FA4616" },
      { name: "Power Automate", logo: "https://cdn.simpleicons.org/powerautomate/0066FF" },
      { name: "OpenAI", logo: "https://cdn.simpleicons.org/openai/ffffff" },
    ],
  },
  {
    categoryEn: "Monitoring",
    categoryAr: "المراقبة والرصد",
    color: "cyan",
    items: [
      { name: "Zabbix", logo: "https://cdn.simpleicons.org/zabbix/CC0000" },
      { name: "Grafana", logo: "https://cdn.simpleicons.org/grafana/F46800" },
      { name: "Prometheus", logo: "https://cdn.simpleicons.org/prometheus/E6522C" },
      { name: "PagerDuty", logo: "https://cdn.simpleicons.org/pagerduty/06AC38" },
    ],
  },
];

const colorBorder: Record<string, string> = {
  blue: "border-blue-500/25 hover:border-blue-400/50",
  red: "border-red-500/25 hover:border-red-400/50",
  green: "border-emerald-500/25 hover:border-emerald-400/50",
  purple: "border-purple-500/25 hover:border-purple-400/50",
  amber: "border-amber-500/25 hover:border-amber-400/50",
  cyan: "border-cyan-500/25 hover:border-cyan-400/50",
};

const colorLabel: Record<string, string> = {
  blue: "text-blue-400",
  red: "text-red-400",
  green: "text-emerald-400",
  purple: "text-purple-400",
  amber: "text-amber-400",
  cyan: "text-cyan-400",
};

const SERVICES = [
  {
    icon: Server, color: "blue",
    titleEn: "IT Infrastructure & Data Centers", titleAr: "البنية التحتية لتقنية المعلومات ومراكز البيانات",
    descEn: "Design, deployment, and management of enterprise-grade server infrastructure, storage systems, and data center solutions tailored for GCC regulatory requirements.",
    descAr: "تصميم ونشر وإدارة البنية التحتية للخوادم على مستوى المؤسسات وأنظمة التخزين وحلول مراكز البيانات المصممة لمتطلبات الخليج التنظيمية.",
    featuresEn: ["On-premise & hybrid server setup", "Storage area networks (SAN/NAS)", "Virtualization (VMware, Hyper-V)", "Data center design & cabling"],
    featuresAr: ["إعداد الخوادم المحلية والهجينة", "شبكات التخزين (SAN/NAS)", "الافتراضية (VMware, Hyper-V)", "تصميم مراكز البيانات والتمديدات"],
  },
  {
    icon: Cloud, color: "cyan",
    titleEn: "Cloud Solutions & Migration", titleAr: "حلول السحابة والترحيل",
    descEn: "End-to-end cloud strategy, migration, and managed services across AWS, Azure, and Google Cloud — with full compliance and cost optimization.",
    descAr: "استراتيجية سحابية شاملة وترحيل وخدمات مُدارة عبر AWS وAzure وGoogle Cloud — مع الامتثال الكامل وتحسين التكاليف.",
    featuresEn: ["Cloud readiness assessment", "Lift-and-shift & re-architecture", "Multi-cloud management", "FinOps & cost governance"],
    featuresAr: ["تقييم الجاهزية السحابية", "الترحيل وإعادة الهيكلة", "إدارة السحابة المتعددة", "حوكمة التكاليف FinOps"],
  },
  {
    icon: Shield, color: "red",
    titleEn: "Cybersecurity & Compliance", titleAr: "الأمن السيبراني والامتثال",
    descEn: "Comprehensive security posture management, threat detection, and compliance frameworks aligned with NCA, SAMA, and ISO 27001 standards.",
    descAr: "إدارة شاملة لوضع الأمن واكتشاف التهديدات وأطر الامتثال المتوافقة مع معايير هيئة الاتصالات وساما وISO 27001.",
    featuresEn: ["Vulnerability assessment & pen testing", "SOC monitoring & SIEM", "NCA ECC compliance", "Security awareness training"],
    featuresAr: ["تقييم الثغرات واختبار الاختراق", "مراقبة SOC ونظام SIEM", "الامتثال لـ NCA ECC", "التوعية الأمنية والتدريب"],
  },
  {
    icon: Network, color: "green",
    titleEn: "Network Design & Management", titleAr: "تصميم الشبكات وإدارتها",
    descEn: "Enterprise networking solutions from campus LAN/WAN to SD-WAN and zero-trust network architectures for distributed organizations.",
    descAr: "حلول شبكات مؤسسية من LAN/WAN إلى SD-WAN وهندسات الشبكات عديمة الثقة للمؤسسات الموزعة.",
    featuresEn: ["Cisco, Fortinet, Aruba solutions", "SD-WAN & MPLS", "Wi-Fi 6 enterprise deployment", "Network monitoring & NOC"],
    featuresAr: ["حلول Cisco وFortinet وAruba", "SD-WAN وMPLS", "نشر Wi-Fi 6 المؤسسي", "مراقبة الشبكة ومركز NOC"],
  },
  {
    icon: Code, color: "purple",
    titleEn: "Software Development & Integration", titleAr: "تطوير البرمجيات والتكامل",
    descEn: "Custom enterprise application development, API integrations, and digital transformation projects using modern technology stacks.",
    descAr: "تطوير تطبيقات مؤسسية مخصصة وتكاملات API ومشاريع التحول الرقمي باستخدام أحدث تقنيات البرمجيات.",
    featuresEn: ["Custom ERP/CRM development", "API & middleware integration", "Mobile & web applications", "Legacy system modernization"],
    featuresAr: ["تطوير ERP/CRM مخصص", "تكامل API والبرمجيات الوسيطة", "تطبيقات الجوال والويب", "تحديث الأنظمة القديمة"],
  },
  {
    icon: Cpu, color: "amber",
    titleEn: "AI & Automation Solutions", titleAr: "حلول الذكاء الاصطناعي والأتمتة",
    descEn: "NEO AI Core integration, RPA deployment, and intelligent automation that transforms business processes and decision-making.",
    descAr: "تكامل NEO AI Core ونشر RPA والأتمتة الذكية التي تحوّل العمليات التجارية وصنع القرار.",
    featuresEn: ["NEO AI Core implementation", "Robotic process automation (RPA)", "AI-powered analytics", "Chatbot & virtual assistant development"],
    featuresAr: ["تطبيق NEO AI Core", "أتمتة العمليات الروبوتية RPA", "التحليلات المدعومة بالذكاء الاصطناعي", "تطوير روبوتات المحادثة والمساعد الافتراضي"],
  },
  {
    icon: Database, color: "orange",
    titleEn: "Database Administration & BI", titleAr: "إدارة قواعد البيانات وذكاء الأعمال",
    descEn: "Enterprise database management, data warehousing, and business intelligence solutions that turn raw data into actionable insights.",
    descAr: "إدارة قواعد البيانات المؤسسية ومستودعات البيانات وحلول ذكاء الأعمال التي تحوّل البيانات الخام إلى رؤى قابلة للتنفيذ.",
    featuresEn: ["PostgreSQL, Oracle, MSSQL", "Data warehouse design", "Power BI & Metabase dashboards", "ETL pipeline development"],
    featuresAr: ["PostgreSQL وOracle وMSSQL", "تصميم مستودعات البيانات", "لوحات Power BI وMetabase", "تطوير مسارات ETL"],
  },
  {
    icon: Monitor, color: "teal",
    titleEn: "IT Support & Managed Services", titleAr: "دعم تقنية المعلومات والخدمات المُدارة",
    descEn: "24/7 managed IT services, helpdesk support, and proactive monitoring ensuring maximum uptime and business continuity.",
    descAr: "خدمات تقنية معلومات مُدارة على مدار الساعة ودعم مكتب المساعدة ومراقبة استباقية لضمان أقصى وقت تشغيل واستمرارية الأعمال.",
    featuresEn: ["L1/L2/L3 helpdesk support", "Proactive monitoring & alerting", "SLA-driven service delivery", "Asset lifecycle management"],
    featuresAr: ["دعم مكتب المساعدة L1/L2/L3", "المراقبة الاستباقية والتنبيهات", "تقديم الخدمة وفق SLA", "إدارة دورة حياة الأصول"],
  },
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

const PROCESS = [
  {
    step: "01",
    titleEn: "Discovery & Assessment", titleAr: "الاكتشاف والتقييم",
    descEn: "We conduct a thorough analysis of your current IT landscape, business objectives, and pain points to define the optimal solution.",
    descAr: "نُجري تحليلاً شاملاً لبيئتك التقنية الحالية وأهدافك التجارية ونقاط الألم لتحديد الحل الأمثل.",
  },
  {
    step: "02",
    titleEn: "Solution Architecture", titleAr: "هندسة الحل",
    descEn: "Our architects design a tailored solution blueprint with clear technical specifications, timelines, and investment requirements.",
    descAr: "يصمم مهندسونا مخططاً مخصصاً للحل بمواصفات تقنية واضحة وجداول زمنية ومتطلبات استثمارية.",
  },
  {
    step: "03",
    titleEn: "Implementation", titleAr: "التنفيذ",
    descEn: "Certified engineers execute the deployment with minimal business disruption, following ITIL best practices and change management protocols.",
    descAr: "ينفّذ مهندسونا المعتمدون النشر بأقل تعطّل للأعمال، وفق أفضل ممارسات ITIL وبروتوكولات إدارة التغيير.",
  },
  {
    step: "04",
    titleEn: "Testing & Handover", titleAr: "الاختبار والتسليم",
    descEn: "Rigorous UAT, security testing, and staff training ensure a smooth transition before formal sign-off and knowledge transfer.",
    descAr: "اختبار قبول المستخدم والاختبار الأمني وتدريب الموظفين يضمنون انتقالاً سلساً قبل التسليم الرسمي ونقل المعرفة.",
  },
  {
    step: "05",
    titleEn: "Managed Support", titleAr: "الدعم المُدار",
    descEn: "Ongoing monitoring, maintenance, and optimization through our 24/7 NOC/SOC ensures your IT investment delivers continuous value.",
    descAr: "المراقبة والصيانة والتحسين المستمر عبر مركز NOC/SOC على مدار الساعة يضمن تحقيق قيمة مستدامة من استثمارك التقني.",
  },
];

const STATS = [
  { value: "200+", labelEn: "Projects Delivered", labelAr: "مشروع منجز" },
  { value: "99.9%", labelEn: "Uptime SLA", labelAr: "ضمان وقت التشغيل" },
  { value: "15+", labelEn: "Years Experience", labelAr: "سنة خبرة" },
  { value: "50+", labelEn: "Certified Engineers", labelAr: "مهندس معتمد" },
];

export default function ITSolutions() {
  const [, navigate] = useLocation();
  const { t, lang } = useLanguage();

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
                className={`text-sm tracking-wide transition-colors ${path === "/it-solutions" ? "text-amber-400 font-semibold" : "text-white/60 hover:text-amber-400"}`}>
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
          <img src={IT_IMG} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05080F] via-[#05080F]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05080F] via-transparent to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-2 mb-6">
              <button onClick={() => navigate("/")} className="text-white/40 hover:text-white/70 text-sm transition-colors">{t("Home", "الرئيسية")}</button>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="text-amber-400 text-sm">{t("IT Solutions", "حلول تقنية المعلومات")}</span>
            </motion.div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-300 text-xs tracking-widest uppercase mb-6">
              <Cpu className="w-3 h-3" /> {t("Enterprise IT Services", "خدمات تقنية المعلومات المؤسسية")}
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl font-bold mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Technology That", "تقنية")}<br /><span className="text-amber-400">{t("Drives Your Business", "تدفع أعمالك إلى الأمام")}</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-white/60 text-xl max-w-2xl mb-10 leading-relaxed">
              {t("From infrastructure to AI integration, Golden Team delivers end-to-end IT solutions that modernize operations, strengthen security, and accelerate growth across the GCC.", "من البنية التحتية حتى تكامل الذكاء الاصطناعي، يقدّم الفريق الذهبي حلول تقنية معلومات شاملة تحدّث العمليات وتعزّز الأمن وتُسرّع النمو عبر منطقة الخليج.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-8 py-3 text-sm tracking-wide">
                {t("Request a Consultation", "طلب استشارة")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/about")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-sm">
                {t("Our Certifications", "شهاداتنا")}
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
            {STATS.map(({ value, labelEn, labelAr }) => (
              <motion.div key={labelEn} variants={fadeUp}>
                <div className="text-3xl font-bold text-amber-400 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-white/50 text-sm">{t(labelEn, labelAr)}</div>
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
              {t("Our Services", "خدماتنا")}
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Complete IT Service Portfolio", "محفظة خدمات تقنية المعلومات الشاملة")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg max-w-3xl mx-auto">
              {t("Eight specialized service lines covering every dimension of enterprise IT — from physical infrastructure to intelligent AI systems.", "ثمانية خطوط خدمات متخصصة تغطي كل أبعاد تقنية المعلومات المؤسسية — من البنية التحتية المادية حتى أنظمة الذكاء الاصطناعي.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.05 }} variants={stagger}
            className="grid md:grid-cols-2 gap-6">
            {SERVICES.map(({ icon: Icon, color, titleEn, titleAr, descEn, descAr, featuresEn, featuresAr }) => {
              const c = colorMap[color].split(" ");
              const features = lang === "ar" ? featuresAr : featuresEn;
              return (
                <motion.div key={titleEn} variants={fadeUp}
                  className="group p-7 rounded-2xl border bg-white/2 hover:bg-white/4 transition-all duration-300 border-white/8 hover:border-white/15">
                  <div className="flex items-start gap-5 mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c[0]} ${c[1]} flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>{t(titleEn, titleAr)}</h3>
                      <p className="text-white/50 text-sm leading-relaxed">{t(descEn, descAr)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/40">
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

      {/* ── Technology Partnerships — Logo Grid ── */}
      <section className="py-20 bg-gradient-to-b from-[#080D1A] to-[#05080F]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={stagger} className="text-center mb-14">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("Technology Partnerships", "شراكات تقنية")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t("We work with the world's leading technology vendors to deliver best-in-class solutions.", "نتعاون مع كبرى موردي التقنية عالمياً لتقديم حلول متميزة.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH_STACK.map(({ categoryEn, categoryAr, color, items }) => (
              <motion.div key={categoryEn} variants={fadeUp}
                className={`p-5 rounded-xl border bg-white/2 hover:bg-white/4 transition-all duration-300 ${colorBorder[color]}`}>
                <div className={`text-xs font-bold tracking-widest uppercase mb-4 text-center ${colorLabel[color]}`}>
                  {t(categoryEn, categoryAr)}
                </div>
                <div className="flex flex-col gap-3">
                  {items.map(({ name, logo }) => (
                    <div key={name}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/4 hover:bg-white/8 transition-colors group/item">
                      <img
                        src={logo}
                        alt={name}
                        className="w-5 h-5 object-contain shrink-0 opacity-80 group-hover/item:opacity-100 transition-opacity"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className="text-white/60 text-xs group-hover/item:text-white/90 transition-colors truncate">{name}</span>
                    </div>
                  ))}
                </div>
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
              {t("Our Engagement Process", "منهجية عملنا")}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 max-w-2xl mx-auto">
              {t("A structured, transparent methodology that ensures every project is delivered on time, on budget, and to specification.", "منهجية منظمة وشفافة تضمن تسليم كل مشروع في الوقت وضمن الميزانية ووفق المواصفات.")}
            </motion.p>
          </motion.div>
          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} variants={stagger}
            className="grid md:grid-cols-5 gap-6">
            {PROCESS.map(({ step, titleEn, titleAr, descEn, descAr }, i) => (
              <motion.div key={step} variants={fadeUp} className="relative text-center">
                {i < PROCESS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-amber-400/40 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4 relative z-10">
                  <span className="text-[#05080F] font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>{step}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{t(titleEn, titleAr)}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{t(descEn, descAr)}</p>
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
            <motion.div variants={fadeUp} className="text-white/50 text-sm tracking-widest uppercase">
              {t("Certifications & Compliance", "الشهادات والامتثال")}
            </motion.div>
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
              {t("Ready to Transform", "هل أنت مستعد")}<br /><span className="text-amber-400">{t("Your IT Infrastructure?", "لتحويل بنيتك التقنية؟")}</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/50 text-lg mb-10 max-w-2xl mx-auto">
              {t("Schedule a free discovery session with our senior architects and receive a tailored IT roadmap within 5 business days.", "جدول جلسة اكتشاف مجانية مع كبار مهندسينا واحصل على خارطة طريق تقنية مخصصة خلال 5 أيام عمل.")}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate("/contact")}
                className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-bold px-10 py-4 text-sm tracking-wide">
                {t("Schedule Free Discovery", "جدول جلسة اكتشاف مجانية")} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => navigate("/contact")} variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent px-10 py-4 text-sm">
                <Phone className="w-4 h-4 mr-2" /> {t("Call Us Now", "اتصل بنا الآن")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#05080F] py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-sm">{t("© 2026 Golden Team Trading Services. All rights reserved.", "© 2026 شركة الفريق الذهبي للخدمات التجارية. جميع الحقوق محفوظة.")}</div>
          <div className="flex gap-6 flex-wrap justify-center">
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
