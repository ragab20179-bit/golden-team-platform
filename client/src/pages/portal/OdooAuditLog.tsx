/**
 * NEO Odoo AI Entry Audit Log
 * Full audit trail of every AI-driven Odoo action.
 * Design: Prestige Dark — deep navy/charcoal, gold accents.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft, RefreshCw, Trash2, Eye, CheckCircle2, Download,
  XCircle, Clock, Ban, Bot, Cpu, BarChart3, Activity,
  Search, Filter, ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AuditStatus = "success" | "failed" | "pending" | "rejected";
type AuditSource = "builtin" | "neo_bridge";

interface AuditEntry {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  userPrompt: string;
  operation: string;
  odooModel: string | null;
  odooRecordId: number | null;
  odooRecordName: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  parsedPayload: Record<string, unknown> | null;
  odooResponse: Record<string, unknown> | null;
  source: AuditSource;
  executionMs: number | null;
  createdAt: Date;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AuditStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  success:  { label: "Success",  icon: <CheckCircle2 className="w-3 h-3" />, cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  failed:   { label: "Failed",   icon: <XCircle      className="w-3 h-3" />, cls: "bg-red-500/20 text-red-400 border-red-500/30" },
  pending:  { label: "Pending",  icon: <Clock        className="w-3 h-3" />, cls: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  rejected: { label: "Rejected", icon: <Ban          className="w-3 h-3" />, cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

const SOURCE_CONFIG: Record<AuditSource, { label: string; icon: React.ReactNode; cls: string }> = {
  builtin:    { label: "Built-in LLM", icon: <Bot  className="w-3 h-3" />, cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  neo_bridge: { label: "NEO Bridge",   icon: <Cpu  className="w-3 h-3" />, cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

function formatOp(op: string): string {
  return op.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleString("en-SA", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; accent: string;
}) {
  return (
    <div className={`rounded-xl border bg-[#0A0F1E]/80 p-5 flex items-start gap-4 ${accent}`}>
      <div className={`mt-0.5 p-2 rounded-lg ${accent.replace("border-", "bg-").replace("/30", "/20")}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white/50 text-xs tracking-wide uppercase mb-1">{label}</p>
        <p className="text-white font-bold text-2xl leading-none">{value}</p>
        {sub && <p className="text-white/40 text-xs mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Detail Dialog ─────────────────────────────────────────────────────────────
function EntryDetailDialog({ entry, onClose }: { entry: AuditEntry | null; onClose: () => void }) {
  if (!entry) return null;
  const status = STATUS_CONFIG[entry.status];
  const source = SOURCE_CONFIG[entry.source];

  return (
    <Dialog open={!!entry} onOpenChange={onClose}>
      <DialogContent className="bg-[#0A0F1E] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-400 font-display flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Audit Entry #{entry.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Status + Source row */}
          <div className="flex flex-wrap gap-2">
            <Badge className={`flex items-center gap-1 border ${status.cls}`}>
              {status.icon} {status.label}
            </Badge>
            <Badge className={`flex items-center gap-1 border ${source.cls}`}>
              {source.icon} {source.label}
            </Badge>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Operation",   value: formatOp(entry.operation) },
              { label: "User",        value: entry.userName ?? entry.userEmail ?? `ID ${entry.userId}` },
              { label: "Record",      value: entry.odooRecordName ?? (entry.odooRecordId ? `ID ${entry.odooRecordId}` : "—") },
              { label: "Execution",   value: formatMs(entry.executionMs) },
              { label: "Timestamp",   value: formatDate(entry.createdAt) },
              { label: "Odoo Model",  value: entry.odooModel ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-lg p-3">
                <p className="text-white/40 text-xs mb-1">{label}</p>
                <p className="text-white font-medium">{value}</p>
              </div>
            ))}
          </div>

          {/* User Prompt */}
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-white/40 text-xs mb-2">User Prompt</p>
            <p className="text-white/80 leading-relaxed">{entry.userPrompt}</p>
          </div>

          {/* Error message */}
          {entry.errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-xs mb-1 font-semibold">Error</p>
              <p className="text-red-300 text-xs font-mono leading-relaxed">{entry.errorMessage}</p>
            </div>
          )}

          {/* Parsed payload */}
          {entry.parsedPayload && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-2">Parsed Payload</p>
              <pre className="text-white/70 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.parsedPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Odoo response */}
          {entry.odooResponse && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/40 text-xs mb-2">Odoo Response</p>
              <pre className="text-white/70 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(entry.odooResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

export default function OdooAuditLog() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [opFilter, setOpFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sinceHours, setSinceHours] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const isAdmin = user?.role === "admin";

  // Build query input
  const queryInput = useMemo(() => ({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
    status: statusFilter !== "all" ? (statusFilter as AuditStatus) : undefined,
    source: sourceFilter !== "all" ? (sourceFilter as AuditSource) : undefined,
    operation: opFilter !== "all" ? opFilter : undefined,
    sinceHours: sinceHours !== "all" ? parseInt(sinceHours) : undefined,
  }), [statusFilter, sourceFilter, opFilter, sinceHours, page]);

  const { data, isLoading, refetch } = trpc.odoo.getAiEntries.useQuery(queryInput, {
    refetchInterval: 30_000,
  });

  const { data: stats, refetch: refetchStats } = trpc.odoo.getAiEntryStats.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const exportMutation = trpc.odoo.exportAiEntries.useMutation({
    onSuccess: (res) => {
      if (res.count === 0) { toast.info("No entries to export."); return; }
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `odoo-ai-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} entries to CSV.`);
    },
    onError: (err) => toast.error(err.message),
  });

  const clearMutation = trpc.odoo.clearAiEntries.useMutation({
    onSuccess: (res) => {
      toast.success(`Audit log cleared — ${res.deleted} entries deleted.`);
      refetch();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  // Client-side search filter
  const entries: AuditEntry[] = useMemo(() => {
    const raw = ((data?.entries ?? []) as unknown[]).map((e) => {
      const entry = e as Record<string, unknown>;
      return {
        ...entry,
        parsedPayload: (entry.parsedPayload as Record<string, unknown> | null) ?? null,
        odooResponse: (entry.odooResponse as Record<string, unknown> | null) ?? null,
      } as AuditEntry;
    });
    if (!searchTerm.trim()) return raw;
    const q = searchTerm.toLowerCase();
    return raw.filter(e =>
      e.userPrompt.toLowerCase().includes(q) ||
      e.operation.toLowerCase().includes(q) ||
      (e.userName ?? "").toLowerCase().includes(q) ||
      (e.odooRecordName ?? "").toLowerCase().includes(q)
    );
  }, [data?.entries, searchTerm]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Unique operations for filter dropdown
  const uniqueOps = useMemo(() => {
    const ops = new Set((data?.entries ?? []).map((e) => (e as AuditEntry).operation));
    return Array.from(ops).sort();
  }, [data?.entries]);

  const successRate = stats && stats.total > 0
    ? Math.round((stats.success / stats.total) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#05080F] text-white font-sans">
      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-[#0A0F1E]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/portal/odoo")}
              className="text-white/60 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              <h1 className="font-display font-bold text-white">NEO AI Audit Log</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { refetch(); refetchStats(); }}
              className="text-white/60 hover:text-amber-400"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMutation.mutate({ status: statusFilter as "all"|"success"|"failed"|"pending", source: sourceFilter as "all"|"direct"|"bridge", operation: opFilter !== "all" ? opFilter : undefined })}
              disabled={exportMutation.isPending}
              className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10 bg-transparent text-xs"
            >
              <Download className="w-3 h-3 mr-1" /> Export CSV
            </Button>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── KPI Cards ── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Entries"
              value={stats.total}
              sub={`${stats.last24hCount} in last 24h`}
              icon={<BarChart3 className="w-5 h-5 text-amber-400" />}
              accent="border-amber-400/20"
            />
            <KpiCard
              label="Success Rate"
              value={successRate !== null ? `${successRate}%` : "—"}
              sub={`${stats.success} succeeded`}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              accent="border-emerald-400/20"
            />
            <KpiCard
              label="Failed"
              value={stats.failed}
              sub={`${stats.rejected} rejected`}
              icon={<XCircle className="w-5 h-5 text-red-400" />}
              accent="border-red-400/20"
            />
            <KpiCard
              label="Avg Execution"
              value={formatMs(stats.avgExecutionMs)}
              sub={`${stats.bridgeCount} via NEO Bridge`}
              icon={<Activity className="w-5 h-5 text-blue-400" />}
              accent="border-blue-400/20"
            />
          </div>
        )}

        {/* ── Top Operations ── */}
        {stats && stats.topOperations.length > 0 && (
          <div className="bg-[#0A0F1E]/80 border border-white/10 rounded-xl p-5">
            <h3 className="text-white/60 text-xs tracking-widest uppercase mb-4">Top Operations</h3>
            <div className="flex flex-wrap gap-2">
              {stats.topOperations.map(({ operation, count }) => (
                <div
                  key={operation}
                  className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs cursor-pointer hover:border-amber-400/40 transition-colors"
                  onClick={() => { setOpFilter(operation); setPage(0); }}
                >
                  <span className="text-white/70">{formatOp(operation)}</span>
                  <span className="bg-amber-500/20 text-amber-400 rounded-full px-1.5 py-0.5 font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="bg-[#0A0F1E]/80 border border-white/10 rounded-xl p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Search prompts, operations, users..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-amber-400/40"
              />
            </div>

            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                <Filter className="w-3 h-3 mr-1 text-white/40" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v); setPage(0); }}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="builtin">Built-in LLM</SelectItem>
                <SelectItem value="neo_bridge">NEO Bridge</SelectItem>
              </SelectContent>
            </Select>

            <Select value={opFilter} onValueChange={v => { setOpFilter(v); setPage(0); }}>
              <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                <SelectItem value="all">All Operations</SelectItem>
                {uniqueOps.map(op => (
                  <SelectItem key={op} value={op}>{formatOp(op)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sinceHours} onValueChange={v => { setSinceHours(v); setPage(0); }}>
              <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F1E] border-white/10 text-white">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24">Last 24h</SelectItem>
                <SelectItem value="168">Last 7 days</SelectItem>
                <SelectItem value="720">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || sourceFilter !== "all" || opFilter !== "all" || sinceHours !== "all" || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStatusFilter("all"); setSourceFilter("all"); setOpFilter("all"); setSinceHours("all"); setSearchTerm(""); setPage(0); }}
                className="text-white/40 hover:text-white text-xs"
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-[#0A0F1E]/80 border border-white/10 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading audit log...
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/30">
              <Activity className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No audit entries found</p>
              <p className="text-xs mt-1">Execute an AI data entry to see it logged here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs">ID</TableHead>
                  <TableHead className="text-white/40 text-xs">Time</TableHead>
                  <TableHead className="text-white/40 text-xs">User</TableHead>
                  <TableHead className="text-white/40 text-xs">Operation</TableHead>
                  <TableHead className="text-white/40 text-xs">Record</TableHead>
                  <TableHead className="text-white/40 text-xs">Status</TableHead>
                  <TableHead className="text-white/40 text-xs">Source</TableHead>
                  <TableHead className="text-white/40 text-xs">Time</TableHead>
                  <TableHead className="text-white/40 text-xs w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const status = STATUS_CONFIG[entry.status];
                  const source = SOURCE_CONFIG[entry.source];
                  return (
                    <TableRow
                      key={entry.id}
                      className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <TableCell className="text-white/40 text-xs font-mono">#{entry.id}</TableCell>
                      <TableCell className="text-white/60 text-xs whitespace-nowrap">
                        {formatDate(entry.createdAt)}
                      </TableCell>
                      <TableCell className="text-white/70 text-xs">
                        {entry.userName ?? entry.userEmail ?? `User ${entry.userId}`}
                      </TableCell>
                      <TableCell>
                        <span className="text-amber-400/80 text-xs font-medium">
                          {formatOp(entry.operation)}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/60 text-xs">
                        {entry.odooRecordName ?? (entry.odooRecordId ? `#${entry.odooRecordId}` : "—")}
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 border text-xs w-fit ${status.cls}`}>
                          {status.icon} {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`flex items-center gap-1 border text-xs w-fit ${source.cls}`}>
                          {source.icon} {source.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/40 text-xs font-mono">
                        {formatMs(entry.executionMs)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white/30 hover:text-amber-400"
                          onClick={e => { e.stopPropagation(); setSelectedEntry(entry); }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <p className="text-white/40 text-xs">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="h-7 w-7 p-0 text-white/40 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-white/40 text-xs">{page + 1} / {totalPages}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="h-7 w-7 p-0 text-white/40 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Dialog ── */}
      <EntryDetailDialog entry={selectedEntry} onClose={() => setSelectedEntry(null)} />

      {/* ── Clear Confirm Dialog ── */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent className="bg-[#0A0F1E] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Clear All Audit Entries?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently delete all {stats?.total ?? 0} audit log entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white border-0"
              onClick={() => clearMutation.mutate()}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
