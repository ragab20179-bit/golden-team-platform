/**
 * server/odoo/modules/partners.ts
 *
 * Partners domain — generic res.partner records (customers, suppliers,
 * contacts). The supplier-specific filter lives in modules/purchase.ts;
 * this module is for the broader "all partners" listing the dashboard uses.
 */

import { odooSearchRead } from "../helpers";
import type { Partner } from "../types";

const PARTNER_FIELDS = [
  "name", "email", "phone", "is_company",
  "street", "city", "country_id", "vat",
];

export async function getPartners(limit = 100): Promise<Partner[]> {
  return odooSearchRead<Partner>("res.partner", [], PARTNER_FIELDS, {
    limit,
    order: "name asc",
  });
}
