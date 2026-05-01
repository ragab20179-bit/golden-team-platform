/**
 * server/odoo/__tests__/parity.test.ts
 *
 * Result-shape parity between XML-RPC and JSON-2.
 *
 * These tests run against a live staging Odoo instance — they're integration
 * tests, not unit tests. They're skipped by default; set ODOO_PARITY=1 to run.
 *
 * The point is to catch field-shape divergences that the type system can't
 * see: the protocols can return the same logical data with subtly different
 * shapes (e.g., a Many2one as `[id, name]` vs `{id, name}`) and we need to
 * know before flipping to jsonrpc-2 in production.
 *
 * Run via:
 *   ODOO_PARITY=1 ODOO_URL=... ODOO_API_KEY=... pnpm vitest parity
 *
 * Run nightly in CI against staging once the parallel-run window starts.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { odoo } from "../client";

const RUN = process.env.ODOO_PARITY === "1";
const describeIfLive = RUN ? describe : describe.skip;

describeIfLive("Odoo XML-RPC ↔ JSON-2 parity", () => {
  beforeAll(() => {
    if (!process.env.ODOO_API_KEY) {
      throw new Error("ODOO_API_KEY required for parity tests");
    }
  });

  // Helper to call both transports for the same logical query
  async function bothCalls<T>(
    model: string,
    method: string,
    body: Record<string, unknown>,
  ): Promise<{ xml: T; json: T }> {
    const oldProto = process.env.ODOO_PROTOCOL;
    process.env.ODOO_PROTOCOL = "xmlrpc";
    const xml = await odoo<T>(model, method, body);
    process.env.ODOO_PROTOCOL = "jsonrpc-2";
    const json = await odoo<T>(model, method, body);
    process.env.ODOO_PROTOCOL = oldProto;
    return { xml, json };
  }

  it("res.partner search_read returns same shape", async () => {
    const { xml, json } = await bothCalls<unknown[]>("res.partner", "search_read", {
      domain: [["is_company", "=", true]],
      fields: ["name", "email", "country_id"],
      limit: 5,
    });
    expect(Array.isArray(xml)).toBe(true);
    expect(Array.isArray(json)).toBe(true);
    expect(xml.length).toBe(json.length);
    if (xml.length > 0) {
      expect(Object.keys(xml[0] as object).sort()).toEqual(
        Object.keys(json[0] as object).sort(),
      );
    }
  });

  it("Many2one comes back as [id, name] tuple in both", async () => {
    const { xml, json } = await bothCalls<Array<{ partner_id: unknown }>>(
      "purchase.order",
      "search_read",
      { domain: [], fields: ["partner_id"], limit: 1 },
    );
    if (xml.length === 0) return; // empty DB, skip
    const xmlPid = xml[0].partner_id;
    const jsonPid = json[0].partner_id;
    if (xmlPid && jsonPid) {
      expect(Array.isArray(xmlPid)).toBe(true);
      expect(Array.isArray(jsonPid)).toBe(true);
      expect((xmlPid as unknown[]).length).toBe((jsonPid as unknown[]).length);
    }
  });

  it("search_count returns same number on both", async () => {
    const { xml, json } = await bothCalls<number>(
      "product.product",
      "search_count",
      { domain: [["active", "=", true]] },
    );
    expect(xml).toBe(json);
  });

  it("Arabic text round-trips correctly via both protocols", async () => {
    // Verify the Arabic apostrophe / entity bug fix.
    // Requires a partner record with Arabic name in staging — if absent, skip.
    const { xml, json } = await bothCalls<Array<{ name: string }>>(
      "res.partner",
      "search_read",
      {
        domain: [["name", "ilike", "محمد"]],
        fields: ["name"],
        limit: 5,
      },
    );
    if (xml.length === 0) return;
    for (let i = 0; i < xml.length; i++) {
      expect(xml[i].name).toBe(json[i].name);
      // Sanity: no HTML entities leaked through
      expect(xml[i].name).not.toMatch(/&[a-z]+;|&#\d+;/i);
    }
  });
});
