/**
 * KPI Dashboard — لوحة مؤشرات الأداء الرئيسية
 * Bilingual: Arabic / English
 * Live data from modules.kpi.list + modules.kpi.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Upload, Plus, Loader2, Trash2, RefreshCw, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { KPIBulkImport } from "@/components/ModuleBulkImport";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { trpc } from "@/lib/trpc";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  on_track:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  at_risk:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  off_track: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  achieved:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function KPIModule() {
  const { t, isRTL } = useLanguage();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    kpiCode: "", name: "", nameAr: "", category: "", unit: "",
    targetValue: "", actualValue: "", period: "", owner: "",
    status: "on_track" as const,
  });

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: kpis = [], isLoading, refetch } = trpc.modules.kpi.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.kpi.stats.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const addKpi = trpc.modules.kpi.add.useMutation({
    onSuccess: () => {
      toast.success(t("KPI added", "تمت إضافة المؤشر"));
      utils.modules.kpi.list.invalidate();
      utils.modules.kpi.stats.invalidate();
      setAddOpen(false);
      setForm({ kpiCode: "", name: "", nameAr: "", category: "", unit: "", targetValue: "", actualValue: "", period: "", owner: "", status: "on_track" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.modules.kpi.update.useMutation({
    onSuccess: () => {
      utils.modules.kpi.list.invalidate();
      utils.modules.kpi.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteKpi = trpc.modules.kpi.delete.useMutation({
    onSuccess: () => {
      toast.success(t("KPI removed", "تم حذف المؤشر"));
      utils.modules.kpi.list.invalidate();
      utils.modules.kpi.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // Build radar data from live stats
  const radarData = stats ? [
    { subject: t("On Track", "في المسار"),  A: stats.total > 0 ? Math.round((stats.onTrack / stats.total) * 100) : 0 },
    { subject: t("Achieved",  "محقق"),       A: stats.total > 0 ? Math.round((stats.achieved / stats.total) * 100) : 0 },
    { subject: t("At Risk",   "في خطر"),     A: stats.total > 0 ? Math.round(((stats.total - stats.atRisk) / stats.total) * 100) : 0 },
    { subject: t("Off Track", "خارج المسار"),A: stats.total > 0 ? Math.round(((stats.total - stats.offTrack) / stats.total) * 100) : 0 },
  ] : [];

  return (
    <PortalLayout
      title={t("KPI Dashboard", "لوحة مؤشرات الأداء")}
      subtitle={t("Key Performance Indicators — Live Data", "مؤشرات الأداء الرئيسية — بيانات مباشرة")}
      badge={stats ? t(`${stats.total} KPIs`, `${stats.total} مؤشر`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats Strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Total KPIs",  "إجمالي المؤشرات"),  value: stats?.total    ?? "—", color: "text-blue-400",    bg: "border-blue-500/20",    icon: Target },
            { label: t("On Track",    "في المسار"),         value: stats?.onTrack  ?? "—", color: "text-emerald-400", bg: "border-emerald-500/20", icon: TrendingUp },
            { label: t("At Risk",     "في خطر"),            value: stats?.atRisk   ?? "—", color: "text-amber-400",   bg: "border-amber-500/20",   icon: TrendingDown },
            { label: t("Off Track",   "خارج المسار"),       value: stats?.offTrack ?? "—", color: "text-rose-400",    bg: "border-rose-500/20",    icon: TrendingDown },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── KPI Table ── */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("KPI Targets", "مؤشرات الأداء المستهدفة")}
              </h2>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                  <RefreshCw className="w-3 h-3" />
                </Button>
                <Button size="sm" onClick={() => setBulkOpen(true)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                  <Upload className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Import", "استيراد")}
                </Button>
                <Button size="sm" onClick={() => setAddOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white border-0 h-8 text-xs">
                  <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Add KPI", "إضافة مؤشر")}
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-white/40">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                {t("Loading KPIs…", "جارٍ تحميل المؤشرات…")}
              </div>
            ) : kpis.length === 0 ? (
              <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
                <Target className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm">{t("No KPI targets yet. Add one or use bulk import.", "لا توجد مؤشرات أداء بعد. أضف مؤشرًا أو استخدم الاستيراد.")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {kpis.map((k, i) => (
                  <motion.div key={k.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{isRTL && k.nameAr ? k.nameAr : k.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">
                        {k.category && <span className="mr-2">{k.category}</span>}
                        {k.period && <span>{k.period}</span>}
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      {k.actualValue && <div className="text-sm font-bold text-white">{k.actualValue} {k.unit}</div>}
                      {k.targetValue && <div className="text-xs text-white/30">{t("Target:", "المستهدف:")} {k.targetValue} {k.unit}</div>}
                    </div>
                    <Select
                      value={k.status}
                      onValueChange={(v) => updateStatus.mutate({ id: k.id, data: { status: v as typeof k.status } })}
                    >
                      <SelectTrigger className={`w-28 h-7 text-[11px] border ${statusColors[k.status] ?? ""} bg-transparent`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                        <SelectItem value="on_track">{t("On Track", "في المسار")}</SelectItem>
                        <SelectItem value="at_risk">{t("At Risk", "في خطر")}</SelectItem>
                        <SelectItem value="off_track">{t("Off Track", "خارج المسار")}</SelectItem>
                        <SelectItem value="achieved">{t("Achieved", "محقق")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm" variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                      onClick={() => { if (confirm(t("Remove this KPI?", "هل تريد حذف هذا المؤشر؟"))) deleteKpi.mutate({ id: k.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ── Radar Chart ── */}
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Performance Radar", "رادار الأداء")}
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <Radar name={t("Score", "النتيجة")} dataKey="A" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                {t("Add KPIs to see radar", "أضف مؤشرات لرؤية الرادار")}
              </div>
            )}
            {/* Category breakdown */}
            {stats && (stats.categories as string[]).length > 0 && (
              <div className="mt-4">
                <div className="text-xs text-white/40 mb-2">{t("Categories", "الفئات")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(stats.categories as string[]).map(c => (
                    <Badge key={c} className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">{c}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI KPI Intelligence Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="business"
          title={t("KPI Intelligence — Business Management AI", "ذكاء مؤشرات الأداء")}
          extraInput={{ focus: "kpi" }}
          placeholder={t(
            "e.g. Which KPIs are off-track? What is our overall performance against targets?",
            "مثال: ما هي مؤشرات الأداء المتأخرة؟"
          )}
        />
      </div>

      <KPIBulkImport open={bulkOpen} onClose={() => setBulkOpen(false)} />

      {/* ── Add KPI Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("Add KPI Target", "إضافة مؤشر أداء")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("KPI Name *", "اسم المؤشر *")}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Revenue Achievement" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Category", "الفئة")}</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Financial" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Unit", "الوحدة")}</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="%" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Target Value", "القيمة المستهدفة")}</Label>
              <Input value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="90" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Actual Value", "القيمة الفعلية")}</Label>
              <Input value={form.actualValue} onChange={e => setForm(f => ({ ...f, actualValue: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="87" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Period", "الفترة")}</Label>
              <Input value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Q1 2026" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Owner", "المسؤول")}</Label>
              <Input value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Ahmed Al-Rashidi" />
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Status", "الحالة")}</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as typeof form.status }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="on_track">{t("On Track", "في المسار")}</SelectItem>
                  <SelectItem value="at_risk">{t("At Risk", "في خطر")}</SelectItem>
                  <SelectItem value="off_track">{t("Off Track", "خارج المسار")}</SelectItem>
                  <SelectItem value="achieved">{t("Achieved", "محقق")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.name.trim()) { toast.error(t("KPI name is required", "اسم المؤشر مطلوب")); return; }
              addKpi.mutate(form);
            }} disabled={addKpi.isPending} className="bg-amber-600 hover:bg-amber-500 text-white border-0">
              {addKpi.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add KPI", "إضافة مؤشر")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
