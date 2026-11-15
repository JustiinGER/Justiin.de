type AdminSessionCookieOptions = {
  httpOnly: true;
  secure: boolean;
  sameSite: "strict";
  path: "/";
  maxAge: number;
};

/** Cookie flags for admin_session — Secure follows the request protocol unless overridden. */
export function adminSessionCookieOptions(
  requestUrl: string,
  maxAge: number
): AdminSessionCookieOptions {
  let secure: boolean;
  if (process.env.ADMIN_COOKIE_SECURE === "true") {
    secure = true;
  } else if (process.env.ADMIN_COOKIE_SECURE === "false") {
    secure = false;
  } else {
    secure = new URL(requestUrl).protocol === "https:";
  }

  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/",
    maxAge,
  };
}
