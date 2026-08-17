import type { MediaAspect } from "@/types/project";

/**
 * Shared aspect-ratio constants for portfolio media.
 *
 * Centralized so no section hardcodes its own aspect-ratio value (the
 * homepage polish brief's §02 requirement) — a section picks the named
 * constant that matches its layout role, rather than typing a bracketed
 * ratio inline. Values themselves come from DESIGN_SYSTEM.md §7 (the 4:3
 * card ratio) or from this build's own documented hero/spotlight
 * composition (see docs/HOMEPAGE_SPEC.md §2).
 */
export const ASPECT = {
  /** Standard project card — DESIGN_SYSTEM.md §7. */
  card: "4 / 3",
  /** Tall portrait tile — hero's exhibition tile, showcase editorial layouts. */
  tall: "3 / 4",
  /** Square tile — hero's exhibition tiles. */
  square: "1 / 1",
  /** Wide tile — hero's bottom tile, Featured Work's primary card. */
  wide: "21 / 9",
  /** Case Study Preview's full-bleed spotlight image. */
  spotlight: "21 / 9",
  /** Designer Introduction's profile photo frame. */
  portrait: "4 / 5",
  /** Project detail gallery's full-width tier — gentler than `wide`/`spotlight` (21:9 is a banner ratio; a full-width gallery shot reads better at a standard photographic ratio). */
  galleryFull: "16 / 9",
} as const;

/**
 * [Mobile media adaptation — Featured Work portrait fix] Maps a CMS-tagged
 * image orientation to a concrete frame ratio, for contexts that adapt
 * their frame shape to the actual artwork instead of forcing every image
 * into one fixed shape (see PortfolioMedia.tsx's `mobileAspectRatio` /
 * `autoMobileAspect`). Same three values CaseStudyGallery.tsx's own
 * (separately maintained) ASPECT_FOR_ASPECT already uses for the same
 * three categories — not a new, arbitrary set of ratios.
 */
export const ASPECT_FOR_MEDIA_ASPECT: Record<MediaAspect, string> = {
  portrait: ASPECT.tall,
  landscape: ASPECT.galleryFull,
  square: ASPECT.square,
};
