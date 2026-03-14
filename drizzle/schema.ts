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

/**
 * Drive Vault — Universal file storage.
 * Stores metadata + S3 reference for every uploaded file.
 * Parsed text and AI summary are extracted server-side after upload.
 */
export const vaultFiles = mysqlTable("vault_files", {
  id: int("id").autoincrement().primaryKey(),
  uploadedBy: int("uploadedBy").notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: int("sizeBytes").notNull().default(0),
  s3Key: text("s3Key").notNull(),
  s3Url: text("s3Url").notNull(),
  folder: varchar("folder", { length: 64 }).notNull().default("general"),
  // Context linking: ties files to specific meetings, projects, etc.
  contextType: varchar("contextType", { length: 64 }), // e.g. "meeting", "project", "hr", "kpi"
  contextId: varchar("contextId", { length: 128 }),    // e.g. meeting ID or project ID
  parsedText: text("parsedText"),
  parsedMeta: json("parsedMeta"),
  aiSummary: text("aiSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VaultFile = typeof vaultFiles.$inferSelect;
export type InsertVaultFile = typeof vaultFiles.$inferInsert;

/**
 * HR Module — Employee records.
 * Supports bulk import from CSV/Excel via BulkImportDialog.
 */
export const hrEmployees = mysqlTable("hr_employees", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: varchar("employeeId", { length: 32 }),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  fullNameAr: varchar("fullNameAr", { length: 128 }),
  jobTitle: varchar("jobTitle", { length: 128 }),
  department: varchar("department", { length: 64 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  nationality: varchar("nationality", { length: 64 }),
  contractType: mysqlEnum("contractType", ["full_time", "part_time", "contract", "intern"]).default("full_time"),
  startDate: varchar("startDate", { length: 32 }),
  salary: bigint("salary", { mode: "number" }),
  status: mysqlEnum("status", ["active", "inactive", "on_leave"]).default("active").notNull(),
  notes: text("notes"),
  importedBy: int("importedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type HrEmployee = typeof hrEmployees.$inferSelect;
export type InsertHrEmployee = typeof hrEmployees.$inferInsert;

/**
 * KPI Module — KPI targets.
 * Supports bulk import from CSV/Excel via BulkImportDialog.
 */
export const kpiTargets = mysqlTable("kpi_targets", {
  id: int("id").autoincrement().primaryKey(),
  kpiCode: varchar("kpiCode", { length: 32 }),
  name: varchar("name", { length: 128 }).notNull(),
  nameAr: varchar("nameAr", { length: 128 }),
  category: varchar("category", { length: 64 }),
  unit: varchar("unit", { length: 32 }),
  targetValue: varchar("targetValue", { length: 32 }),
  actualValue: varchar("actualValue", { length: 32 }),
  period: varchar("period", { length: 32 }),
  owner: varchar("owner", { length: 128 }),
  status: mysqlEnum("status", ["on_track", "at_risk", "off_track", "achieved"]).default("on_track").notNull(),
  notes: text("notes"),
  importedBy: int("importedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KpiTarget = typeof kpiTargets.$inferSelect;
export type InsertKpiTarget = typeof kpiTargets.$inferInsert;

/**
 * Procurement Module — Purchase orders and supplier items.
 * Supports bulk import from CSV/Excel via BulkImportDialog.
 */
export const procurementItems = mysqlTable("procurement_items", {
  id: int("id").autoincrement().primaryKey(),
  poNumber: varchar("poNumber", { length: 32 }),
  itemName: varchar("itemName", { length: 128 }).notNull(),
  itemNameAr: varchar("itemNameAr", { length: 128 }),
  supplier: varchar("supplier", { length: 128 }),
  category: varchar("category", { length: 64 }),
  quantity: varchar("quantity", { length: 32 }),
  unit: varchar("unit", { length: 32 }),
  unitPrice: bigint("unitPrice", { mode: "number" }),
  totalPrice: bigint("totalPrice", { mode: "number" }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  deliveryDate: varchar("deliveryDate", { length: 32 }),
  status: mysqlEnum("status", ["pending", "approved", "ordered", "received", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  importedBy: int("importedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProcurementItem = typeof procurementItems.$inferSelect;
export type InsertProcurementItem = typeof procurementItems.$inferInsert;
