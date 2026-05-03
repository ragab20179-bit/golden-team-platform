/**
 * Central Operation Registry
 * Implements Claude's Command Registry pattern (Q3 peer review).
 *
 * To add a new operation:
 *   1. Create/extend a domain file (partners.ts, purchase.ts, etc.)
 *   2. Import and register it here — no changes needed in odoo.ts
 */
import { TRPCError } from "@trpc/server";
import type { OperationContext, OperationRegistry, OperationResult } from "./types";

// ── Domain imports ─────────────────────────────────────────────────────────────
import { createCustomer, createVendor, updatePartner } from "./partners";
import { createPurchaseOrder, confirmPurchaseOrder }   from "./purchase";
import { createInvoice, postInvoice, registerPayment } from "./invoice";
import { createSaleOrder, confirmSaleOrder }           from "./sales";
import { createCrmLead, updateCrmLeadStage }           from "./crm";
import { createProject, createTask }                   from "./projects";
import { createEmployee, createLeaveRequest }          from "./hr";

// ── Registry ───────────────────────────────────────────────────────────────────
export const operationRegistry: OperationRegistry = {
  // Partners
  CREATE_CUSTOMER:       createCustomer,
  CREATE_VENDOR:         createVendor,
  UPDATE_PARTNER:        updatePartner,
  // Purchase
  CREATE_PURCHASE_ORDER: createPurchaseOrder,
  CONFIRM_PURCHASE_ORDER: confirmPurchaseOrder,
  // Invoice / Accounting
  CREATE_INVOICE:        createInvoice,
  POST_INVOICE:          postInvoice,
  REGISTER_PAYMENT:      registerPayment,
  // Sales
  CREATE_SALE_ORDER:     createSaleOrder,
  CONFIRM_SALE_ORDER:    confirmSaleOrder,
  // CRM
  CREATE_CRM_LEAD:       createCrmLead,
  UPDATE_CRM_LEAD_STAGE: updateCrmLeadStage,
  // Projects
  CREATE_PROJECT:        createProject,
  CREATE_TASK:           createTask,
  // HR
  CREATE_EMPLOYEE:       createEmployee,
  CREATE_LEAVE_REQUEST:  createLeaveRequest,
};

// ── Executor ───────────────────────────────────────────────────────────────────
/**
 * Execute an operation by name.
 * Validates the fields with the operation's own Zod schema before calling execute().
 * Throws TRPCError BAD_REQUEST for unknown operations or validation failures.
 */
export async function executeOperation(
  operationName: string,
  fields: Record<string, unknown>,
  ctx: OperationContext,
): Promise<OperationResult> {
  const op = operationRegistry[operationName];
  if (!op) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown operation: ${operationName}. Supported: ${Object.keys(operationRegistry).join(", ")}`,
    });
  }

  // Zod validation — each operation owns its schema
  const parsed = op.schema.safeParse(fields);
  if (!parsed.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Invalid fields for ${operationName}: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    });
  }

  return op.execute(parsed.data, ctx);
}

// ── LLM system prompt fragment ─────────────────────────────────────────────────
/**
 * Returns a formatted string listing all registered operations with their
 * descriptions and examples — injected into the aiDataEntry LLM system prompt.
 */
export function buildOperationPromptFragment(): string {
  return Object.values(operationRegistry)
    .map(op => {
      const examples = op.examples.map(e => `    - "${e}"`).join("\n");
      return `  • ${op.name}: ${op.description}\n${examples}`;
    })
    .join("\n\n");
}
