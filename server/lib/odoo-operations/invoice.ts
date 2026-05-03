import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_INVOICE ────────────────────────────────────────────────────────────
const createInvoiceSchema = z.object({
  partnerId: z.number(),
  moveType: z.enum(["out_invoice", "in_invoice"]).default("out_invoice"),
  invoiceLines: z.array(z.object({
    productId: z.number().optional(),
    name: z.string(),
    quantity: z.number().positive().default(1),
    priceUnit: z.number(),
  })).min(1),
  invoiceDate: z.string().optional(),
  notes: z.string().optional(),
});

export const createInvoice: Operation<typeof createInvoiceSchema> = {
  name: "CREATE_INVOICE",
  description: "Create a customer invoice (out_invoice) or vendor bill (in_invoice)",
  examples: [
    "create invoice for customer 5 for consulting services SAR 10000",
    "create vendor bill for supplier 12 for 5 items at SAR 200 each",
    "create customer invoice for ABC Company for SAR 5000",
  ],
  schema: createInvoiceSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("account.move", {
      partner_id: f.partnerId,
      move_type: f.moveType,
      invoice_date: f.invoiceDate ?? new Date().toISOString().split("T")[0],
      narration: f.notes ?? "",
      invoice_line_ids: f.invoiceLines.map(l => [0, 0, {
        ...(l.productId ? { product_id: l.productId } : {}),
        name: l.name,
        quantity: l.quantity,
        price_unit: l.priceUnit,
      }]),
    });
    await ctx.auditSuccess(id, `Invoice #${id}`);
    return { success: true, id, message: `Invoice created (ID: ${id})` };
  },
};

// ── POST_INVOICE ──────────────────────────────────────────────────────────────
const postInvoiceSchema = z.object({ invoiceId: z.number() });

export const postInvoice: Operation<typeof postInvoiceSchema> = {
  name: "POST_INVOICE",
  description: "Post/confirm a draft invoice to make it official",
  examples: [
    "post invoice 42",
    "confirm invoice number 15",
    "validate draft invoice 8",
  ],
  schema: postInvoiceSchema,
  execute: async (f, ctx) => {
    await ctx.odooAction("account.move", "action_post", [f.invoiceId]);
    await ctx.auditSuccess(f.invoiceId, `Invoice #${f.invoiceId}`);
    return { success: true, id: f.invoiceId, message: `Invoice #${f.invoiceId} posted` };
  },
};

// ── REGISTER_PAYMENT ──────────────────────────────────────────────────────────
const registerPaymentSchema = z.object({
  invoiceId: z.number(),
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  memo: z.string().optional(),
});

export const registerPayment: Operation<typeof registerPaymentSchema> = {
  name: "REGISTER_PAYMENT",
  description: "Register a payment against a posted invoice",
  examples: [
    "register payment for invoice 42",
    "mark invoice 15 as paid",
    "record payment of SAR 5000 for invoice 8",
  ],
  schema: registerPaymentSchema,
  execute: async (f, ctx) => {
    const paymentId = await ctx.odooCreate("account.payment.register", {
      invoice_ids: [[6, 0, [f.invoiceId]]],
      ...(f.amount      ? { amount: f.amount }                                       : {}),
      ...(f.paymentDate ? { payment_date: f.paymentDate }                            : {}),
      ...(f.memo        ? { communication: f.memo }                                  : {}),
    });
    await ctx.auditSuccess(f.invoiceId, `Payment for Invoice #${f.invoiceId}`);
    return { success: true, id: f.invoiceId, message: `Payment registered for Invoice #${f.invoiceId}` };
  },
};
