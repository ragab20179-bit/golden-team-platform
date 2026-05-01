/**
 * ModuleBulkImport — Pre-configured BulkImportDialog wrappers for each module.
 *
 * Provides field definitions, template CSVs, and tRPC mutation wiring for:
 *   - HRBulkImport   → trpc.modules.hr.bulkImport
 *   - KPIBulkImport  → trpc.modules.kpi.bulkImport
 *   - ProcurementBulkImport → trpc.modules.procurement.bulkImport
 */
import BulkImportDialog, { TargetField } from "@/components/BulkImportDialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── HR ───────────────────────────────────────────────────────────────────────

const HR_FIELDS: TargetField[] = [
  { key: "fullName",     labelEn: "Full Name",      labelAr: "الاسم الكامل",        required: true,  type: "text" },
  { key: "fullNameAr",   labelEn: "Full Name (AR)",  labelAr: "الاسم بالعربية",      required: false, type: "text" },
  { key: "employeeId",   labelEn: "Employee ID",     labelAr: "رقم الموظف",          required: false, type: "text" },
  { key: "jobTitle",     labelEn: "Job Title",       labelAr: "المسمى الوظيفي",      required: false, type: "text" },
  { key: "department",   labelEn: "Department",      labelAr: "القسم",               required: false, type: "text" },
  { key: "email",        labelEn: "Email",           labelAr: "البريد الإلكتروني",   required: false, type: "text" },
  { key: "phone",        labelEn: "Phone",           labelAr: "الهاتف",              required: false, type: "text" },
  { key: "nationality",  labelEn: "Nationality",     labelAr: "الجنسية",             required: false, type: "text" },
  { key: "contractType", labelEn: "Contract Type",   labelAr: "نوع العقد",           required: false, type: "enum",
    enumValues: ["full_time", "part_time", "contract", "intern"] },
  { key: "startDate",    labelEn: "Start Date",      labelAr: "تاريخ الانضمام",      required: false, type: "date" },
  { key: "salary",       labelEn: "Salary (SAR)",    labelAr: "الراتب (ريال)",       required: false, type: "number" },
  { key: "status",       labelEn: "Status",          labelAr: "الحالة",              required: false, type: "enum",
    enumValues: ["active", "inactive", "on_leave"] },
  { key: "notes",        labelEn: "Notes",           labelAr: "ملاحظات",             required: false, type: "text" },
];

const HR_TEMPLATE_CSV = `fullName,fullNameAr,employeeId,jobTitle,department,email,phone,nationality,contractType,startDate,salary,status
Ahmed Al-Rashidi,أحمد الراشدي,EMP-001,Senior IT Engineer,IT Solutions,ahmed@goldenteam.sa,+966501234567,Saudi,full_time,2022-03-01,18000,active
Sara Mohammed,سارة محمد,EMP-002,Business Analyst,Business Dev,sara@goldenteam.sa,+966507654321,Saudi,full_time,2023-01-15,15000,active`;

export function HRBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const bulkImport = trpc.modules.hr.bulkImport.useMutation();

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="HR — Employee Records"
      moduleAr="الموارد البشرية — سجلات الموظفين"
      fields={HR_FIELDS}
      templateCsv={HR_TEMPLATE_CSV}
      templateFilename="hr_employees_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          fullName: String(r.fullName ?? ""),
          fullNameAr: r.fullNameAr ? String(r.fullNameAr) : undefined,
          employeeId: r.employeeId ? String(r.employeeId) : undefined,
          jobTitle: r.jobTitle ? String(r.jobTitle) : undefined,
          department: r.department ? String(r.department) : undefined,
          email: r.email ? String(r.email) : undefined,
          phone: r.phone ? String(r.phone) : undefined,
          nationality: r.nationality ? String(r.nationality) : undefined,
          contractType: (["full_time","part_time","contract","intern"].includes(String(r.contractType))
            ? String(r.contractType) : "full_time") as "full_time"|"part_time"|"contract"|"intern",
          startDate: r.startDate ? String(r.startDate) : undefined,
          salary: r.salary ? Number(r.salary) : undefined,
          status: (["active","inactive","on_leave"].includes(String(r.status))
            ? String(r.status) : "active") as "active"|"inactive"|"on_leave",
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.fullName.trim().length > 0);

        const result = await bulkImport.mutateAsync({ entries });
        if (result.failed > 0) {
          toast.error(t(`${result.failed} rows failed to import`, `${result.failed} صفوف فشل استيرادها`));
        }
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

const KPI_FIELDS: TargetField[] = [
  { key: "name",         labelEn: "KPI Name",        labelAr: "اسم المؤشر",          required: true,  type: "text" },
  { key: "nameAr",       labelEn: "KPI Name (AR)",   labelAr: "اسم المؤشر بالعربية", required: false, type: "text" },
  { key: "kpiCode",      labelEn: "KPI Code",        labelAr: "رمز المؤشر",          required: false, type: "text" },
  { key: "category",     labelEn: "Category",        labelAr: "الفئة",               required: false, type: "text" },
  { key: "unit",         labelEn: "Unit",            labelAr: "الوحدة",              required: false, type: "text" },
  { key: "targetValue",  labelEn: "Target Value",    labelAr: "القيمة المستهدفة",    required: false, type: "text" },
  { key: "actualValue",  labelEn: "Actual Value",    labelAr: "القيمة الفعلية",      required: false, type: "text" },
  { key: "period",       labelEn: "Period",          labelAr: "الفترة",              required: false, type: "text",
    hint: "e.g. Q1-2026, March 2026" },
  { key: "owner",        labelEn: "Owner",           labelAr: "المسؤول",             required: false, type: "text" },
  { key: "status",       labelEn: "Status",          labelAr: "الحالة",              required: false, type: "enum",
    enumValues: ["on_track", "at_risk", "off_track", "achieved"] },
  { key: "notes",        labelEn: "Notes",           labelAr: "ملاحظات",             required: false, type: "text" },
];

const KPI_TEMPLATE_CSV = `name,nameAr,kpiCode,category,unit,targetValue,actualValue,period,owner,status
Customer Satisfaction,رضا العملاء,KPI-001,Customer,Score,90,87,Q1-2026,Sara Mohammed,on_track
Project Delivery Rate,معدل تسليم المشاريع,KPI-002,Operations,%,95,92,Q1-2026,Ahmed Al-Rashidi,on_track`;

export function KPIBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.kpi.bulkImport.useMutation();

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="KPI — Performance Targets"
      moduleAr="مؤشرات الأداء — الأهداف"
      fields={KPI_FIELDS}
      templateCsv={KPI_TEMPLATE_CSV}
      templateFilename="kpi_targets_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          name: String(r.name ?? ""),
          nameAr: r.nameAr ? String(r.nameAr) : undefined,
          kpiCode: r.kpiCode ? String(r.kpiCode) : undefined,
          category: r.category ? String(r.category) : undefined,
          unit: r.unit ? String(r.unit) : undefined,
          targetValue: r.targetValue ? String(r.targetValue) : undefined,
          actualValue: r.actualValue ? String(r.actualValue) : undefined,
          period: r.period ? String(r.period) : undefined,
          owner: r.owner ? String(r.owner) : undefined,
          status: (["on_track","at_risk","off_track","achieved"].includes(String(r.status))
            ? String(r.status) : "on_track") as "on_track"|"at_risk"|"off_track"|"achieved",
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.name.trim().length > 0);

        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── Procurement ──────────────────────────────────────────────────────────────

const PROCUREMENT_FIELDS: TargetField[] = [
  { key: "itemName",     labelEn: "Item Name",       labelAr: "اسم الصنف",           required: true,  type: "text" },
  { key: "itemNameAr",   labelEn: "Item Name (AR)",  labelAr: "اسم الصنف بالعربية",  required: false, type: "text" },
  { key: "poNumber",     labelEn: "PO Number",       labelAr: "رقم أمر الشراء",      required: false, type: "text" },
  { key: "supplier",     labelEn: "Supplier",        labelAr: "المورد",              required: false, type: "text" },
  { key: "category",     labelEn: "Category",        labelAr: "الفئة",               required: false, type: "text" },
  { key: "quantity",     labelEn: "Quantity",        labelAr: "الكمية",              required: false, type: "text" },
  { key: "unit",         labelEn: "Unit",            labelAr: "الوحدة",              required: false, type: "text" },
  { key: "unitPrice",    labelEn: "Unit Price",      labelAr: "سعر الوحدة",          required: false, type: "number" },
  { key: "totalPrice",   labelEn: "Total Price",     labelAr: "الإجمالي",            required: false, type: "number" },
  { key: "currency",     labelEn: "Currency",        labelAr: "العملة",              required: false, type: "text",
    hint: "SAR, USD, EUR" },
  { key: "deliveryDate", labelEn: "Delivery Date",   labelAr: "تاريخ التسليم",       required: false, type: "date" },
  { key: "status",       labelEn: "Status",          labelAr: "الحالة",              required: false, type: "enum",
    enumValues: ["pending", "approved", "ordered", "received", "cancelled"] },
  { key: "notes",        labelEn: "Notes",           labelAr: "ملاحظات",             required: false, type: "text" },
];

const PROCUREMENT_TEMPLATE_CSV = `itemName,itemNameAr,poNumber,supplier,category,quantity,unit,unitPrice,totalPrice,currency,deliveryDate,status
Network Switch 48-Port,مفتاح شبكة 48 منفذ,PO-2026-001,Al-Jazeera Tech,IT Hardware,5,Unit,4500,22500,SAR,2026-04-15,pending
Office Chairs,كراسي مكتبية,PO-2026-002,Riyadh Furniture,Furniture,20,Unit,850,17000,SAR,2026-04-20,approved`;

export function ProcurementBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.procurement.bulkImport.useMutation();

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="Procurement — Purchase Orders"
      moduleAr="المشتريات — أوامر الشراء"
      fields={PROCUREMENT_FIELDS}
      templateCsv={PROCUREMENT_TEMPLATE_CSV}
      templateFilename="procurement_items_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          itemName: String(r.itemName ?? ""),
          itemNameAr: r.itemNameAr ? String(r.itemNameAr) : undefined,
          poNumber: r.poNumber ? String(r.poNumber) : undefined,
          supplier: r.supplier ? String(r.supplier) : undefined,
          category: r.category ? String(r.category) : undefined,
          quantity: r.quantity ? String(r.quantity) : undefined,
          unit: r.unit ? String(r.unit) : undefined,
          unitPrice: r.unitPrice ? Number(r.unitPrice) : undefined,
          totalPrice: r.totalPrice ? Number(r.totalPrice) : undefined,
          currency: r.currency ? String(r.currency) : "SAR",
          deliveryDate: r.deliveryDate ? String(r.deliveryDate) : undefined,
          status: (["pending","approved","ordered","received","cancelled"].includes(String(r.status))
            ? String(r.status) : "pending") as "pending"|"approved"|"ordered"|"received"|"cancelled",
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.itemName.trim().length > 0);

        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── QMS ─────────────────────────────────────────────────────────────────────
const QMS_FIELDS: TargetField[] = [
  { key: "title",            labelEn: "Title",             labelAr: "العنوان",                required: true,  type: "text" },
  { key: "titleAr",          labelEn: "Title (AR)",        labelAr: "العنوان بالعربية",        required: false, type: "text" },
  { key: "incidentCode",     labelEn: "Incident Code",     labelAr: "رمز الحادثة",             required: false, type: "text" },
  { key: "area",             labelEn: "Area",              labelAr: "المجال",                  required: false, type: "text" },
  { key: "description",      labelEn: "Description",       labelAr: "الوصف",                   required: false, type: "text" },
  { key: "severity",         labelEn: "Severity",          labelAr: "الخطورة",                 required: false, type: "enum",
    enumValues: ["critical", "major", "minor", "observation"] },
  { key: "status",           labelEn: "Status",            labelAr: "الحالة",                  required: false, type: "enum",
    enumValues: ["open", "in_progress", "resolved", "closed"] },
  { key: "assignedTo",       labelEn: "Assigned To",       labelAr: "مسند إلى",               required: false, type: "text" },
  { key: "rootCause",        labelEn: "Root Cause",        labelAr: "السبب الجذري",            required: false, type: "text" },
  { key: "correctiveAction", labelEn: "Corrective Action", labelAr: "الإجراء التصحيحي",       required: false, type: "text" },
  { key: "dueDate",          labelEn: "Due Date",          labelAr: "تاريخ الاستحقاق",        required: false, type: "date" },
];
const QMS_TEMPLATE_CSV = `title,titleAr,incidentCode,area,severity,status,assignedTo,dueDate
Document Control Non-Compliance,عدم الامتثال لإجراء التحكم في الوثائق,NCR-2026-001,Quality Management,major,open,Fatima Al-Zahrani,2026-05-15
Supplier Delivery Delay,تأخير تسليم المورد,NCR-2026-002,Procurement,minor,in_progress,Omar Al-Otaibi,2026-05-20`;
export function QMSBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.qms.bulkImport.useMutation();
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="QMS — Non-Conformance Reports"
      moduleAr="إدارة الجودة — تقارير عدم المطابقة"
      fields={QMS_FIELDS}
      templateCsv={QMS_TEMPLATE_CSV}
      templateFilename="qms_incidents_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          title: String(r.title ?? ""),
          titleAr: r.titleAr ? String(r.titleAr) : undefined,
          incidentCode: r.incidentCode ? String(r.incidentCode) : undefined,
          area: r.area ? String(r.area) : undefined,
          description: r.description ? String(r.description) : undefined,
          severity: (["critical","major","minor","observation"].includes(String(r.severity))
            ? String(r.severity) : "minor") as "critical"|"major"|"minor"|"observation",
          status: (["open","in_progress","resolved","closed"].includes(String(r.status))
            ? String(r.status) : "open") as "open"|"in_progress"|"resolved"|"closed",
          assignedTo: r.assignedTo ? String(r.assignedTo) : undefined,
          rootCause: r.rootCause ? String(r.rootCause) : undefined,
          correctiveAction: r.correctiveAction ? String(r.correctiveAction) : undefined,
          dueDate: r.dueDate ? String(r.dueDate) : undefined,
        })).filter((e) => e.title.trim().length > 0);
        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── ERP ─────────────────────────────────────────────────────────────────────
const ERP_FIELDS: TargetField[] = [
  { key: "title",        labelEn: "Title",          labelAr: "العنوان",              required: true,  type: "text" },
  { key: "titleAr",      labelEn: "Title (AR)",     labelAr: "العنوان بالعربية",     required: false, type: "text" },
  { key: "recordNumber", labelEn: "Record Number",  labelAr: "رقم السجل",            required: false, type: "text" },
  { key: "type",         labelEn: "Type",           labelAr: "النوع",                required: false, type: "enum",
    enumValues: ["sale", "invoice", "purchase", "inventory", "expense", "other"] },
  { key: "party",        labelEn: "Party",          labelAr: "الطرف",                required: false, type: "text" },
  { key: "amount",       labelEn: "Amount",         labelAr: "المبلغ",               required: false, type: "number" },
  { key: "currency",     labelEn: "Currency",       labelAr: "العملة",               required: false, type: "text", hint: "SAR, USD, EUR" },
  { key: "status",       labelEn: "Status",         labelAr: "الحالة",               required: false, type: "enum",
    enumValues: ["draft", "pending", "approved", "paid", "cancelled"] },
  { key: "dueDate",      labelEn: "Due Date",       labelAr: "تاريخ الاستحقاق",     required: false, type: "date" },
  { key: "notes",        labelEn: "Notes",          labelAr: "ملاحظات",              required: false, type: "text" },
];
const ERP_TEMPLATE_CSV = `title,titleAr,recordNumber,type,party,amount,currency,status,dueDate
IT Infrastructure Contract,عقد البنية التحتية,ERP-2026-001,sale,Gulf Ventures,1850000,SAR,paid,2026-03-31
AWS Cloud Services Q2,خدمات AWS السحابية,ERP-2026-002,purchase,Amazon Web Services,264000,SAR,paid,2026-04-01`;
export function ERPBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.erp.bulkImport.useMutation();
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="ERP — Financial Records"
      moduleAr="ERP — السجلات المالية"
      fields={ERP_FIELDS}
      templateCsv={ERP_TEMPLATE_CSV}
      templateFilename="erp_records_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          title: String(r.title ?? ""),
          titleAr: r.titleAr ? String(r.titleAr) : undefined,
          recordNumber: r.recordNumber ? String(r.recordNumber) : undefined,
          type: (["sale","invoice","purchase","inventory","expense","other"].includes(String(r.type))
            ? String(r.type) : "other") as "sale"|"invoice"|"purchase"|"inventory"|"expense"|"other",
          party: r.party ? String(r.party) : undefined,
          amount: r.amount ? Number(r.amount) : undefined,
          currency: r.currency ? String(r.currency) : "SAR",
          status: (["draft","pending","approved","paid","cancelled"].includes(String(r.status))
            ? String(r.status) : "draft") as "draft"|"pending"|"approved"|"paid"|"cancelled",
          dueDate: r.dueDate ? String(r.dueDate) : undefined,
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.title.trim().length > 0);
        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── CRM ─────────────────────────────────────────────────────────────────────
const CRM_FIELDS: TargetField[] = [
  { key: "fullName",    labelEn: "Full Name",        labelAr: "الاسم الكامل",          required: true,  type: "text" },
  { key: "fullNameAr",  labelEn: "Full Name (AR)",   labelAr: "الاسم بالعربية",        required: false, type: "text" },
  { key: "company",     labelEn: "Company",          labelAr: "الشركة",                required: false, type: "text" },
  { key: "email",       labelEn: "Email",            labelAr: "البريد الإلكتروني",     required: false, type: "text" },
  { key: "phone",       labelEn: "Phone",            labelAr: "الهاتف",                required: false, type: "text" },
  { key: "type",        labelEn: "Type",             labelAr: "النوع",                 required: false, type: "enum",
    enumValues: ["lead", "prospect", "client", "partner"] },
  { key: "stage",       labelEn: "Stage",            labelAr: "المرحلة",               required: false, type: "enum",
    enumValues: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
  { key: "dealValue",   labelEn: "Deal Value (SAR)", labelAr: "قيمة الصفقة (ريال)",   required: false, type: "number" },
  { key: "probability", labelEn: "Probability (%)",  labelAr: "الاحتمالية (%)",        required: false, type: "number" },
  { key: "source",      labelEn: "Source",           labelAr: "المصدر",                required: false, type: "text" },
  { key: "assignedTo",  labelEn: "Assigned To",      labelAr: "مسند إلى",             required: false, type: "text" },
  { key: "notes",       labelEn: "Notes",            labelAr: "ملاحظات",               required: false, type: "text" },
];
const CRM_TEMPLATE_CSV = `fullName,fullNameAr,company,email,phone,type,stage,dealValue,probability,source,assignedTo
Fahad Al-Mutairi,فهد المطيري,Al-Mutairi Group,fahad@almutairi.sa,+966502000001,prospect,proposal,2500000,65,Referral,Tariq Al-Harbi
Hessa Al-Saud,هيصة آل سعود,Royal Ventures,hessa@royalventures.sa,+966502000002,lead,qualified,5000000,40,GITEX,AbdelRahman Ibrahim`;
export function CRMBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.crm.bulkImport.useMutation();
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="CRM — Contacts & Leads"
      moduleAr="إدارة العملاء — جهات الاتصال والعملاء المحتملون"
      fields={CRM_FIELDS}
      templateCsv={CRM_TEMPLATE_CSV}
      templateFilename="crm_contacts_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          fullName: String(r.fullName ?? ""),
          fullNameAr: r.fullNameAr ? String(r.fullNameAr) : undefined,
          company: r.company ? String(r.company) : undefined,
          email: r.email ? String(r.email) : undefined,
          phone: r.phone ? String(r.phone) : undefined,
          type: (["lead","prospect","client","partner"].includes(String(r.type))
            ? String(r.type) : "lead") as "lead"|"prospect"|"client"|"partner",
          stage: (["new","contacted","qualified","proposal","negotiation","won","lost"].includes(String(r.stage))
            ? String(r.stage) : "new") as "new"|"contacted"|"qualified"|"proposal"|"negotiation"|"won"|"lost",
          dealValue: r.dealValue ? Number(r.dealValue) : undefined,
          probability: r.probability ? Math.min(100, Math.max(0, Number(r.probability))) : undefined,
          source: r.source ? String(r.source) : undefined,
          assignedTo: r.assignedTo ? String(r.assignedTo) : undefined,
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.fullName.trim().length > 0);
        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}

// ─── Legal ───────────────────────────────────────────────────────────────────
const LEGAL_FIELDS: TargetField[] = [
  { key: "title",       labelEn: "Title",          labelAr: "العنوان",              required: true,  type: "text" },
  { key: "titleAr",     labelEn: "Title (AR)",     labelAr: "العنوان بالعربية",     required: false, type: "text" },
  { key: "caseNumber",  labelEn: "Case Number",    labelAr: "رقم القضية",           required: false, type: "text" },
  { key: "type",        labelEn: "Type",           labelAr: "النوع",                required: false, type: "enum",
    enumValues: ["contract", "dispute", "compliance", "ip", "employment", "other"] },
  { key: "party",       labelEn: "Party",          labelAr: "الطرف",                required: false, type: "text" },
  { key: "value",       labelEn: "Value (SAR)",    labelAr: "القيمة (ريال)",        required: false, type: "number" },
  { key: "status",      labelEn: "Status",         labelAr: "الحالة",               required: false, type: "enum",
    enumValues: ["draft", "active", "expiring_soon", "expired", "closed", "disputed"] },
  { key: "startDate",   labelEn: "Start Date",     labelAr: "تاريخ البدء",          required: false, type: "date" },
  { key: "expiryDate",  labelEn: "Expiry Date",    labelAr: "تاريخ الانتهاء",       required: false, type: "date" },
  { key: "description", labelEn: "Description",    labelAr: "الوصف",                required: false, type: "text" },
  { key: "assignedTo",  labelEn: "Assigned To",    labelAr: "مسند إلى",             required: false, type: "text" },
  { key: "notes",       labelEn: "Notes",          labelAr: "ملاحظات",              required: false, type: "text" },
];
const LEGAL_TEMPLATE_CSV = `title,titleAr,caseNumber,type,party,value,status,startDate,expiryDate,assignedTo
IT Services Agreement — Gulf Ventures,اتفاقية خدمات تقنية المعلومات,GT-LEGAL-2026-001,contract,Gulf Ventures,1850000,active,2026-01-01,2026-12-31,Nora Al-Shehri
Supplier Agreement — Al-Jazeera Tech,اتفاقية مورد — الجزيرة للتقنية,GT-LEGAL-2025-004,contract,Al-Jazeera Technology Co.,500000,expiring_soon,2025-06-01,2026-05-31,Nora Al-Shehri`;
export function LegalBulkImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const bulkImport = trpc.modules.legal.bulkImport.useMutation();
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      moduleEn="Legal — Cases & Contracts"
      moduleAr="الشؤون القانونية — القضايا والعقود"
      fields={LEGAL_FIELDS}
      templateCsv={LEGAL_TEMPLATE_CSV}
      templateFilename="legal_cases_template.csv"
      onImport={async (rows) => {
        const entries = rows.map((r) => ({
          title: String(r.title ?? ""),
          titleAr: r.titleAr ? String(r.titleAr) : undefined,
          caseNumber: r.caseNumber ? String(r.caseNumber) : undefined,
          type: (["contract","dispute","compliance","ip","employment","other"].includes(String(r.type))
            ? String(r.type) : "contract") as "contract"|"dispute"|"compliance"|"ip"|"employment"|"other",
          party: r.party ? String(r.party) : undefined,
          value: r.value ? Number(r.value) : undefined,
          status: (["draft","active","expiring_soon","expired","closed","disputed"].includes(String(r.status))
            ? String(r.status) : "draft") as "draft"|"active"|"expiring_soon"|"expired"|"closed"|"disputed",
          startDate: r.startDate ? String(r.startDate) : undefined,
          expiryDate: r.expiryDate ? String(r.expiryDate) : undefined,
          description: r.description ? String(r.description) : undefined,
          assignedTo: r.assignedTo ? String(r.assignedTo) : undefined,
          notes: r.notes ? String(r.notes) : undefined,
        })).filter((e) => e.title.trim().length > 0);
        const result = await bulkImport.mutateAsync({ entries });
        return { imported: result.success, failed: result.failed, errors: result.errors };
      }}
    />
  );
}
