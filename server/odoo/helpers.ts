/**
 * server/odoo/helpers.ts
 *
 * Generic ORM helpers — protocol-agnostic. Callers in modules/ use these;
 * they don't talk to client.ts directly. This is the seam where future
 * cross-cutting concerns (per-call caching, query logging, audit trail)
 * land without touching every call site.
 */

import { odoo } from "./client";

export interface SearchOpts {
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
}

/** Combined search + read in a single round-trip. The preferred method for lists. */
export async function odooSearchRead<T = Record<string, unknown>>(
  model: string,
  domain: unknown[][],
  fields: string[],
  opts: SearchOpts = {},
): Promise<T[]> {
  const result = await odoo<T[] | null>(model, "search_read", {
    domain,
    fields,
    // Always specify a limit. The Odoo Integration Study (Section 11.1) flags
    // unbounded reads as the #1 production performance issue. Default cap of
    // 100 matches the study's recommendation.
    limit: opts.limit ?? 100,
    offset: opts.offset ?? 0,
    ...(opts.order ? { order: opts.order } : {}),
    ...(opts.context ? { context: opts.context } : {}),
  });
  return result ?? [];
}

/** Read by ID list. Use search_read instead unless you already have IDs. */
export async function odooRead<T = Record<string, unknown>>(
  model: string,
  ids: number[],
  fields: string[],
  opts: { context?: Record<string, unknown> } = {},
): Promise<T[]> {
  if (ids.length === 0) return [];
  const result = await odoo<T[] | null>(model, "read", {
    ids,
    fields,
    ...(opts.context ? { context: opts.context } : {}),
  });
  return result ?? [];
}

/** Cardinality query. Cheap on Odoo's side, useful for dashboard counts. */
export async function odooSearchCount(
  model: string,
  domain: unknown[][],
  opts: { context?: Record<string, unknown> } = {},
): Promise<number> {
  const result = await odoo<number | null>(model, "search_count", {
    domain,
    ...(opts.context ? { context: opts.context } : {}),
  });
  return typeof result === "number" ? result : 0;
}

/** Create a record. Returns the new ID. */
export async function odooCreate(
  model: string,
  values: Record<string, unknown>,
  opts: { context?: Record<string, unknown> } = {},
): Promise<number> {
  const result = await odoo<number>(model, "create", {
    values,
    ...(opts.context ? { context: opts.context } : {}),
  });
  return typeof result === "number" ? result : 0;
}

/** Update one or more records with the same value-set. Returns true on success. */
export async function odooWrite(
  model: string,
  ids: number[],
  values: Record<string, unknown>,
  opts: { context?: Record<string, unknown> } = {},
): Promise<boolean> {
  const result = await odoo<boolean>(model, "write", {
    ids,
    values,
    ...(opts.context ? { context: opts.context } : {}),
  });
  return result === true;
}

/**
 * Call an action / workflow method (e.g. button_confirm, action_post,
 * button_validate). These are domain-specific operations Odoo exposes on
 * each model. The platform uses them sparingly — full list:
 *
 *   purchase.order.button_confirm  — confirm a draft PO
 *   account.move.action_post       — post an invoice/bill
 *   account.payment.action_post    — confirm a payment
 *   stock.picking.button_validate  — mark a delivery as received
 *
 * Returns whatever the action returns — usually `true` or a detail dict.
 */
export async function odooAction<T = unknown>(
  model: string,
  method: string,
  ids: number[],
  extra: Record<string, unknown> = {},
): Promise<T> {
  return odoo<T>(model, method, { ids, ...extra });
}
