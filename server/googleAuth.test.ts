/**
 * Tests for the Google OAuth 2.0 authentication handler (googleAuth.ts).
 *
 * Uses static imports so vi.mock() hoisting applies correctly at module load time.
 * All external dependencies (fetch, db, sdk, cookies, env) are mocked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks (must be declared before static imports) ────────────────────────────

vi.mock("../server/db", () => ({
  upsertUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../server/_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

vi.mock("../server/_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  }),
}));

vi.mock("../server/_core/env", () => ({
  ENV: {
    googleClientId: "test-client-id.apps.googleusercontent.com",
    googleClientSecret: "test-client-secret",
    isProduction: false,
    appId: "test-app-id",
    cookieSecret: "test-secret",
    databaseUrl: "mysql://test",
    oAuthServerUrl: "https://api.manus.im",
    ownerOpenId: "owner-123",
    forgeApiUrl: "https://forge.manus.im",
    forgeApiKey: "forge-key",
    openAiApiKey: "sk-test",
  },
}));

// ── Static imports (after mocks) ──────────────────────────────────────────────

import { registerGoogleAuthRoutes } from "../server/_core/googleAuth";
import { upsertUser } from "../server/db";
import { sdk } from "../server/_core/sdk";
import type { Express, Request, Response } from "express";

// ── Helpers ───────────────────────────────────────────────────────────────────

type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

/** Register routes and return a map of path → handler */
function buildRoutes(): Record<string, RouteHandler> {
  const routes: Record<string, RouteHandler> = {};
  const app = {
    get: (path: string, handler: RouteHandler) => {
      routes[path] = handler;
    },
  } as unknown as Express;
  registerGoogleAuthRoutes(app);
  return routes;
}

/** Create a minimal mock Express request */
function makeReq(overrides: Partial<{ query: Record<string, string> }> = {}): Request {
  return {
    protocol: "https",
    get: (header: string) => (header === "host" ? "localhost:3000" : undefined),
    query: {},
    ...overrides,
  } as unknown as Request;
}

type MockRes = Response & {
  _cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>;
  _redirects: Array<{ status: number; url: string }>;
  _json: Array<{ status: number; body: unknown }>;
};

/** Create a minimal mock Express response */
function makeRes(): MockRes {
  const cookies: MockRes["_cookies"] = [];
  const redirects: MockRes["_redirects"] = [];
  const jsonResponses: MockRes["_json"] = [];
  let currentStatus = 200;

  const res = {
    status(code: number) {
      currentStatus = code;
      return res;
    },
    redirect(statusOrUrl: number | string, url?: string) {
      if (typeof statusOrUrl === "number" && url) {
        redirects.push({ status: statusOrUrl, url });
      } else if (typeof statusOrUrl === "string") {
        redirects.push({ status: 302, url: statusOrUrl });
      }
    },
    cookie(name: string, value: string, options: Record<string, unknown>) {
      cookies.push({ name, value, options });
    },
    json(body: unknown) {
      jsonResponses.push({ status: currentStatus, body });
    },
    _cookies: cookies,
    _redirects: redirects,
    _json: jsonResponses,
  };

  return res as unknown as MockRes;
}

/** Encode a returnPath into a base64url state parameter */
function makeState(returnPath: string): string {
  return Buffer.from(JSON.stringify({ returnPath })).toString("base64url");
}

/** Successful Google token response */
const TOKEN_SUCCESS = { access_token: "ya29.test-access-token", token_type: "Bearer" };

/** Successful Google userinfo response */
const PROFILE_SUCCESS = {
  sub: "123456789",
  email: "employee@goldenteam.com",
  name: "Ahmed Al-Rashidi",
  picture: "https://lh3.googleusercontent.com/photo.jpg",
  email_verified: true,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Google OAuth — /api/auth/google/callback", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(upsertUser).mockClear();
    vi.mocked(sdk.createSessionToken).mockClear();
    vi.mocked(sdk.createSessionToken).mockResolvedValue("mock-session-token");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("redirects to /login?error=google_denied when user denies consent", async () => {
    const routes = buildRoutes();
    const req = makeReq({ query: { error: "access_denied" } });
    const res = makeRes();

    await routes["/api/auth/google/callback"]!(req, res);

    expect(res._redirects[0]).toEqual({ status: 302, url: "/login?error=google_denied" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=google_token_failed when token exchange fails (HTTP 400)", async () => {
    const routes = buildRoutes();

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error":"invalid_grant"}',
    });

    const req = makeReq({ query: { code: "bad-code", state: makeState("/portal") } });
    const res = makeRes();

    await routes["/api/auth/google/callback"]!(req, res);

    expect(res._redirects[0]).toEqual({ status: 302, url: "/login?error=google_token_failed" });
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("sets session cookie and redirects to returnPath on successful login", async () => {
    const routes = buildRoutes();

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => TOKEN_SUCCESS })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => PROFILE_SUCCESS });

    const req = makeReq({ query: { code: "valid-code", state: makeState("/portal") } });
    const res = makeRes();

    await routes["/api/auth/google/callback"]!(req, res);

    // DB upsert with namespaced openId
    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google:123456789",
        email: "employee@goldenteam.com",
        name: "Ahmed Al-Rashidi",
        loginMethod: "google",
      })
    );

    // Session token created
    expect(sdk.createSessionToken).toHaveBeenCalledWith(
      "google:123456789",
      expect.objectContaining({ name: "Ahmed Al-Rashidi" })
    );

    // Cookie set with the session token value
    expect(res._cookies).toHaveLength(1);
    expect(res._cookies[0]?.value).toBe("mock-session-token");

    // Redirected to the returnPath
    expect(res._redirects[0]).toEqual({ status: 302, url: "/portal" });
  });

  it("falls back to / when state parameter is missing", async () => {
    const routes = buildRoutes();

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => TOKEN_SUCCESS })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => PROFILE_SUCCESS });

    const req = makeReq({ query: { code: "valid-code" } }); // no state
    const res = makeRes();

    await routes["/api/auth/google/callback"]!(req, res);

    expect(res._redirects[0]).toEqual({ status: 302, url: "/" });
  });

  it("sanitises returnPath — rejects external URLs that do not start with /", async () => {
    const routes = buildRoutes();

    fetchMock
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => TOKEN_SUCCESS })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => PROFILE_SUCCESS });

    const maliciousState = Buffer.from(
      JSON.stringify({ returnPath: "https://evil.com/steal" })
    ).toString("base64url");

    const req = makeReq({ query: { code: "valid-code", state: maliciousState } });
    const res = makeRes();

    await routes["/api/auth/google/callback"]!(req, res);

    // Must redirect to "/" not to the external URL
    expect(res._redirects[0]).toEqual({ status: 302, url: "/" });
  });
});

describe("Google OAuth — /api/auth/google initiation", () => {
  it("redirects to Google consent screen with required OAuth params", async () => {
    const routes = buildRoutes();
    const req = makeReq({ query: { returnPath: "/portal/neo-chat" } });
    const res = makeRes();

    await routes["/api/auth/google"]!(req, res);

    expect(res._redirects).toHaveLength(1);
    const url = res._redirects[0]?.url ?? "";
    expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("client_id=test-client-id.apps.googleusercontent.com");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=openid");
  });
});
