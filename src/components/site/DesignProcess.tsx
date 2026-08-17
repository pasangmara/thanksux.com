import { Container } from "@/components/ui";
import { getHomepageContent } from "@/lib/cms/siteContentRepository";
import { Animated } from "./Animated";
import { HomepageCardBody } from "./HomepageCardBody";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * [Homepage CMS — Services/Design Process] Reads `HomepageContent.process`
 * (data/homepage.json, edited at /admin/homepage §6) instead of the
 * hardcoded `process` array previously imported from `src/content/site.ts`
 * — see Services.tsx's identical header note.
 *
 * [Numbering removed] Each step previously showed a zero-padded "01"/"02"
 * badge above its title — reverted on explicit instruction, same as
 * Services' cards. The list stays a real `<ol>`, so step order is still
 * conveyed structurally/semantically (assistive tech, `::marker` if ever
 * styled) — only the decorative visual counter was removed, no
 * information was actually lost.
 */
export async function DesignProcess() {
  const { process } = await getHomepageContent();
  const steps = [...process].filter((s) => s.visible).sort((a, b) => a.order - b.order);
  if (steps.length === 0) return null;

  return (
    <section id="process" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader
            title="Design Process"
            description="The same four moves, whether the deliverable is a logo system or a product flow."
          />
        </ScrollReveal>
        <ScrollReveal variant="fade">
          <ol className="mt-8 grid grid-cols-1 gap-6 tablet:grid-cols-2 desktop:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.id} className="border-t border-border pt-4">
                <Animated config={step.animation} index={i}>
                  <HomepageCardBody card={step} />
                </Animated>
              </li>
            ))}
          </ol>
        </ScrollReveal>
      </Container>
    </section>
  );
}
