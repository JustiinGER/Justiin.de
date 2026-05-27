import { createConnection } from "mysql2/promise";
import bcrypt from "bcryptjs";
import readline from "readline";

// Minimal env parser for the script since it runs via ts-node outside Next.js
import fs from "fs";
import path from "path";

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
  output: process.stdout
});

const question = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  loadEnv();

  const host = process.env.DB_HOST || "localhost";
  const port = parseInt(process.env.DB_PORT || "3306", 10);
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "justiinde";

  console.log(`Connecting to MariaDB: ${user}@${host}:${port}/${database}`);

  try {
    const db = await createConnection({ host, port, user, password, database });

    console.log("Connected successfully. Creating tables if they don't exist...");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(64) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS site_content (
        id INT PRIMARY KEY AUTO_INCREMENT,
        section VARCHAR(64) NOT NULL UNIQUE,
        data JSON NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log("Tables ready.");

    const action = process.argv.includes("--reset") ? "reset" : "setup";

    if (action === "setup") {
      const [rows] = await db.execute<any[]>("SELECT COUNT(*) as count FROM admin_users");
      if (rows[0].count > 0) {
        console.log("Admin user already exists. Run with --reset to change password.");
        db.destroy();
        rl.close();
        return;
      }
    }

    const adminUser = await question("Enter admin username [admin]: ");
    const finalUser = adminUser.trim() || "admin";
    const adminPass = await question("Enter admin password: ");

    if (!adminPass) {
      console.log("Password cannot be empty.");
      db.destroy();
      rl.close();
      return;
    }

    const hash = await bcrypt.hash(adminPass, 10);

    await db.execute(
      `INSERT INTO admin_users (username, password) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [finalUser, hash]
    );

    console.log(`Successfully configured admin credentials for user: ${finalUser}`);

    db.destroy();
  } catch (err) {
    console.error("Database connection failed:", err);
  } finally {
    rl.close();
  }
}

main();
