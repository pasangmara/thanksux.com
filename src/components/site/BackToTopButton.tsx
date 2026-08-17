"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { scrollToTop } from "@/lib/motion/scrollToTop";

const SHOW_AFTER_PX = 450;

/**
 * Global floating "back to top" — mounted once in layout.tsx, not
 * per-page, per the explicit "one reusable component" requirement. Reuses
 * the existing `ArrowRightIcon` rotated -90deg rather than adding a new
 * icon asset — no new dependency, matches "reuse existing icon primitives."
 * Self-hides on /admin (AdminShell is its own separate chrome — same rule
 * SiteNav/SiteFooter already follow, see SiteNav.tsx's own comment on why).
 */
export function BackToTopButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`glass-surface fixed bottom-3 right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full text-ink transition-[opacity,transform,border-color,color] duration-200 ease-out hover:border-accent hover:text-accent focus-visible:shadow-focus focus-visible:outline-none motion-safe:active:scale-[0.95] motion-reduce:transition-none ${
        visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowRightIcon className="h-4 w-4 -rotate-90" />
    </button>
  );
}
