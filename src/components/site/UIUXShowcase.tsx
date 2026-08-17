import Link from "next/link";
import { Container } from "@/components/ui";
import { ASPECT } from "@/content/media";
import { getProjectsByCategory } from "@/content/projects";
import type { Project } from "@/types/project";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * UI/UX Showcase — homepage polish brief §05: needs to communicate visual
 * quality AND problem-solving, not just screens. Reuses DESIGN_SYSTEM.md
 * §7's Case-Study Section Card pattern (two-column desktop, alternating
 * sides, stacked image-first on mobile) rather than another project grid
 * — each row pairs the cover image with an explicit Problem → Outcome
 * pair pulled from the same case-study data already on the project.
 */
export async function UIUXShowcase() {
  const projects = await getProjectsByCategory("UI/UX");
  if (projects.length === 0) return null;

  return (
    <section id="ui-ux" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader
            title="UI/UX Showcase"
            description="Product and interface work, shown with the problem behind it — not just final screens."
          />
        </ScrollReveal>

        <div className="mt-8 flex flex-col gap-12 tablet:gap-16">
          {projects.map((project, i) => (
            <UIUXRow key={project.slug} project={project} reversed={i % 2 === 1} />
          ))}
        </div>
      </Container>
    </section>
  );
}

function UIUXRow({ project, reversed }: { project: Project; reversed: boolean }) {
  return (
    <ScrollReveal variant={reversed ? "right" : "left"}>
      <Link
        href={`/work/${project.slug}`}
        className="group grid grid-cols-1 items-center gap-6 desktop:grid-cols-12 desktop:gap-10"
      >
        <div className={`desktop:col-span-7 ${reversed ? "desktop:order-2" : ""}`}>
          <PortfolioMedia media={project.coverImage} aspectRatio={ASPECT.wide} radius="lg" />
        </div>
        <div className={`desktop:col-span-5 ${reversed ? "desktop:order-1" : ""}`}>
          <p className="text-label">
            {project.projectType} · {project.year}
          </p>
          <h3 className="text-h3 mt-2">{project.title}</h3>
          <p className="text-body mt-2 text-text-secondary">{project.shortDescription}</p>

          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <div>
              <p className="text-label">Problem</p>
              <p className="text-body mt-1 text-text-secondary">
                {project.caseStudy.problem ?? project.caseStudy.overview}
              </p>
            </div>
            <div>
              <p className="text-label">Outcome</p>
              <p className="text-body mt-1 text-text-secondary">{project.caseStudy.outcome}</p>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
