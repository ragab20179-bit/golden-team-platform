/**
 * server/odoo/auth.ts
 *
 * Redis-cached UID resolution for the legacy XML-RPC path.
 *
 * Why this exists:
 *   The original `let _uid: number | null = null` module-level cache has two
 *   problems flagged in the Odoo Integration Study (Section 11.4):
 *     1. Multi-instance deployments — each Node process holds its own cache,
 *        so authentication happens N times instead of once.
 *     2. Serverless cold starts — a warm instance may carry a stale UID across
 *        Odoo session timeouts (8 hours by default).
 *
 *   Solution: cache the UID in Redis DB 0 with an 8-hour TTL matching Odoo's
 *   default session lifetime. All instances share one cached value.
 *
 * The JSON-2 path doesn't need this — it authenticates per-request via Bearer
 * token header, no session concept. So this file only matters during the
 * parallel-run window and goes away when XML-RPC is removed (PR #3).
 */

import { ENV } from "../_core/env";
import { safeRedis } from "../_core/redis";
import { logger } from "../_core/logger";

const ODOO_DB = ENV.odooDb ?? "goldenteam";
const UID_CACHE_KEY = `odoo:uid:${ODOO_DB}`;
const UID_TTL_SEC = 8 * 60 * 60; // 8 hours — matches Odoo default session TTL

/**
 * Local in-process fallback. Used only when Redis is unavailable, so we don't
 * authenticate on every single request even during a Redis outage. Safe enough
 * because the worst case is one stale UID per instance for up to 8 hours.
 */
let processFallback: { uid: number; expiresAt: number } | null = null;

/**
 * Inject the XML-RPC authenticate function. We don't import `client.ts`
 * directly to avoid a cycle — `client.ts` uses `auth.ts`, not the other way
 * around. Pass the raw call function from the call site.
 */
type AuthenticateFn = () => Promise<number>;

export async function getCachedUid(authenticate: AuthenticateFn): Promise<number> {
  // 1. Try Redis
  const cached = await safeRedis(
    async (r) => {
      const v = await r.get(UID_CACHE_KEY);
      return v ? parseInt(v, 10) : null;
    },
    null,
    "cache"
  );
  if (cached && cached > 0) return cached;

  // 2. Try in-process fallback (Redis is down)
  if (processFallback && processFallback.expiresAt > Date.now()) {
    return processFallback.uid;
  }

  // 3. Authenticate against Odoo
  const uid = await authenticate();
  if (!uid || uid === 0) {
    throw new Error(
      "Odoo authentication failed — check ODOO_USERNAME and ODOO_API_KEY"
    );
  }

  // 4. Populate both caches
  await safeRedis(
    async (r) => r.set(UID_CACHE_KEY, String(uid), "EX", UID_TTL_SEC),
    "OK",
    "cache"
  );
  processFallback = { uid, expiresAt: Date.now() + UID_TTL_SEC * 1000 };

  logger.info(
    { uid, db: ODOO_DB, ttlSec: UID_TTL_SEC },
    "[odoo:auth] new UID cached"
  );
  return uid;
}

/**
 * Invalidate the UID cache. Call this when Odoo returns an authentication-
 * related error (e.g., session expired before TTL — should be rare but
 * possible if an admin revokes the API key mid-session).
 */
export async function invalidateUid(): Promise<void> {
  await safeRedis(
    async (r) => r.del(UID_CACHE_KEY),
    1,
    "cache"
  );
  processFallback = null;
  logger.info({ db: ODOO_DB }, "[odoo:auth] UID cache invalidated");
}
