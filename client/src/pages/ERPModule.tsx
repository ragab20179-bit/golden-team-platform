/**
 * ERP Module — تخطيط موارد المؤسسة
 * Bilingual: Arabic / English
 * Live data from modules.erp.list + modules.erp.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Plus, Loader2, Trash2, RefreshCw, TrendingUp, TrendingDown, DollarSign, Clock } from "lucide-react";
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
  draft:     "bg-white/5 text-white/40 border-white/10",
  pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const typeColor: Record<string, string> = {
  sale:      "bg-emerald-500/20 text-emerald-300",
  invoice:   "bg-blue-500/20 text-blue-300",
  purchase:  "bg-orange-500/20 text-orange-300",
  expense:   "bg-rose-500/20 text-rose-300",
  inventory: "bg-violet-500/20 text-violet-300",
  other:     "bg-white/10 text-white/50",
};

export default function ERPModule() {
  const { t, isRTL } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    recordNumber: "", title: "", titleAr: "", party: "", partyAr: "",
    type: "sale" as const, amount: "", currency: "SAR",
    status: "draft" as const, dueDate: "", notes: "",
  });

  const utils = trpc.useUtils();

  const { data: records = [], isLoading, refetch } = trpc.modules.erp.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.erp.stats.useQuery();

  const addRecord = trpc.modules.erp.add.useMutation({
    onSuccess: () => {
      toast.success(t("ERP record added", "تمت إضافة السجل"));
      utils.modules.erp.list.invalidate();
      utils.modules.erp.stats.invalidate();
      setAddOpen(false);
      setForm({ recordNumber: "", title: "", titleAr: "", party: "", partyAr: "", type: "sale", amount: "", currency: "SAR", status: "draft", dueDate: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateRecord = trpc.modules.erp.update.useMutation({
    onSuccess: () => {
      utils.modules.erp.list.invalidate();
      utils.modules.erp.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteRecord = trpc.modules.erp.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Record deleted", "تم حذف السجل"));
      utils.modules.erp.list.invalidate();
      utils.modules.erp.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const fmt = (n: number) => n.toLocaleString("en-SA", { maximumFractionDigits: 0 });

  return (
    <PortalLayout
      title={t("ERP", "تخطيط الموارد")}
      subtitle={t("Financial Records & Enterprise Resource Planning", "السجلات المالية وتخطيط موارد المؤسسة")}
      badge={stats ? t(`${stats.total} Records`, `${stats.total} سجل`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Revenue (SAR)",  "الإيرادات (ريال)"),  value: stats ? fmt(stats.totalRevenueSar)  : "—", icon: TrendingUp,  color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: t("Expenses (SAR)", "المصروفات (ريال)"),  value: stats ? fmt(stats.totalExpensesSar) : "—", icon: TrendingDown, color: "text-rose-400",    bg: "border-rose-500/20" },
            { label: t("Net (SAR)",      "الصافي (ريال)"),     value: stats ? fmt(stats.netSar ?? 0)      : "—", icon: DollarSign,   color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Pending",        "معلق"),               value: stats?.pending                      ?? "—", icon: Clock,        color: "text-amber-400",   bg: "border-amber-500/20" },
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
        {stats && (
          <div className="glass-card border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("By Type", "حسب النوع")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType ?? {}).map(([type, count]) => (
                <span key={type} className={`text-xs px-2 py-1 rounded-md ${typeColor[type] ?? "bg-white/5 text-white/40"}`}>
                  {type}: {count as number}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Records List ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("ERP Records", "سجلات الموارد")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-violet-600 hover:bg-violet-500 text-white border-0 h-8 text-xs">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New Record", "سجل جديد")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading records…", "جارٍ تحميل السجلات…")}
            </div>
          ) : records.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <Database className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No ERP records yet. Add one to start.", "لا توجد سجلات بعد.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[r.type] ?? ""}`}>{r.type}</span>
                      <span className="text-sm font-semibold text-white">{isRTL && r.titleAr ? r.titleAr : r.title}</span>
                      {r.recordNumber && <span className="text-[10px] text-white/30">{r.recordNumber}</span>}
                    </div>
                    <div className="text-xs text-white/40">{isRTL && r.partyAr ? r.partyAr : r.party}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    {r.amount != null && <div className="text-sm font-semibold text-white">{fmt(r.amount)} {r.currency}</div>}
                    {r.dueDate && <div className="text-xs text-white/30">{r.dueDate}</div>}
                  </div>
                  <Select value={r.status} onValueChange={(v) => updateRecord.mutate({ id: r.id, data: { status: v as typeof r.status } })}>
                    <SelectTrigger className={`w-28 h-7 text-[11px] border ${statusColor[r.status] ?? ""} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                      <SelectItem value="draft">{t("Draft", "مسودة")}</SelectItem>
                      <SelectItem value="pending">{t("Pending", "معلق")}</SelectItem>
                      <SelectItem value="approved">{t("Approved", "موافق عليه")}</SelectItem>
                      <SelectItem value="paid">{t("Paid", "مدفوع")}</SelectItem>
                      <SelectItem value="cancelled">{t("Cancelled", "ملغى")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    onClick={() => { if (confirm(t("Delete this record?", "هل تريد حذف هذا السجل؟"))) deleteRecord.mutate({ id: r.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Decision Analysis Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="decision"
          title={t("ERP Intelligence — GPT-4o", "ذكاء تخطيط الموارد")}
          placeholder={t("e.g. What is the net profit trend? Which expense categories are highest?", "مثال: ما هو اتجاه صافي الربح؟")}
        />
      </div>

      {/* ── Add Record Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("New ERP Record", "سجل موارد جديد")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Title *", "العنوان *")}</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Q1 Sales Invoice" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Type", "النوع")}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as typeof form.type }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="sale">{t("Sale", "مبيعات")}</SelectItem>
                  <SelectItem value="invoice">{t("Invoice", "فاتورة")}</SelectItem>
                  <SelectItem value="purchase">{t("Purchase", "مشتريات")}</SelectItem>
                  <SelectItem value="expense">{t("Expense", "مصروف")}</SelectItem>
                  <SelectItem value="inventory">{t("Inventory", "مخزون")}</SelectItem>
                  <SelectItem value="other">{t("Other", "أخرى")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Party / Client", "الطرف / العميل")}</Label>
              <Input value={form.party} onChange={e => setForm(f => ({ ...f, party: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Al-Rashidi Group" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Amount (SAR)", "المبلغ (ريال)")}</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="150000" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Due Date", "تاريخ الاستحقاق")}</Label>
              <Input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="2026-04-30" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.title.trim()) { toast.error(t("Title is required", "العنوان مطلوب")); return; }
              addRecord.mutate({ ...form, amount: form.amount ? Number(form.amount) : undefined });
            }} disabled={addRecord.isPending} className="bg-violet-600 hover:bg-violet-500 text-white border-0">
              {addRecord.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add Record", "إضافة سجل")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
