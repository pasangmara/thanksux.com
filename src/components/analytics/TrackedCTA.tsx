"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEventName, AnalyticsEventParams } from "@/lib/analytics/events";

/**
 * [Phase — CTA tracking] The one reusable wrapper every link-style CTA on
 * the public site goes through to report a click — not a second tracking
 * system, a thin `Button` wrapper that calls the exact same `trackEvent()`
 * (`track.ts`) every other tracked interaction already uses. Needed
 * because `Hero.tsx`/`ProjectCTA.tsx`/`HiringCTA.tsx`/`Services.tsx` are
 * Server Components — a plain `<Button>` there can't take an `onClick`;
 * this is the minimal client boundary, same pattern already established
 * by `TrackedLinkButton` (case-study URL fields) and `ViewEventTracker`
 * (project-view events).
 *
 * Fires the generic `click_cta` engagement event by default — deliberately
 * NOT a conversion (see `conversions.ts`'s header comment on why a click
 * is engagement, not a lead). Only `LeadForm`'s actual successful
 * submission fires `fireConversion()`.
 */
export function TrackedCTA({
  href,
  variant = "primary",
  target,
  rel,
  ctaType,
  location,
  className,
  children,
  eventName = "click_cta",
  eventParams,
}: {
  href: string;
  variant?: "primary" | "secondary" | "text-link";
  target?: string;
  rel?: string;
  /** e.g. "primary", "secondary", "figma", "external" — recorded as `cta_type`, never PII. */
  ctaType: string;
  /** e.g. "hero", "project_cta", "hiring_cta", "services" — recorded as `cta_location`. */
  location: string;
  className?: string;
  children: ReactNode;
  eventName?: AnalyticsEventName;
  eventParams?: AnalyticsEventParams;
}) {
  return (
    <Button
      variant={variant}
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() =>
        trackEvent(eventName, { cta_type: ctaType, cta_location: location, destination: href, ...eventParams })
      }
    >
      {children}
    </Button>
  );
}
