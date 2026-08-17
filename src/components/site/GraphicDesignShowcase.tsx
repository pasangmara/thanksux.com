import { Container } from "@/components/ui";
import { ASPECT } from "@/content/media";
import { getProjectsByCategory } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * Graphic Design Showcase — homepage polish brief §04: an editorial,
 * asymmetric layout rather than a repeat of Featured Work's grid. One
 * portrait-oriented lead piece in a wider column, the rest stacked
 * narrower beside it — closer to how print/branding work is actually laid
 * out in a portfolio than a uniform photo grid.
 */
export async function GraphicDesignShowcase() {
  const projects = await getProjectsByCategory("Graphic Design");
  if (projects.length === 0) return null;

  const [lead, ...rest] = projects;

  return (
    <section id="graphic-design" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader
            title="Graphic Design Showcase"
            description="Brand systems, print, and editorial work — grouped by project, not by asset type."
          />
        </ScrollReveal>
        <ScrollReveal variant="left">
          <div className="mt-8 grid grid-cols-1 gap-8 desktop:grid-cols-12 desktop:gap-6">
            <div className="desktop:col-span-7">
              <ProjectCard project={lead} aspectRatio={ASPECT.tall} radius="lg" />
            </div>
            {rest.length > 0 ? (
              <div className="flex flex-col gap-8 desktop:col-span-5 desktop:gap-6">
                {rest.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </div>
            ) : null}
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
