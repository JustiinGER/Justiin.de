"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeDynamicUpdater } from "@/components/ThemeDynamicUpdater";
import { ThemePreferenceSync } from "@/components/ThemePreferenceSync";
import { NEXT_THEMES_STORAGE_KEY } from "@/lib/theme-preference";

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider storageKey={NEXT_THEMES_STORAGE_KEY} {...props}>
      <ThemePreferenceSync />
      <ThemeDynamicUpdater />
      {children}
    </NextThemesProvider>
  );
}
