import { Container } from "@/components/ui";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { getHomepageContent } from "@/lib/cms/siteContentRepository";
import { Animated } from "./Animated";
import { HomepageCardBody } from "./HomepageCardBody";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * [Homepage CMS — Services/Design Process] Reads `HomepageContent.services`
 * (data/homepage.json, edited at /admin/homepage §5) instead of the
 * hardcoded `services` array previously imported from `src/content/site.ts`
 * — that constant now only seeds the CMS record once (see
 * `siteContentRepository.ts`'s `seedHomepageContent`), it's never read here
 * directly. Filtered to `visible`, sorted by `order`, same convention as
 * `HeroContent.visuals`. Renders nothing if every card is hidden/removed —
 * same "don't show an empty section" rule used everywhere else on this
 * site, rather than a permanently-present header over a blank grid.
 */
export async function Services() {
  const { services } = await getHomepageContent();
  const cards = [...services].filter((s) => s.visible).sort((a, b) => a.order - b.order);
  if (cards.length === 0) return null;

  return (
    <section id="services" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader title="Services" />
        </ScrollReveal>
        <ScrollReveal variant="blur">
          <div className="mt-8 grid grid-cols-1 gap-8 tablet:grid-cols-3 tablet:gap-6">
            {cards.map((service, i) => {
              const inner = (
                <Animated config={service.animation} index={i}>
                  <HomepageCardBody card={service} />
                </Animated>
              );
              return service.url ? (
                <TrackedLink
                  key={service.id}
                  href={service.url}
                  className="border-t border-border pt-4 transition-colors duration-150 ease-out hover:border-accent"
                  ctaType="service"
                  location="services"
                  eventParams={{ cta_name: service.title }}
                >
                  {inner}
                </TrackedLink>
              ) : (
                <div key={service.id} className="border-t border-border pt-4">
                  {inner}
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
