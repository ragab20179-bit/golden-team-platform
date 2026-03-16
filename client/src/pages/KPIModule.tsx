/**
 * KPI Dashboard — لوحة مؤشرات الأداء الرئيسية
 * Bilingual: Arabic / English
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import PortalLayout from "@/components/PortalLayout";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { KPIBulkImport } from "@/components/ModuleBulkImport";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";

const monthlyData = [
  { month: "Oct", monthAr: "أكت",    revenue: 1800, target: 2000, satisfaction: 91 },
  { month: "Nov", monthAr: "نوف",    revenue: 2100, target: 2000, satisfaction: 93 },
  { month: "Dec", monthAr: "ديس",    revenue: 2400, target: 2200, satisfaction: 92 },
  { month: "Jan", monthAr: "يناير",  revenue: 1950, target: 2200, satisfaction: 90 },
  { month: "Feb", monthAr: "فبراير", revenue: 2150, target: 2200, satisfaction: 94 },
  { month: "Mar", monthAr: "مارس",   revenue: 2400, target: 2200, satisfaction: 94 },
];

const radarData = [
  { subject: "Revenue",      subjectAr: "الإيرادات",     A: 87 },
  { subject: "Quality",      subjectAr: "الجودة",        A: 98 },
  { subject: "Delivery",     subjectAr: "التسليم",       A: 87 },
  { subject: "Satisfaction", subjectAr: "رضا العملاء",   A: 94 },
  { subject: "Compliance",   subjectAr: "الامتثال",      A: 98 },
  { subject: "Efficiency",   subjectAr: "الكفاءة",       A: 82 },
];

const kpis = [
  { name: "Revenue Achievement",   nameAr: "تحقيق الإيرادات",         value: "109%",       target: "SAR 2.2M",  targetAr: "2.2 مليون ريال",  trend: "up",   color: "text-emerald-400", bg: "border-emerald-500/20" },
  { name: "Client Satisfaction",   nameAr: "رضا العملاء",             value: "94.2%",      target: "90%",       targetAr: "90%",              trend: "up",   color: "text-blue-400",    bg: "border-blue-500/20" },
  { name: "Project Delivery Rate", nameAr: "معدل تسليم المشاريع",     value: "87%",        target: "90%",       targetAr: "90%",              trend: "down", color: "text-amber-400",   bg: "border-amber-500/20" },
  { name: "ISO 9001 Compliance",   nameAr: "الامتثال لمعيار ISO 9001", value: "98.1%",     target: "95%",       targetAr: "95%",              trend: "up",   color: "text-teal-400",    bg: "border-teal-500/20" },
  { name: "Employee Productivity", nameAr: "إنتاجية الموظفين",        value: "82%",        target: "85%",       targetAr: "85%",              trend: "down", color: "text-violet-400",  bg: "border-violet-500/20" },
  { name: "Procurement Savings",   nameAr: "وفورات المشتريات",        value: "SAR 180K",   target: "SAR 150K",  targetAr: "150 ألف ريال",     trend: "up",   color: "text-orange-400",  bg: "border-orange-500/20" },
];

export default function KPIModule() {
  const { t, isRTL } = useLanguage();
  const [bulkOpen, setBulkOpen] = useState(false);

  return (
    <PortalLayout
      title={t("KPI Dashboard", "لوحة مؤشرات الأداء")}
      subtitle={t("Key Performance Indicators — Real-time Analytics", "مؤشرات الأداء الرئيسية — تحليلات فورية")}
      badge={t("March 2026", "مارس 2026")}
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Import Button */}
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setBulkOpen(true)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
            <Upload className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Import KPI Targets", "استيراد مؤشرات الأداء")}
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`glass-card p-4 border ${k.bg} rounded-xl`}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-white/40 leading-tight">{isRTL ? k.nameAr : k.name}</div>
                {k.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              </div>
              <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{k.value}</div>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-white/30">{t("Target:", "المستهدف:")} {isRTL ? k.targetAr : k.target}</span>
                <span className={k.trend === "up" ? "text-emerald-400" : "text-rose-400"}>
                  {k.trend === "up" ? t("✓ On Track", "✓ في المسار") : t("⚠ Below Target", "⚠ دون المستهدف")}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Revenue vs Target (SAR K)", "الإيرادات مقابل المستهدف (ألف ريال)")}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <XAxis dataKey={isRTL ? "monthAr" : "month"} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0D1B3E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 4 }} name={t("Revenue", "الإيرادات")} />
                <Line type="monotone" dataKey="target"  stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} name={t("Target", "المستهدف")} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Performance Radar", "رادار الأداء")}
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey={isRTL ? "subjectAr" : "subject"} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Radar name={t("Score", "النتيجة")} dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI KPI Intelligence Panel */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="business"
          title={t("KPI Intelligence — Business Management AI", "ذكاء مؤشرات الأداء")}
          extraInput={{ focus: "kpi" }}
          placeholder={t(
            "e.g. Which KPIs are off-track? What is our overall performance against targets?",
            "مثال: ما هي مؤشرات الأداء المتأخرة؟"
          )}
        />
      </div>
      <KPIBulkImport open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </PortalLayout>
  );
}
