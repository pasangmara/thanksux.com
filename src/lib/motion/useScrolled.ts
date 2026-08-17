"use client";

import { useEffect, useState } from "react";

/**
 * [Visual Design / Motion Phase — v4] True once the page has scrolled past
 * `thresholdPx` — drives the navbar's clean-to-glass transition (§6).
 * Passive + rAF-throttled, same technique HeroParallax.tsx already uses for
 * its own scroll listener, so this doesn't introduce a second scroll-
 * handling pattern. No `prefers-reduced-motion` branch needed here: the
 * background/blur/shadow crossfade this drives is a state indicator (is
 * the page scrolled or not), not decorative motion — same category as the
 * signal-live-dot's opacity change, which also has no reduced-motion
 * fallback for the same reason.
 */
export function useScrolled(thresholdPx = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    function apply() {
      ticking = false;
      setScrolled(window.scrollY > thresholdPx);
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [thresholdPx]);

  return scrolled;
}
