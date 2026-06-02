/**
 * Auth helpers — server-only.
 * Extracts and validates the Bearer token from API requests.
 */

import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "./db.server";
import { verifyToken } from "./jwt.server";

export async function verifyAdminPassword(
  username: string,
  password: string
): Promise<boolean> {
  const db = getDb();
  const rows = await db.query<{ password: string }>(
    "SELECT password FROM admin_users WHERE username = ?",
    [username]
  );
  if (rows.length === 0) return false;
  return bcrypt.compare(password, rows[0].password);
}

export function requireAuth(req: NextRequest): { username: string } | null {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.cookies.get("admin_session")?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || typeof payload.username !== "string") return null;

  return { username: payload.username };
}
