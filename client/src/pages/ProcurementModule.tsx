import { motion } from "framer-motion";
import { ShoppingCart, Package, CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const pos = [
  { id: "PO-2026-041", vendor: "Tech Supply Arabia", items: "IT Equipment", amount: "SAR 145,000", status: "Pending Approval", date: "Mar 12" },
  { id: "PO-2026-042", vendor: "Office Pro KSA", items: "Office Supplies", amount: "SAR 28,500", status: "Approved", date: "Mar 10" },
  { id: "PO-2026-043", vendor: "Cloud Services Ltd", items: "Software Licenses", amount: "SAR 167,000", status: "Pending Approval", date: "Mar 14" },
  { id: "PO-2026-044", vendor: "Maintenance Corp", items: "Facility Services", amount: "SAR 55,000", status: "Received", date: "Mar 8" },
];

const statusColor: Record<string,string> = {
  "Pending Approval": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Approved": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Received": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Rejected": "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function ProcurementModule() {
  return (
    <PortalLayout title="Procurement" subtitle="Purchase Orders & Vendor Management" badge="8 Active RFQs" badgeColor="bg-orange-500/10 text-orange-400 border-orange-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active RFQs", value: "8", color: "text-orange-400", bg: "border-orange-500/20" },
            { label: "POs Pending", value: "3", color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "MTD Spend", value: "SAR 395K", color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "Savings MTD", value: "SAR 180K", color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Purchase Orders</h2>
            <Button size="sm" onClick={() => toast.info("Create PO — full build")} className="h-7 text-[11px] bg-orange-600 hover:bg-orange-500 text-white border-0">
              <Plus className="w-3 h-3 mr-1" /> New PO
            </Button>
          </div>
          <div className="space-y-3">
            {pos.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{p.id}</span>
                    <Badge className={`text-[10px] border ${statusColor[p.status]}`}>{p.status}</Badge>
                  </div>
                  <div className="text-xs text-white/40">{p.vendor} · {p.items}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{p.amount}</div>
                  <div className="text-[11px] text-white/30">{p.date}</div>
                </div>
                {p.status === "Pending Approval" && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => toast.success("PO approved")} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0">Approve</Button>
                    <Button size="sm" onClick={() => toast.error("PO rejected")} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5">Reject</Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Contracts Expiring Soon</h2>
            {[
              { vendor: "IT Infrastructure Ltd", expires: "Apr 2, 2026", value: "SAR 480K" },
              { vendor: "Security Services Co.", expires: "Apr 15, 2026", value: "SAR 120K" },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-amber-500/10 bg-amber-500/5 mb-2">
                <div>
                  <div className="text-sm text-white">{c.vendor}</div>
                  <div className="text-xs text-amber-400">Expires: {c.expires}</div>
                </div>
                <div className="text-sm font-semibold text-white">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Top Vendors</h2>
            {[
              { name: "Tech Supply Arabia", spend: "SAR 620K", rating: 4.8 },
              { name: "Cloud Services Ltd", spend: "SAR 480K", rating: 4.6 },
              { name: "Office Pro KSA", spend: "SAR 180K", rating: 4.4 },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 mb-2">
                <div>
                  <div className="text-sm text-white">{v.name}</div>
                  <div className="text-xs text-white/40">YTD: {v.spend}</div>
                </div>
                <div className="text-amber-400 text-sm font-semibold">★ {v.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
