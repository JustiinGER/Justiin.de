/**
 * Asks the server whether the httpOnly admin_session cookie is still valid.
 * The session token itself is never exposed to JavaScript.
 */
export async function hasAdminSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/session", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return false;

    const data = await res.json();
    return data.authenticated === true;
  } catch {
    // Network error — treat as unauthenticated
    return false;
  }
}
