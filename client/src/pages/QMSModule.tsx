/**
 * QMS Module — نظام إدارة الجودة ISO 9001
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { FileCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { useLanguage } from "@/contexts/LanguageContext";

const ncrs = [
  { id: "NCR-2026-012", area: "IT Solutions",  areaAr: "حلول تقنية المعلومات", desc: "Software delivery SLA missed by 2 days",   descAr: "تأخر تسليم البرمجيات يومين عن مستوى الخدمة المتفق عليه",  severity: "Minor",  severityAr: "طفيف",  status: "Open",        statusAr: "مفتوح",       due: "Mar 20", dueAr: "20 مارس" },
  { id: "NCR-2026-013", area: "Procurement",   areaAr: "المشتريات",            desc: "Vendor evaluation form incomplete",          descAr: "نموذج تقييم المورد غير مكتمل",                              severity: "Minor",  severityAr: "طفيف",  status: "In Progress", statusAr: "قيد التنفيذ", due: "Mar 18", dueAr: "18 مارس" },
];

const docs = [
  { name: "Quality Manual v4.2",              nameAr: "دليل الجودة الإصدار 4.2",           type: "Policy",    typeAr: "سياسة",   status: "Approved",        statusAr: "معتمد",           rev: "4.2" },
  { name: "Procurement Procedure QP-04",       nameAr: "إجراء المشتريات QP-04",             type: "Procedure", typeAr: "إجراء",   status: "Pending Review",  statusAr: "بانتظار المراجعة", rev: "3.1" },
  { name: "Customer Satisfaction Survey",      nameAr: "استبيان رضا العملاء",               type: "Form",      typeAr: "نموذج",   status: "Approved",        statusAr: "معتمد",           rev: "2.0" },
  { name: "Internal Audit Checklist",          nameAr: "قائمة مراجعة التدقيق الداخلي",     type: "Checklist", typeAr: "قائمة",   status: "Pending Approval",statusAr: "بانتظار الاعتماد", rev: "5.0" },
];

const clauses = [
  { clause: "4. Context",     clauseAr: "4. السياق",       score: 100 },
  { clause: "5. Leadership",  clauseAr: "5. القيادة",      score: 98  },
  { clause: "6. Planning",    clauseAr: "6. التخطيط",      score: 96  },
  { clause: "7. Support",     clauseAr: "7. الدعم",        score: 99  },
  { clause: "8. Operations",  clauseAr: "8. التشغيل",      score: 97  },
  { clause: "9. Performance", clauseAr: "9. الأداء",       score: 98  },
  { clause: "10. Improvement",clauseAr: "10. التحسين",     score: 95  },
  { clause: "Overall",        clauseAr: "الإجمالي",        score: 98  },
];

export default function QMSModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("QMS / ISO 9001", "نظام إدارة الجودة")}
      subtitle={t("Quality Management System", "نظام إدارة الجودة — معيار ISO 9001")}
      badge={t("98.1% Compliant", "98.1% امتثال")}
      badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Compliance Score", "درجة الامتثال"),  value: "98.1%", color: "text-teal-400",  bg: "border-teal-500/20" },
            { label: t("Open NCRs", "تقارير عدم مطابقة"),     value: "2",     color: "text-amber-400", bg: "border-amber-500/20" },
            { label: t("CAPA Overdue", "إجراءات تصحيحية متأخرة"), value: "1", color: "text-rose-400",  bg: "border-rose-500/20" },
            { label: t("Docs Pending", "وثائق معلقة"),         value: "4",     color: "text-blue-400",  bg: "border-blue-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ISO 9001 Clauses */}
        <div className="glass-card border border-white/5 p-5 rounded-xl">
          <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {t("ISO 9001:2015 Clause Compliance", "امتثال بنود ISO 9001:2015")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {clauses.map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-white/5">
                <div className="text-xs text-white/40 mb-1">{isRTL ? c.clauseAr : c.clause}</div>
                <div className="text-lg font-bold text-teal-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.score}%</div>
                <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${c.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* NCRs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("Non-Conformance Reports", "تقارير عدم المطابقة")}
              </h2>
              <Button size="sm" onClick={() => toast.info(t("Raise NCR — full build", "رفع تقرير عدم مطابقة — قيد التطوير"))} className="h-7 text-[11px] bg-teal-600 hover:bg-teal-500 text-white border-0">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Raise NCR", "رفع تقرير")}
              </Button>
            </div>
            <div className="space-y-3">
              {ncrs.map((n, i) => (
                <div key={i} className="glass-card border border-amber-500/10 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{n.id}</div>
                      <div className="text-xs text-white/40">{isRTL ? n.areaAr : n.area}</div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                      {isRTL ? n.severityAr : n.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/50 mb-2">{isRTL ? n.descAr : n.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">{t("Due:", "الاستحقاق:")} {isRTL ? n.dueAr : n.due}</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">
                      {isRTL ? n.statusAr : n.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Control */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Document Control", "ضبط الوثائق")}
            </h2>
            <div className="space-y-2">
              {docs.map((d, i) => (
                <div key={i} className="glass-card border border-white/5 p-3 rounded-xl flex items-center gap-3 hover:border-white/10 transition-colors">
                  <FileCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{isRTL ? d.nameAr : d.name}</div>
                    <div className="text-[11px] text-white/30">{isRTL ? d.typeAr : d.type} · {t("Rev", "إصدار")} {d.rev}</div>
                  </div>
                  <Badge className={`text-[10px] border ${d.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                    {isRTL ? d.statusAr : d.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

      {/* AI Module Query Panel */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="qms"
          title={t("QMS Intelligence — ISO 9001 AI", "ذكاء نظام إدارة الجودة")}
          placeholder={t(
            "e.g. What ISO 9001 clause applies to our supplier evaluation? Review our QMS documents.",
            "مثال: ما بند ISO 9001 الذي ينطبق على تقييم الموردين؟"
          )}
        />
      </div>
        </div>
      </div>
    </PortalLayout>
  );
}
