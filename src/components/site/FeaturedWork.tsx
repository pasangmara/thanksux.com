import { Button, Container } from "@/components/ui";
import { getFeaturedProjects } from "@/content/projects";
import { ProjectCard } from "./ProjectCard";
import { ProjectGrid } from "./ProjectGrid";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * Featured Work — homepage polish brief §03: stronger hierarchy between
 * the primary project and the rest, so the section doesn't read as one
 * uniform grid of identical cards. The lead project (featuredOrder: 1)
 * gets the wide/primary ProjectCard treatment; the remaining featured
 * projects sit in the standard 3-col grid beneath it.
 */
export async function FeaturedWork() {
  const [primary, ...secondary] = await getFeaturedProjects();

  return (
    <section id="featured-work" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader
            title="Featured Work"
            description="A curated set, mixing brand and product work — not everything ever made, the strongest of it."
          />
        </ScrollReveal>

        {primary ? (
          <ScrollReveal className="mt-8" variant="scale">
            <ProjectCard project={primary} variant="primary" />
          </ScrollReveal>
        ) : null}

        {secondary.length > 0 ? (
          <ScrollReveal variant="scale">
            <ProjectGrid projects={secondary} />
          </ScrollReveal>
        ) : null}

        <div className="mt-8">
          <Button variant="text-link" href="/work">
            View all work
          </Button>
        </div>
      </Container>
    </section>
  );
}
