export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  odooApiKey: process.env.ODOO_API_KEY ?? "",
  odooUsername: process.env.ODOO_USERNAME ?? "",
  // ─── Added in Odoo Client v2 PR ──────────────────────────────────────────
  odooUrl: process.env.ODOO_URL ?? "https://goldenteam1.odoo.com",
  odooDb: process.env.ODOO_DB ?? "golden-team-1",
  // ─── Added for Redis support (Hybrid AI v2 / Odoo Client v2) ─────────────
  redisUrl: process.env.REDIS_URL ?? "",
};
