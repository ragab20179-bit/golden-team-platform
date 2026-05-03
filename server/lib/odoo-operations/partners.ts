import { z } from "zod";
import type { Operation } from "./types";

// ── Shared partner fields schema ──────────────────────────────────────────────
const partnerBaseSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  countryId: z.number().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

// ── CREATE_CUSTOMER ───────────────────────────────────────────────────────────
export const createCustomer: Operation<typeof partnerBaseSchema> = {
  name: "CREATE_CUSTOMER",
  description: "Create a new customer (res.partner with customer_rank=1)",
  examples: [
    "create customer MOBCO for civil constructions",
    "add new customer John Doe with email john@example.com",
    "register client Gulf Ventures",
  ],
  schema: partnerBaseSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("res.partner", {
      name: f.name,
      is_company: true,
      customer_rank: 1,
      supplier_rank: 0,
      ...(f.email    ? { email: f.email }           : {}),
      ...(f.phone    ? { phone: f.phone }           : {}),
      ...(f.mobile   ? { mobile: f.mobile }         : {}),
      ...(f.street   ? { street: f.street }         : {}),
      ...(f.city     ? { city: f.city }             : {}),
      ...(f.countryId ? { country_id: f.countryId } : {}),
      ...(f.website  ? { website: f.website }       : {}),
      ...(f.notes    ? { comment: f.notes }         : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `Customer "${f.name}" created in Odoo (ID: ${id})` };
  },
};

// ── CREATE_VENDOR ─────────────────────────────────────────────────────────────
export const createVendor: Operation<typeof partnerBaseSchema> = {
  name: "CREATE_VENDOR",
  description: "Create a new vendor/supplier (res.partner with supplier_rank=1)",
  examples: [
    "create vendor ABC Supplies",
    "add supplier Tech Parts Inc",
    "register new vendor Al-Rashidi Trading",
  ],
  schema: partnerBaseSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("res.partner", {
      name: f.name,
      is_company: true,
      supplier_rank: 1,
      customer_rank: 0,
      ...(f.email    ? { email: f.email }           : {}),
      ...(f.phone    ? { phone: f.phone }           : {}),
      ...(f.mobile   ? { mobile: f.mobile }         : {}),
      ...(f.street   ? { street: f.street }         : {}),
      ...(f.city     ? { city: f.city }             : {}),
      ...(f.countryId ? { country_id: f.countryId } : {}),
      ...(f.website  ? { website: f.website }       : {}),
      ...(f.notes    ? { comment: f.notes }         : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `Vendor "${f.name}" created in Odoo (ID: ${id})` };
  },
};

// ── UPDATE_PARTNER ────────────────────────────────────────────────────────────
const updatePartnerSchema = z.object({
  partnerId: z.number(),
  name:    z.string().optional(),
  email:   z.string().email().optional(),
  phone:   z.string().optional(),
  mobile:  z.string().optional(),
  street:  z.string().optional(),
  city:    z.string().optional(),
  notes:   z.string().optional(),
});

export const updatePartner: Operation<typeof updatePartnerSchema> = {
  name: "UPDATE_PARTNER",
  description: "Update an existing partner (customer or vendor) by ID",
  examples: [
    "update partner 42 email to new@email.com",
    "change phone for partner 15 to +966 50 000 0000",
  ],
  schema: updatePartnerSchema,
  execute: async (f, ctx) => {
    const updateData: Record<string, unknown> = {};
    if (f.name)   updateData.name    = f.name;
    if (f.email)  updateData.email   = f.email;
    if (f.phone)  updateData.phone   = f.phone;
    if (f.mobile) updateData.mobile  = f.mobile;
    if (f.street) updateData.street  = f.street;
    if (f.city)   updateData.city    = f.city;
    if (f.notes)  updateData.comment = f.notes;
    await ctx.odooWrite("res.partner", [f.partnerId], updateData);
    await ctx.auditSuccess(f.partnerId, `Partner #${f.partnerId}`);
    return { success: true, id: f.partnerId, message: `Partner #${f.partnerId} updated` };
  },
};
