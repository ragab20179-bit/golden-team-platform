import { motion } from "framer-motion";
import { FileCheck, CheckCircle, AlertCircle, Clock, Award, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const ncrs = [
  { id: "NCR-2026-012", area: "IT Solutions", desc: "Software delivery SLA missed by 2 days", severity: "Minor", status: "Open", due: "Mar 20" },
  { id: "NCR-2026-013", area: "Procurement", desc: "Vendor evaluation form incomplete", severity: "Minor", status: "In Progress", due: "Mar 18" },
];

const docs = [
  { name: "Quality Manual v4.2", type: "Policy", status: "Approved", rev: "4.2" },
  { name: "Procurement Procedure QP-04", type: "Procedure", status: "Pending Review", rev: "3.1" },
  { name: "Customer Satisfaction Survey", type: "Form", status: "Approved", rev: "2.0" },
  { name: "Internal Audit Checklist", type: "Checklist", status: "Pending Approval", rev: "5.0" },
];

export default function QMSModule() {
  return (
    <PortalLayout title="QMS / ISO 9001" subtitle="Quality Management System" badge="98.1% Compliant" badgeColor="bg-teal-500/10 text-teal-400 border-teal-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Compliance Score", value: "98.1%", color: "text-teal-400", bg: "border-teal-500/20" },
            { label: "Open NCRs", value: "2", color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "CAPA Overdue", value: "1", color: "text-rose-400", bg: "border-rose-500/20" },
            { label: "Docs Pending", value: "4", color: "text-blue-400", bg: "border-blue-500/20" },
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
          <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ISO 9001:2015 Clause Compliance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { clause: "4. Context", score: 100 }, { clause: "5. Leadership", score: 98 },
              { clause: "6. Planning", score: 96 }, { clause: "7. Support", score: 99 },
              { clause: "8. Operations", score: 97 }, { clause: "9. Performance", score: 98 },
              { clause: "10. Improvement", score: 95 }, { clause: "Overall", score: 98 },
            ].map((c, i) => (
              <div key={i} className="p-3 rounded-lg border border-white/5">
                <div className="text-xs text-white/40 mb-1">{c.clause}</div>
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
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Non-Conformance Reports</h2>
              <Button size="sm" onClick={() => toast.info("Raise NCR — full build")} className="h-7 text-[11px] bg-teal-600 hover:bg-teal-500 text-white border-0">
                <Plus className="w-3 h-3 mr-1" /> Raise NCR
              </Button>
            </div>
            <div className="space-y-3">
              {ncrs.map((n, i) => (
                <div key={i} className="glass-card border border-amber-500/10 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{n.id}</div>
                      <div className="text-xs text-white/40">{n.area}</div>
                    </div>
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">{n.severity}</Badge>
                  </div>
                  <p className="text-xs text-white/50 mb-2">{n.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/30">Due: {n.due}</span>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">{n.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Document Control */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Document Control</h2>
            <div className="space-y-2">
              {docs.map((d, i) => (
                <div key={i} className="glass-card border border-white/5 p-3 rounded-xl flex items-center gap-3 hover:border-white/10 transition-colors">
                  <FileCheck className="w-4 h-4 text-teal-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{d.name}</div>
                    <div className="text-[11px] text-white/30">{d.type} · Rev {d.rev}</div>
                  </div>
                  <Badge className={`text-[10px] border ${d.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{d.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
