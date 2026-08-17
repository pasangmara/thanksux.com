"use client";

import type { MarketingSettings } from "@/types/marketing";
import type { AnalyticsEventName } from "./events";

/**
 * [Phase L — Google Ads Conversion Tracking] Centralized conversion
 * layer — looks up `MarketingSettings.conversions` for a mapping whose
 * `triggerEvent` matches, and only pushes a real Google Ads `conversion`
 * event to `dataLayer` if Google Ads itself is enabled+configured AND
 * that specific mapping is enabled. No mapping, no Google Ads
 * configuration, or a disabled mapping all mean exactly one thing: this
 * function does nothing — never a fabricated conversion.
 *
 * De-duplication: callers pass a `dedupeKey` (e.g. a lead's server-assigned
 * id) the first time this fires for that key; a second call with the same
 * key is dropped. In-memory only (a `Set`, not persisted) — correct for
 * "don't double-fire within one page session," which is the actual failure
 * mode (e.g. a submit handler re-invoked by a duplicate click) this guards
 * against; it does not claim to prevent duplicate conversions across
 * separate sessions, which Google Ads' own conversion window handles.
 */

const firedDedupeKeys = new Set<string>();

export function fireConversion(
  settings: MarketingSettings | null,
  triggerEvent: AnalyticsEventName,
  dedupeKey?: string,
): void {
  if (typeof window === "undefined" || !settings) return;
  if (dedupeKey && firedDedupeKeys.has(dedupeKey)) return;

  const googleAdsReady = settings.googleAds.enabled && settings.googleAds.conversionId.trim();
  if (!googleAdsReady) return;

  const mapping = settings.conversions.find((c) => c.enabled && c.triggerEvent === triggerEvent);
  if (!mapping || !mapping.conversionLabel.trim()) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "conversion",
    send_to: `${settings.googleAds.conversionId}/${mapping.conversionLabel}`,
    conversion_name: mapping.name,
  });

  if (dedupeKey) firedDedupeKeys.add(dedupeKey);

  if (process.env.NODE_ENV === "development") {
    console.debug(`[analytics] conversion fired: ${mapping.name}`, { triggerEvent, dedupeKey });
  }
}
