"use client";

/**
 * [Phase L — Consent + Privacy] First-party, localStorage-backed consent
 * state — "Necessary" is always granted (the site can't function without
 * it: routing, the admin session banner, etc. — none of which is
 * analytics/marketing, so it's not actually gated by anything here).
 * "Analytics" and "Marketing" are independently grantable; `GoogleTagManager`/
 * `GoogleAnalytics` (see those files) only inject their script tags once
 * the relevant category is granted AND `MarketingSettings.consent.required`
 * is true — when that admin toggle is false, both categories default to
 * granted immediately, so this module is a no-op gate in that mode, not
 * dead code: flipping the toggle later starts gating without any other
 * change.
 */

const STORAGE_KEY = "consent-preferences";

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt?: string;
}

const DEFAULT_UNDECIDED: ConsentPreferences = { necessary: true, analytics: false, marketing: false };

export function readConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentPreferences>;
    return { necessary: true, analytics: Boolean(parsed.analytics), marketing: Boolean(parsed.marketing), decidedAt: parsed.decidedAt };
  } catch {
    return null;
  }
}

export function writeConsent(prefs: Omit<ConsentPreferences, "necessary" | "decidedAt">): ConsentPreferences {
  const full: ConsentPreferences = { necessary: true, ...prefs, decidedAt: new Date().toISOString() };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent("consent-changed", { detail: full }));
  }
  return full;
}

export function getEffectiveConsent(consentRequired: boolean): ConsentPreferences {
  if (!consentRequired) return { necessary: true, analytics: true, marketing: true };
  return readConsent() ?? DEFAULT_UNDECIDED;
}
