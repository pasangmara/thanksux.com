"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventName, AnalyticsEventParams } from "@/lib/analytics/events";

/**
 * [CTA tracking] For CTAs styled as a whole clickable block (e.g. a
 * Services card is a bordered `<Link>`, not a `Button`) rather than an
 * actual `Button` component — `TrackedCTA` would change the visual
 * design here (it always renders `Button`'s own classes); this preserves
 * the caller's exact existing markup/className and only adds the
 * click-tracking boundary, same `trackEvent()` underneath.
 */
export function TrackedLink({
  href,
  className,
  children,
  ctaType,
  location,
  ariaLabel,
  eventName = "click_cta",
  eventParams,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  ctaType: string;
  location: string;
  ariaLabel?: string;
  eventName?: AnalyticsEventName;
  eventParams?: AnalyticsEventParams;
}) {
  return (
    <Link
      href={href}
      className={className}
      aria-label={ariaLabel}
      onClick={() =>
        trackEvent(eventName, { cta_type: ctaType, cta_location: location, destination: href, ...eventParams })
      }
    >
      {children}
    </Link>
  );
}
