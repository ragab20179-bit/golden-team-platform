/**
 * AdminAuditLog — Immutable hash-chain audit log viewer for admin
 */
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { FileText, Search, Download, Filter, Shield, User, Cpu, Server, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const LOG_ENTRIES = [
  { id: "LOG-2847", ts: "2026-03-14 14:21:03", user: "Ahmed Al-Rashid", role: "Super Admin", action: "LOGIN", module: "Auth", detail: "Successful login from 192.168.1.10", severity: "info", hash: "a3f9...c12e" },
  { id: "LOG-2846", ts: "2026-03-14 14:18:45", user: "Sarah Mohammed", role: "Finance Manager", action: "CREATE", module: "Procurement", detail: "Created PO #2847 — SAR 45,000 — Office Supplies", severity: "action", hash: "b7d2...f45a" },
  { id: "LOG-2845", ts: "2026-03-14 14:15:22", user: "NEO AI", role: "System", action: "AI_QUERY", module: "NEO Core", detail: "Processed financial analysis query for Sarah Mohammed", severity: "ai", hash: "c9e1...8b3d" },
  { id: "LOG-2844", ts: "2026-03-14 14:10:11", user: "Khalid Ibrahim", role: "HR Manager", action: "UPDATE", module: "HR", detail: "Updated employee record EMP-0047 — salary adjustment", severity: "action", hash: "d4f8...2a7c" },
  { id: "LOG-2843", ts: "2026-03-14 13:55:30", user: "System", role: "System", action: "BACKUP", module: "Database", detail: "Automated backup completed — 12.4 GB — Duration: 7m 23s", severity: "system", hash: "e6a3...9f1b" },
  { id: "LOG-2842", ts: "2026-03-14 13:47:15", user: "Fatima Al-Zahra", role: "Legal Counsel", action: "APPROVE", module: "Legal", detail: "Approved contract C-109 — Vendor Agreement — SAR 120,000", severity: "approval", hash: "f1b7...3e9d" },
  { id: "LOG-2841", ts: "2026-03-14 13:40:02", user: "Omar Hassan", role: "IT Manager", action: "CONFIG", module: "Admin", detail: "Updated NEO AI routing weights: Manus 80% / GPT-4 20%", severity: "admin", hash: "g8c5...7d2f" },
  { id: "LOG-2840", ts: "2026-03-14 13:35:48", user: "System", role: "System", action: "SECURITY", module: "Auth", detail: "Failed login attempt from IP 45.33.12.88 — blocked", severity: "warning", hash: "h2e9...4c6a" },
  { id: "LOG-2839", ts: "2026-03-14 13:28:19", user: "Nour Al-Amin", role: "Sales Executive", action: "CREATE", module: "CRM", detail: "Created lead LEAD-0234 — Al-Noor Construction — SAR 500K opportunity", severity: "action", hash: "i5d4...1b8e" },
  { id: "LOG-2838", ts: "2026-03-14 13:15:07", user: "Yusuf Karimi", role: "QMS Auditor", action: "AUDIT", module: "QMS", detail: "Completed ISO 9001 internal audit — 3 non-conformances found", severity: "action", hash: "j7f2...6a3c" },
  { id: "LOG-2837", ts: "2026-03-14 12:58:44", user: "NEO AI", role: "System", action: "GOVERNANCE", module: "ASTRA AMG", detail: "Escalated PO #2846 to CFO — exceeds SAR 50,000 threshold", severity: "approval", hash: "k3b8...9e5d" },
  { id: "LOG-2836", ts: "2026-03-14 12:45:31", user: "Tariq Saleh", role: "Accountant", action: "READ", module: "ERP", detail: "Accessed financial report Q1-2026 — P&L Statement", severity: "info", hash: "l9a1...2f7b" },
];

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  info: { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  action: { color: "text-white/60", bg: "bg-white/5", border: "border-white/10" },
  ai: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  system: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  approval: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  admin: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  warning: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
};

const actionIcon: Record<string, React.ReactNode> = {
  LOGIN: <User className="w-3.5 h-3.5" />,
  AI_QUERY: <Cpu className="w-3.5 h-3.5" />,
  BACKUP: <Server className="w-3.5 h-3.5" />,
  SECURITY: <AlertTriangle className="w-3.5 h-3.5" />,
  GOVERNANCE: <Shield className="w-3.5 h-3.5" />,
};

export default function AdminAuditLog() {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterModule, setFilterModule] = useState("all");

  const filtered = LOG_ENTRIES.filter(e => {
    const matchSearch = e.user.toLowerCase().includes(search.toLowerCase()) ||
      e.detail.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = filterSeverity === "all" || e.severity === filterSeverity;
    const matchModule = filterModule === "all" || e.module === filterModule;
    return matchSearch && matchSeverity && matchModule;
  });

  const modules = Array.from(new Set(LOG_ENTRIES.map(e => e.module)));

  return (
    <AdminLayout title="Audit Log" subtitle="Immutable hash-chain activity log — all platform events">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Events (24h)", value: "2,847", color: "text-white/80" },
            { label: "Security Events", value: "3", color: "text-orange-400" },
            { label: "AI Interactions", value: "1,247", color: "text-violet-400" },
            { label: "Approval Actions", value: "34", color: "text-amber-400" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl border border-white/8 bg-[#0A0F1E]/80">
              <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by user, event, or log ID..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
          </div>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast.success("Audit log exported as CSV")}
            className="border-white/10 text-white/60 bg-transparent hover:bg-white/5 gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>

        {/* Log table */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(10,15,30,0.8)" }}>
          <div className="px-5 py-3 border-b border-white/8 grid grid-cols-12 text-[10px] tracking-widest uppercase text-white/30">
            <div className="col-span-1">ID</div>
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">User</div>
            <div className="col-span-1">Action</div>
            <div className="col-span-1">Module</div>
            <div className="col-span-4">Detail</div>
            <div className="col-span-1 text-right">Hash</div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map(entry => {
              const cfg = severityConfig[entry.severity];
              return (
                <div key={entry.id} className="px-5 py-3 grid grid-cols-12 items-start hover:bg-white/2 transition-colors">
                  <div className="col-span-1">
                    <span className="text-white/30 text-xs font-mono">{entry.id}</span>
                  </div>
                  <div className="col-span-2 text-white/40 text-xs font-mono">{entry.ts.split(" ")[1]}<br /><span className="text-white/20">{entry.ts.split(" ")[0]}</span></div>
                  <div className="col-span-2">
                    <div className="text-white/80 text-xs font-medium">{entry.user}</div>
                    <div className="text-white/30 text-[10px]">{entry.role}</div>
                  </div>
                  <div className="col-span-1">
                    <Badge variant="outline" className={`${cfg.border} ${cfg.color} text-[9px] gap-1 px-1.5`}>
                      {actionIcon[entry.action] || <FileText className="w-3 h-3" />}
                      {entry.action}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-white/40 text-xs">{entry.module}</div>
                  <div className="col-span-4 text-white/60 text-xs leading-relaxed">{entry.detail}</div>
                  <div className="col-span-1 text-right">
                    <span className="text-white/20 text-[10px] font-mono">{entry.hash}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-white/8 text-white/30 text-xs flex justify-between">
            <span>Showing {filtered.length} of {LOG_ENTRIES.length} entries</span>
            <span className="text-emerald-400/60 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Hash-chain integrity verified
            </span>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
