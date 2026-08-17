import { listAllProjects } from "@/lib/cms/projectsRepository";
import type { Project, ProjectCategory } from "@/types/project";

export { usingDemoData } from "./demoDataFlag";

/**
 * [CMS Phase D2] The one seam every public component reads through —
 * unchanged in spirit from every earlier phase, but now backed by the
 * real, persisted project store (`data/projects.json`, via
 * `src/lib/cms/projectsRepository.ts`) instead of a compile-time
 * `real-projects.ts` import. `real-projects.ts` still exists and is still
 * where Gridmark's real content is written — it's read exactly once, to
 * seed the JSON store the first time it's ever accessed (see
 * `projectsRepository.ts`'s header comment) — but after that, this file
 * reads the live store, so an admin save is what these functions return
 * on the very next request. No component outside this file's own
 * previous version imported `real-projects.ts` directly; that's still
 * true here.
 *
 * Every export below is now an `async function` rather than a
 * precomputed constant. This is a real, necessary consequence of real
 * persistence, not a stylistic choice: a plain `export const x = …`
 * would only ever be evaluated once (at module load), so it could never
 * reflect a save made after the server started. Reading the store inside
 * a function that's called per-request is what makes "admin edit → save
 * → public page updates on next load" actually true. Every consuming
 * component (`src/components/site/**`, `src/app/work/**`) is an `async`
 * Server Component now for the same reason — see each file's own diff.
 */

export async function getProjects(): Promise<Project[]> {
  const all = await listAllProjects();
  // AdminProject (the repository's stored shape) is a structural superset
  // of Project — same relationship already relied on elsewhere (e.g. the
  // admin preview route passing AdminProject into public components
  // directly) — so this is a narrowing view, not a data transformation.
  return all as unknown as Project[];
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects
    .filter((p) => p.featured && p.published)
    .sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0));
}

export async function getPublishedProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
}

export async function getProjectsByCategory(category: ProjectCategory): Promise<Project[]> {
  const published = await getPublishedProjects();
  return published.filter((p) => p.category === category);
}

/**
 * The single project shown in the Case Study Preview spotlight: the
 * highest-priority featured project that actually has case-study content
 * worth spotlighting (an `overview` written), rather than an implicit
 * "just take the first one."
 */
export async function getCaseStudyPreviewProject(): Promise<Project | undefined> {
  const featured = await getFeaturedProjects();
  return featured.find((p) => p.caseStudy.overview);
}
