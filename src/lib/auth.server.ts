/**
 * Auth helpers — server-only.
 * Extracts and validates the Bearer token from API requests.
 */

import { type NextRequest } from "next/server";
import { verifyToken } from "./jwt.server";

export function requireAuth(req: NextRequest): { username: string } | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload || typeof payload.username !== "string") return null;

  return { username: payload.username };
}
