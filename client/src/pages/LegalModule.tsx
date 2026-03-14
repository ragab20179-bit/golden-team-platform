/**
 * Legal Module — الشؤون القانونية وإدارة العقود
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const contracts = [
  { name: "IT Infrastructure Services Agreement",  nameAr: "اتفاقية خدمات البنية التحتية التقنية",  party: "TechCorp Arabia",      partyAr: "تك كورب العربية",       value: "SAR 480K",    valueAr: "480 ألف ريال",   expires: "Apr 2, 2026",   expiresAr: "2 أبريل 2026",   status: "Expiring Soon",      statusAr: "تنتهي قريبًا"      },
  { name: "Office Space Lease Agreement",           nameAr: "عقد إيجار المكاتب",                     party: "Al-Noor Properties",   partyAr: "عقارات النور",          value: "SAR 240K/yr", valueAr: "240 ألف ريال/سنة",expires: "Dec 31, 2026",  expiresAr: "31 ديسمبر 2026", status: "Active",             statusAr: "ساري"              },
  { name: "Software Development Contract",          nameAr: "عقد تطوير البرمجيات",                   party: "Gulf Dev Solutions",   partyAr: "حلول الخليج للتطوير",  value: "SAR 320K",    valueAr: "320 ألف ريال",   expires: "Jun 15, 2026",  expiresAr: "15 يونيو 2026",  status: "Active",             statusAr: "ساري"              },
  { name: "Security Services Contract",             nameAr: "عقد خدمات الأمن",                       party: "SafeGuard KSA",        partyAr: "سيف جارد السعودية",    value: "SAR 120K",    valueAr: "120 ألف ريال",   expires: "Apr 15, 2026",  expiresAr: "15 أبريل 2026",  status: "Expiring Soon",      statusAr: "تنتهي قريبًا"      },
  { name: "Consulting Services NDA",                nameAr: "اتفاقية سرية خدمات الاستشارات",         party: "Strategy Partners",    partyAr: "شركاء الاستراتيجية",   value: "N/A",         valueAr: "—",              expires: "Mar 20, 2026",  expiresAr: "20 مارس 2026",   status: "Signature Required", statusAr: "يتطلب التوقيع"     },
];

const statusColor: Record<string, string> = {
  "Active":             "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Expiring Soon":      "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Signature Required": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Expired":            "bg-white/5 text-white/30 border-white/10",
};

const complianceItems = [
  { item: "Commercial Registration renewal",  itemAr: "تجديد السجل التجاري",          done: true  },
  { item: "ZATCA VAT compliance",             itemAr: "الامتثال لضريبة القيمة المضافة (زاتكا)", done: true  },
  { item: "GOSI registration up to date",     itemAr: "تحديث تسجيل التأمينات الاجتماعية",       done: true  },
  { item: "Ministry of Commerce filings",     itemAr: "تقديمات وزارة التجارة",         done: false },
  { item: "Annual legal audit",               itemAr: "التدقيق القانوني السنوي",       done: false },
];

const recentActivity = [
  { action: "Contract reviewed by NEO Legal AI",  actionAr: "مراجعة العقد بواسطة NEO القانوني",   time: "1 hr ago",    timeAr: "منذ ساعة" },
  { action: "NDA sent to Strategy Partners",      actionAr: "إرسال اتفاقية السرية لشركاء الاستراتيجية", time: "3 hr ago", timeAr: "منذ 3 ساعات" },
  { action: "ZATCA filing submitted",             actionAr: "تقديم إقرار زاتكا",                  time: "Yesterday",   timeAr: "أمس" },
  { action: "Contract renewal reminder sent",     actionAr: "إرسال تذكير تجديد العقد",            time: "2 days ago",  timeAr: "منذ يومين" },
];

export default function LegalModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("Legal Module", "الشؤون القانونية")}
      subtitle={t("Contract Management & Compliance", "إدارة العقود والامتثال القانوني")}
      badge={t("1 Urgent", "1 عاجل")}
      badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Active Contracts", "عقود سارية"),        value: "18",  color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Expiring in 30d", "تنتهي خلال 30 يومًا"), value: "2",  color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Pending Signature", "بانتظار التوقيع"),   value: "1",  color: "text-rose-400",    bg: "border-rose-500/20" },
            { label: t("Compliance Score", "درجة الامتثال"),      value: "96%",color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Urgent alert */}
        <div className="glass-card border border-rose-500/20 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239,68,68,0.05)" }}>
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              {t("Action Required: NDA Signature Pending", "إجراء مطلوب: اتفاقية سرية بانتظار التوقيع")}
            </div>
            <div className="text-xs text-white/40">
              {t("Consulting Services NDA with Strategy Partners — Due March 20, 2026", "اتفاقية سرية خدمات الاستشارات مع شركاء الاستراتيجية — الموعد النهائي 20 مارس 2026")}
            </div>
          </div>
          <Button size="sm" onClick={() => toast.success(t("Signature workflow initiated", "بدء إجراء التوقيع"))} className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white border-0 shrink-0">
            {t("Sign Now", "توقيع الآن")}
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Contract Register", "سجل العقود")}
            </h2>
            <Button size="sm" onClick={() => toast.info(t("Add contract — full build", "إضافة عقد — قيد التطوير"))} className="h-7 text-[11px] bg-rose-600 hover:bg-rose-500 text-white border-0">
              <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("New Contract", "عقد جديد")}
            </Button>
          </div>
          <div className="space-y-2">
            {contracts.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="glass-card border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{isRTL ? c.nameAr : c.name}</div>
                    <div className="text-xs text-white/40">{isRTL ? c.partyAr : c.party} · {isRTL ? c.valueAr : c.value}</div>
                  </div>
                  <div className={`${isRTL ? "text-left" : "text-right"} shrink-0`}>
                    <div className="text-[11px] text-white/30">{t("Expires", "تنتهي")} {isRTL ? c.expiresAr : c.expires}</div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor[c.status]} shrink-0`}>
                    {isRTL ? c.statusAr : c.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Compliance Checklist", "قائمة الامتثال القانوني")}
            </h2>
            {complianceItems.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                {c.done ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className={`text-sm ${c.done ? "text-white/50 line-through" : "text-white/70"}`}>
                  {isRTL ? c.itemAr : c.item}
                </span>
              </div>
            ))}
          </div>

          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Recent Legal Activity", "آخر النشاطات القانونية")}
            </h2>
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs text-white/70">{isRTL ? a.actionAr : a.action}</div>
                  <div className="text-[11px] text-white/30">{isRTL ? a.timeAr : a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
