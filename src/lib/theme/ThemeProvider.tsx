"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Matches the key the inline anti-flash script (layout.tsx <head>) reads/writes. */
export const THEME_STORAGE_KEY = "thanksux-theme";

/** Fired after `setPreference` writes localStorage, so same-tab subscribers
 * re-read it — the native `storage` event only fires in *other* tabs. */
const THEME_CHANGE_EVENT = "thanksux-theme-change";

type ThemeContextValue = {
  /** "system" means no manual choice has been made yet — see spec §10. */
  preference: ThemePreference;
  /** The theme actually applied right now, resolving "system" against the OS setting. */
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: "light" | "dark") => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage may be unavailable (private browsing, blocked cookies) — falls back to system.
    return "system";
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDomTheme(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", preference);
  }
}

type ThemeSnapshot = { preference: ThemePreference; resolvedTheme: ResolvedTheme };

/** SSR-safe default — the inline anti-flash script already painted the real
 * theme onto <html> before hydration, so this fixed reference never causes a
 * visible flash; `getSnapshot` below takes over on the client immediately
 * after mount, same timing the previous effect-based version had. */
const SERVER_SNAPSHOT: ThemeSnapshot = { preference: "system", resolvedTheme: "light" };

// useSyncExternalStore requires a stable reference when nothing changed
// (returning a fresh object every call causes an infinite re-render loop) —
// cached and only replaced when a field actually differs.
let cachedSnapshot: ThemeSnapshot | null = null;

function getSnapshot(): ThemeSnapshot {
  const preference = readStoredPreference();
  const resolvedTheme = preference === "system" ? getSystemTheme() : preference;
  if (cachedSnapshot && cachedSnapshot.preference === preference && cachedSnapshot.resolvedTheme === resolvedTheme) {
    return cachedSnapshot;
  }
  cachedSnapshot = { preference, resolvedTheme };
  return cachedSnapshot;
}

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  mql.addEventListener("change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    mql.removeEventListener("change", onStoreChange);
  };
}

/**
 * [Theme system] Client-side theme preference, additive to the existing
 * automatic `prefers-color-scheme` support already baked into tokens.css —
 * this provider only decides *whether* to override it (via the
 * `data-theme` attribute tokens.css's `:root[data-theme="..."]` blocks key
 * off), never duplicates the color values themselves.
 *
 * Reads localStorage/matchMedia via `useSyncExternalStore` rather than an
 * effect + setState on mount — same SSR-safe "starts as system/light, then
 * corrects on the client" behavior, but without synchronously setting state
 * from inside an effect body.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preference, resolvedTheme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setPreference = useCallback((next: "light" | "dark") => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Non-fatal — the choice still applies for this page view via DOM state.
    }
    applyDomTheme(next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
