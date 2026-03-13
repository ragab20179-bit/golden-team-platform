/**
 * HR Module — Employee Management System
 * Design: "Neural Depth"
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Clock, DollarSign, Award, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const employees = [
  { name: "Ahmed Al-Rashidi", role: "Senior IT Engineer", dept: "IT Solutions", status: "Active", avatar: "AA" },
  { name: "Sara Mohammed", role: "Business Analyst", dept: "Business Dev", status: "Active", avatar: "SM" },
  { name: "Khalid Hassan", role: "QMS Coordinator", dept: "Quality", status: "Active", avatar: "KH" },
  { name: "Fatima Al-Zahra", role: "HR Manager", dept: "HR", status: "Active", avatar: "FA" },
  { name: "Omar Abdullah", role: "Procurement Officer", dept: "Procurement", status: "On Leave", avatar: "OA" },
  { name: "Nour Ibrahim", role: "Legal Counsel", dept: "Legal", status: "Active", avatar: "NI" },
];

const leaveRequests = [
  { name: "Omar Abdullah", type: "Annual Leave", days: 5, from: "Mar 18", status: "Pending" },
  { name: "Sara Mohammed", type: "Sick Leave", days: 2, from: "Mar 15", status: "Approved" },
  { name: "Khalid Hassan", type: "Emergency", days: 1, from: "Mar 14", status: "Pending" },
];

const deptColors: Record<string, string> = {
  "IT Solutions": "text-blue-400 bg-blue-500/10",
  "Business Dev": "text-cyan-400 bg-cyan-500/10",
  "Quality": "text-teal-400 bg-teal-500/10",
  "HR": "text-violet-400 bg-violet-500/10",
  "Procurement": "text-orange-400 bg-orange-500/10",
  "Legal": "text-rose-400 bg-rose-500/10",
};

export default function HRModule() {
  return (
    <PortalLayout title="HR System" subtitle="Human Resources Management" badge="47 Employees" badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: "47", icon: Users, color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "On Leave Today", value: "3", icon: Clock, color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "Payroll (Monthly)", value: "SAR 284K", icon: DollarSign, color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: "Avg Performance", value: "87%", icon: Award, color: "text-violet-400", bg: "border-violet-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee Directory */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Employee Directory</h2>
              <Button size="sm" onClick={() => toast.info("Add employee — coming in full build")} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
                <UserPlus className="w-3 h-3 mr-1" /> Add Employee
              </Button>
            </div>
            <div className="space-y-2">
              {employees.map((e, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">{e.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{e.name}</div>
                    <div className="text-xs text-white/40">{e.role}</div>
                  </div>
                  <Badge className={`text-[10px] ${deptColors[e.dept] || "text-white/50 bg-white/5"}`}>{e.dept}</Badge>
                  <Badge className={`text-[10px] ${e.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{e.status}</Badge>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Leave Requests */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Leave Requests</h2>
            <div className="space-y-3">
              {leaveRequests.map((r, i) => (
                <div key={i} className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{r.name}</div>
                      <div className="text-xs text-white/40">{r.type} · {r.days} days from {r.from}</div>
                    </div>
                    <Badge className={`text-[10px] ${r.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{r.status}</Badge>
                  </div>
                  {r.status === "Pending" && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => toast.success("Leave approved")} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0 flex-1">
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" onClick={() => toast.error("Leave rejected")} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5 flex-1">
                        <AlertCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payroll */}
            <div className="mt-4 glass-card border border-emerald-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Payroll Status</span>
              </div>
              <div className="space-y-2 text-xs text-white/50">
                <div className="flex justify-between"><span>Next Run</span><span className="text-white">March 28, 2026</span></div>
                <div className="flex justify-between"><span>Total Amount</span><span className="text-emerald-400">SAR 284,500</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-amber-400">Pending Approval</span></div>
              </div>
              <Button size="sm" onClick={() => toast.success("Payroll approved and queued")} className="w-full mt-3 h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                Approve Payroll Run
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
