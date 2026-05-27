import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db.server";
import { createToken } from "@/lib/jwt.server";
import type { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const pool = getPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, password FROM admin_users WHERE username = ?",
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Create a token valid for 24 hours
    const token = createToken({ username });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[Auth API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
