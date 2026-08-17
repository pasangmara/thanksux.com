import type { AdminMedia, AdminMediaSection, AdminProject } from "./types";
import type { FlatGalleryItem } from "@/components/admin/media";

/**
 * Flattens every image array on a project (the general gallery plus every
 * case-study stage array) into one flat, section-tagged list for the
 * unified Media/Gallery admin UI, and back again on save. Keeps the real
 * nested Project/CaseStudy shape as the source of truth — this is purely
 * a UI convenience, not a storage format change.
 */

const ARRAY_SECTIONS: AdminMediaSection[] = [
  "gallery",
  "wireframes",
  "finalDesign",
  "moodboard",
  "logo",
  "applications",
  "exploration",
  "brandGuidelines",
];

function sectionArray(project: AdminProject, section: AdminMediaSection): AdminMedia[] | undefined {
  if (section === "gallery") return project.gallery;
  return project.caseStudy[section as Exclude<AdminMediaSection, "gallery" | "cover" | "thumbnail">];
}

export function flattenGallery(project: AdminProject): FlatGalleryItem[] {
  const out: FlatGalleryItem[] = [];
  let counter = 0;
  for (const section of ARRAY_SECTIONS) {
    const arr = sectionArray(project, section) ?? [];
    arr.forEach((media, i) => {
      out.push({ key: `${section}-${counter++}`, section, media: { ...media, order: media.order ?? i } });
    });
  }
  return out;
}

export function applyFlatGallery(project: AdminProject, items: FlatGalleryItem[]): AdminProject {
  const bySection = (section: AdminMediaSection) =>
    items.filter((i) => i.section === section).map((i) => i.media);

  return {
    ...project,
    gallery: bySection("gallery"),
    caseStudy: {
      ...project.caseStudy,
      wireframes: bySection("wireframes"),
      finalDesign: bySection("finalDesign"),
      moodboard: bySection("moodboard"),
      logo: bySection("logo"),
      applications: bySection("applications"),
      exploration: bySection("exploration"),
      brandGuidelines: bySection("brandGuidelines"),
    },
  };
}
