import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt.server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";

/** Restores client session from the httpOnly admin_session cookie. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;

  if (!token) {
    return NextResponse.json({ token: null });
  }

  const payload = verifyToken(token);
  if (!payload || typeof payload.username !== "string") {
    const response = NextResponse.json({ token: null });
    response.cookies.set("admin_session", "", adminSessionCookieOptions(req.url, 0));
    return response;
  }

  return NextResponse.json({ token });
}
