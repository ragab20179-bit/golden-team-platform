/**
 * Google OAuth 2.0 authentication routes.
 *
 * Flow:
 *   1. GET /api/auth/google          → redirect to Google consent screen
 *   2. GET /api/auth/google/callback → exchange code, fetch profile, upsert user, set session cookie
 *
 * Session handling is identical to the Manus OAuth flow:
 *   - openId is stored as "google:{googleId}" to namespace Google users
 *   - sdk.createSessionToken() signs the same JWT format
 *   - The same COOKIE_NAME cookie is set, so ctx.user works transparently
 *
 * Source: https://developers.google.com/identity/protocols/oauth2/web-server
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

/** Build the redirect URI from the incoming request host */
function getRedirectUri(req: Request): string {
  // Always use the canonical public domain to match what is registered in Google Cloud Console
  const origin =
    ENV.isProduction
      ? "https://goldenteam-j23mranz.manus.space"
      : `${req.protocol}://${req.get("host")}`;
  return `${origin}/api/auth/google/callback`;
}

/** Parse the returnPath from the state parameter (base64-encoded JSON) */
function parseState(state: string): { returnPath: string } {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    return { returnPath: typeof parsed.returnPath === "string" ? parsed.returnPath : "/" };
  } catch {
    return { returnPath: "/" };
  }
}

export function registerGoogleAuthRoutes(app: Express) {
  /**
   * Step 1 — Initiate Google OAuth flow
   * Redirects the browser to Google's consent screen.
   * Optional query param: ?returnPath=/portal/neo-chat
   */
  app.get("/api/auth/google", (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(503).json({ error: "Google Sign-In is not configured on this server." });
      return;
    }

    const returnPath = typeof req.query.returnPath === "string" ? req.query.returnPath : "/";
    const state = Buffer.from(JSON.stringify({ returnPath })).toString("base64url");

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: getRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    });

    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  /**
   * Step 2 — Google OAuth callback
   * Exchanges the authorization code for tokens, fetches the user profile,
   * upserts the user in the DB, and sets the session cookie.
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const error = typeof req.query.error === "string" ? req.query.error : null;

    // User denied consent
    if (error) {
      console.warn("[Google Auth] User denied consent:", error);
      res.redirect(302, "/login?error=google_denied");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code missing from Google callback." });
      return;
    }

    try {
      // Exchange authorization code for access token
      const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: getRedirectUri(req),
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResp.ok) {
        const errBody = await tokenResp.text();
        console.error("[Google Auth] Token exchange failed:", tokenResp.status, errBody);
        res.redirect(302, "/login?error=google_token_failed");
        return;
      }

      const tokenData = (await tokenResp.json()) as {
        access_token: string;
        id_token?: string;
        error?: string;
      };

      if (tokenData.error || !tokenData.access_token) {
        console.error("[Google Auth] Token response error:", tokenData.error);
        res.redirect(302, "/login?error=google_token_error");
        return;
      }

      // Fetch Google user profile
      const profileResp = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!profileResp.ok) {
        console.error("[Google Auth] Profile fetch failed:", profileResp.status);
        res.redirect(302, "/login?error=google_profile_failed");
        return;
      }

      const profile = (await profileResp.json()) as {
        sub: string;          // Google's unique user ID
        email?: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
      };

      if (!profile.sub) {
        console.error("[Google Auth] Missing sub in Google profile");
        res.redirect(302, "/login?error=google_profile_invalid");
        return;
      }

      // Namespace Google users to avoid collision with Manus openIds
      const openId = `google:${profile.sub}`;

      // Upsert user in DB — same pattern as Manus OAuth callback
      await db.upsertUser({
        openId,
        name: profile.name ?? null,
        email: profile.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create session token using the same JWT infrastructure
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the originally requested path (or portal home)
      const { returnPath } = parseState(state);
      const safePath = returnPath.startsWith("/") ? returnPath : "/";
      res.redirect(302, safePath);
    } catch (err) {
      console.error("[Google Auth] Unexpected error in callback:", err);
      res.redirect(302, "/login?error=google_unexpected");
    }
  });
}
