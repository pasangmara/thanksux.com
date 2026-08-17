import type { ReactNode } from "react";

/**
 * Static tag/chip — visually the "inactive" state of the Filter Chip spec
 * (docs/DESIGN_SYSTEM.md v2 §11): transparent fill, text-label styling,
 * 1px color-border, radius-sm (a "small UI element" per the visual-
 * refinement pass). Reused here for non-interactive skill/tool tags
 * rather than inventing a separate tag component; becomes the literal
 * interactive Filter Chip once the Work page's filtering is built.
 */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="text-label inline-flex h-[36px] items-center rounded-sm border border-border px-2">
      {children}
    </span>
  );
}
