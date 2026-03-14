/**
 * Procurement Module — إدارة المشتريات
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const pos = [
  { id: "PO-2026-041", vendor: "Tech Supply Arabia",  vendorAr: "تك سبلاي العربية",    items: "IT Equipment",      itemsAr: "معدات تقنية المعلومات",  amount: "SAR 145,000", amountAr: "145,000 ريال", status: "Pending Approval", statusAr: "بانتظار الموافقة", date: "Mar 12", dateAr: "12 مارس" },
  { id: "PO-2026-042", vendor: "Office Pro KSA",      vendorAr: "أوفيس برو السعودية",  items: "Office Supplies",   itemsAr: "مستلزمات مكتبية",        amount: "SAR 28,500",  amountAr: "28,500 ريال",  status: "Approved",         statusAr: "موافق عليه",       date: "Mar 10", dateAr: "10 مارس" },
  { id: "PO-2026-043", vendor: "Cloud Services Ltd",  vendorAr: "كلاود سيرفيسز",       items: "Software Licenses", itemsAr: "تراخيص برمجيات",         amount: "SAR 167,000", amountAr: "167,000 ريال", status: "Pending Approval", statusAr: "بانتظار الموافقة", date: "Mar 14", dateAr: "14 مارس" },
  { id: "PO-2026-044", vendor: "Maintenance Corp",    vendorAr: "شركة الصيانة",         items: "Facility Services", itemsAr: "خدمات المرافق",           amount: "SAR 55,000",  amountAr: "55,000 ريال",  status: "Received",         statusAr: "مُستلَم",          date: "Mar 8",  dateAr: "8 مارس"  },
];

const statusColor: Record<string, string> = {
  "Pending Approval": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Approved":         "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Received":         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Rejected":         "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const expiringContracts = [
  { vendor: "IT Infrastructure Ltd",  vendorAr: "شركة البنية التحتية التقنية", expires: "Apr 2, 2026",  expiresAr: "2 أبريل 2026",  value: "SAR 480K", valueAr: "480 ألف ريال" },
  { vendor: "Security Services Co.",  vendorAr: "شركة خدمات الأمن",           expires: "Apr 15, 2026", expiresAr: "15 أبريل 2026", value: "SAR 120K", valueAr: "120 ألف ريال" },
];

const topVendors = [
  { name: "Tech Supply Arabia",  nameAr: "تك سبلاي العربية",   spend: "SAR 620K", spendAr: "620 ألف ريال", rating: 4.8 },
  { name: "Cloud Services Ltd",  nameAr: "كلاود سيرفيسز",      spend: "SAR 480K", spendAr: "480 ألف ريال", rating: 4.6 },
  { name: "Office Pro KSA",      nameAr: "أوفيس برو السعودية", spend: "SAR 180K", spendAr: "180 ألف ريال", rating: 4.4 },
];

export default function ProcurementModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("Procurement", "المشتريات")}
      subtitle={t("Purchase Orders & Vendor Management", "أوامر الشراء وإدارة الموردين")}
      badge={t("8 Active RFQs", "8 طلبات عروض نشطة")}
      badgeColor="bg-orange-500/10 text-orange-400 border-orange-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Active RFQs", "طلبات عروض نشطة"),   value: "8",              color: "text-orange-400",  bg: "border-orange-500/20" },
            { label: t("POs Pending", "أوامر شراء معلقة"),   value: "3",              color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("MTD Spend", "الإنفاق الشهري"),        value: t("SAR 395K", "395 ألف ريال"), color: "text-blue-400", bg: "border-blue-500/20" },
            { label: t("Savings MTD", "الوفورات الشهرية"),    value: t("SAR 180K", "180 ألف ريال"), color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Purchase Orders", "أوامر الشراء")}
            </h2>
            <Button size="sm" onClick={() => toast.info(t("Create PO — full build", "إنشاء أمر شراء — قيد التطوير"))} className="h-7 text-[11px] bg-orange-600 hover:bg-orange-500 text-white border-0">
              <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New PO", "أمر شراء جديد")}
            </Button>
          </div>
          <div className="space-y-3">
            {pos.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{p.id}</span>
                    <Badge className={`text-[10px] border ${statusColor[p.status]}`}>
                      {isRTL ? p.statusAr : p.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-white/40">{isRTL ? p.vendorAr : p.vendor} · {isRTL ? p.itemsAr : p.items}</div>
                </div>
                <div className={isRTL ? "text-left" : "text-right"}>
                  <div className="text-sm font-semibold text-white">{isRTL ? p.amountAr : p.amount}</div>
                  <div className="text-[11px] text-white/30">{isRTL ? p.dateAr : p.date}</div>
                </div>
                {p.status === "Pending Approval" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => toast.success(t("PO approved", "تمت الموافقة على أمر الشراء"))} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                      {t("Approve", "موافقة")}
                    </Button>
                    <Button size="sm" onClick={() => toast.error(t("PO rejected", "تم رفض أمر الشراء"))} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5">
                      {t("Reject", "رفض")}
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Contracts Expiring Soon", "عقود تنتهي قريبًا")}
            </h2>
            {expiringContracts.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 mb-2">
                <div>
                  <div className="text-sm text-white">{isRTL ? c.vendorAr : c.vendor}</div>
                  <div className="text-xs text-amber-400">{t("Expires:", "تنتهي:")} {isRTL ? c.expiresAr : c.expires}</div>
                </div>
                <div className="text-sm font-semibold text-white">{isRTL ? c.valueAr : c.value}</div>
              </div>
            ))}
          </div>

          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Top Vendors", "أبرز الموردين")}
            </h2>
            {topVendors.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 mb-2">
                <div>
                  <div className="text-sm text-white">{isRTL ? v.nameAr : v.name}</div>
                  <div className="text-xs text-white/40">{t("YTD:", "منذ بداية العام:")} {isRTL ? v.spendAr : v.spend}</div>
                </div>
                <div className="text-amber-400 text-sm font-semibold">★ {v.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
