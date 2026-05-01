/**
 * server/odoo/modules/purchase.ts
 *
 * Purchase domain — POs, lines, and supplier records.
 * Field lists match the existing server/odoo.ts exactly so the migration
 * is invisible to the router and the frontend.
 */

import { odooSearchRead } from "../helpers";
import type { PurchaseOrder, PurchaseOrderLine, Supplier } from "../types";

const PURCHASE_ORDER_FIELDS = [
  "name", "partner_id", "date_order", "date_approve",
  "amount_total", "amount_untaxed", "state", "currency_id",
  "user_id", "company_id", "invoice_status", "notes",
];

const PURCHASE_ORDER_LINE_FIELDS = [
  "order_id", "product_id", "name", "product_qty",
  "qty_received", "qty_invoiced", "price_unit",
  "price_subtotal", "price_total", "taxes_id", "date_planned",
];

const SUPPLIER_FIELDS = [
  "name", "email", "phone", "mobile", "street", "city",
  "country_id", "supplier_rank", "customer_rank",
  "vat", "website", "comment",
];

export async function getPurchaseOrders(limit = 50): Promise<PurchaseOrder[]> {
  return odooSearchRead<PurchaseOrder>("purchase.order", [], PURCHASE_ORDER_FIELDS, {
    limit,
    order: "date_order desc",
  });
}

export async function getPurchaseOrderLines(orderId?: number): Promise<PurchaseOrderLine[]> {
  const domain = orderId ? [["order_id", "=", orderId]] : [];
  return odooSearchRead<PurchaseOrderLine>(
    "purchase.order.line",
    domain,
    PURCHASE_ORDER_LINE_FIELDS,
    { limit: 200 },
  );
}

export async function getSuppliers(limit = 100): Promise<Supplier[]> {
  return odooSearchRead<Supplier>(
    "res.partner",
    [["supplier_rank", ">", 0]],
    SUPPLIER_FIELDS,
    { limit, order: "supplier_rank desc" },
  );
}
