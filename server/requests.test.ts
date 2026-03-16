/**
 * Requests & Approval Engine — Vitest Tests
 * Tests: authority matrix logic, approval chain generation, request number format,
 * amount threshold enforcement, priority validation, request type validation
 */

import { describe, it, expect } from "vitest";

// ─── Authority Matrix Logic (extracted from requests.ts) ──────────────────────

type RequestType = "leave" | "purchase" | "contract" | "travel" | "expense" | "it_access" | "hr_change" | "custom";
type Priority = "low" | "normal" | "high" | "urgent";

interface ApprovalStep {
  stepOrder: number;
  approverRole: string;
  slaHours: number;
}

function buildApprovalChain(type: RequestType, amountSar?: number, priority?: Priority): ApprovalStep[] {
  const steps: ApprovalStep[] = [];

  if (type === "leave") {
    steps.push({ stepOrder: 1, approverRole: "manager", slaHours: 24 });
    return steps;
  }

  if (type === "it_access") {
    steps.push({ stepOrder: 1, approverRole: "it_manager", slaHours: 8 });
    return steps;
  }

  if (type === "hr_change") {
    steps.push({ stepOrder: 1, approverRole: "hr_manager", slaHours: 24 });
    steps.push({ stepOrder: 2, approverRole: "ceo", slaHours: 48 });
    return steps;
  }

  // Financial requests: purchase, contract, expense, travel
  const amount = amountSar ?? 0;

  if (amount <= 10_000) {
    steps.push({ stepOrder: 1, approverRole: "manager", slaHours: 24 });
  } else if (amount <= 50_000) {
    steps.push({ stepOrder: 1, approverRole: "manager", slaHours: 24 });
    steps.push({ stepOrder: 2, approverRole: "director", slaHours: 48 });
  } else if (amount <= 500_000) {
    steps.push({ stepOrder: 1, approverRole: "manager", slaHours: 24 });
    steps.push({ stepOrder: 2, approverRole: "director", slaHours: 48 });
    steps.push({ stepOrder: 3, approverRole: "ceo", slaHours: 72 });
  }
  // > 500_000: denied by ASTRA AMG (empty chain)

  // Urgent priority: halve all SLAs
  if (priority === "urgent") {
    return steps.map(s => ({ ...s, slaHours: Math.max(1, Math.floor(s.slaHours / 2)) }));
  }

  return steps;
}

function checkAstraPolicy(type: RequestType, amountSar?: number): { allowed: boolean; reasonCode?: string } {
  const amount = amountSar ?? 0;

  // Board threshold: > 500,000 SAR requires board approval (not in system)
  if (["purchase", "contract", "expense"].includes(type) && amount > 500_000) {
    return { allowed: false, reasonCode: "EXCEEDS_BOARD_THRESHOLD" };
  }

  // Travel always requires manager approval
  if (type === "travel" && amount > 50_000) {
    return { allowed: false, reasonCode: "TRAVEL_EXCEEDS_LIMIT" };
  }

  return { allowed: true };
}

function generateRequestNumber(type: RequestType, count: number): string {
  const prefixes: Record<RequestType, string> = {
    leave:     "LV",
    purchase:  "PO",
    contract:  "CT",
    travel:    "TR",
    expense:   "EX",
    it_access: "IT",
    hr_change: "HR",
    custom:    "CU",
  };
  const prefix = prefixes[type] ?? "RQ";
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(4, "0");
  return `GT-${prefix}-${year}-${seq}`;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Request Number Generation", () => {
  it("generates correct leave request number", () => {
    const num = generateRequestNumber("leave", 0);
    expect(num).toMatch(/^GT-LV-\d{4}-0001$/);
  });

  it("generates correct purchase order number", () => {
    const num = generateRequestNumber("purchase", 5);
    expect(num).toMatch(/^GT-PO-\d{4}-0006$/);
  });

  it("generates correct contract number", () => {
    const num = generateRequestNumber("contract", 99);
    expect(num).toMatch(/^GT-CT-\d{4}-0100$/);
  });

  it("pads sequence number to 4 digits", () => {
    const num = generateRequestNumber("expense", 0);
    expect(num.split("-")[3]).toBe("0001");
  });

  it("includes current year in request number", () => {
    const num = generateRequestNumber("travel", 0);
    const year = new Date().getFullYear().toString();
    expect(num).toContain(year);
  });
});

describe("Approval Chain Generation", () => {
  it("leave request requires 1 step (manager)", () => {
    const chain = buildApprovalChain("leave");
    expect(chain).toHaveLength(1);
    expect(chain[0].approverRole).toBe("manager");
  });

  it("IT access requires 1 step (IT manager)", () => {
    const chain = buildApprovalChain("it_access");
    expect(chain).toHaveLength(1);
    expect(chain[0].approverRole).toBe("it_manager");
  });

  it("HR change requires 2 steps (HR manager → CEO)", () => {
    const chain = buildApprovalChain("hr_change");
    expect(chain).toHaveLength(2);
    expect(chain[0].approverRole).toBe("hr_manager");
    expect(chain[1].approverRole).toBe("ceo");
  });

  it("purchase ≤ 10,000 SAR requires 1 step", () => {
    const chain = buildApprovalChain("purchase", 5000);
    expect(chain).toHaveLength(1);
    expect(chain[0].approverRole).toBe("manager");
  });

  it("purchase 10,001–50,000 SAR requires 2 steps", () => {
    const chain = buildApprovalChain("purchase", 25000);
    expect(chain).toHaveLength(2);
    expect(chain[1].approverRole).toBe("director");
  });

  it("purchase 50,001–500,000 SAR requires 3 steps", () => {
    const chain = buildApprovalChain("purchase", 100000);
    expect(chain).toHaveLength(3);
    expect(chain[2].approverRole).toBe("ceo");
  });

  it("purchase > 500,000 SAR returns empty chain (denied by ASTRA)", () => {
    const chain = buildApprovalChain("purchase", 600000);
    expect(chain).toHaveLength(0);
  });

  it("urgent priority halves SLA hours", () => {
    const normal = buildApprovalChain("purchase", 5000, "normal");
    const urgent = buildApprovalChain("purchase", 5000, "urgent");
    expect(urgent[0].slaHours).toBe(Math.max(1, Math.floor(normal[0].slaHours / 2)));
  });

  it("step orders are sequential starting from 1", () => {
    const chain = buildApprovalChain("purchase", 100000);
    chain.forEach((step, idx) => {
      expect(step.stepOrder).toBe(idx + 1);
    });
  });
});

describe("ASTRA AMG Policy Enforcement", () => {
  it("allows purchase under board threshold", () => {
    const result = checkAstraPolicy("purchase", 100000);
    expect(result.allowed).toBe(true);
  });

  it("denies purchase exceeding 500,000 SAR board threshold", () => {
    const result = checkAstraPolicy("purchase", 600000);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("EXCEEDS_BOARD_THRESHOLD");
  });

  it("denies contract exceeding 500,000 SAR", () => {
    const result = checkAstraPolicy("contract", 750000);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("EXCEEDS_BOARD_THRESHOLD");
  });

  it("allows leave request (no amount threshold)", () => {
    const result = checkAstraPolicy("leave");
    expect(result.allowed).toBe(true);
  });

  it("denies travel exceeding 50,000 SAR", () => {
    const result = checkAstraPolicy("travel", 60000);
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe("TRAVEL_EXCEEDS_LIMIT");
  });

  it("allows travel under 50,000 SAR", () => {
    const result = checkAstraPolicy("travel", 20000);
    expect(result.allowed).toBe(true);
  });

  it("allows IT access (no amount check)", () => {
    const result = checkAstraPolicy("it_access");
    expect(result.allowed).toBe(true);
  });

  it("allows HR change (no amount check)", () => {
    const result = checkAstraPolicy("hr_change");
    expect(result.allowed).toBe(true);
  });
});

describe("Request Validation", () => {
  it("valid request types are accepted", () => {
    const validTypes: RequestType[] = ["leave", "purchase", "contract", "travel", "expense", "it_access", "hr_change", "custom"];
    validTypes.forEach(type => {
      const chain = buildApprovalChain(type, 1000);
      expect(Array.isArray(chain)).toBe(true);
    });
  });

  it("zero amount purchase gets 1 approval step", () => {
    const chain = buildApprovalChain("purchase", 0);
    expect(chain).toHaveLength(1);
  });

  it("exact threshold 10,000 SAR gets 1 step", () => {
    const chain = buildApprovalChain("purchase", 10000);
    expect(chain).toHaveLength(1);
  });

  it("exact threshold 50,000 SAR gets 2 steps", () => {
    const chain = buildApprovalChain("purchase", 50000);
    expect(chain).toHaveLength(2);
  });

  it("exact threshold 500,000 SAR gets 3 steps", () => {
    const chain = buildApprovalChain("purchase", 500000);
    expect(chain).toHaveLength(3);
  });
});
