import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseUpdate, supabaseUpsert } from "@/lib/supabase/rest";
import { resolveMediaAssetId } from "./mediaAssets";
import type { AdminProject } from "@/lib/admin/types";
import type { CoverMedia } from "@/types/project";

/**
 * [Phase 4B — write path] Forward-maps AdminProject -> the normalized
 * Phase 2/3 schema — the inverse of mapProject.ts's read reconstruction.
 *
 * Identity: AdminProject.id never changes after creation, and (per
 * mapProject.ts's read side) always reflects the project's *current* slug
 * as of the last successful read — so it's used here to find the existing
 * row even across a rename, by looking it up as a slug first. If found,
 * the row is updated by its real uuid (so its slug can safely change to
 * `project.slug`); if not found, it's a first-ever save and gets inserted.
 * Known limitation: two slug renames saved back-to-back without an
 * intervening reload could miss the row this way — not a concern for any
 * current project (none has ever been renamed), flagged for a future pass
 * if slug-renaming becomes a real workflow (fix: persist the real Supabase
 * uuid on AdminProject instead of re-deriving identity from the slug).
 *
 * Children (gallery_items/custom_sections) are always fully replaced
 * (delete-then-recreate) from the current AdminProject state — mirrors the
 * JSON backend's own "a save overwrites the complete stored record"
 * semantics exactly, so there's no diff logic to keep in sync with the
 * read path and no risk of an orphaned row from a removed gallery item.
 */

const STAGE_SECTIONS = [
  "wireframes",
  "finalDesign",
  "moodboard",
  "logo",
  "applications",
  "exploration",
  "brandGuidelines",
] as const;

function mediaFields(item: CoverMedia) {
  if (item.kind !== "image") {
    return { alt: "", caption: null, description: null, aspect: null, fit: null, object_position: null };
  }
  return {
    alt: item.alt,
    caption: item.caption ?? null,
    description: item.description ?? null,
    aspect: item.aspect ?? null,
    fit: item.fit ?? null,
    object_position: item.objectPosition ?? null,
  };
}

/**
 * Throws if `project.slug` is already used by a *different* project — same
 * protection as the JSON backend's saveProjectRecord() (see that
 * function's own comment: two projects sharing a slug would silently make
 * one permanently unreachable at /work/[slug]).
 */
export async function checkSlugConflict(project: AdminProject): Promise<void> {
  const existing = await supabaseSelect<{ id: string; slug: string; title: string }[]>(
    "projects",
    `select=id,slug,title&slug=eq.${encodeURIComponent(project.slug)}&limit=1`,
  );
  if (!existing[0]) return;
  const self = await supabaseSelect<{ id: string }[]>(
    "projects",
    `select=id&slug=eq.${encodeURIComponent(project.id)}&limit=1`,
  );
  if (self[0]?.id !== existing[0].id) {
    throw new Error(`Slug "${project.slug}" is already used by another project ("${existing[0].title}"). Choose a different slug.`);
  }
}

export async function saveProjectToSupabase(project: AdminProject): Promise<void> {
  const coverImageId = await resolveMediaAssetId(project.coverImage);
  const thumbnailId = project.thumbnail ? await resolveMediaAssetId(project.thumbnail) : null;

  const { overview, outcome, customSections = [], ...rest } = project.caseStudy;
  const caseStudyJsonb: Record<string, unknown> = { ...rest };
  for (const section of STAGE_SECTIONS) delete caseStudyJsonb[section];

  const projectRow = {
    slug: project.slug,
    title: project.title,
    category: project.category,
    project_type: project.projectType,
    year: project.year,
    client: project.client ?? null,
    role: project.role,
    short_description: project.shortDescription,
    description: project.description ?? null,
    cover_image_id: coverImageId,
    cover_image_alt: project.coverImage.kind === "image" ? project.coverImage.alt : null,
    thumbnail_id: thumbnailId,
    thumbnail_alt: project.thumbnail?.kind === "image" ? project.thumbnail.alt : null,
    featured: project.featured,
    featured_order: project.featuredOrder ?? null,
    published: project.published,
    tags: project.tags,
    tools: project.tools,
    services: project.services,
    project_url: project.projectUrl ?? null,
    order: project.order,
    seo: project.seo ?? null,
    case_study_overview: overview,
    case_study_outcome: outcome,
    case_study: caseStudyJsonb,
  };

  // Resolve identity by the app's stable id (see this file's header
  // comment) so a slug rename updates the existing row instead of leaving
  // it orphaned and inserting a duplicate.
  const existingBySelf = await supabaseSelect<{ id: string }[]>(
    "projects",
    `select=id&slug=eq.${encodeURIComponent(project.id)}&limit=1`,
  );
  let projectId: string;
  if (existingBySelf[0]) {
    const [updated] = await supabaseUpdate<{ id: string }[]>("projects", `id=eq.${existingBySelf[0].id}`, projectRow);
    projectId = updated.id;
  } else {
    const [inserted] = await supabaseUpsert<{ id: string }[]>("projects", projectRow, "slug");
    projectId = inserted.id;
  }

  // Replace-all: safe and simple, matches JSON-save semantics exactly.
  await supabaseDelete("gallery_items", `project_id=eq.${projectId}`);
  await supabaseDelete("custom_sections", `project_id=eq.${projectId}`);

  const galleryRows: object[] = [];
  const sectionsWithArrays: Record<string, CoverMedia[] | undefined> = {
    gallery: project.gallery,
    ...Object.fromEntries(STAGE_SECTIONS.map((s) => [s, project.caseStudy[s]])),
  };
  for (const [section, items] of Object.entries(sectionsWithArrays)) {
    for (const [i, item] of (items ?? []).entries()) {
      const mediaId = await resolveMediaAssetId(item);
      galleryRows.push({
        project_id: projectId,
        section,
        media_asset_id: mediaId,
        layout: item.layout ?? "half",
        order: i,
        ...mediaFields(item),
      });
    }
  }
  if (galleryRows.length > 0) await supabaseInsert("gallery_items", galleryRows);

  const sectionRows: object[] = [];
  for (const [i, s] of customSections.entries()) {
    const imageId = s.image ? await resolveMediaAssetId(s.image) : null;
    sectionRows.push({
      project_id: projectId,
      label: s.label,
      description: s.description ?? null,
      type: s.type ?? null,
      text: s.text ?? null,
      image_id: imageId,
      images: s.images ?? null,
      items: s.items ?? null,
      order: s.order ?? i,
      visible: s.visible ?? true,
      animation: s.animation ?? null,
    });
  }
  if (sectionRows.length > 0) await supabaseInsert("custom_sections", sectionRows);
}

/** ON DELETE CASCADE (Phase 3B schema) removes gallery_items/custom_sections automatically — no manual child cleanup needed. */
export async function deleteProjectFromSupabase(slug: string): Promise<void> {
  await supabaseDelete("projects", `slug=eq.${encodeURIComponent(slug)}`);
}
