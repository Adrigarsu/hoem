"use client";

import { useEffect } from "react";
import { applyTheme, type Theme } from "@/lib/theme/theme";

// The profile is the source of truth: this corrects a device whose cookie is older than it.
export function ThemeSync({ theme }: { theme: Theme }) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  return null;
}
