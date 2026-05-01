/**
 * server/odoo/types.ts
 *
 * Shared types for Odoo records. These are the response shapes the rest of
 * the platform consumes — keep them small, documented, and aligned with the
 * fields actually requested in the search_read calls.
 *
 * NOT a complete Odoo schema mirror. Only the fields the platform actually
 * reads. Adding a field to a search_read in modules/ requires adding it here.
 */

/** Odoo Many2one fields come back as `[id, display_name]` tuples */
export type Many2one = [number, string] | false;

/** Odoo Many2many / One2many in read responses are arrays of IDs */
export type X2Many = number[];

// ─── Purchase ────────────────────────────────────────────────────────────────

export interface PurchaseOrder {
  id: number;
  name: string;
  partner_id: Many2one;
  date_order: string; // ISO 8601
  date_approve: string | false;
  amount_total: number;
  amount_untaxed: number;
  state: "draft" | "sent" | "to approve" | "purchase" | "done" | "cancel";
  currency_id: Many2one;
  user_id: Many2one;
  company_id: Many2one;
  invoice_status: "no" | "to invoice" | "invoiced";
  notes: string | false;
}

export interface PurchaseOrderLine {
  id: number;
  order_id: Many2one;
  product_id: Many2one;
  name: string;
  product_qty: number;
  qty_received: number;
  qty_invoiced: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  taxes_id: X2Many;
  date_planned: string | false;
}

export interface Supplier {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  mobile: string | false;
  street: string | false;
  city: string | false;
  country_id: Many2one;
  supplier_rank: number;
  customer_rank: number;
  vat: string | false;
  website: string | false;
  comment: string | false;
}

// ─── Accounting ──────────────────────────────────────────────────────────────

export interface Invoice {
  id: number;
  name: string;
  partner_id: Many2one;
  invoice_date: string | false;
  invoice_date_due: string | false;
  amount_total: number;
  amount_residual: number;
  state: "draft" | "posted" | "cancel";
  move_type: "out_invoice" | "out_refund" | "in_invoice" | "in_refund" | "out_receipt" | "in_receipt" | "entry";
  currency_id: Many2one;
  payment_state: "not_paid" | "in_payment" | "paid" | "partial" | "reversed" | "invoicing_legacy";
  ref: string | false;
  narration: string | false;
}

export interface Payment {
  id: number;
  name: string;
  partner_id: Many2one;
  amount: number;
  date: string;
  state: "draft" | "posted" | "sent" | "reconciled" | "cancelled";
  payment_type: "inbound" | "outbound";
  currency_id: Many2one;
  journal_id: Many2one;
  memo: string | false;
}

export interface Account {
  id: number;
  name: string;
  code: string;
  account_type: string; // asset_receivable, asset_cash, etc. (16+ values)
  currency_id: Many2one;
  deprecated: boolean;
  company_id: Many2one;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  name: string;
  default_code: string | false;
  barcode: string | false;
  qty_available: number;
  virtual_available: number;
  incoming_qty: number;
  outgoing_qty: number;
  list_price: number;
  standard_price: number;
  categ_id: Many2one;
  uom_id: Many2one;
  type: "consu" | "service" | "product";
  active: boolean;
}

export interface StockPicking {
  id: number;
  name: string;
  partner_id: Many2one;
  scheduled_date: string;
  date_done: string | false;
  state: "draft" | "waiting" | "confirmed" | "assigned" | "done" | "cancel";
  picking_type_id: Many2one;
  origin: string | false;
  location_id: Many2one;
  location_dest_id: Many2one;
  move_type: "direct" | "one";
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  lot_stock_id: Many2one;
  company_id: Many2one;
}

// ─── CRM ─────────────────────────────────────────────────────────────────────

export interface CrmLead {
  id: number;
  name: string;
  partner_id: Many2one;
  stage_id: Many2one;
  expected_revenue: number;
  prorated_revenue: number;
  probability: number;
  user_id: Many2one;
  team_id: Many2one;
  date_deadline: string | false;
  date_closed: string | false;
  priority: "0" | "1" | "2" | "3";
  type: "lead" | "opportunity";
  description: string | false;
  phone: string | false;
  email_from: string | false;
}

export interface CrmStage {
  id: number;
  name: string;
  sequence: number;
  probability: number;
  is_won: boolean;
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: number;
  name: string;
  partner_id: Many2one;
  date_start: string | false;
  date: string | false;
  user_id: Many2one;
  task_count: number;
  description: string | false;
  privacy_visibility: "followers" | "employees" | "portal";
  last_update_status: string | false;
  tag_ids: X2Many;
}

export interface ProjectTask {
  id: number;
  name: string;
  project_id: Many2one;
  user_ids: X2Many;
  stage_id: Many2one;
  date_deadline: string | false;
  date_assign: string | false;
  priority: "0" | "1";
  description: string | false;
  tag_ids: X2Many;
  kanban_state: "normal" | "done" | "blocked";
}

// ─── Partners ────────────────────────────────────────────────────────────────

export interface Partner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  is_company: boolean;
  street: string | false;
  city: string | false;
  country_id: Many2one;
  vat: string | false;
}

// ─── Journal Entries ─────────────────────────────────────────────────────────

export interface JournalEntryLine {
  id: number;
  name: string;
  account_id: Many2one;
  debit: number;
  credit: number;
  date: string;
  move_id: Many2one;
}

// ─── Stats / Health ──────────────────────────────────────────────────────────

export interface OdooStats {
  purchaseOrders: number;
  invoices: number;
  products: number;
  crmLeads: number;
  projects: number;
  tasks: number;
  suppliers: number;
  lastSync: string;
}

/** Returned alongside data in routers when callers need to know if Odoo was reachable. */
export interface OdooFreshness {
  /** True when the data was fetched live from Odoo within this request. */
  fresh: boolean;
  /** True when the circuit breaker is open and the call returned a fallback. */
  stale: boolean;
  /** ISO timestamp of when this data was actually fetched. */
  fetchedAt: string;
}
