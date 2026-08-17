"use client";

import { ANALYTICS_EVENTS, PII_PARAM_KEYS, type AnalyticsEventName, type AnalyticsEventParams } from "./events";

/**
 * [Phase L — single reusable tracking utility] Every tracking call in
 * this codebase — GA4, GTM custom events, and (indirectly, via
 * `fireConversion` in `conversions.ts`) Google Ads — goes through this one
 * function, pushing to the standard `window.dataLayer` array GTM/gtag.js
 * both already read from. No component talks to `dataLayer` directly;
 * that's the "don't scatter GTM code throughout components" requirement.
 *
 * Safe to call even when no analytics integration is configured/enabled
 * — `dataLayer` may not exist yet (GTM/GA4 not loaded), so this always
 * initializes it defensively; if no script ever reads it, the array just
 * sits there unused, which is correct: nothing was "sent" anywhere.
 *
 * [Privacy] Strips any parameter whose key looks like PII (see
 * `PII_PARAM_KEYS`) before the event is ever queued — a structural
 * guard, not a per-call-site convention someone could forget.
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const debugListeners = new Set<(entry: TrackedEventDebugEntry) => void>();

export interface TrackedEventDebugEntry {
  name: AnalyticsEventName;
  params: AnalyticsEventParams;
  timestamp: string;
}

function sanitizeParams(params: AnalyticsEventParams): AnalyticsEventParams {
  const clean: AnalyticsEventParams = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (PII_PARAM_KEYS.includes(key.toLowerCase())) continue;
    clean[key] = value;
  }
  return clean;
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsEventParams = {}): void {
  if (typeof window === "undefined") return;
  if (!ANALYTICS_EVENTS.includes(name)) return;

  const cleanParams = sanitizeParams(params);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...cleanParams });

  const entry: TrackedEventDebugEntry = { name, params: cleanParams, timestamp: new Date().toISOString() };
  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] ${name}`, cleanParams);
  }
  debugListeners.forEach((listener) => listener(entry));
}

/** [Tracking debug mode] Subscribed to by `TrackingDebugPanel` (dev-only) — see that file. */
export function subscribeTrackedEvents(listener: (entry: TrackedEventDebugEntry) => void): () => void {
  debugListeners.add(listener);
  return () => debugListeners.delete(listener);
}
