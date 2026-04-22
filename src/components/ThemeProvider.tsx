"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function TimeBasedThemeUpdater() {
  const { setTheme } = useTheme();
  
  React.useEffect(() => {
    const isManual = localStorage.getItem("theme-manual") === "true";
    
    if (!isManual) {
      // Safe way to get the hour in Berlin time (0-23)
      const hourString = new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Berlin",
        hour: "numeric",
        hour12: false
      }).format(new Date());
      
      const hour = parseInt(hourString, 10);
      
      const isDaytime = hour >= 6 && hour < 19;
      const targetTheme = isDaytime ? "light" : "dark";
      
      setTheme(targetTheme);
    }
  }, [setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <TimeBasedThemeUpdater />
      {children}
    </NextThemesProvider>
  );
}
