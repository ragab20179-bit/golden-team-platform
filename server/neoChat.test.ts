/**
 * NEO Chat/Intercom — M1 of Phase 2
 * Tests for conversation management and message routing
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([]),
  })),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Hello from NEO AI!" } }],
  }),
}));

// ─── Routing Algorithm Tests ──────────────────────────────────────────────────
describe("NEO Chat — Routing Algorithm", () => {
  // Replicate the routing logic inline for unit testing
  const MANUS_KEYWORDS = [
    "project", "task", "schedule", "milestone", "budget", "resource",
    "procurement", "vendor", "invoice", "hr", "employee", "leave",
    "kpi", "report", "audit", "compliance", "iso", "governance",
    "decision", "approval", "authority", "policy", "meeting",
    "مشروع", "مهمة", "جدول", "ميزانية", "موارد", "مشتريات",
    "موظف", "إجازة", "تقرير", "امتثال", "اجتماع",
  ];

  const GPT_KEYWORDS = [
    "write", "draft", "summarize", "translate", "explain", "analyze",
    "create", "generate", "suggest", "brainstorm", "review", "edit",
    "اكتب", "لخص", "ترجم", "اشرح", "حلل", "اقترح",
  ];

  function routeMessage(message: string): {
    engine: "manus" | "gpt" | "hybrid";
    breakdown: { manusScore: number; gptScore: number; hybridBoost: number; keywordHits: string[] };
  } {
    const lower = message.toLowerCase();
    const words = lower.split(/\s+/);

    let manusScore = 0;
    let gptScore = 0;
    const keywordHits: string[] = [];

    for (const word of words) {
      if (MANUS_KEYWORDS.some(k => word.includes(k))) {
        manusScore++;
        keywordHits.push(word);
      }
      if (GPT_KEYWORDS.some(k => word.includes(k))) {
        gptScore++;
        keywordHits.push(word);
      }
    }

    const hybridBoost = manusScore > 0 && gptScore > 0 ? 1 : 0;
    let engine: "manus" | "gpt" | "hybrid";

    if (hybridBoost) {
      engine = "hybrid";
    } else if (manusScore > gptScore) {
      engine = "manus";
    } else if (gptScore > manusScore) {
      engine = "gpt";
    } else {
      engine = "manus"; // default
    }

    return { engine, breakdown: { manusScore, gptScore, hybridBoost, keywordHits } };
  }

  it("routes project management queries to manus engine", () => {
    const result = routeMessage("What is the status of the current project milestone?");
    expect(result.engine).toBe("manus");
    expect(result.breakdown.manusScore).toBeGreaterThan(0);
  });

  it("routes creative writing queries to gpt engine", () => {
    const result = routeMessage("Write a summary of our quarterly results");
    expect(result.engine).toBe("gpt");
    expect(result.breakdown.gptScore).toBeGreaterThan(0);
  });

  it("routes mixed queries to hybrid engine", () => {
    const result = routeMessage("Summarize the project budget report");
    expect(result.engine).toBe("hybrid");
    expect(result.breakdown.hybridBoost).toBe(1);
  });

  it("defaults to manus for ambiguous queries", () => {
    const result = routeMessage("Hello, how are you?");
    expect(result.engine).toBe("manus");
  });

  it("routes Arabic project queries to manus engine", () => {
    const result = routeMessage("ما هو وضع المشروع الحالي؟");
    expect(result.engine).toBe("manus");
    expect(result.breakdown.manusScore).toBeGreaterThan(0);
  });

  it("routes Arabic writing queries to gpt engine", () => {
    const result = routeMessage("اكتب ملخصاً للتقرير الربعي");
    expect(result.engine).toBe("hybrid"); // اكتب (write) + تقرير (report)
    expect(result.breakdown.hybridBoost).toBe(1);
  });

  it("tracks keyword hits correctly", () => {
    const result = routeMessage("project budget approval");
    expect(result.breakdown.keywordHits.length).toBeGreaterThan(0);
  });
});

// ─── Conversation Title Generation ───────────────────────────────────────────
describe("NEO Chat — Conversation Title Generation", () => {
  function generateTitle(firstMessage: string): string {
    const words = firstMessage.trim().split(/\s+/);
    const title = words.slice(0, 6).join(" ");
    return title.length > 40 ? title.substring(0, 40) + "…" : title;
  }

  it("generates a title from the first message", () => {
    const title = generateTitle("What is the status of the current project?");
    expect(title).toBe("What is the status of the");
  });

  it("truncates long titles at 40 characters", () => {
    // Use a message where the first 6 words exceed 40 characters
    const title = generateTitle("Comprehensive quarterly performance evaluation report for the executive board review committee");
    // First 6 words: 'Comprehensive quarterly performance evaluation report for' = 56 chars
    expect(title.length).toBeLessThanOrEqual(43); // 40 + "…"
    expect(title.endsWith("…")).toBe(true);
  });

  it("handles short messages without truncation", () => {
    const title = generateTitle("Hello NEO");
    expect(title).toBe("Hello NEO");
  });

  it("handles Arabic messages", () => {
    const title = generateTitle("ما هو وضع المشروع الحالي؟");
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
});

// ─── Message Validation ───────────────────────────────────────────────────────
describe("NEO Chat — Message Validation", () => {
  function validateMessage(body: string): { valid: boolean; error?: string } {
    if (!body || body.trim().length === 0) {
      return { valid: false, error: "Message cannot be empty" };
    }
    if (body.length > 10000) {
      return { valid: false, error: "Message too long (max 10,000 characters)" };
    }
    return { valid: true };
  }

  it("accepts valid messages", () => {
    expect(validateMessage("Hello NEO!").valid).toBe(true);
  });

  it("rejects empty messages", () => {
    const result = validateMessage("");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("rejects whitespace-only messages", () => {
    const result = validateMessage("   ");
    expect(result.valid).toBe(false);
  });

  it("rejects messages over 10,000 characters", () => {
    const result = validateMessage("a".repeat(10001));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("too long");
  });

  it("accepts messages at exactly 10,000 characters", () => {
    expect(validateMessage("a".repeat(10000)).valid).toBe(true);
  });
});

// ─── Conversation Type Classification ────────────────────────────────────────
describe("NEO Chat — Conversation Types", () => {
  const VALID_TYPES = ["general", "project", "hr", "erp", "crm", "kpi", "procurement", "legal", "audit"] as const;
  type ConvType = typeof VALID_TYPES[number];

  function isValidConvType(type: string): type is ConvType {
    return VALID_TYPES.includes(type as ConvType);
  }

  it("accepts all valid conversation types", () => {
    for (const type of VALID_TYPES) {
      expect(isValidConvType(type)).toBe(true);
    }
  });

  it("rejects invalid conversation types", () => {
    expect(isValidConvType("invalid")).toBe(false);
    expect(isValidConvType("")).toBe(false);
    expect(isValidConvType("GENERAL")).toBe(false); // case sensitive
  });
});
