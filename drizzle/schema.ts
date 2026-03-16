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

/**
 * NEO Chat/Intercom — Conversation threads.
 * Each conversation is a named thread (direct, group, or AI assistant).
 * type: 'direct' = 1-on-1, 'group' = team channel, 'ai' = NEO AI assistant thread
 */
export const neoConversations = mysqlTable("neo_conversations", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["direct", "group", "ai"]).notNull().default("ai"),
  createdBy: int("createdBy").notNull(),
  // For AI conversations: tracks the routing engine used
  lastEngine: mysqlEnum("lastEngine", ["manus", "gpt", "hybrid"]).default("manus"),
  // Metadata: participant count, last message preview
  participantIds: json("participantIds"), // array of user IDs
  lastMessageAt: timestamp("lastMessageAt").defaultNow(),
  lastMessagePreview: varchar("lastMessagePreview", { length: 256 }),
  isArchived: boolean("isArchived").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NeoConversation = typeof neoConversations.$inferSelect;
export type InsertNeoConversation = typeof neoConversations.$inferInsert;

/**
 * NEO Chat/Intercom — Individual messages.
 * senderType: 'user' = human, 'ai' = NEO AI response, 'system' = automated notification
 * For AI messages: engine, routingScore, and contextUsed are populated.
 */
export const neoMessages = mysqlTable("neo_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "ai", "system"]).notNull().default("user"),
  senderUserId: int("senderUserId"), // null for AI/system messages
  body: text("body").notNull(),
  // AI routing metadata (populated for AI messages)
  engine: mysqlEnum("engine", ["manus", "gpt", "hybrid"]),
  routingScore: json("routingScore"),   // { manusScore, gptScore, hybridBoost, keywordHits }
  contextUsed: json("contextUsed"),     // { files, decisions, meetings referenced }
  // File attachments
  attachments: json("attachments"),     // array of { name, url, mimeType, sizeBytes }
  // Message status
  isRead: boolean("isRead").notNull().default(false),
  isDeleted: boolean("isDeleted").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NeoMessage = typeof neoMessages.$inferSelect;
export type InsertNeoMessage = typeof neoMessages.$inferInsert;

/**
 * Request & Approval Engine (M3 of Phase 2)
 * Structured request workflow with authority matrix enforcement.
 * Supports: Leave, Purchase, Contract, Travel, Expense, IT Access, HR Change, Custom
 */
export const requests = mysqlTable("requests", {
  id: int("id").autoincrement().primaryKey(),
  requestNumber: varchar("requestNumber", { length: 32 }).notNull().unique(), // GT-REQ-0001
  type: mysqlEnum("type", [
    "leave", "purchase", "contract", "travel", "expense",
    "it_access", "hr_change", "custom"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  // Requester
  requestedBy: int("requestedBy").notNull(),
  requestedByName: varchar("requestedByName", { length: 128 }),
  requestedByDept: varchar("requestedByDept", { length: 64 }),
  // Financial context (for purchase/expense/contract)
  amountSar: bigint("amountSar", { mode: "number" }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  // Status lifecycle: draft -> pending -> in_review -> approved / rejected / cancelled
  status: mysqlEnum("status", [
    "draft", "pending", "in_review", "approved", "rejected", "cancelled"
  ]).notNull().default("pending"),
  // ASTRA AMG authority matrix result
  astraOutcome: mysqlEnum("astraOutcome", ["ALLOW", "DENY", "ESCALATE", "DEGRADE"]),
  astraReasonCode: varchar("astraReasonCode", { length: 128 }),
  astraDecisionId: varchar("astraDecisionId", { length: 64 }),
  // Approval chain: current step index
  currentStep: int("currentStep").notNull().default(0),
  totalSteps: int("totalSteps").notNull().default(1),
  // Request payload (type-specific fields as JSON)
  payload: json("payload"),
  // Attached files from Drive Vault
  attachedFileIds: json("attachedFileIds"), // array of vault_files.id
  // Priority
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).notNull().default("normal"),
  // Dates
  dueDate: varchar("dueDate", { length: 32 }),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Request = typeof requests.$inferSelect;
export type InsertRequest = typeof requests.$inferInsert;

/**
 * Approval Steps — Each step in the approval chain for a request.
 * Ordered by stepOrder. All steps must be approved for the request to be approved.
 * If any step is rejected, the request is rejected immediately.
 */
export const approvalSteps = mysqlTable("approval_steps", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  stepOrder: int("stepOrder").notNull().default(1),
  approverRole: varchar("approverRole", { length: 64 }).notNull(), // e.g. "manager", "director", "ceo"
  approverUserId: int("approverUserId"),  // null = any user with the role can approve
  approverName: varchar("approverName", { length: 128 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "skipped"]).notNull().default("pending"),
  isCurrent: boolean("isCurrent").notNull().default(false),
  // SLA: hours allowed for this step
  slaHours: int("slaHours").notNull().default(48),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ApprovalStep = typeof approvalSteps.$inferSelect;
export type InsertApprovalStep = typeof approvalSteps.$inferInsert;

/**
 * Approval Actions — Audit log of every approve/reject/comment action taken.
 * Immutable once written — ISO 9001 audit trail.
 */
export const approvalActions = mysqlTable("approval_actions", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull(),
  stepId: int("stepId").notNull(),
  actorUserId: int("actorUserId").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  actorRole: varchar("actorRole", { length: 64 }),
  action: mysqlEnum("action", ["approve", "reject", "comment", "escalate", "cancel"]).notNull(),
  comment: text("comment"),
  // ASTRA AMG decision reference
  astraDecisionId: varchar("astraDecisionId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApprovalAction = typeof approvalActions.$inferSelect;
export type InsertApprovalAction = typeof approvalActions.$inferInsert;

/**
 * NEO AI Usage Log — Token and cost tracking for every AI call.
 * Records which module, engine, user, token counts, and estimated cost.
 * Used to replace hardcoded cost estimates on NEO Core metrics page with real data.
 * Rows are append-only — never updated or deleted.
 */
export const neoAiUsage = mysqlTable("neo_ai_usage", {
  id: int("id").autoincrement().primaryKey(),
  // Which NEO module triggered this call
  module: varchar("module", { length: 64 }).notNull(), // e.g. "financial", "risk", "decision", "critical", "qms", "business", "conversational", "chat"
  // Which engine handled it
  engine: mysqlEnum("engine", ["gpt", "manus", "hybrid"]).notNull(),
  // OpenAI model name (e.g. "gpt-4o") or Manus model name
  modelName: varchar("modelName", { length: 64 }).notNull().default("unknown"),
  // Token counts (0 for Manus Forge calls where tokens are not exposed)
  promptTokens: int("promptTokens").notNull().default(0),
  completionTokens: int("completionTokens").notNull().default(0),
  totalTokens: int("totalTokens").notNull().default(0),
  // Estimated cost in USD (calculated at write time using known pricing)
  // GPT-4o pricing as of 2025: $2.50/1M input tokens, $10.00/1M output tokens
  // Source: https://openai.com/api/pricing/ — update if pricing changes
  estimatedCostUsd: varchar("estimatedCostUsd", { length: 16 }).notNull().default("0.000000"),
  // The first 200 chars of the user query (for debugging, not stored in full)
  queryPreview: varchar("queryPreview", { length: 200 }),
  // User who triggered the call (null for system calls)
  userId: int("userId"),
  userName: varchar("userName", { length: 128 }),
  // Response latency in milliseconds
  latencyMs: int("latencyMs").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NeoAiUsage = typeof neoAiUsage.$inferSelect;
export type InsertNeoAiUsage = typeof neoAiUsage.$inferInsert;

// ─── QMS Module — Non-Conformance Reports & Quality Incidents ─────────────────
export const qmsIncidents = mysqlTable("qms_incidents", {
  id: int("id").autoincrement().primaryKey(),
  incidentCode: varchar("incidentCode", { length: 32 }),
  title: varchar("title", { length: 256 }).notNull(),
  titleAr: varchar("titleAr", { length: 256 }),
  area: varchar("area", { length: 128 }),
  areaAr: varchar("areaAr", { length: 128 }),
  description: text("description"),
  severity: mysqlEnum("severity", ["critical", "major", "minor", "observation"]).default("minor").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  assignedTo: varchar("assignedTo", { length: 128 }),
  rootCause: text("rootCause"),
  correctiveAction: text("correctiveAction"),
  dueDate: varchar("dueDate", { length: 32 }),
  closedAt: timestamp("closedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QmsIncident = typeof qmsIncidents.$inferSelect;
export type InsertQmsIncident = typeof qmsIncidents.$inferInsert;

// ─── ERP Module — Business Records (Sales, Invoices, Inventory) ───────────────
export const erpRecords = mysqlTable("erp_records", {
  id: int("id").autoincrement().primaryKey(),
  recordNumber: varchar("recordNumber", { length: 32 }),
  type: mysqlEnum("type", ["sale", "invoice", "purchase", "inventory", "expense", "other"]).default("sale").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  titleAr: varchar("titleAr", { length: 256 }),
  party: varchar("party", { length: 128 }),
  partyAr: varchar("partyAr", { length: 128 }),
  amount: bigint("amount", { mode: "number" }),
  currency: varchar("currency", { length: 8 }).default("SAR"),
  status: mysqlEnum("status", ["draft", "pending", "approved", "paid", "cancelled"]).default("draft").notNull(),
  dueDate: varchar("dueDate", { length: 32 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ErpRecord = typeof erpRecords.$inferSelect;
export type InsertErpRecord = typeof erpRecords.$inferInsert;

// ─── CRM Module — Contacts, Leads & Pipeline ──────────────────────────────────
export const crmContacts = mysqlTable("crm_contacts", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  fullNameAr: varchar("fullNameAr", { length: 128 }),
  company: varchar("company", { length: 128 }),
  companyAr: varchar("companyAr", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  type: mysqlEnum("type", ["lead", "prospect", "client", "partner"]).default("lead").notNull(),
  stage: mysqlEnum("stage", ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).default("new").notNull(),
  dealValue: bigint("dealValue", { mode: "number" }),
  probability: int("probability").default(0),
  source: varchar("source", { length: 64 }),
  assignedTo: varchar("assignedTo", { length: 128 }),
  notes: text("notes"),
  lastContactDate: varchar("lastContactDate", { length: 32 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

// ─── Legal Module — Contracts & Legal Cases ────────────────────────────────────
export const legalCases = mysqlTable("legal_cases", {
  id: int("id").autoincrement().primaryKey(),
  caseNumber: varchar("caseNumber", { length: 32 }),
  title: varchar("title", { length: 256 }).notNull(),
  titleAr: varchar("titleAr", { length: 256 }),
  type: mysqlEnum("type", ["contract", "dispute", "compliance", "ip", "employment", "other"]).default("contract").notNull(),
  party: varchar("party", { length: 128 }),
  partyAr: varchar("partyAr", { length: 128 }),
  value: bigint("value", { mode: "number" }),
  status: mysqlEnum("status", ["draft", "active", "expiring_soon", "expired", "closed", "disputed"]).default("draft").notNull(),
  startDate: varchar("startDate", { length: 32 }),
  expiryDate: varchar("expiryDate", { length: 32 }),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  assignedTo: varchar("assignedTo", { length: 128 }),
  notes: text("notes"),
  closedAt: timestamp("closedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LegalCase = typeof legalCases.$inferSelect;
export type InsertLegalCase = typeof legalCases.$inferInsert;
