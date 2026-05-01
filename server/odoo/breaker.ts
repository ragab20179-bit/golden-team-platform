/**
 * server/odoo/breaker.ts
 *
 * Circuit breakers for Odoo API calls.
 *
 * One breaker per logical operation domain — separate breakers for read vs
 * write so a stuck `create` call doesn't trip the read breaker, and separate
 * breakers per heavy operation (purchase, accounting, inventory) so a slow
 * accounting query doesn't take down the dashboard's purchase counter.
 *
 * Depends on the `createBreaker` helper from Phase 1 Hardening
 * (server/_core/circuitBreaker.ts).
 *
 * State exposure:
 *   `getOdooBreakerState()` is consumed by /admin/health to surface live
 *   breaker state per logical domain. Also consumed by the procurement /
 *   finance / supplier-bid NEO modules — when their relevant Odoo breaker
 *   is open, the AI prompt gets a "Note: Odoo data may be stale" hint so
 *   the model can flag the limitation in its response instead of silently
 *   working from cached numbers.
 */

import { createBreaker, type JarvisBreaker } from "../_core/circuitBreaker";

// ─── Per-domain breakers ─────────────────────────────────────────────────────

/**
 * Reads dominate traffic and tolerate higher failure rates without dramatic
 * impact. 50% threshold lets transient hiccups pass; 30s reset is short
 * enough to recover quickly when Odoo comes back.
 */
export const odooReadBreaker = createBreaker<unknown>("odoo.read", {
  timeoutMs: 10_000,
  errorThresholdPercent: 50,
  resetTimeoutMs: 30_000,
});

/**
 * Writes are rarer but each failure is more user-visible (creating a PO that
 * silently failed is much worse than a dashboard count being a few seconds
 * stale). Tighter threshold, longer cool-down.
 */
export const odooWriteBreaker = createBreaker<unknown>("odoo.write", {
  timeoutMs: 15_000,
  errorThresholdPercent: 30,
  resetTimeoutMs: 60_000,
});

/**
 * Authentication is its own breaker because an auth failure is qualitatively
 * different from a query failure and shouldn't trip the read/write breakers.
 * If auth is broken, every call will fail anyway — fast-fail on the auth
 * breaker first.
 */
export const odooAuthBreaker = createBreaker<unknown>("odoo.auth", {
  timeoutMs: 5_000,
  errorThresholdPercent: 30,
  resetTimeoutMs: 60_000,
});

// ─── Public state interface (for /admin/health and AI module hints) ──────────

export type BreakerState = "closed" | "open" | "halfOpen";

export interface OdooBreakerSnapshot {
  read: BreakerState;
  write: BreakerState;
  auth: BreakerState;
  /** True if any breaker is open — convenience for "is Odoo working?" checks */
  anyOpen: boolean;
  /** True if the auth breaker is open — distinct because all ops will fail */
  authOpen: boolean;
}

export function getOdooBreakerState(): OdooBreakerSnapshot {
  const read = odooReadBreaker.state();
  const write = odooWriteBreaker.state();
  const auth = odooAuthBreaker.state();
  return {
    read,
    write,
    auth,
    anyOpen: read === "open" || write === "open" || auth === "open",
    authOpen: auth === "open",
  };
}

/**
 * Pick the right breaker for a given operation.
 *
 *   pickBreaker("search_read") → odooReadBreaker
 *   pickBreaker("create")      → odooWriteBreaker
 *   pickBreaker("button_confirm") → odooWriteBreaker (mutates state)
 *
 * Used internally by client.ts. Exported so tests can verify the routing.
 */
export function pickBreaker(method: string): JarvisBreaker<unknown> {
  const READS = new Set([
    "search", "search_read", "search_count", "read",
    "fields_get", "name_search", "name_get", "default_get",
  ]);
  return READS.has(method) ? odooReadBreaker : odooWriteBreaker;
}
