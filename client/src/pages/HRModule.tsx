/**
 * HR Module — نظام إدارة الموارد البشرية
 * Bilingual: Arabic / English
 * Live data from modules.hr.list + modules.hr.stats via tRPC
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Clock, DollarSign, Award, CheckCircle, AlertCircle, Upload, Loader2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import PortalLayout from "@/components/PortalLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { HRBulkImport } from "@/components/ModuleBulkImport";
import { AIModuleQueryPanel } from "@/components/AIModuleQueryPanel";
import { trpc } from "@/lib/trpc";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const deptColors: Record<string, string> = {
  "IT Solutions":  "text-blue-400 bg-blue-500/10",
  "Business Dev":  "text-cyan-400 bg-cyan-500/10",
  "Quality":       "text-teal-400 bg-teal-500/10",
  "HR":            "text-violet-400 bg-violet-500/10",
  "Procurement":   "text-orange-400 bg-orange-500/10",
  "Legal":         "text-rose-400 bg-rose-500/10",
};

const statusColors: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_leave: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  inactive: "bg-white/5 text-white/40 border-white/10",
};

export default function HRModule() {
  const { t, isRTL } = useLanguage();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: "", fullNameAr: "", jobTitle: "", department: "",
    email: "", phone: "", contractType: "full_time" as const,
    status: "active" as const, salary: "",
  });

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: employees = [], isLoading: listLoading, refetch } = trpc.modules.hr.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.modules.hr.stats.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const addEmployee = trpc.modules.hr.add.useMutation({
    onSuccess: () => {
      toast.success(t("Employee added successfully", "تمت إضافة الموظف بنجاح"));
      utils.modules.hr.list.invalidate();
      utils.modules.hr.stats.invalidate();
      setAddOpen(false);
      setForm({ fullName: "", fullNameAr: "", jobTitle: "", department: "", email: "", phone: "", contractType: "full_time", status: "active", salary: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteEmployee = trpc.modules.hr.delete.useMutation({
    onSuccess: () => {
      toast.success(t("Employee removed", "تم حذف الموظف"));
      utils.modules.hr.list.invalidate();
      utils.modules.hr.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!form.fullName.trim()) { toast.error(t("Full name is required", "الاسم الكامل مطلوب")); return; }
    addEmployee.mutate({
      ...form,
      salary: form.salary ? Number(form.salary) : undefined,
      email: form.email || undefined,
    });
  };

  return (
    <PortalLayout
      title={t("HR System", "الموارد البشرية")}
      subtitle={t("Human Resources Management", "إدارة الموارد البشرية")}
      badge={stats ? t(`${stats.total} Employees`, `${stats.total} موظفًا`) : t("Loading…", "جارٍ التحميل…")}
      badgeColor="bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    >
      <div className="p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>

        {/* ── Live Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t("Total Employees", "إجمالي الموظفين"),  value: stats?.total ?? "—",    icon: Users,       color: "text-blue-400",    bg: "border-blue-500/20" },
            { label: t("Active",           "نشط"),              value: stats?.active ?? "—",   icon: CheckCircle, color: "text-emerald-400", bg: "border-emerald-500/20" },
            { label: t("On Leave",         "في إجازة"),         value: stats?.onLeave ?? "—",  icon: Clock,       color: "text-amber-400",   bg: "border-amber-500/20" },
            { label: t("Inactive",         "غير نشط"),          value: stats?.inactive ?? "—", icon: AlertCircle, color: "text-rose-400",    bg: "border-rose-500/20" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`glass-card p-4 border ${s.bg} rounded-xl`}>
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Employee Directory ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t("Employee Directory", "دليل الموظفين")}
            </h2>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => refetch()} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)} variant="outline" className="border-white/20 text-white/70 hover:bg-white/10 bg-transparent h-8 text-xs">
                <Upload className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Import", "استيراد")}
              </Button>
              <Button size="sm" onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white border-0 h-8 text-xs">
                <UserPlus className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} /> {t("Add Employee", "إضافة موظف")}
              </Button>
            </div>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center py-16 text-white/40">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t("Loading employees…", "جارٍ تحميل الموظفين…")}
            </div>
          ) : employees.length === 0 ? (
            <div className="glass-card border border-white/5 rounded-xl p-12 text-center">
              <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">{t("No employees yet. Add one or use bulk import.", "لا يوجد موظفون بعد. أضف موظفًا أو استخدم الاستيراد الجماعي.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((e, i) => {
                const initials = (e.fullName ?? "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <motion.div key={e.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="glass-card border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:border-white/10 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white shrink-0">{initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{isRTL && e.fullNameAr ? e.fullNameAr : e.fullName}</div>
                      <div className="text-xs text-white/40">{e.jobTitle ?? t("—", "—")}</div>
                    </div>
                    {e.department && (
                      <Badge className={`text-[10px] ${deptColors[e.department] ?? "text-white/50 bg-white/5"}`}>{e.department}</Badge>
                    )}
                    <Badge className={`text-[10px] ${statusColors[e.status] ?? "bg-white/5 text-white/40"}`}>
                      {e.status === "active" ? t("Active", "نشط") : e.status === "on_leave" ? t("On Leave", "إجازة") : t("Inactive", "غير نشط")}
                    </Badge>
                    {e.salary && (
                      <span className="text-xs text-emerald-400 hidden md:block">{e.salary.toLocaleString()} {t("SAR", "ريال")}</span>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 transition-opacity"
                      onClick={() => {
                        if (confirm(t("Remove this employee?", "هل تريد حذف هذا الموظف؟"))) {
                          deleteEmployee.mutate({ id: e.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Departments Summary ── */}
        {stats && stats.departments && stats.departments.length > 0 && (
          <div className="glass-card border border-white/5 p-4 rounded-xl">
            <h3 className="text-xs font-semibold text-white/60 mb-3 uppercase tracking-widest">{t("Departments", "الأقسام")}</h3>
            <div className="flex flex-wrap gap-2">
              {(stats.departments as string[]).map((dept) => (
                <Badge key={dept} className={`text-xs ${deptColors[dept] ?? "text-white/50 bg-white/5"}`}>{dept}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Business Intelligence Panel ── */}
      <div className="px-6 pb-6">
        <AIModuleQueryPanel
          module="business"
          title={t("HR Intelligence — Business Management AI", "ذكاء الموارد البشرية")}
          extraInput={{ focus: "hr" }}
          placeholder={t(
            "e.g. What is our headcount by department? Analyze salary distribution across teams.",
            "مثال: ما هو عدد الموظفين حسب القسم؟ حلل توزيع الرواتب."
          )}
        />
      </div>

      {/* ── Bulk Import Dialog ── */}
      <HRBulkImport open={bulkOpen} onClose={() => setBulkOpen(false)} />

      {/* ── Add Employee Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{t("Add Employee", "إضافة موظف")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Full Name *", "الاسم الكامل *")}</Label>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="e.g. Ahmed Al-Rashidi" />
            </div>
            <div className="col-span-2">
              <Label className="text-white/60 text-xs">{t("Full Name (Arabic)", "الاسم بالعربية")}</Label>
              <Input value={form.fullNameAr} onChange={e => setForm(f => ({ ...f, fullNameAr: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" dir="rtl" placeholder="أحمد الراشدي" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Job Title", "المسمى الوظيفي")}</Label>
              <Input value={form.jobTitle} onChange={e => setForm(f => ({ ...f, jobTitle: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Senior Engineer" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Department", "القسم")}</Label>
              <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="IT Solutions" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Email", "البريد الإلكتروني")}</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="email" placeholder="ahmed@example.com" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Phone", "الهاتف")}</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="+966 5x xxx xxxx" />
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Contract Type", "نوع العقد")}</Label>
              <Select value={form.contractType} onValueChange={v => setForm(f => ({ ...f, contractType: v as typeof form.contractType }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                  <SelectItem value="full_time">{t("Full Time", "دوام كامل")}</SelectItem>
                  <SelectItem value="part_time">{t("Part Time", "دوام جزئي")}</SelectItem>
                  <SelectItem value="contract">{t("Contract", "عقد")}</SelectItem>
                  <SelectItem value="intern">{t("Intern", "متدرب")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/60 text-xs">{t("Monthly Salary (SAR)", "الراتب الشهري (ريال)")}</Label>
              <Input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                className="bg-white/5 border-white/10 text-white mt-1" type="number" placeholder="15000" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-white/20 text-white/70 bg-transparent hover:bg-white/5">
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={handleAdd} disabled={addEmployee.isPending} className="bg-blue-600 hover:bg-blue-500 text-white border-0">
              {addEmployee.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("Add Employee", "إضافة موظف")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
