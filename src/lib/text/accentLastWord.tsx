import { Accent } from "@/components/ui/Accent";
import type { ReactNode } from "react";

/**
 * [Visual Refinement Pass II] Splits admin-editable headline copy into
 * "everything but the final word" + "final word," wrapping only the final
 * word in `<Accent>`. This is the deterministic, content-preserving
 * "reusable pattern for emphasized words" the spec asks for (section 2):
 * since headline text comes from the CMS (`HeroContent.headline`, etc.),
 * this repo has no reliable way to know *which* word an admin considers
 * meaningful without a new CMS field (out of scope for a visual-only
 * pass) -- "accent the final word" is a real, consistent, non-random rule
 * applied identically everywhere, matching the brief's own example
 * ("...people say THANKS" -- THANKS is the final word).
 *
 * Deliberately used sparingly at call sites (a handful of hero-level
 * headlines), never wired into every `SectionHeader` -- accenting every
 * heading sitewide would be exactly the "color scheme, not a signal"
 * docs/DESIGN_SYSTEM.md's Principle 2 already warns against.
 *
 * Splits on the last run of whitespace so multi-line/wrapped headlines
 * still accent only the true final word, not a trailing punctuation-only
 * fragment. Text with no whitespace (a single word) accents the whole
 * string. Trailing punctuation stays attached to the accented word (e.g.
 * "brand." keeps its period) so the accent doesn't visually clip it.
 */
export function accentLastWord(text: string): ReactNode {
  const trimmed = text.trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return <Accent>{trimmed}</Accent>;

  const lead = trimmed.slice(0, lastSpace + 1);
  const finalWord = trimmed.slice(lastSpace + 1);
  return (
    <>
      {lead}
      <Accent>{finalWord}</Accent>
    </>
  );
}
