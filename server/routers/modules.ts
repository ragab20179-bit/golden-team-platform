/**
 * Modules Router — HR, KPI, Procurement
 *
 * Provides bulk import procedures for each module, backed by the
 * hr_employees, kpi_targets, and procurement_items tables.
 * Also provides list/count queries for each module.
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { getDb } from "../db.js";
import { hrEmployees, kpiTargets, procurementItems } from "../../drizzle/schema.js";
import { desc } from "drizzle-orm";

// ─── HR ───────────────────────────────────────────────────────────────────────

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

// ─── KPI ──────────────────────────────────────────────────────────────────────

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

// ─── Procurement ──────────────────────────────────────────────────────────────

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

    count: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0 };
      const rows = await db.select().from(hrEmployees);
      return { total: rows.length };
    }),

    bulkImport: protectedProcedure
      .input(z.object({
        entries: z.array(hrEmployeeSchema),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(hrEmployees).values({
              ...entry,
              email: entry.email || null,
              contractType: entry.contractType ?? "full_time",
              status: entry.status ?? "active",
              importedBy: ctx.user.id,
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

  // ── KPI ────────────────────────────────────────────────────────────────────────────────
  kpi: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(kpiTargets).orderBy(desc(kpiTargets.createdAt)).limit(input?.limit ?? 100);
      }),

    count: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0 };
      const rows = await db.select().from(kpiTargets);
      return { total: rows.length };
    }),

    bulkImport: protectedProcedure
      .input(z.object({
        entries: z.array(kpiTargetSchema),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(kpiTargets).values({
              ...entry,
              status: entry.status ?? "on_track",
              importedBy: ctx.user.id,
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

  // ── Procurement ──────────────────────────────────────────────────────────────────────────────────────
  procurement: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(procurementItems).orderBy(desc(procurementItems.createdAt)).limit(input?.limit ?? 100);
      }),

    count: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { total: 0 };
      const rows = await db.select().from(procurementItems);
      return { total: rows.length };
    }),

    bulkImport: protectedProcedure
      .input(z.object({
        entries: z.array(procurementItemSchema),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        for (const entry of input.entries) {
          try {
            await db.insert(procurementItems).values({
              ...entry,
              currency: entry.currency ?? "SAR",
              status: entry.status ?? "pending",
              importedBy: ctx.user.id,
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
});
