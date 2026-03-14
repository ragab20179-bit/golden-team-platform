import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ASTRA AMG — Append-only decision log.
 * Every ALLOW / DENY / ESCALATE / DEGRADE decision is written here.
 * Rows are NEVER updated or deleted — ISO 9001 audit trail requirement.
 */
export const astraDecisions = mysqlTable("astra_decisions", {
  id: int("id").autoincrement().primaryKey(),
  decisionId: varchar("decisionId", { length: 64 }).notNull().unique(),
  requestId: varchar("requestId", { length: 64 }).notNull(),
  actorId: varchar("actorId", { length: 128 }).notNull(),
  actorRole: varchar("actorRole", { length: 64 }).notNull(),
  domain: varchar("domain", { length: 64 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["ALLOW", "DENY", "ESCALATE", "DEGRADE"]).notNull(),
  reasonCode: varchar("reasonCode", { length: 128 }).notNull(),
  policyPackVersion: varchar("policyPackVersion", { length: 32 }).notNull(),
  latencyMs: int("latencyMs").notNull().default(0),
  contextSnapshot: json("contextSnapshot"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AstraDecision = typeof astraDecisions.$inferSelect;
export type InsertAstraDecision = typeof astraDecisions.$inferInsert;

/**
 * ASTRA AMG — Dynamic policy rules (Authority Matrix editor).
 * Overrides the static policy_pack for specific domain/action/role combinations.
 * When a row exists here, it takes precedence over the built-in policy pack.
 */
export const astraPolicyRules = mysqlTable("astra_policy_rules", {
  id: int("id").autoincrement().primaryKey(),
  domain: varchar("domain", { length: 64 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  allowed: boolean("allowed").notNull().default(true),
  requireConsent: boolean("requireConsent").notNull().default(false),
  requireJustification: boolean("requireJustification").notNull().default(false),
  maxAmountSar: bigint("maxAmountSar", { mode: "number" }),
  notes: text("notes"),
  createdBy: varchar("createdBy", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AstraPolicyRule = typeof astraPolicyRules.$inferSelect;
export type InsertAstraPolicyRule = typeof astraPolicyRules.$inferInsert;
