/**
 * ModuleAccess — Enable/disable modules per department or individual user
 */
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Layers, ToggleLeft, ToggleRight, Users, Settings, Cpu, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MODULES_CONFIG = [
  { id: "portal", name: "Employee Portal", desc: "Main portal dashboard and NEO AI chat", icon: "🏠", critical: true, enabled: true, users: 24 },
  { id: "hr", name: "HR System", desc: "OrangeHRM integration — employee records, payroll, leave", icon: "👥", critical: false, enabled: true, users: 8 },
  { id: "erp", name: "Odoo 19 ERP", desc: "Accounting, invoicing, financial management", icon: "📊", critical: false, enabled: true, users: 6 },
  { id: "crm", name: "CRM Module", desc: "Customer relationship management and sales pipeline", icon: "🤝", critical: false, enabled: true, users: 5 },
  { id: "kpi", name: "KPI Dashboard", desc: "Metabase-powered analytics and performance indicators", icon: "📈", critical: false, enabled: true, users: 15 },
  { id: "procurement", name: "Procurement", desc: "Purchase orders, vendor management, approvals", icon: "🛒", critical: false, enabled: true, users: 7 },
  { id: "qms", name: "QMS / ISO 9001", desc: "Quality management, audits, non-conformances", icon: "✅", critical: false, enabled: true, users: 4 },
  { id: "legal", name: "Legal Module", desc: "Contract management, OpenContracts AI, DocuSeal", icon: "⚖️", critical: false, enabled: true, users: 3 },
  { id: "comms", name: "Communications", desc: "Rocket.Chat inter-corporate messaging and approvals", icon: "💬", critical: false, enabled: true, users: 24 },
  { id: "audit", name: "Audit & Logs", desc: "Immutable activity log and compliance reporting", icon: "🔍", critical: true, enabled: true, users: 5 },
  { id: "governance", name: "ASTRA AMG Governance", desc: "Authority matrix, approval chains, policy engine", icon: "🏛️", critical: true, enabled: true, users: 6 },
  { id: "astra-pm", name: "ASTRA PM", desc: "OpenProject-powered project management platform", icon: "📋", critical: false, enabled: true, users: 10 },
  { id: "meetings", name: "Meeting Assistant", desc: "NEO AI meeting transcription, analysis, action items", icon: "🎙️", critical: false, enabled: true, users: 18 },
  { id: "neo-core", name: "NEO AI Core", desc: "Hybrid AI architecture — Manus 80% + GPT-4 20%", icon: "🧠", critical: true, enabled: true, users: 24 },
  { id: "risk", name: "Risk Management AI", desc: "Automated risk assessment and mitigation planning", icon: "⚠️", critical: false, enabled: false, users: 0 },
  { id: "knowledge", name: "Knowledge Base", desc: "Outline-powered company wiki and documentation", icon: "📚", critical: false, enabled: false, users: 0 },
];

export default function ModuleAccess() {
  const [modules, setModules] = useState(MODULES_CONFIG);
  const [dirty, setDirty] = useState(false);

  const toggle = (id: string) => {
    const mod = modules.find(m => m.id === id);
    if (mod?.critical) {
      toast.error(`${mod.name} is a critical system module and cannot be disabled`);
      return;
    }
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    toast.success("Module access configuration saved");
  };

  const enabled = modules.filter(m => m.enabled).length;

  return (
    <AdminLayout title="Module Access Control" subtitle={`${enabled}/${modules.length} modules active`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <span className="text-emerald-400">{enabled} Active</span>
            <span className="text-white/30">{modules.length - enabled} Inactive</span>
            <span className="text-red-400/70">{modules.filter(m => m.critical).length} Critical (locked)</span>
          </div>
          {dirty && (
            <Button onClick={save} className="bg-red-500 hover:bg-red-400 text-white gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {modules.map(mod => (
            <div key={mod.id}
              className={`rounded-xl border p-4 transition-all ${mod.enabled ? "border-white/10 bg-[#0A0F1E]/80" : "border-white/5 bg-white/2 opacity-60"}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{mod.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-sm font-medium">{mod.name}</span>
                      {mod.critical && (
                        <Badge variant="outline" className="border-red-500/30 text-red-400/70 text-[9px] px-1.5 py-0">Critical</Badge>
                      )}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5 leading-relaxed">{mod.desc}</div>
                    <div className="flex items-center gap-1 mt-2 text-white/30 text-xs">
                      <Users className="w-3 h-3" />
                      <span>{mod.users} users</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggle(mod.id)} className="flex-shrink-0 ml-2">
                  {mod.enabled
                    ? <ToggleRight className="w-8 h-8 text-emerald-400" />
                    : <ToggleLeft className="w-8 h-8 text-white/20" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {dirty && (
          <div className="flex justify-end">
            <Button onClick={save} className="bg-red-500 hover:bg-red-400 text-white gap-2">
              <Save className="w-4 h-4" /> Save Module Configuration
            </Button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
