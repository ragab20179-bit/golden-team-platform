/**
 * Odoo Integration tRPC Router
 * Connects to goldenteam.odoo.com via the odoo.ts XML-RPC helper
 *
 * Modules covered:
 *   - Purchase (orders, lines, suppliers)
 *   - Accounting (invoices, payments, chart of accounts)
 *   - Inventory (products, stock pickings, warehouses)
 *   - CRM (leads/opportunities, stages)
 *   - Project (projects, tasks)
 *   - Dashboard stats (KPI summary across all modules)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getOdooStats,
  getPurchaseOrders,
  getPurchaseOrderLines,
  getSuppliers,
  getInvoices,
  getPayments,
  getChartOfAccounts,
  getProducts,
  getStockPickings,
  getWarehouses,
  getCrmLeads,
  getCrmStages,
  getProjects,
  getProjectTasks,
  odooSearchRead,
  odooCreate,
} from "../odoo";

// ── Error wrapper ──────────────────────────────────────────────────────────────
function handleOdooError(err: unknown, context: string): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[Odoo] ${context}:`, msg);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Odoo ${context} failed: ${msg.slice(0, 200)}`,
  });
}

// ── Router ─────────────────────────────────────────────────────────────────────
export const odooRouter = router({

  // ── Dashboard KPIs ──────────────────────────────────────────────────────────
  getStats: protectedProcedure.query(async () => {
    try {
      return await getOdooStats();
    } catch (err) {
      handleOdooError(err, "getStats");
    }
  }),

  // ── Purchase Module ──────────────────────────────────────────────────────────
  getPurchaseOrders: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      try {
        return await getPurchaseOrders(input.limit);
      } catch (err) {
        handleOdooError(err, "getPurchaseOrders");
      }
    }),

  getPurchaseOrderLines: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive().optional() }))
    .query(async ({ input }) => {
      try {
        return await getPurchaseOrderLines(input.orderId);
      } catch (err) {
        handleOdooError(err, "getPurchaseOrderLines");
      }
    }),

  getSuppliers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      try {
        return await getSuppliers(input.limit);
      } catch (err) {
        handleOdooError(err, "getSuppliers");
      }
    }),

  createPurchaseOrder: protectedProcedure
    .input(z.object({
      partnerId: z.number().int().positive(),
      orderLines: z.array(z.object({
        productId: z.number().int().positive(),
        qty: z.number().positive(),
        priceUnit: z.number().nonnegative(),
        name: z.string().optional(),
      })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const orderId = await odooCreate("purchase.order", {
          partner_id: input.partnerId,
          notes: input.notes ?? "",
          order_line: input.orderLines.map(line => [0, 0, {
            product_id: line.productId,
            product_qty: line.qty,
            price_unit: line.priceUnit,
            name: line.name ?? "",
          }]),
        });
        return { success: true, orderId };
      } catch (err) {
        handleOdooError(err, "createPurchaseOrder");
      }
    }),

  // ── Accounting Module ────────────────────────────────────────────────────────
  getInvoices: protectedProcedure
    .input(z.object({
      type: z.enum(["in_invoice", "out_invoice", "all"]).default("all"),
      limit: z.number().int().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      try {
        return await getInvoices(input.type, input.limit);
      } catch (err) {
        handleOdooError(err, "getInvoices");
      }
    }),

  getPayments: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      try {
        return await getPayments(input.limit);
      } catch (err) {
        handleOdooError(err, "getPayments");
      }
    }),

  getChartOfAccounts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => {
      try {
        return await getChartOfAccounts(input.limit);
      } catch (err) {
        handleOdooError(err, "getChartOfAccounts");
      }
    }),

  // ── Inventory Module ─────────────────────────────────────────────────────────
  getProducts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      try {
        return await getProducts(input.limit);
      } catch (err) {
        handleOdooError(err, "getProducts");
      }
    }),

  getStockPickings: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      try {
        return await getStockPickings(input.limit);
      } catch (err) {
        handleOdooError(err, "getStockPickings");
      }
    }),

  getWarehouses: protectedProcedure.query(async () => {
    try {
      return await getWarehouses();
    } catch (err) {
      handleOdooError(err, "getWarehouses");
    }
  }),

  searchProducts: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => {
      try {
        return await odooSearchRead("product.product", [["name", "ilike", input.query]], [
          "name", "default_code", "qty_available", "list_price", "categ_id", "uom_id",
        ], { limit: input.limit });
      } catch (err) {
        handleOdooError(err, "searchProducts");
      }
    }),

  // ── CRM Module ───────────────────────────────────────────────────────────────
  getCrmLeads: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      try {
        return await getCrmLeads(input.limit);
      } catch (err) {
        handleOdooError(err, "getCrmLeads");
      }
    }),

  getCrmStages: protectedProcedure.query(async () => {
    try {
      return await getCrmStages();
    } catch (err) {
      handleOdooError(err, "getCrmStages");
    }
  }),

  createCrmLead: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(500),
      partnerId: z.number().int().positive().optional(),
      expectedRevenue: z.number().nonnegative().optional(),
      phone: z.string().optional(),
      emailFrom: z.string().email().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const leadId = await odooCreate("crm.lead", {
          name: input.name,
          ...(input.partnerId ? { partner_id: input.partnerId } : {}),
          ...(input.expectedRevenue !== undefined ? { expected_revenue: input.expectedRevenue } : {}),
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.emailFrom ? { email_from: input.emailFrom } : {}),
          ...(input.description ? { description: input.description } : {}),
          type: "opportunity",
        });
        return { success: true, leadId };
      } catch (err) {
        handleOdooError(err, "createCrmLead");
      }
    }),

  // ── Project Module ───────────────────────────────────────────────────────────
  getProjects: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => {
      try {
        return await getProjects(input.limit);
      } catch (err) {
        handleOdooError(err, "getProjects");
      }
    }),

  getProjectTasks: protectedProcedure
    .input(z.object({
      projectId: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        return await getProjectTasks(input.projectId, input.limit);
      } catch (err) {
        handleOdooError(err, "getProjectTasks");
      }
    }),

  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(500),
      partnerId: z.number().int().positive().optional(),
      dateStart: z.string().optional(),
      dateEnd: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const projectId = await odooCreate("project.project", {
          name: input.name,
          ...(input.partnerId ? { partner_id: input.partnerId } : {}),
          ...(input.dateStart ? { date_start: input.dateStart } : {}),
          ...(input.dateEnd ? { date: input.dateEnd } : {}),
          ...(input.description ? { description: input.description } : {}),
        });
        return { success: true, projectId };
      } catch (err) {
        handleOdooError(err, "createProject");
      }
    }),

  createTask: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(500),
      projectId: z.number().int().positive(),
      deadline: z.string().optional(),
      priority: z.enum(["0", "1"]).default("0"),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const taskId = await odooCreate("project.task", {
          name: input.name,
          project_id: input.projectId,
          priority: input.priority,
          ...(input.deadline ? { date_deadline: input.deadline } : {}),
          ...(input.description ? { description: input.description } : {}),
        });
        return { success: true, taskId };
      } catch (err) {
        handleOdooError(err, "createTask");
      }
    }),

  // ── Partners (shared across modules) ────────────────────────────────────────
  getPartners: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      supplierOnly: z.boolean().default(false),
      customerOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      try {
        const domain: unknown[][] = [];
        if (input.supplierOnly) domain.push(["supplier_rank", ">", 0]);
        if (input.customerOnly) domain.push(["customer_rank", ">", 0]);
        return await odooSearchRead("res.partner", domain, [
          "name", "email", "phone", "mobile", "street", "city",
          "country_id", "supplier_rank", "customer_rank", "vat", "website",
        ], { limit: input.limit, order: "name asc" });
      } catch (err) {
        handleOdooError(err, "getPartners");
      }
    }),
});
