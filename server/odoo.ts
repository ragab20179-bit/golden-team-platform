/**
 * server/odoo.ts
 *
 * Re-export shim. All implementation has moved to server/odoo/ directory
 * as part of the Odoo Client v2 PR.
 *
 * This file exists so that existing imports written as `from "../odoo"` or
 * `from "./odoo"` continue to resolve without any changes to callers.
 *
 * The original implementation is preserved at server/odoo.ts.bak for
 * reference during the migration window.
 *
 * This shim will be deleted in PR #3 (after 30 days of clean JSON-2
 * production traffic), at which point all callers should import directly
 * from "../odoo/index" or the specific module they need.
 */

export * from "./odoo/index";
