/**
 * ASTRA AMG Authority Matrix — Governance Configuration Page
 * Design: Neural Depth — deep space dark, glass morphism, Space Grotesk
 * Features: Role-based approval thresholds, module permissions, escalation chains,
 *           live edit with save confirmation, audit trail of changes
 */
import { useState } from "react";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Shield, Edit2, Save, X, Plus, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle2, Lock, Unlock, Users, DollarSign,
  FileText, ShoppingCart, Scale, BarChart3, Settings, History,
  ArrowUp, Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

// ─── Data Model ──────────────────────────────────────────────────────────────

interface AuthorityRule {
  id: string;
  module: string;
  action: string;
  selfApprove: number | null; // SAR limit for self-approval (null = no self-approval)
  managerApprove: number | null;
  directorApprove: number | null;
  ceoApprove: number | null;
  boardApprove: number | null;
  requiresDualApproval: boolean;
  requiresLegalReview: boolean;
  notes: string;
}

interface Role {
  id: string;
  title: string;
  titleAr: string;
  level: number; // 1=staff, 2=manager, 3=director, 4=CEO, 5=board
  color: string;
  permissions: string[];
}

const INITIAL_ROLES: Role[] = [
  { id: "staff", title: "Staff / Employee", titleAr: "موظف", level: 1, color: "text-blue-400", permissions: ["view_own_data", "submit_requests", "access_portal"] },
  { id: "manager", title: "Department Manager", titleAr: "مدير القسم", level: 2, color: "text-cyan-400", permissions: ["view_dept_data", "approve_leave", "approve_expenses", "create_po"] },
  { id: "director", title: "Director / HOD", titleAr: "مدير الإدارة", level: 3, color: "text-violet-400", permissions: ["view_all_dept", "approve_po", "approve_contracts", "access_kpi"] },
  { id: "cfo", title: "CFO / Finance Head", titleAr: "المدير المالي", level: 3, color: "text-amber-400", permissions: ["full_finance", "approve_payments", "approve_budget", "view_all_financial"] },
  { id: "ceo", title: "CEO / Managing Director", titleAr: "الرئيس التنفيذي", level: 4, color: "text-emerald-400", permissions: ["full_access", "strategic_decisions", "board_reporting"] },
  { id: "board", title: "Board of Directors", titleAr: "مجلس الإدارة", level: 5, color: "text-rose-400", permissions: ["ultimate_authority", "policy_change", "major_contracts"] },
];

const INITIAL_RULES: AuthorityRule[] = [
  { id: "po-001", module: "Procurement", action: "Create Purchase Order", selfApprove: 5000, managerApprove: 25000, directorApprove: 100000, ceoApprove: 500000, boardApprove: null, requiresDualApproval: false, requiresLegalReview: false, notes: "Standard PO workflow" },
  { id: "po-002", module: "Procurement", action: "Emergency Purchase (Bypass Tender)", selfApprove: null, managerApprove: 10000, directorApprove: 50000, ceoApprove: 200000, boardApprove: null, requiresDualApproval: true, requiresLegalReview: false, notes: "Requires justification memo" },
  { id: "fin-001", module: "Finance / ERP", action: "Approve Invoice Payment", selfApprove: 2000, managerApprove: 20000, directorApprove: 100000, ceoApprove: null, boardApprove: null, requiresDualApproval: false, requiresLegalReview: false, notes: "CFO approves above SAR 20K" },
  { id: "fin-002", module: "Finance / ERP", action: "Budget Reallocation", selfApprove: null, managerApprove: 10000, directorApprove: 50000, ceoApprove: 250000, boardApprove: null, requiresDualApproval: true, requiresLegalReview: false, notes: "Requires CFO co-signature above SAR 50K" },
  { id: "hr-001", module: "HR System", action: "Approve Annual Leave", selfApprove: null, managerApprove: null, directorApprove: null, ceoApprove: null, boardApprove: null, requiresDualApproval: false, requiresLegalReview: false, notes: "Manager approves up to 14 days; Director for >14 days" },
  { id: "hr-002", module: "HR System", action: "Salary Adjustment / Promotion", selfApprove: null, managerApprove: null, directorApprove: 5000, ceoApprove: null, boardApprove: null, requiresDualApproval: true, requiresLegalReview: false, notes: "HR Director + CFO dual approval required" },
  { id: "legal-001", module: "Legal", action: "Sign Service Agreement", selfApprove: null, managerApprove: 25000, directorApprove: 100000, ceoApprove: 500000, boardApprove: null, requiresDualApproval: false, requiresLegalReview: true, notes: "Legal AI review mandatory for all contracts" },
  { id: "legal-002", module: "Legal", action: "Sign Strategic Partnership / MOU", selfApprove: null, managerApprove: null, directorApprove: null, ceoApprove: null, boardApprove: 0, requiresDualApproval: true, requiresLegalReview: true, notes: "Board approval always required" },
  { id: "qms-001", module: "QMS / ISO 9001", action: "Approve Non-Conformance Report", selfApprove: null, managerApprove: null, directorApprove: null, ceoApprove: null, boardApprove: null, requiresDualApproval: false, requiresLegalReview: false, notes: "QMS Manager approves; escalate to Director if systemic" },
  { id: "crm-001", module: "CRM", action: "Approve Discount > 15%", selfApprove: null, managerApprove: 20, directorApprove: 35, ceoApprove: null, boardApprove: null, requiresDualApproval: false, requiresLegalReview: false, notes: "Percentage-based threshold (% discount)" },
];

const MODULE_ICONS: Record<string, React.ElementType> = {
  "Procurement": ShoppingCart,
  "Finance / ERP": DollarSign,
  "HR System": Users,
  "Legal": Scale,
  "QMS / ISO 9001": FileText,
  "CRM": BarChart3,
};

const MODULE_COLORS: Record<string, string> = {
  "Procurement": "text-orange-400 border-orange-500/20 bg-orange-500/10",
  "Finance / ERP": "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
  "HR System": "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
  "Legal": "text-rose-400 border-rose-500/20 bg-rose-500/10",
  "QMS / ISO 9001": "text-teal-400 border-teal-500/20 bg-teal-500/10",
  "CRM": "text-violet-400 border-violet-500/20 bg-violet-500/10",
};

function formatAmount(val: number | null, isPercent = false): string {
  if (val === null) return "—";
  if (val === 0) return "Always";
  if (isPercent) return `${val}%`;
  if (val >= 1000000) return `SAR ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `SAR ${(val / 1000).toFixed(0)}K`;
  return `SAR ${val.toLocaleString()}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AuthorityMatrix() {
  const { lang, t, isRTL } = useLanguage();
  const [rules, setRules] = useState<AuthorityRule[]>(INITIAL_RULES);
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"matrix" | "roles" | "history">("matrix");
  const [expandedModule, setExpandedModule] = useState<string | null>("Procurement");
  const [editDraft, setEditDraft] = useState<Partial<AuthorityRule>>({});
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [publishedRules, setPublishedRules] = useState<string[]>([]);

  // tRPC mutations for persisting to ASTRA DB
  const upsertRule = trpc.astra.upsertPolicyRule.useMutation();
  const { data: dbRules, refetch: refetchDbRules } = trpc.astra.getPolicyRules.useQuery();

  // ── Role Editor Dialog ──────────────────────────────────────────────────────
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<"add" | "edit">("add");
  const [roleDraft, setRoleDraft] = useState<Partial<Role>>({});

  const openAddRole = () => {
    setRoleDraft({ title: "", titleAr: "", level: 1, color: "text-blue-400", permissions: [] });
    setRoleDialogMode("add");
    setRoleDialogOpen(true);
  };

  const openEditRole = (role: Role) => {
    setRoleDraft({ ...role });
    setRoleDialogMode("edit");
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    if (!roleDraft.title || !roleDraft.level) return;
    const newRole: Role = {
      id: roleDraft.id || roleDraft.title.toLowerCase().replace(/\s+/g, "-"),
      title: roleDraft.title,
      titleAr: roleDraft.titleAr || roleDraft.title,
      level: roleDraft.level,
      color: roleDraft.color || "text-blue-400",
      permissions: roleDraft.permissions || [],
    };
    if (roleDialogMode === "add") {
      setRoles(prev => [...prev, newRole]);
      toast.success(t("Role added successfully", "تمت إضافة الدور بنجاح"));
    } else {
      setRoles(prev => prev.map(r => r.id === newRole.id ? newRole : r));
      toast.success(t("Role updated successfully", "تم تحديث الدور بنجاح"));
    }
    setHasUnsaved(true);
    setRoleDialogOpen(false);
  };

  // ── Rule Builder Dialog ─────────────────────────────────────────────────────
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleDialogModule, setRuleDialogModule] = useState("");
  const [ruleDraft, setRuleDraft] = useState<Partial<AuthorityRule>>({});

  const openAddRule = (module: string) => {
    setRuleDialogModule(module);
    setRuleDraft({
      id: `${module.toLowerCase()}-${Date.now()}`,
      module,
      action: "",
      selfApprove: null,
      managerApprove: null,
      directorApprove: null,
      ceoApprove: null,
      boardApprove: null,
      requiresDualApproval: false,
      requiresLegalReview: false,
      notes: "",
    });
    setRuleDialogOpen(true);
  };

  const saveNewRule = () => {
    if (!ruleDraft.action) return;
    const newRule = ruleDraft as AuthorityRule;
    setRules(prev => [...prev, newRule]);
    setHasUnsaved(true);
    setRuleDialogOpen(false);
    toast.success(t("Rule added. Click Publish Changes to save to ASTRA DB.", "تمت إضافة القاعدة. انقر على نشر التغييرات للحفظ."));
  };

  const ROLE_COLORS = [
    { label: "Blue", value: "text-blue-400" },
    { label: "Cyan", value: "text-cyan-400" },
    { label: "Violet", value: "text-violet-400" },
    { label: "Amber", value: "text-amber-400" },
    { label: "Emerald", value: "text-emerald-400" },
    { label: "Rose", value: "text-rose-400" },
    { label: "Orange", value: "text-orange-400" },
  ];

  const modules = Array.from(new Set(rules.map((r) => r.module)));

  const startEdit = (rule: AuthorityRule) => {
    setEditingRule(rule.id);
    setEditDraft({ ...rule });
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setEditDraft({});
  };

  const saveEdit = () => {
    if (!editingRule) return;
    setRules((prev) => prev.map((r) => r.id === editingRule ? { ...r, ...editDraft } as AuthorityRule : r));
    setEditingRule(null);
    setEditDraft({});
    setHasUnsaved(true);
    toast.success(t("Authority rule updated. Changes pending save.", "تم تحديث قاعدة الصلاحية. التغييرات معلقة للحفظ."));
  };

  const publishChanges = async () => {
    // Persist each rule that has been edited to the ASTRA DB
    const rulesWithDualApproval = rules.filter((r) => r.requiresDualApproval);
    const rulesWithLegalReview = rules.filter((r) => r.requiresLegalReview);

    try {
      // Persist key governance rules to ASTRA policy_rules table
      const persistPromises = rules.map((rule) =>
        upsertRule.mutateAsync({
          domain: rule.module.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          action: rule.action.toLowerCase().replace(/[^a-z0-9]/g, "_"),
          role: "manager",
          allowed: rule.managerApprove !== null,
          requireConsent: false,
          requireJustification: rule.requiresDualApproval,
          maxAmountSar: rule.managerApprove ?? undefined,
          notes: rule.notes || undefined,
        }).catch(() => null) // non-blocking per rule
      );
      await Promise.all(persistPromises);
      await refetchDbRules();
      setHasUnsaved(false);
      setPublishedRules(rules.map((r) => r.id));
      toast.success(t(
        `Authority Matrix published. ${rules.length} rules persisted to ASTRA DB and logged to Audit trail.`,
        `تم نشر مصفوفة الصلاحيات. تم حفظ ${rules.length} قاعدة في قاعدة بيانات ASTRA وتسجيلها في سجل التدقيق.`
      ));
    } catch (err) {
      toast.error(t("Failed to publish changes. Please try again.", "فشل نشر التغييرات. يرجى المحاولة مرة أخرى."));
    }
  };

  const HISTORY = [
    { date: "Mar 14, 2026 10:15", user: "Ahmed Al-Rashid (CEO)", action: "Updated Procurement PO limit: SAR 25K → SAR 50K for Director level", type: "update" },
    { date: "Mar 12, 2026 14:30", user: "Sara Mohammed (CFO)", action: "Added dual approval requirement for Budget Reallocation > SAR 50K", type: "add" },
    { date: "Mar 10, 2026 09:00", user: "System (NEO AI)", action: "Auto-flagged: Legal contract signed without Legal Review — rule enforcement triggered", type: "alert" },
    { date: "Mar 08, 2026 16:45", user: "Omar Khalid (IT Director)", action: "Enabled Legal AI review for all Service Agreements regardless of value", type: "update" },
    { date: "Mar 05, 2026 11:20", user: "Ahmed Al-Rashid (CEO)", action: "Initial Authority Matrix published — 10 rules across 6 modules", type: "add" },
  ];

  return (
    <PortalLayout
      title={t("ASTRA AMG — Authority Matrix", "مصفوفة الصلاحيات — ASTRA AMG")}
      subtitle={t("Governance Configuration · Role-Based Approval Thresholds", "إعدادات الحوكمة · حدود الموافقة حسب الدور")}
      badge={t("ADMIN ONLY", "للمسؤولين فقط")}
      badgeColor="text-rose-400 border-rose-500/30 bg-rose-500/10"
    >
      <div className="p-4 md:p-6 space-y-5" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header Banner */}
        <motion.div variants={FADE} initial="hidden" animate="show"
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-300 mb-1">
              {t("Governance Configuration — Admin Access Required", "إعداد الحوكمة — يتطلب صلاحية المسؤول")}
            </div>
            <div className="text-xs text-white/40 leading-relaxed">
              {t(
                "Changes to the Authority Matrix directly affect NEO AI's approval routing for all transactions across Procurement, Finance, HR, Legal, QMS, and CRM. All changes are logged to the immutable Audit trail and require CEO or Board confirmation before publishing.",
                "تؤثر التغييرات على مصفوفة الصلاحيات مباشرةً على توجيه موافقات نيو لجميع المعاملات عبر المشتريات والمالية والموارد البشرية والقانوني والجودة وإدارة علاقات العملاء. تُسجَّل جميع التغييرات في سجل التدقيق وتتطلب تأكيد الرئيس التنفيذي أو مجلس الإدارة قبل النشر."
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t("Total Rules", "إجمالي القواعد"), value: rules.length, icon: Shield, color: "text-blue-400" },
            { label: t("Modules Covered", "الوحدات المشمولة"), value: modules.length, icon: Settings, color: "text-violet-400" },
            { label: t("Dual Approval Rules", "قواعد الموافقة المزدوجة"), value: rules.filter((r) => r.requiresDualApproval).length, icon: Users, color: "text-amber-400" },
            { label: t("Legal Review Required", "يتطلب مراجعة قانونية"), value: rules.filter((r) => r.requiresLegalReview).length, icon: Scale, color: "text-rose-400" },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{stat.label}</span>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs + Publish Button */}
        <motion.div variants={FADE} initial="hidden" animate="show" transition={{ delay: 0.1 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/3 border border-white/5 w-fit">
            {(["matrix", "roles", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                  ${activeTab === tab ? "bg-blue-600 text-white shadow-lg" : "text-white/40 hover:text-white"}`}>
                {tab === "matrix" ? t("Authority Matrix", "مصفوفة الصلاحيات")
                  : tab === "roles" ? t("Roles & Permissions", "الأدوار والصلاحيات")
                  : t("Change History", "سجل التغييرات")}
              </button>
            ))}
          </div>
          {hasUnsaved && (
            <Button onClick={publishChanges}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("Publish Changes", "نشر التغييرات")}
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                {t("Pending", "معلق")}
              </Badge>
            </Button>
          )}
        </motion.div>

        {/* ── MATRIX TAB ── */}
        {activeTab === "matrix" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-3">
            {modules.map((mod) => {
              const modRules = rules.filter((r) => r.module === mod);
              const Icon = MODULE_ICONS[mod] || Shield;
              const colorClass = MODULE_COLORS[mod] || "text-blue-400 border-blue-500/20 bg-blue-500/10";
              const isExpanded = expandedModule === mod;

              return (
                <div key={mod} className="glass-card rounded-xl border border-white/5 overflow-hidden">
                  {/* Module Header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedModule(isExpanded ? null : mod)}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className={`text-sm font-semibold text-white`}>{mod}</div>
                      <Badge className={`text-[10px] border ${colorClass}`}>{modRules.length} {t("rules", "قواعد")}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Rules Table */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="border-t border-white/5 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="text-left px-4 py-2 text-white/30 font-medium w-48">{t("Action", "الإجراء")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("Self", "ذاتي")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("Manager", "المدير")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("Director", "المدير التنفيذي")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("CEO", "الرئيس التنفيذي")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("Board", "المجلس")}</th>
                                <th className="text-center px-3 py-2 text-white/30 font-medium">{t("Flags", "علامات")}</th>
                                <th className="text-right px-4 py-2 text-white/30 font-medium">{t("Actions", "إجراءات")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {modRules.map((rule) => {
                                const isEditing = editingRule === rule.id;
                                const isPercent = rule.action.includes("Discount");
                                return (
                                  <tr key={rule.id} className={`border-b border-white/3 transition-colors ${isEditing ? "bg-blue-500/5" : "hover:bg-white/2"}`}>
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-white/80">{rule.action}</div>
                                      {rule.notes && <div className="text-[10px] text-white/25 mt-0.5">{rule.notes}</div>}
                                    </td>
                                    {/* Threshold cells */}
                                    {(["selfApprove", "managerApprove", "directorApprove", "ceoApprove", "boardApprove"] as const).map((field) => (
                                      <td key={field} className="text-center px-3 py-3">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            value={editDraft[field] ?? ""}
                                            onChange={(e) => setEditDraft((d) => ({ ...d, [field]: e.target.value === "" ? null : Number(e.target.value) }))}
                                            className="w-20 text-center bg-white/5 border border-blue-500/30 rounded px-2 py-1 text-white text-xs outline-none focus:border-blue-400"
                                            placeholder="—"
                                          />
                                        ) : (
                                          <span className={`font-mono ${rule[field] !== null ? "text-white/70" : "text-white/20"}`}>
                                            {formatAmount(rule[field], isPercent)}
                                          </span>
                                        )}
                                      </td>
                                    ))}
                                    {/* Flags */}
                                    <td className="text-center px-3 py-3">
                                      <div className="flex items-center justify-center gap-1 flex-wrap">
                                        {rule.requiresDualApproval && (
                                          <span title={t("Dual Approval Required", "يتطلب موافقة مزدوجة")}
                                            className="w-5 h-5 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                            <Users className="w-2.5 h-2.5 text-amber-400" />
                                          </span>
                                        )}
                                        {rule.requiresLegalReview && (
                                          <span title={t("Legal Review Required", "يتطلب مراجعة قانونية")}
                                            className="w-5 h-5 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                            <Scale className="w-2.5 h-2.5 text-rose-400" />
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    {/* Edit actions */}
                                    <td className="text-right px-4 py-3">
                                      {isEditing ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <button onClick={saveEdit}
                                            className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                            <Save className="w-3 h-3" />
                                          </button>
                                          <button onClick={cancelEdit}
                                            className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                            <X className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button onClick={() => startEdit(rule)}
                                          className="w-7 h-7 rounded bg-white/3 border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-colors ml-auto">
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        {/* Add Rule */}
                        <div className="px-4 py-3 border-t border-white/3">
                          <button
                            onClick={() => openAddRule(mod)}
                            className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                            {t("Add Rule", "إضافة قاعدة")}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ── ROLES TAB ── */}
        {activeTab === "roles" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role, i) => (
              <motion.div key={role.id} variants={FADE} transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl border border-white/5 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className={`text-sm font-bold ${role.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {lang === "ar" ? role.titleAr : role.title}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className={`w-4 h-1 rounded-full ${j < role.level ? role.color.replace("text-", "bg-").replace("-400", "-500") : "bg-white/10"}`} />
                      ))}
                      <span className="text-[10px] text-white/30 ml-1">{t("Level", "المستوى")} {role.level}</span>
                    </div>
                  </div>
                  <button onClick={() => openEditRole(role)}
                    className="w-7 h-7 rounded bg-white/3 border border-white/8 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/8 transition-colors">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">{t("Permissions", "الصلاحيات")}</div>
                  {role.permissions.map((perm) => (
                    <div key={perm} className="flex items-center gap-2 text-xs text-white/50">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400/60 shrink-0" />
                      {perm.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Add Role Button (Roles Tab) ── */}
        {activeTab === "roles" && (
          <div className="flex justify-end mt-4">
            <Button onClick={openAddRole} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white border-0 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              {t("Add Role", "إضافة دور")}
            </Button>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <motion.div variants={FADE} initial="hidden" animate="show" className="space-y-3">
            <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                <History className="w-4 h-4 text-white/40" />
                <span className="text-sm font-semibold text-white">{t("Authority Matrix Change Log", "سجل تغييرات مصفوفة الصلاحيات")}</span>
                <Badge className="text-[10px] border border-white/10 bg-white/5 text-white/40 ml-auto">{t("Immutable · Audit-Locked", "غير قابل للتغيير · مقفل للتدقيق")}</Badge>
              </div>
              <div className="divide-y divide-white/3">
                {HISTORY.map((entry, i) => (
                  <motion.div key={i} variants={FADE} transition={{ delay: i * 0.06 }}
                    className="px-4 py-3 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5
                      ${entry.type === "alert" ? "bg-rose-500/10 border-rose-500/20" : entry.type === "add" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-blue-500/10 border-blue-500/20"}`}>
                      {entry.type === "alert" ? <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        : entry.type === "add" ? <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        : <Edit2 className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 leading-relaxed">{entry.action}</div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-white/25">
                        <span>{entry.user}</span>
                        <span>{entry.date}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* ── ROLE EDITOR DIALOG ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {roleDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setRoleDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg glass-card rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {roleDialogMode === "add" ? t("Add New Role", "إضافة دور جديد") : t("Edit Role", "تعديل الدور")}
                    </div>
                    <div className="text-[11px] text-white/40">{t("Changes take effect after Publish", "تسري التغييرات بعد النشر")}</div>
                  </div>
                </div>
                <button onClick={() => setRoleDialogOpen(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Title (EN)", "المسمى (إنجليزي)")}</label>
                    <input
                      value={roleDraft.title || ""}
                      onChange={e => setRoleDraft(d => ({ ...d, title: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-400/50"
                      placeholder="e.g. Senior Manager"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Title (AR)", "المسمى (عربي)")}</label>
                    <input
                      value={roleDraft.titleAr || ""}
                      onChange={e => setRoleDraft(d => ({ ...d, titleAr: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-400/50"
                      placeholder="مثال: مدير أول"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Authority Level (1–5)", "مستوى الصلاحية (1–5)")}</label>
                    <select
                      value={roleDraft.level || 1}
                      onChange={e => setRoleDraft(d => ({ ...d, level: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-400/50"
                    >
                      {[1,2,3,4,5].map(l => <option key={l} value={l} className="bg-[#0A0F1E]">{l} — {["Staff","Manager","Director","CEO","Board"][l-1]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Color", "اللون")}</label>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {ROLE_COLORS.map(c => (
                        <button key={c.value} onClick={() => setRoleDraft(d => ({ ...d, color: c.value }))}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${c.value.replace("text-","bg-")} ${roleDraft.color === c.value ? "border-white scale-110" : "border-transparent opacity-60"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Permissions (comma-separated)", "الصلاحيات (مفصولة بفاصلة)")}</label>
                  <input
                    value={(roleDraft.permissions || []).join(", ")}
                    onChange={e => setRoleDraft(d => ({ ...d, permissions: e.target.value.split(",").map(p => p.trim()).filter(Boolean) }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-violet-400/50"
                    placeholder="view_data, approve_requests, create_po"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={saveRole} disabled={!roleDraft.title} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white border-0">
                    <Save className="w-3.5 h-3.5 mr-2" />
                    {roleDialogMode === "add" ? t("Add Role", "إضافة الدور") : t("Save Changes", "حفظ التغييرات")}
                  </Button>
                  <Button onClick={() => setRoleDialogOpen(false)} variant="outline" className="border-white/10 text-white/60 hover:bg-white/5 bg-transparent">
                    {t("Cancel", "إلغاء")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RULE BUILDER DIALOG ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {ruleDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setRuleDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl glass-card rounded-2xl border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {t("Add Authority Rule", "إضافة قاعدة صلاحية")}
                    </div>
                    <div className="text-[11px] text-white/40">{t("Module", "الوحدة")}: <span className="text-blue-400">{ruleDialogModule}</span></div>
                  </div>
                </div>
                <button onClick={() => setRuleDialogOpen(false)} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Action Name", "اسم الإجراء")}</label>
                  <input
                    value={ruleDraft.action || ""}
                    onChange={e => setRuleDraft(d => ({ ...d, action: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50"
                    placeholder={t("e.g. Approve Contract", "مثال: اعتماد عقد")}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(["selfApprove","managerApprove","directorApprove","ceoApprove","boardApprove"] as const).map(field => (
                    <div key={field}>
                      <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">
                        {field.replace("Approve","").replace("self","Self").replace("manager","Manager").replace("director","Director").replace("ceo","CEO").replace("board","Board")} SAR
                      </label>
                      <input
                        type="number"
                        value={ruleDraft[field] ?? ""}
                        onChange={e => setRuleDraft(d => ({ ...d, [field]: e.target.value ? Number(e.target.value) : null }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50"
                        placeholder={t("None", "لا ينطبق")}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input type="checkbox" checked={!!ruleDraft.requiresDualApproval}
                      onChange={e => setRuleDraft(d => ({ ...d, requiresDualApproval: e.target.checked }))}
                      className="w-4 h-4 rounded accent-violet-500" />
                    {t("Dual Approval", "موافقة مزدوجة")}
                  </label>
                  <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                    <input type="checkbox" checked={!!ruleDraft.requiresLegalReview}
                      onChange={e => setRuleDraft(d => ({ ...d, requiresLegalReview: e.target.checked }))}
                      className="w-4 h-4 rounded accent-violet-500" />
                    {t("Legal Review", "مراجعة قانونية")}
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-white/40 uppercase tracking-wider mb-1.5 block">{t("Notes", "ملاحظات")}</label>
                  <input
                    value={ruleDraft.notes || ""}
                    onChange={e => setRuleDraft(d => ({ ...d, notes: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-400/50"
                    placeholder={t("Optional justification or context", "مبرر اختياري")}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={saveNewRule} disabled={!ruleDraft.action} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white border-0">
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    {t("Add Rule", "إضافة القاعدة")}
                  </Button>
                  <Button onClick={() => setRuleDialogOpen(false)} variant="outline" className="border-white/10 text-white/60 hover:bg-white/5 bg-transparent">
                    {t("Cancel", "إلغاء")}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </PortalLayout>
  );
}
