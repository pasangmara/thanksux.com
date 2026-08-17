import { Container } from "@/components/ui";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";

/**
 * Closing CTA — brief §09's exact copy. Reuses the Button system only
 * (primary + text-link, per the approved variants); no new visual
 * treatment introduced.
 *
 * [Phase L — Context-Aware Lead Forms] `projectSlug`, when passed (only
 * `work/[slug]/page.tsx` does), routes "Let's Work Together" to
 * `/contact?project=<slug>` instead of the generic `/#contact` anchor —
 * `/contact` reads that param and attaches the project's id/title/
 * category/URL to the lead form automatically (see that page's own doc
 * comment). Omitting the prop keeps the exact previous link.
 */
export function ProjectCTA({ projectSlug }: { projectSlug?: string } = {}) {
  return (
    <section className="py-12 tablet:py-16">
      <Container variant="wide">
        <div className="flex flex-col items-start gap-6 desktop:flex-row desktop:items-center desktop:justify-between">
          <p className="text-h2 max-w-[24ch]">Have a similar project in mind?</p>
          <div className="flex flex-wrap items-center gap-4">
            <TrackedCTA
              variant="primary"
              href={projectSlug ? `/contact?project=${encodeURIComponent(projectSlug)}` : "/#contact"}
              ctaType="primary"
              location="project_cta"
              eventParams={{ project_slug: projectSlug }}
            >
              Let&rsquo;s Work Together
            </TrackedCTA>
            <TrackedCTA variant="text-link" href="/work" ctaType="secondary" location="project_cta">
              View More Work
            </TrackedCTA>
          </div>
        </div>
      </Container>
    </section>
  );
}
