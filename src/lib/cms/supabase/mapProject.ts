import { supabaseSelect } from "@/lib/supabase/rest";
import type { AdminCaseStudy, AdminMedia, AdminProject } from "@/lib/admin/types";
import type { CustomSection, GalleryLayout, MediaAspect, MediaFit, ProjectCategory } from "@/types/project";

/**
 * [Phase 4 — Read-path migration] Reconstructs AdminProject[] (the exact
 * shape projectsRepository.ts's JSON path returns) from the normalized
 * Phase 2/3 Supabase schema — the inverse of
 * scripts/migrate-json-to-supabase.mjs's forward mapping. Read-only: never
 * writes anything back.
 *
 * KNOWN GAP, reported rather than papered over: this schema does not
 * capture a placeholder image's `category` (only real uploads get a
 * media_assets row + this project's alt text — a placeholder cover/
 * gallery/custom-section image has no row to read a category back from).
 * A project whose cover/gallery/custom-section image was a placeholder
 * (not a real upload) reconstructs here as `{ kind: "placeholder",
 * category: "brand-mark", alt }` regardless of its original category. No
 * current project hits this — Gridmark's media are all real uploads,
 * confirmed against data/projects.json before this file was written. This
 * is exactly why Hero visuals (100% placeholders today) are NOT switched
 * to Supabase reads this phase — see siteContentRepository.ts's
 * getHeroContent().
 */

interface MediaAssetRow {
  id: string;
  storage_path: string;
}

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  project_type: string;
  year: number;
  client: string | null;
  role: string;
  short_description: string;
  description: string | null;
  cover_image_id: string | null;
  cover_image_alt: string | null;
  thumbnail_id: string | null;
  thumbnail_alt: string | null;
  featured: boolean;
  featured_order: number | null;
  published: boolean;
  tags: string[];
  tools: string[];
  services: string[];
  project_url: string | null;
  order: number;
  seo: Record<string, unknown> | null;
  case_study_overview: string;
  case_study_outcome: string;
  case_study: Record<string, unknown>;
}

interface GalleryItemRow {
  id: string;
  project_id: string;
  section: string;
  media_asset_id: string | null;
  alt: string;
  caption: string | null;
  description: string | null;
  layout: string;
  aspect: string | null;
  fit: string | null;
  object_position: string | null;
  order: number;
}

interface CustomSectionRow {
  id: string;
  project_id: string;
  label: string;
  description: string | null;
  type: string | null;
  text: string | null;
  image_id: string | null;
  images: unknown;
  items: unknown;
  order: number;
  visible: boolean;
  animation: unknown;
}

const STAGE_SECTIONS = [
  "wireframes",
  "finalDesign",
  "moodboard",
  "logo",
  "applications",
  "exploration",
  "brandGuidelines",
] as const;

function toCoverMedia(
  mediaId: string | null,
  mediaById: Map<string, MediaAssetRow>,
  fields: {
    alt: string | null;
    layout?: string | null;
    aspect?: string | null;
    fit?: string | null;
    object_position?: string | null;
    caption?: string | null;
    description?: string | null;
  },
): AdminMedia {
  const media = mediaId ? mediaById.get(mediaId) : undefined;
  if (!media) {
    return { kind: "placeholder", category: "brand-mark", alt: fields.alt ?? "" };
  }
  return {
    kind: "image",
    src: media.storage_path,
    alt: fields.alt ?? "",
    ...(fields.layout ? { layout: fields.layout as GalleryLayout } : {}),
    ...(fields.aspect ? { aspect: fields.aspect as MediaAspect } : {}),
    ...(fields.fit ? { fit: fields.fit as MediaFit } : {}),
    ...(fields.object_position ? { objectPosition: fields.object_position } : {}),
    ...(fields.caption ? { caption: fields.caption } : {}),
    ...(fields.description ? { description: fields.description } : {}),
  };
}

export async function fetchAllProjectsFromSupabase(): Promise<AdminProject[]> {
  const [projects, galleryItems, customSections, mediaAssets] = await Promise.all([
    supabaseSelect<ProjectRow[]>("projects", "select=*"),
    supabaseSelect<GalleryItemRow[]>("gallery_items", "select=*&order=order.asc"),
    supabaseSelect<CustomSectionRow[]>("custom_sections", "select=*&order=order.asc"),
    supabaseSelect<MediaAssetRow[]>("media_assets", "select=*"),
  ]);

  const mediaById = new Map(mediaAssets.map((m) => [m.id, m]));

  const galleryByProject = new Map<string, GalleryItemRow[]>();
  for (const g of galleryItems) {
    const list = galleryByProject.get(g.project_id) ?? [];
    list.push(g);
    galleryByProject.set(g.project_id, list);
  }

  const sectionsByProject = new Map<string, CustomSectionRow[]>();
  for (const s of customSections) {
    const list = sectionsByProject.get(s.project_id) ?? [];
    list.push(s);
    sectionsByProject.set(s.project_id, list);
  }

  return projects.map((p): AdminProject => {
    const rowsForProject = galleryByProject.get(p.id) ?? [];
    const gallery = rowsForProject
      .filter((g) => g.section === "gallery")
      .map((g) => toCoverMedia(g.media_asset_id, mediaById, g));

    const stageArrays: Partial<Record<(typeof STAGE_SECTIONS)[number], AdminMedia[]>> = {};
    for (const section of STAGE_SECTIONS) {
      const items = rowsForProject
        .filter((g) => g.section === section)
        .map((g) => toCoverMedia(g.media_asset_id, mediaById, g));
      if (items.length > 0) stageArrays[section] = items;
    }

    const rawSections = sectionsByProject.get(p.id) ?? [];
    const customSectionsOut: CustomSection[] | undefined =
      rawSections.length > 0
        ? rawSections.map(
            (s): CustomSection => ({
              id: s.id,
              label: s.label,
              description: s.description ?? undefined,
              type: (s.type as CustomSection["type"]) ?? undefined,
              text: s.text ?? undefined,
              image: s.image_id ? toCoverMedia(s.image_id, mediaById, { alt: "" }) : undefined,
              images: (s.images as CustomSection["images"]) ?? undefined,
              items: (s.items as CustomSection["items"]) ?? undefined,
              order: s.order,
              visible: s.visible,
              // See mapSiteContent.ts's toCard() for why this needs `?? undefined`
              // rather than a bare cast: Postgres JSONB NULL round-trips as `null`,
              // which Animated.tsx's default parameter does not treat as unset.
              animation: (s.animation as CustomSection["animation"]) ?? undefined,
            }),
          )
        : undefined;

    const caseStudy: AdminCaseStudy = {
      ...(p.case_study as unknown as AdminCaseStudy),
      overview: p.case_study_overview,
      outcome: p.case_study_outcome,
      ...stageArrays,
      customSections: customSectionsOut,
    };

    return {
      id: p.slug,
      title: p.title,
      slug: p.slug,
      category: p.category as ProjectCategory,
      projectType: p.project_type,
      year: p.year,
      client: p.client ?? undefined,
      role: p.role,
      shortDescription: p.short_description,
      description: p.description ?? undefined,
      coverImage: toCoverMedia(p.cover_image_id, mediaById, { alt: p.cover_image_alt }),
      thumbnail: p.thumbnail_id ? toCoverMedia(p.thumbnail_id, mediaById, { alt: p.thumbnail_alt }) : undefined,
      gallery,
      featured: p.featured,
      featuredOrder: p.featured_order ?? undefined,
      published: p.published,
      tags: p.tags,
      tools: p.tools,
      services: p.services,
      projectUrl: p.project_url ?? undefined,
      order: p.order,
      seo: (p.seo as AdminProject["seo"]) ?? undefined,
      caseStudy,
    };
  });
}
