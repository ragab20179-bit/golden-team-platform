/**
 * Requests & Approvals — M3 of Phase 2
 * Design: "Neural Depth" — consistent with portal style
 * Features:
 *   - Submit new request (leave, purchase, contract, travel, expense, IT access, HR change, custom)
 *   - My Requests list with status tracking
 *   - Pending Approvals dashboard (for approvers)
 *   - Request detail view with approval chain timeline
 *   - ASTRA AMG authority matrix enforcement feedback
 *   - Full bilingual Arabic/English + RTL
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ClipboardList, Plus, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronRight, FileText, DollarSign, Users, Plane, Receipt,
  Monitor, UserCog, Layers, ArrowRight, Eye, ThumbsUp, ThumbsDown,
  RefreshCw, Shield, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = "leave" | "purchase" | "contract" | "travel" | "expense" | "it_access" | "hr_change" | "custom";
type Priority = "low" | "normal" | "high" | "urgent";
type Status = "draft" | "pending" | "in_review" | "approved" | "rejected" | "cancelled";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REQUEST_TYPE_ICONS: Record<RequestType, React.ElementType> = {
  leave: Users,
  purchase: DollarSign,
  contract: FileText,
  travel: Plane,
  expense: Receipt,
  it_access: Monitor,
  hr_change: UserCog,
  custom: Layers,
};

const STATUS_COLORS: Record<Status, string> = {
  draft:     "bg-slate-500/20 text-slate-300 border-slate-500/30",
  pending:   "bg-amber-500/20 text-amber-300 border-amber-500/30",
  in_review: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  approved:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected:  "bg-red-500/20 text-red-300 border-red-500/30",
  cancelled: "bg-slate-600/20 text-slate-400 border-slate-600/30",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low:    "bg-slate-500/20 text-slate-300",
  normal: "bg-blue-500/20 text-blue-300",
  high:   "bg-amber-500/20 text-amber-300",
  urgent: "bg-red-500/20 text-red-300",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Requests() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<"my" | "approvals">("my");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionRequestId, setActionRequestId] = useState<number | null>(null);
  const [actionComment, setActionComment] = useState("");

  // ─── Form state ───────────────────────────────────────────────────────────
  const [formType, setFormType] = useState<RequestType>("leave");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPriority, setFormPriority] = useState<Priority>("normal");
  const [formDept, setFormDept] = useState("");

  // ─── tRPC queries ─────────────────────────────────────────────────────────
  const utils = trpc.useUtils();

  const { data: myRequests, isLoading: myLoading } = trpc.requests.getMyRequests.useQuery();
  const { data: pendingApprovals, isLoading: approvalsLoading } = trpc.requests.getPendingApprovals.useQuery();
  const { data: stats } = trpc.requests.getStats.useQuery();
  const { data: detail, isLoading: detailLoading } = trpc.requests.getById.useQuery(
    { id: selectedRequestId! },
    { enabled: !!selectedRequestId }
  );

  // ─── Mutations ────────────────────────────────────────────────────────────
  const submitMutation = trpc.requests.submit.useMutation({
    onSuccess: (data) => {
      if (data.denied) {
        toast.error(t("Request Denied by ASTRA AMG", "تم رفض الطلب بواسطة ASTRA AMG"), {
          description: t(`Reason: ${data.reasonCode}`, `السبب: ${data.reasonCode}`),
        });
      } else {
        toast.success(t("Request Submitted", "تم تقديم الطلب"), {
          description: t(`${data.requestNumber} — ${data.approvalChain?.length ?? 0} approval step(s) required`, `${data.requestNumber} — ${data.approvalChain?.length ?? 0} خطوة موافقة مطلوبة`),
        });
      }
      setShowSubmitDialog(false);
      resetForm();
      utils.requests.getMyRequests.invalidate();
      utils.requests.getStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveMutation = trpc.requests.approve.useMutation({
    onSuccess: (data) => {
      toast.success(t("Approved", "تمت الموافقة"), { description: data.message });
      setShowApproveDialog(false);
      setActionComment("");
      utils.requests.getPendingApprovals.invalidate();
      utils.requests.getStats.invalidate();
      if (selectedRequestId) utils.requests.getById.invalidate({ id: selectedRequestId });
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.requests.reject.useMutation({
    onSuccess: (data) => {
      toast.success(t("Rejected", "تم الرفض"), { description: data.message });
      setShowRejectDialog(false);
      setActionComment("");
      utils.requests.getPendingApprovals.invalidate();
      utils.requests.getStats.invalidate();
      if (selectedRequestId) utils.requests.getById.invalidate({ id: selectedRequestId });
    },
    onError: (err) => toast.error(err.message),
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function resetForm() {
    setFormType("leave");
    setFormTitle("");
    setFormDesc("");
    setFormAmount("");
    setFormPriority("normal");
    setFormDept("");
  }

  function handleSubmit() {
    if (!formTitle.trim()) {
      toast.error(t("Title is required", "العنوان مطلوب"));
      return;
    }
    submitMutation.mutate({
      type: formType,
      title: formTitle.trim(),
      description: formDesc.trim() || undefined,
      amountSar: formAmount ? parseInt(formAmount) : undefined,
      priority: formPriority,
      requestedByDept: formDept.trim() || undefined,
    });
  }

  function openDetail(id: number) {
    setSelectedRequestId(id);
    setShowDetailDialog(true);
  }

  function openApprove(id: number) {
    setActionRequestId(id);
    setShowApproveDialog(true);
  }

  function openReject(id: number) {
    setActionRequestId(id);
    setShowRejectDialog(true);
  }

  const requestTypeLabel = (type: RequestType) => {
    const labels: Record<RequestType, { en: string; ar: string }> = {
      leave:     { en: "Leave Request",    ar: "طلب إجازة" },
      purchase:  { en: "Purchase Order",   ar: "أمر شراء" },
      contract:  { en: "Contract",         ar: "عقد" },
      travel:    { en: "Travel Request",   ar: "طلب سفر" },
      expense:   { en: "Expense Claim",    ar: "مطالبة مصاريف" },
      it_access: { en: "IT Access",        ar: "صلاحية IT" },
      hr_change: { en: "HR Change",        ar: "تغيير HR" },
      custom:    { en: "Custom Request",   ar: "طلب مخصص" },
    };
    return t(labels[type].en, labels[type].ar);
  };

  const statusLabel = (status: Status) => {
    const labels: Record<Status, { en: string; ar: string }> = {
      draft:     { en: "Draft",      ar: "مسودة" },
      pending:   { en: "Pending",    ar: "قيد الانتظار" },
      in_review: { en: "In Review",  ar: "قيد المراجعة" },
      approved:  { en: "Approved",   ar: "موافق عليه" },
      rejected:  { en: "Rejected",   ar: "مرفوض" },
      cancelled: { en: "Cancelled",  ar: "ملغي" },
    };
    return t(labels[status].en, labels[status].ar);
  };

  const priorityLabel = (priority: Priority) => {
    const labels: Record<Priority, { en: string; ar: string }> = {
      low:    { en: "Low",    ar: "منخفض" },
      normal: { en: "Normal", ar: "عادي" },
      high:   { en: "High",   ar: "عالي" },
      urgent: { en: "Urgent", ar: "عاجل" },
    };
    return t(labels[priority].en, labels[priority].ar);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen bg-[#05080F] text-white p-6 ${isRTL ? "rtl" : "ltr"}`}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t("Requests & Approvals", "الطلبات والموافقات")}
            </h1>
            <p className="text-white/40 text-sm">
              {t("ASTRA AMG authority matrix enforced", "مدعوم بمصفوفة صلاحيات ASTRA AMG")}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowSubmitDialog(true)}
          className="bg-yellow-500 hover:bg-yellow-400 text-[#05080F] font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("New Request", "طلب جديد")}
        </Button>
      </div>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("My Requests", "طلباتي"), value: stats.myStats.total, icon: ClipboardList, color: "text-blue-400" },
            { label: t("Pending", "قيد الانتظار"), value: stats.myStats.pending, icon: Clock, color: "text-amber-400" },
            { label: t("Approved", "موافق عليه"), value: stats.myStats.approved, icon: CheckCircle2, color: "text-emerald-400" },
            { label: t("Awaiting My Action", "بانتظار إجراءاتي"), value: stats.pendingApprovals, icon: AlertTriangle, color: "text-red-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-white/5 border-white/10">
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color}`} />
                <div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-white/50 text-xs">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "my" as const, label: t("My Requests", "طلباتي") },
          { key: "approvals" as const, label: t("Pending Approvals", "الموافقات المعلقة") },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── My Requests Tab ── */}
      {activeTab === "my" && (
        <div className="space-y-3">
          {myLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              {t("Loading...", "جاري التحميل...")}
            </div>
          ) : !myRequests?.length ? (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">{t("No requests yet. Submit your first request.", "لا توجد طلبات بعد. قدّم طلبك الأول.")}</p>
            </div>
          ) : (
            myRequests.map((req) => {
              const Icon = REQUEST_TYPE_ICONS[req.type as RequestType] ?? Layers;
              return (
                <div
                  key={req.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/8 transition-colors cursor-pointer"
                  onClick={() => openDetail(req.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{req.title}</span>
                      <Badge className={`text-xs border ${STATUS_COLORS[req.status as Status] ?? ""}`}>
                        {statusLabel(req.status as Status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-white/40 text-xs">
                      <span>{req.requestNumber}</span>
                      <span>·</span>
                      <span>{requestTypeLabel(req.type as RequestType)}</span>
                      {req.amountSar && (
                        <>
                          <span>·</span>
                          <span>{req.amountSar.toLocaleString()} SAR</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs ${PRIORITY_COLORS[req.priority as Priority] ?? ""}`}>
                      {priorityLabel(req.priority as Priority)}
                    </Badge>
                    {(req.status === "pending" || req.status === "in_review") && (
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <span>{t("Step", "خطوة")} {req.currentStep}/{req.totalSteps}</span>
                      </div>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Pending Approvals Tab ── */}
      {activeTab === "approvals" && (
        <div className="space-y-3">
          {approvalsLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              {t("Loading...", "جاري التحميل...")}
            </div>
          ) : !pendingApprovals?.length ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mx-auto mb-3" />
              <p className="text-white/40">{t("No pending approvals. All clear!", "لا توجد موافقات معلقة. كل شيء على ما يرام!")}</p>
            </div>
          ) : (
            pendingApprovals.map((req) => {
              const Icon = REQUEST_TYPE_ICONS[req.type as RequestType] ?? Layers;
              return (
                <div
                  key={req.id}
                  className="bg-white/5 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{req.title}</span>
                      <Badge className={`text-xs border ${STATUS_COLORS[req.status as Status] ?? ""}`}>
                        {statusLabel(req.status as Status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-white/40 text-xs">
                      <span>{req.requestNumber}</span>
                      <span>·</span>
                      <span>{req.requestedByName ?? t("Unknown", "غير معروف")}</span>
                      {req.amountSar && (
                        <>
                          <span>·</span>
                          <span>{req.amountSar.toLocaleString()} SAR</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/20 text-white/70 hover:text-white hover:bg-white/10 bg-transparent gap-1 text-xs"
                      onClick={() => openDetail(req.id)}
                    >
                      <Eye className="w-3 h-3" />
                      {t("View", "عرض")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs"
                      onClick={() => openApprove(req.id)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {t("Approve", "موافقة")}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-500 text-white gap-1 text-xs"
                      onClick={() => openReject(req.id)}
                    >
                      <ThumbsDown className="w-3 h-3" />
                      {t("Reject", "رفض")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Submit Request Dialog ── */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Plus className="w-5 h-5 text-yellow-400" />
              {t("Submit New Request", "تقديم طلب جديد")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Request Type */}
            <div>
              <label className="text-white/60 text-xs mb-1 block">{t("Request Type", "نوع الطلب")}</label>
              <Select value={formType} onValueChange={(v) => setFormType(v as RequestType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10">
                  {(["leave", "purchase", "contract", "travel", "expense", "it_access", "hr_change", "custom"] as RequestType[]).map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-white/10">
                      {requestTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <label className="text-white/60 text-xs mb-1 block">{t("Title *", "العنوان *")}</label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("Brief description of the request", "وصف موجز للطلب")}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-white/60 text-xs mb-1 block">{t("Description", "الوصف")}</label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder={t("Detailed justification...", "المبرر التفصيلي...")}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
              />
            </div>

            {/* Amount (for purchase/contract/expense) */}
            {["purchase", "contract", "expense"].includes(formType) && (
              <div>
                <label className="text-white/60 text-xs mb-1 block">{t("Amount (SAR)", "المبلغ (ريال)")}</label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                {formAmount && parseInt(formAmount) > 0 && (
                  <p className="text-white/40 text-xs mt-1">
                    {parseInt(formAmount) <= 10_000 && t("→ 1 approval step (Manager)", "→ خطوة موافقة واحدة (المدير)")}
                    {parseInt(formAmount) > 10_000 && parseInt(formAmount) <= 50_000 && t("→ 2 approval steps (Manager → Director)", "→ خطوتا موافقة (المدير ← المدير التنفيذي)")}
                    {parseInt(formAmount) > 50_000 && parseInt(formAmount) <= 500_000 && t("→ 3 approval steps (Manager → Director → CEO)", "→ 3 خطوات موافقة (المدير ← المدير التنفيذي ← الرئيس التنفيذي)")}
                    {parseInt(formAmount) > 500_000 && <span className="text-red-400">{t("⚠ Exceeds board threshold — will be denied", "⚠ يتجاوز حد مجلس الإدارة — سيتم الرفض")}</span>}
                  </p>
                )}
              </div>
            )}

            {/* Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/60 text-xs mb-1 block">{t("Priority", "الأولوية")}</label>
                <Select value={formPriority} onValueChange={(v) => setFormPriority(v as Priority)}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0F1E] border-white/10">
                    {(["low", "normal", "high", "urgent"] as Priority[]).map((p) => (
                      <SelectItem key={p} value={p} className="text-white hover:bg-white/10">
                        {priorityLabel(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-white/60 text-xs mb-1 block">{t("Department", "القسم")}</label>
                <Input
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder={t("e.g. IT, Finance", "مثال: IT، المالية")}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            {/* ASTRA AMG notice */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-amber-300/80 text-xs">
                {t(
                  "This request will be validated by ASTRA AMG authority matrix before routing to approvers.",
                  "سيتم التحقق من هذا الطلب بواسطة مصفوفة صلاحيات ASTRA AMG قبل إرساله إلى المعتمدين."
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} className="border-white/20 text-white/70 bg-transparent">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-400 text-[#05080F] font-semibold"
            >
              {submitMutation.isPending ? t("Submitting...", "جاري التقديم...") : t("Submit Request", "تقديم الطلب")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Request Detail Dialog ── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-yellow-400" />
              {t("Request Details", "تفاصيل الطلب")}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8 text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              {t("Loading...", "جاري التحميل...")}
            </div>
          ) : detail ? (
            <div className="space-y-4 py-2">
              {/* Request header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{detail.request.title}</h3>
                  <div className="flex items-center gap-2 text-white/40 text-sm">
                    <span>{detail.request.requestNumber}</span>
                    <span>·</span>
                    <span>{requestTypeLabel(detail.request.type as RequestType)}</span>
                  </div>
                </div>
                <Badge className={`text-sm border ${STATUS_COLORS[detail.request.status as Status] ?? ""}`}>
                  {statusLabel(detail.request.status as Status)}
                </Badge>
              </div>

              {detail.request.description && (
                <p className="text-white/60 text-sm bg-white/5 rounded-lg p-3">{detail.request.description}</p>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {detail.request.amountSar && (
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-white/40 text-xs mb-1">{t("Amount", "المبلغ")}</div>
                    <div className="text-white font-semibold">{detail.request.amountSar.toLocaleString()} SAR</div>
                  </div>
                )}
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white/40 text-xs mb-1">{t("Priority", "الأولوية")}</div>
                  <div className="text-white font-semibold">{priorityLabel(detail.request.priority as Priority)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white/40 text-xs mb-1">{t("Submitted", "تاريخ التقديم")}</div>
                  <div className="text-white font-semibold">{new Date(detail.request.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-white/40 text-xs mb-1">{t("ASTRA Outcome", "نتيجة ASTRA")}</div>
                  <div className={`font-semibold ${detail.request.astraOutcome === "ALLOW" ? "text-emerald-400" : detail.request.astraOutcome === "DENY" ? "text-red-400" : "text-amber-400"}`}>
                    {detail.request.astraOutcome}
                  </div>
                </div>
              </div>

              {/* Approval chain timeline */}
              {detail.steps.length > 0 && (
                <div>
                  <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">{t("Approval Chain", "سلسلة الموافقات")}</h4>
                  <div className="space-y-2">
                    {detail.steps.map((step, idx) => (
                      <div key={step.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                        step.isCurrent ? "bg-amber-500/10 border-amber-500/30" :
                        step.status === "approved" ? "bg-emerald-500/10 border-emerald-500/20" :
                        step.status === "rejected" ? "bg-red-500/10 border-red-500/20" :
                        "bg-white/5 border-white/10"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          step.status === "approved" ? "bg-emerald-500 text-white" :
                          step.status === "rejected" ? "bg-red-500 text-white" :
                          step.isCurrent ? "bg-amber-500 text-[#05080F]" :
                          "bg-white/10 text-white/50"
                        }`}>
                          {step.status === "approved" ? <CheckCircle2 className="w-4 h-4" /> :
                           step.status === "rejected" ? <XCircle className="w-4 h-4" /> :
                           step.stepOrder}
                        </div>
                        <div className="flex-1">
                          <div className="text-white text-sm font-medium capitalize">{step.approverRole.replace("_", " ")}</div>
                          <div className="text-white/40 text-xs">
                            {step.isCurrent ? t("Awaiting approval", "بانتظار الموافقة") :
                             step.status === "approved" ? t("Approved", "موافق عليه") :
                             step.status === "rejected" ? t("Rejected", "مرفوض") :
                             t("Pending", "معلق")}
                            {" · "}{t(`SLA: ${step.slaHours}h`, `الوقت المحدد: ${step.slaHours} ساعة`)}
                          </div>
                        </div>
                        {idx < detail.steps.length - 1 && <ArrowRight className="w-4 h-4 text-white/20" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action history */}
              {detail.actions.length > 0 && (
                <div>
                  <h4 className="text-white/60 text-xs uppercase tracking-wider mb-3">{t("Action History", "سجل الإجراءات")}</h4>
                  <div className="space-y-2">
                    {detail.actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          action.action === "approve" ? "bg-emerald-400" :
                          action.action === "reject" ? "bg-red-400" :
                          "bg-blue-400"
                        }`} />
                        <div>
                          <span className="text-white/70">{action.actorName ?? t("System", "النظام")}</span>
                          <span className="text-white/40 mx-1">·</span>
                          <span className={`capitalize ${action.action === "approve" ? "text-emerald-400" : action.action === "reject" ? "text-red-400" : "text-blue-400"}`}>
                            {action.action}
                          </span>
                          {action.comment && (
                            <p className="text-white/40 text-xs mt-0.5">"{action.comment}"</p>
                          )}
                        </div>
                        <span className="text-white/30 text-xs ml-auto">{new Date(action.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="border-white/20 text-white/70 bg-transparent">
              {t("Close", "إغلاق")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Approve Dialog ── */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <ThumbsUp className="w-5 h-5" />
              {t("Approve Request", "الموافقة على الطلب")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-white/60 text-xs mb-1 block">{t("Comment (optional)", "تعليق (اختياري)")}</label>
            <Textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={t("Add a comment...", "أضف تعليقاً...")}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApproveDialog(false)} className="border-white/20 text-white/70 bg-transparent">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={() => actionRequestId && approveMutation.mutate({ requestId: actionRequestId, comment: actionComment || undefined })}
              disabled={approveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {approveMutation.isPending ? t("Approving...", "جاري الموافقة...") : t("Confirm Approval", "تأكيد الموافقة")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ThumbsDown className="w-5 h-5" />
              {t("Reject Request", "رفض الطلب")}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-white/60 text-xs mb-1 block">{t("Reason for rejection *", "سبب الرفض *")}</label>
            <Textarea
              value={actionComment}
              onChange={(e) => setActionComment(e.target.value)}
              placeholder={t("Explain why this request is being rejected (min 5 chars)...", "اشرح سبب رفض هذا الطلب (5 أحرف على الأقل)...")}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="border-white/20 text-white/70 bg-transparent">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={() => actionRequestId && rejectMutation.mutate({ requestId: actionRequestId, comment: actionComment })}
              disabled={rejectMutation.isPending || actionComment.length < 5}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {rejectMutation.isPending ? t("Rejecting...", "جاري الرفض...") : t("Confirm Rejection", "تأكيد الرفض")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
