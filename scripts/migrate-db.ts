/**
 * Bidirectional database migration script.
 *
 * Usage:
 *   npx tsx scripts/migrate-db.ts --from sqlite --to mysql
 *   npx tsx scripts/migrate-db.ts --from mysql --to sqlite
 *
 * Options:
 *   --from <sqlite|mysql>   Source database dialect
 *   --to   <sqlite|mysql>   Target database dialect
 *   --sqlite-path <path>    Override SQLite file path (defaults to SQLITE_PATH env or ./data/app.db)
 *   --dry-run               Print row counts without writing anything
 *
 * The target tables are wiped and repopulated from the source, so run
 * this before switching the app's active dialect in .env.local.
 * Both databases must be accessible at the time the script runs.
 */

import fs from "fs";
import path from "path";
import type { ExecuteValues } from "mysql2";

// ─── Minimal env loader ───────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && !Object.prototype.hasOwnProperty.call(process.env, match[1])) {
        process.env[match[1]] = match[2];
      }
    }
  }
}

// ─── Low-level adapters (independent of singleton in db.server.ts) ────────────

type Dialect = "sqlite" | "mysql";

interface MigrationAdapter {
  dialect: Dialect;
  query(sql: string, params?: unknown[]): Promise<Record<string, unknown>[]>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  close(): Promise<void>;
}

async function openMysql(): Promise<MigrationAdapter> {
  const mysql = await import("mysql2/promise");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "justiin_de",
  });
  return {
    dialect: "mysql",
    async query(sql, params) {
      const [rows] = await conn.execute(sql, (params ?? []) as ExecuteValues);
      return rows as Record<string, unknown>[];
    },
    async execute(sql, params) {
      await conn.execute(sql, (params ?? []) as ExecuteValues);
    },
    async close() {
      await conn.end();
    },
  };
}

async function openSqlite(dbPath: string): Promise<MigrationAdapter> {
  const Database = (await import("better-sqlite3")).default;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");
  return {
    dialect: "sqlite",
    async query(sql, params) {
      return db.prepare(sql).all(...(params ?? [])) as Record<string, unknown>[];
    },
    async execute(sql, params) {
      db.prepare(sql).run(...(params ?? []));
    },
    async close() {
      db.close();
    },
  };
}

// ─── Schema application ───────────────────────────────────────────────────────

async function applySchema(adapter: MigrationAdapter) {
  const { getSchemaDDL } = await import("../src/lib/schema.server");
  for (const ddl of getSchemaDDL(adapter.dialect)) {
    await adapter.execute(ddl);
  }
}

// ─── Table definitions ────────────────────────────────────────────────────────

const TABLES = [
  "admin_users",
  "site_content",
  "site_content_history",
  "admin_log",
  "health_probe_cache",
] as const;

// Columns to copy for each table (in order)
const TABLE_COLUMNS: Record<string, string[]> = {
  admin_users: ["id", "username", "password", "created_at"],
  site_content: ["id", "section", "data", "updated_at"],
  site_content_history: ["id", "section", "data", "saved_by", "pinned", "saved_at"],
  admin_log: ["id", "username", "action", "section", "ip", "details", "created_at"],
  health_probe_cache: ["id", "probed_at", "results"],
};

// Columns that contain JSON (stored as TEXT in SQLite, parsed object in MySQL)
const JSON_COLUMNS = new Set(["data", "details", "results"]);

// Columns that contain datetimes (stored as TEXT in SQLite, Date in MySQL)
const DATE_COLUMNS = new Set(["created_at", "updated_at", "saved_at", "probed_at"]);

// ─── Value normalisation ──────────────────────────────────────────────────────

function normaliseForTarget(
  value: unknown,
  column: string,
  targetDialect: Dialect
): unknown {
  if (value === null || value === undefined) return null;

  if (JSON_COLUMNS.has(column)) {
    if (targetDialect === "sqlite") {
      // Ensure it's a string for SQLite TEXT column
      return typeof value === "string" ? value : JSON.stringify(value);
    } else {
      // MySQL JSON column accepts a JSON string
      return typeof value === "string" ? value : JSON.stringify(value);
    }
  }

  if (DATE_COLUMNS.has(column)) {
    if (targetDialect === "sqlite") {
      // SQLite stores datetimes as UTC text "YYYY-MM-DD HH:MM:SS"
      if (value instanceof Date) return value.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
      // Already a UTC string from SQLite — keep as-is
      return String(value);
    } else {
      // MySQL: always pass a Date object so mysql2 handles the session-timezone
      // conversion correctly. Raw strings from SQLite have no TZ marker and
      // would be misinterpreted as local time by the MySQL server.
      if (value instanceof Date) return value;
      const s = String(value);
      // Bare SQLite datetime string — no Z / + / T means UTC from datetime('now')
      if (!s.includes("Z") && !s.includes("+") && !s.match(/T\d{2}:/)) {
        return new Date(s.replace(" ", "T") + "Z");
      }
      return new Date(s);
    }
  }

  return value;
}

// ─── Per-table clear + insert ─────────────────────────────────────────────────

async function migrateTable(
  tableName: string,
  src: MigrationAdapter,
  dst: MigrationAdapter,
  dryRun: boolean
): Promise<number> {
  const columns = TABLE_COLUMNS[tableName];
  const rows = await src.query(
    `SELECT ${columns.join(", ")} FROM ${tableName}`
  );

  if (rows.length === 0) {
    console.log(`  ${tableName}: 0 rows (skipped)`);
    return 0;
  }

  if (dryRun) {
    console.log(`  ${tableName}: ${rows.length} rows (dry-run, not written)`);
    return rows.length;
  }

  // Wipe target table
  await dst.execute(`DELETE FROM ${tableName}`);

  // Re-enable autoincrement sequences for SQLite by resetting sqlite_sequence
  if (dst.dialect === "sqlite") {
    await dst.execute(
      `DELETE FROM sqlite_sequence WHERE name = ?`,
      [tableName]
    ).catch(() => { /* table may not exist if no rows have been inserted yet */ });
  }

  const placeholders = columns.map(() => "?").join(", ");
  const insertSql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    const params = columns.map((col) => normaliseForTarget(row[col], col, dst.dialect));
    await dst.execute(insertSql, params);
  }

  console.log(`  ${tableName}: ${rows.length} row(s) copied`);
  return rows.length;
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const fromDialect = get("--from") as Dialect | undefined;
  const toDialect = get("--to") as Dialect | undefined;
  const dryRun = args.includes("--dry-run");
  const sqlitePath = get("--sqlite-path")
    ?? process.env.SQLITE_PATH
    ?? path.resolve(process.cwd(), "data", "app.db");

  if (!fromDialect || !toDialect) {
    console.error("Usage: npx tsx scripts/migrate-db.ts --from <sqlite|mysql> --to <sqlite|mysql>");
    process.exit(1);
  }

  if (fromDialect === toDialect) {
    console.error("Source and target dialects must differ.");
    process.exit(1);
  }

  if (!["sqlite", "mysql"].includes(fromDialect) || !["sqlite", "mysql"].includes(toDialect)) {
    console.error("Dialect must be 'sqlite' or 'mysql'.");
    process.exit(1);
  }

  console.log(`\nMigrating: ${fromDialect} → ${toDialect}${dryRun ? " (dry-run)" : ""}\n`);

  const openAdapter = async (dialect: Dialect): Promise<MigrationAdapter> => {
    if (dialect === "mysql") {
      if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
        console.error(
          "MariaDB/MySQL requires DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME to be set in .env.local"
        );
        process.exit(1);
      }
      console.log(`Opening MySQL: ${process.env.DB_USER}@${process.env.DB_HOST}/${process.env.DB_NAME}`);
      return openMysql();
    } else {
      console.log(`Opening SQLite: ${sqlitePath}`);
      return openSqlite(path.resolve(sqlitePath));
    }
  };

  const src = await openAdapter(fromDialect);
  const dst = await openAdapter(toDialect);

  if (!dryRun) {
    console.log("\nApplying schema to target...");
    await applySchema(dst);
  }

  console.log("\nCopying tables:");
  let total = 0;
  for (const table of TABLES) {
    total += await migrateTable(table, src, dst, dryRun);
  }

  await src.close();
  await dst.close();

  console.log(`\nDone. ${total} row(s) total${dryRun ? " (dry-run — nothing written)" : ""}.`);
}

main().catch((err) => {
  console.error("\nMigration failed:", err);
  process.exit(1);
});
