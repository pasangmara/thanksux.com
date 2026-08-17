"use client";

import { MoonIcon, SunIcon } from "@/components/icons";
import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * [Theme system] Compact segmented light/dark control — spec calls for a
 * "real modern product control," not a giant switch: 36px tall (matches
 * Chip's existing "small UI element" height, docs/DESIGN_SYSTEM.md v2
 * §11), one subtle border, two icon buttons sharing a quiet surface.
 * `aria-pressed` communicates the active side; there's no third visual
 * state for "system" — system is the *implicit* default before either
 * button is ever clicked (see ThemeProvider), not a selectable option in
 * this control, matching the spec's two-icon mockup exactly.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme"
      className={`inline-flex h-[36px] items-center gap-0.5 rounded-sm border border-border bg-background-alt p-0.5 ${className}`}
    >
      <button
        type="button"
        aria-pressed={resolvedTheme === "light"}
        aria-label="Light theme"
        onClick={() => setPreference("light")}
        className={`flex h-full w-7 items-center justify-center rounded-sm transition-colors duration-150 ease-out ${
          resolvedTheme === "light"
            ? "bg-surface text-ink"
            : "text-text-tertiary hover:text-ink"
        }`}
      >
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-pressed={resolvedTheme === "dark"}
        aria-label="Dark theme"
        onClick={() => setPreference("dark")}
        className={`flex h-full w-7 items-center justify-center rounded-sm transition-colors duration-150 ease-out ${
          resolvedTheme === "dark"
            ? "bg-surface text-ink"
            : "text-text-tertiary hover:text-ink"
        }`}
      >
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
