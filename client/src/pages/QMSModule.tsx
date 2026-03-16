/**
 * QMS Module — نظام إدارة الجودة ISO 9001
 * Bilingual: Arabic / English
 * Live data from modules.qms.list + modules.qms.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Award, Plus, Loader2, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { trpc } from "@/lib/trpc";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusColor: Record<string, string> = {
  open:        "bg-rose-500/10 text-rose-400 border-rose-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  resolved:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  closed:      "bg-white/5 text-white/40 border-white/10",
};

const severityColor: Record<string, string> = {
  critical:    "bg-rose-500/20 text-rose-300",
  major:       "bg-orange-500/20 text-orange-300",
  minor:       "bg-amber-500/20 text-amber-300",
  observation: "bg-blue-500/20 text-blue-300",
};

export default function QMSModule() {
  const { t, isRTL } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    ncrNumber: "", title: "", titleAr: "", description: "",
    category: "", severity: "minor" as const,
    reportedBy: "", assignedTo: "", dueDate: "",
    status: "open" as const,
  });

  const utils = trpc.useUtils();

  const { data: incidents = [], isLoading, refetch } = trpc.modules.qms.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.qms.stats.useQuery();

  const addIncident = trpc.modules.qms.add.useMutation({
    onSuccess: () => {
      toast.success(t("NCR added", "تمت إضافة التقرير"));
      utils.modules.qms.list.invalidate();
      utils.modules.qms.stats.invalidate();
      setAddOpen(false);
      setForm({ ncrNumber: "", title: "", titleAr: "", description: "", category: "", severity: "minor", reportedBy: "", assignedTo: "", dueDate: "", status: "open" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.modules.qms.update.useMutation({
    onSuccess: () => {
      utils.modules.qms.list.invalidate();
      utils.modules.qms.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteIncident = trpc.modules.qms.delete.useMutation({
    onSuccess: () => {
      toast.success(t("NCR removed", "تم حذف التقرير"));
      utils.modules.qms.list.invalidate();
      utils.modules.qms.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <PortalLayout
      title={t("Quality Management", "إدارة الجودة")}
      subtitle={t("ISO 9001:2015 Non-Conformance & Audit Management", "إدارة عدم المطابقة والتدقيق")}
      badge={stats ? t(`${stats.open} Open NCRs`, `${stats.open} تقارير مفتوحة`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Total NCRs",  "إجمالي التقارير"), value: stats?.total      ?? "—", icon: Award,         color: "text-teal-400",    bg: "border-teal-500/20" },
            { label: t("Open",        "مفتوح"),            value: stats?.open       ?? "—", icon: AlertTriangle, color: "text-rose-400",    bg: "border-rose-500/20" },
            { label: t("In Progress", "قيد المعالجة"),     value: stats?.inProgress ?? "—", icon: Clock,         color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Resolved",    "محلول"),            value: stats?.resolved   ?? "—", icon: CheckCircle,   color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── NCR List ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Non-Conformance Reports", "تقارير عدم المطابقة")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-teal-600 hover:bg-teal-500 text-white border-0 h-8 text-xs">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New NCR", "تقرير جديد")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading NCRs…", "جارٍ تحميل التقارير…")}
            </div>
          ) : incidents.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <Award className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No NCRs yet. Add one to start tracking.", "لا توجد تقارير بعد.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidents.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{isRTL && n.titleAr ? n.titleAr : n.title}</span>
                      {n.incidentCode && <span className="text-[10px] text-white/30">{n.incidentCode}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {n.severity && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${severityColor[n.severity] ?? "bg-white/5 text-white/40"}`}>
                          {n.severity}
                        </span>
                      )}
                      {n.area && <span className="text-xs text-white/30">{n.area}</span>}
                    </div>
                  </div>
                  <Select value={n.status} onValueChange={(v) => updateStatus.mutate({ id: n.id, data: { status: v as typeof n.status } })}>
                    <SelectTrigger className={`w-32 h-7 text-[11px] border ${statusColor[n.status] ?? ""} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                      <SelectItem value="open">{t("Open", "مفتوح")}</SelectItem>
                      <SelectItem value="in_progress">{t("In Progress", "قيد المعالجة")}</SelectItem>
                      <SelectItem value="resolved">{t("Resolved", "محلول")}</SelectItem>
                      <SelectItem value="closed">{t("Closed", "مغلق")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    onClick={() => { if (confirm(t("Remove this NCR?", "هل تريد حذف هذا التقرير؟"))) deleteIncident.mutate({ id: n.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Category Breakdown ── */}
        {stats && stats.areas && (stats.areas as string[]).length > 0 && (
          <div className="glass-card border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("Categories", "الفئات")}</h3>
            <div className="flex flex-wrap gap-2">
              {(stats.areas as string[]).map(c => (
                <Badge key={c} className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/20">{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI QMS Analysis Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="qms"
          title={t("QMS Intelligence — GPT-4o", "ذكاء إدارة الجودة")}
          placeholder={t("e.g. What are the most common NCR categories? Which items are overdue?", "مثال: ما أكثر فئات عدم المطابقة شيوعًا؟")}
        />
      </div>

      {/* ── Add NCR Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("New NCR", "تقرير عدم مطابقة جديد")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Title *", "العنوان *")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Document Control Failure" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("NCR Number", "رقم التقرير")}</Label>
              <Input value={form.ncrNumber} onChange={e => setForm(f => ({ ...f, ncrNumber: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="NCR-2026-001" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Category", "الفئة")}</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Document Control" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Severity", "الخطورة")}</Label>
              <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as typeof form.severity }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="critical">{t("Critical", "حرج")}</SelectItem>
                  <SelectItem value="major">{t("Major", "رئيسي")}</SelectItem>
                  <SelectItem value="minor">{t("Minor", "ثانوي")}</SelectItem>
                  <SelectItem value="observation">{t("Observation", "ملاحظة")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Assigned To", "مُسنَد إلى")}</Label>
              <Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Khalid Hassan" />
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Description", "الوصف")}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1 resize-none" rows={3}
                placeholder={t("Describe the non-conformance…", "صف حالة عدم المطابقة…")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.title.trim()) { toast.error(t("Title is required", "العنوان مطلوب")); return; }
              addIncident.mutate(form);
            }} disabled={addIncident.isPending} className="bg-teal-600 hover:bg-teal-500 text-white border-0">
              {addIncident.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add NCR", "إضافة تقرير")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
