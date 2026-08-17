/**
 * Shared smooth-scroll-to-top action — extracted from `BackToTopButton`
 * (the floating corner control) so the footer's own "Back to top" link
 * calls the exact same behavior instead of a second implementation.
 * Respects `prefers-reduced-motion`, unchanged from the original inline
 * version.
 */
export function scrollToTop(): void {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}
