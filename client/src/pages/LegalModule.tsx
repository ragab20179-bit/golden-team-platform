import { motion } from "framer-motion";
import { Scale, FileText, AlertTriangle, CheckCircle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const contracts = [
  { name: "IT Infrastructure Services Agreement", party: "TechCorp Arabia", value: "SAR 480K", expires: "Apr 2, 2026", status: "Expiring Soon" },
  { name: "Office Space Lease Agreement", party: "Al-Noor Properties", value: "SAR 240K/yr", expires: "Dec 31, 2026", status: "Active" },
  { name: "Software Development Contract", party: "Gulf Dev Solutions", value: "SAR 320K", expires: "Jun 15, 2026", status: "Active" },
  { name: "Security Services Contract", party: "SafeGuard KSA", value: "SAR 120K", expires: "Apr 15, 2026", status: "Expiring Soon" },
  { name: "Consulting Services NDA", party: "Strategy Partners", value: "N/A", expires: "Mar 20, 2026", status: "Signature Required" },
];

const statusColor: Record<string, string> = {
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Expiring Soon": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Signature Required": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Expired": "bg-white/5 text-white/30 border-white/10",
};

export default function LegalModule() {
  return (
    <PortalLayout title="Legal Module" subtitle="Contract Management & Compliance" badge="1 Urgent" badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Contracts", value: "18", color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "Expiring in 30d", value: "2", color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "Pending Signature", value: "1", color: "text-rose-400", bg: "border-rose-500/20" },
            { label: "Compliance Score", value: "96%", color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Urgent alert */}
        <div className="glass-card border border-rose-500/20 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239,68,68,0.05)" }}>
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">Action Required: NDA Signature Pending</div>
            <div className="text-xs text-white/40">Consulting Services NDA with Strategy Partners — Due March 20, 2026</div>
          </div>
          <Button size="sm" onClick={() => toast.success("Signature workflow initiated")} className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white border-0 shrink-0">
            Sign Now
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contract Register</h2>
            <Button size="sm" onClick={() => toast.info("Add contract — full build")} className="h-7 text-[11px] bg-rose-600 hover:bg-rose-500 text-white border-0">
              <Plus className="w-3 h-3 mr-1" /> New Contract
            </Button>
          </div>
          <div className="space-y-2">
            {contracts.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="glass-card border border-white/5 p-4 rounded-xl hover:border-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-white/40">{c.party} · {c.value}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-white/30">Expires {c.expires}</div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor[c.status]} shrink-0`}>{c.status}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Compliance Checklist</h2>
            {[
              { item: "Commercial Registration renewal", done: true },
              { item: "ZATCA VAT compliance", done: true },
              { item: "GOSI registration up to date", done: true },
              { item: "Ministry of Commerce filings", done: false },
              { item: "Annual legal audit", done: false },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                {c.done ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> : <Clock className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className={`text-sm ${c.done ? "text-white/50 line-through" : "text-white/70"}`}>{c.item}</span>
              </div>
            ))}
          </div>
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Legal Activity</h2>
            {[
              { action: "Contract reviewed by NEO Legal AI", time: "1 hr ago", type: "AI" },
              { action: "NDA sent to Strategy Partners", time: "3 hr ago", type: "Action" },
              { action: "ZATCA filing submitted", time: "Yesterday", type: "Compliance" },
              { action: "Contract renewal reminder sent", time: "2 days ago", type: "Alert" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs text-white/70">{a.action}</div>
                  <div className="text-[11px] text-white/30">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
