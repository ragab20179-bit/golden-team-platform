/**
 * ASTRA AMG — tRPC Procedure Tests
 * Covers all 6 procedures: logDecision, clearLog, getDecisions,
 * getPolicyRules, upsertPolicyRule, deletePolicyRule
 *
 * Strategy: vi.mock the DB helpers so tests run without a real DB connection.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock all DB helpers ───────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  insertAstraDecision: vi.fn().mockResolvedValue(undefined),
  getAstraDecisions: vi.fn().mockResolvedValue([]),
  getAstraDecisionsByOutcome: vi.fn().mockResolvedValue([]),
  clearAstraDecisions: vi.fn().mockResolvedValue(5),
  getAstraPolicyRules: vi.fn().mockResolvedValue([]),
  upsertAstraPolicyRule: vi.fn().mockResolvedValue(undefined),
  deleteAstraPolicyRule: vi.fn().mockResolvedValue(undefined),
}));

import {
  insertAstraDecision,
  getAstraDecisions,
  getAstraDecisionsByOutcome,
  clearAstraDecisions,
  getAstraPolicyRules,
  upsertAstraPolicyRule,
  deleteAstraPolicyRule,
} from "./db";

// ─── Context helpers ───────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user-openid",
      email: "test@goldenteam.sa",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Sample decision payload ───────────────────────────────────────────────────

const SAMPLE_DECISION = {
  decisionId: "DEC-2026-001",
  requestId: "REQ-2026-001",
  actorId: "user-123",
  actorRole: "manager",
  domain: "procurement",
  action: "create_po",
  outcome: "ALLOW" as const,
  reasonCode: "POLICY_ALLOW",
  policyPackVersion: "2.0.0",
  latencyMs: 12,
  contextSnapshot: { amount: 5000, currency: "SAR" },
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("astra.logDecision", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists a valid ALLOW decision and returns success", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.logDecision(SAMPLE_DECISION);

    expect(result).toEqual({ success: true });
    expect(insertAstraDecision).toHaveBeenCalledOnce();
    expect(insertAstraDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decisionId: "DEC-2026-001",
        outcome: "ALLOW",
        domain: "procurement",
        action: "create_po",
      })
    );
  });

  it("persists a DENY decision correctly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const denyDecision = { ...SAMPLE_DECISION, outcome: "DENY" as const, reasonCode: "ROLE_NOT_AUTHORIZED" };
    const result = await caller.astra.logDecision(denyDecision);

    expect(result).toEqual({ success: true });
    expect(insertAstraDecision).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "DENY", reasonCode: "ROLE_NOT_AUTHORIZED" })
    );
  });

  it("persists an ESCALATE decision correctly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const escalateDecision = { ...SAMPLE_DECISION, outcome: "ESCALATE" as const, reasonCode: "AMOUNT_EXCEEDS_SAR" };
    const result = await caller.astra.logDecision(escalateDecision);

    expect(result).toEqual({ success: true });
    expect(insertAstraDecision).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: "ESCALATE" })
    );
  });

  it("accepts a decision without optional contextSnapshot", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const { contextSnapshot: _, ...withoutContext } = SAMPLE_DECISION;
    const result = await caller.astra.logDecision(withoutContext);

    expect(result).toEqual({ success: true });
    expect(insertAstraDecision).toHaveBeenCalledWith(
      expect.objectContaining({ contextSnapshot: null })
    );
  });

  it("rejects an invalid outcome value", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.astra.logDecision({ ...SAMPLE_DECISION, outcome: "INVALID" as "ALLOW" })
    ).rejects.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("astra.clearLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears all decisions and returns the count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.clearLog();

    expect(result).toEqual({ cleared: 5 });
    expect(clearAstraDecisions).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("astra.getDecisions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no decisions exist", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.getDecisions();

    expect(result).toEqual([]);
    expect(getAstraDecisions).toHaveBeenCalledWith(200);
  });

  it("passes custom limit to DB helper", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.astra.getDecisions({ limit: 50 });

    expect(getAstraDecisions).toHaveBeenCalledWith(50);
  });

  it("filters by outcome when provided", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await caller.astra.getDecisions({ outcome: "DENY" });

    expect(getAstraDecisionsByOutcome).toHaveBeenCalledWith("DENY", 200);
    expect(getAstraDecisions).not.toHaveBeenCalled();
  });

  it("returns all decisions when no filter is applied", async () => {
    const mockDecisions = [
      { ...SAMPLE_DECISION, id: 1, createdAt: new Date() },
      { ...SAMPLE_DECISION, id: 2, outcome: "DENY", createdAt: new Date() },
    ];
    vi.mocked(getAstraDecisions).mockResolvedValueOnce(mockDecisions as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.getDecisions({ limit: 10 });

    expect(result).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("astra.getPolicyRules", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no rules exist", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.getPolicyRules();

    expect(result).toEqual([]);
    expect(getAstraPolicyRules).toHaveBeenCalledOnce();
  });

  it("returns existing rules from DB", async () => {
    const mockRules = [
      { id: 1, domain: "procurement", action: "create_po", role: "staff", allowed: false, requireConsent: false, requireJustification: true, maxAmountSar: null, notes: null, createdBy: "admin", createdAt: new Date() },
    ];
    vi.mocked(getAstraPolicyRules).mockResolvedValueOnce(mockRules as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.astra.getPolicyRules();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ domain: "procurement", action: "create_po", allowed: false });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("astra.upsertPolicyRule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication — rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.astra.upsertPolicyRule({
        domain: "procurement",
        action: "create_po",
        role: "staff",
        allowed: false,
      })
    ).rejects.toThrow();
  });

  it("persists a new policy rule override when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.astra.upsertPolicyRule({
      domain: "procurement",
      action: "approve_contract",
      role: "staff",
      allowed: false,
      requireConsent: false,
      requireJustification: true,
      notes: "Staff cannot approve contracts",
    });

    expect(result).toEqual({ success: true });
    expect(upsertAstraPolicyRule).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "procurement",
        action: "approve_contract",
        role: "staff",
        allowed: false,
        createdBy: "Test User",
      })
    );
  });

  it("sets defaults for optional boolean fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await caller.astra.upsertPolicyRule({
      domain: "hr",
      action: "view_payroll",
      role: "manager",
      allowed: true,
    });

    expect(upsertAstraPolicyRule).toHaveBeenCalledWith(
      expect.objectContaining({
        requireConsent: false,
        requireJustification: false,
        maxAmountSar: null,
        notes: null,
      })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("astra.deletePolicyRule", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires authentication — rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.astra.deletePolicyRule({ id: 1 })).rejects.toThrow();
  });

  it("deletes a rule by id when authenticated", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.astra.deletePolicyRule({ id: 42 });

    expect(result).toEqual({ success: true });
    expect(deleteAstraPolicyRule).toHaveBeenCalledWith(42);
  });

  it("rejects non-integer id", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      caller.astra.deletePolicyRule({ id: 1.5 })
    ).rejects.toThrow();
  });
});
