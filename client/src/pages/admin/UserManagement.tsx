/**
 * UserManagement — Full user CRUD with role assignment and access control
 */
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import {
  Users, Plus, Search, Filter, MoreVertical, Shield,
  CheckCircle, XCircle, Clock, Edit, Trash2, Key,
  Mail, Phone, Building2, Lock, Unlock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const USERS = [
  { id: 1, name: "Ahmed Al-Rashid", email: "ahmed@goldenteam.sa", role: "Super Admin", dept: "Management", status: "active", lastLogin: "2 min ago", modules: ["All"] },
  { id: 2, name: "Sarah Mohammed", email: "sarah@goldenteam.sa", role: "Finance Manager", dept: "Finance", status: "active", lastLogin: "1 hr ago", modules: ["ERP", "KPI", "Procurement"] },
  { id: 3, name: "Khalid Ibrahim", email: "khalid@goldenteam.sa", role: "HR Manager", dept: "HR", status: "active", lastLogin: "3 hr ago", modules: ["HR", "KPI"] },
  { id: 4, name: "Fatima Al-Zahra", email: "fatima@goldenteam.sa", role: "Legal Counsel", dept: "Legal", status: "active", lastLogin: "Yesterday", modules: ["Legal", "Governance"] },
  { id: 5, name: "Omar Hassan", email: "omar@goldenteam.sa", role: "IT Manager", dept: "IT", status: "active", lastLogin: "2 hr ago", modules: ["All"] },
  { id: 6, name: "Nour Al-Amin", email: "nour@goldenteam.sa", role: "Sales Executive", dept: "Sales", status: "active", lastLogin: "4 hr ago", modules: ["CRM", "Procurement"] },
  { id: 7, name: "Yusuf Karimi", email: "yusuf@goldenteam.sa", role: "QMS Auditor", dept: "Quality", status: "active", lastLogin: "1 day ago", modules: ["QMS", "Audit"] },
  { id: 8, name: "Layla Nasser", email: "layla@goldenteam.sa", role: "Project Manager", dept: "PMO", status: "inactive", lastLogin: "5 days ago", modules: ["ASTRA PM", "KPI"] },
  { id: 9, name: "Tariq Saleh", email: "tariq@goldenteam.sa", role: "Accountant", dept: "Finance", status: "active", lastLogin: "30 min ago", modules: ["ERP", "KPI"] },
  { id: 10, name: "Hana Al-Otaibi", email: "hana@goldenteam.sa", role: "Procurement Officer", dept: "Procurement", status: "suspended", lastLogin: "2 weeks ago", modules: ["Procurement"] },
];

const ROLES = ["Super Admin", "Finance Manager", "HR Manager", "Legal Counsel", "IT Manager", "Sales Executive", "QMS Auditor", "Project Manager", "Accountant", "Procurement Officer", "Employee"];
const DEPARTMENTS = ["Management", "Finance", "HR", "Legal", "IT", "Sales", "Quality", "PMO", "Procurement", "Operations"];

const statusColor: Record<string, string> = {
  active: "border-emerald-500/30 text-emerald-400",
  inactive: "border-white/20 text-white/40",
  suspended: "border-red-500/30 text-red-400",
};

const statusIcon: Record<string, React.ReactNode> = {
  active: <CheckCircle className="w-3 h-3" />,
  inactive: <Clock className="w-3 h-3" />,
  suspended: <XCircle className="w-3 h-3" />,
};

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [users, setUsers] = useState(USERS);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "", dept: "", phone: "" });

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    const matchDept = filterDept === "all" || u.dept === filterDept;
    return matchSearch && matchStatus && matchDept;
  });

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? {
      ...u,
      status: u.status === "active" ? "suspended" : "active"
    } : u));
    toast.success("User status updated");
  };

  const deleteUser = (id: number) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    toast.success("User removed from platform");
  };

  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    setUsers(prev => [...prev, {
      id: prev.length + 1,
      ...newUser,
      status: "active",
      lastLogin: "Never",
      modules: [],
    }]);
    setNewUser({ name: "", email: "", role: "", dept: "", phone: "" });
    setShowAddUser(false);
    toast.success("User created successfully. Welcome email sent.");
  };

  return (
    <AdminLayout title="User Management" subtitle={`${users.length} total users · ${users.filter(u => u.status === "active").length} active`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Users", value: users.length, color: "text-blue-400" },
            { label: "Active", value: users.filter(u => u.status === "active").length, color: "text-emerald-400" },
            { label: "Inactive", value: users.filter(u => u.status === "inactive").length, color: "text-white/40" },
            { label: "Suspended", value: users.filter(u => u.status === "suspended").length, color: "text-red-400" },
          ].map(s => (
            <Card key={s.label} className="p-4 border-white/8 bg-[#0A0F1E]/80">
              <div className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</div>
              <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-red-500/50"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white/70">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAddUser(true)} className="bg-red-500 hover:bg-red-400 text-white gap-2">
            <Plus className="w-4 h-4" /> Add User
          </Button>
        </div>

        {/* Users table */}
        <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(10,15,30,0.8)" }}>
          <div className="px-5 py-3 border-b border-white/8 grid grid-cols-12 text-[10px] tracking-widest uppercase text-white/30">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Department</div>
            <div className="col-span-2">Modules</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Last Login</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map(user => (
              <div key={user.id} className="px-5 py-3.5 grid grid-cols-12 items-center hover:bg-white/3 transition-colors group">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#05080F] font-bold text-xs">{user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                  </div>
                  <div>
                    <div className="text-white/90 text-sm font-medium">{user.name}</div>
                    <div className="text-white/40 text-xs">{user.email}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    {user.role === "Super Admin" && <Shield className="w-3 h-3 text-red-400" />}
                    <span className="text-white/70 text-xs">{user.role}</span>
                  </div>
                </div>
                <div className="col-span-2 text-white/50 text-xs">{user.dept}</div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {user.modules.slice(0, 2).map(m => (
                      <Badge key={m} variant="outline" className="border-white/10 text-white/40 text-[9px] px-1.5 py-0">{m}</Badge>
                    ))}
                    {user.modules.length > 2 && (
                      <Badge variant="outline" className="border-white/10 text-white/30 text-[9px] px-1.5 py-0">+{user.modules.length - 2}</Badge>
                    )}
                  </div>
                </div>
                <div className="col-span-1">
                  <Badge variant="outline" className={`text-[10px] gap-1 ${statusColor[user.status]}`}>
                    {statusIcon[user.status]} {user.status}
                  </Badge>
                </div>
                <div className="col-span-1 text-white/30 text-xs">{user.lastLogin}</div>
                <div className="col-span-1 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toast.info(`Editing ${user.name}`)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => toggleStatus(user.id)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-amber-400 transition-colors">
                    {user.status === "active" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-white/8 text-white/30 text-xs">
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      </motion.div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Plus className="w-5 h-5 text-red-400" /> Create New User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-white/60 text-xs">Full Name *</Label>
              <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Mohammed Al-Saud" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Email Address *</Label>
              <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                placeholder="name@goldenteam.sa" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Role *</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Department</Label>
              <Select value={newUser.dept} onValueChange={v => setNewUser(p => ({ ...p, dept: v }))}>
                <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">Phone (optional)</Label>
              <Input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))}
                placeholder="+966 5x xxx xxxx" className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={addUser} className="flex-1 bg-red-500 hover:bg-red-400 text-white">
                Create User & Send Invite
              </Button>
              <Button variant="outline" onClick={() => setShowAddUser(false)} className="border-white/10 text-white/60 bg-transparent hover:bg-white/5">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
