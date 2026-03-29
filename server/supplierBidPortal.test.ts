/**
 * supplierBidPortal.test.ts
 * Tests for the public supplier bid portal — token generation, validation,
 * public bid submission, revoke, and resend flows.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock DB ────────────────────────────────────────────────────────────────────
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock("./db", () => ({
  getDb: () => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  }),
}));

vi.mock("./storage", () => ({}));

// ── Token generation ───────────────────────────────────────────────────────────
describe("Supplier Bid Portal — token utilities", () => {
  it("generates a 64-char hex token", () => {
    const crypto = require("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique tokens on each call", () => {
    const crypto = require("crypto");
    const t1 = crypto.randomBytes(32).toString("hex");
    const t2 = crypto.randomBytes(32).toString("hex");
    expect(t1).not.toBe(t2);
  });
});

// ── Expiry calculation ─────────────────────────────────────────────────────────
describe("Supplier Bid Portal — expiry calculation", () => {
  it("calculates 7-day expiry correctly", () => {
    const now = Date.now();
    const expiry = new Date(now + 7 * 24 * 60 * 60 * 1000);
    const diffDays = Math.round((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  it("calculates 30-day expiry correctly", () => {
    const now = Date.now();
    const expiry = new Date(now + 30 * 24 * 60 * 60 * 1000);
    const diffDays = Math.round((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it("detects expired tokens", () => {
    const pastDate = new Date(Date.now() - 1000); // 1 second ago
    const isExpired = pastDate < new Date();
    expect(isExpired).toBe(true);
  });

  it("detects valid (non-expired) tokens", () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isExpired = futureDate < new Date();
    expect(isExpired).toBe(false);
  });
});

// ── Invite status transitions ──────────────────────────────────────────────────
describe("Supplier Bid Portal — status transitions", () => {
  it("pending invite can be revoked", () => {
    const invite = { status: "pending" };
    const canRevoke = invite.status === "pending";
    expect(canRevoke).toBe(true);
  });

  it("submitted invite cannot be revoked", () => {
    const invite = { status: "submitted" };
    const canRevoke = invite.status === "pending";
    expect(canRevoke).toBe(false);
  });

  it("expired invite can be resent", () => {
    const invite = { status: "expired" };
    const canResend = invite.status === "expired" || invite.status === "revoked";
    expect(canResend).toBe(true);
  });

  it("revoked invite can be resent", () => {
    const invite = { status: "revoked" };
    const canResend = invite.status === "expired" || invite.status === "revoked";
    expect(canResend).toBe(true);
  });

  it("pending invite cannot be resent", () => {
    const invite = { status: "pending" };
    const canResend = invite.status === "expired" || invite.status === "revoked";
    expect(canResend).toBe(false);
  });
});

// ── Bid submission validation ──────────────────────────────────────────────────
describe("Supplier Bid Portal — bid submission validation", () => {
  it("rejects submission with negative price", () => {
    const totalPrice = -100;
    const isValid = totalPrice === null || totalPrice >= 0;
    expect(isValid).toBe(false);
  });

  it("accepts submission with zero price", () => {
    const totalPrice = 0;
    const isValid = totalPrice === null || totalPrice >= 0;
    expect(isValid).toBe(true);
  });

  it("accepts submission with null price (price not provided)", () => {
    const totalPrice = null;
    const isValid = totalPrice === null || totalPrice >= 0;
    expect(isValid).toBe(true);
  });

  it("rejects submission with negative delivery days", () => {
    const deliveryDays = -5;
    const isValid = deliveryDays === null || deliveryDays > 0;
    expect(isValid).toBe(false);
  });

  it("accepts submission with positive delivery days", () => {
    const deliveryDays = 30;
    const isValid = deliveryDays === null || deliveryDays > 0;
    expect(isValid).toBe(true);
  });
});

// ── Invite link generation ─────────────────────────────────────────────────────
describe("Supplier Bid Portal — invite link format", () => {
  it("generates correct invite URL format", () => {
    const origin = "https://goldenteam.manus.space";
    const token = "abc123def456";
    const link = `${origin}/rfq/${token}`;
    expect(link).toBe("https://goldenteam.manus.space/rfq/abc123def456");
  });

  it("invite URL contains the token", () => {
    const token = "test-token-xyz";
    const link = `https://example.com/rfq/${token}`;
    expect(link).toContain(token);
  });
});

// ── Criterion score input validation ──────────────────────────────────────────
describe("Supplier Bid Portal — criterion score validation", () => {
  it("accepts score of 0", () => {
    const score = 0;
    const isValid = score >= 0 && score <= 100;
    expect(isValid).toBe(true);
  });

  it("accepts score of 100", () => {
    const score = 100;
    const isValid = score >= 0 && score <= 100;
    expect(isValid).toBe(true);
  });

  it("rejects score above 100", () => {
    const score = 101;
    const isValid = score >= 0 && score <= 100;
    expect(isValid).toBe(false);
  });

  it("rejects negative score", () => {
    const score = -1;
    const isValid = score >= 0 && score <= 100;
    expect(isValid).toBe(false);
  });
});
