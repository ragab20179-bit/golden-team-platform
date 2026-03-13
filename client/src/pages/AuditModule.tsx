import { motion } from "framer-motion";
import { ScrollText, Shield, Activity, Filter, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const logs = [
  { id: "LOG-89241", user: "Ahmed Al-Rashidi", action: "Approved PO-2026-042", module: "Procurement", ip: "192.168.1.45", time: "Mar 14, 10:32 AM", severity: "Info" },
  { id: "LOG-89240", user: "NEO AI Core", action: "Generated KPI report for March 2026", module: "Analytics", ip: "System", time: "Mar 14, 10:00 AM", severity: "Info" },
  { id: "LOG-89239", user: "Fatima Al-Zahra", action: "Modified employee record: Omar Abdullah", module: "HR", ip: "192.168.1.22", time: "Mar 14, 09:45 AM", severity: "Warning" },
  { id: "LOG-89238", user: "ASTRA AMG", action: "Policy deviation detected in Procurement", module: "Governance", ip: "System", time: "Mar 14, 09:30 AM", severity: "Alert" },
  { id: "LOG-89237", user: "Sara Mohammed", action: "Submitted leave request", module: "HR", ip: "192.168.1.31", time: "Mar 14, 09:15 AM", severity: "Info" },
  { id: "LOG-89236", user: "Khalid Hassan", action: "Updated NCR-2026-013 status", module: "QMS", ip: "192.168.1.18", time: "Mar 14, 09:00 AM", severity: "Info" },
  { id: "LOG-89235", user: "System", action: "Odoo ERP sync completed — 847 records", module: "ERP", ip: "System", time: "Mar 14, 08:57 AM", severity: "Info" },
  { id: "LOG-89234", user: "Nour Ibrahim", action: "Accessed contract: IT Infrastructure Services", module: "Legal", ip: "192.168.1.55", time: "Mar 14, 08:30 AM", severity: "Info" },
];

const severityColor: Record<string, string> = {
  "Info": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Warning": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Alert": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Critical": "bg-red-600/10 text-red-400 border-red-600/20",
};

const moduleColor: Record<string, string> = {
  "Procurement": "text-orange-400", "Analytics": "text-amber-400", "HR": "text-cyan-400",
  "Governance": "text-red-400", "QMS": "text-teal-400", "ERP": "text-emerald-400",
  "Legal": "text-rose-400", "CRM": "text-violet-400",
};

export default function AuditModule() {
  return (
    <PortalLayout title="Audit & Logs" subtitle="Full System Activity Tracking — ASTRA AMG Governed" badge="Real-time" badgeColor="bg-slate-500/10 text-slate-400 border-slate-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Events Today", value: "247", color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "Warnings", value: "3", color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "Alerts", value: "1", color: "text-rose-400", bg: "border-rose-500/20" },
            { label: "Active Users", value: "12", color: "text-emerald-400", bg: "border-emerald-500/20" },
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
            <div className="text-sm font-semibold text-white">ASTRA AMG Alert: Policy Deviation Detected</div>
            <div className="text-xs text-white/40">Procurement module — Vendor approval bypassed for PO under SAR 50K threshold. LOG-89238</div>
          </div>
          <Button size="sm" onClick={() => toast.info("Reviewing policy deviation")} variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/5 h-8 text-xs shrink-0">
            <Eye className="w-3 h-3 mr-1" /> Review
          </Button>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Audit Log — March 14, 2026</h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => toast.info("Filter panel — full build")} variant="outline" className="border-white/10 text-white/50 hover:text-white h-7 text-[11px]">
                <Filter className="w-3 h-3 mr-1" /> Filter
              </Button>
              <Button size="sm" onClick={() => toast.success("Audit log exported")} variant="outline" className="border-white/10 text-white/50 hover:text-white h-7 text-[11px]">
                <Download className="w-3 h-3 mr-1" /> Export
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5">
                  {["Log ID", "User", "Action", "Module", "IP Address", "Timestamp", "Severity"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 font-mono text-white/40">{log.id}</td>
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">{log.user}</td>
                    <td className="px-4 py-3 text-white/60 max-w-48 truncate">{log.action}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`font-medium ${moduleColor[log.module] || "text-white/50"}`}>{log.module}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-white/30 whitespace-nowrap">{log.ip}</td>
                    <td className="px-4 py-3 text-white/30 whitespace-nowrap">{log.time}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] border ${severityColor[log.severity]}`}>{log.severity}</Badge>
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
