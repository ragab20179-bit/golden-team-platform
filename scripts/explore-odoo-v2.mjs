/**
 * Odoo API Explorer v2 — uses xmlrpc npm package for correct parsing
 * Run: node scripts/explore-odoo-v2.mjs
 */
import { config } from "dotenv";
config();
import xmlrpc from "xmlrpc";

const ODOO_URL = "https://goldenteam.odoo.com";
const ODOO_DB = "Goldenteam";
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

// Create HTTPS XML-RPC clients
function makeClient(path) {
  return xmlrpc.createSecureClient({
    host: "goldenteam.odoo.com",
    port: 443,
    path,
  });
}

function call(client, method, params) {
  return new Promise((resolve, reject) => {
    client.methodCall(method, params, (err, val) => {
      if (err) reject(err);
      else resolve(val);
    });
  });
}

// Authenticate
const common = makeClient("/xmlrpc/2/common");
const uid = await call(common, "authenticate", [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, {}]);
if (!uid) { console.error("❌ Auth failed"); process.exit(1); }
console.log(`✅ Authenticated as UID ${uid}\n`);

const obj = makeClient("/xmlrpc/2/object");

async function searchRead(model, domain, fields, limit = 3) {
  return call(obj, "execute_kw", [ODOO_DB, uid, ODOO_API_KEY, model, "search_read", [domain], { fields, limit }]);
}

async function getCount(model, domain = []) {
  return call(obj, "execute_kw", [ODOO_DB, uid, ODOO_API_KEY, model, "search_count", [domain], {}]);
}

// ── Explore modules ────────────────────────────────────────────────────────────
const modules = [
  {
    name: "Purchase",
    models: [
      { model: "purchase.order", fields: ["name", "partner_id", "date_order", "amount_total", "state"] },
      { model: "res.partner", fields: ["name", "email", "phone", "supplier_rank", "country_id"] },
    ],
  },
  {
    name: "Accounting",
    models: [
      { model: "account.move", fields: ["name", "partner_id", "invoice_date", "amount_total", "state", "move_type"] },
      { model: "account.payment", fields: ["name", "partner_id", "amount", "date", "state", "payment_type"] },
    ],
  },
  {
    name: "Inventory",
    models: [
      { model: "product.product", fields: ["name", "default_code", "qty_available", "list_price", "categ_id"] },
      { model: "stock.picking", fields: ["name", "partner_id", "scheduled_date", "state", "picking_type_id"] },
    ],
  },
  {
    name: "CRM",
    models: [
      { model: "crm.lead", fields: ["name", "partner_id", "stage_id", "expected_revenue", "probability", "user_id"] },
      { model: "crm.stage", fields: ["name", "sequence", "probability"] },
    ],
  },
  {
    name: "Project",
    models: [
      { model: "project.project", fields: ["name", "partner_id", "date_start", "date", "user_id", "task_count"] },
      { model: "project.task", fields: ["name", "project_id", "user_ids", "stage_id", "date_deadline", "priority"] },
    ],
  },
];

const summary = {};

for (const mod of modules) {
  console.log(`\n━━━ ${mod.name} ━━━`);
  summary[mod.name] = {};
  for (const { model, fields } of mod.models) {
    try {
      const count = await getCount(model);
      console.log(`  ${model}: ${count} records`);
      if (count > 0) {
        const records = await searchRead(model, [], fields, 2);
        if (records.length > 0) {
          console.log(`    Sample:`, JSON.stringify(records[0]).slice(0, 200));
        }
      }
      summary[mod.name][model] = count;
    } catch (err) {
      console.log(`  ${model}: ERROR — ${err.message}`);
      summary[mod.name][model] = `ERROR: ${err.message}`;
    }
  }
}

console.log("\n\n📋 FINAL SUMMARY:");
console.log(JSON.stringify(summary, null, 2));
