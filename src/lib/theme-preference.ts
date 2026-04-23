export const SITE_THEME_KEY = "theme";

/** next-themes persistence; separate from {@link SITE_THEME_KEY} so we can store `dynamic` in `theme`. */
export const NEXT_THEMES_STORAGE_KEY = "__nt";

export type SiteThemePreference = "system" | "light" | "dark" | "dynamic";

export const SITE_THEME_CHANGE_EVENT = "site-theme-change";

export function isSiteThemePreference(value: string): value is SiteThemePreference {
  return value === "system" || value === "light" || value === "dark" || value === "dynamic";
}

/** Day = light (06:00–18:59), night = dark in Europe/Berlin. */
export function getScheduledThemeForBerlin(): "light" | "dark" {
  const hourString = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  const hour = parseInt(hourString, 10);
  const isDaytime = hour >= 6 && hour < 19;
  return isDaytime ? "light" : "dark";
}

export function readSiteTheme(): SiteThemePreference {
  try {
    const raw = localStorage.getItem(SITE_THEME_KEY);
    if (raw && isSiteThemePreference(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "system";
}

export function writeSiteTheme(preference: SiteThemePreference): void {
  try {
    localStorage.setItem(SITE_THEME_KEY, preference);
  } catch {
    /* ignore */
  }
  dispatchSiteThemeChange();
}

export function dispatchSiteThemeChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SITE_THEME_CHANGE_EVENT, { bubbles: false }));
}

/** Maps user preference to what next-themes should apply (`light` | `dark` | `system`). */
export function preferenceToNextTheme(preference: SiteThemePreference): "light" | "dark" | "system" {
  if (preference === "dynamic") return getScheduledThemeForBerlin();
  return preference;
}
