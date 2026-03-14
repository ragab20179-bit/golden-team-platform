/**
 * Portal Layout — Persistent dark sidebar + main content area
 * Design: "Neural Depth" — deep space dark, glass morphism, bioluminescent accents
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Users, Database, UserCheck, BarChart3,
  ShoppingCart, FileCheck, Scale, MessageSquare, Shield,
  ScrollText, Brain, ChevronLeft, ChevronRight, LogOut,
  Bell, Settings, Menu, X, Mic, Cpu, Languages, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/portal", color: "text-blue-400" },
  { label: "HR System", icon: Users, path: "/portal/hr", color: "text-cyan-400" },
  { label: "Odoo ERP", icon: Database, path: "/portal/erp", color: "text-emerald-400" },
  { label: "CRM", icon: UserCheck, path: "/portal/crm", color: "text-violet-400" },
  { label: "KPI Dashboard", icon: BarChart3, path: "/portal/kpi", color: "text-amber-400" },
  { label: "Procurement", icon: ShoppingCart, path: "/portal/procurement", color: "text-orange-400" },
  { label: "QMS / ISO 9001", icon: FileCheck, path: "/portal/qms", color: "text-teal-400" },
  { label: "Legal Module", icon: Scale, path: "/portal/legal", color: "text-rose-400" },
  { label: "Communications", icon: MessageSquare, path: "/portal/comms", color: "text-sky-400" },
  { label: "Audit & Logs", icon: ScrollText, path: "/portal/audit", color: "text-slate-400" },
  { label: "ASTRA AMG", icon: Shield, path: "/portal/governance", color: "text-red-400" },
  { label: "ASTRA Meetings", icon: Mic, path: "/portal/meetings", color: "text-blue-300" },
  { label: "NEO AI Core", icon: Cpu, path: "/portal/neo-core", color: "text-violet-300" },
];

interface PortalLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}

export default function PortalLayout({ children, title, subtitle, badge, badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20" }: PortalLayoutProps) {
  const [location, setLocation] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, isRTL, toggleLang, t } = useLanguage();

  const handleLogout = () => {
    toast.success("Logged out successfully");
    setTimeout(() => setLocation("/"), 800);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-sm text-black shrink-0">GT</div>
        {!collapsed && (
          <div>
            <div className="font-bold text-sm leading-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Golden Team</div>
            <div className="text-[10px] text-white/30">Employee Portal</div>
          </div>
        )}
      </div>

      {/* NEO AI status */}
      {!collapsed && (
        <div className="mx-3 my-3 p-3 rounded-lg border border-blue-500/20" style={{ background: "rgba(59,130,246,0.05)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">NEO AI Core</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-white/40">Online · 80% Manus + 20% GPT-4</div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {NAV_ITEMS.map((item) => {
          const active = location === item.path || (item.path !== "/portal" && location.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => { setLocation(item.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 text-left
                ${active ? "nav-active text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${active ? item.color : ""}`} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/5 space-y-1">
        <button onClick={() => toast.info("Settings coming soon")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors ${collapsed ? "justify-center" : ""}`}>
          <Settings className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </button>
        <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/5 transition-colors ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#060B14] overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col shrink-0 border-r border-white/5 transition-all duration-300 relative
        ${collapsed ? "w-16" : "w-60"}`}
        style={{ background: "rgba(9,14,26,0.95)" }}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-white/10 bg-[#0D1B3E] flex items-center justify-center text-white/40 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 border-r border-white/5 flex flex-col" style={{ background: "rgba(9,14,26,0.98)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-4 md:px-6"
          style={{ background: "rgba(6,11,20,0.9)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden text-white/40 hover:text-white" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h1>
              {subtitle && <p className="text-[11px] text-white/40">{subtitle}</p>}
            </div>
            {badge && <Badge className={`text-[10px] border ${badgeColor} ml-2`}>{badge}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/3 hover:bg-white/8 hover:border-white/20 transition-all text-white/60 hover:text-white"
              title={t("Switch to Arabic", "التبديل إلى الإنجليزية")}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold" style={{ fontFamily: lang === 'ar' ? "'Noto Sans Arabic', sans-serif" : "'Space Grotesk', sans-serif" }}>
                {lang === 'en' ? 'عربي' : 'EN'}
              </span>
            </button>
            <a href="/admin" title="Admin Panel" className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-colors border border-red-500/20 hover:border-red-500/40">
              <ShieldAlert className="w-4 h-4" />
            </a>
            <button onClick={() => toast.info(t("No new notifications", "لا توجد إشعارات جديدة"))} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">EM</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
