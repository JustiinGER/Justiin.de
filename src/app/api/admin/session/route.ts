import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { requireAuth, SESSION_COOKIE } from "@/lib/auth.server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";

/** Reports whether the httpOnly admin_session cookie is valid — never returns the token. */
export async function GET(req: NextRequest) {
  const user = await requireAuth(req);

  if (!user) {
    const response = NextResponse.json({ authenticated: false });
    if (req.cookies.has(SESSION_COOKIE)) {
      response.cookies.set(SESSION_COOKIE, "", adminSessionCookieOptions(req.url, 0));
    }
    return response;
  }

  return NextResponse.json({ authenticated: true, username: user.username });
}
