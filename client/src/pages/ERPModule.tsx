/**
 * Odoo ERP Integration Module
 * Design: "Neural Depth"
 */
import { motion } from "framer-motion";
import { Database, RefreshCw, TrendingUp, TrendingDown, Package, FileText, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const revenueData = [
  { month: "Oct", revenue: 1800 }, { month: "Nov", revenue: 2100 }, { month: "Dec", revenue: 2400 },
  { month: "Jan", revenue: 1950 }, { month: "Feb", revenue: 2150 }, { month: "Mar", revenue: 2400 },
];

const invoices = [
  { id: "INV-2026-089", client: "Al-Noor Construction", amount: "SAR 145,000", due: "Mar 20", status: "Overdue" },
  { id: "INV-2026-090", client: "Gulf Tech Solutions", amount: "SAR 87,500", due: "Mar 25", status: "Pending" },
  { id: "INV-2026-091", client: "Saudi Facilities Co.", amount: "SAR 220,000", due: "Apr 1", status: "Sent" },
  { id: "INV-2026-092", client: "Eastern Contracting", amount: "SAR 63,000", due: "Apr 5", status: "Draft" },
];

const statusColor: Record<string, string> = {
  "Overdue": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Pending": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Sent": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Draft": "bg-white/5 text-white/40 border-white/10",
};

export default function ERPModule() {
  return (
    <PortalLayout title="Odoo ERP" subtitle="Enterprise Resource Planning — Integrated" badge="Synced" badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
      <div className="p-6 space-y-6">
        {/* Sync status */}
        <div className="glass-card border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-white">Odoo ERP — Connected</div>
              <div className="text-xs text-white/40">Last sync: 3 minutes ago · All modules active</div>
            </div>
          </div>
          <Button size="sm" onClick={() => toast.success("ERP sync triggered")} variant="outline" className="border-white/10 text-white/60 hover:text-white h-8 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Sync Now
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Revenue MTD", value: "SAR 2.4M", icon: TrendingUp, color: "text-emerald-400", bg: "border-emerald-500/20", change: "+12%" },
            { label: "Open Invoices", value: "12", icon: FileText, color: "text-blue-400", bg: "border-blue-500/20", change: "SAR 890K" },
            { label: "Inventory Alerts", value: "3", icon: Package, color: "text-amber-400", bg: "border-amber-500/20", change: "Below reorder" },
            { label: "AP Due This Week", value: "5", icon: CreditCard, color: "text-violet-400", bg: "border-violet-500/20", change: "SAR 124K" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
              <div className="text-[11px] text-white/30 mt-1">{s.change}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Revenue Trend (SAR K)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueData}>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0D1B3E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Invoices */}
          <div className="glass-card border border-white/5 p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Open Invoices</h2>
              <Button size="sm" onClick={() => toast.info("Create invoice — Odoo integration")} className="h-7 text-[11px] bg-blue-600 hover:bg-blue-500 text-white border-0">+ New Invoice</Button>
            </div>
            <div className="space-y-2">
              {invoices.map((inv, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white">{inv.id}</div>
                    <div className="text-[11px] text-white/40">{inv.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">{inv.amount}</div>
                    <div className="text-[11px] text-white/30">Due {inv.due}</div>
                  </div>
                  <Badge className={`text-[10px] border ${statusColor[inv.status]}`}>{inv.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Odoo Modules Grid */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Odoo Active Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Accounting", "Inventory", "Purchase", "Sales", "Manufacturing", "Project", "CRM", "HR Payroll"].map((mod, i) => (
              <button key={i} onClick={() => toast.info(`${mod} module — Odoo integration active`)}
                className="glass-card border border-white/5 hover:border-emerald-500/30 p-4 rounded-xl text-left transition-all group">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mb-2" />
                <div className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{mod}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Active</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
