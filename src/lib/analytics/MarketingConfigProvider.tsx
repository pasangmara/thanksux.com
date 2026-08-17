"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarketingSettings } from "@/types/marketing";

/**
 * [Phase L] `layout.tsx` (a Server Component) fetches `MarketingSettings`
 * once per request via `getMarketingSettings()` and passes it down through
 * this provider — the same "server fetches once, client components read
 * via props" pattern `SiteNav`/`SiteFooter` already use for Site Settings,
 * not a second client-side fetch. `GoogleTagManager`, `GoogleAnalytics`,
 * `ConsentBanner`, `LeadForm`, and `fireConversion()` (`conversions.ts`,
 * via `useMarketingConfig()`) all read from here — one source, not five
 * independent fetches.
 */

const MarketingConfigContext = createContext<MarketingSettings | null>(null);

export function MarketingConfigProvider({
  settings,
  children,
}: {
  settings: MarketingSettings;
  children: ReactNode;
}) {
  return <MarketingConfigContext.Provider value={settings}>{children}</MarketingConfigContext.Provider>;
}

export function useMarketingConfig(): MarketingSettings | null {
  return useContext(MarketingConfigContext);
}
