"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

/**
 * Hero visual grid — entrance (5th step, `data-hero-entrance="5"`, see
 * HeroEntrance/motion.css) plus a subtle scroll-linked parallax on the
 * desktop exhibition grid's 4 tiles, each moving at a slightly different
 * rate (`data-parallax-depth="1|2|3"` on Hero.tsx's tile wrappers).
 *
 * Desktop-only (>=1200px, where the asymmetric 4-tile grid actually
 * renders — tablet/mobile show 1-2 uniform tiles with no depth variation
 * to begin with) and fully disabled under `prefers-reduced-motion:
 * reduce`. Movement is capped small (max ~10px per depth unit) and always
 * `translateY` only, so tiles never overlap, the grid never overflows
 * horizontally, and click targets never drift out from under the pointer.
 * Passive scroll listener + rAF-throttled, not IntersectionObserver, since
 * this needs continuous position while the Hero is on screen, not a single
 * visibility trigger.
 */
export function HeroParallax({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-parallax-depth]"));
    if (layers.length === 0) return;

    const isDesktop = () => window.matchMedia("(min-width: 1200px)").matches;
    let ticking = false;

    function apply() {
      ticking = false;
      if (!isDesktop()) {
        for (const el of layers) el.style.transform = "";
        return;
      }
      const rect = root!.getBoundingClientRect();
      // 0 at the top of the viewport, 1 once the Hero has scrolled fully
      // past it — clamped, so the effect never extrapolates beyond a
      // small, intentional range.
      const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
      for (const el of layers) {
        const depth = Number(el.dataset.parallaxDepth ?? "0");
        el.style.transform = `translateY(${(progress * depth * 10).toFixed(1)}px)`;
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className={className} data-hero-entrance="5">
      {children}
    </div>
  );
}
