/**
 * PlatformHealth — Live service monitoring and infrastructure health
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Server, CheckCircle, AlertTriangle, XCircle, RefreshCw, Activity, Cpu, Database, Globe, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const SERVICES = [
  { name: "PostgreSQL 16", category: "Database", status: "healthy", uptime: 99.98, latency: 4, cpu: 32, memory: 45, version: "16.2" },
  { name: "Redis 7.2", category: "Cache", status: "healthy", uptime: 100, latency: 1, cpu: 8, memory: 18, version: "7.2.4" },
  { name: "NEO AI Core (Manus)", category: "AI", status: "healthy", uptime: 99.7, latency: 340, cpu: 67, memory: 72, version: "v2.0" },
  { name: "GPT-4 Router", category: "AI", status: "healthy", uptime: 99.9, latency: 890, cpu: 23, memory: 30, version: "gpt-4o" },
  { name: "Odoo 19 ERP", category: "Application", status: "healthy", uptime: 99.5, latency: 120, cpu: 45, memory: 58, version: "19.0" },
  { name: "OrangeHRM", category: "Application", status: "healthy", uptime: 99.8, latency: 85, cpu: 12, memory: 22, version: "5.6" },
  { name: "OpenProject", category: "Application", status: "healthy", uptime: 99.6, latency: 95, cpu: 18, memory: 35, version: "14.3" },
  { name: "Metabase", category: "BI", status: "healthy", uptime: 99.4, latency: 210, cpu: 28, memory: 40, version: "0.50" },
  { name: "Nginx Proxy", category: "Network", status: "healthy", uptime: 100, latency: 2, cpu: 8, memory: 12, version: "1.25" },
  { name: "MinIO Storage", category: "Storage", status: "degraded", uptime: 98.2, latency: 310, cpu: 78, memory: 82, version: "RELEASE.2025" },
  { name: "Rocket.Chat", category: "Comms", status: "healthy", uptime: 99.3, latency: 145, cpu: 35, memory: 48, version: "6.9" },
  { name: "MongoDB", category: "Database", status: "healthy", uptime: 99.7, latency: 22, cpu: 15, memory: 28, version: "7.0" },
];

const statusConfig = {
  healthy: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: CheckCircle, label: "Healthy" },
  degraded: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle, label: "Degraded" },
  down: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: XCircle, label: "Down" },
};

export default function PlatformHealth() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh(new Date());
      toast.success("Health data refreshed");
    }, 1500);
  };

  const healthy = SERVICES.filter(s => s.status === "healthy").length;
  const degraded = SERVICES.filter(s => s.status === "degraded").length;
  const down = SERVICES.filter(s => s.status === "down").length;

  return (
    <AdminLayout title="Platform Health" subtitle="Real-time infrastructure monitoring">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{healthy} Healthy</span>
            </div>
            {degraded > 0 && (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{degraded} Degraded</span>
              </div>
            )}
            {down > 0 && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{down} Down</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs">Last refresh: {lastRefresh.toLocaleTimeString()}</span>
            <Button variant="outline" size="sm" onClick={refresh}
              className="border-white/10 text-white/60 bg-transparent hover:bg-white/5 gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Services grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICES.map(svc => {
            const cfg = statusConfig[svc.status as keyof typeof statusConfig];
            const StatusIcon = cfg.icon;
            return (
              <div key={svc.name}
                className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg}`}
                style={{ background: "rgba(10,15,30,0.85)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white/90 text-sm font-semibold">{svc.name}</div>
                    <div className="text-white/40 text-xs mt-0.5">{svc.category} · v{svc.version}</div>
                  </div>
                  <Badge variant="outline" className={`${cfg.border} ${cfg.color} text-[10px] gap-1`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-white/30 text-[10px] uppercase tracking-wide">Latency</div>
                    <div className={`text-sm font-bold font-display ${svc.latency > 500 ? "text-amber-400" : "text-white/80"}`}>{svc.latency}ms</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] uppercase tracking-wide">Uptime</div>
                    <div className="text-sm font-bold font-display text-emerald-400">{svc.uptime}%</div>
                  </div>
                  <div>
                    <div className="text-white/30 text-[10px] uppercase tracking-wide">CPU</div>
                    <div className={`text-sm font-bold font-display ${svc.cpu > 70 ? "text-amber-400" : "text-white/80"}`}>{svc.cpu}%</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>CPU Load</span><span>{svc.cpu}%</span>
                  </div>
                  <Progress value={svc.cpu} className="h-1" />
                  <div className="flex justify-between text-[10px] text-white/30">
                    <span>Memory</span><span>{svc.memory}%</span>
                  </div>
                  <Progress value={svc.memory} className="h-1" />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AdminLayout>
  );
}
