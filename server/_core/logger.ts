/**
 * server/_core/logger.ts
 *
 * Structured logger using pino. Replaces console.log/warn/error across the
 * server codebase. In development, pretty-prints with colours; in production,
 * emits newline-delimited JSON for log aggregators.
 *
 * Usage:
 *   import { logger } from "./_core/logger";
 *   logger.info({ userId: 42 }, "User logged in");
 *   logger.warn({ err: e.message }, "Odoo call failed");
 */

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
