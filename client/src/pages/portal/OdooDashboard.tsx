/**
 * OdooDashboard — Live Odoo Integration Portal Page
 * Covers: Purchase, Accounting, Inventory, CRM, Project
 * All data sourced live from goldenteam.odoo.com via tRPC → XML-RPC
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PortalLayout from "@/components/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Receipt, Package, Users, FolderKanban,
  RefreshCw, ExternalLink, Search, TrendingUp,
  AlertCircle, CheckCircle2, Clock, XCircle,
  Building2, Phone, Mail, MapPin, BarChart3,
  Wifi, WifiOff, Sparkles, Activity,
} from "lucide-react";


// ── Types ──────────────────────────────────────────────────────────────────────
type OdooTab = "overview" | "purchase" | "accounting" | "inventory" | "crm" | "project";

// ── Helpers ────────────────────────────────────────────────────────────────────
function stateColor(state: string): string {
  const s = (state ?? "").toLowerCase();
  if (["done", "posted", "paid", "sale", "purchase"].includes(s)) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (["draft", "sent", "quotation"].includes(s)) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (["cancel", "cancelled", "refused"].includes(s)) return "bg-red-500/15 text-red-400 border-red-500/30";
  if (["waiting", "confirmed", "in_progress"].includes(s)) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-white/10 text-white/60 border-white/20";
}

function StateIcon({ state }: { state: string }) {
  const s = (state ?? "").toLowerCase();
  if (["done", "posted", "paid", "sale", "purchase"].includes(s)) return <CheckCircle2 className="w-3 h-3" />;
  if (["cancel", "cancelled", "refused"].includes(s)) return <XCircle className="w-3 h-3" />;
  if (["waiting", "confirmed", "in_progress"].includes(s)) return <Clock className="w-3 h-3" />;
  return <AlertCircle className="w-3 h-3" />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-white/30">
      <Building2 className="w-12 h-12 mb-4 opacity-30" />
      <p className="text-sm">{message}</p>
      <p className="text-xs mt-1 opacity-60">Data will appear here once added in Odoo</p>
    </div>
  );
}

function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, title, value, color, loading,
}: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            {loading ? (
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse mb-1" />
            ) : (
              <div className="text-xl font-bold text-white">{value}</div>
            )}
            <div className="text-xs text-white/50">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tab components ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading, refetch } = trpc.odoo.getStats.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Odoo Integration Overview</h2>
          <p className="text-sm text-white/50 mt-0.5">
            Live data from{" "}
            <a href="https://goldenteam.odoo.com" target="_blank" rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-1">
              goldenteam.odoo.com <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}
          className="border-white/20 text-white/70 hover:text-white bg-transparent gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={ShoppingCart} title="Purchase Orders" value={stats?.purchaseOrders ?? 0} color="bg-blue-500/20 text-blue-400" loading={isLoading} />
        <KpiCard icon={Receipt} title="Invoices" value={stats?.invoices ?? 0} color="bg-emerald-500/20 text-emerald-400" loading={isLoading} />
        <KpiCard icon={Package} title="Products" value={stats?.products ?? 0} color="bg-purple-500/20 text-purple-400" loading={isLoading} />
        <KpiCard icon={Users} title="Suppliers" value={stats?.suppliers ?? 0} color="bg-amber-500/20 text-amber-400" loading={isLoading} />
        <KpiCard icon={TrendingUp} title="CRM Leads" value={stats?.crmLeads ?? 0} color="bg-pink-500/20 text-pink-400" loading={isLoading} />
        <KpiCard icon={FolderKanban} title="Projects" value={stats?.projects ?? 0} color="bg-cyan-500/20 text-cyan-400" loading={isLoading} />
        <KpiCard icon={BarChart3} title="Tasks" value={stats?.tasks ?? 0} color="bg-orange-500/20 text-orange-400" loading={isLoading} />
        <KpiCard icon={Building2} title="Partners" value={stats?.suppliers ?? 0} color="bg-indigo-500/20 text-indigo-400" loading={isLoading} />
      </div>

      {stats && (
        <div className="text-xs text-white/30 text-right">
          Last synced: {new Date(stats.lastSync).toLocaleString()}
        </div>
      )}

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { module: "Purchase", model: "purchase.order", status: "connected" },
            { module: "Accounting", model: "account.move", status: "connected" },
            { module: "Inventory", model: "product.product", status: "connected" },
            { module: "CRM", model: "crm.lead", status: "connected" },
            { module: "Project", model: "project.project", status: "connected" },
          ].map(({ module, model, status }) => (
            <div key={module} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <div className="text-sm text-white font-medium">{module}</div>
                <div className="text-xs text-white/40">{model}</div>
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs gap-1">
                <CheckCircle2 className="w-3 h-3" /> {status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function PurchaseTab() {
  const { data: orders, isLoading } = trpc.odoo.getPurchaseOrders.useQuery({ limit: 50 });
  const { data: suppliers, isLoading: suppLoading } = trpc.odoo.getSuppliers.useQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Purchase Orders</h2>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Purchase Orders ({orders?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingRows /> : orders?.length === 0 ? (
            <EmptyState message="No purchase orders yet" />
          ) : (
            <div className="space-y-2">
              {orders?.map((order, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{String(order.name ?? "—")}</div>
                      <div className="text-xs text-white/50">
                        {Array.isArray(order.partner_id) ? String(order.partner_id[1]) : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-white/70 text-right">
                      <div>{typeof order.amount_total === "number" ? `SAR ${order.amount_total.toLocaleString()}` : "—"}</div>
                      <div className="text-xs text-white/40">{String(order.date_order ?? "").slice(0, 10)}</div>
                    </div>
                    <Badge className={`text-xs gap-1 border ${stateColor(String(order.state ?? ""))}`}>
                      <StateIcon state={String(order.state ?? "")} />
                      {String(order.state ?? "—")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Suppliers ({suppliers?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {suppLoading ? <LoadingRows count={3} /> : suppliers?.length === 0 ? (
            <EmptyState message="No suppliers yet" />
          ) : (
            <div className="space-y-2">
              {suppliers?.map((s, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                      {String(s.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{String(s.name ?? "—")}</div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {s.email ? <span className="text-xs text-white/40 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{String(s.email as string)}</span> : null}
                        {s.phone ? <span className="text-xs text-white/40 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{String(s.phone as string)}</span> : null}
                      </div>
                    </div>
                  </div>
                  {Array.isArray(s.country_id) && (
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{String(s.country_id[1])}
                    </span>
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

function AccountingTab() {
  const [invoiceType, setInvoiceType] = useState<"all" | "in_invoice" | "out_invoice">("all");
  const { data: invoices, isLoading } = trpc.odoo.getInvoices.useQuery({ type: invoiceType, limit: 50 });
  const { data: payments, isLoading: payLoading } = trpc.odoo.getPayments.useQuery({ limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Accounting</h2>
        <div className="flex gap-2">
          {(["all", "in_invoice", "out_invoice"] as const).map(t => (
            <Button key={t} size="sm" variant={invoiceType === t ? "default" : "outline"}
              onClick={() => setInvoiceType(t)}
              className={invoiceType === t ? "bg-amber-500 text-black" : "border-white/20 text-white/60 bg-transparent"}>
              {t === "all" ? "All" : t === "in_invoice" ? "Vendor Bills" : "Customer Invoices"}
            </Button>
          ))}
        </div>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Invoices ({invoices?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingRows /> : invoices?.length === 0 ? (
            <EmptyState message="No invoices yet" />
          ) : (
            <div className="space-y-2">
              {invoices?.map((inv, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{String(inv.name ?? "—")}</div>
                      <div className="text-xs text-white/50">
                        {Array.isArray(inv.partner_id) ? String(inv.partner_id[1]) : "—"} · {String(inv.invoice_date ?? "").slice(0, 10)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-white">{typeof inv.amount_total === "number" ? `SAR ${inv.amount_total.toLocaleString()}` : "—"}</div>
                      {typeof inv.amount_residual === "number" && inv.amount_residual > 0 && (
                        <div className="text-xs text-red-400">Due: SAR {inv.amount_residual.toLocaleString()}</div>
                      )}
                    </div>
                    <Badge className={`text-xs gap-1 border ${stateColor(String(inv.state ?? ""))}`}>
                      <StateIcon state={String(inv.state ?? "")} />
                      {String(inv.state ?? "—")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Recent Payments ({payments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {payLoading ? <LoadingRows count={3} /> : payments?.length === 0 ? (
            <EmptyState message="No payments yet" />
          ) : (
            <div className="space-y-2">
              {payments?.map((p, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-sm text-white">{String(p.name ?? "—")}</div>
                    <div className="text-xs text-white/40">{String(p.date ?? "").slice(0, 10)}</div>
                  </div>
                  <div className="text-sm text-white font-medium">
                    {typeof p.amount === "number" ? `SAR ${p.amount.toLocaleString()}` : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InventoryTab() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = trpc.odoo.getProducts.useQuery({ limit: 100 });
  const { data: pickings, isLoading: pickLoading } = trpc.odoo.getStockPickings.useQuery({ limit: 20 });

  const filtered = products?.filter((p) =>
    !search || String(p.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Inventory</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..." className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9" />
        </div>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Products ({filtered?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingRows /> : filtered?.length === 0 ? (
            <EmptyState message={search ? "No products match your search" : "No products yet"} />
          ) : (
            <div className="space-y-2">
              {filtered?.map((p, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Package className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{String(p.name ?? "—")}</div>
                      <div className="text-xs text-white/40">
                        {p.default_code ? `[${String(p.default_code as string)}]` : ""}{" "}
                        {Array.isArray(p.categ_id) ? String((p.categ_id as unknown[])[1]) : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {typeof p.qty_available === "number" ? `${p.qty_available} in stock` : "—"}
                    </div>
                    <div className="text-xs text-white/40">
                      {typeof p.list_price === "number" ? `SAR ${p.list_price.toLocaleString()}` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Stock Movements ({pickings?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {pickLoading ? <LoadingRows count={3} /> : pickings?.length === 0 ? (
            <EmptyState message="No stock movements yet" />
          ) : (
            <div className="space-y-2">
              {pickings?.map((pick, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <div className="text-sm text-white">{String(pick.name ?? "—")}</div>
                    <div className="text-xs text-white/40">{String(pick.scheduled_date ?? "").slice(0, 10)}</div>
                  </div>
                  <Badge className={`text-xs gap-1 border ${stateColor(String(pick.state ?? ""))}`}>
                    <StateIcon state={String(pick.state ?? "")} />
                    {String(pick.state ?? "—")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CrmTab() {
  const { data: leads, isLoading } = trpc.odoo.getCrmLeads.useQuery({ limit: 50 });
  const { data: stages } = trpc.odoo.getCrmStages.useQuery();

  const totalRevenue = leads?.reduce((sum: number, l) =>
    sum + (typeof l.expected_revenue === "number" ? l.expected_revenue : 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">CRM — Leads & Opportunities</h2>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-400">SAR {totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-white/40">Total Expected Revenue</div>
        </div>
      </div>

      {stages && stages.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {stages.map((s, i: number) => {
            const count = leads?.filter((l) =>
              Array.isArray(l.stage_id) && l.stage_id[0] === s.id
            ).length ?? 0;
            return (
              <div key={i} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                {String(s.name ?? "—")} <span className="text-white/30">({count})</span>
              </div>
            );
          })}
        </div>
      )}

      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-white/70">Leads & Opportunities ({leads?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingRows /> : leads?.length === 0 ? (
            <EmptyState message="No CRM leads yet" />
          ) : (
            <div className="space-y-2">
              {leads?.map((lead, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{String(lead.name ?? "—")}</div>
                      <div className="text-xs text-white/40">
                        {Array.isArray(lead.stage_id) ? String(lead.stage_id[1]) : "—"} ·{" "}
                        {typeof lead.probability === "number" ? `${lead.probability}% probability` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-white">
                      {typeof lead.expected_revenue === "number" ? `SAR ${lead.expected_revenue.toLocaleString()}` : "—"}
                    </div>
                    {lead.date_deadline ? (
                      <div className="text-xs text-white/40">{String(lead.date_deadline as string).slice(0, 10)}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectTab() {
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const { data: projects, isLoading } = trpc.odoo.getProjects.useQuery({ limit: 50 });
  const { data: tasks, isLoading: taskLoading } = trpc.odoo.getProjectTasks.useQuery({
    projectId: selectedProject,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Projects & Tasks</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70">Projects ({projects?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingRows count={3} /> : projects?.length === 0 ? (
              <EmptyState message="No projects yet" />
            ) : (
              <div className="space-y-2">
                {projects?.map((proj, i: number) => (
                  <button key={i} onClick={() => setSelectedProject(typeof proj.id === "number" ? proj.id : undefined)}
                    className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-colors ${selectedProject === (proj.id as number) ? "bg-amber-500/20 border border-amber-500/30" : "bg-white/5 hover:bg-white/8"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{String(proj.name ?? "—")}</div>
                        <div className="text-xs text-white/40">
                          {typeof proj.task_count === "number" ? `${proj.task_count} tasks` : ""}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70">
              {selectedProject ? "Project Tasks" : "All Tasks"} ({tasks?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskLoading ? <LoadingRows count={3} /> : tasks?.length === 0 ? (
              <EmptyState message="No tasks yet" />
            ) : (
              <div className="space-y-2">
                {tasks?.map((task, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="text-sm text-white">{String(task.name ?? "—")}</div>
                      <div className="text-xs text-white/40">
                        {Array.isArray(task.stage_id) ? String(task.stage_id[1]) : "—"}
                        {task.date_deadline ? ` · Due ${String(task.date_deadline).slice(0, 10)}` : ""}
                      </div>
                    </div>
                    {String(task.priority ?? "0") === "1" && (
                      <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-xs">Urgent</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const TABS: { id: OdooTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "accounting", label: "Accounting", icon: Receipt },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "crm", label: "CRM", icon: TrendingUp },
  { id: "project", label: "Projects", icon: FolderKanban },
];

export default function OdooDashboard() {
  const [activeTab, setActiveTab] = useState<OdooTab>("overview");
  const [, navigate] = useLocation();

  // ── Connection health — polls every 60 s ──────────────────────────────────
  const { data: health } = trpc.odoo.getHealth.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: false,
  });

  const isConnected = health?.status === "connected";
  const isOffline   = health?.status === "offline";
  const isDegraded  = health?.status === "degraded";

  return (
    <PortalLayout title="Odoo Integration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Odoo Integration</h1>
            <p className="text-sm text-white/50">Live sync with goldenteam1.odoo.com</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Live connection health badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              !health
                ? "text-white/40 border-white/20"
                : isConnected
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : isOffline
                    ? "text-red-400 border-red-500/30 bg-red-500/10"
                    : "text-amber-400 border-amber-500/30 bg-amber-500/10"
            }`}>
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {!health ? "Checking..." : isConnected ? "Odoo Connected" : isOffline ? "Odoo Offline" : "Odoo Degraded"}
            </span>
            <Button
              onClick={() => navigate("/portal/odoo/ai-entry")}
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-[#05080F] font-semibold gap-2 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" /> NEO AI Entry
            </Button>
            <Button
              onClick={() => navigate("/portal/odoo/audit-log")}
              variant="outline"
              size="sm"
              className="border-white/20 text-white/60 hover:text-amber-400 hover:border-amber-400/40 bg-transparent gap-2">
              <Activity className="w-3.5 h-3.5" /> Audit Log
            </Button>
            <a href="https://goldenteam1.odoo.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"
                className="border-white/20 text-white/60 hover:text-white bg-transparent gap-2">
                <ExternalLink className="w-3.5 h-3.5" /> Open Odoo
              </Button>
            </a>
          </div>
        </div>

        {/* Stale data warning banners */}
        {isOffline && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Odoo connection is currently unavailable. Data shown may be stale or cached. The system will reconnect automatically.</span>
          </div>
        )}
        {isDegraded && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <Wifi className="w-4 h-4 shrink-0" />
            <span>Odoo connection is degraded. Some data may be served from cache. Retrying automatically.</span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === id
                  ? "bg-amber-500 text-[#05080F]"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "purchase" && <PurchaseTab />}
        {activeTab === "accounting" && <AccountingTab />}
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "crm" && <CrmTab />}
        {activeTab === "project" && <ProjectTab />}
      </div>
    </PortalLayout>
  );
}
