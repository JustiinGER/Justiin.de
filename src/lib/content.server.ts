/**
 * Content layer — server-only.
 * Reads/writes site content overrides from the database.
 * Falls back to data.ts defaults if the DB is unavailable.
 */

import { aboutMe, passions, lab, contactData } from "./data";
import { gearData } from "./data";
import { getDb, isDbConfigured, parseDateFromDb } from "./db.server";

export type ContentSection = "aboutMe" | "passions" | "lab" | "contactData" | "gear";

const defaults = {
  aboutMe,
  passions,
  lab,
  contactData,
  gear: gearData,
};

export type SiteContent = typeof defaults;

// Deep-merge: DB values override data.ts values recursively.
// Arrays from the DB fully replace (no merging arrays element-by-element).
function deepMerge<T>(target: T, source: unknown): T {
  if (source === null || source === undefined) return target;
  if (typeof source !== "object" || Array.isArray(source)) return source as T;
  if (typeof target !== "object" || target === null) return source as T;

  const result = { ...target } as Record<string, unknown>;
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    result[key] = deepMerge((target as Record<string, unknown>)[key], value);
  }
  return result as T;
}

export async function getAllContent(): Promise<SiteContent> {
  if (!isDbConfigured()) {
    return { ...defaults };
  }

  try {
    const db = getDb();
    const rows = await db.query<{ section: string; data: unknown }>(
      "SELECT section, data FROM site_content"
    );

    const result: SiteContent = {
      aboutMe: { ...defaults.aboutMe },
      passions: { ...defaults.passions },
      lab: { ...defaults.lab },
      contactData: { ...defaults.contactData },
      gear: { ...defaults.gear },
    };

    for (const row of rows) {
      const section = row.section as ContentSection;
      if (section in result) {
        let dbData = row.data;
        if (typeof dbData === "string") {
          try {
            dbData = JSON.parse(dbData);
          } catch {
            console.warn(`[content.server] Failed to parse JSON for section ${section}`);
            continue;
          }
        }

        (result as Record<string, unknown>)[section] = deepMerge(
          (defaults as Record<string, unknown>)[section],
          dbData
        );
      }
    }

    return result;
  } catch (err) {
    console.warn("[content.server] DB unavailable — using data.ts defaults:", err);
    return { ...defaults };
  }
}

export interface WriteContentResult {
  historyId: number | null;
}

export async function writeContent(
  section: ContentSection,
  data: unknown,
  savedBy: string = "system"
): Promise<WriteContentResult> {
  const db = getDb();
  let historyId: number | null = null;

  const existing = await db.query<{ data: unknown }>(
    "SELECT data FROM site_content WHERE section = ?",
    [section]
  );

  if (existing.length > 0) {
    const oldData = existing[0].data;
    const { insertId } = await db.execute(
      `INSERT INTO site_content_history (section, data, saved_by) VALUES (?, ?, ?)`,
      [section, typeof oldData === "string" ? oldData : JSON.stringify(oldData), savedBy]
    );
    historyId = insertId;

    const countRows = await db.query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM site_content_history WHERE section = ? AND pinned = 0`,
      [section]
    );
    const unpinnedCount: number = countRows[0].cnt;
    if (unpinnedCount > 20) {
      const excess = unpinnedCount - 20;
      if (db.dialect === "sqlite") {
        await db.execute(
          `DELETE FROM site_content_history
           WHERE id IN (
             SELECT id FROM site_content_history
             WHERE section = ? AND pinned = 0
             ORDER BY saved_at ASC
             LIMIT ?
           )`,
          [section, excess]
        );
      } else {
        await db.execute(
          `DELETE FROM site_content_history
           WHERE section = ? AND pinned = 0
           ORDER BY saved_at ASC
           LIMIT ?`,
          [section, excess]
        );
      }
    }
  }

  const jsonData = JSON.stringify(data);
  if (db.dialect === "sqlite") {
    await db.execute(
      `INSERT INTO site_content (section, data, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(section) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`,
      [section, jsonData]
    );
  } else {
    await db.execute(
      `INSERT INTO site_content (section, data)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
      [section, jsonData]
    );
  }

  return { historyId };
}

export interface ContentHistoryEntry {
  id: number;
  section: string;
  data: unknown;
  saved_by: string;
  pinned: boolean;
  saved_at: Date;
}

export async function getHistoryEntryById(
  id: number
): Promise<ContentHistoryEntry | null> {
  const db = getDb();
  const rows = await db.query<{
    id: number;
    section: string;
    data: unknown;
    saved_by: string;
    pinned: number;
    saved_at: unknown;
  }>(
    `SELECT id, section, data, saved_by, pinned, saved_at FROM site_content_history WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    section: row.section,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    saved_by: row.saved_by,
    pinned: Boolean(row.pinned),
    saved_at: parseDateFromDb(row.saved_at),
  };
}

export async function getContentHistory(
  section: ContentSection,
  limit: number = 20
): Promise<ContentHistoryEntry[]> {
  const db = getDb();
  const rows = await db.query<{
    id: number;
    section: string;
    data: unknown;
    saved_by: string;
    pinned: number;
    saved_at: unknown;
  }>(
    `SELECT id, section, data, saved_by, pinned, saved_at
     FROM site_content_history
     WHERE section = ?
     ORDER BY pinned DESC, saved_at DESC
     LIMIT ?`,
    [section, limit]
  );

  return rows.map((row) => ({
    id: row.id,
    section: row.section,
    data: typeof row.data === "string" ? JSON.parse(row.data) : row.data,
    saved_by: row.saved_by,
    pinned: Boolean(row.pinned),
    saved_at: parseDateFromDb(row.saved_at),
  }));
}

export async function deleteHistoryEntry(id: number): Promise<boolean> {
  const db = getDb();
  const { affectedRows } = await db.execute(
    `DELETE FROM site_content_history WHERE id = ?`,
    [id]
  );
  return affectedRows > 0;
}

export async function setHistoryPinned(id: number, pinned: boolean): Promise<boolean> {
  const db = getDb();
  const { affectedRows } = await db.execute(
    `UPDATE site_content_history SET pinned = ? WHERE id = ?`,
    [pinned ? 1 : 0, id]
  );
  return affectedRows > 0;
}

export async function getCurrentContent(section: ContentSection): Promise<unknown | null> {
  const db = getDb();
  const rows = await db.query<{ data: unknown }>(
    "SELECT data FROM site_content WHERE section = ?",
    [section]
  );
  if (rows.length === 0) return null;
  const raw = rows[0].data;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export interface RollbackResult {
  section: ContentSection;
  before: unknown | null;
  after: unknown;
  archivedHistoryId: number | null;
}

export async function rollbackContent(
  historyId: number,
  rolledBackBy: string
): Promise<RollbackResult | null> {
  const db = getDb();

  const rows = await db.query<{ section: string; data: unknown }>(
    "SELECT section, data FROM site_content_history WHERE id = ?",
    [historyId]
  );

  if (rows.length === 0) return null;

  const { section, data } = rows[0];
  const parsedData = typeof data === "string" ? JSON.parse(data) : data;
  const contentSection = section as ContentSection;

  const current = await db.query<{ data: unknown }>(
    "SELECT data FROM site_content WHERE section = ?",
    [contentSection]
  );

  let before: unknown | null = null;
  if (current.length > 0) {
    const raw = current[0].data;
    before = typeof raw === "string" ? JSON.parse(raw) : raw;
  }

  const { historyId: archivedHistoryId } = await writeContent(
    contentSection,
    parsedData,
    rolledBackBy
  );

  return {
    section: contentSection,
    before,
    after: parsedData,
    archivedHistoryId,
  };
}

export interface SectionUpdateTime {
  section: string;
  updated_at: Date | null;
}

export async function getSectionUpdateTimes(): Promise<SectionUpdateTime[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const db = getDb();
  const rows = await db.query<{ section: string; updated_at: unknown }>(
    "SELECT section, updated_at FROM site_content"
  );

  return rows.map((row) => ({
    section: row.section,
    updated_at: row.updated_at ? parseDateFromDb(row.updated_at) : null,
  }));
}
