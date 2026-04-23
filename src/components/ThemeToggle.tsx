"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  readSiteTheme,
  writeSiteTheme,
  type SiteThemePreference,
  SITE_THEME_CHANGE_EVENT,
  SITE_THEME_KEY,
} from "@/lib/theme-preference";

type ThemeToggleProps = {
  variant?: "floating" | "panel";
};

export function ThemeToggle({ variant = "panel" }: ThemeToggleProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [preference, setPreference] = React.useState<SiteThemePreference>("system");

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      setPreference(readSiteTheme());
    } catch {
      setPreference("system");
    }
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    const sync = () => {
      try {
        setPreference(readSiteTheme());
      } catch {
        setPreference("system");
      }
    };
    window.addEventListener(SITE_THEME_CHANGE_EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === SITE_THEME_KEY || e.key === null) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SITE_THEME_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  if (variant === "panel") {
    return (
      <section aria-label="Theme settings">
        <p className="mb-2 text-sm font-medium text-brand-text">Theme</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              writeSiteTheme("system");
            }}
            aria-pressed={preference === "system"}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              preference === "system"
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-brand-border text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            System
          </button>
          <button
            type="button"
            onClick={() => {
              writeSiteTheme("light");
            }}
            aria-pressed={preference === "light"}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              preference === "light"
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-brand-border text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => {
              writeSiteTheme("dark");
            }}
            aria-pressed={preference === "dark"}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              preference === "dark"
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-brand-border text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => {
              writeSiteTheme("dynamic");
            }}
            aria-pressed={preference === "dynamic"}
            className={`rounded-md border px-3 py-2 text-sm transition-colors ${
              preference === "dynamic"
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-brand-border text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            Dynamic
          </button>
        </div>

        <p className="mt-3 text-xs leading-snug text-brand-muted">
          Dynamic follows time of day in Europe/Berlin (light 06:00–18:59, dark otherwise), checked
          about every minute while the page is open.
        </p>
      </section>
    );
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        const next = currentTheme === "dark" ? "light" : "dark";
        writeSiteTheme(next);
      }}
      className="fixed bottom-6 right-6 z-50 rounded-full border border-brand-border bg-brand-card p-3 text-brand-muted shadow-lg transition-colors hover:text-brand-accent"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </motion.button>
  );
}
