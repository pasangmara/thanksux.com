import type { ReactNode } from "react";

/**
 * Homepage Hero entrance — thin wrapper around the Hero's text column.
 * The actual sequencing (eyebrow -> headline -> description -> CTA row,
 * each 90ms apart) is pure CSS (`src/styles/motion.css`'s
 * `[data-hero-entrance="N"]` rules), scoped to the shared `.hero-entrance`
 * class on Hero.tsx's outer grid container — this component exists only so
 * that wiring reads as intentional at the call site, not to add any client
 * behavior (plays on load, not on scroll, so no IntersectionObserver is
 * needed the way `ScrollReveal` needs one).
 */
export function HeroEntrance({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
