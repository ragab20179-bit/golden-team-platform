/**
 * Operation Registry Types
 * Implements Claude's Command/Strategy pattern recommendation (Q3 peer review).
 * Each operation is a self-contained unit with its own Zod schema and execute function.
 */
import { z } from "zod";

// ── Context passed to every operation execute() ──────────────────────────────
export interface OperationContext {
  odooCreate: (model: string, data: Record<string, unknown>) => Promise<number>;
  odooWrite: (model: string, ids: number[], data: Record<string, unknown>) => Promise<boolean | void>;
  odooAction: (model: string, action: string, ids: number[]) => Promise<unknown>;
  auditSuccess: (recordId: number | unknown, label: string) => Promise<void>;
  auditFail: (msg: string) => Promise<void>;
}

// ── Result returned by every operation ───────────────────────────────────────
export interface OperationResult {
  success: boolean;
  id: number | unknown;
  message: string;
  warnings?: string[];
}

// ── Operation definition ──────────────────────────────────────────────────────
export interface Operation<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Machine-readable name — matches the LLM operation enum value */
  name: string;
  /** Human-readable description injected into the LLM system prompt */
  description: string;
  /** Example natural-language phrases that trigger this operation */
  examples: string[];
  /** Zod schema for the fields object the LLM must produce */
  schema: TSchema;
  /** Execute the operation against Odoo */
  execute: (fields: z.infer<TSchema>, ctx: OperationContext) => Promise<OperationResult>;
}

// ── Registry type ─────────────────────────────────────────────────────────────
export type OperationRegistry = Record<string, Operation<z.ZodTypeAny>>;
