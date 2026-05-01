import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Extract the returnPath from the Manus OAuth state parameter.
 * The state is base64-encoded and may contain:
 *   - A plain redirectUri string (legacy): "https://origin/api/oauth/callback"
 *   - A pipe-delimited string: "https://origin/api/oauth/callback|/portal/neo-chat"
 * Returns the returnPath (defaults to "/portal").
 */
function parseManusState(state: string): string {
  try {
    const decoded = Buffer.from(state, "base64").toString("utf-8");
    // Format: "redirectUri|returnPath"
    if (decoded.includes("|")) {
      const parts = decoded.split("|");
      const returnPath = parts[1];
      // Validate: must be a relative path starting with /
      if (returnPath && returnPath.startsWith("/")) {
        return returnPath;
      }
    }
  } catch {
    // Ignore parse errors — fall through to default
  }
  return "/portal";
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the originally requested path (or portal home)
      const returnPath = parseManusState(state);
      console.log("[OAuth] Login successful, redirecting to:", returnPath);
      res.redirect(302, returnPath);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
