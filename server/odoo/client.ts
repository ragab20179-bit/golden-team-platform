/**
 * server/odoo/client.ts
 *
 * Dual-protocol Odoo client. Routes calls to either the new JSON-2 API or
 * the legacy XML-RPC API based on the ODOO_PROTOCOL env var. In `parallel`
 * mode, calls both and logs divergence — used during the migration window.
 *
 * Why dual protocol:
 *   The Odoo Integration Study (Section 13) flagged that XML-RPC removal is
 *   coming. For Golden Team's Odoo Online deployment, removal is in Online
 *   21.1 (winter 2027), tighter than the on-prem Odoo 22 (fall 2028)
 *   deadline. We want to switch to JSON-2 well before the deadline, but the
 *   existing XML-RPC integration has been running for months and we don't
 *   want a flag-day cutover.
 *
 *   `parallel` mode runs both, returns the (still-trusted) XML-RPC result,
 *   and logs every result-shape divergence. Once the divergence rate is
 *   < 0.1% over a week, flip to `jsonrpc-2` and let JSON-2 become primary.
 *   After 30 days clean, delete the XML-RPC code (PR #3).
 */

import { ENV } from "../_core/env";
import { logger } from "../_core/logger";
import { getCachedUid, invalidateUid } from "./auth";
import { odooAuthBreaker, pickBreaker } from "./breaker";

// ─── Config ──────────────────────────────────────────────────────────────────

const ODOO_URL = ENV.odooUrl ?? "https://goldenteam.odoo.com";
const ODOO_DB = ENV.odooDb ?? "goldenteam";

/**
 * Protocol selection. Defaults to xmlrpc until the migration is verified.
 * - "xmlrpc"      Use legacy /xmlrpc/2 endpoints. (Default during migration window.)
 * - "jsonrpc-2"   Use new /json/2 endpoints. (Target state.)
 * - "parallel"    Call both, return XML-RPC, log divergence. (Validation mode.)
 */
type Protocol = "xmlrpc" | "jsonrpc-2" | "parallel";

function getProtocol(): Protocol {
  const v = (process.env.ODOO_PROTOCOL ?? "xmlrpc").toLowerCase();
  if (v === "jsonrpc-2" || v === "json2" || v === "json-2") return "jsonrpc-2";
  if (v === "parallel" || v === "both") return "parallel";
  return "xmlrpc";
}

// ─── Errors ──────────────────────────────────────────────────────────────────

export class OdooError extends Error {
  constructor(
    message: string,
    public readonly model: string,
    public readonly method: string,
    public readonly transport: "xmlrpc" | "jsonrpc-2",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "OdooError";
  }
}

/**
 * Heuristic — does this error look like an authentication failure?
 * If so, the auth UID cache should be invalidated and the call retried once.
 */
function isAuthError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("session expired") ||
    msg.includes("access denied") ||
    msg.includes("invalid credentials") ||
    msg.includes("authenticationerror") ||
    msg.includes("uid is invalid")
  );
}

// ─── JSON-2 transport ────────────────────────────────────────────────────────

/**
 * Modern JSON-2 transport. Uses Bearer token auth, no per-call password,
 * no UID, no XML serialization, native big-integer support.
 *
 * Per the Odoo 19 docs:
 *   POST /json/2/{model}/{method}
 *   Authorization: bearer {api_key}
 *   X-Odoo-Database: {db}      (only for multi-database deployments)
 *
 *   Body is a JSON object: arguments by name, plus optional `ids` and `context`.
 *   On success: result is the method's return value.
 *   On error: result has an `error` object with name/message/debug.
 */
async function jsonrpc2Call(
  model: string,
  method: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  const url = `${ODOO_URL}/json/2/${model}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${ENV.odooApiKey}`,
      // X-Odoo-Database is only required when one Odoo instance hosts multiple
      // databases. goldenteam.odoo.com hosts only `goldenteam`, so we omit it
      // by default. Set ODOO_SEND_DB_HEADER=1 to include it (defensive flip).
      ...(process.env.ODOO_SEND_DB_HEADER === "1" ? { "X-Odoo-Database": ODOO_DB } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OdooError(
      `HTTP ${res.status}: ${text.slice(0, 200) || res.statusText}`,
      model, method, "jsonrpc-2", res.status,
    );
  }

  const data = (await res.json()) as { error?: { message?: string; name?: string }; result?: unknown } | unknown;

  // Odoo JSON-2 success returns the result directly. Errors come in an `error`
  // shape. Some Odoo versions wrap success in `{result: ...}` — handle both.
  if (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) {
    const err = (data as { error: { message?: string; name?: string } }).error;
    throw new OdooError(
      `${err.name ?? "Odoo error"}: ${err.message ?? "unknown"}`,
      model, method, "jsonrpc-2",
    );
  }
  if (data && typeof data === "object" && "result" in data) {
    return (data as { result: unknown }).result;
  }
  return data;
}

// ─── XML-RPC transport ───────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([\da-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&"); // last — must come after &#... and others
}

function serializeValue(val: unknown): string {
  if (val === null || val === undefined) return "<value><boolean>0</boolean></value>";
  if (typeof val === "boolean") return `<value><boolean>${val ? 1 : 0}</boolean></value>`;
  if (typeof val === "number") {
    return Number.isInteger(val)
      ? `<value><int>${val}</int></value>`
      : `<value><double>${val}</double></value>`;
  }
  if (typeof val === "string") return `<value><string>${xmlEscape(val)}</string></value>`;
  if (Array.isArray(val)) return `<value><array><data>${val.map(serializeValue).join("")}</data></array></value>`;
  if (typeof val === "object") {
    const members = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `<member><name>${xmlEscape(k)}</name>${serializeValue(v)}</member>`)
      .join("");
    return `<value><struct>${members}</struct></value>`;
  }
  return `<value><string>${xmlEscape(String(val))}</string></value>`;
}

function parseValue(content: string): unknown {
  content = content.trim();
  let m: RegExpMatchArray | null;
  if ((m = content.match(/^<int>(-?\d+)<\/int>$/)) || (m = content.match(/^<i4>(-?\d+)<\/i4>$/)) || (m = content.match(/^<i8>(-?\d+)<\/i8>$/))) return parseInt(m[1], 10);
  if ((m = content.match(/^<double>(-?[\d.eE+-]+)<\/double>$/))) return parseFloat(m[1]);
  if ((m = content.match(/^<boolean>([01])<\/boolean>$/))) return m[1] === "1";
  if ((m = content.match(/^<string>([\s\S]*?)<\/string>$/))) return xmlUnescape(m[1]);
  if ((m = content.match(/^<datetime\.iso8601>([\s\S]*?)<\/datetime\.iso8601>$/))) return m[1];
  if (content === "<nil/>") return null;
  if (content.startsWith("<array>")) {
    const dataM = content.match(/<data>([\s\S]*)<\/data>/);
    if (!dataM) return [];
    return splitArrayValues(dataM[1]).map(parseValue);
  }
  if (content.startsWith("<struct>")) {
    const obj: Record<string, unknown> = {};
    const re = /<member>\s*<name>([\s\S]*?)<\/name>\s*<value>([\s\S]*?)<\/value>\s*<\/member>/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(content)) !== null) {
      obj[xmlUnescape(mm[1])] = parseValue(mm[2].trim());
    }
    return obj;
  }
  return content || null;
}

/** Depth-aware splitter for <value> entries inside <array><data>. */
function splitArrayValues(data: string): string[] {
  const values: string[] = [];
  let depth = 0;
  let start = -1;
  let i = 0;
  while (i < data.length) {
    if (data[i] === "<" && data[i + 1] !== "/" && !data.startsWith("<!--", i)) {
      if (depth === 0 && data.slice(i).startsWith("<value>")) start = i;
      depth++;
    } else if (data[i] === "<" && data[i + 1] === "/") {
      depth--;
      if (depth === 0 && start !== -1) {
        const end = data.indexOf(">", i) + 1;
        const slice = data.slice(start, end);
        values.push(slice.replace(/^<value>/, "").replace(/<\/value>$/, "").trim());
        start = -1;
      }
    }
    i++;
  }
  return values;
}

async function xmlrpcRaw(path: string, methodCall: string, params: unknown[]): Promise<unknown> {
  const body = `<?xml version="1.0"?><methodCall><methodName>${methodCall}</methodName><params>${params
    .map((p) => `<param>${serializeValue(p)}</param>`)
    .join("")}</params></methodCall>`;

  const res = await fetch(`${ODOO_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
  });
  if (!res.ok) {
    throw new OdooError(`HTTP ${res.status} ${res.statusText}`, "—", methodCall, "xmlrpc", res.status);
  }
  const text = await res.text();

  if (text.includes("<fault>")) {
    const faultMatch = text.match(/<name>faultString<\/name>\s*<value><string>([\s\S]*?)<\/string><\/value>/);
    const faultMsg = faultMatch ? xmlUnescape(faultMatch[1]) : "Unknown Odoo fault";
    throw new OdooError(`Odoo fault: ${faultMsg.slice(0, 200)}`, "—", methodCall, "xmlrpc");
  }

  const paramMatch = text.replace(/<\?xml[^>]*\?>/g, "").match(/<params>\s*<param>\s*<value>([\s\S]*?)<\/value>\s*<\/param>\s*<\/params>/);
  if (!paramMatch) return null;
  return parseValue(paramMatch[1].trim());
}

async function xmlrpcAuthenticate(): Promise<number> {
  const result = await odooAuthBreaker.fire(() =>
    xmlrpcRaw("/xmlrpc/2/common", "authenticate", [
      ODOO_DB,
      ENV.odooUsername,
      ENV.odooApiKey,
      {},
    ])
  );
  if (typeof result !== "number" || result === 0) {
    throw new OdooError("authenticate returned invalid UID", "res.users", "authenticate", "xmlrpc");
  }
  return result;
}

async function xmlrpcCall(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<unknown> {
  const uid = await getCachedUid(xmlrpcAuthenticate);
  return xmlrpcRaw("/xmlrpc/2/object", "execute_kw", [
    ODOO_DB,
    uid,
    ENV.odooApiKey,
    model,
    method,
    args,
    kwargs,
  ]);
}

// ─── XML-RPC ↔ JSON-2 argument translator ────────────────────────────────────

/**
 * The two protocols name their arguments differently. JSON-2 uses named
 * parameters in the request body; XML-RPC uses positional + kwargs.
 *
 * This translator takes the JSON-2 shape (the future) and converts to the
 * XML-RPC shape (the present), so callers in helpers.ts and modules/ write
 * to the JSON-2 contract and we adapt at the transport boundary.
 */
function jsonBodyToXmlrpcArgs(
  method: string,
  body: Record<string, unknown>,
): { args: unknown[]; kwargs: Record<string, unknown> } {
  switch (method) {
    case "search":
    case "search_read":
    case "search_count":
      return {
        args: [body.domain ?? []],
        kwargs: pruneUndefined({
          fields: body.fields,
          limit: body.limit,
          offset: body.offset,
          order: body.order,
          context: body.context,
        }),
      };
    case "read":
      return {
        args: [body.ids ?? []],
        kwargs: pruneUndefined({ fields: body.fields, context: body.context }),
      };
    case "create":
      return {
        args: [body.values ?? {}],
        kwargs: pruneUndefined({ context: body.context }),
      };
    case "write":
      return {
        args: [body.ids ?? [], body.values ?? {}],
        kwargs: pruneUndefined({ context: body.context }),
      };
    case "unlink":
      return {
        args: [body.ids ?? []],
        kwargs: pruneUndefined({ context: body.context }),
      };
    case "fields_get":
      return {
        args: [],
        kwargs: pruneUndefined({
          allfields: body.allfields,
          attributes: body.attributes,
          context: body.context,
        }),
      };
    default: {
      // Action methods (button_confirm, action_post, button_validate, etc.)
      // take ids as the first positional arg + optional kwargs.
      const { ids, context, ...rest } = body;
      return {
        args: [ids ?? []],
        kwargs: pruneUndefined({ ...rest, context }),
      };
    }
  }
}

function pruneUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
}

// ─── Divergence detection (parallel mode) ────────────────────────────────────

function structuralEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!structuralEquals(a[i], b[i])) return false;
    return true;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object).sort();
    const bk = Object.keys(b as object).sort();
    if (ak.length !== bk.length) return false;
    for (let i = 0; i < ak.length; i++) {
      if (ak[i] !== bk[i]) return false;
      if (!structuralEquals((a as Record<string, unknown>)[ak[i]], (b as Record<string, unknown>)[bk[i]])) return false;
    }
    return true;
  }
  return false;
}

function summarize(v: unknown): unknown {
  if (Array.isArray(v)) return { type: "array", length: v.length, sample: v.slice(0, 1) };
  if (v && typeof v === "object") return { type: "object", keys: Object.keys(v as object).slice(0, 8) };
  return { type: typeof v, value: String(v).slice(0, 80) };
}

// ─── Public dispatcher ───────────────────────────────────────────────────────

/**
 * The single entry point used by helpers.ts. Every call goes through here.
 * Honors the protocol flag, runs through the appropriate breaker, retries
 * once on auth failure (after invalidating the UID cache).
 */
export async function odoo<T>(
  model: string,
  method: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const protocol = getProtocol();
  const breaker = pickBreaker(method);

  const callJson2 = (): Promise<unknown> =>
    breaker.fire(() => jsonrpc2Call(model, method, body));

  const callXmlrpc = async (): Promise<unknown> => {
    const { args, kwargs } = jsonBodyToXmlrpcArgs(method, body);
    try {
      return await breaker.fire(() => xmlrpcCall(model, method, args, kwargs));
    } catch (err) {
      if (isAuthError(err)) {
        await invalidateUid();
        return await breaker.fire(() => xmlrpcCall(model, method, args, kwargs));
      }
      throw err;
    }
  };

  if (protocol === "jsonrpc-2") {
    return (await callJson2()) as T;
  }

  if (protocol === "xmlrpc") {
    return (await callXmlrpc()) as T;
  }

  // Parallel mode: call both, return XML-RPC (still trusted), log divergence.
  // We deliberately don't await JSON-2 if XML-RPC fails — XML-RPC is the source
  // of truth for now, and the user's request shouldn't fail because the
  // shadow call had a problem.
  const xmlrpcPromise = callXmlrpc();
  const jsonrpcPromise = callJson2().catch((err) => {
    logger.warn({ model, method, err: (err as Error).message }, "[odoo:parallel] json-2 shadow call failed");
    return Symbol.for("shadow-failed");
  });

  const [xmlrpcResult, jsonrpcResult] = await Promise.all([xmlrpcPromise, jsonrpcPromise]);

  if (jsonrpcResult !== Symbol.for("shadow-failed")) {
    const diverged = !structuralEquals(xmlrpcResult, jsonrpcResult);
    if (diverged) {
      logger.warn(
        {
          model,
          method,
          xmlrpcSummary: summarize(xmlrpcResult),
          jsonrpcSummary: summarize(jsonrpcResult),
        },
        "[odoo:parallel] result divergence detected"
      );
    } else {
      logger.debug({ model, method }, "[odoo:parallel] match");
    }
  }

  return xmlrpcResult as T;
}
