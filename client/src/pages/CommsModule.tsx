import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, CheckCircle, XCircle, Clock, Send, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";

const approvals = [
  { id: "APR-2026-089", title: "Q1 Marketing Budget Increase", requestor: "Sara Mohammed", dept: "Business Dev", amount: "SAR 45,000", urgency: "High", status: "Pending", time: "2 hr ago" },
  { id: "APR-2026-090", title: "New IT Infrastructure Procurement", requestor: "Ahmed Al-Rashidi", dept: "IT Solutions", amount: "SAR 145,000", urgency: "Medium", status: "Pending", time: "4 hr ago" },
  { id: "APR-2026-091", title: "Employee Training Program", requestor: "Fatima Al-Zahra", dept: "HR", amount: "SAR 28,000", urgency: "Low", status: "Approved", time: "Yesterday" },
];

const messages = [
  { from: "Ahmed Al-Rashidi", dept: "IT Solutions", msg: "Server maintenance scheduled for tonight 11 PM - 1 AM. All systems will be briefly offline.", time: "10:30 AM", avatar: "AA" },
  { from: "Fatima Al-Zahra", dept: "HR", msg: "Reminder: Performance review submissions due by March 20. Please complete your self-assessment.", time: "09:15 AM", avatar: "FA" },
  { from: "NEO AI Core", dept: "System", msg: "3 procurement approvals require your attention. Total value: SAR 340,000. Click to review.", time: "08:45 AM", avatar: "N" },
  { from: "Khalid Hassan", dept: "Quality", msg: "Internal audit scheduled for March 25. Department heads please prepare documentation.", time: "Yesterday", avatar: "KH" },
];

const urgencyColor: Record<string, string> = {
  "High": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Medium": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Low": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function CommsModule() {
  const [newMsg, setNewMsg] = useState("");

  return (
    <PortalLayout title="Communications" subtitle="Inter-Corporate Messaging & Decision Approvals" badge="2 Pending Approvals" badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/20">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Approvals", value: "2", color: "text-amber-400", bg: "border-amber-500/20" },
            { label: "Unread Messages", value: "7", color: "text-sky-400", bg: "border-sky-500/20" },
            { label: "Active Discussions", value: "4", color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "Approved Today", value: "3", color: "text-emerald-400", bg: "border-emerald-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Approvals */}
          <div>
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Decision Approvals</h2>
            <div className="space-y-3">
              {approvals.map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{a.title}</div>
                      <div className="text-xs text-white/40">{a.requestor} · {a.dept} · {a.time}</div>
                    </div>
                    <Badge className={`text-[10px] border ${urgencyColor[a.urgency]}`}>{a.urgency}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{a.amount}</span>
                    {a.status === "Pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => toast.success(`"${a.title}" approved`)} className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white border-0">
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" onClick={() => toast.error("Request rejected")} variant="outline" className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/5">
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"><CheckCircle className="w-2.5 h-2.5 mr-1" /> Approved</Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Company-wide Messages */}
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Company Announcements</h2>
            <div className="flex-1 space-y-3 mb-4">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                  className="glass-card border border-white/5 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${m.from === "NEO AI Core" ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}>
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white">{m.from}</span>
                        <span className="text-[11px] text-white/30">{m.dept}</span>
                        <span className="text-[11px] text-white/20 ml-auto">{m.time}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{m.msg}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Compose */}
            <div className="glass-card border border-white/10 rounded-xl p-3 flex items-end gap-2">
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
                placeholder="Send a company-wide announcement..."
                rows={2} className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 resize-none outline-none" />
              <Button size="sm" onClick={() => { toast.success("Announcement sent"); setNewMsg(""); }} disabled={!newMsg.trim()}
                className="bg-sky-600 hover:bg-sky-500 text-white border-0 h-9 px-3 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
