/**
 * Demo Data Seed Script — Golden Team Trading Services
 *
 * Populates all 7 module tables with realistic Saudi Arabia business data.
 * Safe to run multiple times — checks for existing data before inserting.
 *
 * Usage: node scripts/seed-demo-data.mjs
 *
 * Tables seeded:
 *   hr_employees (12 records)
 *   kpi_targets (10 records)
 *   procurement_items (10 records)
 *   qms_incidents (8 records)
 *   erp_records (10 records)
 *   crm_contacts (10 records)
 *   legal_cases (8 records)
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

// ─── Parse DATABASE_URL ────────────────────────────────────────────────────────
function parseDbUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port || "3306"),
    user: u.username,
    password: u.password,
    database: u.pathname.replace(/^\//, ""),
    ssl: u.searchParams.get("ssl") === "true" ? { rejectUnauthorized: false } : undefined,
  };
}

async function seed() {
  const conn = await mysql.createConnection({ ...parseDbUrl(DB_URL), ssl: { rejectUnauthorized: false } });
  console.log("✅ Connected to database");

  // ── HR Employees ──────────────────────────────────────────────────────────────
  const [hrCount] = await conn.execute("SELECT COUNT(*) as c FROM hr_employees");
  if (hrCount[0].c === 0) {
    console.log("🌱 Seeding hr_employees...");
    const employees = [
      ["EMP-001", "Ahmed Al-Rashidi", "أحمد الراشدي", "General Manager", "Management", "ahmed.rashidi@goldenteam.sa", "+966501234567", "Saudi", "full_time", "2020-01-15", 25000, "active"],
      ["EMP-002", "Sara Mohammed Al-Qahtani", "سارة محمد القحطاني", "HR Manager", "Human Resources", "sara.qahtani@goldenteam.sa", "+966502345678", "Saudi", "full_time", "2020-03-01", 18000, "active"],
      ["EMP-003", "Khalid Ibrahim Al-Mansouri", "خالد إبراهيم المنصوري", "IT Director", "Information Technology", "khalid.mansouri@goldenteam.sa", "+966503456789", "Saudi", "full_time", "2019-06-01", 22000, "active"],
      ["EMP-004", "Fatima Yusuf Al-Zahrani", "فاطمة يوسف الزهراني", "Finance Manager", "Finance", "fatima.zahrani@goldenteam.sa", "+966504567890", "Saudi", "full_time", "2021-02-15", 20000, "active"],
      ["EMP-005", "Mohammed Saleh Al-Otaibi", "محمد صالح العتيبي", "Project Manager", "Projects", "mohammed.otaibi@goldenteam.sa", "+966505678901", "Saudi", "full_time", "2021-09-01", 17000, "active"],
      ["EMP-006", "Nora Abdullah Al-Shehri", "نورة عبدالله الشهري", "QMS Officer", "Quality", "nora.shehri@goldenteam.sa", "+966506789012", "Saudi", "full_time", "2022-01-10", 14000, "active"],
      ["EMP-007", "Abdelrahman Ibrahim Ragab", "عبدالرحمن إبراهيم رجب", "AI Systems Engineer", "Information Technology", "abdelrahman@goldenteam.sa", "+966507890123", "Egyptian", "full_time", "2023-03-01", 19000, "active"],
      ["EMP-008", "Tariq Hassan Al-Ghamdi", "طارق حسن الغامدي", "Procurement Officer", "Procurement", "tariq.ghamdi@goldenteam.sa", "+966508901234", "Saudi", "full_time", "2022-06-01", 13000, "active"],
      ["EMP-009", "Reem Faisal Al-Dosari", "ريم فيصل الدوسري", "Legal Counsel", "Legal", "reem.dosari@goldenteam.sa", "+966509012345", "Saudi", "full_time", "2021-11-01", 21000, "active"],
      ["EMP-010", "Omar Saad Al-Harbi", "عمر سعد الحربي", "Sales Manager", "Sales & CRM", "omar.harbi@goldenteam.sa", "+966510123456", "Saudi", "full_time", "2020-08-01", 16000, "active"],
      ["EMP-011", "Hana Majed Al-Subaie", "هناء ماجد السبيعي", "Administrative Assistant", "Administration", "hana.subaie@goldenteam.sa", "+966511234567", "Saudi", "full_time", "2023-01-15", 10000, "on_leave"],
      ["EMP-012", "Yusuf Nasser Al-Tamimi", "يوسف ناصر التميمي", "IT Support Engineer", "Information Technology", "yusuf.tamimi@goldenteam.sa", "+966512345678", "Saudi", "contract", "2024-01-01", 12000, "active"],
    ];
    for (const e of employees) {
      await conn.execute(
        `INSERT INTO hr_employees (employeeId, fullName, fullNameAr, jobTitle, department, email, phone, nationality, contractType, startDate, salary, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        e
      );
    }
    console.log(`  ✓ Inserted ${employees.length} employees`);
  } else {
    console.log(`  ⏭  hr_employees already has data (${hrCount[0].c} rows)`);
  }

  // ── KPI Targets ───────────────────────────────────────────────────────────────
  const [kpiCount] = await conn.execute("SELECT COUNT(*) as c FROM kpi_targets");
  if (kpiCount[0].c === 0) {
    console.log("🌱 Seeding kpi_targets...");
    const kpis = [
      ["KPI-001", "Revenue Growth Rate", "معدل نمو الإيرادات", "Financial", "%", "15", "12.3", "Q1-2026", "Fatima Al-Zahrani", "at_risk"],
      ["KPI-002", "Customer Satisfaction Score", "مؤشر رضا العملاء", "Customer", "Score/100", "90", "87", "Q1-2026", "Omar Al-Harbi", "on_track"],
      ["KPI-003", "Project Delivery On-Time Rate", "معدل التسليم في الموعد", "Operations", "%", "95", "96.5", "Q1-2026", "Mohammed Al-Otaibi", "achieved"],
      ["KPI-004", "Employee Retention Rate", "معدل الاحتفاظ بالموظفين", "HR", "%", "90", "91.7", "Q1-2026", "Sara Al-Qahtani", "achieved"],
      ["KPI-005", "IT System Uptime", "وقت تشغيل أنظمة تقنية المعلومات", "IT", "%", "99.5", "99.2", "Q1-2026", "Khalid Al-Mansouri", "on_track"],
      ["KPI-006", "ISO 9001 Non-Conformance Rate", "معدل عدم المطابقة ISO 9001", "Quality", "NCRs/month", "2", "4", "Q1-2026", "Nora Al-Shehri", "off_track"],
      ["KPI-007", "Procurement Cost Savings", "وفورات تكاليف المشتريات", "Procurement", "SAR", "500000", "423000", "Q1-2026", "Tariq Al-Ghamdi", "at_risk"],
      ["KPI-008", "New Client Acquisition", "اكتساب عملاء جدد", "Sales", "Clients", "10", "8", "Q1-2026", "Omar Al-Harbi", "at_risk"],
      ["KPI-009", "Legal Contract Compliance Rate", "معدل الامتثال للعقود القانونية", "Legal", "%", "100", "100", "Q1-2026", "Reem Al-Dosari", "achieved"],
      ["KPI-010", "AI System Response Accuracy", "دقة استجابة نظام الذكاء الاصطناعي", "Technology", "%", "95", "97.2", "Q1-2026", "Abdelrahman Ragab", "achieved"],
    ];
    for (const k of kpis) {
      await conn.execute(
        `INSERT INTO kpi_targets (kpiCode, name, nameAr, category, unit, targetValue, actualValue, period, owner, status) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        k
      );
    }
    console.log(`  ✓ Inserted ${kpis.length} KPI targets`);
  } else {
    console.log(`  ⏭  kpi_targets already has data (${kpiCount[0].c} rows)`);
  }

  // ── Procurement Items ─────────────────────────────────────────────────────────
  const [procCount] = await conn.execute("SELECT COUNT(*) as c FROM procurement_items");
  if (procCount[0].c === 0) {
    console.log("🌱 Seeding procurement_items...");
    const items = [
      ["PO-2026-001", "Dell PowerEdge R750 Server", "خادم ديل باورإيدج R750", "Saudi IT Solutions Co.", "IT Hardware", "2", "Unit", 45000, 90000, "SAR", "2026-04-15", "approved"],
      ["PO-2026-002", "Cisco Catalyst 9300 Switch", "محول سيسكو كاتاليست 9300", "Network Systems KSA", "IT Hardware", "5", "Unit", 12000, 60000, "SAR", "2026-04-20", "ordered"],
      ["PO-2026-003", "Microsoft 365 Business Premium Licenses", "تراخيص مايكروسوفت 365", "Microsoft Gulf", "Software", "50", "License/Year", 1200, 60000, "SAR", "2026-03-31", "received"],
      ["PO-2026-004", "Office Furniture — Executive Suite", "أثاث مكتبي — جناح تنفيذي", "Al-Faisaliah Furniture", "Facilities", "1", "Set", 35000, 35000, "SAR", "2026-05-01", "pending"],
      ["PO-2026-005", "Fortinet FortiGate 200F Firewall", "جدار حماية فورتينت فورتيجيت", "Fortinet KSA Partner", "IT Security", "1", "Unit", 28000, 28000, "SAR", "2026-04-10", "approved"],
      ["PO-2026-006", "HP LaserJet Enterprise MFP", "طابعة HP ليزرجيت إنتربرايز", "HP Saudi Arabia", "Office Equipment", "3", "Unit", 8500, 25500, "SAR", "2026-04-05", "received"],
      ["PO-2026-007", "ISO 9001:2015 Consulting Services", "خدمات استشارية ISO 9001:2015", "Quality Consultants Arabia", "Professional Services", "1", "Contract", 75000, 75000, "SAR", "2026-06-30", "approved"],
      ["PO-2026-008", "Cloud Storage Expansion — AWS S3", "توسعة التخزين السحابي AWS S3", "Amazon Web Services", "Cloud Services", "12", "Month", 3500, 42000, "SAR", "2026-12-31", "ordered"],
      ["PO-2026-009", "Security Camera System — 32 Channels", "نظام كاميرات أمنية 32 قناة", "Hikvision KSA", "Security", "1", "System", 18000, 18000, "SAR", "2026-04-25", "pending"],
      ["PO-2026-010", "Annual IT Support Contract", "عقد دعم تقني سنوي", "TechSupport Arabia", "Services", "1", "Year", 120000, 120000, "SAR", "2026-12-31", "approved"],
    ];
    for (const p of items) {
      await conn.execute(
        `INSERT INTO procurement_items (poNumber, itemName, itemNameAr, supplier, category, quantity, unit, unitPrice, totalPrice, currency, deliveryDate, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        p
      );
    }
    console.log(`  ✓ Inserted ${items.length} procurement items`);
  } else {
    console.log(`  ⏭  procurement_items already has data (${procCount[0].c} rows)`);
  }

  // ── QMS Incidents ─────────────────────────────────────────────────────────────
  const [qmsCount] = await conn.execute("SELECT COUNT(*) as c FROM qms_incidents");
  if (qmsCount[0].c === 0) {
    console.log("🌱 Seeding qms_incidents...");
    const incidents = [
      ["NCR-2026-001", "Delayed Project Deliverable — Phase 2", "تأخر تسليم المشروع — المرحلة الثانية", "Projects", "قسم المشاريع", "Project milestone M3 delivered 5 days late due to resource conflict.", "major", "in_progress", "Mohammed Al-Otaibi", "Resource allocation conflict between Project A and Project B", "Implement resource leveling in ASTRA PM", "2026-04-15"],
      ["NCR-2026-002", "Document Control Non-Compliance", "عدم الامتثال لضبط الوثائق", "Administration", "الإدارة", "Outdated procedure documents found in circulation without revision control.", "minor", "open", "Sara Al-Qahtani", "Lack of document version control awareness", "Conduct document control training for all staff", "2026-03-31"],
      ["NCR-2026-003", "IT Security Incident — Phishing Attempt", "حادثة أمن تقنية المعلومات — محاولة تصيد", "IT Security", "أمن المعلومات", "3 employees clicked phishing email links. No data breach confirmed.", "critical", "resolved", "Khalid Al-Mansouri", "Insufficient security awareness training", "Mandatory phishing simulation training deployed", "2026-03-20"],
      ["NCR-2026-004", "Supplier Delivery Delay — PO-2026-001", "تأخر تسليم المورد — أمر الشراء 001", "Procurement", "المشتريات", "Server delivery delayed by 2 weeks due to supply chain issues.", "minor", "in_progress", "Tariq Al-Ghamdi", "Global chip shortage affecting server availability", "Expedite order and identify alternative supplier", "2026-04-30"],
      ["NCR-2026-005", "Customer Complaint — Response Time", "شكوى عميل — وقت الاستجابة", "Customer Service", "خدمة العملاء", "Client Al-Rashidi Group reported 48-hour delay in IT support response.", "major", "resolved", "Omar Al-Harbi", "Support ticket routing misconfiguration", "Updated SLA monitoring dashboard and escalation rules", "2026-03-15"],
      ["NCR-2026-006", "Payroll Processing Error", "خطأ في معالجة الرواتب", "Finance", "المالية", "3 employees received incorrect salary amounts in February payroll.", "major", "closed", "Fatima Al-Zahrani", "Manual data entry error in payroll system", "Implemented dual-verification for payroll processing", "2026-03-01"],
      ["NCR-2026-007", "Legal Contract Expiry — Unnoticed", "انتهاء عقد قانوني دون إشعار", "Legal", "الشؤون القانونية", "Maintenance contract expired without renewal notice being sent.", "minor", "resolved", "Reem Al-Dosari", "No automated contract expiry alert system", "Implemented contract expiry alerts in Legal Module", "2026-03-25"],
      ["NCR-2026-008", "ISO 9001 Internal Audit Finding", "نتيجة تدقيق داخلي ISO 9001", "Quality", "الجودة", "Internal audit found 2 procedures not updated per latest ISO 9001:2015 revision.", "observation", "open", "Nora Al-Shehri", "Procedure review cycle not followed", "Schedule procedure review workshop for Q2 2026", "2026-05-15"],
    ];
    for (const q of incidents) {
      await conn.execute(
        `INSERT INTO qms_incidents (incidentCode, title, titleAr, area, areaAr, description, severity, status, assignedTo, rootCause, correctiveAction, dueDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        q
      );
    }
    console.log(`  ✓ Inserted ${incidents.length} QMS incidents`);
  } else {
    console.log(`  ⏭  qms_incidents already has data (${qmsCount[0].c} rows)`);
  }

  // ── ERP Records ───────────────────────────────────────────────────────────────
  const [erpCount] = await conn.execute("SELECT COUNT(*) as c FROM erp_records");
  if (erpCount[0].c === 0) {
    console.log("🌱 Seeding erp_records...");
    const records = [
      ["ERP-2026-001", "sale", "IT Infrastructure Project — Al-Rashidi Group", "مشروع البنية التحتية — مجموعة الراشدي", "Al-Rashidi Group", "مجموعة الراشدي", 850000, "SAR", "approved", "2026-04-30"],
      ["ERP-2026-002", "invoice", "Monthly IT Managed Services — Gulf Ventures", "خدمات تقنية المعلومات الشهرية — خليج فنتشرز", "Gulf Ventures", "خليج فنتشرز", 45000, "SAR", "paid", "2026-03-31"],
      ["ERP-2026-003", "sale", "ASTRA PM License — Mansouri Holdings", "ترخيص ASTRA PM — مجموعة المنصوري", "Mansouri Holdings", "مجموعة المنصوري", 120000, "SAR", "pending", "2026-05-15"],
      ["ERP-2026-004", "purchase", "Annual AWS Cloud Infrastructure", "البنية التحتية السحابية السنوية AWS", "Amazon Web Services", "أمازون ويب سيرفيسز", 180000, "SAR", "approved", "2026-12-31"],
      ["ERP-2026-005", "invoice", "ISO 9001 Consulting — Q1 2026", "استشارات ISO 9001 — الربع الأول 2026", "Quality Consultants Arabia", "مستشارو الجودة العربية", 25000, "SAR", "paid", "2026-03-15"],
      ["ERP-2026-006", "sale", "Cybersecurity Assessment — National Bank", "تقييم الأمن السيبراني — البنك الوطني", "National Commercial Bank", "البنك الأهلي التجاري", 320000, "SAR", "pending", "2026-06-30"],
      ["ERP-2026-007", "expense", "Q1 2026 Employee Travel Expenses", "مصاريف سفر الموظفين — الربع الأول 2026", "Internal", "داخلي", 38500, "SAR", "approved", "2026-03-31"],
      ["ERP-2026-008", "invoice", "NEO AI Platform Subscription — Aramco", "اشتراك منصة NEO AI — أرامكو", "Saudi Aramco", "أرامكو السعودية", 240000, "SAR", "draft", "2026-07-01"],
      ["ERP-2026-009", "sale", "Business Consultancy Retainer — Q2 2026", "عقد استشارات الأعمال — الربع الثاني 2026", "Al-Faisaliah Group", "مجموعة الفيصلية", 90000, "SAR", "approved", "2026-06-30"],
      ["ERP-2026-010", "inventory", "IT Equipment Inventory Valuation", "تقييم مخزون معدات تقنية المعلومات", "Internal Assets", "الأصول الداخلية", 1250000, "SAR", "approved", "2026-03-31"],
    ];
    for (const e of records) {
      await conn.execute(
        `INSERT INTO erp_records (recordNumber, type, title, titleAr, party, partyAr, amount, currency, status, dueDate) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        e
      );
    }
    console.log(`  ✓ Inserted ${records.length} ERP records`);
  } else {
    console.log(`  ⏭  erp_records already has data (${erpCount[0].c} rows)`);
  }

  // ── CRM Contacts ──────────────────────────────────────────────────────────────
  const [crmCount] = await conn.execute("SELECT COUNT(*) as c FROM crm_contacts");
  if (crmCount[0].c === 0) {
    console.log("🌱 Seeding crm_contacts...");
    const contacts = [
      ["Ahmed Al-Rashidi", "أحمد الراشدي", "Al-Rashidi Group", "مجموعة الراشدي", "a.rashidi@alrashidi.sa", "+966501111111", "client", "won", 850000, 100, "Referral", "Omar Al-Harbi", "2026-03-10"],
      ["Sara Mohammed", "سارة محمد", "Gulf Ventures", "خليج فنتشرز", "s.mohammed@gulfventures.sa", "+966502222222", "client", "won", 540000, 100, "Exhibition", "Omar Al-Harbi", "2026-03-05"],
      ["Khalid Al-Mansouri", "خالد المنصوري", "Mansouri Holdings", "مجموعة المنصوري", "k.mansouri@mansouri.sa", "+966503333333", "prospect", "proposal", 120000, 70, "Direct", "Omar Al-Harbi", "2026-03-12"],
      ["Faisal Al-Tamimi", "فيصل التميمي", "National Commercial Bank", "البنك الأهلي التجاري", "f.tamimi@ncb.sa", "+966504444444", "prospect", "negotiation", 320000, 80, "LinkedIn", "Omar Al-Harbi", "2026-03-14"],
      ["Nadia Al-Sulaiman", "نادية السليمان", "Saudi Aramco", "أرامكو السعودية", "n.sulaiman@aramco.com", "+966505555555", "lead", "qualified", 240000, 40, "Conference", "Omar Al-Harbi", "2026-03-08"],
      ["Turki Al-Faisal", "تركي الفيصل", "Al-Faisaliah Group", "مجموعة الفيصلية", "t.faisal@alfaisaliah.sa", "+966506666666", "client", "won", 90000, 100, "Referral", "Omar Al-Harbi", "2026-02-28"],
      ["Mona Al-Harbi", "منى الحربي", "SABIC", "سابك", "m.harbi@sabic.com", "+966507777777", "lead", "contacted", 500000, 20, "Cold Outreach", "Omar Al-Harbi", "2026-03-01"],
      ["Saad Al-Otaibi", "سعد العتيبي", "STC", "شركة الاتصالات السعودية", "s.otaibi@stc.com.sa", "+966508888888", "lead", "new", 180000, 10, "LinkedIn", "Omar Al-Harbi", "2026-03-15"],
      ["Hessa Al-Dosari", "حصة الدوسري", "NEOM", "نيوم", "h.dosari@neom.com", "+966509999999", "prospect", "qualified", 750000, 35, "Exhibition", "Omar Al-Harbi", "2026-03-11"],
      ["Walid Al-Ghamdi", "وليد الغامدي", "Ministry of Communications", "وزارة الاتصالات", "w.ghamdi@mcit.gov.sa", "+966510000000", "lead", "new", 1200000, 15, "Government Portal", "Omar Al-Harbi", "2026-03-13"],
    ];
    for (const c of contacts) {
      await conn.execute(
        `INSERT INTO crm_contacts (fullName, fullNameAr, company, companyAr, email, phone, type, stage, dealValue, probability, source, assignedTo, lastContactDate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        c
      );
    }
    console.log(`  ✓ Inserted ${contacts.length} CRM contacts`);
  } else {
    console.log(`  ⏭  crm_contacts already has data (${crmCount[0].c} rows)`);
  }

  // ── Legal Cases ───────────────────────────────────────────────────────────────
  const [legalCount] = await conn.execute("SELECT COUNT(*) as c FROM legal_cases");
  if (legalCount[0].c === 0) {
    console.log("🌱 Seeding legal_cases...");
    const cases = [
      ["LEGAL-2026-001", "IT Infrastructure Services Agreement — Al-Rashidi Group", "اتفاقية خدمات البنية التحتية — مجموعة الراشدي", "contract", "Al-Rashidi Group", "مجموعة الراشدي", 850000, "active", "2026-01-01", "2026-12-31", "Reem Al-Dosari"],
      ["LEGAL-2026-002", "ASTRA PM Software License Agreement — Mansouri Holdings", "اتفاقية ترخيص برنامج ASTRA PM — مجموعة المنصوري", "contract", "Mansouri Holdings", "مجموعة المنصوري", 120000, "active", "2026-02-01", "2027-01-31", "Reem Al-Dosari"],
      ["LEGAL-2026-003", "Employment Contract — Abdelrahman Ragab", "عقد عمل — عبدالرحمن رجب", "employment", "Abdelrahman Ibrahim Ragab", "عبدالرحمن إبراهيم رجب", 228000, "active", "2023-03-01", "2026-02-28", "Reem Al-Dosari"],
      ["LEGAL-2026-004", "ISO 9001 Consulting Services Agreement", "اتفاقية خدمات استشارات ISO 9001", "contract", "Quality Consultants Arabia", "مستشارو الجودة العربية", 75000, "active", "2026-01-15", "2026-12-31", "Reem Al-Dosari"],
      ["LEGAL-2026-005", "Data Processing Agreement — AWS", "اتفاقية معالجة البيانات — AWS", "compliance", "Amazon Web Services", "أمازون ويب سيرفيسز", 0, "active", "2025-01-01", "2026-12-31", "Reem Al-Dosari"],
      ["LEGAL-2026-006", "Office Lease Agreement — Riyadh HQ", "عقد إيجار المكتب — المقر الرئيسي الرياض", "contract", "Al-Akaria Real Estate", "العقارية", 480000, "expiring_soon", "2023-04-01", "2026-03-31", "Reem Al-Dosari"],
      ["LEGAL-2026-007", "Trademark Registration — ASTRA PM", "تسجيل العلامة التجارية — ASTRA PM", "ip", "Saudi Intellectual Property Authority", "هيئة الملكية الفكرية", 15000, "active", "2024-06-01", "2034-05-31", "Reem Al-Dosari"],
      ["LEGAL-2026-008", "Supplier Dispute — Delayed Delivery Claim", "نزاع مع المورد — مطالبة بالتأخير", "dispute", "Network Systems KSA", "شبكات الأنظمة السعودية", 25000, "disputed", "2026-02-01", null, "Reem Al-Dosari"],
    ];
    for (const l of cases) {
      await conn.execute(
        `INSERT INTO legal_cases (caseNumber, title, titleAr, type, party, partyAr, value, status, startDate, expiryDate, assignedTo) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        l
      );
    }
    console.log(`  ✓ Inserted ${cases.length} legal cases`);
  } else {
    console.log(`  ⏭  legal_cases already has data (${legalCount[0].c} rows)`);
  }

  await conn.end();
  console.log("\n✅ Demo data seeding complete!");
  console.log("   Navigate to any module page to see the data.");
}

seed().catch(err => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
