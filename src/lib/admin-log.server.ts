/**
 * Admin activity log — server-only.
 */

import { getPool } from "./db.server";
import { computeJsonDiff, type DiffLine } from "./json-diff";
import { getHistoryEntryById } from "./content.server";
import type { RowDataPacket } from "mysql2";

export type AdminAction = "login" | "content_save" | "password_change" | "rollback" | "history_delete";

export interface AdminLogDetails {
  historyId?: number;
  before?: unknown;
  after?: unknown;
}

export async function logAdminAction(
  username: string,
  action: AdminAction,
  section: string | null = null,
  ip: string | null = null,
  details: AdminLogDetails | null = null
): Promise<void> {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO admin_log (username, action, section, ip, details) VALUES (?, ?, ?, ?, ?)`,
    [username, action, section, ip, details ? JSON.stringify(details) : null]
  );
}

export interface AdminLogEntry {
  id: number;
  username: string;
  action: string;
  section: string | null;
  ip: string | null;
  details: AdminLogDetails | null;
  created_at: Date;
}

function parseDetails(raw: unknown): AdminLogDetails | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AdminLogDetails;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") return raw as AdminLogDetails;
  return null;
}

function mapLogRow(row: RowDataPacket): AdminLogEntry {
  return {
    id: row.id,
    username: row.username,
    action: row.action,
    section: row.section,
    ip: row.ip,
    details: parseDetails(row.details),
    created_at: row.created_at,
  };
}

export async function getAdminLogs(
  limit: number = 50,
  offset: number = 0
): Promise<AdminLogEntry[]> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, username, action, section, ip, details, created_at 
     FROM admin_log 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return rows.map(mapLogRow);
}

export async function getAdminLogById(id: number): Promise<AdminLogEntry | null> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT id, username, action, section, ip, details, created_at FROM admin_log WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  return mapLogRow(rows[0]);
}

export function actionSupportsDiff(action: string): boolean {
  return action === "content_save" || action === "rollback";
}

export async function getLogDiff(
  logId: number
): Promise<
  | { available: true; lines: DiffLine[]; isInitial: boolean }
  | { available: false; reason: string }
> {
  const log = await getAdminLogById(logId);
  if (!log) return { available: false, reason: "not_found" };
  if (!actionSupportsDiff(log.action)) {
    return { available: false, reason: "no_diff" };
  }

  const details = log.details;
  if (!details) {
    return { available: false, reason: "legacy" };
  }

  let before: unknown | undefined = details.before;
  let after: unknown | undefined = details.after;

  if (before === undefined && details.historyId) {
    const entry = await getHistoryEntryById(details.historyId);
    if (!entry) return { available: false, reason: "history_missing" };
    before = entry.data;
  }

  if (after === undefined) {
    return { available: false, reason: "incomplete" };
  }

  if (before === undefined) {
    return {
      available: true,
      isInitial: true,
      lines: computeJsonDiff(null, after),
    };
  }

  const lines = computeJsonDiff(before, after);
  return { available: true, isInitial: false, lines };
}
