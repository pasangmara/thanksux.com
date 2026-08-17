import type { Metadata } from "next";
import { CategoryFilter, isCategoryFilterValue } from "@/components/site/CategoryFilter";
import { WorkGrid } from "@/components/site/WorkGrid";
import { WorkHero } from "@/components/site/WorkHero";
import { getPublishedProjects } from "@/content/projects";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";
import type { CategoryFilterValue } from "@/components/site/CategoryFilter";

// [CMS Phase D2] Explicit, not just implied by `searchParams` — this route
// must read the live persisted project store per request, never a cached
// snapshot, for admin edits to actually show up.
//
// [Temporary GitHub Pages deployment] CI patches this literal to
// "force-static" for the export build only — see .github/workflows/ci.yml's
// deploy job. Unset/normal builds: unchanged.
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ category?: string }>;

const BASE_DESCRIPTION =
  "Selected work across identity, graphic design, and digital experiences — brand systems, product UI/UX, and research-backed design work.";

function resolveCategory(raw: string | undefined): CategoryFilterValue {
  return isCategoryFilterValue(raw) ? raw : "All";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  // [Temporary GitHub Pages deployment] Reading the `searchParams` prop at
  // all — even via force-static — silently drops this route from the
  // export output entirely (confirmed by an actual export build: /work was
  // simply absent from `out/`, no error). Never touching it when
  // STATIC_EXPORT is set is what makes the route exportable; the exported
  // build always shows the unfiltered "All" category, since a static file
  // can't vary by query string without a server. Unset (the real server
  // build) is byte-for-byte the original behavior.
  const [params, settings] = await Promise.all([
    process.env.STATIC_EXPORT === "1" ? Promise.resolve({ category: undefined }) : searchParams,
    getSiteSettings(),
  ]);
  const category = resolveCategory(params.category);
  // [Brand migration] Was a hardcoded "— Joy" — the product's brand name
  // is now Site Settings' own field (Thanks UX by default; falls back to
  // "Joy Howlader" only if that field is ever cleared), same pattern
  // every other route's metadata title already follows.
  const brand = settings.brandName || "Joy Howlader";
  const title = category === "All" ? `Work — ${brand}` : `${category} Work — ${brand}`;
  const description =
    category === "All" ? BASE_DESCRIPTION : `${category} work: ${BASE_DESCRIPTION}`;

  return {
    title,
    description,
    // Filtered views are the same content re-sliced, not distinct pages —
    // canonical stays on the unfiltered URL so search engines index one
    // authoritative /work page rather than one per category.
    alternates: { canonical: "/work" },
    openGraph: { title, description, type: "website" },
  };
}

export default async function WorkPage({ searchParams }: { searchParams: SearchParams }) {
  // [Temporary GitHub Pages deployment] See generateMetadata's comment above.
  const category = resolveCategory(
    process.env.STATIC_EXPORT === "1" ? undefined : (await searchParams).category,
  );
  const publishedProjects = await getPublishedProjects();
  const projects =
    category === "All" ? publishedProjects : publishedProjects.filter((p) => p.category === category);

  return (
    <main>
      <WorkHero />
      <CategoryFilter active={category} />
      <WorkGrid projects={projects} categoryLabel={category === "All" ? "" : category} />
    </main>
  );
}
