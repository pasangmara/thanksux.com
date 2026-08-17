import type { ReactNode } from "react";

/**
 * [Visual Refinement Pass II] Reusable headline-emphasis primitive —
 * "important words in a headline use the theme accent" (spec section 2/28),
 * implemented once here rather than ad hoc inline color classes scattered
 * per headline. Deliberately a plain inline span, not a gradient-text
 * effect: gradient text on small/medium headings frequently fails
 * contrast checks and reads as decorative rather than meaningful. A solid
 * color-accent stays legible and deliberate, and reuses the same
 * --color-accent token buttons/links/focus-rings already use rather than
 * a second, competing "highlight color." It also picks up the dark-theme
 * redefinition of that token automatically (see tokens.css's theme
 * block), so no extra dark-mode handling is needed here.
 *
 * Contrast constraint, inherited from docs/DESIGN_SYSTEM.md's color
 * section: color-accent on color-background measures roughly 3.4:1 in
 * light mode -- clears WCAG AA's 3:1 large-text threshold but not the
 * 4.5:1 normal-text one. This component is therefore only for
 * headline-scale text (text-display / text-h1 / text-h2 / text-h3, all
 * comfortably >=24px) -- never wrap text-body / text-body-lg / text-caption
 * text in it.
 *
 * Emphasis is visual only, never the sole carrier of meaning -- the
 * emphasized word stays in the same sentence, same reading order, same
 * semantic markup as the rest of the heading.
 */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>;
}
