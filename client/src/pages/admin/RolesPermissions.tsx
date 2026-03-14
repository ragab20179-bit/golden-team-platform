/**
 * RolesPermissions — Full role matrix with module-level permission toggles
 */
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import { Shield, Plus, Check, X, Save, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MODULES = ["Portal", "HR", "ERP/Odoo", "CRM", "KPI", "Procurement", "QMS", "Legal", "Comms", "Audit", "Governance", "ASTRA PM", "Meetings", "NEO AI", "Admin"];

const ROLES_DATA: Record<string, Record<string, { view: boolean; edit: boolean; approve: boolean }>> = {
  "Super Admin": Object.fromEntries(MODULES.map(m => [m, { view: true, edit: true, approve: true }])),
  "Finance Manager": Object.fromEntries(MODULES.map(m => [m, {
    view: ["Portal", "ERP/Odoo", "KPI", "Procurement", "Audit", "NEO AI"].includes(m),
    edit: ["ERP/Odoo", "KPI", "Procurement"].includes(m),
    approve: ["Procurement"].includes(m),
  }])),
  "HR Manager": Object.fromEntries(MODULES.map(m => [m, {
    view: ["Portal", "HR", "KPI", "Audit", "NEO AI", "Meetings"].includes(m),
    edit: ["HR"].includes(m),
    approve: ["HR"].includes(m),
  }])),
  "Legal Counsel": Object.fromEntries(MODULES.map(m => [m, {
    view: ["Portal", "Legal", "Governance", "Audit", "NEO AI", "Comms"].includes(m),
    edit: ["Legal"].includes(m),
    approve: ["Legal", "Governance"].includes(m),
  }])),
  "IT Manager": Object.fromEntries(MODULES.map(m => [m, {
    view: true,
    edit: ["Portal", "NEO AI"].includes(m),
    approve: false,
  }])),
  "QMS Auditor": Object.fromEntries(MODULES.map(m => [m, {
    view: ["Portal", "QMS", "Audit", "Governance", "NEO AI"].includes(m),
    edit: ["QMS"].includes(m),
    approve: ["QMS"].includes(m),
  }])),
  "Employee": Object.fromEntries(MODULES.map(m => [m, {
    view: ["Portal", "HR", "KPI", "Meetings", "NEO AI", "Comms"].includes(m),
    edit: false,
    approve: false,
  }])),
};

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "border-red-500/30 text-red-400",
  "Finance Manager": "border-emerald-500/30 text-emerald-400",
  "HR Manager": "border-blue-500/30 text-blue-400",
  "Legal Counsel": "border-violet-500/30 text-violet-400",
  "IT Manager": "border-amber-500/30 text-amber-400",
  "QMS Auditor": "border-cyan-500/30 text-cyan-400",
  "Employee": "border-white/20 text-white/50",
};

export default function RolesPermissions() {
  const [roles, setRoles] = useState(ROLES_DATA);
  const [selectedRole, setSelectedRole] = useState("Super Admin");
  const [dirty, setDirty] = useState(false);

  const toggle = (module: string, perm: "view" | "edit" | "approve") => {
    if (selectedRole === "Super Admin") {
      toast.error("Super Admin permissions cannot be modified");
      return;
    }
    setRoles(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        [module]: {
          ...prev[selectedRole][module],
          [perm]: !prev[selectedRole][module][perm],
        },
      },
    }));
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    toast.success(`Permissions saved for ${selectedRole}`);
  };

  const currentPerms = roles[selectedRole] || {};

  return (
    <AdminLayout title="Roles & Permissions" subtitle="Define what each role can see, edit, and approve">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Role selector */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(roles).map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all
                ${selectedRole === role
                  ? `${ROLE_COLORS[role]} bg-white/5`
                  : "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
                }`}
            >
              {role}
            </button>
          ))}
          <button
            onClick={() => toast.info("Custom role builder coming soon")}
            className="px-4 py-2 rounded-lg border border-dashed border-white/20 text-white/30 hover:text-white/50 text-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Role
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-white/8 bg-white/3">
          <Info className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
          <div className="text-white/50 text-xs">
            <span className="text-white/70 font-medium">{selectedRole}</span>
            {" "}— Configure view, edit, and approval permissions per module.
            {selectedRole === "Super Admin" && " Super Admin has immutable full access to all modules."}
          </div>
          {dirty && (
            <Button onClick={save} size="sm" className="ml-auto bg-red-500 hover:bg-red-400 text-white text-xs gap-1.5 flex-shrink-0">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          )}
        </div>

        {/* Permission matrix */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(10,15,30,0.8)" }}>
          {/* Header */}
          <div className="px-5 py-3 border-b border-white/8 grid grid-cols-12 text-[10px] tracking-widest uppercase text-white/30">
            <div className="col-span-4">Module</div>
            <div className="col-span-2 text-center">View</div>
            <div className="col-span-2 text-center">Edit / Write</div>
            <div className="col-span-2 text-center">Approve</div>
            <div className="col-span-2 text-center">Access Level</div>
          </div>
          <div className="divide-y divide-white/5">
            {MODULES.map(module => {
              const p = currentPerms[module] || { view: false, edit: false, approve: false };
              const level = p.approve ? "Full" : p.edit ? "Editor" : p.view ? "Read-only" : "No Access";
              const levelColor = p.approve ? "text-emerald-400" : p.edit ? "text-amber-400" : p.view ? "text-blue-400" : "text-white/20";
              return (
                <div key={module} className="px-5 py-3 grid grid-cols-12 items-center hover:bg-white/2 transition-colors">
                  <div className="col-span-4">
                    <div className="text-white/80 text-sm">{module}</div>
                  </div>
                  {(["view", "edit", "approve"] as const).map(perm => (
                    <div key={perm} className="col-span-2 flex justify-center">
                      <button
                        onClick={() => toggle(module, perm)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                          ${p[perm]
                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                            : "bg-white/5 border border-white/10 text-white/20 hover:bg-white/10"
                          } ${selectedRole === "Super Admin" ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {p[perm] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-medium ${levelColor}`}>{level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {dirty && (
          <div className="flex justify-end">
            <Button onClick={save} className="bg-red-500 hover:bg-red-400 text-white gap-2">
              <Save className="w-4 h-4" /> Save Permission Changes
            </Button>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
