import { Container } from "@/components/ui";
import { accentLastWord } from "@/lib/text/accentLastWord";

/**
 * Work page hero — editorial label + page title, per the Work-page brief
 * §01, extended (§14 of the masonry brief) with the site's established
 * accent-word treatment on the headline's trailing word — the same
 * `accentLastWord()` mechanism Hero.tsx/WorkHero's own copy already keeps
 * unedited otherwise. Uses `text-h1`, not `text-display` — DESIGN_SYSTEM.md
 * §2's heading usage table reserves `text-display` for the Home hero only,
 * and states `text-h1` for exactly this case ("Page title: Work, About,
 * Contact..."). Deliberately short — no numbered SectionHeader treatment
 * (this isn't one of the homepage's numbered content sections), no
 * oversized display type.
 */
export function WorkHero() {
  return (
    <section className="border-b border-border py-8 tablet:py-12">
      <Container variant="wide">
        <p className="text-label">Selected Work</p>
        <h1 className="text-h1 mt-4 max-w-[24ch]">
          {accentLastWord("Selected work across identity, graphic design and digital experiences.")}
        </h1>
        <p className="text-body-lg mt-4 max-w-[60ch] text-text-secondary">
          A curated look at brand identity and product design work — systems built to hold
          up past the first version, not just final screens.
        </p>
      </Container>
    </section>
  );
}
