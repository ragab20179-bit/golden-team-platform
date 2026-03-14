/**
 * AdminDashboard — Platform-wide overview for Super Administrator
 * Neural Depth design: dark space, red admin accents, glass cards
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import AdminLayout from "@/components/AdminLayout";
import {
  Users, Shield, Activity, Database, Bell, AlertTriangle,
  TrendingUp, CheckCircle, Clock, Cpu, Globe, FileText,
  ArrowRight, BarChart3, Lock, Zap, Server, Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const PLATFORM_STATS = [
  { label: "Total Users", value: "24", sub: "+3 this month", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { label: "Active Sessions", value: "8", sub: "Right now", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { label: "Modules Active", value: "12", sub: "All systems go", icon: Cpu, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { label: "Security Alerts", value: "2", sub: "Needs attention", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  { label: "NEO AI Queries", value: "1,247", sub: "Last 24 hours", icon: Zap, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  { label: "Pending Approvals", value: "7", sub: "Awaiting action", icon: Clock, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
];

const SYSTEM_HEALTH = [
  { service: "PostgreSQL Database", status: "healthy", uptime: "99.98%", latency: "4ms", load: 32 },
  { service: "Redis Cache", status: "healthy", uptime: "100%", latency: "1ms", load: 18 },
  { service: "NEO AI Core (Manus)", status: "healthy", uptime: "99.7%", latency: "340ms", load: 67 },
  { service: "GPT-4 Router (20%)", status: "healthy", uptime: "99.9%", latency: "890ms", load: 23 },
  { service: "Odoo 19 ERP", status: "healthy", uptime: "99.5%", latency: "120ms", load: 45 },
  { service: "OrangeHRM", status: "healthy", uptime: "99.8%", latency: "85ms", load: 12 },
  { service: "Nginx Proxy", status: "healthy", uptime: "100%", latency: "2ms", load: 8 },
  { service: "MinIO Storage", status: "degraded", uptime: "98.2%", latency: "210ms", load: 78 },
];

const RECENT_ACTIVITY = [
  { user: "Ahmed Al-Rashid", action: "Logged in", module: "Portal", time: "2 min ago", type: "info" },
  { user: "Sarah Mohammed", action: "Submitted PO #2847", module: "Procurement", time: "8 min ago", type: "action" },
  { user: "NEO AI", action: "Processed 47 queries", module: "AI Core", time: "15 min ago", type: "ai" },
  { user: "System", action: "Backup completed", module: "Database", time: "1 hr ago", type: "system" },
  { user: "Khalid Ibrahim", action: "Updated contract #C-109", module: "Legal", time: "2 hr ago", type: "action" },
  { user: "System", action: "Security scan passed", module: "Security", time: "3 hr ago", type: "system" },
  { user: "Fatima Al-Zahra", action: "Created 3 HR records", module: "HR", time: "4 hr ago", type: "action" },
  { user: "NEO AI", action: "Risk assessment generated", module: "Risk AI", time: "5 hr ago", type: "ai" },
];

const QUICK_ACTIONS = [
  { label: "Add User", path: "/admin/users", icon: Users, color: "from-blue-500 to-blue-700" },
  { label: "Manage Roles", path: "/admin/roles", icon: Shield, color: "from-violet-500 to-violet-700" },
  { label: "Module Access", path: "/admin/modules", icon: Cpu, color: "from-amber-500 to-amber-700" },
  { label: "Audit Logs", path: "/admin/audit", icon: FileText, color: "from-emerald-500 to-emerald-700" },
  { label: "Security", path: "/admin/security", icon: Lock, color: "from-red-500 to-red-700" },
  { label: "Settings", path: "/admin/settings", icon: Globe, color: "from-slate-500 to-slate-700" },
];

export default function AdminDashboard() {
  const [, setLocation] = useLocation();

  return (
    <AdminLayout title="Admin Dashboard" subtitle="Platform-wide overview and control">
      <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">

        {/* Welcome banner */}
        <motion.div variants={fadeUp}
          className="rounded-xl p-5 border border-red-500/20 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(5,8,15,0.9) 100%)" }}
        >
          <div className="absolute top-0 right-0 w-64 h-full opacity-5"
            style={{ background: "radial-gradient(circle at right, #ef4444, transparent)" }} />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-xs tracking-widest uppercase font-medium">Super Administrator</span>
              </div>
              <h2 className="text-white font-bold text-xl font-display">Welcome back, Admin</h2>
              <p className="text-white/50 text-sm mt-1">You have full control over the Golden Team Enterprise Platform. 2 security alerts require your attention.</p>
            </div>
            <Button
              onClick={() => setLocation("/admin/security")}
              className="bg-red-500 hover:bg-red-400 text-white text-sm hidden md:flex"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              View Alerts
            </Button>
          </div>
        </motion.div>

        {/* Platform Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {PLATFORM_STATS.map((stat) => (
            <Card key={stat.label} className={`p-4 border ${stat.border} ${stat.bg} bg-opacity-50`}
              style={{ background: "rgba(10,15,30,0.8)" }}>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</div>
              <div className="text-white/70 text-xs font-medium mt-0.5">{stat.label}</div>
              <div className="text-white/30 text-[10px] mt-0.5">{stat.sub}</div>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp}>
          <h3 className="text-white/60 text-xs tracking-widest uppercase mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map(({ label, path, icon: Icon, color }) => (
              <button
                key={label}
                onClick={() => setLocation(path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/60 text-xs group-hover:text-white/90 transition-colors text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* System Health + Recent Activity */}
        <motion.div variants={fadeUp} className="grid lg:grid-cols-2 gap-6">

          {/* System Health */}
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(10,15,30,0.8)" }}>
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <h3 className="text-white font-semibold text-sm">System Health</h3>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px]">7/8 Healthy</Badge>
            </div>
            <div className="divide-y divide-white/5">
              {SYSTEM_HEALTH.map((svc) => (
                <div key={svc.service} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${svc.status === "healthy" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-xs font-medium truncate">{svc.service}</div>
                    <Progress value={svc.load} className="h-1 mt-1.5"
                      style={{ "--progress-color": svc.load > 70 ? "#f59e0b" : "#10b981" } as React.CSSProperties} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white/40 text-[10px]">{svc.latency}</div>
                    <div className="text-white/30 text-[10px]">{svc.uptime}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-white/8">
              <button onClick={() => setLocation("/admin/health")} className="text-emerald-400 text-xs hover:text-emerald-300 flex items-center gap-1">
                Full health report <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(10,15,30,0.8)" }}>
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
              </div>
              <button onClick={() => setLocation("/admin/audit")} className="text-blue-400 text-xs hover:text-blue-300">View all</button>
            </div>
            <div className="divide-y divide-white/5">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                    ${item.type === "ai" ? "bg-violet-500/20" : item.type === "system" ? "bg-slate-500/20" : "bg-blue-500/20"}`}>
                    {item.type === "ai" ? <Cpu className="w-3.5 h-3.5 text-violet-400" /> :
                      item.type === "system" ? <Server className="w-3.5 h-3.5 text-slate-400" /> :
                        <Users className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/80 text-xs">
                      <span className="font-medium text-white/90">{item.user}</span>
                      {" "}<span className="text-white/50">{item.action}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="border-white/10 text-white/30 text-[9px] px-1.5 py-0">{item.module}</Badge>
                      <span className="text-white/30 text-[10px]">{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Storage + NEO AI Usage */}
        <motion.div variants={fadeUp} className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/8 p-5" style={{ background: "rgba(10,15,30,0.8)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-semibold text-sm">Storage & Database</h3>
            </div>
            {[
              { label: "PostgreSQL (Primary)", used: 12.4, total: 100, unit: "GB" },
              { label: "Redis Cache", used: 0.8, total: 2, unit: "GB" },
              { label: "MinIO Object Store", used: 47.2, total: 200, unit: "GB" },
              { label: "Backup Storage", used: 23.1, total: 500, unit: "GB" },
            ].map((item) => (
              <div key={item.label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/60">{item.label}</span>
                  <span className="text-white/40">{item.used}/{item.total} {item.unit}</span>
                </div>
                <Progress value={(item.used / item.total) * 100} className="h-1.5" />
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/8 p-5" style={{ background: "rgba(10,15,30,0.8)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-violet-400" />
              <h3 className="text-white font-semibold text-sm">NEO AI Usage (24h)</h3>
            </div>
            {[
              { module: "Conversational AI (Manus 80%)", queries: 847, pct: 68 },
              { module: "Decision-Making AI", queries: 134, pct: 11 },
              { module: "Financial AI", queries: 98, pct: 8 },
              { module: "QMS AI", queries: 67, pct: 5 },
              { module: "Risk Management AI", queries: 54, pct: 4 },
              { module: "Critical Thinking AI", queries: 47, pct: 4 },
            ].map((item) => (
              <div key={item.module} className="flex items-center gap-3 mb-2.5">
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs truncate">{item.module}</div>
                  <Progress value={item.pct} className="h-1 mt-1" />
                </div>
                <div className="text-white/40 text-xs w-10 text-right">{item.queries}</div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-white/8 flex justify-between text-xs">
              <span className="text-white/40">Total queries</span>
              <span className="text-violet-400 font-semibold">1,247</span>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </AdminLayout>
  );
}
