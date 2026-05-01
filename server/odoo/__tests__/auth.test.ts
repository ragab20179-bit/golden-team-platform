/**
 * server/odoo/__tests__/auth.test.ts
 *
 * Unit tests for the Redis-cached UID. The real Redis client is mocked via
 * the safeRedis fallback path — when Redis is unavailable, getCachedUid
 * falls through to in-process state, and we exercise that branch here.
 *
 * For the Redis-hit path, we use a fake Redis client injected via the
 * vitest mock of "../../_core/redis".
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ─── Mock the Redis surface used by auth.ts ──────────────────────────────────

const fakeStore = new Map<string, { value: string; expiresAt: number }>();

vi.mock("../../_core/redis", () => ({
  safeRedis: async (op: (r: unknown) => Promise<unknown>, fallback: unknown) => {
    const fakeR = {
      get: async (k: string) => {
        const entry = fakeStore.get(k);
        if (!entry) return null;
        if (entry.expiresAt < Date.now()) {
          fakeStore.delete(k);
          return null;
        }
        return entry.value;
      },
      set: async (k: string, v: string, _mode: string, ttlSec: number) => {
        fakeStore.set(k, { value: v, expiresAt: Date.now() + ttlSec * 1000 });
        return "OK";
      },
      del: async (k: string) => {
        const had = fakeStore.has(k);
        fakeStore.delete(k);
        return had ? 1 : 0;
      },
    };
    try {
      return await op(fakeR);
    } catch {
      return fallback;
    }
  },
}));

vi.mock("../../_core/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("../../_core/env", () => ({
  ENV: { odooDb: "goldenteam_test" },
}));

// ─── Import AFTER mocks are set up ───────────────────────────────────────────
import { getCachedUid, invalidateUid } from "../auth";

describe("getCachedUid", () => {
  beforeEach(async () => {
    // Clear both Redis fake store and in-process UID cache between tests
    fakeStore.clear();
    await invalidateUid();
  });

  it("authenticates on first call", async () => {
    const authenticate = vi.fn().mockResolvedValue(42);
    const uid = await getCachedUid(authenticate);
    expect(uid).toBe(42);
    expect(authenticate).toHaveBeenCalledOnce();
  });

  it("returns cached UID without re-authenticating", async () => {
    const authenticate = vi.fn().mockResolvedValue(42);
    // First call populates cache
    await getCachedUid(authenticate);
    // Second and third calls should hit cache
    await getCachedUid(authenticate);
    await getCachedUid(authenticate);
    // authenticate should only have been called once
    expect(authenticate).toHaveBeenCalledOnce();
  });

  it("re-authenticates after invalidateUid", async () => {
    const authenticate = vi.fn()
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce(43);
    expect(await getCachedUid(authenticate)).toBe(42);
    await invalidateUid();
    expect(await getCachedUid(authenticate)).toBe(43);
    expect(authenticate).toHaveBeenCalledTimes(2);
  });

  it("throws if authenticate returns 0", async () => {
    const authenticate = vi.fn().mockResolvedValue(0);
    await expect(getCachedUid(authenticate)).rejects.toThrow(/authentication failed/i);
  });

  it("throws if authenticate returns falsy", async () => {
    const authenticate = vi.fn().mockResolvedValue(null as unknown as number);
    await expect(getCachedUid(authenticate)).rejects.toThrow(/authentication failed/i);
  });
});
