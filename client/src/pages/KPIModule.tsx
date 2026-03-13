import { motion } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

const monthlyData = [
  { month: "Oct", revenue: 1800, target: 2000, satisfaction: 91 },
  { month: "Nov", revenue: 2100, target: 2000, satisfaction: 93 },
  { month: "Dec", revenue: 2400, target: 2200, satisfaction: 92 },
  { month: "Jan", revenue: 1950, target: 2200, satisfaction: 90 },
  { month: "Feb", revenue: 2150, target: 2200, satisfaction: 94 },
  { month: "Mar", revenue: 2400, target: 2200, satisfaction: 94 },
];

const radarData = [
  { subject: "Revenue", A: 87 }, { subject: "Quality", A: 98 }, { subject: "Delivery", A: 87 },
  { subject: "Customer Sat.", A: 94 }, { subject: "Compliance", A: 98 }, { subject: "Efficiency", A: 82 },
];

const kpis = [
  { name: "Revenue Achievement", value: "109%", target: "SAR 2.2M", actual: "SAR 2.4M", trend: "up", color: "text-emerald-400", bg: "border-emerald-500/20" },
  { name: "Client Satisfaction", value: "94.2%", target: "90%", actual: "94.2%", trend: "up", color: "text-blue-400", bg: "border-blue-500/20" },
  { name: "Project Delivery Rate", value: "87%", target: "90%", actual: "87%", trend: "down", color: "text-amber-400", bg: "border-amber-500/20" },
  { name: "ISO 9001 Compliance", value: "98.1%", target: "95%", actual: "98.1%", trend: "up", color: "text-teal-400", bg: "border-teal-500/20" },
  { name: "Employee Productivity", value: "82%", target: "85%", actual: "82%", trend: "down", color: "text-violet-400", bg: "border-violet-500/20" },
  { name: "Procurement Savings", value: "SAR 180K", target: "SAR 150K", actual: "SAR 180K", trend: "up", color: "text-orange-400", bg: "border-orange-500/20" },
];

export default function KPIModule() {
  return (
    <PortalLayout title="KPI Dashboard" subtitle="Key Performance Indicators — Real-time Analytics" badge="March 2026" badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {kpis.map((k, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`glass-card p-4 border ${k.bg} rounded-xl`}>
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs text-white/40 leading-tight">{k.name}</div>
                {k.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
              </div>
              <div className={`text-2xl font-bold ${k.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{k.value}</div>
              <div className="flex items-center justify-between mt-2 text-[11px]">
                <span className="text-white/30">Target: {k.target}</span>
                <span className={k.trend === "up" ? "text-emerald-400" : "text-rose-400"}>{k.trend === "up" ? "✓ On Track" : "⚠ Below Target"}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue vs Target (SAR K)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0D1B3E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="target" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Performance Radar</h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Radar name="Score" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
