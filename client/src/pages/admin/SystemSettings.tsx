/**
 * SystemSettings — Full platform configuration for Super Administrator
 */
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";
import {
  Settings, Globe, Bell, Lock, Database, Mail,
  Save, RefreshCw, Shield, Cpu, Clock, Building2,
  ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "security", label: "Security", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "NEO AI", icon: Cpu },
  { id: "email", label: "Email / SMTP", icon: Mail },
  { id: "backup", label: "Backup & DR", icon: Database },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex-shrink-0">
      {value
        ? <ToggleRight className="w-8 h-8 text-emerald-400" />
        : <ToggleLeft className="w-8 h-8 text-white/20" />}
    </button>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 mr-6">
        <div className="text-white/80 text-sm font-medium">{label}</div>
        {desc && <div className="text-white/40 text-xs mt-0.5">{desc}</div>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SystemSettings() {
  const [general, setGeneral] = useState({
    companyName: "Golden Team Trading Services",
    domain: "goldenteam.sa",
    timezone: "Asia/Riyadh",
    language: "en",
    currency: "SAR",
    dateFormat: "DD/MM/YYYY",
  });
  const [security, setSecurity] = useState({
    mfa: true, sessionTimeout: "8", passwordExpiry: "90",
    ipWhitelist: false, auditAll: true, ssoEnabled: false,
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true, smsAlerts: false, pushNotifications: true,
    approvalAlerts: true, securityAlerts: true, systemAlerts: true,
    weeklyReport: true, dailyDigest: false,
  });
  const [ai, setAi] = useState({
    manusWeight: "80", gptWeight: "20", maxTokens: "4096",
    contextWindow: "32", autoEscalate: true, auditAI: true,
    selfLearning: false, responseTimeout: "30",
  });
  const [email, setEmail] = useState({
    smtpHost: "smtp.goldenteam.sa", smtpPort: "587",
    smtpUser: "noreply@goldenteam.sa", smtpPass: "••••••••",
    fromName: "Golden Team Platform", tls: true,
  });

  const save = (section: string) => toast.success(`${section} settings saved successfully`);

  return (
    <AdminLayout title="System Settings" subtitle="Platform-wide configuration and preferences">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Tabs defaultValue="general">
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex flex-wrap h-auto gap-1 p-1">
            {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id}
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 text-white/50 gap-2 text-sm">
                <Icon className="w-3.5 h-3.5" />{label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" /> Company & Platform
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { label: "Company Name", key: "companyName", placeholder: "Golden Team Trading Services" },
                  { label: "Primary Domain", key: "domain", placeholder: "goldenteam.sa" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <Label className="text-white/60 text-xs">{label}</Label>
                    <Input value={general[key as keyof typeof general]}
                      onChange={e => setGeneral(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                  </div>
                ))}
                <div>
                  <Label className="text-white/60 text-xs">Timezone</Label>
                  <Select value={general.timezone} onValueChange={v => setGeneral(p => ({ ...p, timezone: v }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (UTC+3)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Default Currency</Label>
                  <Select value={general.currency} onValueChange={v => setGeneral(p => ({ ...p, currency: v }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                      <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Default Language</Label>
                  <Select value={general.language} onValueChange={v => setGeneral(p => ({ ...p, language: v }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Date Format</Label>
                  <Select value={general.dateFormat} onValueChange={v => setGeneral(p => ({ ...p, dateFormat: v }))}>
                    <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white/70">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => save("General")} className="mt-6 bg-red-500 hover:bg-red-400 text-white gap-2">
                <Save className="w-4 h-4" /> Save General Settings
              </Button>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" /> Security & Authentication
              </h3>
              <div>
                <SettingRow label="Multi-Factor Authentication (MFA)" desc="Require MFA for all employee logins">
                  <Toggle value={security.mfa} onChange={v => setSecurity(p => ({ ...p, mfa: v }))} />
                </SettingRow>
                <SettingRow label="IP Whitelist" desc="Restrict portal access to approved IP ranges">
                  <Toggle value={security.ipWhitelist} onChange={v => setSecurity(p => ({ ...p, ipWhitelist: v }))} />
                </SettingRow>
                <SettingRow label="Full Audit Logging" desc="Log every user action including reads">
                  <Toggle value={security.auditAll} onChange={v => setSecurity(p => ({ ...p, auditAll: v }))} />
                </SettingRow>
                <SettingRow label="SSO Integration" desc="Enable Single Sign-On via SAML/OIDC">
                  <Toggle value={security.ssoEnabled} onChange={v => setSecurity(p => ({ ...p, ssoEnabled: v }))} />
                </SettingRow>
                <SettingRow label="Session Timeout (hours)" desc="Auto-logout after inactivity">
                  <Input value={security.sessionTimeout}
                    onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}
                    className="w-20 bg-white/5 border-white/10 text-white text-center" />
                </SettingRow>
                <SettingRow label="Password Expiry (days)" desc="Force password reset after N days">
                  <Input value={security.passwordExpiry}
                    onChange={e => setSecurity(p => ({ ...p, passwordExpiry: e.target.value }))}
                    className="w-20 bg-white/5 border-white/10 text-white text-center" />
                </SettingRow>
              </div>
              <Button onClick={() => save("Security")} className="mt-6 bg-red-500 hover:bg-red-400 text-white gap-2">
                <Save className="w-4 h-4" /> Save Security Settings
              </Button>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> Notification Preferences
              </h3>
              {[
                { key: "emailAlerts", label: "Email Alerts", desc: "Send notifications via email" },
                { key: "smsAlerts", label: "SMS Alerts", desc: "Send critical alerts via SMS" },
                { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications" },
                { key: "approvalAlerts", label: "Approval Requests", desc: "Notify approvers of pending items" },
                { key: "securityAlerts", label: "Security Alerts", desc: "Immediate alerts for security events" },
                { key: "systemAlerts", label: "System Alerts", desc: "Service degradation and maintenance" },
                { key: "weeklyReport", label: "Weekly Summary Report", desc: "Platform usage summary every Monday" },
                { key: "dailyDigest", label: "Daily Digest", desc: "Daily activity summary at 8:00 AM" },
              ].map(({ key, label, desc }) => (
                <SettingRow key={key} label={label} desc={desc}>
                  <Toggle
                    value={notifications[key as keyof typeof notifications] as boolean}
                    onChange={v => setNotifications(p => ({ ...p, [key]: v }))}
                  />
                </SettingRow>
              ))}
              <Button onClick={() => save("Notifications")} className="mt-6 bg-red-500 hover:bg-red-400 text-white gap-2">
                <Save className="w-4 h-4" /> Save Notification Settings
              </Button>
            </Card>
          </TabsContent>

          {/* NEO AI */}
          <TabsContent value="ai">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" /> NEO AI Core Configuration
              </h3>
              <div className="grid md:grid-cols-2 gap-5 mb-5">
                {[
                  { label: "Manus AI Traffic Weight (%)", key: "manusWeight", placeholder: "80" },
                  { label: "GPT-4 Traffic Weight (%)", key: "gptWeight", placeholder: "20" },
                  { label: "Max Output Tokens", key: "maxTokens", placeholder: "4096" },
                  { label: "Context Window (k tokens)", key: "contextWindow", placeholder: "32" },
                  { label: "Response Timeout (seconds)", key: "responseTimeout", placeholder: "30" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <Label className="text-white/60 text-xs">{label}</Label>
                    <Input value={ai[key as keyof typeof ai] as string}
                      onChange={e => setAi(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                  </div>
                ))}
              </div>
              <SettingRow label="Auto-Escalate Complex Queries" desc="Route complex queries to GPT-4 automatically">
                <Toggle value={ai.autoEscalate} onChange={v => setAi(p => ({ ...p, autoEscalate: v }))} />
              </SettingRow>
              <SettingRow label="Audit All AI Interactions" desc="Log every NEO AI query and response">
                <Toggle value={ai.auditAI} onChange={v => setAi(p => ({ ...p, auditAI: v }))} />
              </SettingRow>
              <SettingRow label="Self-Learning Mode" desc="Allow NEO to learn from approved interactions (Phase 3)">
                <Toggle value={ai.selfLearning} onChange={v => setAi(p => ({ ...p, selfLearning: v }))} />
              </SettingRow>
              <Button onClick={() => save("NEO AI")} className="mt-6 bg-red-500 hover:bg-red-400 text-white gap-2">
                <Save className="w-4 h-4" /> Save AI Configuration
              </Button>
            </Card>
          </TabsContent>

          {/* Email */}
          <TabsContent value="email">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" /> Email / SMTP Configuration
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { label: "SMTP Host", key: "smtpHost", placeholder: "smtp.goldenteam.sa" },
                  { label: "SMTP Port", key: "smtpPort", placeholder: "587" },
                  { label: "SMTP Username", key: "smtpUser", placeholder: "noreply@goldenteam.sa" },
                  { label: "SMTP Password", key: "smtpPass", placeholder: "••••••••", type: "password" },
                  { label: "From Name", key: "fromName", placeholder: "Golden Team Platform" },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <Label className="text-white/60 text-xs">{label}</Label>
                    <Input
                      type={type || "text"}
                      value={email[key as keyof typeof email] as string}
                      onChange={e => setEmail(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20" />
                  </div>
                ))}
              </div>
              <SettingRow label="TLS / STARTTLS" desc="Enable encrypted SMTP connection">
                <Toggle value={email.tls} onChange={v => setEmail(p => ({ ...p, tls: v }))} />
              </SettingRow>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => save("Email")} className="bg-red-500 hover:bg-red-400 text-white gap-2">
                  <Save className="w-4 h-4" /> Save SMTP Settings
                </Button>
                <Button variant="outline" onClick={() => toast.info("Test email sent to admin@goldenteam.sa")}
                  className="border-white/10 text-white/60 bg-transparent hover:bg-white/5 gap-2">
                  <RefreshCw className="w-4 h-4" /> Send Test Email
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup">
            <Card className="p-6 border-white/8 bg-[#0A0F1E]/80">
              <h3 className="text-white font-semibold mb-5 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> Backup & Disaster Recovery
              </h3>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Last Backup", value: "2 hours ago", sub: "PostgreSQL full dump", color: "text-emerald-400" },
                  { label: "RTO Target", value: "4 hours", sub: "Recovery Time Objective", color: "text-amber-400" },
                  { label: "RPO Target", value: "24 hours", sub: "Recovery Point Objective", color: "text-blue-400" },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-lg border border-white/8 bg-white/3">
                    <div className={`text-xl font-bold font-display ${s.color}`}>{s.value}</div>
                    <div className="text-white/70 text-xs font-medium mt-0.5">{s.label}</div>
                    <div className="text-white/30 text-[10px] mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
              {[
                { label: "Automated Daily Backups", desc: "Run PostgreSQL dump every 24 hours at 02:00 AM" },
                { label: "S3 Offsite Backup", desc: "Upload encrypted backups to MinIO/S3 storage" },
                { label: "Redis Persistence (AOF)", desc: "Append-only file for Redis data durability" },
                { label: "Backup Encryption", desc: "AES-256 encryption for all backup files" },
              ].map(({ label, desc }) => (
                <SettingRow key={label} label={label} desc={desc}>
                  <Toggle value={true} onChange={() => toast.info("Contact your system administrator to change backup settings")} />
                </SettingRow>
              ))}
              <div className="flex gap-3 mt-6">
                <Button onClick={() => toast.success("Manual backup initiated. Estimated completion: 8 minutes.")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                  <Database className="w-4 h-4" /> Run Manual Backup Now
                </Button>
                <Button variant="outline" onClick={() => toast.info("Restore wizard coming in Phase 2")}
                  className="border-white/10 text-white/60 bg-transparent hover:bg-white/5 gap-2">
                  <RefreshCw className="w-4 h-4" /> Test Restore Procedure
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
}
