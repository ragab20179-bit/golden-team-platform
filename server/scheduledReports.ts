/**
 * server/scheduledReports.ts
 *
 * POST /api/scheduled/weekly-kpi-report
 * Accepts a POST from the Manus scheduled task agent.
 * The agent composes the report content and POSTs it here;
 * this handler persists it to the DB and notifies the owner.
 *
 * Auth: session cookie (role "user" is sufficient — scheduled task auto-cookie)
 *
 * GET /api/scheduled/weekly-kpi-report
 * Returns the 50 most recent reports (admin only).
 */
import type { Express, Request, Response } from "express";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import { sdk } from "./_core/sdk";
import { scheduledReports } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export function registerScheduledReportRoutes(app: Express) {
  // ── POST: receive a new report from the scheduled task agent ──────────────
  app.post("/api/scheduled/weekly-kpi-report", async (req: Request, res: Response) => {
    try {
      // Verify session cookie via sdk
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { title, content, reportType, periodStart, periodEnd, metadata } = req.body as {
        title: string;
        content: string;
        reportType?: string;
        periodStart?: string;
        periodEnd?: string;
        metadata?: Record<string, unknown>;
      };

      if (!title || !content) {
        res.status(400).json({ error: "title and content are required" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      // Persist the report
      const [report] = await db.insert(scheduledReports).values({
        title,
        content,
        reportType: reportType ?? "weekly_kpi",
        periodStart: periodStart ?? null,
        periodEnd: periodEnd ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        createdBy: user.id,
      }).$returningId();

      // Notify the owner
      await notifyOwner({
        title: `📊 ${title}`,
        content: content.slice(0, 500) + (content.length > 500 ? "…" : ""),
      }).catch(() => null);

      res.json({ success: true, reportId: report.id });
    } catch (err) {
      console.error("[scheduledReports] POST Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── GET: list recent reports (admin only) ─────────────────────────────────
  app.get("/api/scheduled/weekly-kpi-report", async (req: Request, res: Response) => {
    try {
      let adminUser;
      try {
        adminUser = await sdk.authenticateRequest(req);
      } catch {
        adminUser = null;
      }

      if (!adminUser || adminUser.role !== "admin") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }

      const reports = await db
        .select()
        .from(scheduledReports)
        .orderBy(desc(scheduledReports.createdAt))
        .limit(50);

      res.json({ reports });
    } catch (err) {
      console.error("[scheduledReports] GET Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
