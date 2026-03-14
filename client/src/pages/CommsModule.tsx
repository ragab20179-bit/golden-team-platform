/**
 * Communications Module — التواصل الداخلي وقرارات الموافقة
 * Bilingual: Arabic / English
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";

const approvals = [
  { id: "APR-2026-089", title: "Q1 Marketing Budget Increase",       titleAr: "زيادة ميزانية التسويق للربع الأول",      requestor: "Sara Mohammed",     requestorAr: "سارة محمد",       dept: "Business Dev",  deptAr: "تطوير الأعمال",              amount: "SAR 45,000",  amountAr: "45,000 ريال",  urgency: "High",   urgencyAr: "عاجل",   status: "Pending",  time: "2 hr ago",  timeAr: "منذ ساعتين" },
  { id: "APR-2026-090", title: "New IT Infrastructure Procurement",   titleAr: "شراء بنية تحتية تقنية جديدة",           requestor: "Ahmed Al-Rashidi",  requestorAr: "أحمد الراشدي",    dept: "IT Solutions",  deptAr: "حلول تقنية المعلومات",      amount: "SAR 145,000", amountAr: "145,000 ريال", urgency: "Medium", urgencyAr: "متوسط", status: "Pending",  time: "4 hr ago",  timeAr: "منذ 4 ساعات" },
  { id: "APR-2026-091", title: "Employee Training Program",           titleAr: "برنامج تدريب الموظفين",                 requestor: "Fatima Al-Zahra",   requestorAr: "فاطمة الزهراء",   dept: "HR",            deptAr: "الموارد البشرية",            amount: "SAR 28,000",  amountAr: "28,000 ريال",  urgency: "Low",    urgencyAr: "منخفض", status: "Approved", time: "Yesterday", timeAr: "أمس" },
];

const messages = [
  { from: "Ahmed Al-Rashidi", fromAr: "أحمد الراشدي",  dept: "IT Solutions", deptAr: "تقنية المعلومات", msg: "Server maintenance scheduled for tonight 11 PM - 1 AM. All systems will be briefly offline.", msgAr: "صيانة الخوادم مجدولة الليلة من 11 م إلى 1 ص. ستتوقف جميع الأنظمة لفترة وجيزة.", time: "10:30 AM", timeAr: "10:30 ص", avatar: "AA" },
  { from: "Fatima Al-Zahra",  fromAr: "فاطمة الزهراء", dept: "HR",           deptAr: "الموارد البشرية", msg: "Reminder: Performance review submissions due by March 20. Please complete your self-assessment.", msgAr: "تذكير: موعد تقديم تقييمات الأداء 20 مارس. يرجى إكمال التقييم الذاتي.", time: "09:15 AM", timeAr: "9:15 ص",  avatar: "FA" },
  { from: "NEO AI Core",      fromAr: "محرك NEO الذكي", dept: "System",      deptAr: "النظام",          msg: "3 procurement approvals require your attention. Total value: SAR 340,000. Click to review.", msgAr: "3 موافقات مشتريات تحتاج انتباهك. القيمة الإجمالية: 340,000 ريال. انقر للمراجعة.", time: "08:45 AM", timeAr: "8:45 ص",  avatar: "N" },
  { from: "Khalid Hassan",    fromAr: "خالد حسن",       dept: "Quality",     deptAr: "الجودة",          msg: "Internal audit scheduled for March 25. Department heads please prepare documentation.", msgAr: "التدقيق الداخلي مجدول في 25 مارس. يرجى من رؤساء الأقسام تجهيز الوثائق.", time: "Yesterday", timeAr: "أمس",     avatar: "KH" },
];

const urgencyColor: Record<string, string> = {
  "High":   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Low":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function CommsModule() {
  const [newMsg, setNewMsg] = useState("");
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("Communications", "التواصل الداخلي")}
      subtitle={t("Inter-Corporate Messaging & Decision Approvals", "المراسلات الداخلية وموافقات القرارات")}
      badge={t("2 Pending Approvals", "2 موافقات معلقة")}
      badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Pending Approvals", "موافقات معلقة"),     value: "2", color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Unread Messages", "رسائل غير مقروءة"),    value: "7", color: "text-sky-400",     bg: "border-sky-500/20" },
            { label: t("Active Discussions", "نقاشات نشطة"),      value: "4", color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Approved Today", "موافقات اليوم"),         value: "3", color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Approvals */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Decision Approvals", "موافقات القرارات")}
            </h2>
            <div className="space-y-3">
              {approvals.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{isRTL ? a.titleAr : a.title}</div>
                      <div className="text-xs text-white/40">
                        {isRTL ? a.requestorAr : a.requestor} · {isRTL ? a.deptAr : a.dept} · {isRTL ? a.timeAr : a.time}
                      </div>
                    </div>
                    <Badge className={`text-[10px] border ${urgencyColor[a.urgency]}`}>
                      {isRTL ? a.urgencyAr : a.urgency}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{isRTL ? a.amountAr : a.amount}</span>
                    {a.status === "Pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => toast.success(t(`"${a.title}" approved`, `تمت الموافقة على "${a.titleAr}"`))} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                          <CheckCircle className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Approve", "موافقة")}
                        </Button>
                        <Button size="sm" onClick={() => toast.error(t("Request rejected", "تم رفض الطلب"))} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5">
                          <XCircle className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Reject", "رفض")}
                        </Button>
                      </div>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                        <CheckCircle className="w-2.5 h-2.5 mr-1" /> {t("Approved", "موافق عليه")}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Company-wide Messages */}
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Company Announcements", "إعلانات الشركة")}
            </h2>
            <div className="flex-1 space-y-3 mb-4">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${m.from === "NEO AI Core" ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{isRTL ? m.fromAr : m.from}</span>
                        <span className="text-[11px] text-white/30">{isRTL ? m.deptAr : m.dept}</span>
                        <span className="text-[11px] text-white/20 ml-auto">{isRTL ? m.timeAr : m.time}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{isRTL ? m.msgAr : m.msg}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Compose */}
            <div className="glass-card border border-white/10 rounded-xl p-3 flex items-end gap-2">
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder={t("Send a company-wide announcement...", "أرسل إعلانًا للشركة...")}
                rows={2} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 resize-none outline-none" />
              <Button size="sm" onClick={() => { toast.success(t("Announcement sent", "تم إرسال الإعلان")); setNewMsg(""); }} disabled={!newMsg.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white border-0 h-9 px-3 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
