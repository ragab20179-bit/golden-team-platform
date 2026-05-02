import { getDb } from "../db";
import { odooAiEntries, InsertOdooAiEntry, OdooAiEntry } from "../../drizzle/schema";
import { desc, eq, and, gte, count, sql } from "drizzle-orm";

async function db() {
  const inst = await getDb();
  if (!inst) throw new Error("[odooAuditLog] Database not available");
  return inst;
}

// ─── Insert a new audit entry ─────────────────────────────────────────────────
export async function logOdooAiEntry(data: InsertOdooAiEntry): Promise<number> {
  const [result] = await (await db()).insert(odooAiEntries).values(data);
  return (result as { insertId: number }).insertId;
}

// ─── Update an existing entry (e.g. after execution completes) ────────────────
export async function updateOdooAiEntry(
  id: number,
  updates: Partial<Pick<OdooAiEntry, "status" | "odooRecordId" | "odooRecordName" | "errorMessage" | "odooResponse" | "executionMs">>
): Promise<void> {
  await (await db()).update(odooAiEntries).set(updates).where(eq(odooAiEntries.id, id));
}

// ─── Get paginated entries ────────────────────────────────────────────────────
export async function getOdooAiEntries(opts: {
  limit?: number;
  offset?: number;
  userId?: number;
  status?: "success" | "failed" | "pending" | "rejected";
  operation?: string;
  source?: "builtin" | "neo_bridge";
  since?: Date;
}): Promise<OdooAiEntry[]> {
  const { limit = 50, offset = 0, userId, status, operation, source, since } = opts;

  const conditions = [];
  if (userId !== undefined) conditions.push(eq(odooAiEntries.userId, userId));
  if (status) conditions.push(eq(odooAiEntries.status, status));
  if (operation) conditions.push(eq(odooAiEntries.operation, operation));
  if (source) conditions.push(eq(odooAiEntries.source, source));
  if (since) conditions.push(gte(odooAiEntries.createdAt, since));

  const dbInst = await db();
  const query = dbInst
    .select()
    .from(odooAiEntries)
    .orderBy(desc(odooAiEntries.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

// ─── Count total entries (for pagination) ────────────────────────────────────
export async function countOdooAiEntries(opts: {
  userId?: number;
  status?: "success" | "failed" | "pending" | "rejected";
  source?: "builtin" | "neo_bridge";
  since?: Date;
}): Promise<number> {
  const { userId, status, source, since } = opts;

  const conditions = [];
  if (userId !== undefined) conditions.push(eq(odooAiEntries.userId, userId));
  if (status) conditions.push(eq(odooAiEntries.status, status));
  if (source) conditions.push(eq(odooAiEntries.source, source));
  if (since) conditions.push(gte(odooAiEntries.createdAt, since));

  const dbInst = await db();
  const query = dbInst.select({ total: count() }).from(odooAiEntries);
  const [row] = conditions.length > 0
    ? await query.where(and(...conditions))
    : await query;

  return row?.total ?? 0;
}

// ─── Aggregate stats for dashboard KPI cards ─────────────────────────────────
export async function getOdooAiEntryStats(): Promise<{
  total: number;
  success: number;
  failed: number;
  pending: number;
  rejected: number;
  builtinCount: number;
  bridgeCount: number;
  avgExecutionMs: number | null;
  last24hCount: number;
  topOperations: Array<{ operation: string; count: number }>;
}> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const dbInst = await db();
  const [totals] = await dbInst
    .select({
      total: count(),
      success: sql<number>`SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
      pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
      rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
      builtinCount: sql<number>`SUM(CASE WHEN source = 'builtin' THEN 1 ELSE 0 END)`,
      bridgeCount: sql<number>`SUM(CASE WHEN source = 'neo_bridge' THEN 1 ELSE 0 END)`,
      avgExecutionMs: sql<number | null>`AVG(executionMs)`,
    })
    .from(odooAiEntries);

  const [last24h] = await dbInst
    .select({ total: count() })
    .from(odooAiEntries)
    .where(gte(odooAiEntries.createdAt, since24h));

  const topOps = await dbInst
    .select({
      operation: odooAiEntries.operation,
      count: count(),
    })
    .from(odooAiEntries)
    .groupBy(odooAiEntries.operation)
    .orderBy(desc(count()))
    .limit(8);

  return {
    total: totals?.total ?? 0,
    success: Number(totals?.success ?? 0),
    failed: Number(totals?.failed ?? 0),
    pending: Number(totals?.pending ?? 0),
    rejected: Number(totals?.rejected ?? 0),
    builtinCount: Number(totals?.builtinCount ?? 0),
    bridgeCount: Number(totals?.bridgeCount ?? 0),
    avgExecutionMs: totals?.avgExecutionMs ? Math.round(Number(totals.avgExecutionMs)) : null,
    last24hCount: last24h?.total ?? 0,
    topOperations: topOps.map((r: { operation: string; count: number }) => ({ operation: r.operation, count: r.count })),
  };
}

// ─── Get a single entry by ID ─────────────────────────────────────────────────
export async function getOdooAiEntryById(id: number): Promise<OdooAiEntry | undefined> {
  const [row] = await (await db())
    .select()
    .from(odooAiEntries)
    .where(eq(odooAiEntries.id, id))
    .limit(1);
  return row;
}

// ─── Admin: clear all entries (destructive — admin only) ─────────────────────
export async function clearOdooAiEntries(): Promise<number> {
  const [result] = await (await db()).delete(odooAiEntries);
  return (result as { affectedRows: number }).affectedRows;
}
