import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import {
  createSessionToken,
  requireAuth,
  revokeSessions,
  verifyAdminPassword,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth.server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";
import { passwordConfirmLimiter } from "@/lib/rate-limit.server";
import { getDb } from "@/lib/db.server";
import { logAdminAction } from "@/lib/admin-log.server";
import { getClientIp } from "@/lib/client-ip.server";

const MIN_PASSWORD_LENGTH = 8;

export async function PATCH(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== "string" || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    const db = getDb();
    const rows = await db.query<{ id: number; password: string }>(
      "SELECT id, password FROM admin_users WHERE username = ?",
      [user.username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = rows[0];
    const limit = passwordConfirmLimiter.check(user.username);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many incorrect password attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds ?? 60) } }
      );
    }

    const isValid = await verifyAdminPassword(user.username, currentPassword);

    if (!isValid) {
      passwordConfirmLimiter.recordFailure(user.username);
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    passwordConfirmLimiter.reset(user.username);

    const hash = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE admin_users SET password = ? WHERE id = ?", [
      hash,
      dbUser.id,
    ]);

    const ip = getClientIp(req);
    logAdminAction(user.username, "password_change", null, ip).catch((err) => {
      console.error("[Password API] Failed to log password change:", err);
    });

    // Sign out every existing session, then keep this browser signed in.
    await revokeSessions(user.username);
    const token = await createSessionToken(user.username);

    const response = NextResponse.json({ success: true });
    if (token) {
      response.cookies.set(
        SESSION_COOKIE,
        token,
        adminSessionCookieOptions(req.url, SESSION_MAX_AGE_SECONDS)
      );
    }
    return response;
  } catch (err) {
    console.error("[Password API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
