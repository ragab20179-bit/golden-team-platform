import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_PURCHASE_ORDER ─────────────────────────────────────────────────────
const createPOSchema = z.object({
  partnerId: z.number(),
  orderLines: z.array(z.object({
    productId: z.number(),
    qty: z.number().positive(),
    priceUnit: z.number().optional(),
    name: z.string().optional(),
  })).min(1),
  datePlanned: z.string().optional(),
  notes: z.string().optional(),
});

export const createPurchaseOrder: Operation<typeof createPOSchema> = {
  name: "CREATE_PURCHASE_ORDER",
  description: "Create a purchase order for a supplier with one or more order lines",
  examples: [
    "create PO for supplier 15 with 100 units of product 42 at SAR 50 each",
    "order 50 Office Chairs from vendor 8 at SAR 500 each",
    "create purchase order for ABC Supplies: 10 laptops at SAR 3000",
  ],
  schema: createPOSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("purchase.order", {
      partner_id: f.partnerId,
      notes: f.notes ?? "",
      date_planned: f.datePlanned ?? new Date().toISOString(),
      order_line: f.orderLines.map(l => [0, 0, {
        product_id: l.productId,
        product_qty: l.qty,
        price_unit: l.priceUnit ?? 0,
        name: l.name ?? "",
      }]),
    });
    await ctx.auditSuccess(id, `PO #${id}`);
    return { success: true, id, message: `Purchase Order created (ID: ${id})` };
  },
};

// ── CONFIRM_PURCHASE_ORDER ────────────────────────────────────────────────────
const confirmPOSchema = z.object({
  orderId: z.number(),
});

export const confirmPurchaseOrder: Operation<typeof confirmPOSchema> = {
  name: "CONFIRM_PURCHASE_ORDER",
  description: "Confirm/validate a draft purchase order",
  examples: [
    "confirm purchase order 42",
    "validate PO number 15",
    "approve draft purchase order 8",
  ],
  schema: confirmPOSchema,
  execute: async (f, ctx) => {
    await ctx.odooAction("purchase.order", "button_confirm", [f.orderId]);
    await ctx.auditSuccess(f.orderId, `PO #${f.orderId}`);
    return { success: true, id: f.orderId, message: `Purchase Order #${f.orderId} confirmed` };
  },
};
