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

/** True when the error message indicates the circuit breaker is open */
function isBreakerOpen(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.toLowerCase().includes("breaker is open") ||
         msg.toLowerCase().includes("circuit breaker") ||
         msg.toLowerCase().includes("open state");
}

/**
 * For READ queries: return an empty-array fallback when the breaker is open
 * so the page renders gracefully with an offline indicator instead of crashing.
 * For WRITE mutations: always throw so the user knows the action failed.
 */
function handleReadError(err: unknown, context: string): [] {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[Odoo] ${context} — returning [] (breaker open or Odoo offline): ${msg.slice(0, 120)}`);
  return [];
}

// ── Error wrapper ──────────────────────────────────────────────────────────────
function handleOdooError(err: unknown, context: string): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[Odoo] ${context}:`, msg);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: `Odoo ${context} failed: ${msg.slice(0, 200)}`,
  });
}

/** True when the error is a transient/rate-limit condition that should degrade gracefully */
function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("too many requests") ||
         msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("service unavailable") ||
         msg.includes("503") || msg.includes("502");
}

/** Wrap a read query: return empty array on breaker-open or transient errors, throw on real errors */
async function safeRead<T>(fn: () => Promise<T[]>, context: string): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    if (isBreakerOpen(err) || isTransientError(err)) return handleReadError(err, context) as T[];
    handleOdooError(err, context);
  }
}

/**
 * Fully fault-tolerant read — NEVER throws, always returns [] on any error.
 * Used for context-loading in aiDataEntry parse step so Odoo downtime
 * doesn't block the LLM parse (it just runs with less context).
 */
async function silentRead<T>(fn: () => Promise<T[]>, context: string): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Odoo] ${context} — silentRead returning [] (${msg.slice(0, 80)})`);
    return [];
  }
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
      if (isBreakerOpen(err)) {
        console.warn("[Odoo] getStats — breaker open, returning empty stats");
        return { purchaseOrders: 0, invoices: 0, products: 0, suppliers: 0, crmLeads: 0, projects: 0, tasks: 0, lastSync: new Date().toISOString(), stale: true };
      }
      handleOdooError(err, "getStats");
    }
  }),

  // ── Purchase Module ──────────────────────────────────────────────────────────
  getPurchaseOrders: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => safeRead(() => getPurchaseOrders(input.limit), "getPurchaseOrders")),

  getPurchaseOrderLines: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive().optional() }))
    .query(async ({ input }) => safeRead(() => getPurchaseOrderLines(input.orderId), "getPurchaseOrderLines")),

  getSuppliers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ input }) => safeRead(() => getSuppliers(input.limit), "getSuppliers")),

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
    .query(async ({ input }) => safeRead(() => getInvoices(input.type, input.limit), "getInvoices")),

  getPayments: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => safeRead(() => getPayments(input.limit), "getPayments")),

  getChartOfAccounts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(200) }))
    .query(async ({ input }) => safeRead(() => getChartOfAccounts(input.limit), "getChartOfAccounts")),

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
    .query(async ({ input }) => safeRead(() => getProducts(input.limit), "getProducts")),

  getStockPickings: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => safeRead(() => getStockPickings(input.limit), "getStockPickings")),

  getWarehouses: protectedProcedure.query(async () => safeRead(() => getWarehouses(), "getWarehouses")),

  searchProducts: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(200),
      limit: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ input }) => safeRead(
      () => odooSearchRead("product.product", [["name", "ilike", input.query]], [
        "name", "default_code", "qty_available", "list_price", "categ_id", "uom_id",
      ], { limit: input.limit }),
      "searchProducts"
    )),

  /** Get live stock quantities per product per location. */
  getLiveStockLevels: protectedProcedure
    .input(z.object({
      productIds: z.array(z.number().int().positive()).optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      const domain: unknown[][] = [["location_id.usage", "=", "internal"]];
      if (input.productIds?.length) domain.push(["product_id", "in", input.productIds]);
      return safeRead(
        () => odooSearchRead(
          "stock.quant",
          domain,
          ["product_id", "location_id", "quantity", "reserved_quantity", "available_quantity"],
          { limit: input.limit, order: "product_id asc" },
        ),
        "getLiveStockLevels"
      );
    }),

  // ── CRM Module ───────────────────────────────────────────────────────────────
  getCrmLeads: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ input }) => safeRead(() => getCrmLeads(input.limit), "getCrmLeads")),

  getCrmStages: protectedProcedure.query(async () => safeRead(() => getCrmStages(), "getCrmStages")),

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
      const domain: unknown[][] = [["active", "=", true]];
      if (input.departmentId) domain.push(["department_id", "=", input.departmentId]);
      return safeRead(
        () => odooSearchRead(
          "hr.employee",
          domain,
          ["name", "job_title", "job_id", "department_id", "work_email", "work_phone",
           "mobile_phone", "coach_id", "parent_id", "resource_calendar_id"],
          { limit: input.limit, order: "name asc" },
        ),
        "getEmployees"
      );
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
      const domain: unknown[][] = [];
      if (input.dateFrom) domain.push(["date_from", ">=", input.dateFrom]);
      if (input.dateTo) domain.push(["date_to", "<=", input.dateTo]);
      if (input.employeeId) domain.push(["employee_id", "=", input.employeeId]);
      return safeRead(
        () => odooSearchRead(
          "hr.payslip",
          domain,
          ["name", "employee_id", "date_from", "date_to", "state", "net_wage"],
          { limit: input.limit, order: "date_from desc" },
        ),
        "getPayslips"
      );
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
    .query(async ({ input }) => safeRead(() => getProjects(input.limit), "getProjects")),

  getProjectTasks: protectedProcedure
    .input(z.object({
      projectId: z.number().int().positive().optional(),
      limit: z.number().int().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => safeRead(() => getProjectTasks(input.projectId, input.limit), "getProjectTasks")),

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

  // ── AI Data Entry ────────────────────────────────────────────────────────────
  /**
   * AI-powered natural language data entry.
   * Step 1 (confirmed=false): LLM parses instruction → returns parsed op + summary.
   * Step 2 (confirmed=true):  Execute the confirmed operation in Odoo.
   */
  aiDataEntry: protectedProcedure
    .input(z.object({
      instruction: z.string().min(1).max(2000),
      confirmed: z.boolean().default(false),
      parsedOperation: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("../_core/llm");

      // ── Step 1: Parse ────────────────────────────────────────────────────────
      if (!input.confirmed) {
        const [suppliers, products, crmStages, projects] = await Promise.all([
          silentRead(() => getSuppliers(50), "aiDataEntry:suppliers"),
          silentRead(() => getProducts(50), "aiDataEntry:products"),
          silentRead(() => getCrmStages(), "aiDataEntry:crmStages"),
          silentRead(() => getProjects(30), "aiDataEntry:projects"),
        ]);

        const ctx = [
          suppliers.length ? `Suppliers (id: name): ${suppliers.slice(0, 20).map(s => `${s.id}: ${s.name}`).join(", ")}` : "",
          products.length ? `Products (id: name, price): ${products.slice(0, 20).map(p => `${p.id}: ${p.name} @ ${p.list_price}`).join(", ")}` : "",
          crmStages.length ? `CRM stages (id: name): ${crmStages.map(s => `${s.id}: ${s.name}`).join(", ")}` : "",
          projects.length ? `Projects (id: name): ${projects.slice(0, 10).map(p => `${p.id}: ${p.name}`).join(", ")}` : "",
        ].filter(Boolean).join("\n");

        const systemPrompt = `You are NEO, the Golden Team AI assistant. Parse the user's Odoo ERP data entry instruction and return a JSON object.

Supported operations:
- CREATE_CUSTOMER: name, email?, phone?, mobile?, street?, city?, countryId?, website?, notes? (isCompany defaults true)
- CREATE_VENDOR: name, email?, phone?, mobile?, street?, city?, countryId?, website?, notes? (supplier, isCompany defaults true)
- UPDATE_PARTNER: partnerId, name?, email?, phone?, mobile?, street?, city?, notes?
- CREATE_SALE_ORDER: partnerId, orderLines [{productId,qty,priceUnit,name?}], notes?
- CONFIRM_SALE_ORDER: orderId
- CREATE_PURCHASE_ORDER: partnerId, orderLines [{productId,qty,priceUnit,name?}], notes?
- CONFIRM_PURCHASE_ORDER: orderId
- CREATE_INVOICE: moveType ("in_invoice"|"out_invoice"), partnerId, invoiceLines [{name,quantity?,priceUnit,accountId?}], invoiceDate?, ref?
- POST_INVOICE: invoiceId
- REGISTER_PAYMENT: invoiceId, amount, paymentDate?, memo?
- CREATE_CRM_LEAD: name, partnerId?, expectedRevenue?, phone?, emailFrom?, description?
- UPDATE_CRM_LEAD_STAGE: leadId, stageId
- CREATE_PROJECT: name, partnerId?, dateStart?, dateEnd?, description?
- CREATE_TASK: name, projectId, deadline?, priority ("0"|"1")?, description?
- CREATE_LEAVE_REQUEST: employeeId, holidayStatusId, dateFrom, dateTo, name?
- CREATE_EMPLOYEE: name, jobTitle?, workEmail?, workPhone?, departmentId?, managerId?
- UNKNOWN: if no operation matches

Live Odoo context:\n${ctx || "(Odoo offline)"}

Return ONLY valid JSON:
{"operation":"...","fields":{...},"summary":"one sentence summary","missingFields":["..."]}
If missingFields non-empty, set summary to a clarifying question. Respond in the user's language.`;

        const llmResp = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.instruction },
          ],
          response_format: { type: "json_object" } as { type: "json_object" },
        });

        const rawMsg = llmResp.choices?.[0]?.message?.content;
        const raw = typeof rawMsg === "string" ? rawMsg : "{}";
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(raw); }
        catch { parsed = { operation: "UNKNOWN", fields: {}, summary: "Could not parse instruction.", missingFields: [] }; }

        return {
          stage: "parsed" as const,
          operation: parsed.operation as string,
          fields: parsed.fields as Record<string, unknown>,
          summary: parsed.summary as string,
          missingFields: (parsed.missingFields as string[]) ?? [],
          parsedJson: raw,
        };
      }

      // ── Step 2: Execute ──────────────────────────────────────────────────────
      if (!input.parsedOperation) throw new TRPCError({ code: "BAD_REQUEST", message: "parsedOperation required" });
      let op: { operation: string; fields: Record<string, unknown> };
      try { op = JSON.parse(input.parsedOperation); }
      catch { throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid parsedOperation JSON" }); }

      const { logOdooAiEntry, updateOdooAiEntry } = await import("../db/odooAuditLog");
      const auditStart = Date.now();
      let auditId: number | null = null;
      try {
        auditId = await logOdooAiEntry({
          userId: ctx.user.id,
          userName: ctx.user.name ?? null,
          userEmail: ctx.user.email ?? null,
          userPrompt: input.instruction,
          operation: op.operation,
          status: "pending",
          parsedPayload: op.fields as Record<string, unknown>,
          source: "builtin",
        });
      } catch (logErr) {
        console.warn("[AuditLog] Failed to create audit entry:", logErr);
      }

      const f = op.fields;

      // Helper: update audit entry after execution
      async function auditSuccess(recordId: number | unknown, recordName?: string) {
        if (!auditId) return;
        try {
          await updateOdooAiEntry(auditId, {
            status: "success",
            odooRecordId: typeof recordId === "number" ? recordId : undefined,
            odooRecordName: recordName,
            executionMs: Date.now() - auditStart,
          });
        } catch (e) { console.warn("[AuditLog] update failed:", e); }
      }
      async function auditFail(errorMessage: string) {
        if (!auditId) return;
        try {
          await updateOdooAiEntry(auditId, { status: "failed", errorMessage, executionMs: Date.now() - auditStart });
        } catch (e) { console.warn("[AuditLog] update failed:", e); }
      }

      try {
        switch (op.operation) {
          case "CREATE_PURCHASE_ORDER": {
            const id = await odooCreate("purchase.order", {
              partner_id: f.partnerId, notes: f.notes ?? "",
              order_line: (f.orderLines as Array<{productId:number;qty:number;priceUnit:number;name?:string}>).map(l => [0,0,{product_id:l.productId,product_qty:l.qty,price_unit:l.priceUnit,name:l.name??""}]),
            });
            await auditSuccess(id, `Purchase Order #${id}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Purchase Order created (ID: ${id})` } };
          }
          case "CONFIRM_PURCHASE_ORDER": {
            await odooAction("purchase.order", "button_confirm", [f.orderId as number]);
            await auditSuccess(f.orderId, `PO #${f.orderId}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: f.orderId, message: `PO #${f.orderId} confirmed` } };
          }
          case "CREATE_INVOICE": {
            const id = await odooCreate("account.move", {
              move_type: f.moveType, partner_id: f.partnerId,
              ...(f.invoiceDate ? { invoice_date: f.invoiceDate } : {}),
              ...(f.ref ? { ref: f.ref } : {}),
              invoice_line_ids: (f.invoiceLines as Array<{name:string;quantity?:number;priceUnit:number;accountId?:number}>).map(l => [0,0,{name:l.name,quantity:l.quantity??1,price_unit:l.priceUnit,...(l.accountId?{account_id:l.accountId}:{})}]),
            });
            await auditSuccess(id, `Invoice #${id}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Invoice created (ID: ${id})` } };
          }
          case "POST_INVOICE": {
            await odooAction("account.move", "action_post", [f.invoiceId as number]);
            await auditSuccess(f.invoiceId, `Invoice #${f.invoiceId}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: f.invoiceId, message: `Invoice #${f.invoiceId} posted` } };
          }
          case "REGISTER_PAYMENT": {
            const [inv] = await odooSearchRead<{partner_id:[number,string];move_type:string}>("account.move",[["id","=",f.invoiceId]],["partner_id","move_type"],{limit:1});
            if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: `Invoice ${f.invoiceId} not found` });
            const pid = await odooCreate("account.payment", {
              payment_type: inv.move_type==="in_invoice"?"outbound":"inbound",
              partner_type: inv.move_type==="in_invoice"?"supplier":"customer",
              partner_id: inv.partner_id[0], amount: f.amount,
              ...(f.paymentDate?{date:f.paymentDate}:{}), ...(f.memo?{memo:f.memo}:{}),
            });
            await odooAction("account.payment","action_post",[pid]);
            await auditSuccess(pid, `Payment #${pid}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: pid, message: `Payment registered (ID: ${pid})` } };
          }
          case "CREATE_CRM_LEAD": {
            const id = await odooCreate("crm.lead", {
              name: f.name, type: "opportunity",
              ...(f.partnerId?{partner_id:f.partnerId}:{}),
              ...(f.expectedRevenue!==undefined?{expected_revenue:f.expectedRevenue}:{}),
              ...(f.phone?{phone:f.phone}:{}), ...(f.emailFrom?{email_from:f.emailFrom}:{}),
              ...(f.description?{description:f.description}:{}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `CRM opportunity created (ID: ${id})` } };
          }
          case "UPDATE_CRM_LEAD_STAGE": {
            await odooWrite("crm.lead",[f.leadId as number],{stage_id:f.stageId});
            await auditSuccess(f.leadId, `Lead #${f.leadId}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: f.leadId, message: `Lead #${f.leadId} moved to stage ${f.stageId}` } };
          }
          case "CREATE_PROJECT": {
            const id = await odooCreate("project.project", {
              name: f.name,
              ...(f.partnerId?{partner_id:f.partnerId}:{}),
              ...(f.dateStart?{date_start:f.dateStart}:{}), ...(f.dateEnd?{date:f.dateEnd}:{}),
              ...(f.description?{description:f.description}:{}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Project created (ID: ${id})` } };
          }
          case "CREATE_TASK": {
            const id = await odooCreate("project.task", {
              name: f.name, project_id: f.projectId, priority: f.priority??"0",
              ...(f.deadline?{date_deadline:f.deadline}:{}),
              ...(f.description?{description:f.description}:{}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Task created (ID: ${id})` } };
          }
          case "CREATE_LEAVE_REQUEST": {
            const id = await odooCreate("hr.leave", {
              employee_id: f.employeeId, holiday_status_id: f.holidayStatusId,
              date_from: f.dateFrom, date_to: f.dateTo,
              ...(f.name?{name:f.name}:{}),
            });
            await auditSuccess(id, `Leave #${id}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Leave request created (ID: ${id})` } };
          }
          case "CREATE_CUSTOMER": {
            const id = await odooCreate("res.partner", {
              name: f.name, is_company: true, customer_rank: 1, supplier_rank: 0,
              ...(f.email ? { email: f.email } : {}),
              ...(f.phone ? { phone: f.phone } : {}),
              ...(f.mobile ? { mobile: f.mobile } : {}),
              ...(f.street ? { street: f.street } : {}),
              ...(f.city ? { city: f.city } : {}),
              ...(f.countryId ? { country_id: f.countryId } : {}),
              ...(f.website ? { website: f.website } : {}),
              ...(f.notes ? { comment: f.notes } : {}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Customer "${f.name}" created in Odoo (ID: ${id})` } };
          }
          case "CREATE_VENDOR": {
            const id = await odooCreate("res.partner", {
              name: f.name, is_company: true, supplier_rank: 1, customer_rank: 0,
              ...(f.email ? { email: f.email } : {}),
              ...(f.phone ? { phone: f.phone } : {}),
              ...(f.mobile ? { mobile: f.mobile } : {}),
              ...(f.street ? { street: f.street } : {}),
              ...(f.city ? { city: f.city } : {}),
              ...(f.countryId ? { country_id: f.countryId } : {}),
              ...(f.website ? { website: f.website } : {}),
              ...(f.notes ? { comment: f.notes } : {}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Vendor "${f.name}" created in Odoo (ID: ${id})` } };
          }
          case "UPDATE_PARTNER": {
            const updateData: Record<string, unknown> = {};
            if (f.name) updateData.name = f.name;
            if (f.email) updateData.email = f.email;
            if (f.phone) updateData.phone = f.phone;
            if (f.mobile) updateData.mobile = f.mobile;
            if (f.street) updateData.street = f.street;
            if (f.city) updateData.city = f.city;
            if (f.notes) updateData.comment = f.notes;
            await odooWrite("res.partner", [f.partnerId as number], updateData);
            await auditSuccess(f.partnerId, `Partner #${f.partnerId}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: f.partnerId, message: `Partner #${f.partnerId} updated` } };
          }
          case "CREATE_SALE_ORDER": {
            const id = await odooCreate("sale.order", {
              partner_id: f.partnerId, note: f.notes ?? "",
              order_line: (f.orderLines as Array<{productId:number;qty:number;priceUnit:number;name?:string}>).map(l => [0,0,{product_id:l.productId,product_uom_qty:l.qty,price_unit:l.priceUnit,name:l.name??""}]),
            });
            await auditSuccess(id, `Sale Order #${id}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Sale Order created (ID: ${id})` } };
          }
          case "CONFIRM_SALE_ORDER": {
            await odooAction("sale.order", "action_confirm", [f.orderId as number]);
            await auditSuccess(f.orderId, `SO #${f.orderId}`);
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id: f.orderId, message: `Sale Order #${f.orderId} confirmed` } };
          }
          case "CREATE_EMPLOYEE": {
            const id = await odooCreate("hr.employee", {
              name: f.name,
              ...(f.jobTitle ? { job_title: f.jobTitle } : {}),
              ...(f.workEmail ? { work_email: f.workEmail } : {}),
              ...(f.workPhone ? { work_phone: f.workPhone } : {}),
              ...(f.departmentId ? { department_id: f.departmentId } : {}),
              ...(f.managerId ? { parent_id: f.managerId } : {}),
            });
            await auditSuccess(id, String(f.name));
            return { stage: "executed" as const, operation: op.operation, result: { success: true, id, message: `Employee "${f.name}" created in Odoo (ID: ${id})` } };
          }
          default:
            throw new TRPCError({ code: "BAD_REQUEST", message: `Unsupported operation: ${op.operation}` });
        }
      } catch (execErr) {
        const msg = execErr instanceof Error ? execErr.message : String(execErr);
        await auditFail(msg);
        throw execErr;
      }
    }),  // ── NEO FastAPI Bridge Chat ───────────────────────────────────────────────────────
  /**
   * Proxy to the NEO FastAPI Odoo Bridge for full agentic multi-turn chat.
   * Falls back to the built-in aiDataEntry LLM parse if bridge is not configured.
   */
  neoBridgeChat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(4000),
      history: z.array(z.object({
        role: z.enum(["user", "assistant", "tool", "system"]),
        content: z.string(),
      })).default([]),
      autoExecute: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const { ENV } = await import("../_core/env");

      // ── If bridge is configured, proxy to it ──────────────────────────────────────
      if (ENV.neoBridgeUrl) {
        try {
          const resp = await fetch(`${ENV.neoBridgeUrl}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(ENV.neoBridgeApiKey ? { Authorization: `Bearer ${ENV.neoBridgeApiKey}` } : {}),
            },
            body: JSON.stringify({
              message: input.message,
              history: input.history,
              auto_execute: input.autoExecute,
            }),
            signal: AbortSignal.timeout(55_000),
          });
          if (!resp.ok) {
            const errText = await resp.text();
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Bridge error ${resp.status}: ${errText.slice(0, 200)}` });
          }
          const data = await resp.json() as Record<string, unknown>;
          return { source: "bridge" as const, ...data };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          // Bridge unreachable — fall through to built-in LLM
          console.warn("[NEO Bridge] unreachable, falling back to built-in LLM:", err);
        }
      }

      // ── Fallback: built-in LLM parse (same as aiDataEntry step 1) ───────────────
      const { invokeLLM } = await import("../_core/llm");
      const llmResp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are NEO, the Golden Team AI assistant for Odoo ERP data entry.
            Parse the user's instruction and respond helpfully.
            If you need more information, ask for it clearly.
            Respond in the user's language (Arabic or English).`,
          },
          ...input.history.map(h => ({ role: h.role as "user" | "assistant" | "system", content: h.content })),
          { role: "user", content: input.message },
        ],
      });
      const content = llmResp.choices?.[0]?.message?.content ?? "I couldn't process that request.";
      return {
        source: "builtin" as const,
        type: "message",
        content,
        requires_confirmation: false,
      };
    }),

  /**
   * Execute a confirmed action from the NEO FastAPI bridge.
   */
  neoBridgeExecute: protectedProcedure
    .input(z.object({
      actions: z.array(z.object({
        tool_name: z.string(),
        tool_args: z.record(z.string(), z.unknown()),
      })).min(1),
    }))
    .mutation(async ({ input }) => {
      const { ENV } = await import("../_core/env");

      if (!ENV.neoBridgeUrl) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "NEO Bridge not configured. Set NEO_BRIDGE_URL env var." });
      }

      const resp = await fetch(`${ENV.neoBridgeUrl}/execute_confirmed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ENV.neoBridgeApiKey ? { Authorization: `Bearer ${ENV.neoBridgeApiKey}` } : {}),
        },
        body: JSON.stringify({ actions: input.actions }),
        signal: AbortSignal.timeout(55_000),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Bridge execute error ${resp.status}: ${errText.slice(0, 200)}` });
      }

      return await resp.json() as { success: boolean; results: Array<{ tool_name: string; success: boolean; data?: unknown; error?: string }> };
    }),

  /**
   * Check if the NEO FastAPI bridge is reachable and healthy.
   */
  neoBridgeHealth: protectedProcedure
    .query(async () => {
      const { ENV } = await import("../_core/env");
      if (!ENV.neoBridgeUrl) {
        return { configured: false, status: "not_configured" as const };
      }
      try {
        const resp = await fetch(`${ENV.neoBridgeUrl}/health`, {
          signal: AbortSignal.timeout(5_000),
        });
        if (!resp.ok) return { configured: true, status: "error" as const, httpStatus: resp.status };
        const data = await resp.json() as Record<string, unknown>;
        return { configured: true, status: data.status as string, odooVersion: data.odoo_version as string };
      } catch {
        return { configured: true, status: "unreachable" as const };
      }
    }),

  // ── Audit Log — NEO AI Entry history ─────────────────────────────────────────
  /**
   * Get paginated audit log entries.
   * Admin sees all entries; regular users see only their own.
   */
  getAiEntries: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(200).default(50),
      offset: z.number().int().min(0).default(0),
      status: z.enum(["success", "failed", "pending", "rejected"]).optional(),
      operation: z.string().optional(),
      source: z.enum(["builtin", "neo_bridge"]).optional(),
      sinceHours: z.number().int().min(1).max(720).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { getOdooAiEntries, countOdooAiEntries } = await import("../db/odooAuditLog");
      const isAdmin = ctx.user.role === "admin";
      const since = input.sinceHours ? new Date(Date.now() - input.sinceHours * 3_600_000) : undefined;
      const opts = {
        limit: input.limit,
        offset: input.offset,
        status: input.status,
        operation: input.operation,
        source: input.source,
        since,
        userId: isAdmin ? undefined : ctx.user.id,
      };
      const [entries, total] = await Promise.all([
        getOdooAiEntries(opts),
        countOdooAiEntries(opts),
      ]);
      return { entries, total };
    }),

  /**
   * Get KPI stats for the audit log dashboard (totals, success rate, top operations).
   */
  getAiEntryStats: protectedProcedure
    .query(async () => {
      const { getOdooAiEntryStats } = await import("../db/odooAuditLog");
      return getOdooAiEntryStats();
    }),

  /**
   * Get a single audit log entry by ID.
   * Admin can access any entry; users can only access their own.
   */
  getAiEntryById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const { getOdooAiEntryById } = await import("../db/odooAuditLog");
      const entry = await getOdooAiEntryById(input.id);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Audit entry not found" });
      if (ctx.user.role !== "admin" && entry.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      return entry;
    }),

  /**
   * Admin only: permanently clear all audit log entries.
   */
  clearAiEntries: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      const { clearOdooAiEntries } = await import("../db/odooAuditLog");
      const deleted = await clearOdooAiEntries();
      return { deleted };
    }),

  // ── Audit Log Export ──────────────────────────────────────────────────────────────────────────────────────
  exportAiEntries: protectedProcedure
    .input(z.object({
      status: z.enum(["all", "success", "failed", "pending"]).default("all"),
      source: z.enum(["all", "direct", "bridge"]).default("all"),
      operation: z.string().optional(),
      from: z.number().optional(),
      to: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getOdooAiEntries } = await import("../db/odooAuditLog");
      const entries = await getOdooAiEntries({
        status: input.status === "all" ? undefined : input.status as "success" | "failed" | "pending",
        source: input.source === "all" ? undefined : (input.source === "direct" ? "builtin" : "neo_bridge") as "builtin" | "neo_bridge",
        operation: input.operation,
        since: input.from ? new Date(input.from) : undefined,
        limit: 5000,
        offset: 0,
      });
      const header = ["ID", "Timestamp", "User", "Operation", "Source", "Status", "Odoo Record ID", "Execution Time (ms)", "Error"].join(",");
      const rows = entries.map((e) => [
        e.id,
        new Date(e.createdAt).toISOString(),
        (e.userName ?? "").replace(/,/g, ";"),
        e.operation,
        e.source,
        e.status,
        e.odooRecordId ?? "",
        e.executionMs ?? "",
        (e.errorMessage ?? "").replace(/,/g, ";").replace(/\n/g, " "),
      ].join(","));
      return { csv: [header, ...rows].join("\n"), count: entries.length };
    }),

  // ── Sales Orders ─────────────────────────────────────────────────────────────────────────
  getSalesOrders: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(50) }))
    .query(async ({ input }) => {
      const { getSalesOrders } = await import("../odoo/modules/sales");
      return safeRead(() => getSalesOrders(input.limit), "getSalesOrders");
    }),

  getSalesOrderLines: protectedProcedure
    .input(z.object({ orderId: z.number().int().optional() }))
    .query(async ({ input }) => {
      const { getSalesOrderLines } = await import("../odoo/modules/sales");
      return safeRead(() => getSalesOrderLines(input.orderId), "getSalesOrderLines");
    }),

  getCustomers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      const { getCustomers } = await import("../odoo/modules/sales");
      return safeRead(() => getCustomers(input.limit), "getCustomers");
    }),

  // ── Partners (shared across modules) ───────────────────────────────────────────────────
  getPartners: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      supplierOnly: z.boolean().default(false),
      customerOnly: z.boolean().default(false),
    }))
    .query(async ({ input }) => {
      const domain: unknown[][] = [];
      if (input.supplierOnly) domain.push(["supplier_rank", ">", 0]);
      if (input.customerOnly) domain.push(["customer_rank", ">", 0]);
      return safeRead(
        () => odooSearchRead("res.partner", domain, [
          "name", "email", "phone", "mobile", "street", "city",
          "country_id", "supplier_rank", "customer_rank", "vat", "website",
        ], { limit: input.limit, order: "name asc" }),
        "getPartners"
      );
    }),
});
