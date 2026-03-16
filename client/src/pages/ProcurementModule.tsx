/**
 * Procurement Module — إدارة المشتريات
 * Bilingual: Arabic / English
 * Live data from modules.procurement.list + modules.procurement.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, Loader2, Trash2, RefreshCw, ShoppingCart, CheckCircle, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProcurementBulkImport } from "@/components/ModuleBulkImport";
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
  pending:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ordered:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
  received:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-white/5 text-white/40 border-white/10",
};

const statusLabel: Record<string, [string, string]> = {
  pending:   ["Pending",   "معلق"],
  approved:  ["Approved",  "موافق عليه"],
  ordered:   ["Ordered",   "مُطلَب"],
  received:  ["Received",  "مُستلَم"],
  cancelled: ["Cancelled", "ملغى"],
};

export default function ProcurementModule() {
  const { t, isRTL } = useLanguage();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    itemName: "", itemNameAr: "", supplier: "", category: "",
    quantity: "", unit: "", unitPrice: "", totalPrice: "",
    currency: "SAR", deliveryDate: "", status: "pending" as const,
  });

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: items = [], isLoading, refetch } = trpc.modules.procurement.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.procurement.stats.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const addItem = trpc.modules.procurement.add.useMutation({
    onSuccess: () => {
      toast.success(t("Purchase order added", "تمت إضافة أمر الشراء"));
      utils.modules.procurement.list.invalidate();
      utils.modules.procurement.stats.invalidate();
      setAddOpen(false);
      setForm({ itemName: "", itemNameAr: "", supplier: "", category: "", quantity: "", unit: "", unitPrice: "", totalPrice: "", currency: "SAR", deliveryDate: "", status: "pending" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.modules.procurement.update.useMutation({
    onSuccess: () => {
      utils.modules.procurement.list.invalidate();
      utils.modules.procurement.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteItem = trpc.modules.procurement.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Item removed", "تم حذف العنصر"));
      utils.modules.procurement.list.invalidate();
      utils.modules.procurement.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <PortalLayout
      title={t("Procurement", "المشتريات")}
      subtitle={t("Purchase Orders & Vendor Management", "أوامر الشراء وإدارة الموردين")}
      badge={stats ? t(`${stats.total} Items`, `${stats.total} عنصر`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-orange-500/10 text-orange-400 border-orange-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Total Items",  "إجمالي العناصر"),  value: stats?.total    ?? "—", icon: ShoppingCart, color: "text-orange-400",  bg: "border-orange-500/20" },
            { label: t("Pending",      "معلق"),             value: stats?.pending  ?? "—", icon: Clock,        color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Approved",     "موافق عليه"),       value: stats?.approved ?? "—", icon: CheckCircle,  color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Received",     "مُستلَم"),          value: stats?.received ?? "—", icon: Package,      color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Purchase Orders Table ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Purchase Orders", "أوامر الشراء")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <Upload className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Import", "استيراد")}
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-orange-600 hover:bg-orange-500 text-white border-0 h-8 text-xs">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New PO", "أمر جديد")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading purchase orders…", "جارٍ تحميل أوامر الشراء…")}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No purchase orders yet. Add one or use bulk import.", "لا توجد أوامر شراء بعد.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{isRTL && p.itemNameAr ? p.itemNameAr : p.itemName}</span>
                      {p.poNumber && <span className="text-[10px] text-white/30">{p.poNumber}</span>}
                    </div>
                    <div className="text-xs text-white/40">
                      {p.supplier && <span className="mr-2">{p.supplier}</span>}
                      {p.category && <span>{p.category}</span>}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    {p.totalPrice && <div className="text-sm font-semibold text-white">{p.totalPrice.toLocaleString()} {p.currency ?? "SAR"}</div>}
                    {p.quantity && <div className="text-xs text-white/30">{p.quantity} {p.unit}</div>}
                  </div>
                  <Select
                    value={p.status}
                    onValueChange={(v) => updateStatus.mutate({ id: p.id, data: { status: v as typeof p.status } })}
                  >
                    <SelectTrigger className={`w-28 h-7 text-[11px] border ${statusColor[p.status] ?? ""} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                      {Object.entries(statusLabel).map(([val, [en, ar]]) => (
                        <SelectItem key={val} value={val}>{isRTL ? ar : en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    onClick={() => { if (confirm(t("Remove this item?", "هل تريد حذف هذا العنصر؟"))) deleteItem.mutate({ id: p.id }); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── Top Suppliers ── */}
        {stats && stats.suppliers && (stats.suppliers as string[]).length > 0 && (
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("Top Suppliers", "أبرز الموردين")}</h3>
            <div className="flex flex-wrap gap-2">
              {(stats.suppliers as string[]).map(s => (
                <Badge key={s} className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20">{s}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Financial Analysis Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="financial"
          title={t("Financial Intelligence — GPT-4o", "ذكاء مالي — GPT-4o")}
          placeholder={t(
            "e.g. What is total spend by category? Which vendors have the highest pending amounts?",
            "مثال: ما هو إجمالي الإنفاق حسب الفئة؟"
          )}
        />
      </div>

      <ProcurementBulkImport open={bulkOpen} onClose={() => setBulkOpen(false)} />

      {/* ── Add PO Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("New Purchase Order", "أمر شراء جديد")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Item Name *", "اسم العنصر *")}</Label>
              <Input value={form.itemName} onChange={e => setForm(f => ({ ...f, itemName: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. IT Equipment" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Supplier", "المورد")}</Label>
              <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Tech Supply Arabia" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Category", "الفئة")}</Label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="IT" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Quantity", "الكمية")}</Label>
              <Input value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="10" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Unit", "الوحدة")}</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="pcs" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Unit Price (SAR)", "سعر الوحدة (ريال)")}</Label>
              <Input value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="5000" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Total Price (SAR)", "السعر الإجمالي (ريال)")}</Label>
              <Input value={form.totalPrice} onChange={e => setForm(f => ({ ...f, totalPrice: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="50000" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Delivery Date", "تاريخ التسليم")}</Label>
              <Input value={form.deliveryDate} onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="2026-04-15" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.itemName.trim()) { toast.error(t("Item name is required", "اسم العنصر مطلوب")); return; }
              addItem.mutate({
                ...form,
                unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
                totalPrice: form.totalPrice ? Number(form.totalPrice) : undefined,
              });
            }} disabled={addItem.isPending} className="bg-orange-600 hover:bg-orange-500 text-white border-0">
              {addItem.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add PO", "إضافة أمر")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
