/**
 * server/odoo/modules/sales.ts
 *
 * Sales domain — Sales Orders, order lines, and customers.
 * Uses the same odooSearchRead helper pattern as other modules.
 */
import { odooSearchRead } from "../helpers";

const SALES_ORDER_FIELDS = [
  "name", "partner_id", "date_order", "validity_date",
  "amount_total", "amount_untaxed", "state", "currency_id",
  "user_id", "company_id", "invoice_status", "note",
  "client_order_ref", "payment_term_id", "warehouse_id",
];

const SALES_ORDER_LINE_FIELDS = [
  "order_id", "product_id", "name", "product_uom_qty",
  "qty_delivered", "qty_invoiced", "price_unit",
  "price_subtotal", "price_total", "tax_id", "customer_lead",
  "product_uom",
];

const CUSTOMER_FIELDS = [
  "name", "email", "phone", "mobile", "street", "city",
  "country_id", "customer_rank", "supplier_rank",
  "vat", "website", "comment",
];

export interface SalesOrder {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  date_order: string | false;
  validity_date: string | false;
  amount_total: number;
  amount_untaxed: number;
  state: string;
  currency_id: [number, string] | false;
  user_id: [number, string] | false;
  company_id: [number, string] | false;
  invoice_status: string;
  note: string | false;
  client_order_ref: string | false;
  payment_term_id: [number, string] | false;
  warehouse_id: [number, string] | false;
}

export interface SalesOrderLine {
  id: number;
  order_id: [number, string] | false;
  product_id: [number, string] | false;
  name: string;
  product_uom_qty: number;
  qty_delivered: number;
  qty_invoiced: number;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  tax_id: [number, string][];
  customer_lead: number;
  product_uom: [number, string] | false;
}

export interface Customer {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  mobile: string | false;
  street: string | false;
  city: string | false;
  country_id: [number, string] | false;
  customer_rank: number;
  supplier_rank: number;
  vat: string | false;
  website: string | false;
  comment: string | false;
}

export async function getSalesOrders(limit = 50): Promise<SalesOrder[]> {
  return odooSearchRead<SalesOrder>("sale.order", [], SALES_ORDER_FIELDS, {
    limit,
    order: "date_order desc",
  });
}

export async function getSalesOrderLines(orderId?: number): Promise<SalesOrderLine[]> {
  const domain = orderId ? [["order_id", "=", orderId]] : [];
  return odooSearchRead<SalesOrderLine>(
    "sale.order.line",
    domain,
    SALES_ORDER_LINE_FIELDS,
    { limit: 200 },
  );
}

export async function getCustomers(limit = 100): Promise<Customer[]> {
  return odooSearchRead<Customer>(
    "res.partner",
    [["customer_rank", ">", 0]],
    CUSTOMER_FIELDS,
    { limit, order: "customer_rank desc" },
  );
}
