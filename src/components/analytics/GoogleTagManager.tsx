"use client";

import Script from "next/script";
import { useMarketingConfig } from "@/lib/analytics/MarketingConfigProvider";
import { useConsentGate } from "@/lib/analytics/useConsentGate";

/**
 * [Phase L — Google Tag Manager integration] Loads GTM's container script
 * only when `MarketingSettings.gtm.enabled` is true AND a real
 * `containerId` has been entered in `/admin/marketing` AND (if consent is
 * required) the visitor has granted "Marketing" consent — never
 * unconditionally, never with a placeholder id.
 *
 * `next/script` with `strategy="afterInteractive"` is the correct,
 * documented Next.js pattern for third-party tag managers: it loads after
 * the page is interactive (not blocking hydration/SSR) and Next
 * deduplicates the script tag itself if this component were ever mounted
 * twice, which combined with the `gtm.enabled` gate above is what
 * "avoid duplicate initialization" actually means here — there's no
 * separate manual dedupe flag needed.
 */
export function GoogleTagManager() {
  const settings = useMarketingConfig();
  const granted = useConsentGate("marketing", settings?.consent.required ?? false);

  if (!settings?.gtm.enabled || !settings.gtm.containerId.trim() || !granted) return null;

  const id = settings.gtm.containerId.trim();

  return (
    <Script id="gtm-init" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');`}
    </Script>
  );
}
