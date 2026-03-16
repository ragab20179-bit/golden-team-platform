/**
 * CRM Module — إدارة علاقات العملاء
 * Bilingual: Arabic / English
 */
import { motion } from "framer-motion";
import { Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

const leads = [
  { name: "Al-Noor Construction",  nameAr: "شركة النور للإنشاءات",   contact: "Mohammed Al-Rashid", contactAr: "محمد الراشد",    value: "SAR 850K",  valueAr: "850 ألف ريال",  stage: "Proposal",    stageAr: "عرض",         prob: 75, hot: true  },
  { name: "Gulf Tech Solutions",   nameAr: "حلول الخليج التقنية",    contact: "Layla Hassan",       contactAr: "ليلى حسن",       value: "SAR 320K",  valueAr: "320 ألف ريال",  stage: "Negotiation", stageAr: "تفاوض",       prob: 88, hot: true  },
  { name: "Saudi Facilities Co.",  nameAr: "شركة المرافق السعودية",  contact: "Tariq Ibrahim",      contactAr: "طارق إبراهيم",   value: "SAR 1.2M",  valueAr: "1.2 مليون ريال",stage: "Qualified",   stageAr: "مؤهَّل",      prob: 45, hot: false },
  { name: "Eastern Contracting",   nameAr: "المقاولات الشرقية",      contact: "Nadia Al-Zahra",     contactAr: "نادية الزهراء",  value: "SAR 540K",  valueAr: "540 ألف ريال",  stage: "Discovery",   stageAr: "استكشاف",     prob: 30, hot: false },
  { name: "Riyadh Developers",     nameAr: "مطورو الرياض",           contact: "Faisal Al-Otaibi",   contactAr: "فيصل العتيبي",   value: "SAR 980K",  valueAr: "980 ألف ريال",  stage: "Proposal",    stageAr: "عرض",         prob: 60, hot: true  },
];

const stageColors: Record<string, string> = {
  "Discovery":   "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Qualified":   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Proposal":    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Negotiation": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Won":         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const pipelineData = [
  { name: "Discovery",   nameAr: "استكشاف",  value: 4,  color: "#64748B" },
  { name: "Qualified",   nameAr: "مؤهَّل",   value: 8,  color: "#3B82F6" },
  { name: "Proposal",    nameAr: "عرض",      value: 12, color: "#8B5CF6" },
  { name: "Negotiation", nameAr: "تفاوض",    value: 6,  color: "#F59E0B" },
  { name: "Won",         nameAr: "مُغلق",    value: 6,  color: "#10B981" },
];

export default function CRMModule() {
  const { t, isRTL } = useLanguage();

  return (
    <PortalLayout
      title={t("CRM", "إدارة العملاء")}
      subtitle={t("AI-Assisted Customer Relationship Management", "إدارة علاقات العملاء بالذكاء الاصطناعي")}
      badge={t("34 Active Leads", "34 فرصة نشطة")}
      badgeColor="bg-violet-500/10 text-violet-400 border-violet-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Pipeline Value", "قيمة خط الأعمال"),    value: t("SAR 4.2M", "4.2 مليون ريال"), color: "text-violet-400",  bg: "border-violet-500/20" },
            { label: t("Hot Opportunities", "فرص ساخنة"),       value: "8",                              color: "text-rose-400",    bg: "border-rose-500/20" },
            { label: t("Won This Month", "صفقات هذا الشهر"),    value: "6",                              color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: t("Win Rate", "معدل الإغلاق"),             value: "73%",                            color: "text-amber-400",   bg: "border-amber-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("Active Pipeline", "خط الأعمال النشط")}
              </h2>
              <Button size="sm" onClick={() => toast.info(t("Add lead — coming in full build", "إضافة فرصة — قيد التطوير"))} className="h-7 text-[11px] bg-violet-600 hover:bg-violet-500 text-white border-0">
                <Plus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Add Lead", "إضافة فرصة")}
              </Button>
            </div>
            <div className="space-y-2">
              {leads.map((l, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{isRTL ? l.nameAr : l.name}</span>
                        {l.hot && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-xs text-white/40">{isRTL ? l.contactAr : l.contact}</div>
                    </div>
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <div className="text-sm font-semibold text-white">{isRTL ? l.valueAr : l.value}</div>
                      <div className="text-[11px] text-emerald-400">{l.prob}% {t("probability", "احتمالية")}</div>
                    </div>
                    <Badge className={`text-[10px] border ${stageColors[l.stage]}`}>
                      {isRTL ? l.stageAr : l.stage}
                    </Badge>
                  </div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full" style={{ width: `${l.prob}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Pipeline by Stage", "توزيع خط الأعمال")}
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0D1B3E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pipelineData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-white/50">{isRTL ? d.nameAr : d.name}</span>
                  </div>
                  <span className="text-white/70">{d.value} {t("leads", "فرصة")}</span>
                </div>
              ))}
            </div>
          </div>

      {/* AI Module Query Panel */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="business"
          title={t("CRM Intelligence — Business Management AI", "ذكاء إدارة علاقات العملاء")}
          placeholder={t(
            "e.g. Analyze our client portfolio. What business opportunities should we prioritize?",
            "مثال: حلل محفظة عملائنا. ما الفرص التجارية التي يجب إعطاؤها الأولوية؟"
          )}
        />
      </div>
        </div>
      </div>
    </PortalLayout>
  );
}
