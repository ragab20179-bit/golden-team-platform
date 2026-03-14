/**
 * NEO Transaction Engine — State Machine
 * Design: "Neural Depth" — handles all 5-stage conversational transaction flows
 *
 * Stages:
 *   1. INTENT      — NEO detects the transaction type from natural language
 *   2. DATA        — NEO asks clarifying questions to fill required fields
 *   3. CONFIRM     — NEO presents a summary and asks for user approval
 *   4. AMG_CHECK   — ASTRA AMG governance check (authority matrix validation)
 *   5. EXECUTE     — NEO executes via integration and syncs dashboards
 */

export type TransactionStage = "INTENT" | "DATA" | "CONFIRM" | "AMG_CHECK" | "EXECUTE" | "DONE" | "REJECTED";

export type TransactionType =
  | "CREATE_PO"
  | "CREATE_QUOTE"
  | "APPROVE_LEAVE"
  | "CREATE_INVOICE"
  | "ADD_EMPLOYEE"
  | "LOG_RISK"
  | "SCHEDULE_MEETING"
  | "CREATE_CONTRACT"
  | "SUBMIT_EXPENSE"
  | "OPEN_TICKET";

export interface TransactionField {
  key: string;
  label: string;
  labelAr: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  required: boolean;
  value?: string;
  placeholder?: string;
}

export interface TransactionDefinition {
  type: TransactionType;
  title: string;
  titleAr: string;
  module: string;
  icon: string;
  integration: string;
  amgThreshold?: number; // SAR amount above which AMG approval is required
  fields: TransactionField[];
  confirmTemplate: (fields: Record<string, string>) => string;
  executeMessage: (fields: Record<string, string>) => string;
  syncTargets: string[]; // dashboards/modules to refresh after execution
}

export const TRANSACTION_DEFINITIONS: Record<TransactionType, TransactionDefinition> = {
  CREATE_PO: {
    type: "CREATE_PO",
    title: "Create Purchase Order",
    titleAr: "إنشاء أمر شراء",
    module: "Procurement",
    icon: "🛒",
    integration: "Odoo 19 Procurement API",
    amgThreshold: 10000,
    fields: [
      { key: "vendor", label: "Vendor / Supplier Name", labelAr: "اسم المورد", type: "text", required: true, placeholder: "e.g. Al-Futtaim Office Supplies" },
      { key: "items", label: "Items / Description", labelAr: "الأصناف / الوصف", type: "text", required: true, placeholder: "e.g. Office furniture, 10 chairs" },
      { key: "amount", label: "Total Amount (SAR)", labelAr: "المبلغ الإجمالي (ريال)", type: "number", required: true, placeholder: "e.g. 30000" },
      { key: "delivery_date", label: "Required Delivery Date", labelAr: "تاريخ التسليم المطلوب", type: "date", required: true },
      { key: "cost_center", label: "Cost Center", labelAr: "مركز التكلفة", type: "select", options: ["Operations", "IT", "HR", "Finance", "Management"], required: true },
    ],
    confirmTemplate: (f) => `**Purchase Order Summary**\n\n- **Vendor:** ${f.vendor}\n- **Items:** ${f.items}\n- **Amount:** SAR ${Number(f.amount).toLocaleString()}\n- **Delivery:** ${f.delivery_date}\n- **Cost Center:** ${f.cost_center}\n\nShall I proceed to submit this PO?`,
    executeMessage: (f) => `✅ **PO-${Math.floor(Math.random() * 9000) + 1000} Created** in Odoo 19\n\n- Vendor notified via email\n- KPI Dashboard updated\n- Procurement module synced\n- ${Number(f.amount) >= 10000 ? "AMG approval logged in governance record" : "Auto-approved (below SAR 10,000 threshold)"}`,
    syncTargets: ["KPI Dashboard", "Procurement Module", "ERP / Odoo", "Audit Log"],
  },
  CREATE_QUOTE: {
    type: "CREATE_QUOTE",
    title: "Create Sales Quotation",
    titleAr: "إنشاء عرض سعر",
    module: "CRM / Odoo",
    icon: "📋",
    integration: "Odoo 19 Sales API",
    amgThreshold: 50000,
    fields: [
      { key: "client", label: "Client / Customer Name", labelAr: "اسم العميل", type: "text", required: true, placeholder: "e.g. Saudi Aramco" },
      { key: "service", label: "Service / Product", labelAr: "الخدمة / المنتج", type: "text", required: true, placeholder: "e.g. IT Infrastructure Consulting" },
      { key: "amount", label: "Quoted Amount (SAR)", labelAr: "المبلغ المقتبس (ريال)", type: "number", required: true, placeholder: "e.g. 75000" },
      { key: "validity", label: "Validity (days)", labelAr: "صلاحية العرض (أيام)", type: "select", options: ["15", "30", "45", "60", "90"], required: true },
      { key: "notes", label: "Special Terms / Notes", labelAr: "الشروط الخاصة / ملاحظات", type: "text", required: false, placeholder: "e.g. Includes 3 months support" },
    ],
    confirmTemplate: (f) => `**Sales Quotation Summary**\n\n- **Client:** ${f.client}\n- **Service:** ${f.service}\n- **Amount:** SAR ${Number(f.amount).toLocaleString()}\n- **Validity:** ${f.validity} days\n- **Notes:** ${f.notes || "None"}\n\nShall I create this quotation in Odoo?`,
    executeMessage: (f) => `✅ **QUO-${Math.floor(Math.random() * 9000) + 1000} Created** in Odoo 19 CRM\n\n- Quotation PDF generated\n- Client email drafted\n- CRM pipeline updated\n- ${Number(f.amount) >= 50000 ? "Escalated to management review (above SAR 50,000)" : "Ready to send to client"}`,
    syncTargets: ["CRM Module", "KPI Dashboard", "ERP / Odoo"],
  },
  APPROVE_LEAVE: {
    type: "APPROVE_LEAVE",
    title: "Process Leave Request",
    titleAr: "معالجة طلب إجازة",
    module: "HR System",
    icon: "🏖️",
    integration: "OrangeHRM REST API",
    fields: [
      { key: "employee", label: "Employee Name", labelAr: "اسم الموظف", type: "text", required: true, placeholder: "e.g. Ahmed Al-Rashidi" },
      { key: "leave_type", label: "Leave Type", labelAr: "نوع الإجازة", type: "select", options: ["Annual Leave", "Sick Leave", "Emergency Leave", "Unpaid Leave", "Hajj Leave"], required: true },
      { key: "start_date", label: "Start Date", labelAr: "تاريخ البداية", type: "date", required: true },
      { key: "end_date", label: "End Date", labelAr: "تاريخ النهاية", type: "date", required: true },
      { key: "reason", label: "Reason / Notes", labelAr: "السبب / ملاحظات", type: "text", required: false, placeholder: "Optional" },
    ],
    confirmTemplate: (f) => `**Leave Request Summary**\n\n- **Employee:** ${f.employee}\n- **Type:** ${f.leave_type}\n- **From:** ${f.start_date} → **To:** ${f.end_date}\n- **Reason:** ${f.reason || "Not specified"}\n\nApprove this leave request?`,
    executeMessage: (f) => `✅ **Leave Approved** in OrangeHRM\n\n- ${f.employee}'s ${f.leave_type} recorded\n- HR calendar updated\n- Employee notified via email\n- Payroll module flagged for ${f.leave_type === "Unpaid Leave" ? "deduction" : "no deduction"}`,
    syncTargets: ["HR System", "KPI Dashboard", "Audit Log"],
  },
  CREATE_INVOICE: {
    type: "CREATE_INVOICE",
    title: "Create Customer Invoice",
    titleAr: "إنشاء فاتورة عميل",
    module: "ERP / Accounting",
    icon: "🧾",
    integration: "Odoo 19 Accounting API",
    amgThreshold: 100000,
    fields: [
      { key: "client", label: "Customer Name", labelAr: "اسم العميل", type: "text", required: true, placeholder: "e.g. Ministry of Finance" },
      { key: "description", label: "Service / Item Description", labelAr: "وصف الخدمة / الصنف", type: "text", required: true },
      { key: "amount", label: "Invoice Amount (SAR)", labelAr: "مبلغ الفاتورة (ريال)", type: "number", required: true },
      { key: "due_date", label: "Payment Due Date", labelAr: "تاريخ استحقاق الدفع", type: "date", required: true },
      { key: "vat", label: "VAT Applicable?", labelAr: "هل تنطبق ضريبة القيمة المضافة؟", type: "select", options: ["Yes (15%)", "Yes (5%)", "Zero-rated", "Exempt"], required: true },
    ],
    confirmTemplate: (f) => `**Invoice Summary**\n\n- **Customer:** ${f.client}\n- **Description:** ${f.description}\n- **Amount:** SAR ${Number(f.amount).toLocaleString()}\n- **VAT:** ${f.vat}\n- **Due:** ${f.due_date}\n\nCreate and send this invoice?`,
    executeMessage: (f) => `✅ **INV-${Math.floor(Math.random() * 9000) + 1000} Created** in Odoo 19 Accounting\n\n- ZATCA e-invoice format generated\n- Customer notified\n- Accounts receivable updated\n- KPI revenue dashboard synced`,
    syncTargets: ["ERP / Accounting", "KPI Dashboard", "Audit Log"],
  },
  ADD_EMPLOYEE: {
    type: "ADD_EMPLOYEE",
    title: "Onboard New Employee",
    titleAr: "تأهيل موظف جديد",
    module: "HR System",
    icon: "👤",
    integration: "OrangeHRM REST API",
    fields: [
      { key: "name", label: "Full Name", labelAr: "الاسم الكامل", type: "text", required: true },
      { key: "position", label: "Job Title / Position", labelAr: "المسمى الوظيفي", type: "text", required: true },
      { key: "department", label: "Department", labelAr: "القسم", type: "select", options: ["IT", "Finance", "Operations", "HR", "Legal", "Management", "Sales"], required: true },
      { key: "start_date", label: "Start Date", labelAr: "تاريخ البدء", type: "date", required: true },
      { key: "salary", label: "Monthly Salary (SAR)", labelAr: "الراتب الشهري (ريال)", type: "number", required: true },
    ],
    confirmTemplate: (f) => `**New Employee Onboarding**\n\n- **Name:** ${f.name}\n- **Position:** ${f.position}\n- **Department:** ${f.department}\n- **Start Date:** ${f.start_date}\n- **Salary:** SAR ${Number(f.salary).toLocaleString()}/month\n\nProceed with onboarding?`,
    executeMessage: (f) => `✅ **Employee Profile Created** in OrangeHRM\n\n- Employee ID: EMP-${Math.floor(Math.random() * 9000) + 1000}\n- Welcome email sent to ${f.name}\n- IT access provisioning request sent\n- Payroll module updated\n- HR dashboard synced`,
    syncTargets: ["HR System", "Admin Panel", "KPI Dashboard"],
  },
  LOG_RISK: {
    type: "LOG_RISK",
    title: "Log Risk Item",
    titleAr: "تسجيل بند مخاطرة",
    module: "QMS / Risk",
    icon: "⚠️",
    integration: "NEO Risk Management AI",
    fields: [
      { key: "title", label: "Risk Title", labelAr: "عنوان المخاطرة", type: "text", required: true },
      { key: "category", label: "Risk Category", labelAr: "فئة المخاطرة", type: "select", options: ["Financial", "Operational", "Legal", "IT Security", "Compliance", "Reputational", "Strategic"], required: true },
      { key: "likelihood", label: "Likelihood", labelAr: "الاحتمالية", type: "select", options: ["Low (1)", "Medium (2)", "High (3)", "Critical (4)"], required: true },
      { key: "impact", label: "Impact", labelAr: "الأثر", type: "select", options: ["Low (1)", "Medium (2)", "High (3)", "Critical (4)"], required: true },
      { key: "mitigation", label: "Mitigation Plan", labelAr: "خطة التخفيف", type: "text", required: true },
    ],
    confirmTemplate: (f) => `**Risk Log Entry**\n\n- **Title:** ${f.title}\n- **Category:** ${f.category}\n- **Likelihood:** ${f.likelihood}\n- **Impact:** ${f.impact}\n- **Mitigation:** ${f.mitigation}\n\nLog this risk to the QMS register?`,
    executeMessage: (f) => `✅ **Risk RSK-${Math.floor(Math.random() * 9000) + 1000} Logged** in QMS\n\n- Risk register updated\n- Risk AI analysis complete\n- Mitigation task assigned\n- QMS dashboard refreshed\n- ISO 9001 compliance record updated`,
    syncTargets: ["QMS Module", "Audit Log", "KPI Dashboard"],
  },
  SCHEDULE_MEETING: {
    type: "SCHEDULE_MEETING",
    title: "Schedule Meeting",
    titleAr: "جدولة اجتماع",
    module: "ASTRA Meetings",
    icon: "📅",
    integration: "ASTRA Meeting Assistant",
    fields: [
      { key: "title", label: "Meeting Title", labelAr: "عنوان الاجتماع", type: "text", required: true },
      { key: "attendees", label: "Attendees", labelAr: "الحضور", type: "text", required: true, placeholder: "e.g. Ahmed, Sara, Management Team" },
      { key: "date", label: "Date", labelAr: "التاريخ", type: "date", required: true },
      { key: "duration", label: "Duration", labelAr: "المدة", type: "select", options: ["30 min", "1 hour", "1.5 hours", "2 hours", "Half day"], required: true },
      { key: "agenda", label: "Agenda / Purpose", labelAr: "جدول الأعمال / الغرض", type: "text", required: false },
    ],
    confirmTemplate: (f) => `**Meeting Schedule**\n\n- **Title:** ${f.title}\n- **Attendees:** ${f.attendees}\n- **Date:** ${f.date}\n- **Duration:** ${f.duration}\n- **Agenda:** ${f.agenda || "To be circulated"}\n\nSchedule this meeting?`,
    executeMessage: (f) => `✅ **Meeting MTG-${Math.floor(Math.random() * 9000) + 1000} Scheduled**\n\n- Calendar invites sent to all attendees\n- ASTRA Meeting Assistant activated\n- AI transcription & summary enabled\n- Meeting room booked (if applicable)`,
    syncTargets: ["ASTRA Meetings", "Communications", "KPI Dashboard"],
  },
  CREATE_CONTRACT: {
    type: "CREATE_CONTRACT",
    title: "Draft Legal Contract",
    titleAr: "صياغة عقد قانوني",
    module: "Legal Module",
    icon: "⚖️",
    integration: "NEO Legal AI + OpenContracts",
    amgThreshold: 25000,
    fields: [
      { key: "party", label: "Counterparty Name", labelAr: "اسم الطرف الآخر", type: "text", required: true },
      { key: "contract_type", label: "Contract Type", labelAr: "نوع العقد", type: "select", options: ["Service Agreement", "NDA", "Employment Contract", "Vendor Agreement", "Consultancy Agreement", "MOU"], required: true },
      { key: "value", label: "Contract Value (SAR)", labelAr: "قيمة العقد (ريال)", type: "number", required: false, placeholder: "0 for NDA/MOU" },
      { key: "duration", label: "Duration", labelAr: "المدة", type: "select", options: ["3 months", "6 months", "1 year", "2 years", "3 years", "Indefinite"], required: true },
      { key: "key_terms", label: "Key Terms / Notes", labelAr: "الشروط الرئيسية / ملاحظات", type: "text", required: false },
    ],
    confirmTemplate: (f) => `**Contract Draft Request**\n\n- **Counterparty:** ${f.party}\n- **Type:** ${f.contract_type}\n- **Value:** ${f.value ? `SAR ${Number(f.value).toLocaleString()}` : "N/A"}\n- **Duration:** ${f.duration}\n- **Key Terms:** ${f.key_terms || "Standard terms"}\n\nDraft this contract using NEO Legal AI?`,
    executeMessage: (f) => `✅ **Contract CTR-${Math.floor(Math.random() * 9000) + 1000} Drafted**\n\n- Legal AI generated ${f.contract_type} draft\n- Risk clauses flagged for review\n- Sent to Legal Module for review\n- DocuSeal e-signature workflow initiated\n- Legal register updated`,
    syncTargets: ["Legal Module", "Audit Log", "Governance"],
  },
  SUBMIT_EXPENSE: {
    type: "SUBMIT_EXPENSE",
    title: "Submit Expense Claim",
    titleAr: "تقديم مطالبة مصروفات",
    module: "ERP / Finance",
    icon: "💳",
    integration: "Odoo 19 Expenses API",
    amgThreshold: 5000,
    fields: [
      { key: "description", label: "Expense Description", labelAr: "وصف المصروف", type: "text", required: true, placeholder: "e.g. Client lunch, travel to Riyadh" },
      { key: "category", label: "Category", labelAr: "الفئة", type: "select", options: ["Travel", "Meals & Entertainment", "Office Supplies", "Training", "Marketing", "Other"], required: true },
      { key: "amount", label: "Amount (SAR)", labelAr: "المبلغ (ريال)", type: "number", required: true },
      { key: "date", label: "Expense Date", labelAr: "تاريخ المصروف", type: "date", required: true },
      { key: "receipt", label: "Receipt Reference", labelAr: "مرجع الإيصال", type: "text", required: false, placeholder: "e.g. RCP-2026-001" },
    ],
    confirmTemplate: (f) => `**Expense Claim Summary**\n\n- **Description:** ${f.description}\n- **Category:** ${f.category}\n- **Amount:** SAR ${Number(f.amount).toLocaleString()}\n- **Date:** ${f.date}\n- **Receipt:** ${f.receipt || "To be attached"}\n\nSubmit this expense claim?`,
    executeMessage: (f) => `✅ **Expense EXP-${Math.floor(Math.random() * 9000) + 1000} Submitted**\n\n- Expense logged in Odoo Finance\n- ${Number(f.amount) >= 5000 ? "Manager approval requested (above SAR 5,000)" : "Auto-approved for processing"}\n- Finance dashboard updated\n- Reimbursement scheduled`,
    syncTargets: ["ERP / Accounting", "KPI Dashboard", "Audit Log"],
  },
  OPEN_TICKET: {
    type: "OPEN_TICKET",
    title: "Open IT Support Ticket",
    titleAr: "فتح تذكرة دعم تقني",
    module: "IT Solutions",
    icon: "🎫",
    integration: "IT Helpdesk System",
    fields: [
      { key: "title", label: "Issue Title", labelAr: "عنوان المشكلة", type: "text", required: true, placeholder: "e.g. Cannot access Odoo ERP" },
      { key: "priority", label: "Priority", labelAr: "الأولوية", type: "select", options: ["Low", "Medium", "High", "Critical"], required: true },
      { key: "category", label: "Category", labelAr: "الفئة", type: "select", options: ["Software", "Hardware", "Network", "Access & Permissions", "Email", "Other"], required: true },
      { key: "description", label: "Detailed Description", labelAr: "الوصف التفصيلي", type: "text", required: true },
    ],
    confirmTemplate: (f) => `**IT Support Ticket**\n\n- **Issue:** ${f.title}\n- **Priority:** ${f.priority}\n- **Category:** ${f.category}\n- **Description:** ${f.description}\n\nSubmit this support ticket?`,
    executeMessage: (f) => `✅ **Ticket TKT-${Math.floor(Math.random() * 9000) + 1000} Created**\n\n- IT team notified (${f.priority} priority)\n- SLA timer started: ${f.priority === "Critical" ? "2 hours" : f.priority === "High" ? "4 hours" : "24 hours"}\n- Ticket tracking link sent to your email\n- IT dashboard updated`,
    syncTargets: ["IT Helpdesk", "Audit Log"],
  },
};

// Intent detection: map natural language phrases to transaction types
export const INTENT_PATTERNS: Array<{ patterns: RegExp[]; type: TransactionType }> = [
  { patterns: [/purchase order|PO|buy|procurement|supplier|vendor/i], type: "CREATE_PO" },
  { patterns: [/quote|quotation|proposal|offer price|sales offer/i], type: "CREATE_QUOTE" },
  { patterns: [/leave|vacation|day off|absence|holiday/i], type: "APPROVE_LEAVE" },
  { patterns: [/invoice|bill|charge|billing/i], type: "CREATE_INVOICE" },
  { patterns: [/new employee|hire|onboard|recruit|join/i], type: "ADD_EMPLOYEE" },
  { patterns: [/risk|hazard|threat|vulnerability/i], type: "LOG_RISK" },
  { patterns: [/meeting|schedule|appointment|call|session/i], type: "SCHEDULE_MEETING" },
  { patterns: [/contract|agreement|NDA|legal document|MOU/i], type: "CREATE_CONTRACT" },
  { patterns: [/expense|claim|reimburse|receipt|spend/i], type: "SUBMIT_EXPENSE" },
  { patterns: [/ticket|support|IT issue|bug|help desk|problem/i], type: "OPEN_TICKET" },
];

export function detectIntent(text: string): TransactionType | null {
  for (const { patterns, type } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return null;
}

export interface TransactionState {
  id: string;
  type: TransactionType;
  stage: TransactionStage;
  fields: Record<string, string>;
  currentFieldIndex: number;
  amgRequired: boolean;
  amgApproved: boolean;
  startedAt: Date;
}

export function createTransaction(type: TransactionType): TransactionState {
  return {
    id: `TXN-${Date.now()}`,
    type,
    stage: "DATA",
    fields: {},
    currentFieldIndex: 0,
    amgRequired: false,
    amgApproved: false,
    startedAt: new Date(),
  };
}

export function getNextQuestion(state: TransactionState): string | null {
  const def = TRANSACTION_DEFINITIONS[state.type];
  const requiredFields = def.fields.filter((f) => f.required);
  const nextField = requiredFields.find((f) => !state.fields[f.key]);
  if (!nextField) return null;
  return `**${nextField.label}**\n${nextField.placeholder ? `_(e.g. ${nextField.placeholder})_` : ""}`;
}

export function getNextFieldKey(state: TransactionState): string | null {
  const def = TRANSACTION_DEFINITIONS[state.type];
  const requiredFields = def.fields.filter((f) => f.required);
  const nextField = requiredFields.find((f) => !state.fields[f.key]);
  return nextField?.key ?? null;
}

export function isDataComplete(state: TransactionState): boolean {
  const def = TRANSACTION_DEFINITIONS[state.type];
  return def.fields.filter((f) => f.required).every((f) => !!state.fields[f.key]);
}

export function checkAMGRequired(state: TransactionState): boolean {
  const def = TRANSACTION_DEFINITIONS[state.type];
  if (!def.amgThreshold) return false;
  const amount = Number(state.fields["amount"] || state.fields["value"] || state.fields["salary"] || 0);
  return amount >= def.amgThreshold;
}

export function buildConfirmMessage(state: TransactionState): string {
  const def = TRANSACTION_DEFINITIONS[state.type];
  return def.confirmTemplate(state.fields);
}

export function buildExecuteMessage(state: TransactionState): string {
  const def = TRANSACTION_DEFINITIONS[state.type];
  return def.executeMessage(state.fields);
}

export function getAMGMessage(state: TransactionState): string {
  const def = TRANSACTION_DEFINITIONS[state.type];
  const amount = Number(state.fields["amount"] || state.fields["value"] || state.fields["salary"] || 0);
  return `🔐 **ASTRA AMG Governance Check**\n\nThis transaction requires management approval:\n\n- **Transaction:** ${def.title}\n- **Amount:** SAR ${amount.toLocaleString()}\n- **Threshold:** SAR ${def.amgThreshold?.toLocaleString()}\n- **Authority Required:** Department Manager or above\n\nApproval request sent to your line manager. Would you like to proceed with pending approval, or cancel?`;
}
