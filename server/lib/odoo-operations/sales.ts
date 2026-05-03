import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_SALE_ORDER ─────────────────────────────────────────────────────────
const createSOSchema = z.object({
  partnerId: z.number(),
  orderLines: z.array(z.object({
    productId: z.number(),
    qty: z.number().positive(),
    priceUnit: z.number(),
    name: z.string().optional(),
  })).min(1),
  notes: z.string().optional(),
});

export const createSaleOrder: Operation<typeof createSOSchema> = {
  name: "CREATE_SALE_ORDER",
  description: "Create a sale order for a customer with one or more order lines",
  examples: [
    "create sale order for customer 5: 3 laptops at SAR 3000 each",
    "create SO for Gulf Ventures: 10 chairs at SAR 500",
    "add sale order for client 8 with product 42 quantity 5 price 200",
  ],
  schema: createSOSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("sale.order", {
      partner_id: f.partnerId,
      note: f.notes ?? "",
      order_line: f.orderLines.map(l => [0, 0, {
        product_id: l.productId,
        product_uom_qty: l.qty,
        price_unit: l.priceUnit,
        name: l.name ?? "",
      }]),
    });
    await ctx.auditSuccess(id, `SO #${id}`);
    return { success: true, id, message: `Sale Order created (ID: ${id})` };
  },
};

// ── CONFIRM_SALE_ORDER ────────────────────────────────────────────────────────
const confirmSOSchema = z.object({ orderId: z.number() });

export const confirmSaleOrder: Operation<typeof confirmSOSchema> = {
  name: "CONFIRM_SALE_ORDER",
  description: "Confirm/validate a draft sale order",
  examples: [
    "confirm sale order 42",
    "validate SO 15",
    "approve draft sale order 8",
  ],
  schema: confirmSOSchema,
  execute: async (f, ctx) => {
    await ctx.odooAction("sale.order", "action_confirm", [f.orderId]);
    await ctx.auditSuccess(f.orderId, `SO #${f.orderId}`);
    return { success: true, id: f.orderId, message: `Sale Order #${f.orderId} confirmed` };
  },
};
