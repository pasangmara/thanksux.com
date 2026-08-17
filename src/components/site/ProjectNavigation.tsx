import Link from "next/link";
import { Container } from "@/components/ui";
import { getPublishedProjects } from "@/content/projects";

/**
 * Previous/Next project navigation — brief §08. Uses the existing
 * `order` field via `publishedProjects` (already sorted by it) rather
 * than any page-local ordering. Wraps at both ends (last project's
 * "next" is the first project, and vice versa) so there's always
 * somewhere to go next, which is the more useful behavior for a
 * portfolio than a dead end on the last project.
 *
 * Hover uses an underline color shift (`border-accent`, non-text UI),
 * not `text-accent` — DESIGN_SYSTEM.md §1's resolved contrast rule:
 * accent on this background measures ~2.9:1, which fails even the 3:1
 * large-text minimum, so it's never valid as literal text color here
 * regardless of size.
 */
export async function ProjectNavigation({ currentSlug }: { currentSlug: string }) {
  const publishedProjects = await getPublishedProjects();
  if (publishedProjects.length <= 1) return null;

  const index = publishedProjects.findIndex((p) => p.slug === currentSlug);
  if (index === -1) return null;

  const prev = publishedProjects[(index - 1 + publishedProjects.length) % publishedProjects.length];
  const next = publishedProjects[(index + 1) % publishedProjects.length];

  return (
    <nav aria-label="More projects" className="border-t border-border">
      <Container variant="wide">
        <div className="grid grid-cols-1 tablet:grid-cols-2">
          <Link
            href={`/work/${prev.slug}`}
            className="group border-b border-border py-8 focus-visible:shadow-focus focus-visible:outline-none tablet:border-b-0 tablet:border-r tablet:border-border tablet:py-12 tablet:pr-8"
          >
            <p className="text-label">Previous Project</p>
            <p className="text-h3 mt-2 inline-block border-b-2 border-transparent transition-colors duration-150 ease-out group-hover:border-accent">
              {prev.title}
            </p>
          </Link>
          <Link
            href={`/work/${next.slug}`}
            className="group py-8 focus-visible:shadow-focus focus-visible:outline-none tablet:py-12 tablet:pl-8 tablet:text-right"
          >
            <p className="text-label">Next Project</p>
            <p className="text-h3 mt-2 inline-block border-b-2 border-transparent transition-colors duration-150 ease-out group-hover:border-accent">
              {next.title}
            </p>
          </Link>
        </div>
      </Container>
    </nav>
  );
}
