"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventName, AnalyticsEventParams } from "@/lib/analytics/events";

/**
 * [Phase L — GA4 Event Architecture] Fires one named view event once on
 * mount — the minimal client boundary needed to track a page view from an
 * otherwise fully server-rendered detail page (`work/[slug]/page.tsx`)
 * without converting that page itself to a client component.
 */
export function ViewEventTracker({ name, params }: { name: AnalyticsEventName; params: AnalyticsEventParams }) {
  useEffect(() => {
    trackEvent(name, params);
    // Only re-fire if the identity of what's being viewed actually
    // changes (e.g. navigating from one project to another) — not on
    // every param object identity change, which would double-fire for no
    // reason since callers construct a fresh params object each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, params.project_id]);

  return null;
}
