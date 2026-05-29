import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { requireAuth } from "@/lib/auth.server";
import { getPool } from "@/lib/db.server";
import { logAdminAction } from "@/lib/admin-log.server";

const MIN_PASSWORD_LENGTH = 8;

export async function PATCH(req: NextRequest) {
  const user = requireAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
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

    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, password FROM admin_users WHERE username = ?",
      [user.username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = rows[0];
    const isValid = await bcrypt.compare(currentPassword, dbUser.password);

    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.execute("UPDATE admin_users SET password = ? WHERE id = ?", [
      hash,
      dbUser.id,
    ]);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    logAdminAction(user.username, "password_change", null, ip).catch((err) => {
      console.error("[Password API] Failed to log password change:", err);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Password API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
