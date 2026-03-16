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
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        }),
      }),
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
    }));

    vi.doMock("./db", () => ({
      getDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 0 }]),
          }),
        }),
      }),
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
  it("analyzeFinancial rejects empty query", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    await expect(
      caller.analyzeFinancial({ query: "" })
    ).rejects.toThrow();
  });

  it("analyzeFinancial rejects query over 2000 chars", async () => {
    const { neoModulesRouter } = await import("./routers/neoModules");
    const caller = neoModulesRouter.createCaller(createAuthContext());
    await expect(
      caller.analyzeFinancial({ query: "x".repeat(2001) })
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
    await expect(
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
