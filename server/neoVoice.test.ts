/**
 * NEO Voice Router — Vitest Tests
 *
 * Tests the three tRPC procedures in neoVoiceRouter:
 *   getEphemeralToken → logSessionUsage → executeTool
 *
 * getEphemeralToken calls the OpenAI Realtime API — mocked here.
 * logSessionUsage writes to neo_ai_usage — DB mocked.
 * executeTool queries DB tables — DB mocked per tool.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoist mock variables so vi.mock factories can reference them ─────────────

const { mockFetch, mockInsert, mockSelect } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockInsert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
  mockSelect: vi.fn(),
}));

vi.stubGlobal("fetch", mockFetch);

// ─── Mock DB (getDb) ──────────────────────────────────────────────────────────

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
  }),
}));

// ─── Mock ENV ─────────────────────────────────────────────────────────────────

vi.mock("../server/_core/env", () => ({
  ENV: {
    openAiApiKey: "sk-test-mock-key",
    jwtSecret: "test-secret",
  },
}));

// ─── Import router after mocks ────────────────────────────────────────────────

import { neoVoiceRouter } from "../server/routers/neoVoice";

// ─── Helper: create mock tRPC caller ─────────────────────────────────────────

function createCaller(userId = 1, openId = "user-open-id-001") {
  const mockCtx = {
    user: {
      id: userId,
      name: "Test Employee",
      openId,
      role: "user" as const,
    },
    req: {} as any,
    res: {} as any,
  };
  return neoVoiceRouter.createCaller(mockCtx);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("neoVoiceRouter", () => {
  let caller: ReturnType<typeof createCaller>;

  beforeEach(() => {
    caller = createCaller();
    vi.clearAllMocks();

    // Default: DB select returns empty arrays — supports full Drizzle chain
    const makeChain = (rows: any[] = []) => ({
      limit: vi.fn().mockResolvedValue(rows),
      orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
        orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
      }),
    });
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue(makeChain()),
    });
  });

  // ── getEphemeralToken ────────────────────────────────────────────────────────

  describe("getEphemeralToken", () => {
    it("returns ephemeralToken, sessionId, and contextSummary on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "sess_abc123",
          client_secret: { value: "ek_live_test_token", expires_at: 1800000000 },
          model: "gpt-4o-realtime-preview",
          voice: "nova",
        }),
      });

      const result = await caller.getEphemeralToken({ voice: "nova", language: "en" });

      expect(result.ephemeralToken).toBe("ek_live_test_token");
      expect(result.sessionId).toBe("sess_abc123");
      expect(result.model).toBe("gpt-4o-realtime-preview");
      expect(result.voice).toBe("nova");
      expect(typeof result.contextSummary).toBe("string");
      expect(result.expiresAt).toBe(1800000000);
    });

    it("uses the correct OpenAI Realtime sessions endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "sess_xyz",
          client_secret: { value: "ek_test", expires_at: 1800000000 },
          model: "gpt-4o-realtime-preview",
          voice: "alloy",
        }),
      });

      await caller.getEphemeralToken({ voice: "alloy", language: "auto" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/realtime/sessions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer sk-test-mock-key",
          }),
        })
      );
    });

    it("sends correct model and voice in request body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "sess_shimmer",
          client_secret: { value: "ek_shimmer", expires_at: 1800000000 },
          model: "gpt-4o-realtime-preview",
          voice: "shimmer",
        }),
      });

      await caller.getEphemeralToken({ voice: "shimmer", language: "ar" });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.model).toBe("gpt-4o-realtime-preview");
      expect(body.voice).toBe("shimmer");
      expect(body.input_audio_transcription).toEqual({ model: "whisper-1" });
      expect(body.turn_detection.type).toBe("server_vad");
    });

    it("throws when OpenAI API returns an error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => "Invalid API key",
      });

      await expect(
        caller.getEphemeralToken({ voice: "nova", language: "en" })
      ).rejects.toThrow("Failed to mint ephemeral token");
    });

    it("includes Arabic language instruction when language is ar", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "sess_ar",
          client_secret: { value: "ek_ar", expires_at: 1800000000 },
          model: "gpt-4o-realtime-preview",
          voice: "nova",
        }),
      });

      await caller.getEphemeralToken({ voice: "nova", language: "ar" });

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.instructions).toContain("Arabic");
    });
  });

  // ── logSessionUsage ──────────────────────────────────────────────────────────

  describe("logSessionUsage", () => {
    it("logs usage and returns logged: true with costUsd", async () => {
      const result = await caller.logSessionUsage({
        sessionId: "sess_voice_001",
        durationSeconds: 120,
        inputTokens: 5000,
        outputTokens: 3000,
      });

      expect(result.logged).toBe(true);
      expect(typeof result.costUsd).toBe("number");
      expect(result.costUsd).toBeGreaterThan(0);
    });

    it("calculates cost correctly using OpenAI Realtime pricing", async () => {
      // Source: openai.com/api/pricing (March 2026)
      // Audio input: $40.00 / 1M tokens → 1000 tokens = $0.00004
      // Audio output: $80.00 / 1M tokens → 1000 tokens = $0.00008
      const result = await caller.logSessionUsage({
        sessionId: "sess_cost_test",
        durationSeconds: 60,
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
      });

      // 1M input × $40 + 1M output × $80 = $120
      expect(result.costUsd).toBeCloseTo(120.0, 2);
    });

    it("accepts optional query string", async () => {
      const result = await caller.logSessionUsage({
        sessionId: "sess_with_query",
        durationSeconds: 30,
        inputTokens: 500,
        outputTokens: 300,
        query: "What is the current KPI status?",
      });

      expect(result.logged).toBe(true);
    });

    it("handles zero-duration sessions (connection test)", async () => {
      const result = await caller.logSessionUsage({
        sessionId: "sess_zero",
        durationSeconds: 0,
        inputTokens: 0,
        outputTokens: 0,
      });

      expect(result.logged).toBe(true);
      expect(result.costUsd).toBe(0);
    });
  });

  // ── executeTool ──────────────────────────────────────────────────────────────

  describe("executeTool", () => {
    it("rejects unknown tool names", async () => {
      await expect(
        caller.executeTool({
          toolName: "delete_all_data",
          arguments: {},
        })
      ).rejects.toThrow();
    });

    it("get_kpi_status returns result string", async () => {
      // Mock DB returning a KPI record — supports full Drizzle chain
      const kpiRows = [{ name: "Revenue Growth", currentValue: "12.5", targetValue: "15.0", unit: "%", status: "on_track" }];
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(kpiRows),
            orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(kpiRows) }),
          }),
          limit: vi.fn().mockResolvedValue(kpiRows),
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(kpiRows) }),
        }),
      });

      const result = await caller.executeTool({
        toolName: "get_kpi_status",
        arguments: { name: "Revenue Growth" },
      });

      expect(typeof result.result).toBe("string");
      expect(result.result.length).toBeGreaterThan(0);
    });

    it("search_vault returns result string", async () => {
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { name: "Q1 Report.pdf", summary: "Quarterly financial report", folder: "finance" },
            ]),
          }),
        }),
      });

      const result = await caller.executeTool({
        toolName: "search_vault",
        arguments: { query: "Q1 financial" },
      });

      expect(typeof result.result).toBe("string");
    });

    it("get_pending_requests returns result string", async () => {
      const reqRows = [{ id: 1, title: "Office Supplies", status: "pending", type: "procurement" }];
      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(reqRows),
            orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(reqRows) }),
          }),
          limit: vi.fn().mockResolvedValue(reqRows),
          orderBy: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(reqRows) }),
        }),
      });

      const result = await caller.executeTool({
        toolName: "get_pending_requests",
        arguments: {},
      });

      expect(typeof result.result).toBe("string");
    });
  });
});
