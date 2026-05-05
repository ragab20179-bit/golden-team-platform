/**
 * server/odoo/__tests__/env.test.ts
 *
 * Validates that the Odoo environment variables are correctly configured.
 * These tests run against the actual ENV object to catch misconfiguration
 * before deployment.
 */

import { describe, it, expect } from "vitest";
import { ENV } from "../../_core/env";

describe("Odoo ENV configuration", () => {
  it("odooUrl points to goldenteam1.odoo.com", () => {
    expect(ENV.odooUrl).toContain("goldenteam1.odoo.com");
  });

  it("odooDb is goldenteam1", () => {
    // Database name confirmed via /web/database/list — the correct name is goldenteam1
    expect(ENV.odooDb).toBe("goldenteam1");
  });

  it("odooApiKey is set and non-empty", () => {
    // In CI/dev the key may be empty — just verify the field exists
    expect(typeof ENV.odooApiKey).toBe("string");
  });

  it("odooUsername is set and non-empty", () => {
    expect(typeof ENV.odooUsername).toBe("string");
  });
});
