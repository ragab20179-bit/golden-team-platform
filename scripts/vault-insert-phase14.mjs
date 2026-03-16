/**
 * One-time script: Insert GT-NEO-014 document into the Drive Vault.
 * Uses the same DB helpers as the vault tRPC router.
 * Run: node scripts/vault-insert-phase14.mjs
 */
import "dotenv/config";
import { createConnection } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CDN_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663123919079/J23mrANZtynYBnxwEV4vcJ/GT-NEO-014-AI-Module-Query-UI-Token-Tracking_11239dd3.md";
const S3_KEY = "vault/documentation/GT-NEO-014-AI-Module-Query-UI-Token-Tracking_11239dd3.md";
const FILENAME = "GT-NEO-014-AI-Module-Query-UI-Token-Tracking.md";
const SIZE_BYTES = 9869;

async function main() {
  const db = await createConnection(process.env.DATABASE_URL);

  // Check if already inserted
  const [existing] = await db.execute(
    "SELECT id FROM vault_files WHERE originalName = ? LIMIT 1",
    [FILENAME]
  );
  if (existing.length > 0) {
    console.log("Document already in vault (id:", existing[0].id, "). Skipping.");
    await db.end();
    return;
  }

  // Insert the vault record (using camelCase column names as per Drizzle schema)
  const [result] = await db.execute(
    `INSERT INTO vault_files 
      (uploadedBy, filename, originalName, mimeType, sizeBytes, s3Key, s3Url, folder, 
       contextType, contextId, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      1,                          // uploadedBy (owner user id)
      FILENAME,                   // filename
      FILENAME,                   // originalName
      "text/markdown",            // mimeType
      SIZE_BYTES,                 // sizeBytes
      S3_KEY,                     // s3Key
      CDN_URL,                    // s3Url
      "documentation",            // folder
      "phase",                    // contextType
      "phase-14",                 // contextId
    ]
  );

  const insertedId = result.insertId;

  // Insert AI summary directly (since we know the content)
  const summary = `GT-NEO-014 — Phase 14 Implementation Summary: AI Module Query UI & GPT-4o Token Usage Tracking. 
Delivered: (1) neo_ai_usage DB table for real cost tracking; (2) all 7 neoModules procedures log token usage; 
(3) getUsageStats procedure with cost breakdown by module and engine; (4) reusable AIModuleQueryPanel component 
wired into HR, KPI, Procurement, QMS, ERP, CRM, and Legal module pages; (5) NEO Core dashboard updated with 
real cost metrics. Test coverage: 135/135 passing. Checkpoint: 7772b990. Date: 2026-03-16.`;

  await db.execute(
    "UPDATE vault_files SET aiSummary = ? WHERE id = ?",
    [summary, insertedId]
  );

  console.log("✓ GT-NEO-014 inserted into Drive Vault (id:", insertedId, ")");
  console.log("  Folder: documentation");
  console.log("  CDN URL:", CDN_URL);
  await db.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
