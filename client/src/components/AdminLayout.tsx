/**
 * AdminLayout — Golden Team Admin Panel Shell
 * Design: Neural Depth — deep space dark, amber/gold accents, glass morphism
 * Distinct from PortalLayout: uses red-tinted accents for admin authority, wider sidebar
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, Shield, Settings, Activity,
  FileText, Key, Database, Bell, ChevronRight, LogOut,
  Menu, X, Globe, Cpu, BarChart3, AlertTriangle,
  Building2, Layers, Lock, Eye, Wrench, ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const ADMIN_NAV = [
  {
    group: "Overview",
    items: [
      { label: "Admin Dashboard", path: "/admin", icon: LayoutDashboard },
      { label: "Platform Health", path: "/admin/health", icon: Activity },
      { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    group: "Access Control",
    items: [
      { label: "User Management", path: "/admin/users", icon: Users },
      { label: "Roles & Permissions", path: "/admin/roles", icon: Shield },
      { label: "Module Access", path: "/admin/modules", icon: Layers },
      { label: "API Keys", path: "/admin/api-keys", icon: Key },
    ],
  },
  {
    group: "System",
    items: [
      { label: "System Settings", path: "/admin/settings", icon: Settings },
      { label: "Integrations", path: "/admin/integrations", icon: Globe },
      { label: "NEO AI Config", path: "/admin/neo-config", icon: Cpu },
      { label: "Database", path: "/admin/database", icon: Database },
    ],
  },
  {
    group: "Compliance",
    items: [
      { label: "Audit Logs", path: "/admin/audit", icon: FileText },
      { label: "Security Events", path: "/admin/security", icon: AlertTriangle },
      { label: "Data Privacy", path: "/admin/privacy", icon: Lock },
    ],
  },
  {
    group: "Platform",
    items: [
      { label: "Notifications", path: "/admin/notifications", icon: Bell },
      { label: "Maintenance", path: "/admin/maintenance", icon: Wrench },
      { label: "Public Site", path: "/", icon: Eye },
    ],
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title = "Admin Panel", subtitle }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-[#05080F] text-white flex" dir="ltr">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-300 flex-shrink-0 relative`}
        style={{ background: "linear-gradient(180deg, #0A0F1E 0%, #080C18 100%)" }}
      >
        <div className="w-64 h-full flex flex-col border-r border-red-900/20">
          {/* Admin Brand */}
          <div className="px-5 py-5 border-b border-red-900/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm font-display tracking-wide">ADMIN PANEL</div>
                <div className="text-red-400/70 text-[10px] tracking-widest uppercase">Golden Team</div>
              </div>
            </div>
            {/* Admin badge */}
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-red-300 text-xs font-medium">Super Administrator</span>
            </div>
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-3">
            {ADMIN_NAV.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center justify-between px-5 py-2 text-[10px] tracking-widest uppercase text-white/30 hover:text-white/50 transition-colors"
                >
                  <span>{group}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${collapsedGroups.has(group) ? "-rotate-90" : ""}`} />
                </button>
                {!collapsedGroups.has(group) && items.map(({ label, path, icon: Icon }) => (
                  <button
                    key={path}
                    onClick={() => setLocation(path)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-200 group relative
                      ${isActive(path)
                        ? "text-white bg-red-500/15 border-r-2 border-red-400"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive(path) ? "text-red-400" : "text-white/30 group-hover:text-white/60"}`} />
                    <span className="truncate">{label}</span>
                    {isActive(path) && <ChevronRight className="w-3 h-3 ml-auto text-red-400" />}
                  </button>
                ))}
              </div>
            ))}
          </ScrollArea>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-red-900/20">
            <button
              onClick={() => setLocation("/portal")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              <Building2 className="w-4 h-4" />
              <span>Back to Portal</span>
            </button>
            <button
              onClick={() => setLocation("/")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm mt-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-white/8 bg-[#080C18]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/40 hover:text-white transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-white font-semibold text-sm font-display">{title}</h1>
              {subtitle && <p className="text-white/40 text-xs">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-red-500/30 text-red-400 text-[10px] tracking-widest">
              ADMIN MODE
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-[#05080F] font-bold text-[10px]">SA</span>
              </div>
              <span className="text-white/70 text-xs">Super Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
