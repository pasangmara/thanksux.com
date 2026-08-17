import { Button, Container } from "@/components/ui";
import { ASPECT } from "@/content/media";
import { getCaseStudyPreviewProject, usingDemoData } from "@/content/projects";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * Case Study Preview — one spotlighted case study, distinct from the
 * Featured Work grid.
 *
 * Previously used DESIGN_SYSTEM.md §4's container-full, edge-to-edge
 * full-bleed treatment. The visual-refinement pass's "intentional
 * presentation frames" direction (§06) is fundamentally at odds with true
 * viewport-edge bleed — a rounded corner sitting at the literal edge of
 * the screen reads as a bug, not a frame — so this is now a large,
 * radius-lg contained frame within the normal wide container instead.
 * container-full is no longer used anywhere on the homepage; still valid
 * for a future page where true bleed genuinely fits the moment.
 *
 * "Sample project" marker — same honesty pattern as ProjectHero.tsx:
 * `usingDemoData` is true while the site runs on demo-projects.ts, so no
 * visitor mistakes placeholder content for a real client claim. Once real
 * data is switched in (`usingDemoData` -> false), the marker disappears on
 * its own — this section then spotlights a real case study without
 * mislabeling it.
 *
 * The project title is `text-h3`, same as a project card — DESIGN_SYSTEM.md
 * §2's "a project card title may never use text-h2" rule applies here too;
 * this is a single project spotlighted in more detail, not a page title.
 */
export async function CaseStudyPreview() {
  const project = await getCaseStudyPreviewProject();
  if (!project) return null;

  return (
    <section id="case-study" className="py-12 tablet:py-16">
      <ScrollReveal variant="scale">
        <Container variant="wide">
          <SectionHeader title="Case Study Preview" />

          <div className="mt-8">
            <PortfolioMedia media={project.coverImage} aspectRatio={ASPECT.spotlight} radius="lg" priority />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 desktop:grid-cols-12">
            <div className="desktop:col-span-7">
              <p className="text-label">
                {project.category}
                {usingDemoData ? " · Sample project" : ""}
              </p>
              <p className="text-h3 mt-2">{project.title}</p>
              <p className="text-body-lg mt-3 max-w-[60ch] text-text-secondary">
                {project.caseStudy.problem ?? project.caseStudy.overview}
              </p>
            </div>
            <div className="desktop:col-span-4 desktop:col-start-9">
              {project.caseStudy.constraint ? (
                <>
                  <p className="text-label">Constraint</p>
                  <p className="text-body mt-2 text-text-secondary">{project.caseStudy.constraint}</p>
                </>
              ) : null}
              <p className="text-label mt-4">Outcome</p>
              <p className="text-body mt-2 text-text-secondary">{project.caseStudy.outcome}</p>
              <div className="mt-4">
                <Button variant="text-link" href={`/work/${project.slug}`}>
                  Read full case study
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </ScrollReveal>
    </section>
  );
}
