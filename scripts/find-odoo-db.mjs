/**
 * Find the correct Odoo database name by trying different casings
 */
import { config } from "dotenv";
config();

const ODOO_URL = "https://goldenteam.odoo.com";
const ODOO_USERNAME = process.env.ODOO_USERNAME;
const ODOO_API_KEY = process.env.ODOO_API_KEY;

async function tryAuth(db) {
  const body = `<?xml version="1.0"?><methodCall><methodName>authenticate</methodName><params><param><value><string>${db}</string></value></param><param><value><string>${ODOO_USERNAME}</string></value></param><param><value><string>${ODOO_API_KEY}</string></value></param><param><value><struct></struct></value></param></params></methodCall>`;
  const res = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });
  const text = await res.text();
  const uidMatch = text.match(/<value><int>(\d+)<\/int><\/value>/);
  const uid = uidMatch ? parseInt(uidMatch[1]) : 0;
  return { db, uid, success: uid > 0 };
}

// Also try to list databases
async function listDbs() {
  const body = `<?xml version="1.0"?><methodCall><methodName>list</methodName><params></params></methodCall>`;
  const res = await fetch(`${ODOO_URL}/xmlrpc/2/db`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });
  return res.text();
}

console.log("🔍 Trying to list databases...");
const dbListXml = await listDbs();
console.log("DB list response:", dbListXml.slice(0, 500));

const candidates = ["goldenteam", "Goldenteam", "GoldenTeam", "golden_team", "golden-team", "gt", "GT"];
console.log("\n🔐 Trying auth with different DB names...");
for (const db of candidates) {
  const result = await tryAuth(db);
  console.log(`  DB='${db}': ${result.success ? `✅ UID=${result.uid}` : "❌ failed"}`);
  if (result.success) {
    console.log(`\n✅ CORRECT DB NAME: '${db}'`);
    break;
  }
}
