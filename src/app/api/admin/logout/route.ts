import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_session", "", adminSessionCookieOptions(req.url, 0));

  return response;
}
