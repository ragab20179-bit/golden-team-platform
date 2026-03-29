/**
 * Odoo API credential validation script
 * Tests: XML-RPC authenticate against goldenteam.odoo.com
 * Run: node scripts/test-odoo-auth.mjs
 */
import { config } from "dotenv";
config();

const ODOO_URL = "https://goldenteam.odoo.com";
const ODOO_DB = "Goldenteam";
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

if (!ODOO_USERNAME || !ODOO_API_KEY) {
  console.error("❌ ODOO_USERNAME or ODOO_API_KEY is not set in environment");
  process.exit(1);
}

// XML-RPC authenticate call
const xmlBody = `<?xml version="1.0"?>
<methodCall>
  <methodName>authenticate</methodName>
  <params>
    <param><value><string>${ODOO_DB}</string></value></param>
    <param><value><string>${ODOO_USERNAME}</string></value></param>
    <param><value><string>${ODOO_API_KEY}</string></value></param>
    <param><value><struct></struct></value></param>
  </params>
</methodCall>`;

try {
  console.log(`🔐 Testing Odoo auth at ${ODOO_URL} (db: ${ODOO_DB}, user: ${ODOO_USERNAME})`);
  const res = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xmlBody,
  });

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}: ${res.statusText}`);
    process.exit(1);
  }

  const text = await res.text();
  console.log("📦 Raw response:", text.slice(0, 300));

  // Extract uid from XML-RPC response
  const uidMatch = text.match(/<value><int>(\d+)<\/int><\/value>/);
  const faultMatch = text.match(/<faultString><value><string>(.*?)<\/string><\/value>/s);

  if (faultMatch) {
    console.error(`❌ Odoo auth fault: ${faultMatch[1]}`);
    process.exit(1);
  }

  if (uidMatch) {
    const uid = parseInt(uidMatch[1]);
    if (uid > 0) {
      console.log(`✅ Odoo auth SUCCESS — User ID: ${uid}`);
      process.exit(0);
    } else {
      console.error("❌ Odoo auth FAILED — returned uid=0 (wrong credentials)");
      process.exit(1);
    }
  }

  // Check for boolean false (auth failure)
  if (text.includes("<boolean>0</boolean>") || text.includes("<value><boolean>0</boolean>")) {
    console.error("❌ Odoo auth FAILED — credentials rejected");
    process.exit(1);
  }

  console.error("❌ Could not parse Odoo response");
  console.error("Full response:", text);
  process.exit(1);
} catch (err) {
  console.error("❌ Network error:", err.message);
  process.exit(1);
}
