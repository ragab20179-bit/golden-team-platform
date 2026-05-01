/**
 * server/odoo/index.ts
 *
 * Barrel — the only file consumed by `server/routers/odoo.ts`.
 * All other files in this directory are implementation details.
 *
 * The existing `server/odoo.ts` becomes a one-line re-export:
 *
 *   export * from "./odoo/index";
 *
 * so that imports written as `from "../odoo"` continue to resolve, both
 * when the resolver picks up `server/odoo.ts` (current) and when we
 * eventually delete it in favor of the directory (PR #3).
 */

// ─── Generic helpers (use these for ad-hoc queries from new code) ────────────
export { odooSearchRead, odooRead, odooSearchCount, odooCreate, odooWrite, odooAction } from "./helpers";

// ─── Module-specific typed helpers (the existing public surface) ─────────────
export {
  getPurchaseOrders,
  getPurchaseOrderLines,
  getSuppliers,
} from "./modules/purchase";

export {
  getInvoices,
  getPayments,
  getChartOfAccounts,
  getJournalEntries,
} from "./modules/accounting";

export {
  getProducts,
  getStockPickings,
  getWarehouses,
  searchProducts,
} from "./modules/inventory";

export {
  getCrmLeads,
  getCrmStages,
  createCrmLead,
} from "./modules/crm";

export {
  getProjects,
  getProjectTasks,
  createProject,
  createTask,
} from "./modules/project";

export { getPartners } from "./modules/partners";

export { getOdooStats } from "./modules/stats";

// ─── Observability — for /admin/health and AI module hints ───────────────────
export { getOdooBreakerState } from "./breaker";
export type { OdooBreakerSnapshot, BreakerState } from "./breaker";

// ─── Errors ──────────────────────────────────────────────────────────────────
export { OdooError } from "./client";

// ─── Types (for routers and AI modules) ──────────────────────────────────────
export type {
  Many2one, X2Many,
  PurchaseOrder, PurchaseOrderLine, Supplier,
  Invoice, Payment, Account, JournalEntryLine,
  Product, StockPicking, Warehouse,
  CrmLead, CrmStage,
  Project, ProjectTask,
  Partner,
  OdooStats, OdooFreshness,
} from "./types";
