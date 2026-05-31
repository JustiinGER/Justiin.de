import bcrypt from "bcryptjs";
import readline from "readline";
import fs from "fs";
import path from "path";
import type { ExecuteValues } from "mysql2";
import { getSchemaDDL, type Dialect } from "../src/lib/schema.server";

// Minimal env parser — the script runs via tsx outside Next.js
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    });
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

// ─── MySQL adapter ────────────────────────────────────────────────────────────

interface SimpleAdapter {
  dialect: Dialect;
  exec(sql: string, params?: unknown[]): Promise<{ insertId: number; rows: unknown[] }>;
  close(): Promise<void>;
}

async function buildMysqlAdapter(): Promise<SimpleAdapter> {
  const mysql = await import("mysql2/promise");
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "justiin_de",
  });
  return {
    dialect: "mysql",
    async exec(sql, params) {
      const [result] = await db.execute(sql, (params ?? []) as ExecuteValues);
      if (Array.isArray(result)) return { insertId: 0, rows: result };
      return { insertId: (result as { insertId: number }).insertId, rows: [] };
    },
    async close() {
      await db.end();
    },
  };
}

// ─── SQLite adapter ───────────────────────────────────────────────────────────

async function buildSqliteAdapter(): Promise<SimpleAdapter> {
  const Database = (await import("better-sqlite3")).default;
  const dbPath = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.resolve(process.cwd(), "data", "app.db");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  return {
    dialect: "sqlite",
    async exec(sql, params) {
      const stmt = db.prepare(sql);
      if (sql.trim().toUpperCase().startsWith("SELECT")) {
        return { insertId: 0, rows: stmt.all(...(params ?? [])) };
      }
      const info = stmt.run(...(params ?? []));
      return { insertId: Number(info.lastInsertRowid), rows: [] };
    },
    async close() {
      db.close();
    },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const isMysql = !!(
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_NAME
  );

  let adapter: SimpleAdapter;
  if (isMysql) {
    const { DB_HOST, DB_USER, DB_PORT, DB_NAME } = process.env;
    console.log(`Connecting to MariaDB: ${DB_USER}@${DB_HOST}:${DB_PORT ?? 3306}/${DB_NAME}`);
    adapter = await buildMysqlAdapter();
  } else {
    const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), "data", "app.db");
    console.log(`Using SQLite: ${dbPath}`);
    adapter = await buildSqliteAdapter();
  }

  console.log("Creating tables if they don't exist...");
  for (const ddl of getSchemaDDL(adapter.dialect)) {
    await adapter.exec(ddl);
  }
  console.log("Tables ready.");

  const action = process.argv.includes("--reset") ? "reset" : "setup";

  if (action === "setup") {
    const { rows } = await adapter.exec("SELECT COUNT(*) as count FROM admin_users");
    const count = (rows[0] as Record<string, unknown>).count;
    if (Number(count) > 0) {
      console.log("Admin user already exists. Run with --reset to change password.");
      await adapter.close();
      rl.close();
      return;
    }
  }

  const adminUser = await question("Enter admin username [admin]: ");
  const finalUser = adminUser.trim() || "admin";
  const adminPass = await question("Enter admin password: ");

  if (!adminPass) {
    console.log("Password cannot be empty.");
    await adapter.close();
    rl.close();
    return;
  }

  const hash = await bcrypt.hash(adminPass, 10);

  if (adapter.dialect === "sqlite") {
    await adapter.exec(
      `INSERT INTO admin_users (username, password) VALUES (?, ?)
       ON CONFLICT(username) DO UPDATE SET password = excluded.password`,
      [finalUser, hash]
    );
  } else {
    await adapter.exec(
      `INSERT INTO admin_users (username, password) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [finalUser, hash]
    );
  }

  console.log(`Successfully configured admin credentials for user: ${finalUser}`);

  await adapter.close();
  rl.close();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
