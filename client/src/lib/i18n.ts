/**
 * Golden Team Trading Services — Bilingual i18n System
 * Arabic/English — Semantic trade and business language
 * NOT literal translation — uses authentic Gulf business Arabic terminology
 *
 * Arabic conventions used:
 * - "الفريق الذهبي" = Golden Team (brand name, kept as-is in Arabic script)
 * - "منظومة" = platform/system (not "نظام" which is too generic)
 * - "بوابة" = portal (not "بوابة إلكترونية" — trade shorthand)
 * - "حوكمة" = governance (ISO/corporate standard Arabic)
 * - "تنفيذ" = execution/operations (trade context)
 * - "مناقصة" = tender/procurement (Gulf trade standard)
 * - "عقد" = contract (legal/trade)
 * - "موافقة" = approval (corporate Arabic)
 * - "رفض" = rejection/denial (corporate Arabic)
 * - "تصعيد" = escalation (management Arabic)
 * - "مصفوفة الصلاحيات" = Authority Matrix (direct ISO standard Arabic)
 * - "سجل القرارات" = Decision Log (audit Arabic)
 */

export type Lang = "en" | "ar";

export const translations = {
  // ─── Global / Shared ───────────────────────────────────────────────
  global: {
    en: {
      appName: "Golden Team Trading Services",
      appShort: "Golden Team",
      tagline: "Enterprise Technology · Powered by AI",
      employeePortal: "Employee Portal",
      login: "Sign In",
      logout: "Sign Out",
      loading: "Loading…",
      save: "Save",
      cancel: "Cancel",
      confirm: "Confirm",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      export: "Export",
      publish: "Publish",
      close: "Close",
      back: "Back",
      next: "Next",
      submit: "Submit",
      reset: "Reset",
      yes: "Yes",
      no: "No",
      status: "Status",
      date: "Date",
      time: "Time",
      name: "Name",
      role: "Role",
      department: "Department",
      action: "Action",
      result: "Result",
      details: "Details",
      notes: "Notes",
      required: "Required",
      optional: "Optional",
      comingSoon: "Feature coming soon",
      noData: "No data available",
      error: "An error occurred",
      success: "Operation successful",
    },
    ar: {
      appName: "الفريق الذهبي للخدمات التجارية",
      appShort: "الفريق الذهبي",
      tagline: "تقنية المؤسسات · مدعومة بالذكاء الاصطناعي",
      employeePortal: "بوابة الموظفين",
      login: "تسجيل الدخول",
      logout: "تسجيل الخروج",
      loading: "جارٍ التحميل…",
      save: "حفظ",
      cancel: "إلغاء",
      confirm: "تأكيد",
      delete: "حذف",
      edit: "تعديل",
      add: "إضافة",
      search: "بحث",
      filter: "تصفية",
      export: "تصدير",
      publish: "نشر",
      close: "إغلاق",
      back: "رجوع",
      next: "التالي",
      submit: "إرسال",
      reset: "إعادة تعيين",
      yes: "نعم",
      no: "لا",
      status: "الحالة",
      date: "التاريخ",
      time: "الوقت",
      name: "الاسم",
      role: "المنصب",
      department: "الإدارة",
      action: "الإجراء",
      result: "النتيجة",
      details: "التفاصيل",
      notes: "ملاحظات",
      required: "إلزامي",
      optional: "اختياري",
      comingSoon: "الميزة قيد التطوير",
      noData: "لا توجد بيانات",
      error: "حدث خطأ",
      success: "تمّت العملية بنجاح",
    },
  },

  // ─── Public Landing Page ────────────────────────────────────────────
  landing: {
    en: {
      nav: {
        itSolutions: "IT Solutions",
        astraPm: "ASTRA PM",
        consultancy: "Consultancy",
        about: "About",
        contact: "Contact",
      },
      hero: {
        badge: "AI-Powered Enterprise Solutions",
        headline1: "Enterprise Technology",
        headline2: "Powered by AI",
        sub: "Administrative & Business Development · IT Solutions · ASTRA PM Project Management",
        body: "Empowering organizations with enterprise-grade technology, intelligent AI systems, and strategic consultancy to drive sustainable growth.",
        ctaPrimary: "Explore Our Services",
        ctaSecondary: "Get In Touch",
      },
      stats: [
        { value: "15+", label: "Years Experience" },
        { value: "200+", label: "Projects Delivered" },
        { value: "50+", label: "Enterprise Clients" },
        { value: "ISO 9001", label: "Certified Quality" },
      ],
      itSection: {
        badge: "IT Solutions",
        headline1: "Enterprise Technology",
        headline2: "That Scales With You",
        body: "From cloud infrastructure and cybersecurity to custom software and AI-powered automation, Golden Team delivers end-to-end IT solutions that modernize your operations and protect your business.",
        ctaPrimary: "IT Solutions Overview",
        ctaSecondary: "Request Assessment",
      },
      itServices: [
        { title: "Cloud Infrastructure", desc: "AWS, Azure, and hybrid cloud architecture design, migration, and managed operations." },
        { title: "Cybersecurity", desc: "End-to-end security audits, penetration testing, SOC monitoring, and compliance frameworks." },
        { title: "Network Solutions", desc: "Enterprise networking, SD-WAN, VPN infrastructure, and 24/7 NOC support." },
        { title: "Custom Software", desc: "Bespoke enterprise applications, API integrations, and digital transformation programs." },
        { title: "IT Managed Services", desc: "Full-spectrum IT outsourcing — helpdesk, infrastructure, and proactive monitoring." },
        { title: "AI & Automation", desc: "NEO AI-powered business automation, RPA, and intelligent process optimization." },
      ],
      astraSection: {
        badge: "ASTRA PM",
        headline1: "Intelligent Project",
        headline2: "Management Platform",
        body: "ASTRA PM is Golden Team's flagship project management platform — a comprehensive solution designed for enterprise project delivery. Built with PMBOK methodology, AI-powered insights, and the ASTRA AMG governance framework.",
        ctaPrimary: "Explore ASTRA PM",
        ctaSecondary: "Request Demo",
        liveBadge: "ASTRA PM — Live Platform",
        features: [
          { label: "ISO 9001", sublabel: "Quality Gates" },
          { label: "NEO AI", sublabel: "Smart Insights" },
          { label: "ASTRA AMG", sublabel: "Governance" },
          { label: "Real-Time", sublabel: "Analytics" },
        ],
      },
      astraFeatures: [
        { title: "Project Lifecycle", desc: "Full project lifecycle management from initiation to closeout with PMBOK-aligned workflows." },
        { title: "Real-Time Analytics", desc: "Live dashboards for budget, schedule, resource, and risk performance indicators." },
        { title: "Resource Management", desc: "Intelligent resource allocation, capacity planning, and team performance tracking." },
        { title: "Gantt & Scheduling", desc: "Interactive Gantt charts with critical path analysis and milestone tracking." },
        { title: "Quality Assurance", desc: "Built-in ISO 9001 quality gates, inspection checklists, and non-conformance management." },
        { title: "ASTRA AMG Governance", desc: "Enterprise governance layer with audit trails, approval workflows, and compliance monitoring." },
      ],
      consultSection: {
        badge: "Business Consultancy",
        headline1: "Strategic Advisory for",
        headline2: "Sustainable Growth",
        body: "Our consultancy practice combines deep regional expertise with international best practices to help organizations navigate complexity, optimize operations, and achieve their strategic ambitions.",
        ctaPrimary: "Consultancy Services",
        ctaSecondary: "Schedule Consultation",
      },
      consultServices: [
        { title: "Business Development", desc: "Market entry strategy, growth planning, and business model innovation for regional expansion." },
        { title: "Administrative Excellence", desc: "Organizational design, process optimization, and operational efficiency programs." },
        { title: "ISO 9001 Certification", desc: "End-to-end ISO 9001:2015 implementation, gap analysis, and certification support." },
        { title: "International Trade", desc: "Import/export facilitation, trade compliance, and cross-border business advisory." },
        { title: "Corporate Governance", desc: "Board advisory, governance frameworks, and regulatory compliance consulting." },
        { title: "Strategic Planning", desc: "C-suite advisory, strategic roadmaps, and transformation program management." },
      ],
      about: {
        badge: "Why Golden Team",
        headline1: "One Partner for Your",
        headline2: "Entire Enterprise Journey",
        body: "Golden Team uniquely combines IT infrastructure, AI-powered platforms, and strategic consultancy under one roof — delivering integrated solutions that create real business value.",
        pillars: [
          { icon: "🏆", title: "Proven Excellence", desc: "15+ years delivering enterprise solutions across the GCC region with measurable outcomes and client satisfaction." },
          { icon: "🤖", title: "AI-First Approach", desc: "NEO AI Core integration across all services ensures intelligent automation and data-driven decision making." },
          { icon: "🛡️", title: "ISO 9001 Quality", desc: "Every engagement is governed by our ISO 9001:2015 certified quality management system for consistent excellence." },
        ],
      },
      testimonials: [
        { name: "Ahmed Al-Rashidi", role: "CEO, Al-Rashidi Group", text: "Golden Team transformed our entire IT infrastructure and delivered ASTRA PM which now manages all our construction projects. Exceptional quality and professionalism." },
        { name: "Sara Mohammed", role: "COO, Gulf Ventures", text: "Their business consultancy team helped us achieve ISO 9001 certification in record time. The strategic advisory was invaluable for our regional expansion." },
        { name: "Khalid Al-Mansouri", role: "Director, Mansouri Holdings", text: "The NEO AI integration through their IT solutions division has automated 70% of our administrative processes. Truly transformative technology." },
      ],
      cta: {
        headline1: "Ready to Transform",
        headline2: "Your Enterprise?",
        body: "Let's discuss how Golden Team can accelerate your business with cutting-edge IT, intelligent AI, and strategic advisory.",
        ctaPrimary: "Start a Conversation",
        ctaSecondary: "Employee Portal Login",
      },
      contact: {
        headline: "Get In Touch",
        sub: "Our team is ready to help you achieve your business goals.",
        cards: [
          { label: "Phone", value: "+966 XX XXX XXXX", sub: "Sun–Thu, 8am–6pm" },
          { label: "Email", value: "info@goldenteam.sa", sub: "Response within 24 hours" },
          { label: "Office", value: "Riyadh, Saudi Arabia", sub: "GCC Region Coverage" },
        ],
      },
      footer: {
        tagline: "Administrative & Business Development Services · IT Solutions · ASTRA PM Project Management Platform",
        servicesTitle: "Services",
        companyTitle: "Company",
        services: [
          { label: "IT Solutions" },
          { label: "ASTRA PM" },
          { label: "Business Consultancy" },
          { label: "ISO 9001 Advisory" },
          { label: "AI Integration" },
        ],
        company: [
          { label: "About Us" },
          { label: "Our Team" },
          { label: "Careers" },
          { label: "Contact" },
          { label: "Employee Portal" },
        ],
        copyright: "© 2026 Golden Team Trading Services. All rights reserved.",
        certLine: "ISO 9001:2015 Certified · Powered by NEO AI",
      },
    },
    ar: {
      nav: {
        itSolutions: "حلول تقنية المعلومات",
        astraPm: "منظومة أسترا",
        consultancy: "الاستشارات",
        about: "عن الشركة",
        contact: "تواصل معنا",
      },
      hero: {
        badge: "حلول المؤسسات المدعومة بالذكاء الاصطناعي",
        headline1: "تقنية المؤسسات",
        headline2: "مدعومة بالذكاء الاصطناعي",
        sub: "خدمات التطوير الإداري والأعمال · حلول تقنية المعلومات · إدارة المشاريع بمنظومة أسترا",
        body: "نُمكّن المؤسسات بتقنيات المستوى المؤسسي وأنظمة الذكاء الاصطناعي والاستشارات الاستراتيجية لتحقيق نمو مستدام.",
        ctaPrimary: "استكشف خدماتنا",
        ctaSecondary: "تواصل معنا",
      },
      stats: [
        { value: "+15", label: "عامًا من الخبرة" },
        { value: "+200", label: "مشروع منجز" },
        { value: "+50", label: "عميل مؤسسي" },
        { value: "ISO 9001", label: "جودة معتمدة" },
      ],
      itSection: {
        badge: "حلول تقنية المعلومات",
        headline1: "تقنية مؤسسية",
        headline2: "تنمو معك",
        body: "من البنية التحتية السحابية والأمن السيبراني إلى البرمجيات المخصصة والأتمتة الذكية، يقدّم الفريق الذهبي حلول تقنية متكاملة تُحدّث عملياتك وتحمي أعمالك.",
        ctaPrimary: "نظرة عامة على الحلول التقنية",
        ctaSecondary: "طلب تقييم",
      },
      itServices: [
        { title: "البنية التحتية السحابية", desc: "تصميم وترحيل وإدارة البنية السحابية على AWS وAzure والبيئات الهجينة." },
        { title: "الأمن السيبراني", desc: "تدقيق أمني شامل واختبار اختراق ومراقبة مركز العمليات الأمنية وأطر الامتثال." },
        { title: "حلول الشبكات", desc: "شبكات مؤسسية وSD-WAN وبنية VPN ودعم مركز عمليات الشبكة على مدار الساعة." },
        { title: "البرمجيات المخصصة", desc: "تطبيقات مؤسسية مصممة خصيصًا وتكاملات API وبرامج التحول الرقمي." },
        { title: "الخدمات التقنية المُدارة", desc: "تعهيد تقني متكامل — مكتب المساعدة والبنية التحتية والمراقبة الاستباقية." },
        { title: "الذكاء الاصطناعي والأتمتة", desc: "أتمتة الأعمال بمحرك NEO الذكي وأتمتة العمليات الروبوتية وتحسين العمليات." },
      ],
      astraSection: {
        badge: "منظومة أسترا",
        headline1: "منصة إدارة مشاريع",
        headline2: "ذكية ومتكاملة",
        body: "منظومة أسترا هي المنصة الرائدة للفريق الذهبي في إدارة المشاريع — حل مؤسسي شامل مبني على منهجية PMBOK ورؤى الذكاء الاصطناعي وإطار حوكمة أسترا AMG.",
        ctaPrimary: "استكشف منظومة أسترا",
        ctaSecondary: "طلب عرض تجريبي",
        liveBadge: "منظومة أسترا — منصة مباشرة",
        features: [
          { label: "ISO 9001", sublabel: "بوابات الجودة" },
          { label: "NEO AI", sublabel: "رؤى ذكية" },
          { label: "ASTRA AMG", sublabel: "الحوكمة" },
          { label: "لحظي", sublabel: "تحليلات فورية" },
        ],
      },
      astraFeatures: [
        { title: "دورة حياة المشروع", desc: "إدارة متكاملة لدورة حياة المشروع من التأسيس حتى الإغلاق وفق منهجية PMBOK." },
        { title: "تحليلات فورية", desc: "لوحات معلومات حية لمؤشرات الميزانية والجدول الزمني والموارد والمخاطر." },
        { title: "إدارة الموارد", desc: "توزيع ذكي للموارد وتخطيط الطاقة الاستيعابية وتتبع أداء الفريق." },
        { title: "مخطط غانت والجدولة", desc: "مخططات غانت تفاعلية مع تحليل المسار الحرج وتتبع المعالم الرئيسية." },
        { title: "ضمان الجودة", desc: "بوابات جودة ISO 9001 مدمجة وقوائم تفتيش وإدارة عدم المطابقة." },
        { title: "حوكمة أسترا AMG", desc: "طبقة حوكمة مؤسسية بمسارات تدقيق وسير عمل الموافقات ومراقبة الامتثال." },
      ],
      consultSection: {
        badge: "الاستشارات التجارية",
        headline1: "استشارات استراتيجية",
        headline2: "لنمو مستدام",
        body: "تجمع ممارستنا الاستشارية بين الخبرة الإقليمية العميقة وأفضل الممارسات الدولية لمساعدة المؤسسات على التعامل مع التعقيد وتحسين العمليات وتحقيق طموحاتها الاستراتيجية.",
        ctaPrimary: "الخدمات الاستشارية",
        ctaSecondary: "جدولة استشارة",
      },
      consultServices: [
        { title: "تطوير الأعمال", desc: "استراتيجية دخول السوق وتخطيط النمو وابتكار نماذج الأعمال للتوسع الإقليمي." },
        { title: "التميز الإداري", desc: "التصميم التنظيمي وتحسين العمليات وبرامج الكفاءة التشغيلية." },
        { title: "اعتماد ISO 9001", desc: "تطبيق متكامل لـ ISO 9001:2015 وتحليل الفجوات ودعم الاعتماد." },
        { title: "التجارة الدولية", desc: "تيسير الاستيراد والتصدير والامتثال التجاري والاستشارات العابرة للحدود." },
        { title: "حوكمة الشركات", desc: "استشارات مجلس الإدارة وأطر الحوكمة والاستشارات التنظيمية." },
        { title: "التخطيط الاستراتيجي", desc: "استشارات الإدارة العليا وخرائط الطريق الاستراتيجية وإدارة برامج التحول." },
      ],
      about: {
        badge: "لماذا الفريق الذهبي؟",
        headline1: "شريك واحد لرحلتك",
        headline2: "المؤسسية بالكامل",
        body: "يجمع الفريق الذهبي بشكل فريد بين البنية التحتية التقنية والمنصات الذكية والاستشارات الاستراتيجية تحت سقف واحد — لتقديم حلول متكاملة تخلق قيمة تجارية حقيقية.",
        pillars: [
          { icon: "🏆", title: "التميز الموثوق", desc: "أكثر من 15 عامًا في تقديم حلول مؤسسية عبر منطقة الخليج بنتائج قابلة للقياس ورضا العملاء." },
          { icon: "🤖", title: "نهج الذكاء الاصطناعي أولًا", desc: "تكامل محرك NEO الذكي عبر جميع الخدمات يضمن الأتمتة الذكية واتخاذ القرارات المبنية على البيانات." },
          { icon: "🛡️", title: "جودة ISO 9001", desc: "كل تعاون يخضع لنظام إدارة الجودة المعتمد بـ ISO 9001:2015 لضمان التميز المستمر." },
        ],
      },
      testimonials: [
        { name: "أحمد الراشدي", role: "الرئيس التنفيذي، مجموعة الراشدي", text: "حوّل الفريق الذهبي بنيتنا التحتية التقنية بالكامل وسلّم منظومة أسترا التي تدير الآن جميع مشاريعنا الإنشائية. جودة واحترافية استثنائية." },
        { name: "سارة محمد", role: "المدير التنفيذي للعمليات، مشاريع الخليج", text: "ساعدنا فريق الاستشارات في تحقيق اعتماد ISO 9001 في وقت قياسي. كانت الاستشارات الاستراتيجية لا تقدر بثمن لتوسعنا الإقليمي." },
        { name: "خالد المنصوري", role: "مدير، قابضة المنصوري", text: "أتمت تكامل الذكاء الاصطناعي عبر قسم حلولنا التقنية 70% من عملياتنا الإدارية. تقنية تحويلية حقًا." },
      ],
      cta: {
        headline1: "هل أنت مستعد لتحويل",
        headline2: "مؤسستك؟",
        body: "دعنا نناقش كيف يمكن للفريق الذهبي تسريع أعمالك بتقنية متطورة وذكاء اصطناعي واستشارات استراتيجية.",
        ctaPrimary: "ابدأ محادثة",
        ctaSecondary: "دخول بوابة الموظفين",
      },
      contact: {
        headline: "تواصل معنا",
        sub: "فريقنا جاهز لمساعدتك في تحقيق أهدافك التجارية.",
        cards: [
          { label: "الهاتف", value: "+966 XX XXX XXXX", sub: "الأحد–الخميس، 8ص–6م" },
          { label: "البريد الإلكتروني", value: "info@goldenteam.sa", sub: "الرد خلال 24 ساعة" },
          { label: "المكتب", value: "الرياض، المملكة العربية السعودية", sub: "تغطية منطقة الخليج" },
        ],
      },
      footer: {
        tagline: "خدمات التطوير الإداري والأعمال · حلول تقنية المعلومات · منصة إدارة مشاريع أسترا",
        servicesTitle: "الخدمات",
        companyTitle: "الشركة",
        services: [
          { label: "حلول تقنية المعلومات" },
          { label: "منظومة أسترا" },
          { label: "الاستشارات التجارية" },
          { label: "استشارات ISO 9001" },
          { label: "تكامل الذكاء الاصطناعي" },
        ],
        company: [
          { label: "عن الشركة" },
          { label: "فريقنا" },
          { label: "الوظائف" },
          { label: "تواصل معنا" },
          { label: "بوابة الموظفين" },
        ],
        copyright: "© 2026 الفريق الذهبي للخدمات التجارية. جميع الحقوق محفوظة.",
        certLine: "معتمد ISO 9001:2015 · مدعوم بمحرك NEO الذكي",
      },
    },
  },

  // ─── Employee Portal ────────────────────────────────────────────────
  portal: {
    en: {
      title: "Employee Portal",
      welcome: "Welcome back",
      sidebar: {
        dashboard: "Dashboard",
        neo: "NEO AI Core",
        projects: "Projects",
        governance: "AMG Governance",
        authorityMatrix: "Authority Matrix",
        hrModule: "HR Module",
        finance: "Finance",
        procurement: "Procurement",
        documents: "Documents",
        driveVault: "Drive Vault",
        reports: "Reports",
        settings: "Settings",
        adminPanel: "Admin Panel",
      },
      neo: {
        title: "NEO AI Core",
        subtitle: "Intelligent Transaction Engine",
        placeholder: "Describe your request or transaction…",
        send: "Send",
        thinking: "NEO is processing…",
        stages: {
          intake: "Request Intake",
          classification: "Classification",
          validation: "Validation",
          amgCheck: "AMG Governance Check",
          execution: "Execution",
        },
        amgResult: {
          allow: "Approved",
          deny: "Rejected",
          escalate: "Escalated for Review",
        },
      },
    },
    ar: {
      title: "بوابة الموظفين",
      welcome: "مرحبًا بعودتك",
      sidebar: {
        dashboard: "لوحة التحكم",
        neo: "محرك NEO الذكي",
        projects: "المشاريع",
        governance: "حوكمة AMG",
        authorityMatrix: "مصفوفة الصلاحيات",
        hrModule: "الموارد البشرية",
        finance: "المالية",
        procurement: "المشتريات",
        documents: "الوثائق",
        driveVault: "خزينة الملفات",
        reports: "التقارير",
        settings: "الإعدادات",
        adminPanel: "لوحة الإدارة",
      },
      neo: {
        title: "محرك NEO الذكي",
        subtitle: "محرك المعاملات الذكي",
        placeholder: "صِف طلبك أو معاملتك…",
        send: "إرسال",
        thinking: "NEO يعالج طلبك…",
        stages: {
          intake: "استقبال الطلب",
          classification: "التصنيف",
          validation: "التحقق",
          amgCheck: "فحص حوكمة AMG",
          execution: "التنفيذ",
        },
        amgResult: {
          allow: "موافق عليه",
          deny: "مرفوض",
          escalate: "مُحال للمراجعة",
        },
      },
    },
  },

  // ─── ASTRA AMG Governance ───────────────────────────────────────────
  governance: {
    en: {
      title: "ASTRA AMG Governance",
      subtitle: "Authority Matrix Governance Engine",
      liveCheck: {
        title: "Live Authority Check",
        role: "Role",
        domain: "Domain",
        action: "Action",
        amount: "Amount (SAR)",
        runCheck: "Run Check",
        running: "Checking…",
        result: "Decision",
        decisionId: "Decision ID",
        policyVersion: "Policy Version",
        latency: "Latency",
        reasonCode: "Reason Code",
      },
      decisionLog: {
        title: "Decision Log",
        clearLog: "Clear Log",
        noDecisions: "No decisions recorded yet.",
        outcome: {
          ALLOW: "Approved",
          DENY: "Rejected",
          ESCALATE: "Escalated",
        },
      },
      policyPack: {
        title: "Policy Pack",
        domain: "Domain",
        actions: "Permitted Actions",
        roles: "Authorized Roles",
        maxAmount: "Max Amount",
        noLimit: "No limit",
        requiresDual: "Dual approval required",
        requiresBoard: "Board approval required",
      },
      authorityMatrix: {
        title: "Authority Matrix",
        subtitle: "Manage roles, domains, and approval thresholds",
        publishChanges: "Publish Changes",
        addRole: "Add Role",
        addRule: "Add Rule",
        editRole: "Edit Role",
        editRule: "Edit Rule",
        deleteRole: "Delete Role",
        roleName: "Role Name",
        level: "Authority Level",
        maxApproval: "Max Approval (SAR)",
        domains: "Domains",
        tabs: {
          matrix: "Authority Matrix",
          roles: "Roles",
          policies: "Policies",
        },
      },
    },
    ar: {
      title: "حوكمة أسترا AMG",
      subtitle: "محرك حوكمة مصفوفة الصلاحيات",
      liveCheck: {
        title: "فحص الصلاحية الفوري",
        role: "المنصب",
        domain: "النطاق",
        action: "الإجراء",
        amount: "المبلغ (ريال)",
        runCheck: "تشغيل الفحص",
        running: "جارٍ الفحص…",
        result: "القرار",
        decisionId: "رقم القرار",
        policyVersion: "إصدار السياسة",
        latency: "زمن الاستجابة",
        reasonCode: "رمز السبب",
      },
      decisionLog: {
        title: "سجل القرارات",
        clearLog: "مسح السجل",
        noDecisions: "لا توجد قرارات مسجلة بعد.",
        outcome: {
          ALLOW: "موافق عليه",
          DENY: "مرفوض",
          ESCALATE: "مُحال للمراجعة",
        },
      },
      policyPack: {
        title: "حزمة السياسات",
        domain: "النطاق",
        actions: "الإجراءات المسموح بها",
        roles: "الأدوار المخوّلة",
        maxAmount: "الحد الأقصى للمبلغ",
        noLimit: "بلا حد",
        requiresDual: "يستلزم موافقة مزدوجة",
        requiresBoard: "يستلزم موافقة مجلس الإدارة",
      },
      authorityMatrix: {
        title: "مصفوفة الصلاحيات",
        subtitle: "إدارة المناصب والنطاقات وحدود الموافقة",
        publishChanges: "نشر التغييرات",
        addRole: "إضافة منصب",
        addRule: "إضافة قاعدة",
        editRole: "تعديل المنصب",
        editRule: "تعديل القاعدة",
        deleteRole: "حذف المنصب",
        roleName: "اسم المنصب",
        level: "مستوى الصلاحية",
        maxApproval: "الحد الأقصى للموافقة (ريال)",
        domains: "النطاقات",
        tabs: {
          matrix: "مصفوفة الصلاحيات",
          roles: "المناصب",
          policies: "السياسات",
        },
      },
    },
  },

  // ─── ASTRA Engine — Domains & Actions ──────────────────────────────
  astraDomains: {
    en: {
      procurement: "Procurement",
      hr: "Human Resources",
      finance: "Finance",
      legal: "Legal & Compliance",
      qms: "Quality Management",
      it: "Information Technology",
      governance: "Corporate Governance",
      interview: "Interview & Assessment",
      watcher: "System Watcher",
      demo: "Demo Scenarios",
    },
    ar: {
      procurement: "المشتريات",
      hr: "الموارد البشرية",
      finance: "الشؤون المالية",
      legal: "الشؤون القانونية والامتثال",
      qms: "إدارة الجودة",
      it: "تقنية المعلومات",
      governance: "حوكمة الشركات",
      interview: "المقابلات والتقييم",
      watcher: "مراقب النظام",
      demo: "سيناريوهات تجريبية",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations;

/**
 * Get translation for a given section and language.
 * Usage: t("landing", lang).hero.headline1
 */
export function t<K extends TranslationKey>(
  section: K,
  lang: Lang
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return (translations[section] as any)[lang];
}

/**
 * Format a number in locale-appropriate style.
 * Arabic uses Eastern Arabic numerals in some contexts but we keep Western
 * numerals for financial data per Gulf trade standard.
 */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US").format(value);
}

/**
 * Format a currency amount in SAR.
 */
export function formatSAR(value: number, lang: Lang): string {
  if (lang === "ar") return `${value.toLocaleString("en-US")} ريال`;
  return `SAR ${value.toLocaleString("en-US")}`;
}
