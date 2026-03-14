import { desc, eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  astraDecisions, InsertAstraDecision,
  astraPolicyRules, InsertAstraPolicyRule,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── ASTRA Decision Log ────────────────────────────────────────────────────────

/** Append a new decision to the immutable audit log. Never updates or deletes. */
export async function insertAstraDecision(decision: InsertAstraDecision): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[ASTRA] DB not available — decision not persisted:", decision.decisionId);
    return;
  }
  await db.insert(astraDecisions).values(decision);
}

/** Return the most recent N decisions (default 200). */
export async function getAstraDecisions(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(astraDecisions).orderBy(desc(astraDecisions.createdAt)).limit(limit);
}

/** Return decisions filtered by outcome. */
export async function getAstraDecisionsByOutcome(outcome: "ALLOW" | "DENY" | "ESCALATE" | "DEGRADE", limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(astraDecisions)
    .where(eq(astraDecisions.outcome, outcome))
    .orderBy(desc(astraDecisions.createdAt))
    .limit(limit);
}

// ─── ASTRA Policy Rules (Dynamic Authority Matrix) ─────────────────────────────

/** Return all dynamic policy rule overrides. */
export async function getAstraPolicyRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(astraPolicyRules).orderBy(astraPolicyRules.domain, astraPolicyRules.action);
}

/** Upsert a policy rule override (domain + action + role is the logical key). */
export async function upsertAstraPolicyRule(rule: InsertAstraPolicyRule): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if rule already exists
  const existing = await db.select({ id: astraPolicyRules.id })
    .from(astraPolicyRules)
    .where(and(
      eq(astraPolicyRules.domain, rule.domain),
      eq(astraPolicyRules.action, rule.action),
      eq(astraPolicyRules.role, rule.role),
    ))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    await db.update(astraPolicyRules)
      .set({
        allowed: rule.allowed,
        requireConsent: rule.requireConsent ?? false,
        requireJustification: rule.requireJustification ?? false,
        maxAmountSar: rule.maxAmountSar ?? null,
        notes: rule.notes ?? null,
        createdBy: rule.createdBy ?? null,
      })
      .where(eq(astraPolicyRules.id, existing[0].id));
  } else {
    await db.insert(astraPolicyRules).values(rule);
  }
}

/** Delete a specific policy rule override by id. */
export async function deleteAstraPolicyRule(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(astraPolicyRules).where(eq(astraPolicyRules.id, id));
}

export async function clearAstraDecisions(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.delete(astraDecisions);
  return (result as { affectedRows?: number }).affectedRows ?? 0;
}
