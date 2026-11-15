/**
 * Auth helpers — server-only.
 * Sessions live exclusively in the httpOnly admin_session cookie.
 */

import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "./db.server";
import { createToken, verifyToken } from "./jwt.server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_HOURS = 8;
export const SESSION_MAX_AGE_SECONDS = SESSION_HOURS * 60 * 60;

// Compared against when the username is unknown, so a login attempt costs the
// same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync("unused-placeholder-password", 10);

interface AdminUserRow {
  id: number;
  password: string;
  token_version: number;
}

let tokenVersionReady: Promise<void> | null = null;

/** Adds admin_users.token_version on databases created before it existed. */
function ensureTokenVersionColumn(): Promise<void> {
  if (!tokenVersionReady) {
    tokenVersionReady = (async () => {
      const db = getDb();
      try {
        await db.query("SELECT token_version FROM admin_users LIMIT 1");
      } catch {
        await db.execute(
          "ALTER TABLE admin_users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0"
        );
      }
    })().catch((err) => {
      tokenVersionReady = null;
      throw err;
    });
  }
  return tokenVersionReady;
}

async function findAdminUser(username: string): Promise<AdminUserRow | null> {
  await ensureTokenVersionColumn();
  const rows = await getDb().query<AdminUserRow>(
    "SELECT id, password, token_version FROM admin_users WHERE username = ?",
    [username]
  );
  return rows[0] ?? null;
}

export async function verifyAdminPassword(
  username: string,
  password: string
): Promise<boolean> {
  const user = await findAdminUser(username);
  const matches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  return !!user && matches;
}

/** Issues a session token bound to the user's current token version. */
export async function createSessionToken(username: string): Promise<string | null> {
  const user = await findAdminUser(username);
  if (!user) return null;
  return createToken({ username, v: Number(user.token_version) }, SESSION_HOURS);
}

/** Invalidates every session token issued so far for this user. */
export async function revokeSessions(username: string): Promise<void> {
  await ensureTokenVersionColumn();
  await getDb().execute(
    "UPDATE admin_users SET token_version = token_version + 1 WHERE username = ?",
    [username]
  );
}

export async function requireAuth(req: NextRequest): Promise<{ username: string } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || typeof payload.username !== "string") return null;

  try {
    const user = await findAdminUser(payload.username);
    if (!user || Number(user.token_version) !== payload.v) return null;
  } catch (err) {
    console.error("[auth] Session lookup failed:", err);
    return null;
  }

  return { username: payload.username };
}
