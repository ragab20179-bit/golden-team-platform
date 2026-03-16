import pathlib

content = r"""/**
 * Legal Module — الشؤون القانونية
 * Bilingual: Arabic / English
 * Live data from modules.legal.list + modules.legal.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Plus, Loader2, Trash2, RefreshCw, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusColor: Record<string, string> = {
  draft:          "bg-white/5 text-white/40 border-white/10",
  active:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  expiring_soon:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired:        "bg-rose-500/10 text-rose-400 border-rose-500/20",
  closed:         "bg-slate-500/10 text-slate-400 border-slate-500/20",
  disputed:       "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const typeColor: Record<string, string> = {
  contract:   "bg-blue-500/20 text-blue-300",
  dispute:    "bg-rose-500/20 text-rose-300",
  compliance: "bg-violet-500/20 text-violet-300",
  ip:         "bg-amber-500/20 text-amber-300",
  employment: "bg-emerald-500/20 text-emerald-300",
  other:      "bg-white/10 text-white/50",
};

export default function LegalModule() {
  const { t, isRTL } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    caseNumber: "", title: "", titleAr: "", type: "contract" as const,
    party: "", partyAr: "", status: "draft" as const,
    value: "", startDate: "", expiryDate: "",
    assignedTo: "", description: "", descriptionAr: "",
  });

  const utils = trpc.useUtils();

  const { data: cases = [], isLoading, refetch } = trpc.modules.legal.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.legal.stats.useQuery();

  const addCase = trpc.modules.legal.add.useMutation({
    onSuccess: () => {
      toast.success(t("Legal case added", "تمت إضافة القضية"));
      utils.modules.legal.list.invalidate();
      utils.modules.legal.stats.invalidate();
      setAddOpen(false);
      setForm({ caseNumber: "", title: "", titleAr: "", type: "contract", party: "", partyAr: "", status: "draft", value: "", startDate: "", expiryDate: "", assignedTo: "", description: "", descriptionAr: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCase = trpc.modules.legal.update.useMutation({
    onSuccess: () => {
      utils.modules.legal.list.invalidate();
      utils.modules.legal.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCase = trpc.modules.legal.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Case deleted", "تم حذف القضية"));
      utils.modules.legal.list.invalidate();
      utils.modules.legal.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const fmt = (n: number) => n.toLocaleString("en-SA", { maximumFractionDigits: 0 });

  return (
    <PortalLayout
      title={t("Legal", "الشؤون القانونية")}
      subtitle={t("Contracts, Compliance & Legal Case Management", "العقود والامتثال وإدارة القضايا القانونية")}
      badge={stats ? t(`${stats.total} Cases`, `${stats.total} قضية`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Active",        "نشط"),              value: stats?.active                          ?? "—", icon: CheckCircle,  color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: t("Expiring Soon", "ينتهي قريباً"),     value: stats?.expiringSoon                    ?? "—", icon: Clock,        color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Disputed",      "متنازع عليه"),      value: stats?.disputed                        ?? "—", icon: AlertTriangle, color: "text-rose-400",   bg: "border-rose-500/20" },
            { label: t("Total Value",   "القيمة الإجمالية"), value: stats ? fmt(stats.totalValueSar) + " SAR" : "—", icon: FileText,  color: "text-blue-400",    bg: "border-blue-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Type Breakdown ── */}
        {stats?.byType && (
          <div className="glass-card border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("By Type", "حسب النوع")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <span key={type} className={`text-xs px-2 py-1 rounded-md ${typeColor[type] ?? "bg-white/5 text-white/40"}`}>
                  {type}: {count as number}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Cases List ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Legal Cases & Contracts", "القضايا والعقود القانونية")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-amber-600 hover:bg-amber-500 text-white border-0 h-8 text-xs">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New Case", "قضية جديدة")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading cases…", "جارٍ تحميل القضايا…")}
            </div>
          ) : cases.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <Scale className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No legal cases yet. Add one to start.", "لا توجد قضايا بعد.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[c.type] ?? ""}`}>{c.type}</span>
                      <span className="text-sm font-semibold text-white">{isRTL && c.titleAr ? c.titleAr : c.title}</span>
                      {c.caseNumber && <span className="text-[10px] text-white/30">{c.caseNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-white/40">{isRTL && c.partyAr ? c.partyAr : c.party}</span>
                      {c.expiryDate && <span className="text-xs text-white/30">{t("Expires", "ينتهي")}: {c.expiryDate}</span>}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    {c.value != null && <div className="text-sm font-semibold text-white">{fmt(c.value)} SAR</div>}
                    {c.assignedTo && <div className="text-xs text-white/30">{c.assignedTo}</div>}
                  </div>
                  <Select value={c.status} onValueChange={(v) => updateCase.mutate({ id: c.id, data: { status: v as typeof c.status } })}>
                    <SelectTrigger className={`w-36 h-7 text-[11px] border ${statusColor[c.status] ?? ""} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                      <SelectItem value="draft">{t("Draft", "مسودة")}</SelectItem>
                      <SelectItem value="active">{t("Active", "نشط")}</SelectItem>
                      <SelectItem value="expiring_soon">{t("Expiring Soon", "ينتهي قريباً")}</SelectItem>
                      <SelectItem value="expired">{t("Expired", "منتهي")}</SelectItem>
                      <SelectItem value="closed">{t("Closed", "مغلق")}</SelectItem>
                      <SelectItem value="disputed">{t("Disputed", "متنازع عليه")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    onClick={() => { if (confirm(t("Delete this case?", "هل تريد حذف هذه القضية؟"))) deleteCase.mutate({ id: c.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Critical Thinking Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="critical"
          title={t("Legal Intelligence — GPT-4o", "الذكاء القانوني")}
          placeholder={t("e.g. Which contracts are expiring in the next 30 days? Analyze compliance risks.", "مثال: ما العقود التي تنتهي خلال 30 يوماً؟ حلل مخاطر الامتثال.")}
        />
      </div>

      {/* ── Add Case Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("New Legal Case", "قضية قانونية جديدة")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Title *", "العنوان *")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Service Agreement — Al-Noor" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Type", "النوع")}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as typeof form.type }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="contract">{t("Contract", "عقد")}</SelectItem>
                  <SelectItem value="dispute">{t("Dispute", "نزاع")}</SelectItem>
                  <SelectItem value="compliance">{t("Compliance", "امتثال")}</SelectItem>
                  <SelectItem value="ip">{t("IP / Trademark", "ملكية فكرية")}</SelectItem>
                  <SelectItem value="employment">{t("Employment", "توظيف")}</SelectItem>
                  <SelectItem value="other">{t("Other", "أخرى")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Party", "الطرف")}</Label>
              <Input value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Al-Noor Construction" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Value (SAR)", "القيمة (ريال)")}</Label>
              <Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="1200000" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Expiry Date", "تاريخ الانتهاء")}</Label>
              <Input value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="2027-03-31" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Assigned To", "مُسند إلى")}</Label>
              <Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Legal Team" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.title.trim()) { toast.error(t("Title is required", "العنوان مطلوب")); return; }
              addCase.mutate({ ...form, value: form.value ? Number(form.value) : undefined });
            }} disabled={addCase.isPending} className="bg-amber-600 hover:bg-amber-500 text-white border-0">
              {addCase.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add Case", "إضافة قضية")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
"""

pathlib.Path('/home/ubuntu/golden-team-platform/client/src/pages/LegalModule.tsx').write_text(content)
print("LegalModule.tsx written successfully")
