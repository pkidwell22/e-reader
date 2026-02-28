"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/preferencesStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    // Set data-theme attribute on <html> for CSS custom property switching
    document.documentElement.setAttribute("data-theme", theme);

    // Also update the meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const themeColors: Record<string, string> = {
      light: "#FAFAF7",
      dark: "#141419",
      sepia: "#F5ECD7",
    };
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColors[theme]);
    }
  }, [theme]);

  return <>{children}</>;
}
