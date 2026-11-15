import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";
import { requireAuth, revokeSessions, SESSION_COOKIE } from "@/lib/auth.server";

export async function POST(req: NextRequest) {
  // Invalidate the token server-side too, so a copy of it stops working.
  try {
    const user = await requireAuth(req);
    if (user) await revokeSessions(user.username);
  } catch (err) {
    console.error("[Logout API] Failed to revoke session:", err);
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(SESSION_COOKIE, "", adminSessionCookieOptions(req.url, 0));

  return response;
}
