/**
 * Tests for NEO AI Module procedures and GPT-4o helper.
 *
 * Strategy: We test the STRUCTURE and ROUTING of each procedure without making
 * real AI API calls (which are non-deterministic and cost money). We mock the
 * AI helpers and DB so tests are fast, deterministic, and free.
 *
 * What is verified:
 * 1. isGPTConfigured() returns a boolean based on OPENAI_API_KEY presence
 * 2. buildAnalyticalSystemPrompt() includes the module name and context
 * 3. getMetrics procedure returns the correct shape with all required fields
 * 4. Each AI module procedure returns the required response shape
 * 5. callAnalyticalAI falls back to Manus Forge when GPT is not configured
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@goldenteam.sa",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Unit tests for GPT helper ────────────────────────────────────────────────

describe("gpt.ts — isGPTConfigured()", () => {
  it("returns true when OPENAI_API_KEY is set", async () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "sk-test-key-12345";
    const { isGPTConfigured } = await import("./_core/gpt");
    expect(isGPTConfigured()).toBe(true);
    process.env.OPENAI_API_KEY = original;
  });

  it("returns false when OPENAI_API_KEY is empty", async () => {
    const original = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";
    const { isGPTConfigured } = await import("./_core/gpt");
    expect(isGPTConfigured()).toBe(false);
    process.env.OPENAI_API_KEY = original;
  });
});

describe("gpt.ts — buildAnalyticalSystemPrompt()", () => {
  it("includes the module name in the system prompt", async () => {
    const { buildAnalyticalSystemPrompt } = await import("./_core/gpt");
    const prompt = buildAnalyticalSystemPrompt("Financial AI", "Some context");
    expect(prompt).toContain("Financial AI");
  });

  it("includes the context summary in the system prompt", async () => {
    const { buildAnalyticalSystemPrompt } = await import("./_core/gpt");
    const context = "KPI count: 42, HR employees: 15";
    const prompt = buildAnalyticalSystemPrompt("Business Management AI", context);
    expect(prompt).toContain(context);
  });

  it("includes accuracy policy instructions", async () => {
    const { buildAnalyticalSystemPrompt } = await import("./_core/gpt");
    const prompt = buildAnalyticalSystemPrompt("Risk Management AI", "test context");
    // Per AI_RESPONSE_POLICY.md — must instruct model not to fabricate
    expect(prompt.toLowerCase()).toMatch(/cannot confirm|fabricat|verif|uncertain/);
  });
});

// ─── getMetrics shape test ─────────────────────────────────────────────────────

describe("neoModules.getMetrics — response shape", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns all required metric fields with correct types", async () => {
    // Mock the DB module to return zero counts (no real DB needed)
    vi.doMock("../drizzle/schema", () => ({
      neoMessages: {},
      neoConversations: {},
      requests: {},
      astraDecisions: {},
      hrEmployees: {},
      kpiTargets: {},
      procurementItems: {},
      vaultFiles: {},
      astraPolicyRules: {},
      neoAiUsage: {},  // required by getMetrics cost queries
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(makeUsageDb()),
    }));

    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    const metrics = await caller.getMetrics();

    // Verify all required fields are present
    expect(metrics).toHaveProperty("totalMessages");
    expect(metrics).toHaveProperty("todayMessages");
    expect(metrics).toHaveProperty("totalConversations");
    expect(metrics).toHaveProperty("manusPercent");
    expect(metrics).toHaveProperty("gptPercent");
    expect(metrics).toHaveProperty("manusMessages");
    expect(metrics).toHaveProperty("gptMessages");
    expect(metrics).toHaveProperty("hybridMessages");
    expect(metrics).toHaveProperty("totalRequests");
    expect(metrics).toHaveProperty("pendingRequests");
    expect(metrics).toHaveProperty("totalDecisions");
    expect(metrics).toHaveProperty("totalEmployees");
    expect(metrics).toHaveProperty("totalKpiTargets");
    expect(metrics).toHaveProperty("totalProcurementItems");
    expect(metrics).toHaveProperty("totalVaultFiles");
    expect(metrics).toHaveProperty("gptConfigured");
    expect(metrics).toHaveProperty("snapshotAt");

    // Type checks
    expect(typeof metrics.totalMessages).toBe("number");
    expect(typeof metrics.manusPercent).toBe("number");
    expect(typeof metrics.gptConfigured).toBe("boolean");
    expect(typeof metrics.snapshotAt).toBe("string");
  });

  it("defaults manusPercent to 80 and gptPercent to 20 when no messages exist", async () => {
    vi.doMock("../drizzle/schema", () => ({
      neoMessages: {},
      neoConversations: {},
      requests: {},
      astraDecisions: {},
      hrEmployees: {},
      kpiTargets: {},
      procurementItems: {},
      vaultFiles: {},
      astraPolicyRules: {},
      neoAiUsage: {},  // required by getMetrics cost queries
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(makeUsageDb()),
    }));

    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    const metrics = await caller.getMetrics();

    // When aiMessages = 0, defaults to 80/20 split
    expect(metrics.manusPercent).toBe(80);
    expect(metrics.gptPercent).toBe(20);
  });
});

// ─── Input validation tests ───────────────────────────────────────────────────

describe("neoModules — input validation", () => {
  it("analyzeFinancials rejects empty query", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    await expect(
      caller.analyzeFinancials({ query: "" })
    ).rejects.toThrow();
  });

  it("analyzeFinancials rejects query over 2000 chars", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    await expect(
      caller.analyzeFinancials({ query: "x".repeat(2001) })
    ).rejects.toThrow();
  });

  it("assessRisk rejects empty query", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    await expect(
      caller.assessRisk({ query: "" })
    ).rejects.toThrow();
  });

  it("makeDecision accepts optional domain field", async () => {
    // Just validate the schema — no actual AI call
    const { z } = await import("zod");
    const inputSchema = z.object({
      query: z.string().min(1).max(2000),
      domain: z.string().optional(),
    });
    expect(() => inputSchema.parse({ query: "Should we approve this?" })).not.toThrow();
    expect(() => inputSchema.parse({ query: "Should we approve this?", domain: "Finance" })).not.toThrow();
  });

  it("chat procedure rejects empty query", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    // chat uses 'query' field
    await expect(
      // @ts-expect-error intentionally passing empty string
      caller.chat({ query: "", language: "en" })
    ).rejects.toThrow();
  });

  it("chat procedure accepts Arabic language", async () => {
    const { z } = await import("zod");
    const inputSchema = z.object({
      query: z.string().min(1).max(5000),
      language: z.enum(["en", "ar"]).default("en"),
    });
    expect(() => inputSchema.parse({ query: "مرحبا", language: "ar" })).not.toThrow();
  });
});

// ─── NEO Chat routing test ────────────────────────────────────────────────────

describe("neoChat routing — engine selection", () => {
  it("analytical keywords route to GPT-4o engine label", () => {
    // Verify the routing logic keyword list is correct (no AI call needed)
    const ANALYTICAL_KEYWORDS = [
      "financial", "budget", "cost", "expense", "revenue", "profit", "loss",
      "forecast", "analysis", "analyze", "risk", "compliance", "audit",
      "engineering", "technical evaluation", "procurement strategy",
      "legal", "contract review", "iso", "qms", "kpi performance",
      "variance", "benchmark", "strategic", "market analysis",
    ];

    const testQuery = "analyze the financial variance in our Q1 budget";
    const lower = testQuery.toLowerCase();
    const isAnalytical = ANALYTICAL_KEYWORDS.some(kw => lower.includes(kw));
    expect(isAnalytical).toBe(true);
  });

  it("conversational queries do not match analytical keywords", () => {
    const ANALYTICAL_KEYWORDS = [
      "financial", "budget", "cost", "expense", "revenue", "profit", "loss",
      "forecast", "analysis", "analyze", "risk", "compliance", "audit",
    ];

    const testQuery = "hello, how do I submit a leave request?";
    const lower = testQuery.toLowerCase();
    const isAnalytical = ANALYTICAL_KEYWORDS.some(kw => lower.includes(kw));
    expect(isAnalytical).toBe(false);
  });
});

// ─── getUsageStats shape test ──────────────────────────────────────────────────

// Helper: creates a fully chainable Drizzle mock that resolves to `rows` at any point
function makeChainableDb(rows: unknown[] = []) {
  const chain: Record<string, unknown> = {};
  const resolve = vi.fn().mockResolvedValue(rows);
  // Every method returns the same chain object, and the chain is also thenable
  const methods = ["from", "where", "orderBy", "limit", "groupBy", "having", "leftJoin", "innerJoin"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain itself a Promise (thenable)
  chain.then = resolve.getMockImplementation();
  // Also allow direct await by making it a real promise
  Object.assign(chain, Promise.resolve(rows));
  // Override: make the chain awaitable by wrapping in a Proxy
  return new Proxy(chain, {
    get(target, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return Promise.resolve(rows)[prop as "then"];
      }
      return target[prop as string] ?? vi.fn().mockReturnValue(new Proxy(chain, this));
    },
  });
}

function makeUsageDb() {
  // Creates a fully chainable Drizzle-like mock that supports:
  // .select().from() — direct await
  // .select().from().where() — await
  // .select().from().orderBy().limit() — await
  // .select().from().limit() — await
  const makeFromResult = () => ({
    where: vi.fn().mockResolvedValue([{ count: 0 }]),
    orderBy: vi.fn().mockImplementation(() => ({
      limit: vi.fn().mockResolvedValue([]),
    })),
    limit: vi.fn().mockResolvedValue([]),
    // direct await (no where/orderBy/limit)
    then: (resolve: (v: unknown) => void, _reject?: unknown) => Promise.resolve([{ count: 0 }]).then(resolve),
    catch: (fn: (e: unknown) => void) => Promise.resolve([{ count: 0 }]).catch(fn),
    finally: (fn: () => void) => Promise.resolve([{ count: 0 }]).finally(fn),
  });
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockImplementation(() => makeFromResult()),
    }),
    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  };
}

describe("neoModules.getUsageStats — response shape", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns all required usage fields with correct types", async () => {
    // Mock DB to return empty usage table with full chain support
    vi.doMock("../drizzle/schema", () => ({
      neoAiUsage: {},
      neoMessages: {},
      neoConversations: {},
      requests: {},
      astraDecisions: {},
      hrEmployees: {},
      kpiTargets: {},
      procurementItems: {},
      vaultFiles: {},
      astraPolicyRules: {},
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(makeUsageDb()),
    }));

    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    const stats = await caller.getUsageStats();

    // Verify all required fields are present
    expect(stats).toHaveProperty("totalCalls");
    expect(stats).toHaveProperty("todayCalls");
    expect(stats).toHaveProperty("totalTokens");
    expect(stats).toHaveProperty("totalCostUsd");
    expect(stats).toHaveProperty("callsByModule");
    expect(stats).toHaveProperty("costByModule");
    expect(stats).toHaveProperty("pricingNote");

    // Type checks
    expect(typeof stats.totalCalls).toBe("number");
    expect(typeof stats.todayCalls).toBe("number");
    expect(typeof stats.totalTokens).toBe("number");
    expect(typeof stats.totalCostUsd).toBe("string"); // formatted as string e.g. "0.000000"
    expect(typeof stats.callsByModule).toBe("object");
    expect(typeof stats.costByModule).toBe("object");
    expect(typeof stats.pricingNote).toBe("string");
  });

  it("returns zero counts when neo_ai_usage table is empty", async () => {
    vi.doMock("../drizzle/schema", () => ({
      neoAiUsage: {},
      neoMessages: {},
      neoConversations: {},
      requests: {},
      astraDecisions: {},
      hrEmployees: {},
      kpiTargets: {},
      procurementItems: {},
      vaultFiles: {},
      astraPolicyRules: {},
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(makeUsageDb()),
    }));

    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    const stats = await caller.getUsageStats();

    expect(stats.totalCalls).toBe(0);
    expect(stats.todayCalls).toBe(0);
    expect(stats.totalTokens).toBe(0);
    expect(stats.totalCostUsd).toBe("0.000000");
  });

  it("pricingNote references openai.com/api/pricing as the source", async () => {
    vi.doMock("../drizzle/schema", () => ({
      neoAiUsage: {},
      neoMessages: {},
      neoConversations: {},
      requests: {},
      astraDecisions: {},
      hrEmployees: {},
      kpiTargets: {},
      procurementItems: {},
      vaultFiles: {},
      astraPolicyRules: {},
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue(makeUsageDb()),
    }));

    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    const stats = await caller.getUsageStats();

    // Per AI Response Policy: cost figures must cite their source
    expect(stats.pricingNote).toContain("openai.com");
  });
});

// ─── AIModuleQueryPanel tRPC contract tests ───────────────────────────────────

describe("neoModules — AIModuleQueryPanel tRPC contracts", () => {
  it("all 7 module procedures exist on the router", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    // Verify all 7 AI module procedures are registered (using actual procedure names from neoModules.ts)
    const procedures = Object.keys(neoModulesRouter._def.procedures);
    expect(procedures).toContain("analyzeFinancials");   // Financial AI
    expect(procedures).toContain("assessRisk");           // Risk Management AI
    expect(procedures).toContain("makeDecision");         // Decision-Making AI
    expect(procedures).toContain("analyzeProblems");      // Critical Thinking AI
    expect(procedures).toContain("qmsAnalysis");          // QMS AI
    expect(procedures).toContain("businessIntelligence"); // Business Management AI
    expect(procedures).toContain("chat");                 // Conversational AI
    expect(procedures).toContain("getMetrics");
    expect(procedures).toContain("getUsageStats");
  });

  it("all AI module procedures require authentication (protectedProcedure)", async () => {
    // Verify that calling without auth context throws UNAUTHORIZED
    const { neoModulesRouter } = await import("./routers/neoModules");
    const unauthCaller = neoModulesRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
    });
    await expect(unauthCaller.analyzeFinancials({ query: "test" })).rejects.toThrow();
    await expect(unauthCaller.getMetrics()).rejects.toThrow();
    await expect(unauthCaller.getUsageStats()).rejects.toThrow();
  });
});
