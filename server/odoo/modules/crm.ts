/**
 * server/odoo/modules/crm.ts
 *
 * CRM domain — leads, opportunities, pipeline stages.
 */

import { odooSearchRead, odooCreate } from "../helpers";
import type { CrmLead, CrmStage } from "../types";

const LEAD_FIELDS = [
  "name", "partner_id", "stage_id", "expected_revenue",
  "prorated_revenue", "probability", "user_id", "team_id",
  "date_deadline", "date_closed", "priority", "type",
  "description", "phone", "email_from",
];

const STAGE_FIELDS = ["name", "sequence", "probability", "is_won"];

export async function getCrmLeads(limit = 50): Promise<CrmLead[]> {
  return odooSearchRead<CrmLead>("crm.lead", [], LEAD_FIELDS, {
    limit,
    order: "create_date desc",
  });
}

export async function getCrmStages(): Promise<CrmStage[]> {
  return odooSearchRead<CrmStage>("crm.stage", [], STAGE_FIELDS, {
    limit: 20,
    order: "sequence asc",
  });
}

export interface CreateCrmLeadInput {
  name: string;
  partnerId?: number;
  expectedRevenue?: number;
  description?: string;
  phone?: string;
  email?: string;
}

export async function createCrmLead(input: CreateCrmLeadInput): Promise<number> {
  const values: Record<string, unknown> = {
    name: input.name,
    type: "opportunity",
  };
  if (input.partnerId !== undefined) values.partner_id = input.partnerId;
  if (input.expectedRevenue !== undefined) values.expected_revenue = input.expectedRevenue;
  if (input.description !== undefined) values.description = input.description;
  if (input.phone !== undefined) values.phone = input.phone;
  if (input.email !== undefined) values.email_from = input.email;
  return odooCreate("crm.lead", values);
}
