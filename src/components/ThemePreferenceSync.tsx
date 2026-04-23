"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { preferenceToNextTheme, readSiteTheme, SITE_THEME_CHANGE_EVENT, SITE_THEME_KEY } from "@/lib/theme-preference";

export function ThemePreferenceSync() {
  const { setTheme } = useTheme();

  const apply = React.useCallback(() => {
    const preference = readSiteTheme();
    setTheme(preferenceToNextTheme(preference));
  }, [setTheme]);

  React.useEffect(() => {
    apply();
    const onSiteTheme = () => apply();
    const onStorage = (e: StorageEvent) => {
      if (e.key === SITE_THEME_KEY || e.key === null) apply();
    };
    window.addEventListener(SITE_THEME_CHANGE_EVENT, onSiteTheme);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SITE_THEME_CHANGE_EVENT, onSiteTheme);
      window.removeEventListener("storage", onStorage);
    };
  }, [apply]);

  return null;
}
