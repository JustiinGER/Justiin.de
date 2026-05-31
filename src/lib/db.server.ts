/**
 * Unified database adapter — server-only.
 *
 * Uses SQLite (better-sqlite3) by default.
 * Switches to MariaDB/MySQL (mysql2) when DB_HOST, DB_USER,
 * DB_PASSWORD, and DB_NAME are all set in the environment.
 *
 * NEVER import this from a Client Component or any module
 * that is transitively bundled for the browser.
 */

import type { Dialect } from "./schema.server";

export type { Dialect };

export interface DbAdapter {
  readonly dialect: Dialect;
  /** Run a SELECT-style statement; returns typed rows. */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run an INSERT/UPDATE/DELETE statement; returns insertId and affectedRows. */
  execute(sql: string, params?: unknown[]): Promise<{ insertId: number; affectedRows: number }>;
}

// ─── MySQL adapter ────────────────────────────────────────────────────────────

function buildMysqlAdapter(): DbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mysql = require("mysql2/promise") as typeof import("mysql2/promise");

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return {
    dialect: "mysql",
    async query<T>(sql: string, params?: unknown[]) {
      const [rows] = await pool.execute(sql, params);
      return rows as T[];
    },
    async execute(sql: string, params?: unknown[]) {
      const [result] = await pool.execute(sql, params) as [import("mysql2").ResultSetHeader, unknown];
      return { insertId: result.insertId, affectedRows: result.affectedRows };
    },
  };
}

// ─── SQLite adapter ───────────────────────────────────────────────────────────

function buildSqliteAdapter(): DbAdapter {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");

  const dbPath = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.resolve(process.cwd(), "data", "app.db");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return {
    dialect: "sqlite",
    async query<T>(sql: string, params?: unknown[]) {
      const stmt = db.prepare(sql);
      return stmt.all(...(params ?? [])) as T[];
    },
    async execute(sql: string, params?: unknown[]) {
      const stmt = db.prepare(sql);
      const info = stmt.run(...(params ?? []));
      return {
        insertId: Number(info.lastInsertRowid),
        affectedRows: info.changes,
      };
    },
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let adapter: DbAdapter | null = null;

export function getDb(): DbAdapter {
  if (!adapter) {
    adapter = isMysqlConfigured() ? buildMysqlAdapter() : buildSqliteAdapter();
  }
  return adapter;
}

function isMysqlConfigured(): boolean {
  return !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  );
}

/** Always true — SQLite is available without any configuration. */
export function isDbConfigured(): boolean {
  return true;
}

/**
 * Parse a date value returned by the database driver.
 *
 * - MySQL (mysql2): returns a native `Date` object — pass through unchanged.
 * - SQLite (better-sqlite3): returns a UTC text string in the form
 *   `"YYYY-MM-DD HH:MM:SS"` (what `datetime('now')` produces). Without an
 *   explicit timezone indicator, `new Date(str)` in V8 treats it as *local*
 *   time, which shifts the value by your UTC offset. We normalise by
 *   replacing the space separator with `T` and appending `Z`.
 */
export function parseDateFromDb(raw: unknown): Date {
  if (raw instanceof Date) return raw;
  if (raw === null || raw === undefined) return new Date(0);
  const s = String(raw);
  // Already has timezone info — parse as-is
  if (s.includes("Z") || s.includes("+") || /[+-]\d{2}:\d{2}$/.test(s)) {
    return new Date(s);
  }
  // Bare SQLite datetime string — treat as UTC
  return new Date(s.replace(" ", "T") + "Z");
}

/** @deprecated Use getDb() instead. */
export function getPool() {
  throw new Error(
    "getPool() has been removed. Import getDb() from @/lib/db.server instead."
  );
}
