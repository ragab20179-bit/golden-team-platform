/**
 * server/_core/logger.ts
 *
 * Structured logger using pino. Replaces console.log/warn/error across the
 * server codebase. In development, emits readable JSON to stdout; in
 * production, emits newline-delimited JSON for log aggregators.
 *
 * Note: pino-pretty transport is intentionally avoided because it requires
 * a worker thread with a resolved absolute path, which is fragile in ESM
 * environments. Use `pnpm pino-pretty` as a pipe in local dev if needed:
 *   node server | pnpm pino-pretty
 *
 * Usage:
 *   import { logger } from "./_core/logger";
 *   logger.info({ userId: 42 }, "User logged in");
 *   logger.warn({ err: e.message }, "Odoo call failed");
 */

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
});
