/**
 * Dialect-aware DDL for all application tables.
 * Used by setup-admin.ts and the migrate-db.ts script.
 */

export type Dialect = "sqlite" | "mysql";

export function getSchemaDDL(dialect: Dialect): string[] {
  if (dialect === "sqlite") {
    return [
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS site_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL UNIQUE,
        data TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS site_content_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT NOT NULL,
        data TEXT NOT NULL,
        saved_by TEXT NOT NULL,
        pinned INTEGER NOT NULL DEFAULT 0,
        saved_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_section_time ON site_content_history (section, saved_at)`,
      `CREATE TABLE IF NOT EXISTS admin_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        action TEXT NOT NULL,
        section TEXT,
        ip TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_admin_log_created_at ON admin_log (created_at)`,
      `CREATE TABLE IF NOT EXISTS health_probe_cache (
        id INTEGER PRIMARY KEY DEFAULT 1,
        probed_at TEXT NOT NULL,
        results TEXT NOT NULL
      )`,
    ];
  }

  return [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS site_content (
      id INT PRIMARY KEY AUTO_INCREMENT,
      section VARCHAR(64) NOT NULL UNIQUE,
      data JSON NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS site_content_history (
      id INT PRIMARY KEY AUTO_INCREMENT,
      section VARCHAR(64) NOT NULL,
      data JSON NOT NULL,
      saved_by VARCHAR(64) NOT NULL,
      pinned TINYINT(1) NOT NULL DEFAULT 0,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_section_time (section, saved_at)
    )`,
    `CREATE TABLE IF NOT EXISTS admin_log (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL,
      action VARCHAR(64) NOT NULL,
      section VARCHAR(64),
      ip VARCHAR(64),
      details JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_created_at (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS health_probe_cache (
      id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
      probed_at DATETIME NOT NULL,
      results JSON NOT NULL
    )`,
  ];
}
