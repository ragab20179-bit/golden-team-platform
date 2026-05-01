/**
 * server/odoo/modules/stats.ts
 *
 * Cross-module dashboard stats. Issues 7 search_count queries in parallel
 * and returns the aggregated counts. This is the single most-called Odoo
 * procedure in the platform — every load of the admin dashboard triggers
 * it. Important that it stays fast.
 *
 * When the read breaker is open, return last-known values from Redis cache
 * instead of throwing. The dashboard "looking stale" is far better UX than
 * an empty page or an error toast every 10 seconds.
 */

import { odooSearchCount } from "../helpers";
import { getOdooBreakerState } from "../breaker";
import { safeRedis } from "../../_core/redis";
import { logger } from "../../_core/logger";
import type { OdooStats } from "../types";

const STATS_CACHE_KEY = "odoo:stats:last";
const STATS_CACHE_TTL_SEC = 60 * 60; // 1h — stats are aggregate counts; staleness is cheap

export async function getOdooStats(): Promise<OdooStats & { stale: boolean }> {
  const breakers = getOdooBreakerState();

  // If the read breaker is open, serve last-known values from Redis.
  if (breakers.read === "open") {
    const cached = await safeRedis(
      async (r) => {
        const v = await r.get(STATS_CACHE_KEY);
        return v ? (JSON.parse(v) as OdooStats) : null;
      },
      null,
      "cache",
    );
    if (cached) {
      logger.info({}, "[odoo:stats] breaker open — returning cached stats");
      return { ...cached, stale: true };
    }
    // No cache and breaker open — return zeros rather than throwing
    return makeEmptyStats(true);
  }

  try {
    const [
      purchaseCount, invoiceCount, productCount,
      crmCount, projectCount, taskCount, supplierCount,
    ] = await Promise.all([
      odooSearchCount("purchase.order", []),
      odooSearchCount("account.move", [["move_type", "in", ["in_invoice", "out_invoice"]]]),
      odooSearchCount("product.product", [["active", "=", true]]),
      odooSearchCount("crm.lead", []),
      odooSearchCount("project.project", []),
      odooSearchCount("project.task", []),
      odooSearchCount("res.partner", [["supplier_rank", ">", 0]]),
    ]);

    const stats: OdooStats = {
      purchaseOrders: purchaseCount,
      invoices: invoiceCount,
      products: productCount,
      crmLeads: crmCount,
      projects: projectCount,
      tasks: taskCount,
      suppliers: supplierCount,
      lastSync: new Date().toISOString(),
    };

    // Best-effort cache update; failure is harmless
    await safeRedis(
      async (r) => r.set(STATS_CACHE_KEY, JSON.stringify(stats), "EX", STATS_CACHE_TTL_SEC),
      "OK",
      "cache",
    );

    return { ...stats, stale: false };
  } catch (err) {
    // Fall through to cache on error — same logic as breaker-open
    const cached = await safeRedis(
      async (r) => {
        const v = await r.get(STATS_CACHE_KEY);
        return v ? (JSON.parse(v) as OdooStats) : null;
      },
      null,
      "cache",
    );
    if (cached) {
      logger.warn({ err: (err as Error).message }, "[odoo:stats] live fetch failed — returning cached");
      return { ...cached, stale: true };
    }
    throw err;
  }
}

function makeEmptyStats(stale: boolean): OdooStats & { stale: boolean } {
  return {
    purchaseOrders: 0, invoices: 0, products: 0,
    crmLeads: 0, projects: 0, tasks: 0, suppliers: 0,
    lastSync: new Date(0).toISOString(),
    stale,
  };
}
