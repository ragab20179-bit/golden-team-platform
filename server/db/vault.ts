import { getDb } from "../db";
import { vaultFiles, InsertVaultFile, VaultFile } from "../../drizzle/schema";
import { eq, desc, like, or, and } from "drizzle-orm";

export async function insertVaultFile(data: InsertVaultFile): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(vaultFiles).values(data);
  return (result as any).insertId as number;
}

export async function getVaultFileById(id: number): Promise<VaultFile | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(vaultFiles).where(eq(vaultFiles.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listVaultFiles(opts: {
  folder?: string;
  limit?: number;
  offset?: number;
  uploadedBy?: number;
}): Promise<VaultFile[]> {
  const db = await getDb();
  if (!db) return [];
  const { folder, limit = 50, offset = 0, uploadedBy } = opts;
  const conditions: ReturnType<typeof eq>[] = [];
  if (folder && folder !== "all") conditions.push(eq(vaultFiles.folder, folder));
  if (uploadedBy) conditions.push(eq(vaultFiles.uploadedBy, uploadedBy));

  const query = db
    .select()
    .from(vaultFiles)
    .orderBy(desc(vaultFiles.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function searchVaultFiles(searchTerm: string, folder?: string): Promise<VaultFile[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: ReturnType<typeof eq | typeof or>[] = [
    or(
      like(vaultFiles.originalName, `%${searchTerm}%`),
      like(vaultFiles.parsedText, `%${searchTerm}%`),
      like(vaultFiles.aiSummary, `%${searchTerm}%`)
    )!
  ];
  if (folder && folder !== "all") {
    conditions.push(eq(vaultFiles.folder, folder));
  }
  return db
    .select()
    .from(vaultFiles)
    .where(and(...conditions))
    .orderBy(desc(vaultFiles.createdAt))
    .limit(20);
}

export async function updateVaultFileParsed(
  id: number,
  data: { parsedText?: string; parsedMeta?: unknown; aiSummary?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(vaultFiles).set(data).where(eq(vaultFiles.id, id));
}

export async function deleteVaultFile(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(vaultFiles).where(eq(vaultFiles.id, id));
}

export async function countVaultFiles(folder?: string): Promise<number> {
  const rows = await listVaultFiles({ folder, limit: 9999 });
  return rows.length;
}

/**
 * List all files linked to a specific context (e.g. meeting ID, project ID).
 */
export async function listVaultFilesByContext(
  contextType: string,
  contextId: string
): Promise<VaultFile[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(vaultFiles)
    .where(and(eq(vaultFiles.contextType, contextType), eq(vaultFiles.contextId, contextId)))
    .orderBy(desc(vaultFiles.createdAt))
    .limit(100);
}
