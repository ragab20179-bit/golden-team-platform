import { z } from "zod";
import type { Operation } from "./types";

// ── CREATE_CRM_LEAD ───────────────────────────────────────────────────────────
const createLeadSchema = z.object({
  name: z.string().min(1),
  partnerName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  expectedRevenue: z.number().optional(),
  stageId: z.number().optional(),
  description: z.string().optional(),
});

export const createCrmLead: Operation<typeof createLeadSchema> = {
  name: "CREATE_CRM_LEAD",
  description: "Create a CRM opportunity/lead",
  examples: [
    "add CRM opportunity: Gulf Ventures, expected revenue SAR 200,000",
    "create lead for Al-Rashidi Group IT project",
    "new CRM opportunity: Mansouri Holdings consulting engagement",
  ],
  schema: createLeadSchema,
  execute: async (f, ctx) => {
    const id = await ctx.odooCreate("crm.lead", {
      name: f.name,
      ...(f.partnerName     ? { partner_name: f.partnerName }           : {}),
      ...(f.contactName     ? { contact_name: f.contactName }           : {}),
      ...(f.email           ? { email_from: f.email }                   : {}),
      ...(f.phone           ? { phone: f.phone }                        : {}),
      ...(f.expectedRevenue ? { expected_revenue: f.expectedRevenue }   : {}),
      ...(f.stageId         ? { stage_id: f.stageId }                   : {}),
      ...(f.description     ? { description: f.description }            : {}),
    });
    await ctx.auditSuccess(id, String(f.name));
    return { success: true, id, message: `CRM Lead "${f.name}" created (ID: ${id})` };
  },
};

// ── UPDATE_CRM_LEAD_STAGE ─────────────────────────────────────────────────────
const updateLeadStageSchema = z.object({
  leadId: z.number(),
  stageId: z.number(),
});

export const updateCrmLeadStage: Operation<typeof updateLeadStageSchema> = {
  name: "UPDATE_CRM_LEAD_STAGE",
  description: "Move a CRM lead/opportunity to a different pipeline stage",
  examples: [
    "move CRM lead 42 to stage 3",
    "update opportunity 15 to Won stage",
    "advance lead 8 to Proposal stage",
  ],
  schema: updateLeadStageSchema,
  execute: async (f, ctx) => {
    await ctx.odooWrite("crm.lead", [f.leadId], { stage_id: f.stageId });
    await ctx.auditSuccess(f.leadId, `Lead #${f.leadId}`);
    return { success: true, id: f.leadId, message: `CRM Lead #${f.leadId} moved to stage ${f.stageId}` };
  },
};
