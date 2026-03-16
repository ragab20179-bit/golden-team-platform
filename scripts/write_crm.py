import pathlib

content = r"""/**
 * CRM Module — إدارة علاقات العملاء
 * Bilingual: Arabic / English
 * Live data from modules.crm.list + modules.crm.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Loader2, Trash2, RefreshCw, TrendingUp, Star, DollarSign, Target } from "lucide-react";
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

const stageColor: Record<string, string> = {
  new:         "bg-white/5 text-white/40 border-white/10",
  contacted:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  qualified:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
  proposal:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  negotiation: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  won:         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  lost:        "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const typeColor: Record<string, string> = {
  lead:     "bg-blue-500/20 text-blue-300",
  prospect: "bg-violet-500/20 text-violet-300",
  client:   "bg-emerald-500/20 text-emerald-300",
  partner:  "bg-amber-500/20 text-amber-300",
};

export default function CRMModule() {
  const { t, isRTL } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "", fullNameAr: "", company: "", companyAr: "",
    email: "", phone: "", type: "lead" as const,
    stage: "new" as const, dealValue: "", probability: "0",
    source: "", assignedTo: "", notes: "",
  });

  const utils = trpc.useUtils();

  const { data: contacts = [], isLoading, refetch } = trpc.modules.crm.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.crm.stats.useQuery();

  const addContact = trpc.modules.crm.add.useMutation({
    onSuccess: () => {
      toast.success(t("Contact added", "تمت إضافة جهة الاتصال"));
      utils.modules.crm.list.invalidate();
      utils.modules.crm.stats.invalidate();
      setAddOpen(false);
      setForm({ fullName: "", fullNameAr: "", company: "", companyAr: "", email: "", phone: "", type: "lead", stage: "new", dealValue: "", probability: "0", source: "", assignedTo: "", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateContact = trpc.modules.crm.update.useMutation({
    onSuccess: () => {
      utils.modules.crm.list.invalidate();
      utils.modules.crm.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteContact = trpc.modules.crm.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Contact deleted", "تم حذف جهة الاتصال"));
      utils.modules.crm.list.invalidate();
      utils.modules.crm.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const fmt = (n: number) => n.toLocaleString("en-SA", { maximumFractionDigits: 0 });

  return (
    <PortalLayout
      title={t("CRM", "إدارة العملاء")}
      subtitle={t("Customer Relationship Management — Live Pipeline", "إدارة علاقات العملاء — خط الأعمال الحي")}
      badge={stats ? t(`${stats.total} Contacts`, `${stats.total} جهة اتصال`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Pipeline (SAR)",  "خط الأعمال (ريال)"),  value: stats ? fmt(stats.totalPipelineValueSar) : "—", icon: TrendingUp, color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Won Value (SAR)", "قيمة المكسوب (ريال)"), value: stats ? fmt(stats.wonValueSar ?? 0)      : "—", icon: DollarSign, color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: t("Clients",         "العملاء"),              value: stats?.clients                           ?? "—", icon: Star,       color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Won / Lost",      "مكسوب / خسارة"),       value: stats ? `${stats.won} / ${stats.lost}`   : "—", icon: Target,     color: "text-violet-400",  bg: "border-violet-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {stats?.byStage && (
          <div className="glass-card border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("Pipeline Stages", "مراحل خط الأعمال")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byStage).map(([stage, count]) => (
                <span key={stage} className={`text-xs px-2 py-1 rounded-md border ${stageColor[stage] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                  {stage}: {count as number}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Contacts & Leads", "جهات الاتصال والعملاء المحتملون")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New Contact", "جهة اتصال جديدة")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading contacts…", "جارٍ تحميل جهات الاتصال…")}
            </div>
          ) : contacts.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No contacts yet. Add one to start.", "لا توجد جهات اتصال بعد.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 flex items-center justify-center text-sm font-bold text-white/70 flex-shrink-0">
                    {(isRTL && c.fullNameAr ? c.fullNameAr : c.fullName).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white">{isRTL && c.fullNameAr ? c.fullNameAr : c.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${typeColor[c.type] ?? ""}`}>{c.type}</span>
                    </div>
                    <div className="text-xs text-white/40">{isRTL && c.companyAr ? c.companyAr : c.company}</div>
                  </div>
                  <div className="text-right hidden sm:block">
                    {c.dealValue != null && <div className="text-sm font-semibold text-white">{fmt(c.dealValue)} SAR</div>}
                    {c.probability != null && <div className="text-xs text-white/30">{c.probability}% {t("probability", "احتمالية")}</div>}
                  </div>
                  <Select value={c.stage} onValueChange={(v) => updateContact.mutate({ id: c.id, data: { stage: v as typeof c.stage } })}>
                    <SelectTrigger className={`w-32 h-7 text-[11px] border ${stageColor[c.stage] ?? ""} bg-transparent`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs">
                      {["new","contacted","qualified","proposal","negotiation","won","lost"].map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                    onClick={() => { if (confirm(t("Delete this contact?", "هل تريد حذف جهة الاتصال؟"))) deleteContact.mutate({ id: c.id }); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="business"
          title={t("CRM Intelligence — GPT-4o", "ذكاء إدارة العملاء")}
          placeholder={t("e.g. Which leads have the highest win probability? What is the pipeline conversion rate?", "مثال: ما هي العملاء المحتملون ذوو أعلى احتمالية فوز؟")}
        />
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("New Contact", "جهة اتصال جديدة")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Full Name *", "الاسم الكامل *")}</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Ahmed Al-Rashidi" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Company", "الشركة")}</Label>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Al-Rashidi Group" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Type", "النوع")}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as typeof form.type }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="lead">{t("Lead", "عميل محتمل")}</SelectItem>
                  <SelectItem value="prospect">{t("Prospect", "مرشح")}</SelectItem>
                  <SelectItem value="client">{t("Client", "عميل")}</SelectItem>
                  <SelectItem value="partner">{t("Partner", "شريك")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Deal Value (SAR)", "قيمة الصفقة (ريال)")}</Label>
              <Input value={form.dealValue} onChange={e => setForm(f => ({ ...f, dealValue: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="500000" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Probability (%)", "الاحتمالية (%)")}</Label>
              <Input value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" min="0" max="100" placeholder="60" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Email", "البريد الإلكتروني")}</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="email" placeholder="ahmed@example.com" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Phone", "الهاتف")}</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="+966 50 000 0000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={() => {
              if (!form.fullName.trim()) { toast.error(t("Full name is required", "الاسم الكامل مطلوب")); return; }
              addContact.mutate({ ...form, dealValue: form.dealValue ? Number(form.dealValue) : undefined, probability: Number(form.probability) });
            }} disabled={addContact.isPending} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {addContact.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add Contact", "إضافة جهة اتصال")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
"""

pathlib.Path('/home/ubuntu/golden-team-platform/client/src/pages/CRMModule.tsx').write_text(content)
print("CRMModule.tsx written successfully")
