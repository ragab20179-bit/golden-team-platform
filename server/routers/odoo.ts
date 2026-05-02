/**
 * Odoo Integration tRPC Router
 * Connects to goldenteam1.odoo.com (DB: golden-team-1) via XML-RPC
 *
 * Modules covered:
 *   - Purchase (orders, lines, suppliers, confirm PO, receive goods)
 *   - Accounting (invoices, payments, chart of accounts, create invoice,
 *                 register payment, post invoice)
 *   - Inventory (products, stock pickings, warehouses, live stock levels)
 *   - CRM (leads/opportunities, stages, update stage, get employees)
 *   - Project (projects, tasks)
 *   - HR (employees, payslips, leave requests)
 *   - Partners (shared across modules)
 *   - Dashboard stats (KPI summary across all modules)
 *   - Health (circuit-breaker state for the connection indicator)
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
  odooWrite,
  odooAction,
  getOdooBreakerState,
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

  // ── Health / Circuit Breaker ─────────────────────────────────────────────────
  /**
   * Returns the current circuit-breaker state so the OdooDashboard can show
   * a live connection health indicator without making a real Odoo call.
   */
  getHealth: protectedProcedure.query(async () => {
    const snapshot = getOdooBreakerState();
    return {
      status: snapshot.read === "closed" ? "connected" : snapshot.read === "open" ? "offline" : "degraded",
      readBreaker: snapshot.read,
      writeBreaker: snapshot.write,
      authBreaker: snapshot.auth,
      checkedAt: new Date().toISOString(),
    };
  }),

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

  /** Confirm a draft PO (button_confirm workflow action). */
  confirmPurchaseOrder: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        await odooAction("purchase.order", "button_confirm", [input.orderId]);
        return { success: true };
      } catch (err) {
        handleOdooError(err, "confirmPurchaseOrder");
      }
    }),

  /** Mark a stock picking (delivery/receipt) as validated — "Receive Goods". */
  validateStockPicking: protectedProcedure
    .input(z.object({ pickingId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        await odooAction("stock.picking", "button_validate", [input.pickingId]);
        return { success: true };
      } catch (err) {
        handleOdooError(err, "validateStockPicking");
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

  /**
   * Create a vendor bill (in_invoice) or customer invoice (out_invoice).
   * Returns the new invoice ID.
   */
  createInvoice: protectedProcedure
    .input(z.object({
      moveType: z.enum(["in_invoice", "out_invoice"]),
      partnerId: z.number().int().positive(),
      invoiceDate: z.string().optional(),
      invoiceLines: z.array(z.object({
        name: z.string().min(1),
        quantity: z.number().positive().default(1),
        priceUnit: z.number().nonnegative(),
        accountId: z.number().int().positive().optional(),
      })),
      ref: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const invoiceId = await odooCreate("account.move", {
          move_type: input.moveType,
          partner_id: input.partnerId,
          ...(input.invoiceDate ? { invoice_date: input.invoiceDate } : {}),
          ...(input.ref ? { ref: input.ref } : {}),
          invoice_line_ids: input.invoiceLines.map(line => [0, 0, {
            name: line.name,
            quantity: line.quantity,
            price_unit: line.priceUnit,
            ...(line.accountId ? { account_id: line.accountId } : {}),
          }]),
        });
        return { success: true, invoiceId };
      } catch (err) {
        handleOdooError(err, "createInvoice");
      }
    }),

  /** Post (confirm) a draft invoice — action_post workflow. */
  postInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      try {
        await odooAction("account.move", "action_post", [input.invoiceId]);
        return { success: true };
      } catch (err) {
        handleOdooError(err, "postInvoice");
      }
    }),

  /**
   * Register a payment against an invoice.
   * Creates an account.payment and reconciles it with the invoice.
   */
  registerPayment: protectedProcedure
    .input(z.object({
      invoiceId: z.number().int().positive(),
      amount: z.number().positive(),
      paymentDate: z.string().optional(),
      journalId: z.number().int().positive().optional(),
      memo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Fetch the invoice to get partner and move_type
        const [invoice] = await odooSearchRead<{ partner_id: [number, string]; move_type: string }>(
          "account.move",
          [["id", "=", input.invoiceId]],
          ["partner_id", "move_type"],
          { limit: 1 },
        );
        if (!invoice) throw new Error(`Invoice ${input.invoiceId} not found`);

        const paymentType = invoice.move_type === "in_invoice" ? "outbound" : "inbound";
        const partnerType = invoice.move_type === "in_invoice" ? "supplier" : "customer";

        const paymentId = await odooCreate("account.payment", {
          payment_type: paymentType,
          partner_type: partnerType,
          partner_id: invoice.partner_id[0],
          amount: input.amount,
          ...(input.paymentDate ? { date: input.paymentDate } : {}),
          ...(input.journalId ? { journal_id: input.journalId } : {}),
          ...(input.memo ? { memo: input.memo } : {}),
        });
        // Post the payment
        await odooAction("account.payment", "action_post", [paymentId]);
        return { success: true, paymentId };
      } catch (err) {
        handleOdooError(err, "registerPayment");
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

  /** Get live stock quantities per product per location. */
  getLiveStockLevels: protectedProcedure
    .input(z.object({
      productIds: z.array(z.number().int().positive()).optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        const domain: unknown[][] = [["location_id.usage", "=", "internal"]];
        if (input.productIds?.length) {
          domain.push(["product_id", "in", input.productIds]);
        }
        return await odooSearchRead(
          "stock.quant",
          domain,
          ["product_id", "location_id", "quantity", "reserved_quantity", "available_quantity"],
          { limit: input.limit, order: "product_id asc" },
        );
      } catch (err) {
        handleOdooError(err, "getLiveStockLevels");
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

  /** Move a CRM lead/opportunity to a different pipeline stage. */
  updateCrmLeadStage: protectedProcedure
    .input(z.object({
      leadId: z.number().int().positive(),
      stageId: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      try {
        await odooWrite("crm.lead", [input.leadId], { stage_id: input.stageId });
        return { success: true };
      } catch (err) {
        handleOdooError(err, "updateCrmLeadStage");
      }
    }),

  // ── HR Module ────────────────────────────────────────────────────────────────
  /** Get all employees from Odoo HR. */
  getEmployees: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      departmentId: z.number().int().positive().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const domain: unknown[][] = [["active", "=", true]];
        if (input.departmentId) domain.push(["department_id", "=", input.departmentId]);
        return await odooSearchRead(
          "hr.employee",
          domain,
          ["name", "job_title", "job_id", "department_id", "work_email", "work_phone",
           "mobile_phone", "coach_id", "parent_id", "resource_calendar_id"],
          { limit: input.limit, order: "name asc" },
        );
      } catch (err) {
        handleOdooError(err, "getEmployees");
      }
    }),

  /** Get payslips for a given period. */
  getPayslips: protectedProcedure
    .input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      employeeId: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(200).default(50),
    }))
    .query(async ({ input }) => {
      try {
        const domain: unknown[][] = [];
        if (input.dateFrom) domain.push(["date_from", ">=", input.dateFrom]);
        if (input.dateTo) domain.push(["date_to", "<=", input.dateTo]);
        if (input.employeeId) domain.push(["employee_id", "=", input.employeeId]);
        return await odooSearchRead(
          "hr.payslip",
          domain,
          ["name", "employee_id", "date_from", "date_to", "state", "net_wage"],
          { limit: input.limit, order: "date_from desc" },
        );
      } catch (err) {
        handleOdooError(err, "getPayslips");
      }
    }),

  /** Create a leave (time-off) request for an employee. */
  createLeaveRequest: protectedProcedure
    .input(z.object({
      employeeId: z.number().int().positive(),
      holidayStatusId: z.number().int().positive(),
      dateFrom: z.string(),
      dateTo: z.string(),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const leaveId = await odooCreate("hr.leave", {
          employee_id: input.employeeId,
          holiday_status_id: input.holidayStatusId,
          date_from: input.dateFrom,
          date_to: input.dateTo,
          ...(input.name ? { name: input.name } : {}),
        });
        return { success: true, leaveId };
      } catch (err) {
        handleOdooError(err, "createLeaveRequest");
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
