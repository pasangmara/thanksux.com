"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { useMarketingConfig } from "@/lib/analytics/MarketingConfigProvider";
import { readConsent, writeConsent } from "@/lib/analytics/consent";

/**
 * [Phase L — Consent + Privacy] Only renders when
 * `MarketingSettings.consent.required` is true (an explicit admin
 * decision — see that field's doc comment) AND the visitor hasn't
 * decided yet. "Necessary only" and "Accept all" both write a real,
 * explicit choice via `writeConsent()`; there is no "accept by default"
 * path — `GoogleTagManager`/`GoogleAnalytics` stay unloaded until one of
 * these buttons is actually pressed.
 */
export function ConsentBanner() {
  const settings = useMarketingConfig();
  const [dismissed, setDismissed] = useState(() => Boolean(readConsent()));

  if (!settings?.consent.required || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
        <p className="text-caption max-w-[60ch] text-text-secondary">
          This site uses analytics and marketing cookies to understand how visitors use it and to
          measure campaign performance. Necessary site function is never gated by this choice.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              writeConsent({ analytics: false, marketing: false });
              setDismissed(true);
            }}
          >
            Necessary only
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              writeConsent({ analytics: true, marketing: true });
              setDismissed(true);
            }}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
