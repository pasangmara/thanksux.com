"use client";

import Script from "next/script";
import { useMarketingConfig } from "@/lib/analytics/MarketingConfigProvider";
import { useConsentGate } from "@/lib/analytics/useConsentGate";

/**
 * [Phase L — GA4 integration] Independent of GTM — an admin may enable
 * GA4 directly (its own `gtag.js` loader) without routing through Tag
 * Manager at all, or run both side by side (GTM can also fire GA4 tags
 * itself; this component doesn't know or care which approach an admin
 * chooses, it only loads gtag.js when GA4 is explicitly enabled here).
 * Same gating rules as `GoogleTagManager.tsx`: real measurement id
 * required, consent-gated when consent is required.
 */
export function GoogleAnalytics() {
  const settings = useMarketingConfig();
  const granted = useConsentGate("analytics", settings?.consent.required ?? false);

  if (!settings?.ga4.enabled || !settings.ga4.measurementId.trim() || !granted) return null;

  const id = settings.ga4.measurementId.trim();

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${id}');`}
      </Script>
    </>
  );
}
