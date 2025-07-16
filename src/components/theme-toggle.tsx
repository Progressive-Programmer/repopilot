
"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Switch
      id="theme-toggle"
      checked={theme === 'dark'}
      onCheckedChange={(checked) => {
        setTheme(checked ? 'dark' : 'light')
      }}
      aria-label="Toggle theme"
    />
  );
}
