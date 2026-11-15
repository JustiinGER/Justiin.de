import { NextResponse } from "next/server";
import { createSessionToken, verifyAdminPassword, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth.server";
import { logAdminAction } from "@/lib/admin-log.server";
import { adminSessionCookieOptions } from "@/lib/admin-cookie.server";
import { getClientIp } from "@/lib/client-ip.server";
import { createRateLimiter } from "@/lib/rate-limit.server";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Per client address: stops a single source from guessing.
const ipLimiter = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, maxAttempts: 5 });
// Per account: caps guessing spread over many addresses, and is the only limit
// when no trustworthy client address is available. Kept loose so that a few
// stray attempts by someone else do not lock the real admin out.
const usernameLimiter = createRateLimiter({ windowMs: RATE_LIMIT_WINDOW_MS, maxAttempts: 30 });

const MAX_USERNAME_LENGTH = 64;
const MAX_PASSWORD_LENGTH = 1024;

function tooManyAttempts(retryAfterSeconds: number | undefined) {
  return NextResponse.json(
    { error: "Too many login attempts. Please try again later.", retryAfter: retryAfterSeconds },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds ?? 60) },
    }
  );
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipKey = ip ? `ip:${ip}` : null;

  if (ipKey) {
    const ipCheck = ipLimiter.check(ipKey);
    if (!ipCheck.allowed) return tooManyAttempts(ipCheck.retryAfterSeconds);
  }

  try {
    const body = (await req.json().catch(() => null)) as {
      username?: unknown;
      password?: unknown;
    } | null;
    const username = body?.username;
    const password = body?.password;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username ||
      !password ||
      username.length > MAX_USERNAME_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const userKey = `user:${username.toLowerCase()}`;
    const userCheck = usernameLimiter.check(userKey);
    if (!userCheck.allowed) return tooManyAttempts(userCheck.retryAfterSeconds);

    const isValid = await verifyAdminPassword(username, password);
    const token = isValid ? await createSessionToken(username) : null;

    if (!token) {
      if (ipKey) ipLimiter.recordFailure(ipKey);
      usernameLimiter.recordFailure(userKey);
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    if (ipKey) ipLimiter.reset(ipKey);
    usernameLimiter.reset(userKey);

    logAdminAction(username, "login", null, ip).catch((err) => {
      console.error("[Auth API] Failed to log login:", err);
    });

    // The token is only ever delivered as an httpOnly cookie.
    const response = NextResponse.json({ success: true });

    response.cookies.set(
      SESSION_COOKIE,
      token,
      adminSessionCookieOptions(req.url, SESSION_MAX_AGE_SECONDS)
    );

    return response;
  } catch (err) {
    console.error("[Auth API] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
