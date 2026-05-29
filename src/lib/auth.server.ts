/**
 * Auth helpers — server-only.
 * Extracts and validates the Bearer token from API requests.
 */

import { type NextRequest } from "next/server";
import { verifyToken } from "./jwt.server";

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
