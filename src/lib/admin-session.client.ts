/**
 * Restores admin_token in sessionStorage from the httpOnly admin_session cookie
 * when the tab was closed but the cookie is still valid.
 */
export async function getAdminToken(): Promise<string | null> {
  const cached = sessionStorage.getItem("admin_token");
  if (cached) return cached;

  try {
    const res = await fetch("/api/admin/session", { credentials: "include" });
    if (!res.ok) return null;

    const data = await res.json();
    if (typeof data.token === "string") {
      sessionStorage.setItem("admin_token", data.token);
      return data.token;
    }
  } catch {
    // Network error — treat as unauthenticated
  }

  return null;
}
