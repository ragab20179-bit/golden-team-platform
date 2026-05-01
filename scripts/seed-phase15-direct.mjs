/**
 * Phase 15 Direct DB Seed — Golden Team Platform
 * Uses mysql2 directly with the correct camelCase column names from Drizzle ORM.
 * Run: node scripts/seed-phase15-direct.mjs
 */

import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("❌ DATABASE_URL not set"); process.exit(1); }

// ─── Seed Data (camelCase columns matching actual DB schema) ──────────────────

const HR_EMPLOYEES = [
  { employeeId: "GT-EMP-001", fullName: "AbdelRahman Ibrahim", fullNameAr: "عبدالرحمن إبراهيم", jobTitle: "Chief Executive Officer", department: "Business Dev", email: "ceo@goldenteam.sa", phone: "+966 50 100 0001", contractType: "full_time", status: "active", salary: 45000, nationality: "Egyptian", startDate: "2020-01-01", importedBy: null },
  { employeeId: "GT-EMP-002", fullName: "Khalid Al-Mansouri", fullNameAr: "خالد المنصوري", jobTitle: "Chief Operations Officer", department: "Business Dev", email: "coo@goldenteam.sa", phone: "+966 50 100 0002", contractType: "full_time", status: "active", salary: 38000, nationality: "Saudi", startDate: "2020-03-15", importedBy: null },
  { employeeId: "GT-EMP-003", fullName: "Sara Mohammed Al-Ghamdi", fullNameAr: "سارة محمد الغامدي", jobTitle: "Head of IT Solutions", department: "IT Solutions", email: "it.head@goldenteam.sa", phone: "+966 50 100 0003", contractType: "full_time", status: "active", salary: 32000, nationality: "Saudi", startDate: "2021-01-10", importedBy: null },
  { employeeId: "GT-EMP-004", fullName: "Ahmed Hassan Al-Rashidi", fullNameAr: "أحمد حسن الراشدي", jobTitle: "Senior Project Manager", department: "Business Dev", email: "pm@goldenteam.sa", phone: "+966 50 100 0004", contractType: "full_time", status: "active", salary: 28000, nationality: "Saudi", startDate: "2021-06-01", importedBy: null },
  { employeeId: "GT-EMP-005", fullName: "Fatima Al-Zahrani", fullNameAr: "فاطمة الزهراني", jobTitle: "Quality Assurance Manager", department: "Quality", email: "qm@goldenteam.sa", phone: "+966 50 100 0005", contractType: "full_time", status: "active", salary: 25000, nationality: "Saudi", startDate: "2021-09-01", importedBy: null },
  { employeeId: "GT-EMP-006", fullName: "Omar Al-Otaibi", fullNameAr: "عمر العتيبي", jobTitle: "Procurement Specialist", department: "Procurement", email: "procurement@goldenteam.sa", phone: "+966 50 100 0006", contractType: "full_time", status: "active", salary: 18000, nationality: "Saudi", startDate: "2022-02-15", importedBy: null },
  { employeeId: "GT-EMP-007", fullName: "Nora Al-Shehri", fullNameAr: "نورة الشهري", jobTitle: "Legal Counsel", department: "Legal", email: "legal@goldenteam.sa", phone: "+966 50 100 0007", contractType: "full_time", status: "active", salary: 30000, nationality: "Saudi", startDate: "2022-05-01", importedBy: null },
  { employeeId: "GT-EMP-008", fullName: "Mohammed Al-Dossari", fullNameAr: "محمد الدوسري", jobTitle: "Senior Software Engineer", department: "IT Solutions", email: "dev1@goldenteam.sa", phone: "+966 50 100 0008", contractType: "full_time", status: "active", salary: 22000, nationality: "Saudi", startDate: "2022-08-01", importedBy: null },
  { employeeId: "GT-EMP-009", fullName: "Rania Kamal", fullNameAr: "رانيا كمال", jobTitle: "HR Specialist", department: "HR", email: "hr@goldenteam.sa", phone: "+966 50 100 0009", contractType: "full_time", status: "active", salary: 16000, nationality: "Egyptian", startDate: "2023-01-15", importedBy: null },
  { employeeId: "GT-EMP-010", fullName: "Tariq Al-Harbi", fullNameAr: "طارق الحربي", jobTitle: "Business Development Manager", department: "Business Dev", email: "bd@goldenteam.sa", phone: "+966 50 100 0010", contractType: "full_time", status: "active", salary: 26000, nationality: "Saudi", startDate: "2023-03-01", importedBy: null },
  { employeeId: "GT-EMP-011", fullName: "Layla Al-Qahtani", fullNameAr: "ليلى القحطاني", jobTitle: "Financial Analyst", department: "Business Dev", email: "finance@goldenteam.sa", phone: "+966 50 100 0011", contractType: "full_time", status: "on_leave", salary: 20000, nationality: "Saudi", startDate: "2023-06-01", importedBy: null },
  { employeeId: "GT-EMP-012", fullName: "Yusuf Ibrahim Al-Najdi", fullNameAr: "يوسف إبراهيم النجدي", jobTitle: "IT Support Engineer", department: "IT Solutions", email: "support@goldenteam.sa", phone: "+966 50 100 0012", contractType: "contract", status: "active", salary: 12000, nationality: "Saudi", startDate: "2024-01-01", importedBy: null },
];

const KPI_TARGETS = [
  { kpiCode: "KPI-REV-001", name: "Annual Revenue Target", nameAr: "هدف الإيرادات السنوية", category: "Financial", unit: "SAR", targetValue: "15000000", actualValue: "11200000", period: "2026-Q1", owner: "AbdelRahman Ibrahim", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-CUST-001", name: "New Enterprise Clients", nameAr: "عملاء المؤسسات الجدد", category: "Business Dev", unit: "Clients", targetValue: "12", actualValue: "8", period: "2026-Q1", owner: "Tariq Al-Harbi", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-IT-001", name: "IT Project Delivery On-Time", nameAr: "تسليم مشاريع تقنية المعلومات في الوقت المحدد", category: "IT Solutions", unit: "%", targetValue: "90", actualValue: "87", period: "2026-Q1", owner: "Sara Mohammed Al-Ghamdi", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-QMS-001", name: "ISO 9001 NCR Resolution Rate", nameAr: "معدل حل عدم المطابقة ISO 9001", category: "Quality", unit: "%", targetValue: "95", actualValue: "96", period: "2026-Q1", owner: "Fatima Al-Zahrani", status: "achieved", importedBy: null },
  { kpiCode: "KPI-PROC-001", name: "Procurement Cost Savings", nameAr: "وفورات تكاليف المشتريات", category: "Procurement", unit: "%", targetValue: "8", actualValue: "6.5", period: "2026-Q1", owner: "Omar Al-Otaibi", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-HR-001", name: "Employee Retention Rate", nameAr: "معدل الاحتفاظ بالموظفين", category: "HR", unit: "%", targetValue: "90", actualValue: "92", period: "2026-Q1", owner: "Rania Kamal", status: "achieved", importedBy: null },
  { kpiCode: "KPI-NEO-001", name: "NEO AI Platform Uptime", nameAr: "وقت تشغيل منصة NEO AI", category: "IT Solutions", unit: "%", targetValue: "99.5", actualValue: "99.8", period: "2026-Q1", owner: "Sara Mohammed Al-Ghamdi", status: "achieved", importedBy: null },
  { kpiCode: "KPI-ASTRA-001", name: "ASTRA PM Projects On-Budget", nameAr: "مشاريع ASTRA PM ضمن الميزانية", category: "Business Dev", unit: "%", targetValue: "85", actualValue: "82", period: "2026-Q1", owner: "Ahmed Hassan Al-Rashidi", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-CRM-001", name: "Lead Conversion Rate", nameAr: "معدل تحويل العملاء المحتملين", category: "Business Dev", unit: "%", targetValue: "25", actualValue: "21", period: "2026-Q1", owner: "Tariq Al-Harbi", status: "at_risk", importedBy: null },
  { kpiCode: "KPI-LEGAL-001", name: "Contract Renewal Rate", nameAr: "معدل تجديد العقود", category: "Legal", unit: "%", targetValue: "80", actualValue: "85", period: "2026-Q1", owner: "Nora Al-Shehri", status: "achieved", importedBy: null },
];

const PROCUREMENT_ITEMS = [
  { poNumber: "PO-2026-001", itemName: "Dell PowerEdge R750 Servers (x4)", itemNameAr: "خوادم Dell PowerEdge R750 (×4)", supplier: "Al-Jazeera Technology Co.", category: "IT Hardware", quantity: "4", unit: "Unit", unitPrice: 85000, totalPrice: 340000, currency: "SAR", deliveryDate: "2026-06-15", status: "approved", importedBy: null },
  { poNumber: "PO-2026-002", itemName: "Cisco Catalyst 9300 Switches (x8)", itemNameAr: "محولات Cisco Catalyst 9300 (×8)", supplier: "Cisco Systems KSA", category: "Networking", quantity: "8", unit: "Unit", unitPrice: 18500, totalPrice: 148000, currency: "SAR", deliveryDate: "2026-05-30", status: "ordered", importedBy: null },
  { poNumber: "PO-2026-003", itemName: "Microsoft 365 Business Premium (50 seats)", itemNameAr: "Microsoft 365 Business Premium (50 مقعد)", supplier: "Microsoft Arabia", category: "Software Licenses", quantity: "50", unit: "License", unitPrice: 1800, totalPrice: 90000, currency: "SAR", deliveryDate: "2026-05-01", status: "received", importedBy: null },
  { poNumber: "PO-2026-004", itemName: "Fortinet FortiGate 200F Firewall", itemNameAr: "جدار حماية Fortinet FortiGate 200F", supplier: "Fortinet KSA Partner", category: "Cybersecurity", quantity: "2", unit: "Unit", unitPrice: 42000, totalPrice: 84000, currency: "SAR", deliveryDate: "2026-07-01", status: "pending", importedBy: null },
  { poNumber: "PO-2026-005", itemName: "Office Furniture — Executive Suite", itemNameAr: "أثاث مكتبي — جناح تنفيذي", supplier: "Al-Nakheel Office Supplies", category: "Office Equipment", quantity: "1", unit: "Set", unitPrice: 55000, totalPrice: 55000, currency: "SAR", deliveryDate: "2026-05-20", status: "approved", importedBy: null },
  { poNumber: "PO-2026-006", itemName: "AWS Reserved Instances (1-year)", itemNameAr: "حجوزات AWS (سنة واحدة)", supplier: "Amazon Web Services", category: "Cloud Services", quantity: "12", unit: "Month", unitPrice: 22000, totalPrice: 264000, currency: "SAR", deliveryDate: "2026-05-01", status: "received", importedBy: null },
  { poNumber: "PO-2026-007", itemName: "Tesseract OCR Arabic Language Pack", itemNameAr: "حزمة اللغة العربية Tesseract OCR", supplier: "Open Source — Internal", category: "Software", quantity: "1", unit: "License", unitPrice: 0, totalPrice: 0, currency: "SAR", deliveryDate: "2026-04-15", status: "received", importedBy: null },
  { poNumber: "PO-2026-008", itemName: "HP LaserJet Enterprise Printers (x6)", itemNameAr: "طابعات HP LaserJet Enterprise (×6)", supplier: "HP Arabia", category: "Office Equipment", quantity: "6", unit: "Unit", unitPrice: 4500, totalPrice: 27000, currency: "SAR", deliveryDate: "2026-06-01", status: "pending", importedBy: null },
];

const QMS_INCIDENTS = [
  { incidentCode: "NCR-2026-001", title: "Document Control Procedure Non-Compliance", titleAr: "عدم الامتثال لإجراء التحكم في الوثائق", area: "Quality Management", areaAr: "إدارة الجودة", description: "Version-controlled documents found without approval signatures in the IT Solutions department. 3 documents affected.", severity: "major", status: "in_progress", assignedTo: "Fatima Al-Zahrani", dueDate: "2026-05-15", rootCause: "Staff not trained on new DMS workflow", createdBy: null },
  { incidentCode: "NCR-2026-002", title: "Supplier Delivery SLA Breach", titleAr: "خرق اتفاقية مستوى الخدمة للمورد", area: "Procurement", areaAr: "المشتريات", description: "Al-Jazeera Technology Co. delivered PO-2026-001 servers 12 days late, breaching the 5-day SLA.", severity: "major", status: "open", assignedTo: "Omar Al-Otaibi", dueDate: "2026-05-10", rootCause: "Supply chain disruption — global chip shortage", createdBy: null },
  { incidentCode: "NCR-2026-003", title: "IT Security Patch Delayed", titleAr: "تأخير تطبيق تحديث أمان تقنية المعلومات", area: "IT Solutions", areaAr: "حلول تقنية المعلومات", description: "Critical security patch CVE-2026-1234 not applied within the 48-hour SLA on 3 servers.", severity: "critical", status: "resolved", assignedTo: "Sara Mohammed Al-Ghamdi", dueDate: "2026-04-30", rootCause: "Change management approval bottleneck", correctiveAction: "Emergency change approval process implemented", createdBy: null },
  { incidentCode: "NCR-2026-004", title: "Customer Complaint — Response Time", titleAr: "شكوى عميل — وقت الاستجابة", area: "Business Dev", areaAr: "تطوير الأعمال", description: "Gulf Ventures reported 72-hour response delay on support ticket #GT-2026-0412.", severity: "minor", status: "closed", assignedTo: "Ahmed Hassan Al-Rashidi", dueDate: "2026-04-20", rootCause: "Ticket routing misconfiguration", correctiveAction: "Helpdesk routing rules updated and tested", createdBy: null },
  { incidentCode: "NCR-2026-005", title: "Training Records Gap — ISO 9001", titleAr: "فجوة في سجلات التدريب — ISO 9001", area: "HR", areaAr: "الموارد البشرية", description: "4 employees missing mandatory ISO 9001 awareness training records for Q1 2026.", severity: "minor", status: "in_progress", assignedTo: "Rania Kamal", dueDate: "2026-05-31", createdBy: null },
  { incidentCode: "NCR-2026-006", title: "ASTRA PM Data Backup Failure", titleAr: "فشل النسخ الاحتياطي لبيانات ASTRA PM", area: "IT Solutions", areaAr: "حلول تقنية المعلومات", description: "Automated backup job failed on 2026-04-22 due to storage quota exceeded. 18-hour data gap.", severity: "critical", status: "resolved", assignedTo: "Sara Mohammed Al-Ghamdi", dueDate: "2026-04-25", rootCause: "Storage quota not monitored", correctiveAction: "Storage monitoring alert added; quota increased to 2TB", createdBy: null },
];

const ERP_RECORDS = [
  { recordNumber: "ERP-2026-001", type: "sale", title: "IT Infrastructure Contract — Gulf Ventures", titleAr: "عقد البنية التحتية لتقنية المعلومات — خليج فنتشرز", party: "Gulf Ventures", partyAr: "خليج فنتشرز", amount: 1850000, currency: "SAR", status: "paid", dueDate: "2026-03-31", createdBy: null },
  { recordNumber: "ERP-2026-002", type: "sale", title: "ASTRA PM Annual License — Al-Rashidi Group", titleAr: "ترخيص ASTRA PM السنوي — مجموعة الراشدي", party: "Al-Rashidi Group", partyAr: "مجموعة الراشدي", amount: 420000, currency: "SAR", status: "paid", dueDate: "2026-01-31", createdBy: null },
  { recordNumber: "ERP-2026-003", type: "invoice", title: "ISO 9001 Consultancy — Mansouri Holdings", titleAr: "استشارات ISO 9001 — مجموعة المنصوري", party: "Mansouri Holdings", partyAr: "مجموعة المنصوري", amount: 185000, currency: "SAR", status: "pending", dueDate: "2026-05-30", createdBy: null },
  { recordNumber: "ERP-2026-004", type: "purchase", title: "AWS Cloud Infrastructure Q2 2026", titleAr: "بنية تحتية AWS السحابية الربع الثاني 2026", party: "Amazon Web Services", partyAr: "أمازون ويب سيرفيسز", amount: 264000, currency: "SAR", status: "paid", dueDate: "2026-04-01", createdBy: null },
  { recordNumber: "ERP-2026-005", type: "sale", title: "NEO AI Platform — KDP Project Integration", titleAr: "منصة NEO AI — تكامل مشروع KDP", party: "KDP Project Authority", partyAr: "هيئة مشروع KDP", amount: 3200000, currency: "SAR", status: "approved", dueDate: "2026-06-30", createdBy: null },
  { recordNumber: "ERP-2026-006", type: "expense", title: "Staff Training — ISO 9001 Certification Q1", titleAr: "تدريب الموظفين — شهادة ISO 9001 الربع الأول", party: "SGS Arabia", partyAr: "SGS العربية", amount: 45000, currency: "SAR", status: "paid", dueDate: "2026-03-15", createdBy: null },
  { recordNumber: "ERP-2026-007", type: "invoice", title: "Cybersecurity Audit — Al-Noor Construction", titleAr: "تدقيق الأمن السيبراني — النور للإنشاءات", party: "Al-Noor Construction", partyAr: "النور للإنشاءات", amount: 95000, currency: "SAR", status: "draft", dueDate: "2026-06-15", createdBy: null },
  { recordNumber: "ERP-2026-008", type: "sale", title: "Nadheem Green Riyadh IT Services", titleAr: "خدمات تقنية المعلومات — مشروع نظيم الرياض الخضراء", party: "Nadheem Project Authority", partyAr: "هيئة مشروع نظيم", amount: 780000, currency: "SAR", status: "approved", dueDate: "2026-07-31", createdBy: null },
];

const CRM_CONTACTS = [
  { fullName: "Fahad Al-Mutairi", fullNameAr: "فهد المطيري", company: "Al-Mutairi Group", companyAr: "مجموعة المطيري", email: "fahad@almutairi.sa", phone: "+966 50 200 0001", type: "prospect", stage: "proposal", dealValue: 2500000, probability: 65, source: "Referral", assignedTo: "Tariq Al-Harbi", createdBy: null },
  { fullName: "Hessa Al-Saud", fullNameAr: "هيصة آل سعود", company: "Royal Ventures KSA", companyAr: "رويال فنتشرز السعودية", email: "hessa@royalventures.sa", phone: "+966 50 200 0002", type: "lead", stage: "qualified", dealValue: 5000000, probability: 40, source: "Exhibition — GITEX", assignedTo: "AbdelRahman Ibrahim", createdBy: null },
  { fullName: "Waleed Al-Tamimi", fullNameAr: "وليد التميمي", company: "Tamimi Industrial Group", companyAr: "مجموعة التميمي الصناعية", email: "waleed@tamimi.sa", phone: "+966 50 200 0003", type: "client", stage: "won", dealValue: 1850000, probability: 100, source: "Direct", assignedTo: "Tariq Al-Harbi", createdBy: null },
  { fullName: "Mona Al-Ghamdi", fullNameAr: "منى الغامدي", company: "Gulf Ventures", companyAr: "خليج فنتشرز", email: "mona@gulfventures.sa", phone: "+966 50 200 0004", type: "client", stage: "won", dealValue: 420000, probability: 100, source: "Referral", assignedTo: "Ahmed Hassan Al-Rashidi", createdBy: null },
  { fullName: "Bader Al-Qahtani", fullNameAr: "بدر القحطاني", company: "Al-Qahtani Construction", companyAr: "القحطاني للإنشاءات", email: "bader@alqahtani.sa", phone: "+966 50 200 0005", type: "prospect", stage: "negotiation", dealValue: 3800000, probability: 75, source: "LinkedIn", assignedTo: "Tariq Al-Harbi", createdBy: null },
  { fullName: "Reem Al-Shammari", fullNameAr: "ريم الشمري", company: "Shammari Holdings", companyAr: "مجموعة الشمري القابضة", email: "reem@shammari.sa", phone: "+966 50 200 0006", type: "lead", stage: "contacted", dealValue: 1200000, probability: 25, source: "Cold Outreach", assignedTo: "Tariq Al-Harbi", createdBy: null },
  { fullName: "Nasser Al-Dossari", fullNameAr: "ناصر الدوسري", company: "Eastern Province Dev Authority", companyAr: "هيئة تطوير المنطقة الشرقية", email: "nasser@epda.gov.sa", phone: "+966 50 200 0007", type: "prospect", stage: "proposal", dealValue: 8500000, probability: 55, source: "Government Tender", assignedTo: "AbdelRahman Ibrahim", createdBy: null },
  { fullName: "Abdulaziz Al-Faisal", fullNameAr: "عبدالعزيز الفيصل", company: "Faisal Capital Group", companyAr: "مجموعة الفيصل للاستثمار", email: "aziz@faisalcapital.sa", phone: "+966 50 200 0008", type: "partner", stage: "won", dealValue: 0, probability: 100, source: "Strategic Partnership", assignedTo: "AbdelRahman Ibrahim", createdBy: null },
  { fullName: "Lujain Al-Harbi", fullNameAr: "لجين الحربي", company: "Harbi Medical Group", companyAr: "مجموعة الحربي الطبية", email: "lujain@harbimedical.sa", phone: "+966 50 200 0009", type: "lead", stage: "new", dealValue: 650000, probability: 15, source: "Exhibition — Arab Health", assignedTo: "Tariq Al-Harbi", createdBy: null },
  { fullName: "Saud Al-Otaibi", fullNameAr: "سعود العتيبي", company: "Al-Otaibi Logistics", companyAr: "العتيبي للخدمات اللوجستية", email: "saud@alotaibi.sa", phone: "+966 50 200 0010", type: "prospect", stage: "qualified", dealValue: 920000, probability: 45, source: "Referral", assignedTo: "Tariq Al-Harbi", createdBy: null },
];

const LEGAL_CASES = [
  { caseNumber: "GT-LEGAL-2026-001", title: "IT Infrastructure Services Agreement — Gulf Ventures", titleAr: "اتفاقية خدمات البنية التحتية لتقنية المعلومات — خليج فنتشرز", type: "contract", party: "Gulf Ventures", partyAr: "خليج فنتشرز", value: 1850000, status: "active", startDate: "2026-01-01", expiryDate: "2026-12-31", description: "Annual IT infrastructure management and support contract. Includes SLA guarantees for 99.5% uptime.", assignedTo: "Nora Al-Shehri", createdBy: null },
  { caseNumber: "GT-LEGAL-2026-002", title: "ASTRA PM Platform License — Al-Rashidi Group", titleAr: "ترخيص منصة ASTRA PM — مجموعة الراشدي", type: "contract", party: "Al-Rashidi Group", partyAr: "مجموعة الراشدي", value: 420000, status: "active", startDate: "2026-01-15", expiryDate: "2027-01-14", description: "Multi-year ASTRA PM enterprise license with customization and training.", assignedTo: "Nora Al-Shehri", createdBy: null },
  { caseNumber: "GT-LEGAL-2026-003", title: "NEO AI Platform — KDP Project Authority", titleAr: "منصة NEO AI — هيئة مشروع KDP", type: "contract", party: "KDP Project Authority", partyAr: "هيئة مشروع KDP", value: 3200000, status: "active", startDate: "2026-03-01", expiryDate: "2027-02-28", description: "NEO AI integration for KDP project management and reporting. Includes 12 months of support.", assignedTo: "Nora Al-Shehri", createdBy: null },
  { caseNumber: "GT-LEGAL-2025-004", title: "Supplier Agreement — Al-Jazeera Technology Co.", titleAr: "اتفاقية مورد — شركة الجزيرة للتقنية", type: "contract", party: "Al-Jazeera Technology Co.", partyAr: "شركة الجزيرة للتقنية", value: 500000, status: "expiring_soon", startDate: "2025-06-01", expiryDate: "2026-05-31", description: "Hardware supply and maintenance agreement. Renewal negotiation in progress.", assignedTo: "Nora Al-Shehri", createdBy: null },
  { caseNumber: "GT-LEGAL-2026-005", title: "Employment Dispute — Former Contractor", titleAr: "نزاع عمالي — مقاول سابق", type: "employment", party: "Confidential", partyAr: "سري", value: 85000, status: "disputed", startDate: "2026-02-10", description: "Claim for unpaid contract termination fees. Under legal review.", assignedTo: "Nora Al-Shehri", createdBy: null },
  { caseNumber: "GT-LEGAL-2026-006", title: "ISO 9001 Consultancy — Mansouri Holdings", titleAr: "استشارات ISO 9001 — مجموعة المنصوري", type: "contract", party: "Mansouri Holdings", partyAr: "مجموعة المنصوري", value: 185000, status: "active", startDate: "2026-04-01", expiryDate: "2026-09-30", description: "6-month ISO 9001:2015 implementation and certification support engagement.", assignedTo: "Nora Al-Shehri", createdBy: null },
];

// ─── DB Insert Helper ──────────────────────────────────────────────────────────

async function insertBatch(conn, tableName, rows, label) {
  console.log(`\n📦 Seeding ${label} → ${tableName} (${rows.length} rows)...`);
  let success = 0; let failed = 0;
  for (const row of rows) {
    try {
      const cols = Object.keys(row).join(", ");
      const placeholders = Object.keys(row).map(() => "?").join(", ");
      await conn.execute(`INSERT INTO ${tableName} (${cols}) VALUES (${placeholders})`, Object.values(row));
      success++;
    } catch (err) {
      console.log(`   ⚠️  Row failed: ${err.message.slice(0, 100)}`);
      failed++;
    }
  }
  console.log(`   ✅ ${success} inserted, ${failed} failed`);
  return success;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Golden Team Platform — Phase 15 Direct DB Seed");
  console.log("==================================================");
  const conn = await createConnection(DB_URL);
  console.log("✅ Connected to database");
  let total = 0;
  try {
    total += await insertBatch(conn, "hr_employees",      HR_EMPLOYEES,      "HR Employees");
    total += await insertBatch(conn, "kpi_targets",       KPI_TARGETS,       "KPI Targets");
    total += await insertBatch(conn, "procurement_items", PROCUREMENT_ITEMS, "Procurement Items");
    total += await insertBatch(conn, "qms_incidents",     QMS_INCIDENTS,     "QMS Incidents");
    total += await insertBatch(conn, "erp_records",       ERP_RECORDS,       "ERP Records");
    total += await insertBatch(conn, "crm_contacts",      CRM_CONTACTS,      "CRM Contacts");
    total += await insertBatch(conn, "legal_cases",       LEGAL_CASES,       "Legal Cases");
    console.log(`\n✅ Seed complete! ${total} records inserted across 7 modules.`);
  } finally {
    await conn.end();
  }
}

main().catch(err => { console.error("❌ Fatal:", err.message); process.exit(1); });
