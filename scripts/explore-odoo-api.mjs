/**
 * Odoo API Explorer — discovers available models and key fields
 * for Purchase, Accounting, Inventory, CRM, and Project modules
 * Run: node scripts/explore-odoo-api.mjs
 */
import { config } from "dotenv";
config();

const ODOO_URL = "https://goldenteam.odoo.com";
const ODOO_DB = "Goldenteam";
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

// ── XML-RPC helpers ────────────────────────────────────────────────────────────
function xmlValue(val) {
  if (val === null || val === undefined) return "<value><boolean>0</boolean></value>";
  if (typeof val === "boolean") return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
  if (typeof val === "number") return Number.isInteger(val) ? `<value><int>${val}</int></value>` : `<value><double>${val}</double></value>`;
  if (typeof val === "string") return `<value><string>${val.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</string></value>`;
  if (Array.isArray(val)) return `<value><array><data>${val.map(xmlValue).join("")}</data></array></value>`;
  if (typeof val === "object") {
    const members = Object.entries(val).map(([k, v]) => `<member><name>${k}</name>${xmlValue(v)}</member>`).join("");
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${String(val)}</string></value>`;
}

async function xmlrpc(endpoint, method, params) {
  const body = `<?xml version="1.0"?><methodCall><methodName>${method}</methodName><params>${params.map(p => `<param>${xmlValue(p)}</param>`).join("")}</params></methodCall>`;
  const res = await fetch(`${ODOO_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });
  const text = await res.text();
  return text;
}

function extractInt(xml) {
  const m = xml.match(/<value><int>(\d+)<\/int><\/value>/);
  return m ? parseInt(m[1]) : null;
}

function extractArray(xml) {
  // Simple extraction of string values from array
  const matches = [...xml.matchAll(/<value><string>(.*?)<\/string><\/value>/gs)];
  return matches.map(m => m[1]);
}

function extractStructArray(xml) {
  // Extract array of structs — returns raw member name/value pairs
  const results = [];
  const structMatches = [...xml.matchAll(/<struct>(.*?)<\/struct>/gs)];
  for (const sm of structMatches) {
    const obj = {};
    const memberMatches = [...sm[1].matchAll(/<member><name>(.*?)<\/name><value>(.*?)<\/value><\/member>/gs)];
    for (const mm of memberMatches) {
      const key = mm[1];
      const rawVal = mm[2].replace(/<[^>]+>/g, "").trim();
      obj[key] = rawVal;
    }
    results.push(obj);
  }
  return results;
}

// ── Authenticate ───────────────────────────────────────────────────────────────
console.log("🔐 Authenticating...");
const authXml = await xmlrpc("/xmlrpc/2/common", "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}]);
const uid = extractInt(authXml);
if (!uid || uid === 0) {
  console.error("❌ Auth failed"); process.exit(1);
}
console.log(`✅ Authenticated as UID ${uid}\n`);

// ── Helper: search_read ────────────────────────────────────────────────────────
async function searchRead(model, domain, fields, limit = 5) {
  const xml = await xmlrpc("/xmlrpc/2/object", "execute_kw", [
    ODOO_DB, uid, ODOO_API_KEY,
    model, "search_read",
    [domain],
    { fields, limit },
  ]);
  return xml;
}

async function getFields(model) {
  const xml = await xmlrpc("/xmlrpc/2/object", "execute_kw", [
    ODOO_DB, uid, ODOO_API_KEY,
    model, "fields_get",
    [],
    { attributes: ["string", "type"] },
  ]);
  return xml;
}

async function getCount(model, domain = []) {
  const xml = await xmlrpc("/xmlrpc/2/object", "execute_kw", [
    ODOO_DB, uid, ODOO_API_KEY,
    model, "search_count",
    [domain],
    {},
  ]);
  return extractInt(xml) ?? 0;
}

// ── Explore each module ────────────────────────────────────────────────────────
const modules = [
  {
    name: "Purchase",
    models: [
      { model: "purchase.order", fields: ["name", "partner_id", "date_order", "amount_total", "state", "currency_id"] },
      { model: "purchase.order.line", fields: ["order_id", "product_id", "product_qty", "price_unit", "price_subtotal"] },
      { model: "res.partner", fields: ["name", "email", "phone", "country_id", "supplier_rank"] },
    ],
  },
  {
    name: "Accounting",
    models: [
      { model: "account.move", fields: ["name", "partner_id", "invoice_date", "amount_total", "state", "move_type", "currency_id"] },
      { model: "account.payment", fields: ["name", "partner_id", "amount", "date", "state", "payment_type"] },
      { model: "account.account", fields: ["name", "code", "account_type", "balance"] },
    ],
  },
  {
    name: "Inventory",
    models: [
      { model: "product.product", fields: ["name", "default_code", "qty_available", "virtual_available", "list_price", "categ_id"] },
      { model: "stock.picking", fields: ["name", "partner_id", "scheduled_date", "state", "picking_type_id"] },
      { model: "stock.warehouse", fields: ["name", "code", "lot_stock_id"] },
    ],
  },
  {
    name: "CRM",
    models: [
      { model: "crm.lead", fields: ["name", "partner_id", "stage_id", "expected_revenue", "probability", "user_id", "date_deadline"] },
      { model: "crm.stage", fields: ["name", "sequence", "probability"] },
    ],
  },
  {
    name: "Project",
    models: [
      { model: "project.project", fields: ["name", "partner_id", "date_start", "date", "user_id", "task_count", "description"] },
      { model: "project.task", fields: ["name", "project_id", "user_ids", "stage_id", "date_deadline", "priority", "description"] },
    ],
  },
];

const results = {};

for (const mod of modules) {
  console.log(`\n━━━ ${mod.name} Module ━━━`);
  results[mod.name] = {};
  for (const { model, fields } of mod.models) {
    try {
      const count = await getCount(model);
      console.log(`  📊 ${model}: ${count} records`);
      if (count > 0) {
        const xml = await searchRead(model, [], fields, 2);
        const structs = extractStructArray(xml);
        if (structs.length > 0) {
          console.log(`     Sample record:`, JSON.stringify(structs[0], null, 2).split("\n").slice(0, 8).join("\n"));
        }
      }
      results[mod.name][model] = { count, fields };
    } catch (err) {
      console.log(`  ⚠️  ${model}: ${err.message}`);
      results[mod.name][model] = { count: 0, error: err.message };
    }
  }
}

console.log("\n\n📋 SUMMARY:");
for (const [mod, models] of Object.entries(results)) {
  console.log(`\n${mod}:`);
  for (const [model, info] of Object.entries(models)) {
    const status = info.error ? `❌ ${info.error}` : `✅ ${info.count} records`;
    console.log(`  ${model}: ${status}`);
  }
}
