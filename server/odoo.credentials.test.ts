/**
 * server/odoo.credentials.test.ts
 *
 * Validates that ODOO_DB, ODOO_URL, ODOO_USERNAME, and ODOO_API_KEY are
 * correctly configured by performing a lightweight XML-RPC authenticate call.
 * Returns UID > 0 on success, 0 or false on bad credentials.
 */
import { describe, it, expect } from "vitest";

const ODOO_URL = process.env.ODOO_URL ?? "https://goldenteam1.odoo.com";
const ODOO_DB = process.env.ODOO_DB ?? "";
const ODOO_USERNAME = process.env.ODOO_USERNAME ?? "";
const ODOO_API_KEY = process.env.ODOO_API_KEY ?? "";

function buildAuthXml(db: string, user: string, apiKey: string): string {
  return `<?xml version="1.0"?><methodCall><methodName>authenticate</methodName><params><param><value><string>${db}</string></value></param><param><value><string>${user}</string></value></param><param><value><string>${apiKey}</string></value></param><param><value><struct></struct></value></param></params></methodCall>`;
}

describe("Odoo credentials", () => {
  it("should authenticate successfully and return a valid UID", async () => {
    expect(ODOO_DB, "ODOO_DB must be set").toBeTruthy();
    expect(ODOO_USERNAME, "ODOO_USERNAME must be set").toBeTruthy();
    expect(ODOO_API_KEY, "ODOO_API_KEY must be set").toBeTruthy();

    const resp = await fetch(`${ODOO_URL}/xmlrpc/2/common`, {
      method: "POST",
      headers: { "Content-Type": "text/xml" },
      body: buildAuthXml(ODOO_DB, ODOO_USERNAME, ODOO_API_KEY),
      signal: AbortSignal.timeout(10_000),
    });

    expect(resp.ok, `HTTP ${resp.status} from Odoo`).toBe(true);
    const text = await resp.text();

    // Successful auth returns <int>N</int> where N > 0
    const match = text.match(/<int>(\d+)<\/int>/);
    expect(match, "Response should contain <int>UID</int>").toBeTruthy();
    const uid = parseInt(match![1], 10);
    expect(uid, `UID should be > 0, got ${uid}`).toBeGreaterThan(0);
  }, 15_000);
});
