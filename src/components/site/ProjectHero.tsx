import { Button, Container } from "@/components/ui";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import { ASPECT } from "@/content/media";
import { ScrollReveal } from "./ScrollReveal";
// Imported from the standalone flag module, not "@/content/projects" —
// this component is also rendered from the admin preview page (a "use
// client" route), which bundles it for the browser; content/projects.ts
// now transitively imports the server-only (Node fs) project repository,
// which can't be bundled client-side. See src/content/demoDataFlag.ts.
import { usingDemoData } from "@/content/demoDataFlag";
import type { Project } from "@/types/project";
import { PortfolioMedia } from "./PortfolioMedia";

/**
 * Project Hero — brief §01: category, title, short description, year,
 * client, role, tools, services, and a dominant cover image. The full
 * metadata grid (Client/Year/Role/Services/Tools) lives in the separate
 * Overview section right below — this hero keeps its own meta line brief
 * (category · type · year) so the two sections don't just repeat each
 * other.
 *
 * "Sample project" marker — same honesty pattern as the homepage's Case
 * Study Preview: `usingDemoData` is true while the site runs on
 * demo-projects.ts, so no visitor mistakes placeholder content for real
 * client work.
 *
 * [CMS Phase D3 follow-up] `project.projectUrl` (editable in the admin's
 * Basic Information section) previously had no public rendering anywhere
 * — a real gap flagged in docs/PORTFOLIO_CMS_ARCHITECTURE.md §13. Rendered
 * here as a "Visit live site" text-link, only when a value is actually set.
 */
export function ProjectHero({ project }: { project: Project }) {
  return (
    <section className="border-b border-border py-8 tablet:py-12">
      <Container variant="wide">
        <Button variant="text-link" href="/work">
          ← Back to all work
        </Button>

        <ScrollReveal variant="blur">
          <p className="text-label mt-6">
            {project.category} · {project.projectType} · {project.year}
            {usingDemoData ? " · Sample project" : ""}
          </p>
          <h1 className="text-h1 mt-4 max-w-[28ch]">{project.title}</h1>
          <p className="text-body-lg mt-4 max-w-[60ch] text-text-secondary">
            {project.description ?? project.shortDescription}
          </p>
          {project.projectUrl ? (
            <div className="mt-4">
              <TrackedCTA
                variant="text-link"
                href={project.projectUrl}
                target="_blank"
                rel="noreferrer"
                ctaType="external"
                location="project_hero"
                eventName="click_external_link"
                eventParams={{ project_slug: project.slug }}
              >
                Visit live site ↗
              </TrackedCTA>
            </div>
          ) : null}
        </ScrollReveal>
      </Container>

      <div className="mt-8">
        <Container variant="wide">
          <ScrollReveal variant="scale">
            <PortfolioMedia
              media={project.coverImage}
              aspectRatio={ASPECT.spotlight}
              radius="lg"
              priority
              // Renders at close to the full 1280px container width, not
              // PortfolioMedia's default ~33vw grid-tile assumption —
              // docs/IMAGE_PIPELINE_AUDIT.md §2.3.
              sizes="(min-width: 1200px) 1280px, 100vw"
            />
          </ScrollReveal>
        </Container>
      </div>
    </section>
  );
}
