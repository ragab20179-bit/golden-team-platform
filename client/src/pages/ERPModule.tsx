/**
 * Odoo ERP Integration Module — نظام تخطيط موارد المؤسسة
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { Database, RefreshCw, TrendingUp, FileText, Package, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const revenueData = [
  { month: "Oct", monthAr: "أكت", revenue: 1800 },
  { month: "Nov", monthAr: "نوف", revenue: 2100 },
  { month: "Dec", monthAr: "ديس", revenue: 2400 },
  { month: "Jan", monthAr: "يناير", revenue: 1950 },
  { month: "Feb", monthAr: "فبراير", revenue: 2150 },
  { month: "Mar", monthAr: "مارس", revenue: 2400 },
];

const invoices = [
  { id: "INV-2026-089", client: "Al-Noor Construction",  clientAr: "شركة النور للإنشاءات",    amount: "SAR 145,000", amountAr: "145,000 ريال", due: "Mar 20", dueAr: "20 مارس", status: "Overdue",  statusAr: "متأخر"           },
  { id: "INV-2026-090", client: "Gulf Tech Solutions",    clientAr: "حلول الخليج التقنية",     amount: "SAR 87,500",  amountAr: "87,500 ريال",  due: "Mar 25", dueAr: "25 مارس", status: "Pending",  statusAr: "قيد الانتظار"    },
  { id: "INV-2026-091", client: "Saudi Facilities Co.",   clientAr: "شركة المرافق السعودية",   amount: "SAR 220,000", amountAr: "220,000 ريال", due: "Apr 1",  dueAr: "1 أبريل", status: "Sent",     statusAr: "مُرسَل"          },
  { id: "INV-2026-092", client: "Eastern Contracting",    clientAr: "المقاولات الشرقية",       amount: "SAR 63,000",  amountAr: "63,000 ريال",  due: "Apr 5",  dueAr: "5 أبريل", status: "Draft",    statusAr: "مسودة"           },
];

const statusColor: Record<string, string> = {
  "Overdue": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Pending": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Sent":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Draft":   "bg-white/5 text-white/40 border-white/10",
};

const erpModules = [
  { en: "Accounting",    ar: "المحاسبة" },
  { en: "Inventory",     ar: "المخزون" },
  { en: "Purchase",      ar: "المشتريات" },
  { en: "Sales",         ar: "المبيعات" },
  { en: "Manufacturing", ar: "التصنيع" },
  { en: "Project",       ar: "المشاريع" },
  { en: "CRM",           ar: "إدارة العملاء" },
  { en: "HR Payroll",    ar: "رواتب الموارد البشرية" },
];

export default function ERPModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("Odoo ERP", "نظام ERP")}
      subtitle={t("Enterprise Resource Planning — Integrated", "تخطيط موارد المؤسسة — متكامل")}
      badge={t("Synced", "متزامن")}
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Sync status */}
        <div className="glass-card border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-white">{t("Odoo ERP — Connected", "نظام ERP — متصل")}</div>
              <div className="text-xs text-white/40">{t("Last sync: 3 minutes ago · All modules active", "آخر مزامنة: منذ 3 دقائق · جميع الوحدات نشطة")}</div>
            </div>
          </div>
          <Button size="sm" onClick={() => toast.success(t("ERP sync triggered", "تم تشغيل مزامنة ERP"))} variant="outline" className="border-white/10 text-white/60 hover:text-white h-8 text-xs">
            <RefreshCw className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Sync Now", "مزامنة الآن")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Revenue MTD", "الإيرادات الشهرية"),    value: t("SAR 2.4M", "2.4 مليون ريال"),  icon: TrendingUp, color: "text-emerald-400", bg: "border-emerald-500/20", change: "+12%" },
            { label: t("Open Invoices", "فواتير مفتوحة"),       value: "12",                              icon: FileText,   color: "text-blue-400",    bg: "border-blue-500/20",    change: t("SAR 890K", "890 ألف ريال") },
            { label: t("Inventory Alerts", "تنبيهات المخزون"),  value: "3",                               icon: Package,    color: "text-amber-400",   bg: "border-amber-500/20",   change: t("Below reorder", "دون حد إعادة الطلب") },
            { label: t("AP Due This Week", "مستحقات الأسبوع"),  value: "5",                               icon: CreditCard, color: "text-violet-400",  bg: "border-violet-500/20",  change: t("SAR 124K", "124 ألف ريال") },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              <div className="text-[11px] text-white/30 mt-1">{s.change}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Revenue Trend (SAR K)", "اتجاه الإيرادات (ألف ريال)")}
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueData}>
                <XAxis dataKey={isRTL ? "monthAr" : "month"} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0D1B3E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Invoices */}
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("Open Invoices", "الفواتير المفتوحة")}
              </h2>
              <Button size="sm" onClick={() => toast.info(t("Create invoice — Odoo integration", "إنشاء فاتورة — تكامل Odoo"))} className="h-7 text-[11px] bg-blue-600 hover:bg-blue-500 text-white border-0">
                + {t("New Invoice", "فاتورة جديدة")}
              </Button>
            </div>
            <div className="space-y-2">
              {invoices.map((inv, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{inv.id}</div>
                    <div className="text-[11px] text-white/40">{isRTL ? inv.clientAr : inv.client}</div>
                  </div>
                  <div className={isRTL ? "text-left" : "text-right"}>
                    <div className="text-xs font-semibold text-white">{isRTL ? inv.amountAr : inv.amount}</div>
                    <div className="text-[11px] text-white/30">{t("Due", "استحقاق")} {isRTL ? inv.dueAr : inv.due}</div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor[inv.status]}`}>
                    {isRTL ? inv.statusAr : inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Odoo Modules Grid */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("Odoo Active Modules", "وحدات Odoo النشطة")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {erpModules.map((mod, i) => (
              <button key={i} onClick={() => toast.info(t(`${mod.en} module — Odoo integration active`, `وحدة ${mod.ar} — تكامل Odoo نشط`))}
                className="glass-card border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl text-left transition-all group">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mb-2" />
                <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{isRTL ? mod.ar : mod.en}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{t("Active", "نشط")}</div>
              </button>
            ))}
          </div>

      {/* AI Module Query Panel */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="decision"
          title={t("ERP Decision Intelligence — GPT-4o", "ذكاء قرارات ERP")}
          placeholder={t(
            "e.g. What ASTRA AMG policy rules apply to this procurement? Analyze recent DENY decisions.",
            "مثال: ما قواعد سياسة ASTRA AMG التي تنطبق على هذه المشتريات؟"
          )}
        />
      </div>
        </div>
      </div>
    </PortalLayout>
  );
}
