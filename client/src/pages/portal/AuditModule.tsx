/**
 * Audit & Logs Module — سجل التدقيق والمراقبة
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { Shield, Filter, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const logs = [
  { id: "LOG-89241", user: "Ahmed Al-Rashidi", userAr: "أحمد الراشدي",  action: "Approved PO-2026-042",                          actionAr: "اعتماد أمر الشراء PO-2026-042",                     module: "Procurement", moduleAr: "المشتريات",            ip: "192.168.1.45", time: "Mar 14, 10:32 AM", timeAr: "14 مارس، 10:32 ص", severity: "Info"    },
  { id: "LOG-89240", user: "NEO AI Core",       userAr: "محرك NEO الذكي", action: "Generated KPI report for March 2026",            actionAr: "إنشاء تقرير مؤشرات الأداء لمارس 2026",             module: "Analytics",   moduleAr: "التحليلات",           ip: "System",       time: "Mar 14, 10:00 AM", timeAr: "14 مارس، 10:00 ص", severity: "Info"    },
  { id: "LOG-89239", user: "Fatima Al-Zahra",   userAr: "فاطمة الزهراء",  action: "Modified employee record: Omar Abdullah",        actionAr: "تعديل سجل الموظف: عمر عبدالله",                    module: "HR",          moduleAr: "الموارد البشرية",     ip: "192.168.1.22", time: "Mar 14, 09:45 AM", timeAr: "14 مارس، 9:45 ص",  severity: "Warning" },
  { id: "LOG-89238", user: "ASTRA AMG",         userAr: "ASTRA AMG",      action: "Policy deviation detected in Procurement",       actionAr: "انحراف عن السياسة في وحدة المشتريات",               module: "Governance",  moduleAr: "الحوكمة",             ip: "System",       time: "Mar 14, 09:30 AM", timeAr: "14 مارس، 9:30 ص",  severity: "Alert"   },
  { id: "LOG-89237", user: "Sara Mohammed",     userAr: "سارة محمد",      action: "Submitted leave request",                       actionAr: "تقديم طلب إجازة",                                   module: "HR",          moduleAr: "الموارد البشرية",     ip: "192.168.1.31", time: "Mar 14, 09:15 AM", timeAr: "14 مارس، 9:15 ص",  severity: "Info"    },
  { id: "LOG-89236", user: "Khalid Hassan",     userAr: "خالد حسن",       action: "Updated NCR-2026-013 status",                   actionAr: "تحديث حالة تقرير عدم المطابقة NCR-2026-013",        module: "QMS",         moduleAr: "إدارة الجودة",        ip: "192.168.1.18", time: "Mar 14, 09:00 AM", timeAr: "14 مارس، 9:00 ص",  severity: "Info"    },
  { id: "LOG-89235", user: "System",            userAr: "النظام",          action: "Odoo ERP sync completed — 847 records",         actionAr: "اكتملت مزامنة Odoo ERP — 847 سجلًا",               module: "ERP",         moduleAr: "تخطيط الموارد",       ip: "System",       time: "Mar 14, 08:57 AM", timeAr: "14 مارس، 8:57 ص",  severity: "Info"    },
  { id: "LOG-89234", user: "Nour Ibrahim",      userAr: "نور إبراهيم",    action: "Accessed contract: IT Infrastructure Services", actionAr: "الوصول إلى عقد: خدمات البنية التحتية التقنية",     module: "Legal",       moduleAr: "الشؤون القانونية",   ip: "192.168.1.55", time: "Mar 14, 08:30 AM", timeAr: "14 مارس، 8:30 ص",  severity: "Info"    },
];

const severityColor: Record<string, string> = {
  "Info":     "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Warning":  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Alert":    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Critical": "bg-red-600/10 text-red-400 border-red-600/20",
};

const severityColorAr: Record<string, string> = {
  "Info": "معلومة", "Warning": "تحذير", "Alert": "تنبيه", "Critical": "حرج",
};

const moduleColor: Record<string, string> = {
  "Procurement": "text-orange-400", "Analytics": "text-amber-400", "HR": "text-cyan-400",
  "Governance":  "text-red-400",    "QMS":       "text-teal-400",  "ERP": "text-emerald-400",
  "Legal":       "text-rose-400",   "CRM":       "text-violet-400",
};

const tableHeaders = [
  { en: "Log ID",    ar: "رقم السجل" },
  { en: "User",      ar: "المستخدم" },
  { en: "Action",    ar: "الإجراء" },
  { en: "Module",    ar: "الوحدة" },
  { en: "IP Address",ar: "عنوان IP" },
  { en: "Timestamp", ar: "التوقيت" },
  { en: "Severity",  ar: "الخطورة" },
];

export default function AuditModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("Audit & Logs", "التدقيق والسجلات")}
      subtitle={t("Full System Activity Tracking — ASTRA AMG Governed", "تتبع نشاط النظام الكامل — محكوم بـ ASTRA AMG")}
      badge={t("Real-time", "فوري")}
      badgeColor="bg-slate-500/10 text-slate-400 border-slate-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Events Today", "أحداث اليوم"),  value: "247", color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Warnings", "تحذيرات"),           value: "3",   color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Alerts", "تنبيهات"),             value: "1",   color: "text-rose-400",    bg: "border-rose-500/20" },
            { label: t("Active Users", "مستخدمون نشطون"),value: "12",  color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Alert banner */}
        <div className="glass-card border border-rose-500/20 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239,68,68,0.04)" }}>
          <Shield className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">
              {t("ASTRA AMG Alert: Policy Deviation Detected", "تنبيه ASTRA AMG: انحراف عن السياسة")}
            </div>
            <div className="text-xs text-white/40">
              {t("Procurement module — Vendor approval bypassed for PO under SAR 50K threshold. LOG-89238",
                 "وحدة المشتريات — تجاوز موافقة المورد لأمر شراء دون حد 50,000 ريال. LOG-89238")}
            </div>
          </div>
          <Button size="sm" onClick={() => toast.info(t("Reviewing policy deviation", "مراجعة الانحراف عن السياسة"))} variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/5 h-8 text-xs shrink-0">
            <Eye className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Review", "مراجعة")}
          </Button>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Audit Log — March 14, 2026", "سجل التدقيق — 14 مارس 2026")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast.info(t("Filter panel — full build", "لوحة التصفية — قيد التطوير"))} variant="outline" className="border-white/10 text-white/50 hover:text-white h-7 text-[11px]">
                <Filter className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Filter", "تصفية")}
              </Button>
              <Button size="sm" onClick={() => toast.success(t("Audit log exported", "تم تصدير سجل التدقيق"))} variant="outline" className="border-white/10 text-white/50 hover:text-white h-7 text-[11px]">
                <Download className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Export", "تصدير")}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" dir={isRTL ? "rtl" : "ltr"}>
              <thead>
                <tr className="border-b border-white/5">
                  {tableHeaders.map(h => (
                    <th key={h.en} className={`${isRTL ? "text-right" : "text-left"} px-4 py-3 text-white/30 font-medium whitespace-nowrap`}>
                      {isRTL ? h.ar : h.en}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-mono text-white/40">{log.id}</td>
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">{isRTL ? log.userAr : log.user}</td>
                    <td className="px-4 py-3 text-white/60 max-w-48 truncate">{isRTL ? log.actionAr : log.action}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-medium ${moduleColor[log.module] || "text-white/50"}`}>
                        {isRTL ? log.moduleAr : log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/30 whitespace-nowrap">{log.ip}</td>
                    <td className="px-4 py-3 text-white/30 whitespace-nowrap">{isRTL ? log.timeAr : log.time}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] border ${severityColor[log.severity]}`}>
                        {isRTL ? severityColorAr[log.severity] : log.severity}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
