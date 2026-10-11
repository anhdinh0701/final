"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Language, translations } from "@/lib/i18n";

interface Props {
  lang?: Language;
}

export function ThemeToggle({ lang = "vi" }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = translations[lang] || translations.vi;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-7 w-16" />;
  }

  const isDark = theme === "dark";
  const label = isDark ? (lang === "vi" ? "[SÁNG]" : "[LIGHT]") : (lang === "vi" ? "[TỐI]" : "[DARK]");
  const tooltip = isDark ? t.theme_light : t.theme_dark;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="px-2.5 py-1 text-xs font-mono font-bold tracking-wider rounded border border-neutral-300 bg-white text-black hover:bg-neutral-100 dark:border-neutral-700 dark:bg-black dark:text-white dark:hover:bg-neutral-900 transition-colors select-none"
      title={tooltip}
      aria-label={t.theme_toggle_aria}
    >
      {label}
    </button>
  );
}
