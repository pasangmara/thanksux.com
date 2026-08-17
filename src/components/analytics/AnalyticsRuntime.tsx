"use client";

import { usePathname } from "next/navigation";
import { AttributionCapture } from "./AttributionCapture";
import { ConsentBanner } from "./ConsentBanner";
import { GoogleAnalytics } from "./GoogleAnalytics";
import { GoogleTagManager } from "./GoogleTagManager";
import { TrackingDebugPanel } from "./TrackingDebugPanel";

/**
 * [Phase L] Single mount point in `layout.tsx` bundling every tracking/
 * consent/attribution runtime piece — same "one place, not scattered"
 * principle `track.ts` already documents for events. Self-hides on
 * `/admin/**` routes, mirroring `SiteNav`/`SiteFooter`'s existing
 * isolation rule: admin activity is never tracked by the public
 * analytics/consent/attribution layer.
 */
export function AnalyticsRuntime() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <AttributionCapture />
      <GoogleTagManager />
      <GoogleAnalytics />
      <ConsentBanner />
      <TrackingDebugPanel />
    </>
  );
}
