/**
 * HR Module — نظام إدارة الموارد البشرية
 * Bilingual: Arabic / English
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Clock, DollarSign, Award, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const employees = [
  { name: "Ahmed Al-Rashidi",  nameAr: "أحمد الراشدي",   role: "Senior IT Engineer",    roleAr: "مهندس تقنية معلومات أول",  dept: "IT Solutions",  deptAr: "حلول تقنية المعلومات", status: "Active",   statusAr: "نشط",   avatar: "AA" },
  { name: "Sara Mohammed",     nameAr: "سارة محمد",       role: "Business Analyst",      roleAr: "محللة أعمال",              dept: "Business Dev",  deptAr: "تطوير الأعمال",        status: "Active",   statusAr: "نشط",   avatar: "SM" },
  { name: "Khalid Hassan",     nameAr: "خالد حسن",        role: "QMS Coordinator",       roleAr: "منسق إدارة الجودة",        dept: "Quality",       deptAr: "الجودة",               status: "Active",   statusAr: "نشط",   avatar: "KH" },
  { name: "Fatima Al-Zahra",   nameAr: "فاطمة الزهراء",   role: "HR Manager",            roleAr: "مديرة الموارد البشرية",    dept: "HR",            deptAr: "الموارد البشرية",      status: "Active",   statusAr: "نشط",   avatar: "FA" },
  { name: "Omar Abdullah",     nameAr: "عمر عبدالله",     role: "Procurement Officer",   roleAr: "مسؤول مشتريات",            dept: "Procurement",   deptAr: "المشتريات",            status: "On Leave", statusAr: "إجازة", avatar: "OA" },
  { name: "Nour Ibrahim",      nameAr: "نور إبراهيم",     role: "Legal Counsel",         roleAr: "مستشار قانوني",            dept: "Legal",         deptAr: "الشؤون القانونية",     status: "Active",   statusAr: "نشط",   avatar: "NI" },
];

const leaveRequests = [
  { name: "Omar Abdullah",  nameAr: "عمر عبدالله",  type: "Annual Leave",  typeAr: "إجازة سنوية",    days: 5, from: "Mar 18", fromAr: "18 مارس", status: "Pending",  statusAr: "قيد الانتظار" },
  { name: "Sara Mohammed",  nameAr: "سارة محمد",    type: "Sick Leave",    typeAr: "إجازة مرضية",    days: 2, from: "Mar 15", fromAr: "15 مارس", status: "Approved", statusAr: "موافق عليه"   },
  { name: "Khalid Hassan",  nameAr: "خالد حسن",     type: "Emergency",     typeAr: "طارئة",          days: 1, from: "Mar 14", fromAr: "14 مارس", status: "Pending",  statusAr: "قيد الانتظار" },
];

const deptColors: Record<string, string> = {
  "IT Solutions": "text-blue-400 bg-blue-500/10",
  "Business Dev": "text-cyan-400 bg-cyan-500/10",
  "Quality":      "text-teal-400 bg-teal-500/10",
  "HR":           "text-violet-400 bg-violet-500/10",
  "Procurement":  "text-orange-400 bg-orange-500/10",
  "Legal":        "text-rose-400 bg-rose-500/10",
};

export default function HRModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("HR System", "الموارد البشرية")}
      subtitle={t("Human Resources Management", "إدارة الموارد البشرية")}
      badge={t("47 Employees", "47 موظفًا")}
      badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Total Employees", "إجمالي الموظفين"),   value: "47",        icon: Users,       color: "text-blue-400",   bg: "border-blue-500/20" },
            { label: t("On Leave Today", "في إجازة اليوم"),      value: "3",         icon: Clock,       color: "text-amber-400",  bg: "border-amber-500/20" },
            { label: t("Payroll (Monthly)", "الرواتب الشهرية"),  value: "284K ريال", icon: DollarSign,  color: "text-emerald-400",bg: "border-emerald-500/20" },
            { label: t("Avg Performance", "متوسط الأداء"),       value: "87%",       icon: Award,       color: "text-violet-400", bg: "border-violet-500/20" },
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
          {/* Employee Directory */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("Employee Directory", "دليل الموظفين")}
              </h2>
              <Button size="sm" onClick={() => toast.info(t("Add employee — coming in full build", "إضافة موظف — قيد التطوير"))} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
                <UserPlus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Add Employee", "إضافة موظف")}
              </Button>
            </div>
            <div className="space-y-2">
              {employees.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">{e.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{isRTL ? e.nameAr : e.name}</div>
                    <div className="text-xs text-white/40">{isRTL ? e.roleAr : e.role}</div>
                  </div>
                  <Badge className={`text-[10px] ${deptColors[e.dept] || "text-white/50 bg-white/5"}`}>{isRTL ? e.deptAr : e.dept}</Badge>
                  <Badge className={`text-[10px] ${e.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                    {isRTL ? e.statusAr : e.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leave Requests */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Leave Requests", "طلبات الإجازة")}
            </h2>
            <div className="space-y-3">
              {leaveRequests.map((r, i) => (
                <div key={i} className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{isRTL ? r.nameAr : r.name}</div>
                      <div className="text-xs text-white/40">
                        {isRTL ? r.typeAr : r.type} · {r.days} {t("days from", "أيام من")} {isRTL ? r.fromAr : r.from}
                      </div>
                    </div>
                    <Badge className={`text-[10px] ${r.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                      {isRTL ? r.statusAr : r.status}
                    </Badge>
                  </div>
                  {r.status === "Pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => toast.success(t("Leave approved", "تمت الموافقة على الإجازة"))} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0 flex-1">
                        <CheckCircle className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Approve", "موافقة")}
                      </Button>
                      <Button size="sm" onClick={() => toast.error(t("Leave rejected", "تم رفض الإجازة"))} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5 flex-1">
                        <AlertCircle className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Reject", "رفض")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payroll */}
            <div className="mt-4 glass-card border border-emerald-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {t("Payroll Status", "حالة الرواتب")}
                </span>
              </div>
              <div className="space-y-2 text-xs text-white/50">
                <div className="flex justify-between">
                  <span>{t("Next Run", "الدفعة القادمة")}</span>
                  <span className="text-white">{t("March 28, 2026", "28 مارس 2026")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Total Amount", "إجمالي المبلغ")}</span>
                  <span className="text-emerald-400">{t("SAR 284,500", "284,500 ريال")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("Status", "الحالة")}</span>
                  <span className="text-amber-400">{t("Pending Approval", "بانتظار الموافقة")}</span>
                </div>
              </div>
              <Button size="sm" onClick={() => toast.success(t("Payroll approved and queued", "تمت الموافقة على الرواتب وجدولتها"))} className="w-full mt-3 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                {t("Approve Payroll Run", "اعتماد دفعة الرواتب")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
