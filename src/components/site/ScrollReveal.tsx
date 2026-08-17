"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Scroll-triggered reveal — docs/DESIGN_SYSTEM.md v2 §13, extended v4 §9
 * with a `variant` prop. Triggers once per element via IntersectionObserver;
 * the CSS in src/styles/motion.css handles both the per-variant hidden
 * state and the reduced-motion fallback, so this component doesn't branch
 * on the media query itself either way.
 *
 * [Motion continuation] `delayMs` staggers a group of siblings revealing
 * together (e.g. a project grid) via `transition-delay` on the same
 * reveal transition already defined in motion.css — no second animation
 * mechanism. Capped by convention at the call site (0/50/100/150ms per
 * docs/DESIGN_SYSTEM.md v2 §13's stagger spec), not enforced here, since a
 * caller may have a different-sized list. Left unset (`undefined`) is a
 * no-op, byte-identical to before this prop existed.
 *
 * [v4] `variant` defaults to `"up"` — the exact original fade+16px-slide
 * behavior, so every existing call site is unchanged unless it opts in to
 * one of the new variants (fade/scale/blur/left/right) added for the
 * homepage's "distinct entrance per section" requirement.
 */
const VARIANT_CLASS = {
  up: "reveal",
  fade: "reveal-fade",
  scale: "reveal-scale",
  blur: "reveal-blur",
  left: "reveal-left",
  right: "reveal-right",
} as const;

export type ScrollRevealVariant = keyof typeof VARIANT_CLASS;

export function ScrollReveal({
  children,
  className = "",
  delayMs,
  variant = "up",
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: ScrollRevealVariant;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${VARIANT_CLASS[variant]} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
