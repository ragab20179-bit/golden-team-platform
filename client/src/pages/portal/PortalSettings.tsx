/**
 * Portal Settings Page
 * - Change Password (all users)
 * - Employee Management: create / list employees (admin only)
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, UserPlus, Users, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";

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
    if (next !== confirm) {
      setError("New passwords do not match");
      return;
    }
    if (next.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    mutation.mutate({ currentPassword: current, newPassword: next });
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-500" />
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
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Employee Management (Admin Only) ────────────────────────────────────────
function EmployeeManagement() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  // Get all users from the DB via a simple me query workaround
  // We use the existing auth.me to confirm role, and createEmployee mutation
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.auth.createEmployee.useMutation({
    onSuccess: (data) => {
      setSuccess(`Employee account created successfully (ID: ${data.openId.slice(0, 20)}...)`);
      setError(null);
      setName(""); setEmail(""); setPassword(""); setRole("user");
    },
    onError: (err) => {
      setError(err.message);
      setSuccess(null);
    },
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
    setError(null);
    setSuccess(null);
    createMutation.mutate({ name, email, password, role });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Create Employee Account
          </CardTitle>
          <CardDescription>
            Add a new team member. They can log in immediately with the provided credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input
                  id="emp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ahmed Al-Rashidi"
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="emp-email">Email Address</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-password">Temporary Password</Label>
                <div className="relative">
                  <Input
                    id="emp-password"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "user" | "admin")}>
                  <SelectTrigger id="emp-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                {success}
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

      {/* Quick reference table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-muted-foreground" />
            Role Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Can Create Employees</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-500">Admin</Badge>
                </TableCell>
                <TableCell className="text-sm">Full portal access + settings</TableCell>
                <TableCell className="text-sm text-green-600">Yes</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">Employee</Badge>
                </TableCell>
                <TableCell className="text-sm">Portal access (no admin settings)</TableCell>
                <TableCell className="text-sm text-muted-foreground">No</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PortalSettings() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your password and, if you are an admin, your team accounts.
        </p>
      </div>

      <Tabs defaultValue="password">
        <TabsList>
          <TabsTrigger value="password" className="gap-2">
            <KeyRound className="w-4 h-4" />
            Change Password
          </TabsTrigger>
          {user?.role === "admin" && (
            <TabsTrigger value="employees" className="gap-2">
              <Users className="w-4 h-4" />
              Employee Management
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="password" className="mt-6">
          <ChangePasswordForm />
        </TabsContent>

        {user?.role === "admin" && (
          <TabsContent value="employees" className="mt-6">
            <EmployeeManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
