/**
 * Modules Router — HR, KPI, Procurement, QMS, ERP, CRM, Legal
 *
 * Full CRUD procedures for all 7 operational modules.
 * Each module has: list, stats, add, update, delete (soft or hard).
 * HR/KPI/Procurement also retain bulkImport from Phase 7.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import {
  hrEmployees, kpiTargets, procurementItems,
  qmsIncidents, erpRecords, crmContacts, legalCases,
} from "../../drizzle/schema.js";
import { desc, eq, and, sql } from "drizzle-orm";

// ─── Input Schemas ─────────────────────────────────────────────────────────────

const hrEmployeeSchema = z.object({
  employeeId: z.string().optional(),
  fullName: z.string().min(1),
  fullNameAr: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  contractType: z.enum(["full_time", "part_time", "contract", "intern"]).optional(),
  startDate: z.string().optional(),
  salary: z.number().optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
  notes: z.string().optional(),
});

const kpiTargetSchema = z.object({
  kpiCode: z.string().optional(),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  targetValue: z.string().optional(),
  actualValue: z.string().optional(),
  period: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(["on_track", "at_risk", "off_track", "achieved"]).optional(),
  notes: z.string().optional(),
});

const procurementItemSchema = z.object({
  poNumber: z.string().optional(),
  itemName: z.string().min(1),
  itemNameAr: z.string().optional(),
  supplier: z.string().optional(),
  category: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
  totalPrice: z.number().optional(),
  currency: z.string().optional(),
  deliveryDate: z.string().optional(),
  status: z.enum(["pending", "approved", "ordered", "received", "cancelled"]).optional(),
  notes: z.string().optional(),
});

const qmsIncidentSchema = z.object({
  incidentCode: z.string().optional(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  area: z.string().optional(),
  areaAr: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["critical", "major", "minor", "observation"]).optional(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  assignedTo: z.string().optional(),
  rootCause: z.string().optional(),
  correctiveAction: z.string().optional(),
  dueDate: z.string().optional(),
});

const erpRecordSchema = z.object({
  recordNumber: z.string().optional(),
  type: z.enum(["sale", "invoice", "purchase", "inventory", "expense", "other"]).optional(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  party: z.string().optional(),
  partyAr: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  status: z.enum(["draft", "pending", "approved", "paid", "cancelled"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

const crmContactSchema = z.object({
  fullName: z.string().min(1),
  fullNameAr: z.string().optional(),
  company: z.string().optional(),
  companyAr: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  type: z.enum(["lead", "prospect", "client", "partner"]).optional(),
  stage: z.enum(["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"]).optional(),
  dealValue: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  source: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  lastContactDate: z.string().optional(),
});

const legalCaseSchema = z.object({
  caseNumber: z.string().optional(),
  title: z.string().min(1),
  titleAr: z.string().optional(),
  type: z.enum(["contract", "dispute", "compliance", "ip", "employment", "other"]).optional(),
  party: z.string().optional(),
  partyAr: z.string().optional(),
  value: z.number().optional(),
  status: z.enum(["draft", "active", "expiring_soon", "expired", "closed", "disputed"]).optional(),
  startDate: z.string().optional(),
  expiryDate: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const modulesRouter = router({

  // ── HR ──────────────────────────────────────────────────────────────────────
  hr: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(hrEmployees).orderBy(desc(hrEmployees.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, onLeave: 0, inactive: 0 };
      const rows = await db.select().from(hrEmployees);
      return {
        total: rows.length,
        active: rows.filter(r => r.status === "active").length,
        onLeave: rows.filter(r => r.status === "on_leave").length,
        inactive: rows.filter(r => r.status === "inactive").length,
        departments: Array.from(new Set(rows.map(r => r.department).filter(Boolean))),
      };
    }),

    add: protectedProcedure
      .input(hrEmployeeSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [result] = await db.insert(hrEmployees).values({
          ...input,
          email: input.email || null,
          contractType: input.contractType ?? "full_time",
          status: input.status ?? "active",
          importedBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: hrEmployeeSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(hrEmployees).set(input.data).where(eq(hrEmployees.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(hrEmployees).where(eq(hrEmployees.id, input.id));
        return { success: true };
      }),

    bulkImport: protectedProcedure
      .input(z.object({ entries: z.array(hrEmployeeSchema) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0; let failed = 0; const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(hrEmployees).values({
              ...entry, email: entry.email || null,
              contractType: entry.contractType ?? "full_time",
              status: entry.status ?? "active", importedBy: ctx.user.id,
            });
            success++;
          } catch (err: unknown) {
            failed++;
            errors.push(`${entry.fullName}: ${err instanceof Error ? err.message : "Insert failed"}`);
          }
        }
        return { success, failed, errors };
      }),
  }),

  // ── KPI ────────────────────────────────────────────────────────────────────
  kpi: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(kpiTargets).orderBy(desc(kpiTargets.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, achieved: 0 };
      const rows = await db.select().from(kpiTargets);
      return {
        total: rows.length,
        onTrack: rows.filter(r => r.status === "on_track").length,
        atRisk: rows.filter(r => r.status === "at_risk").length,
        offTrack: rows.filter(r => r.status === "off_track").length,
        achieved: rows.filter(r => r.status === "achieved").length,
        categories: Array.from(new Set(rows.map(r => r.category).filter(Boolean))),
      };
    }),

    add: protectedProcedure
      .input(kpiTargetSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [result] = await db.insert(kpiTargets).values({
          ...input, status: input.status ?? "on_track", importedBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: kpiTargetSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(kpiTargets).set(input.data).where(eq(kpiTargets.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(kpiTargets).where(eq(kpiTargets.id, input.id));
        return { success: true };
      }),

    bulkImport: protectedProcedure
      .input(z.object({ entries: z.array(kpiTargetSchema) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0; let failed = 0; const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(kpiTargets).values({
              ...entry, status: entry.status ?? "on_track", importedBy: ctx.user.id,
            });
            success++;
          } catch (err: unknown) {
            failed++;
            errors.push(`${entry.name}: ${err instanceof Error ? err.message : "Insert failed"}`);
          }
        }
        return { success, failed, errors };
      }),
  }),

  // ── Procurement ────────────────────────────────────────────────────────────
  procurement: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(procurementItems).orderBy(desc(procurementItems.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, pending: 0, approved: 0, ordered: 0, received: 0, cancelled: 0, totalValueSar: 0 };
      const rows = await db.select().from(procurementItems);
      const totalValueSar = rows.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0);
      return {
        total: rows.length,
        pending: rows.filter(r => r.status === "pending").length,
        approved: rows.filter(r => r.status === "approved").length,
        ordered: rows.filter(r => r.status === "ordered").length,
        received: rows.filter(r => r.status === "received").length,
        cancelled: rows.filter(r => r.status === "cancelled").length,
        totalValueSar,
        suppliers: Array.from(new Set(rows.map(r => r.supplier).filter(Boolean))),
      };
    }),

    add: protectedProcedure
      .input(procurementItemSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [result] = await db.insert(procurementItems).values({
          ...input, currency: input.currency ?? "SAR",
          status: input.status ?? "pending", importedBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: procurementItemSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(procurementItems).set(input.data).where(eq(procurementItems.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(procurementItems).where(eq(procurementItems.id, input.id));
        return { success: true };
      }),

    bulkImport: protectedProcedure
      .input(z.object({ entries: z.array(procurementItemSchema) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0; let failed = 0; const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(procurementItems).values({
              ...entry, currency: entry.currency ?? "SAR",
              status: entry.status ?? "pending", importedBy: ctx.user.id,
            });
            success++;
          } catch (err: unknown) {
            failed++;
            errors.push(`${entry.itemName}: ${err instanceof Error ? err.message : "Insert failed"}`);
          }
        }
        return { success, failed, errors };
      }),
  }),

  // ── QMS ────────────────────────────────────────────────────────────────────
  qms: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(qmsIncidents).orderBy(desc(qmsIncidents.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, critical: 0, major: 0 };
      const rows = await db.select().from(qmsIncidents);
      return {
        total: rows.length,
        open: rows.filter(r => r.status === "open").length,
        inProgress: rows.filter(r => r.status === "in_progress").length,
        resolved: rows.filter(r => r.status === "resolved").length,
        closed: rows.filter(r => r.status === "closed").length,
        critical: rows.filter(r => r.severity === "critical").length,
        major: rows.filter(r => r.severity === "major").length,
        areas: Array.from(new Set(rows.map(r => r.area).filter(Boolean))),
      };
    }),

    add: protectedProcedure
      .input(qmsIncidentSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        // Auto-generate incident code if not provided
        const code = input.incidentCode ?? `NCR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        const [result] = await db.insert(qmsIncidents).values({
          ...input, incidentCode: code,
          severity: input.severity ?? "minor",
          status: input.status ?? "open",
          createdBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId, incidentCode: code };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: qmsIncidentSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(qmsIncidents).set(input.data).where(eq(qmsIncidents.id, input.id));
        return { success: true };
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number().int(), correctiveAction: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(qmsIncidents).set({
          status: "closed",
          correctiveAction: input.correctiveAction,
          closedAt: new Date(),
        }).where(eq(qmsIncidents.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(qmsIncidents).where(eq(qmsIncidents.id, input.id));
        return { success: true };
      }),
  }),

  // ── ERP ────────────────────────────────────────────────────────────────────
  erp: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(erpRecords).orderBy(desc(erpRecords.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, totalRevenueSar: 0, totalExpensesSar: 0, pending: 0, paid: 0 };
      const rows = await db.select().from(erpRecords);
      const revenue = rows.filter(r => ["sale", "invoice"].includes(r.type)).reduce((s, r) => s + (r.amount ?? 0), 0);
      const expenses = rows.filter(r => ["purchase", "expense"].includes(r.type)).reduce((s, r) => s + (r.amount ?? 0), 0);
      return {
        total: rows.length,
        totalRevenueSar: revenue,
        totalExpensesSar: expenses,
        netSar: revenue - expenses,
        pending: rows.filter(r => r.status === "pending").length,
        paid: rows.filter(r => r.status === "paid").length,
        draft: rows.filter(r => r.status === "draft").length,
        byType: {
          sale: rows.filter(r => r.type === "sale").length,
          invoice: rows.filter(r => r.type === "invoice").length,
          purchase: rows.filter(r => r.type === "purchase").length,
          expense: rows.filter(r => r.type === "expense").length,
          inventory: rows.filter(r => r.type === "inventory").length,
        },
      };
    }),

    add: protectedProcedure
      .input(erpRecordSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const recNum = input.recordNumber ?? `ERP-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
        const [result] = await db.insert(erpRecords).values({
          ...input, recordNumber: recNum,
          type: input.type ?? "sale",
          currency: input.currency ?? "SAR",
          status: input.status ?? "draft",
          createdBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId, recordNumber: recNum };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: erpRecordSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(erpRecords).set(input.data).where(eq(erpRecords.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(erpRecords).where(eq(erpRecords.id, input.id));
        return { success: true };
      }),
  }),

  // ── CRM ────────────────────────────────────────────────────────────────────
  crm: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(crmContacts).orderBy(desc(crmContacts.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, leads: 0, clients: 0, won: 0, lost: 0, totalPipelineValueSar: 0 };
      const rows = await db.select().from(crmContacts);
      const pipeline = rows.filter(r => !["won", "lost"].includes(r.stage)).reduce((s, r) => s + (r.dealValue ?? 0), 0);
      const wonValue = rows.filter(r => r.stage === "won").reduce((s, r) => s + (r.dealValue ?? 0), 0);
      return {
        total: rows.length,
        leads: rows.filter(r => r.type === "lead").length,
        prospects: rows.filter(r => r.type === "prospect").length,
        clients: rows.filter(r => r.type === "client").length,
        partners: rows.filter(r => r.type === "partner").length,
        won: rows.filter(r => r.stage === "won").length,
        lost: rows.filter(r => r.stage === "lost").length,
        totalPipelineValueSar: pipeline,
        wonValueSar: wonValue,
        byStage: {
          new: rows.filter(r => r.stage === "new").length,
          contacted: rows.filter(r => r.stage === "contacted").length,
          qualified: rows.filter(r => r.stage === "qualified").length,
          proposal: rows.filter(r => r.stage === "proposal").length,
          negotiation: rows.filter(r => r.stage === "negotiation").length,
          won: rows.filter(r => r.stage === "won").length,
          lost: rows.filter(r => r.stage === "lost").length,
        },
      };
    }),

    add: protectedProcedure
      .input(crmContactSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const [result] = await db.insert(crmContacts).values({
          ...input, email: input.email || null,
          type: input.type ?? "lead",
          stage: input.stage ?? "new",
          probability: input.probability ?? 0,
          createdBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: crmContactSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(crmContacts).set(input.data).where(eq(crmContacts.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(crmContacts).where(eq(crmContacts.id, input.id));
        return { success: true };
      }),
  }),

  // ── Legal ──────────────────────────────────────────────────────────────────
  legal: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(legalCases).orderBy(desc(legalCases.createdAt)).limit(input?.limit ?? 100);
      }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, active: 0, expiringSoon: 0, expired: 0, disputed: 0, totalValueSar: 0 };
      const rows = await db.select().from(legalCases);
      return {
        total: rows.length,
        active: rows.filter(r => r.status === "active").length,
        draft: rows.filter(r => r.status === "draft").length,
        expiringSoon: rows.filter(r => r.status === "expiring_soon").length,
        expired: rows.filter(r => r.status === "expired").length,
        closed: rows.filter(r => r.status === "closed").length,
        disputed: rows.filter(r => r.status === "disputed").length,
        totalValueSar: rows.reduce((s, r) => s + (r.value ?? 0), 0),
        byType: {
          contract: rows.filter(r => r.type === "contract").length,
          dispute: rows.filter(r => r.type === "dispute").length,
          compliance: rows.filter(r => r.type === "compliance").length,
          employment: rows.filter(r => r.type === "employment").length,
          ip: rows.filter(r => r.type === "ip").length,
          other: rows.filter(r => r.type === "other").length,
        },
      };
    }),

    add: protectedProcedure
      .input(legalCaseSchema)
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const caseNum = input.caseNumber ?? `GT-LEGAL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
        const [result] = await db.insert(legalCases).values({
          ...input, caseNumber: caseNum,
          type: input.type ?? "contract",
          status: input.status ?? "draft",
          createdBy: ctx.user.id,
        });
        return { id: (result as { insertId: number }).insertId, caseNumber: caseNum };
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number().int(), data: legalCaseSchema.partial() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(legalCases).set(input.data).where(eq(legalCases.id, input.id));
        return { success: true };
      }),

    close: protectedProcedure
      .input(z.object({ id: z.number().int(), notes: z.string().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.update(legalCases).set({
          status: "closed", notes: input.notes, closedAt: new Date(),
        }).where(eq(legalCases.id, input.id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        await db.delete(legalCases).where(eq(legalCases.id, input.id));
        return { success: true };
      }),
  }),
});
