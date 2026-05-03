import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import { vaultRouter } from "./routers/vault";
import { universalUploadRouter } from "./routers/universalUpload";
import { modulesRouter } from "./routers/modules";
import { neoChatRouter } from "./routers/neoChat";
import { requestsRouter } from "./routers/requests";
import { neoModulesRouter } from "./routers/neoModules";
import { neoVoiceRouter } from "./routers/neoVoice";
import { odooRouter } from "./routers/odoo";
import { bidEvaluationRouter } from "./routers/bidEvaluation";
import { supplierBidPortalRouter } from "./routers/supplierBidPortal";
import {
  insertAstraDecision,
  getAstraDecisions,
  getAstraDecisionsByOutcome,
  clearAstraDecisions,
  getAstraPolicyRules,
  upsertAstraPolicyRule,
  deleteAstraPolicyRule,
  getUserByEmail,
  upsertUser,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /**
     * Email + password login for local accounts (employees and super admin).
     * Does NOT require Manus OAuth — credentials stored in DB with bcrypt.
     */
    emailLogin: publicProcedure
      .input(z.object({
        email: z.string().email(),
        // max(72): bcrypt silently truncates at 72 bytes — enforce it in schema
        // so the stored hash and the login hash always cover the same bytes.
        password: z.string().min(1).max(72),
      }))
      .mutation(async ({ input, ctx }) => {
        // Normalise email only — passwords are sacred bytes, never trim.
        const email = input.email.trim().toLowerCase();
        const password = input.password; // intentional: no .trim()
        const user = await getUserByEmail(email);
        // Timing-attack guard (Claude Q1 recommendation):
        // Always run bcrypt.compare even when the user is not found so that
        // response time cannot be used to enumerate valid email addresses.
        const DUMMY_HASH = '$2b$12$invalidhashpadding000000000000000000000000000000';
        const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
        const valid = await bcrypt.compare(password, hashToCompare);
        if (!user || !user.passwordHash || !valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password' });
        }
        // Update lastSignedIn
        await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
        // Issue session cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || '',
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, role: user.role } as const;
      }),

    /**
     * Change password for the currently logged-in user.
     * Requires current password for verification before updating.
     */
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user.email) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No email associated with this account' });
        }
        const user = await getUserByEmail(ctx.user.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No password set for this account. Use OAuth login.' });
        }
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect' });
        }
        const newHash = await bcrypt.hash(input.newPassword, 12);
        await upsertUser({ openId: user.openId, passwordHash: newHash });
        return { success: true } as const;
      }),

    /**
     * Admin-only: Create a new employee account with email + password.
     * The employee can log in immediately with the provided credentials.
     */
    createEmployee: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        role: z.enum(['admin', 'user']).default('user'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can create employee accounts' });
        }
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'An account with this email already exists' });
        }
        const passwordHash = await bcrypt.hash(input.password, 12);
        const openId = `local-${input.email.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}`;
        await upsertUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          loginMethod: 'email' as const,
          lastSignedIn: new Date(),
        });
        return { success: true, openId } as const;
      }),
  }),

  // ─── ASTRA AMG — Decision Log ──────────────────────────────────────────────
  astra: router({
    /**
     * Persist a single ASTRA decision to the append-only audit log.
     * Called from the frontend after every engine decision.
     */
    logDecision: publicProcedure
      .input(z.object({
        decisionId: z.string(),
        requestId: z.string(),
        actorId: z.string(),
        actorRole: z.string(),
        domain: z.string(),
        action: z.string(),
        outcome: z.enum(["ALLOW", "DENY", "ESCALATE", "DEGRADE"]),
        reasonCode: z.string(),
        policyPackVersion: z.string(),
        latencyMs: z.number().int().default(0),
        contextSnapshot: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        await insertAstraDecision({
          decisionId: input.decisionId,
          requestId: input.requestId,
          actorId: input.actorId,
          actorRole: input.actorRole,
          domain: input.domain,
          action: input.action,
          outcome: input.outcome,
          reasonCode: input.reasonCode,
          policyPackVersion: input.policyPackVersion,
          latencyMs: input.latencyMs,
          contextSnapshot: input.contextSnapshot ?? null,
        });
        return { success: true };
      }),

    /** Clear all decisions from the audit log (admin action). */
    clearLog: publicProcedure.mutation(async () => {
      const cleared = await clearAstraDecisions();
      return { cleared };
    }),

    /** Retrieve the most recent decisions (default 200). */
    getDecisions: publicProcedure
      .input(z.object({
        limit: z.number().int().min(1).max(500).default(200),
        outcome: z.enum(["ALLOW", "DENY", "ESCALATE", "DEGRADE"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 200;
        const outcome = input?.outcome;
        if (outcome) return getAstraDecisionsByOutcome(outcome, limit);
        return getAstraDecisions(limit);
      }),

    // ─── ASTRA AMG — Dynamic Policy Rules ──────────────────────────────────
    /** Return all dynamic policy rule overrides (Authority Matrix editor). */
    getPolicyRules: publicProcedure.query(async () => {
      return getAstraPolicyRules();
    }),

    /** Create or update a policy rule override. */
    upsertPolicyRule: protectedProcedure
      .input(z.object({
        domain: z.string(),
        action: z.string(),
        role: z.string(),
        allowed: z.boolean(),
        requireConsent: z.boolean().default(false),
        requireJustification: z.boolean().default(false),
        maxAmountSar: z.number().int().positive().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertAstraPolicyRule({
          domain: input.domain,
          action: input.action,
          role: input.role,
          allowed: input.allowed,
          requireConsent: input.requireConsent,
          requireJustification: input.requireJustification,
          maxAmountSar: input.maxAmountSar ?? null,
          notes: input.notes ?? null,
          createdBy: ctx.user?.name ?? ctx.user?.openId ?? "unknown",
        });
        return { success: true };
      }),

    /** Delete a policy rule override by id. */
    deletePolicyRule: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deleteAstraPolicyRule(input.id);
        return { success: true };
      }),
   }),

  // ─── Drive Vault — Universal File Upload ───────────────────────────────────
  vault: vaultRouter,

  // ─── Universal Chunked Upload — All modules ────────────────────────────────
  universalUpload: universalUploadRouter,
  // ─── Module Data — HR, KPI, Procurement bulk import + list ─────────────────────
  modules: modulesRouter,

  // ─── NEO Chat/Intercom — M1 of Phase 2 ─────────────────────────────────────────────
  neoChat: neoChatRouter,

  // ─── Request & Approval Engine — M3 of Phase 2 ──────────────────────────────────────
  requests: requestsRouter,

  // ─── NEO AI Modules — 7 Specialized AI Engines + Live Metrics ─────────────────────────
  neoModules: neoModulesRouter,
  neoVoice: neoVoiceRouter,
  // ─── Odoo Integration — Purchase, Accounting, Inventory, CRM, Project ────────
  odoo: odooRouter,

  // ─── Bid Evaluation Matrix — RFQ, Criteria, Bids, Scoring, Award ─────────────
  bidEvaluation: bidEvaluationRouter,

  // ─── Supplier Bid Portal — Public one-time token bid submission ───────────────
  supplierBidPortal: supplierBidPortalRouter,
});
export type AppRouter = typeof appRouter;
