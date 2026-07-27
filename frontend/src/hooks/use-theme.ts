import { useEffect } from "react";

import { useThemeStore } from "../store/theme.store";

export function useTheme(): void {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
    root.setAttribute("data-theme", resolved);
  }, [mode]);
}
