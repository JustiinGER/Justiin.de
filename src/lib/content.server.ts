/**
 * Content layer — server-only.
 * Reads/writes site content overrides from MariaDB.
 * Falls back to data.ts defaults if DB is unavailable.
 */

import { aboutMe, passions, lab, contactData } from "./data";
import { gearData } from "./data";
import { getPool, isDbConfigured } from "./db.server";
import type { RowDataPacket } from "mysql2";

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
    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
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
          } catch (e) {
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

export async function writeContent(section: ContentSection, data: unknown): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO site_content (section, data)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [section, JSON.stringify(data)]
  );
}
