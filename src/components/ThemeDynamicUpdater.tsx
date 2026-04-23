"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  SITE_THEME_CHANGE_EVENT,
  getScheduledThemeForBerlin,
  readSiteTheme,
  SITE_THEME_KEY,
} from "@/lib/theme-preference";

export function ThemeDynamicUpdater() {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const apply = () => {
      try {
        if (readSiteTheme() !== "dynamic") return;
        setTheme(getScheduledThemeForBerlin());
      } catch {
        /* ignore */
      }
    };

    apply();
    const intervalId = window.setInterval(apply, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") apply();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === SITE_THEME_KEY || e.key === null) apply();
    };
    window.addEventListener(SITE_THEME_CHANGE_EVENT, apply);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(SITE_THEME_CHANGE_EVENT, apply);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [setTheme]);

  return null;
}
