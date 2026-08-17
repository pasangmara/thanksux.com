import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ViewEventTracker } from "@/components/analytics/ViewEventTracker";
import { CaseStudyGallery } from "@/components/site/CaseStudyGallery";
import { ProjectCTA } from "@/components/site/ProjectCTA";
import { ProjectHero } from "@/components/site/ProjectHero";
import { ProjectNavigation } from "@/components/site/ProjectNavigation";
import { ProjectOverview } from "@/components/site/ProjectOverview";
import { ProjectStory } from "@/components/site/ProjectStory";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { getPublishedProjects } from "@/content/projects";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";

/**
 * Project Detail page — the main presentation page for a single project.
 * Composed entirely from src/types/project.ts's existing schema; the
 * adaptive story (ProjectStory) is what makes this feel like a real case
 * study rather than a generic template — different categories render
 * genuinely different sections, and any field with no content is simply
 * absent rather than shown empty.
 *
 * [CMS Phase D2] No longer statically generated — `generateStaticParams`
 * was removed and `dynamic = "force-dynamic"` added below, so this route
 * reads the live persisted project store on every request instead of a
 * build-time snapshot. That's what makes "admin edits Gridmark → saves →
 * /work/gridmark shows the change on the next load" actually true,
 * without a rebuild. The tradeoff (no static pre-rendering for this
 * route) is an explicit, necessary consequence of real persistence, not
 * an oversight.
 */

// [Temporary GitHub Pages deployment] CI patches this literal to
// "force-static" for the export build only — see .github/workflows/ci.yml's
// deploy job. Unset/normal builds: unchanged, preserving exactly the
// live-update behavior described above.
export const dynamic = "force-dynamic";

// [Temporary GitHub Pages deployment] Only reached when the export build's
// "force-static" patch is applied — enumerates every currently-published
// project so each gets its own prerendered file. A project published after
// the last deploy has no page until the next rebuild; inherent to a
// build-time snapshot, not a bug.
export async function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== "1") return [];
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

type Params = Promise<{ slug: string }>;

async function getProject(slug: string) {
  const publishedProjects = await getPublishedProjects();
  return publishedProjects.find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([getProject(slug), getSiteSettings()]);
  if (!project) return {};

  // [CMS Phase D3] `project.seo` (admin-editable, src/types/project.ts's
  // `SeoMeta`) is an optional override layered on top of this existing
  // derivation — every fallback below is unchanged when `seo` is unset,
  // so a project with no SEO overrides (e.g. Gridmark, today) renders
  // identically to before this change.
  // [Brand migration] Brand name now sourced from Site Settings — was a
  // hardcoded "— Joy" fallback.
  const seo = project.seo;
  const title = seo?.metaTitle ?? `${project.title} — ${settings.brandName || "Joy Howlader"}`;
  const description = seo?.metaDescription ?? project.description ?? project.shortDescription;
  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;

  const openGraph: NonNullable<Metadata["openGraph"]> = { title: ogTitle, description: ogDescription, type: "article" };
  // Only set an OG image once a real photo exists — pointing it at a
  // placeholder frame would be misleading in a social-share preview.
  if (seo?.ogImage?.kind === "image") {
    openGraph.images = [{ url: seo.ogImage.src, alt: seo.ogImage.alt }];
  } else if (project.coverImage.kind === "image") {
    openGraph.images = [{ url: project.coverImage.src, alt: project.coverImage.alt }];
  }

  return {
    title,
    description,
    alternates: { canonical: seo?.canonicalPath ?? `/work/${project.slug}` },
    openGraph,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <main>
      <ViewEventTracker
        name="view_project"
        params={{
          project_id: project.id,
          project_slug: project.slug,
          project_category: project.category,
          project_year: project.year,
        }}
      />
      <ProjectHero project={project} />
      <ProjectOverview project={project} />
      <ProjectStory project={project} />

      {project.gallery.length > 0 ? (
        <div className="border-t border-border py-8 tablet:py-10">
          <Container variant="wide">
            <ScrollReveal>
              <p className="text-label">Gallery</p>
              <div className="mt-6">
                <CaseStudyGallery images={project.gallery} />
              </div>
            </ScrollReveal>
          </Container>
        </div>
      ) : null}

      <ProjectNavigation currentSlug={project.slug} />
      <ProjectCTA projectSlug={project.slug} />
    </main>
  );
}
