"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/analytics/attribution";

/**
 * [Phase L — UTM + Campaign Attribution] Mounted once in `layout.tsx`
 * (every route, public and admin alike passes through the root layout).
 * Runs `captureAttribution()` once, on mount — which in the App Router
 * means once per hard navigation/full page load, not on every subsequent
 * client-side `<Link>` transition (the root layout doesn't remount on
 * those). That's the correct scope for this: a visitor carrying UTM/click-id
 * params always arrives via a hard navigation (an ad click, a shared link),
 * never a same-site `<Link>` click, so nothing is missed. `firstTouch` is
 * written once per browser (see `attribution.ts`); `latestTouch` updates
 * on this and every later hard-navigation arrival that carries new params.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
