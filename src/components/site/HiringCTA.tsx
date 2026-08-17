import { Accent, Container } from "@/components/ui";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import { getHeroContent } from "@/lib/cms/siteContentRepository";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Hiring CTA — reuses the Outcome Summary Block treatment (DESIGN_SYSTEM.md
 * §7: "color-background-alt full-bleed band, text-h2 statement") as a
 * persuasive banner, distinct from the direct-contact-methods section
 * that follows it.
 *
 * [CMS architecture correction] Reuses `HeroContent.secondaryCtaUrl`
 * (/admin/hero) for its own button's target — same relationship the old
 * hardcoded `heroCtas.secondary.href` constant had, just pointed at the
 * new dedicated Hero content source instead of a static file. This
 * button's own label ("Start a project") stays distinct from the Hero's
 * secondary CTA label, unchanged — only the link target is shared.
 */
export async function HiringCTA() {
  const hero = await getHeroContent();

  return (
    <section id="hiring" className="relative overflow-hidden bg-background-alt py-12 tablet:py-16">
      <div className="atmosphere-cta pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container variant="wide" className="relative">
        <ScrollReveal variant="scale">
          <div className="flex flex-col items-start gap-6 desktop:flex-row desktop:items-center desktop:justify-between">
            <p className="text-h2 max-w-[24ch]">
              Let&rsquo;s build something worth putting in a <Accent>case study</Accent>.
            </p>
            <TrackedCTA variant="primary" href={hero.secondaryCtaUrl} ctaType="primary" location="hiring_cta">
              Start a project
            </TrackedCTA>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
