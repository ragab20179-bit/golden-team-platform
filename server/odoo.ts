/**
 * Odoo XML-RPC Client Helper
 * Connects to goldenteam.odoo.com via XML-RPC 2.0 protocol
 * Covers: Purchase, Accounting, Inventory, CRM, Project modules
 *
 * Authentication: API Key (never exposed to frontend)
 * DB: goldenteam (lowercase — case-sensitive)
 */

import { ENV } from "./_core/env";

const ODOO_URL = "https://goldenteam.odoo.com";
const ODOO_DB = "goldenteam";

// ── XML-RPC serializer ─────────────────────────────────────────────────────────
function xmlValue(val: unknown): string {
  if (val === null || val === undefined) return "<value><boolean>0</boolean></value>";
  if (typeof val === "boolean") return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? `<value><int>${val}</int></value>`
      : `<value><double>${val}</double></value>`;
  }
  if (typeof val === "string") {
    return `<value><string>${val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</string></value>`;
  }
  if (Array.isArray(val)) {
    return `<value><array><data>${val.map(xmlValue).join("")}</data></array></value>`;
  }
  if (typeof val === "object") {
    const members = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `<member><name>${k}</name>${xmlValue(v)}</member>`)
      .join("");
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${String(val)}</string></value>`;
}

// ── XML-RPC response parser ────────────────────────────────────────────────────
function parseXmlValue(node: Element): unknown {
  const child = node.firstElementChild;
  if (!child) return node.textContent?.trim() ?? null;

  const tag = child.tagName.toLowerCase();

  if (tag === "int" || tag === "i4" || tag === "i8") return parseInt(child.textContent ?? "0", 10);
  if (tag === "double") return parseFloat(child.textContent ?? "0");
  if (tag === "boolean") return child.textContent?.trim() === "1";
  if (tag === "string") return child.textContent ?? "";
  if (tag === "nil") return null;
  if (tag === "datetime.iso8601") return child.textContent ?? null;

  if (tag === "array") {
    const data = child.querySelector("data");
    if (!data) return [];
    return Array.from(data.children).map(v => parseXmlValue(v));
  }

  if (tag === "struct") {
    const obj: Record<string, unknown> = {};
    const members = child.querySelectorAll(":scope > member");
    members.forEach(member => {
      const name = member.querySelector(":scope > name")?.textContent ?? "";
      const valueEl = member.querySelector(":scope > value");
      obj[name] = valueEl ? parseXmlValue(valueEl) : null;
    });
    return obj;
  }

  return child.textContent ?? null;
}

async function xmlrpcCall(path: string, method: string, params: unknown[]): Promise<unknown> {
  const body = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params
    .map(p => `<param>${xmlValue(p)}</param>`)
    .join("")}</params></methodCall>`;

  const res = await fetch(`${ODOO_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8" },
    body,
  });

  if (!res.ok) throw new Error(`Odoo HTTP ${res.status}: ${res.statusText}`);

  const text = await res.text();

  // Use DOMParser-like approach with regex for Node.js (no DOM available)
  // Parse fault
  if (text.includes("<fault>")) {
    const faultMatch = text.match(/<name>faultString<\/name>\s*<value><string>([\s\S]*?)<\/string><\/value>/);
    const faultMsg = faultMatch ? faultMatch[1] : "Unknown Odoo fault";
    throw new Error(`Odoo fault: ${faultMsg.slice(0, 200)}`);
  }

  // Parse response value using regex-based parser (avoids DOM dependency in Node.js)
  return parseXmlRpcResponse(text);
}

// ── Regex-based XML-RPC response parser (Node.js compatible) ──────────────────
function parseXmlRpcResponse(xml: string): unknown {
  // Remove XML declaration and normalize whitespace
  const clean = xml.replace(/<\?xml[^>]*\?>/g, "").trim();

  // Extract the params/value content
  const paramMatch = clean.match(/<params>\s*<param>\s*<value>([\s\S]*?)<\/value>\s*<\/param>\s*<\/params>/);
  if (!paramMatch) return null;

  return parseValueStr(paramMatch[1].trim());
}

function parseValueStr(content: string): unknown {
  content = content.trim();

  // int/i4
  const intM = content.match(/^<int>(\d+)<\/int>$/) || content.match(/^<i4>(\d+)<\/i4>$/);
  if (intM) return parseInt(intM[1], 10);

  // double
  const dblM = content.match(/^<double>([\d.eE+-]+)<\/double>$/);
  if (dblM) return parseFloat(dblM[1]);

  // boolean
  const boolM = content.match(/^<boolean>([01])<\/boolean>$/);
  if (boolM) return boolM[1] === "1";

  // string
  const strM = content.match(/^<string>([\s\S]*?)<\/string>$/);
  if (strM) return strM[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  // nil
  if (content === "<nil/>") return null;

  // array
  if (content.startsWith("<array>")) {
    const dataM = content.match(/<data>([\s\S]*)<\/data>/);
    if (!dataM) return [];
    return splitValues(dataM[1]).map(v => parseValueStr(v));
  }

  // struct
  if (content.startsWith("<struct>")) {
    const obj: Record<string, unknown> = {};
    const memberRegex = /<member>\s*<name>([\s\S]*?)<\/name>\s*<value>([\s\S]*?)<\/value>\s*<\/member>/g;
    let m;
    while ((m = memberRegex.exec(content)) !== null) {
      obj[m[1]] = parseValueStr(m[2].trim());
    }
    return obj;
  }

  // bare text (no tag)
  return content || null;
}

function splitValues(data: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let start = -1;
  let i = 0;

  while (i < data.length) {
    if (data[i] === "<") {
      if (data[i + 1] === "/") {
        depth--;
        if (depth === 0 && start !== -1) {
          const end = data.indexOf(">", i) + 1;
          values.push(data.slice(start, end).replace(/^<value>/, "").replace(/<\/value>$/, "").trim());
          start = -1;
        }
      } else if (!data.startsWith("<!--", i)) {
        if (depth === 0 && data.slice(i).startsWith("<value>")) {
          start = i + "<value>".length;
        }
        depth++;
      }
    }
    i++;
  }
  return values;
}

// ── Authenticated execute_kw ───────────────────────────────────────────────────
let _uid: number | null = null;

async function getUid(): Promise<number> {
  if (_uid) return _uid;
  const uid = await xmlrpcCall("/xmlrpc/2/common", "authenticate", [
    ODOO_DB,
    ENV.odooUsername,
    ENV.odooApiKey,
    {},
  ]);
  if (!uid || typeof uid !== "number" || uid === 0) {
    throw new Error("Odoo authentication failed — check ODOO_USERNAME and ODOO_API_KEY");
  }
  _uid = uid;
  return uid;
}

async function executeKw(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {}
): Promise<unknown> {
  const uid = await getUid();
  return xmlrpcCall("/xmlrpc/2/object", "execute_kw", [
    ODOO_DB,
    uid,
    ENV.odooApiKey,
    model,
    method,
    args,
    kwargs,
  ]);
}

// ── Public API ─────────────────────────────────────────────────────────────────
export async function odooSearchRead<T = Record<string, unknown>>(
  model: string,
  domain: unknown[][],
  fields: string[],
  opts: { limit?: number; offset?: number; order?: string } = {}
): Promise<T[]> {
  const result = await executeKw(model, "search_read", [domain], {
    fields,
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
    ...(opts.order ? { order: opts.order } : {}),
  });
  return (result as T[]) ?? [];
}

export async function odooSearchCount(model: string, domain: unknown[][]): Promise<number> {
  const result = await executeKw(model, "search_count", [domain], {});
  return typeof result === "number" ? result : 0;
}

export async function odooCreate(model: string, values: Record<string, unknown>): Promise<number> {
  const result = await executeKw(model, "create", [values], {});
  return typeof result === "number" ? result : 0;
}

export async function odooWrite(
  model: string,
  ids: number[],
  values: Record<string, unknown>
): Promise<boolean> {
  const result = await executeKw(model, "write", [ids, values], {});
  return result === true;
}

export async function odooRead<T = Record<string, unknown>>(
  model: string,
  ids: number[],
  fields: string[]
): Promise<T[]> {
  const result = await executeKw(model, "read", [ids], { fields });
  return (result as T[]) ?? [];
}

// ── Module-specific typed helpers ──────────────────────────────────────────────

// Purchase
export async function getPurchaseOrders(limit = 50) {
  return odooSearchRead("purchase.order", [], [
    "name", "partner_id", "date_order", "date_approve",
    "amount_total", "amount_untaxed", "state", "currency_id",
    "user_id", "company_id", "invoice_status", "notes",
  ], { limit, order: "date_order desc" });
}

export async function getPurchaseOrderLines(orderId?: number) {
  const domain = orderId ? [["order_id", "=", orderId]] : [];
  return odooSearchRead("purchase.order.line", domain, [
    "order_id", "product_id", "name", "product_qty",
    "qty_received", "qty_invoiced", "price_unit",
    "price_subtotal", "price_total", "taxes_id", "date_planned",
  ], { limit: 200 });
}

export async function getSuppliers(limit = 100) {
  return odooSearchRead("res.partner", [["supplier_rank", ">", 0]], [
    "name", "email", "phone", "mobile", "street", "city",
    "country_id", "supplier_rank", "customer_rank",
    "vat", "website", "comment",
  ], { limit, order: "supplier_rank desc" });
}

// Accounting
export async function getInvoices(type: "in_invoice" | "out_invoice" | "all" = "all", limit = 50) {
  const domain = type === "all" ? [] : [["move_type", "=", type]];
  return odooSearchRead("account.move", domain, [
    "name", "partner_id", "invoice_date", "invoice_date_due",
    "amount_total", "amount_residual", "state", "move_type",
    "currency_id", "payment_state", "ref", "narration",
  ], { limit, order: "invoice_date desc" });
}

export async function getPayments(limit = 50) {
  return odooSearchRead("account.payment", [], [
    "name", "partner_id", "amount", "date", "state",
    "payment_type", "currency_id", "journal_id", "memo",
  ], { limit, order: "date desc" });
}

export async function getChartOfAccounts(limit = 200) {
  return odooSearchRead("account.account", [], [
    "name", "code", "account_type", "currency_id",
    "deprecated", "company_id",
  ], { limit, order: "code asc" });
}

// Inventory
export async function getProducts(limit = 100) {
  return odooSearchRead("product.product", [], [
    "name", "default_code", "barcode", "qty_available",
    "virtual_available", "incoming_qty", "outgoing_qty",
    "list_price", "standard_price", "categ_id", "uom_id",
    "type", "active",
  ], { limit, order: "name asc" });
}

export async function getStockPickings(limit = 50) {
  return odooSearchRead("stock.picking", [], [
    "name", "partner_id", "scheduled_date", "date_done",
    "state", "picking_type_id", "origin", "location_id",
    "location_dest_id", "move_type",
  ], { limit, order: "scheduled_date desc" });
}

export async function getWarehouses() {
  return odooSearchRead("stock.warehouse", [], [
    "name", "code", "lot_stock_id", "company_id",
  ], { limit: 20 });
}

// CRM
export async function getCrmLeads(limit = 50) {
  return odooSearchRead("crm.lead", [], [
    "name", "partner_id", "stage_id", "expected_revenue",
    "prorated_revenue", "probability", "user_id", "team_id",
    "date_deadline", "date_closed", "priority", "type",
    "description", "phone", "email_from",
  ], { limit, order: "create_date desc" });
}

export async function getCrmStages() {
  return odooSearchRead("crm.stage", [], [
    "name", "sequence", "probability", "is_won",
  ], { limit: 20, order: "sequence asc" });
}

// Project
export async function getProjects(limit = 50) {
  return odooSearchRead("project.project", [], [
    "name", "partner_id", "date_start", "date",
    "user_id", "task_count", "description", "privacy_visibility",
    "last_update_status", "tag_ids",
  ], { limit, order: "name asc" });
}

export async function getProjectTasks(projectId?: number, limit = 100) {
  const domain = projectId ? [["project_id", "=", projectId]] : [];
  return odooSearchRead("project.task", domain, [
    "name", "project_id", "user_ids", "stage_id",
    "date_deadline", "date_assign", "priority",
    "description", "tag_ids", "kanban_state",
  ], { limit, order: "priority desc, date_deadline asc" });
}

// ── Summary stats (used for dashboard KPIs) ────────────────────────────────────
export async function getOdooStats() {
  const [
    purchaseCount, invoiceCount, productCount,
    crmCount, projectCount, taskCount, supplierCount,
  ] = await Promise.all([
    odooSearchCount("purchase.order", []),
    odooSearchCount("account.move", [["move_type", "in", ["in_invoice", "out_invoice"]]]),
    odooSearchCount("product.product", [["active", "=", true]]),
    odooSearchCount("crm.lead", []),
    odooSearchCount("project.project", []),
    odooSearchCount("project.task", []),
    odooSearchCount("res.partner", [["supplier_rank", ">", 0]]),
  ]);

  return {
    purchaseOrders: purchaseCount,
    invoices: invoiceCount,
    products: productCount,
    crmLeads: crmCount,
    projects: projectCount,
    tasks: taskCount,
    suppliers: supplierCount,
    lastSync: new Date().toISOString(),
  };
}
