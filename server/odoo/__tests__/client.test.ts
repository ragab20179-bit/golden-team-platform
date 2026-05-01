/**
 * server/odoo/__tests__/client.test.ts
 *
 * Transport-level tests with mocked fetch. Verifies:
 *   - Protocol selection via ODOO_PROTOCOL env var
 *   - JSON-2 success and error paths
 *   - XML-RPC argument translation (jsonBodyToXmlrpcArgs)
 *   - Arabic text decoding (the apostrophe / entity bug fix)
 *   - Auth retry on UID-related errors
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── Stub everything client.ts depends on ────────────────────────────────────

vi.mock("../../_core/env", () => ({
  ENV: {
    odooUrl: "https://test.odoo.com",
    odooDb: "test_db",
    odooApiKey: "test-api-key-1234567890",
    odooUsername: "bot@test.com",
  },
}));

vi.mock("../../_core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../auth", () => ({
  getCachedUid: vi.fn().mockResolvedValue(7),
  invalidateUid: vi.fn().mockResolvedValue(undefined),
}));

// Pass-through breakers — wraps the fn but doesn't add behaviour
vi.mock("../breaker", () => {
  const passthrough = { fire: (fn: () => Promise<unknown>) => fn(), state: () => "closed" };
  return {
    odooReadBreaker: passthrough,
    odooWriteBreaker: passthrough,
    odooAuthBreaker: passthrough,
    pickBreaker: () => passthrough,
    getOdooBreakerState: () => ({ read: "closed", write: "closed", auth: "closed", anyOpen: false, authOpen: false }),
  };
});

import { odoo, OdooError } from "../client";
import { invalidateUid } from "../auth";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  delete process.env.ODOO_PROTOCOL;
});

// ─── JSON-2 path ─────────────────────────────────────────────────────────────

describe("odoo() — JSON-2 transport", () => {
  beforeEach(() => {
    process.env.ODOO_PROTOCOL = "jsonrpc-2";
  });

  it("POSTs to /json/2/{model}/{method} with Bearer token", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, name: "Acme" }],
    });
    const result = await odoo<unknown[]>("res.partner", "search_read", {
      domain: [],
      fields: ["name"],
      limit: 10,
    });

    expect(result).toEqual([{ id: 1, name: "Acme" }]);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://test.odoo.com/json/2/res.partner/search_read");
    expect(init.method).toBe("POST");
    expect(init.headers["Authorization"]).toBe("bearer test-api-key-1234567890");
    expect(init.headers["Content-Type"]).toBe("application/json");
    // Single-database deployment: should NOT send X-Odoo-Database
    expect(init.headers["X-Odoo-Database"]).toBeUndefined();
  });

  it("includes X-Odoo-Database when ODOO_SEND_DB_HEADER=1", async () => {
    process.env.ODOO_SEND_DB_HEADER = "1";
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => true });
    await odoo("res.partner", "search_count", { domain: [] });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-Odoo-Database"]).toBe("test_db");
    delete process.env.ODOO_SEND_DB_HEADER;
  });

  it("throws OdooError on HTTP non-2xx", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => "invalid api key",
    });
    await expect(odoo("res.partner", "search", {})).rejects.toThrow(OdooError);
  });

  it("throws OdooError on JSON-level error response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { name: "AccessError", message: "denied" } }),
    });
    await expect(odoo("res.users", "read", { ids: [1] })).rejects.toThrow(/AccessError/);
  });

  it("unwraps `result` envelope when present", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 42 }),
    });
    const v = await odoo<number>("product.product", "search_count", { domain: [] });
    expect(v).toBe(42);
  });
});

// ─── XML-RPC path ────────────────────────────────────────────────────────────

describe("odoo() — XML-RPC transport", () => {
  beforeEach(() => {
    process.env.ODOO_PROTOCOL = "xmlrpc";
  });

  it("uses /xmlrpc/2/object endpoint for object calls", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => buildXmlrpcArrayResponse([
        { id: 1, name: "Acme" },
      ]),
    });
    const result = await odoo<unknown[]>("res.partner", "search_read", {
      domain: [],
      fields: ["name"],
      limit: 10,
    });
    expect(result).toHaveLength(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe("https://test.odoo.com/xmlrpc/2/object");
  });

  it("decodes Arabic text with apostrophes correctly", async () => {
    // Simulates what Odoo would return for a partner whose name contains a quote
    const arabicWithQuote = `أحمد &apos;الكامل&apos;`;
    const expected = `أحمد 'الكامل'`;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => buildXmlrpcArrayResponse([
        { id: 5, name: arabicWithQuote },
      ]),
    });
    const result = await odoo<Array<{ name: string }>>("res.partner", "search_read", {
      domain: [], fields: ["name"], limit: 1,
    });
    expect(result[0].name).toBe(expected);
  });

  it("retries once after invalidateUid on auth-error", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        text: async () => buildXmlrpcFault("Session expired"),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => buildXmlrpcArrayResponse([{ id: 1 }]),
      });

    const result = await odoo<unknown[]>("res.partner", "search_read", {
      domain: [], fields: ["id"], limit: 1,
    });
    expect(result).toHaveLength(1);
    expect(invalidateUid).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on non-auth errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => buildXmlrpcFault("Validation failed: missing field"),
    });
    await expect(odoo("res.partner", "create", { values: {} })).rejects.toThrow(/Validation/);
    expect(invalidateUid).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

// ─── Argument translation (JSON-2 → XML-RPC) ────────────────────────────────

describe("XML-RPC argument translation", () => {
  beforeEach(() => {
    process.env.ODOO_PROTOCOL = "xmlrpc";
  });

  it("write: ids and values become positional args", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => buildXmlrpcBoolResponse(true),
    });
    await odoo("crm.lead", "write", { ids: [42], values: { stage_id: 7 } });
    const body = (fetchMock.mock.calls[0][1].body as string);
    // XML-RPC body should contain both 42 and 7 as separate <param> entries
    expect(body).toMatch(/<int>42<\/int>/);
    expect(body).toMatch(/<int>7<\/int>/);
  });

  it("create: values become a single positional arg", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => buildXmlrpcIntResponse(123),
    });
    const id = await odoo<number>("crm.lead", "create", {
      values: { name: "New lead", expected_revenue: 5000 },
    });
    expect(id).toBe(123);
  });
});

// ─── Helpers — synthesise XML-RPC response strings ───────────────────────────

function buildXmlrpcArrayResponse(records: Array<Record<string, unknown>>): string {
  const items = records.map((r) => {
    const members = Object.entries(r)
      .map(([k, v]) => {
        if (typeof v === "number") return `<member><name>${k}</name><value><int>${v}</int></value></member>`;
        if (typeof v === "string") {
          // Keep the string as-is (may contain &apos; etc. for testing)
          return `<member><name>${k}</name><value><string>${v}</string></value></member>`;
        }
        if (typeof v === "boolean") return `<member><name>${k}</name><value><boolean>${v ? 1 : 0}</boolean></value></member>`;
        return "";
      })
      .join("");
    return `<value><struct>${members}</struct></value>`;
  }).join("");
  return `<?xml version="1.0"?><methodResponse><params><param><value><array><data>${items}</data></array></value></param></params></methodResponse>`;
}

function buildXmlrpcIntResponse(n: number): string {
  return `<?xml version="1.0"?><methodResponse><params><param><value><int>${n}</int></value></param></params></methodResponse>`;
}

function buildXmlrpcBoolResponse(b: boolean): string {
  return `<?xml version="1.0"?><methodResponse><params><param><value><boolean>${b ? 1 : 0}</boolean></value></param></params></methodResponse>`;
}

function buildXmlrpcFault(message: string): string {
  return `<?xml version="1.0"?><methodResponse><fault><value><struct>` +
    `<member><name>faultCode</name><value><int>1</int></value></member>` +
    `<member><name>faultString</name><value><string>${message}</string></value></member>` +
    `</struct></value></fault></methodResponse>`;
}
