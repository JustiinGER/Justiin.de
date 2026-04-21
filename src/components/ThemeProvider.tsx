"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

function TimeBasedThemeUpdater() {
  const { setTheme } = useTheme();
  
  React.useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (!storedTheme || storedTheme === "system") {
      const germanyTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Berlin" });
      const hour = new Date(germanyTime).getHours();
      
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
