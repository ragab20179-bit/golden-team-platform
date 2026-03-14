import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle, Lock, Eye, FileText, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PortalLayout from "@/components/PortalLayout";

const policies = [
  { name: "Information Security Policy", version: "3.2", status: "Active", compliance: 100 },
  { name: "Procurement Approval Matrix", version: "2.1", status: "Active", compliance: 96 },
  { name: "Data Privacy & PDPL Policy", version: "1.5", status: "Active", compliance: 98 },
  { name: "Code of Conduct", version: "4.0", status: "Active", compliance: 100 },
  { name: "IT Access Control Policy", version: "2.8", status: "Under Review", compliance: 94 },
  { name: "Financial Authorization Policy", version: "3.1", status: "Active", compliance: 99 },
];

const deviations = [
  { id: "DEV-2026-007", policy: "Procurement Approval Matrix", desc: "Vendor approval bypassed for PO under SAR 50K threshold", dept: "Procurement", severity: "Medium", status: "Open" },
  { id: "DEV-2026-006", policy: "IT Access Control Policy", desc: "Temporary access not revoked after project completion", dept: "IT Solutions", severity: "Low", status: "In Review" },
];

export default function GovernanceModule() {
  const [, navigate] = useLocation();
  return (
    <PortalLayout title="ASTRA AMG" subtitle="Audit, Management & Governance — ASTRA AMG" badge="1 Open Deviation" badgeColor="bg-red-500/10 text-red-400 border-red-500/20">
      <div className="p-6 space-y-6">
        {/* Governance Score */}
        <div className="glass-card border border-red-500/20 p-6 rounded-xl" style={{ background: "rgba(239,68,68,0.03)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>97.2%</div>
                <div className="text-sm text-white/50">Overall Governance Score</div>
                <div className="text-xs text-emerald-400 mt-0.5">↑ +0.8% from last month</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Active Policies", value: "18", color: "text-blue-400" },
                  { label: "Open Deviations", value: "2", color: "text-amber-400" },
                  { label: "Compliant Depts", value: "5/6", color: "text-emerald-400" },
                ].map((s, i) => (
                  <div key={i}>
                    <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
                    <div className="text-[11px] text-white/30">{s.label}</div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate("/portal/governance/authority-matrix")}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" />
                Configure Authority Matrix
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Register */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Policy Register</h2>
            <div className="space-y-2">
              {policies.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{p.name}</div>
                      <div className="text-[11px] text-white/30">v{p.version}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-sm font-bold ${p.compliance >= 98 ? "text-emerald-400" : p.compliance >= 95 ? "text-amber-400" : "text-rose-400"}`}>{p.compliance}%</div>
                    </div>
                    <Badge className={`text-[10px] border shrink-0 ${p.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{p.status}</Badge>
                  </div>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.compliance >= 98 ? "bg-emerald-500" : p.compliance >= 95 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${p.compliance}%` }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Deviations + Access Control */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Policy Deviations</h2>
              <div className="space-y-3">
                {deviations.map((d, i) => (
                  <div key={i} className="glass-card border border-amber-500/15 p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white">{d.id}</div>
                        <div className="text-xs text-white/40">{d.policy} · {d.dept}</div>
                      </div>
                      <Badge className={`text-[10px] border ${d.severity === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>{d.severity}</Badge>
                    </div>
                    <p className="text-xs text-white/50 mb-2">{d.desc}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{d.status}</Badge>
                      <Button size="sm" onClick={() => toast.info("Reviewing deviation")} variant="outline" className="h-6 text-[10px] border-white/10 text-white/40 hover:text-white">
                        <Eye className="w-2.5 h-2.5 mr-1" /> Investigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card border border-white/5 p-5 rounded-xl">
              <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Department Compliance</h2>
              {[
                { dept: "IT Solutions", score: 94, color: "bg-amber-500" },
                { dept: "HR", score: 100, color: "bg-emerald-500" },
                { dept: "Procurement", score: 96, color: "bg-amber-500" },
                { dept: "Legal", score: 99, color: "bg-emerald-500" },
                { dept: "Quality", score: 98, color: "bg-emerald-500" },
                { dept: "Business Dev", score: 100, color: "bg-emerald-500" },
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-white/50 w-28 shrink-0">{d.dept}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.score}%` }} />
                  </div>
                  <span className={`text-xs font-semibold w-10 text-right ${d.score >= 98 ? "text-emerald-400" : "text-amber-400"}`}>{d.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
