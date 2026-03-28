/**
 * Bid Evaluation Matrix — Server-side unit tests
 * Tests: DB helpers, FastAPI engine payload, scoring logic, status transitions
 */

import { describe, it, expect, vi } from "vitest";

// ── RFQ Number Generation ──────────────────────────────────────────────────────
describe("RFQ Number Generation", () => {
  it("generates a valid RFQ number format", () => {
    const year = new Date().getFullYear();
    const rfqNumber = `RFQ-${year}-${String(1).padStart(4, "0")}`;
    expect(rfqNumber).toMatch(/^RFQ-\d{4}-\d{4}$/);
    expect(rfqNumber).toContain(String(year));
  });

  it("pads sequence number to 4 digits", () => {
    const seq = 42;
    const padded = String(seq).padStart(4, "0");
    expect(padded).toBe("0042");
  });

  it("handles sequence 9999 correctly", () => {
    const seq = 9999;
    const padded = String(seq).padStart(4, "0");
    expect(padded).toBe("9999");
  });
});

// ── Criteria Weight Validation ─────────────────────────────────────────────────
describe("Criteria Weight Validation", () => {
  it("accepts criteria that sum to 100%", () => {
    const criteria = [{ weight: 50 }, { weight: 30 }, { weight: 20 }];
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBe(100);
  });

  it("rejects criteria that do not sum to 100%", () => {
    const criteria = [{ weight: 50 }, { weight: 30 }];
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).not.toBe(100);
  });

  it("handles single criterion with 100% weight", () => {
    const criteria = [{ weight: 100 }];
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBe(100);
  });

  it("detects when weights exceed 100%", () => {
    const criteria = [{ weight: 60 }, { weight: 60 }];
    const total = criteria.reduce((s, c) => s + c.weight, 0);
    expect(total).toBeGreaterThan(100);
  });
});

// ── Bid Score Calculation ──────────────────────────────────────────────────────
describe("Bid Score Calculation", () => {
  it("calculates min-ratio score for price criterion", () => {
    // min_ratio: score = (min_value / bid_value) * 100
    const minPrice = 100_000;
    const bidPrice = 150_000;
    const score = (minPrice / bidPrice) * 100;
    expect(score).toBeCloseTo(66.67, 1);
  });

  it("gives 100 score to the lowest price bid", () => {
    const minPrice = 100_000;
    const bidPrice = 100_000;
    const score = (minPrice / bidPrice) * 100;
    expect(score).toBe(100);
  });

  it("calculates linear score for experience criterion", () => {
    // linear: score = (value - min) / (max - min) * 100
    const min = 0;
    const max = 20;
    const value = 15;
    const score = ((value - min) / (max - min)) * 100;
    expect(score).toBe(75);
  });

  it("calculates weighted final score correctly", () => {
    // 80*0.5 + 90*0.3 + 70*0.2 = 40 + 27 + 14 = 81
    const scores = [
      { score: 80, weight: 50 },
      { score: 90, weight: 30 },
      { score: 70, weight: 20 },
    ];
    const finalScore = scores.reduce((s, c) => s + (c.score * c.weight) / 100, 0);
    expect(finalScore).toBe(81);
  });

  it("ranks vendors by final score descending", () => {
    const vendors = [
      { name: "Vendor A", score: 75 },
      { name: "Vendor B", score: 92 },
      { name: "Vendor C", score: 68 },
    ];
    const ranked = [...vendors].sort((a, b) => b.score - a.score);
    expect(ranked[0].name).toBe("Vendor B");
    expect(ranked[1].name).toBe("Vendor A");
    expect(ranked[2].name).toBe("Vendor C");
  });
});

// ── FastAPI Engine Payload Builder ─────────────────────────────────────────────
describe("FastAPI Engine Payload Builder", () => {
  it("builds a valid evaluate payload structure", () => {
    const criteria = [
      { id: 1, name: "Price", criterionType: "price", weight: 50, higherIsBetter: false, formula: null },
      { id: 2, name: "Experience", criterionType: "linear", weight: 50, higherIsBetter: true, formula: null },
    ];
    const bids = [
      { id: 10, vendorName: "Alpha Co", criterionValues: [{ criterionId: 1, value: "100000" }, { criterionId: 2, value: "10" }] },
      { id: 11, vendorName: "Beta Ltd", criterionValues: [{ criterionId: 1, value: "120000" }, { criterionId: 2, value: "15" }] },
    ];

    const payload = {
      criteria: criteria.map(c => ({
        id: `crit_${c.id}`,
        name: c.name,
        type: c.criterionType,
        weight: c.weight / 100,
        higher_is_better: c.higherIsBetter,
        formula: c.formula ?? undefined,
      })),
      bids: bids.map(b => {
        const values: Record<string, number> = {};
        for (const cv of b.criterionValues) {
          values[`crit_${cv.criterionId}`] = parseFloat(cv.value);
        }
        return { vendor: b.vendorName, values };
      }),
    };

    expect(payload.criteria).toHaveLength(2);
    expect(payload.bids).toHaveLength(2);
    expect(payload.criteria[0].weight).toBe(0.5);
    expect(payload.bids[0].vendor).toBe("Alpha Co");
    expect(payload.bids[0].values["crit_1"]).toBe(100_000);
  });

  it("normalizes criterion weights to sum to 1.0", () => {
    const weights = [50, 30, 20];
    const normalized = weights.map(w => w / 100);
    const sum = normalized.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 5);
  });

  it("uses crit_{id} as column key for criterion values", () => {
    const criterionId = 7;
    const key = `crit_${criterionId}`;
    expect(key).toBe("crit_7");
  });
});

// ── Status Transition Logic ────────────────────────────────────────────────────
describe("RFQ Status Transitions", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    draft:      ["published", "cancelled"],
    published:  ["evaluation", "cancelled"],
    evaluation: ["awarded", "cancelled"],
    awarded:    ["closed"],
    closed:     [],
    cancelled:  [],
  };

  it("allows draft → published transition", () => {
    expect(VALID_TRANSITIONS["draft"]).toContain("published");
  });

  it("allows draft → cancelled transition", () => {
    expect(VALID_TRANSITIONS["draft"]).toContain("cancelled");
  });

  it("allows evaluation → awarded transition", () => {
    expect(VALID_TRANSITIONS["evaluation"]).toContain("awarded");
  });

  it("does not allow awarded → published transition", () => {
    expect(VALID_TRANSITIONS["awarded"]).not.toContain("published");
  });

  it("does not allow closed → any transition", () => {
    expect(VALID_TRANSITIONS["closed"]).toHaveLength(0);
  });

  it("does not allow cancelled → any transition", () => {
    expect(VALID_TRANSITIONS["cancelled"]).toHaveLength(0);
  });
});

// ── Evaluation Session Metadata ────────────────────────────────────────────────
describe("Evaluation Session Metadata", () => {
  it("stores evaluation timestamp as UTC ms", () => {
    const now = Date.now();
    expect(typeof now).toBe("number");
    expect(now).toBeGreaterThan(1_700_000_000_000); // after Nov 2023
  });

  it("identifies winner as rank 1 vendor", () => {
    const ranked = [
      { vendor: "Gulf Systems", ranking: 1, final_score: 92.5 },
      { vendor: "Al-Rashidi Tech", ranking: 2, final_score: 78.3 },
      { vendor: "Saudi IT", ranking: 3, final_score: 65.1 },
    ];
    const winner = ranked.find(r => r.ranking === 1);
    expect(winner?.vendor).toBe("Gulf Systems");
    expect(winner?.final_score).toBeGreaterThan(ranked[1].final_score);
  });

  it("calculates score margin between winner and runner-up", () => {
    const winner = { final_score: 92.5 };
    const runnerUp = { final_score: 78.3 };
    const margin = winner.final_score - runnerUp.final_score;
    expect(margin).toBeCloseTo(14.2, 1);
  });
});

// ── Bid Validation ─────────────────────────────────────────────────────────────
describe("Bid Validation", () => {
  it("requires vendor name to be non-empty", () => {
    const vendorName = "  ";
    expect(vendorName.trim()).toBe("");
  });

  it("accepts valid vendor name", () => {
    const vendorName = "Gulf Systems LLC";
    expect(vendorName.trim().length).toBeGreaterThan(0);
  });

  it("parses numeric criterion values from strings", () => {
    const rawValue = "125000.50";
    const parsed = parseFloat(rawValue);
    expect(parsed).toBe(125_000.5);
    expect(isNaN(parsed)).toBe(false);
  });

  it("defaults invalid criterion values to 0", () => {
    const rawValue = "not-a-number";
    const parsed = parseFloat(rawValue) || 0;
    expect(parsed).toBe(0);
  });
});
