/**
 * Portal Settings Page
 * - Change Password (all users)
 * - Employee Management: create employees (admin only)
 * - Permissions: per-user module access toggles (admin only)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  KeyRound, UserPlus, Users, CheckCircle, AlertCircle, Loader2,
  Eye, EyeOff, ShieldCheck, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ─── Portal module definitions ─────────────────────────────────────────────────
const PORTAL_MODULES = [
  { key: "neo_chat",        label: "NEO Chat",              description: "AI assistant & voice chat" },
  { key: "neo_core",        label: "NEO Core",              description: "NEO AI engine status & metrics" },
  { key: "neo_usage",       label: "NEO AI Usage",          description: "Token usage analytics" },
  { key: "odoo_dashboard",  label: "Odoo Dashboard",        description: "ERP overview & stats" },
  { key: "odoo_ai_entry",   label: "NEO AI Data Entry",     description: "AI-powered Odoo operations" },
  { key: "odoo_audit_log",  label: "Odoo Audit Log",        description: "AI operation history" },
  { key: "requests",        label: "Requests & Approvals",  description: "Request workflow engine" },
  { key: "reports",         label: "AI Reports",            description: "Scheduled weekly KPI reports" },
  { key: "vault",           label: "Drive Vault",           description: "File storage & uploads" },
  { key: "bid_evaluation",  label: "Bid Evaluation",        description: "RFQ & supplier scoring" },
  { key: "astra_pm",        label: "ASTRA PM",              description: "Project management engine" },
  { key: "risk_assessment", label: "Risk Assessment",       description: "AI risk analysis" },
];

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      setCurrent(""); setNext(""); setConfirm("");
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next !== confirm) { setError("New passwords do not match"); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    mutation.mutate({ currentPassword: current, newPassword: next });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <KeyRound className="w-5 h-5 text-amber-500 shrink-0" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password. You will need your current password to confirm.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="Enter current password"
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="off"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNext(!showNext)}
              >
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              autoComplete="off"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md p-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Password changed successfully.
            </div>
          )}

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
            ) : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Employee Management (Admin Only) ────────────────────────────────────────
function EmployeeManagement() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.auth.createEmployee.useMutation({
    onSuccess: (data) => {
      setSuccess(`Account created (ID: ${data.openId.slice(0, 20)}...)`);
      setError(null);
      setName(""); setEmail(""); setPassword(""); setRole("user");
    },
    onError: (err) => { setError(err.message); setSuccess(null); },
  });

  if (user?.role !== "admin") {
    return (
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <p>Only administrators can manage employee accounts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    createMutation.mutate({ name, email, password, role });
  };

  return (
    <div className="space-y-6 w-full max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <UserPlus className="w-5 h-5 text-amber-500 shrink-0" />
            Create Employee Account
          </CardTitle>
          <CardDescription>
            Add a new team member. They can log in immediately with the provided credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emp-name">Full Name</Label>
              <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ahmed Al-Rashidi" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emp-email">Email Address</Label>
              <Input id="emp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@company.com" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emp-password">Temporary Password</Label>
                <div className="relative">
                  <Input
                    id="emp-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    autoComplete="off"
                    required
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
                  <SelectTrigger id="emp-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-md p-3">
                <CheckCircle className="w-4 h-4 shrink-0" />{success}
              </div>
            )}

            <Button type="submit" disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Create Account</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-muted-foreground" />
            Role Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead className="hidden sm:table-cell">Can Create Employees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell><Badge variant="default" className="bg-amber-500 hover:bg-amber-500">Admin</Badge></TableCell>
                  <TableCell className="text-sm">Full portal access + settings</TableCell>
                  <TableCell className="text-sm text-green-600 hidden sm:table-cell">Yes</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><Badge variant="secondary">Employee</Badge></TableCell>
                  <TableCell className="text-sm">Portal access (no admin settings)</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">No</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Permissions Tab (Admin Only) ─────────────────────────────────────────────
function PermissionsManager() {
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);

  const { data: users, isLoading: usersLoading } = trpc.auth.listUsers.useQuery();
  const { data: moduleAccess, refetch: refetchAccess } = trpc.modules.getUserModuleAccess.useQuery(
    { userId: selectedUserId! },
    { enabled: selectedUserId !== null }
  );

  const setAccessMutation = trpc.modules.setUserModuleAccess.useMutation({
    onSuccess: () => {
      refetchAccess();
      toast.success("Module permissions saved.");
    },
    onError: (err) => toast.error(err.message),
  });

  if (currentUser?.role !== "admin") {
    return (
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <p>Only administrators can manage permissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getModuleGranted = (moduleKey: string): boolean => {
    if (!moduleAccess) return false;
    const row = moduleAccess.find((r) => r.moduleKey === moduleKey);
    return row?.granted ?? false;
  };

  const handleToggle = (userId: number, moduleKey: string, granted: boolean) => {
    setAccessMutation.mutate({ userId, moduleKey, granted });
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  return (
    <div className="space-y-4 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
            Module Access Permissions
          </CardTitle>
          <CardDescription>
            Control which portal modules each employee can access. Admins always have full access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
            </div>
          ) : !users?.length ? (
            <p className="text-muted-foreground text-sm py-4">No users found.</p>
          ) : (
            <div className="space-y-2">
              {users.filter(u => u.id !== currentUser?.id).map((u) => (
                <div key={u.id} className="border border-border rounded-lg overflow-hidden">
                  {/* User row header */}
                  <button
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => handleSelectUser(u.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-amber-500 text-xs font-bold">
                          {(u.name ?? u.email ?? "?").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name ?? "Unnamed"}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-amber-500 hover:bg-amber-500 text-xs" : "text-xs"}>
                        {u.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                      {expandedUser === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded module toggles */}
                  {expandedUser === u.id && (
                    <div className="border-t border-border bg-muted/20 p-3 sm:p-4">
                      {u.role === "admin" ? (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          Admin users have full access to all modules.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {PORTAL_MODULES.map((mod) => (
                            <div key={mod.key} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50">
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{mod.label}</p>
                                <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                              </div>
                              <Switch
                                checked={getModuleGranted(mod.key)}
                                onCheckedChange={(checked) => handleToggle(u.id, mod.key, checked)}
                                disabled={setAccessMutation.isPending}
                                className="shrink-0"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortalSettings() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Manage your password and, if you are an admin, your team accounts and permissions.
        </p>
      </div>

      <Tabs defaultValue="password">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="password" className="gap-1.5 text-xs sm:text-sm">
            <KeyRound className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Change </span>Password
          </TabsTrigger>
          {user?.role === "admin" && (
            <>
              <TabsTrigger value="employees" className="gap-1.5 text-xs sm:text-sm">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Employee </span>Accounts
              </TabsTrigger>
              <TabsTrigger value="permissions" className="gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Permissions
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>

        {user?.role === "admin" && (
          <>
            <TabsContent value="employees" className="mt-6">
              <EmployeeManagement />
            </TabsContent>
            <TabsContent value="permissions" className="mt-6">
              <PermissionsManager />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
