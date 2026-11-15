/**
 * Client IP resolution — server-only.
 *
 * X-Forwarded-For is a client-controlled header: every proxy appends the
 * address it saw, so only the entries added by our own proxies can be trusted.
 * TRUSTED_PROXY_HOPS says how many proxies sit in front of the app (default 1);
 * the client IP is then the Nth entry counted from the right.
 * Set it to 0 when the app is exposed without a proxy — the header is then
 * ignored entirely.
 */

import net from "net";

function trustedProxyHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw.trim() === "") return 1;
  const hops = Number.parseInt(raw, 10);
  return Number.isInteger(hops) && hops >= 0 ? hops : 1;
}

export function getClientIp(req: Request): string | null {
  const hops = trustedProxyHops();
  if (hops === 0) return null;

  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return null;

  const parts = forwarded.split(",").map((part) => part.trim());
  const candidate = parts[parts.length - hops];
  if (!candidate || net.isIP(candidate) === 0) return null;

  return candidate;
}
