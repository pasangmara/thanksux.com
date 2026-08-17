"use client";

import { useSyncExternalStore } from "react";
import { getEffectiveConsent } from "./consent";

/**
 * [Phase L — Consent + Privacy] Whether a given consent category is
 * currently granted. Uses `useSyncExternalStore` (not `useState` +
 * `useEffect`) for the same reason `Animated.tsx` does — a browser-only
 * read (localStorage) needs a correct, mismatch-free SSR snapshot, which
 * this hook provides by treating "not yet decided" as `false` on both the
 * server and the client's first paint; the real value settles in
 * immediately after via the "consent-changed" event `writeConsent()`
 * dispatches (see `consent.ts`) or on mount if consent was already
 * decided in a previous visit.
 */
function subscribe(callback: () => void): () => void {
  window.addEventListener("consent-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("consent-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

export function useConsentGate(category: "analytics" | "marketing", consentRequired: boolean): boolean {
  const getSnapshot = () => getEffectiveConsent(consentRequired)[category];
  const getServerSnapshot = () => !consentRequired; // no consent required -> granted by default even during SSR; required -> not yet decided, so false until hydration settles the real value
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
