/**
 * Live Odoo connection test — validates ODOO_API_KEY and ODOO_USERNAME
 * against goldenteam1.odoo.com using both XML-RPC (current) and JSON-2 (target)
 */
import { config } from "dotenv";
config({ path: ".env" });

const ODOO_URL = "https://goldenteam1.odoo.com";
const ODOO_DB = process.env.ODOO_DB || "golden-team-1";
const USERNAME = process.env.ODOO_USERNAME;
const API_KEY = process.env.ODOO_API_KEY;

if (!USERNAME || !API_KEY) {
  console.error("❌ ODOO_USERNAME or ODOO_API_KEY not set");
  process.exit(1);
}

console.log(`\n🔌 Testing Odoo connection to ${ODOO_URL}`);
console.log(`   DB:       ${ODOO_DB}`);
console.log(`   Username: ${USERNAME}`);
console.log(`   API Key:  ${API_KEY.substring(0, 8)}...`);

// ── 1. XML-RPC authenticate ──────────────────────────────────────────────────
async function xmlrpcAuthenticate() {
  const body = `<?xml version="1.0"?>
<methodCall>
  <methodName>authenticate</methodName>
  <params>
    <param><value><string>${ODOO_DB}</string></value></param>
    <param><value><string>${USERNAME}</string></value></param>
    <param><value><string>${API_KEY}</string></value></param>
    <param><value><struct></struct></value></param>
  </params>
</methodCall>`;

  const res = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const text = await res.text();

  // Extract UID from XML response
  const match = text.match(/<value><int>(\d+)<\/int><\/value>/);
  if (!match) {
    // Check for fault
    const faultMatch = text.match(/<faultString><value><string>(.*?)<\/string>/s);
    throw new Error(faultMatch ? faultMatch[1] : `Unexpected response: ${text.substring(0, 200)}`);
  }
  return parseInt(match[1], 10);
}

// ── 2. XML-RPC search_read ───────────────────────────────────────────────────
async function xmlrpcSearchRead(uid, model, domain, fields, limit = 5) {
  const body = `<?xml version="1.0"?>
<methodCall>
  <methodName>execute_kw</methodName>
  <params>
    <param><value><string>${ODOO_DB}</string></value></param>
    <param><value><int>${uid}</int></value></param>
    <param><value><string>${API_KEY}</string></value></param>
    <param><value><string>${model}</string></value></param>
    <param><value><string>search_read</string></value></param>
    <param><value><array><data>
      <value><array><data></data></array></value>
    </data></array></value></param>
    <param><value><struct>
      <member><name>fields</name><value><array><data>
        ${fields.map(f => `<value><string>${f}</string></value>`).join("")}
      </data></array></value></member>
      <member><name>limit</name><value><int>${limit}</int></value></member>
    </struct></value></param>
  </params>
</methodCall>`;

  const res = await fetch(`${ODOO_URL}/xmlrpc/2/object`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  // Count records by counting <struct> elements in the array response
  const structs = (text.match(/<struct>/g) || []).length;
  return structs;
}

// ── 3. JSON-2 test ───────────────────────────────────────────────────────────
async function json2SearchRead(model, fields, limit = 5) {
  const res = await fetch(`${ODOO_URL}/json/2/${model}/search_read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${USERNAME}:${API_KEY}`).toString("base64")}`,
    },
    body: JSON.stringify({
      domain: [],
      fields,
      limit,
    }),
  });

  if (res.status === 404) return { status: 404, note: "JSON-2 not available (Odoo < 17)" };
  if (!res.ok) {
    const text = await res.text();
    return { status: res.status, error: text.substring(0, 200) };
  }
  const data = await res.json();
  return { status: 200, count: Array.isArray(data) ? data.length : data?.length ?? 0, sample: Array.isArray(data) ? data[0] : data };
}

// ── Run tests ────────────────────────────────────────────────────────────────
async function main() {
  let uid;

  // Test 1: XML-RPC auth
  console.log("\n📡 Test 1: XML-RPC Authentication");
  try {
    uid = await xmlrpcAuthenticate();
    if (uid === 0 || uid === false) {
      console.error("   ❌ Authentication failed — UID returned 0/false. Check username and API key.");
      process.exit(1);
    }
    console.log(`   ✅ Authenticated — UID: ${uid}`);
  } catch (err) {
    console.error(`   ❌ XML-RPC auth failed: ${err.message}`);
    process.exit(1);
  }

  // Test 2: Read purchase orders
  console.log("\n📦 Test 2: Read purchase.order");
  try {
    const count = await xmlrpcSearchRead(uid, "purchase.order", [], ["name", "state", "amount_total"], 5);
    console.log(`   ✅ purchase.order accessible — ~${count} struct(s) in response`);
  } catch (err) {
    console.error(`   ❌ purchase.order read failed: ${err.message}`);
  }

  // Test 3: Read account.move (invoices)
  console.log("\n💰 Test 3: Read account.move (invoices)");
  try {
    const count = await xmlrpcSearchRead(uid, "account.move", [], ["name", "state", "amount_total"], 5);
    console.log(`   ✅ account.move accessible — ~${count} struct(s) in response`);
  } catch (err) {
    console.error(`   ❌ account.move read failed: ${err.message}`);
  }

  // Test 4: Read hr.employee
  console.log("\n👥 Test 4: Read hr.employee");
  try {
    const count = await xmlrpcSearchRead(uid, "hr.employee", [], ["name", "job_title", "department_id"], 5);
    console.log(`   ✅ hr.employee accessible — ~${count} struct(s) in response`);
  } catch (err) {
    console.error(`   ❌ hr.employee read failed: ${err.message}`);
  }

  // Test 5: Read crm.lead
  console.log("\n🎯 Test 5: Read crm.lead");
  try {
    const count = await xmlrpcSearchRead(uid, "crm.lead", [], ["name", "stage_id", "expected_revenue"], 5);
    console.log(`   ✅ crm.lead accessible — ~${count} struct(s) in response`);
  } catch (err) {
    console.error(`   ❌ crm.lead read failed: ${err.message}`);
  }

  // Test 6: JSON-2 API
  console.log("\n🚀 Test 6: JSON-2 API (new protocol)");
  try {
    const result = await json2SearchRead("res.partner", ["name", "email"], 3);
    if (result.status === 200) {
      console.log(`   ✅ JSON-2 available — ${result.count} partner(s) returned`);
      if (result.sample) console.log(`   Sample: ${JSON.stringify(result.sample).substring(0, 100)}`);
    } else if (result.status === 404) {
      console.log(`   ⚠️  JSON-2 not available — Odoo version < 17. Will use XML-RPC only.`);
    } else {
      console.log(`   ⚠️  JSON-2 returned ${result.status}: ${result.error || result.note}`);
    }
  } catch (err) {
    console.error(`   ❌ JSON-2 test failed: ${err.message}`);
  }

  console.log("\n✅ Connection test complete. UID:", uid);
  console.log("   Ready to wire live data into the platform.\n");
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
