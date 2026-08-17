"use client";

import type { LeadAttribution } from "@/types/leads";

/**
 * [Phase L — UTM + Campaign Attribution] First-party, client-only
 * attribution capture. Real values only — every field here is read
 * directly from `location.search`/`document.referrer` at the moment the
 * visitor's browser executes this; nothing is inferred or guessed.
 *
 * `firstTouch` is written once (`localStorage`, never overwritten once
 * set) — the very first campaign/referrer that ever brought this visitor
 * in, for the life of their browser storage. `latestTouch` is overwritten
 * every time a fresh visit arrives carrying new UTM/click-id params,
 * capturing the most recent touch even if it wasn't the first. Both are
 * attached to a lead automatically at submission time (`LeadForm.tsx`) —
 * the visitor never re-enters this information.
 */

const FIRST_TOUCH_KEY = "attribution-first-touch";
const LATEST_TOUCH_KEY = "attribution-latest-touch";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const CLICK_ID_KEYS = ["gclid", "gbraid", "wbraid"] as const;

function captureFromCurrentUrl(): LeadAttribution | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const touch: LeadAttribution = {};

  const source = params.get("utm_source");
  const medium = params.get("utm_medium");
  const campaign = params.get("utm_campaign");
  const term = params.get("utm_term");
  const content = params.get("utm_content");
  if (source) touch.source = source;
  if (medium) touch.medium = medium;
  if (campaign) touch.campaign = campaign;
  if (term) touch.term = term;
  if (content) touch.content = content;

  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key);
    if (value) touch[key] = value;
  }

  const hasUtmOrClickId = UTM_KEYS.some((k) => params.get(k)) || CLICK_ID_KEYS.some((k) => params.get(k));
  if (!hasUtmOrClickId) {
    // No campaign params on this visit — still worth recording an
    // "organic/direct" touch with real referrer/landing-page data, rather
    // than recording nothing at all (a lead with zero attribution history
    // is a real, honest outcome; a touch record with only landing
    // page/referrer, no invented source/medium, is also honest).
  }

  touch.landingPage = window.location.pathname + window.location.search;
  touch.referrer = document.referrer || undefined;
  touch.capturedAt = new Date().toISOString();
  return touch;
}

function readStored(key: string): LeadAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LeadAttribution) : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: LeadAttribution): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, quota) — attribution simply
    // isn't captured for this visit; never throws into the caller.
  }
}

/** Call once per page load (see `AttributionCapture.tsx`) — cheap, idempotent. */
export function captureAttribution(): void {
  const touch = captureFromCurrentUrl();
  if (!touch) return;

  if (!readStored(FIRST_TOUCH_KEY)) {
    writeStored(FIRST_TOUCH_KEY, touch);
  }
  writeStored(LATEST_TOUCH_KEY, touch);
}

export function getFirstTouch(): LeadAttribution | undefined {
  return readStored(FIRST_TOUCH_KEY) ?? undefined;
}

export function getLatestTouch(): LeadAttribution | undefined {
  return readStored(LATEST_TOUCH_KEY) ?? undefined;
}
