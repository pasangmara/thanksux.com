/**
 * Project content model — extended per the portfolio-content-architecture
 * brief to support the Work page, category showcases, project detail
 * pages, case studies, and (later) the Admin Dashboard from one schema.
 * Field names mostly match that brief's exact list; a few fields carried
 * over from PROJECT_SPEC.md §9 (`constraint`, the branding-specific case
 * study fields) are kept because real content still needs them and
 * nothing in the new brief contradicts having them — noted inline.
 */

import type { AnimationConfig } from "./animation";

/**
 * Canonical, user-facing category system — resolved in the CMS Phase B
 * content-model pass (docs/CMS_CONTENT_MODEL.md §1–2). These 8 values are
 * the single source of truth for "what category can a project be," fed to
 * the public CategoryFilter, the admin category select, and
 * `CATEGORY_CONFIG` (src/types/category-config.ts) alike — nothing else
 * hardcodes a parallel list.
 *
 * Internal value vs. display label: most values double as their own
 * display label (`"Branding"`, `"Web Design"`, …). `"UI/UX"` is the one
 * exception — kept as the existing internal/URL value (so
 * `/work?category=UI%2FUX`, `projectsByCategory("UI/UX")`, and every
 * existing `category: "UI/UX"` project entry keep working unchanged) while
 * its clean user-facing label, `"UI/UX Design"`, lives in
 * `CATEGORY_CONFIG["UI/UX"].displayName` — see category-config.ts.
 */
export type CanonicalProjectCategory =
  | "UI/UX"
  | "UX Research"
  | "Branding"
  | "Graphic Design"
  | "Web Design"
  | "Digital Marketing"
  | "Social Media Design"
  | "Print Design"
  | "Custom";

/**
 * Deprecated, non-canonical category values from an earlier iteration of
 * this schema. Kept in the `ProjectCategory` union purely for backward
 * type-compatibility — no current real or demo project uses any of these
 * (verified by grep across src/content/**), and they are deliberately
 * excluded from `PROJECT_CATEGORIES`/`CATEGORY_CONFIG`, so they never
 * appear as a filter chip or an admin category choice. Do not pick one of
 * these for a new project; use a `CanonicalProjectCategory` value instead.
 * Not removed outright — removing a still-compiling union member is a
 * needless breaking change for zero benefit when nothing references it.
 *
 * [Category promotion] "UX Research" moved OUT of this union and into
 * `CanonicalProjectCategory` above — an explicit, approved decision to
 * reverse its earlier deprecation, not an oversight. It now has a real
 * `CATEGORY_CONFIG` entry (`category-config.ts`) and its own dynamic
 * field set, same as every other canonical category.
 */
export type LegacyProjectCategory = "Editorial" | "Campaign";

export type ProjectCategory = CanonicalProjectCategory | LegacyProjectCategory;

/** Canonical iteration order — the Work page's category filter and the admin category select both read from this rather than hardcoding the list separately. See CanonicalProjectCategory's doc comment for the naming resolution. */
export const PROJECT_CATEGORIES: CanonicalProjectCategory[] = [
  "UI/UX",
  "UX Research",
  "Branding",
  "Graphic Design",
  "Web Design",
  "Digital Marketing",
  "Social Media Design",
  "Print Design",
  "Custom",
];

/**
 * Free-form on purpose ("Project types should be extensible in the
 * future") — a sub-classification within category, e.g. "Mobile App",
 * "Poster Series", "Dashboard". Not a fixed enum.
 */
export type ProjectType = string;

/**
 * Cover/gallery media — DESIGN_SYSTEM.md §7's cover-image methodology
 * note: project imagery is never a raw crop of existing work, it's a
 * custom-composed shot built to fit its frame intentionally.
 *
 * No real project photography exists yet, so `placeholder` renders an
 * honest, clearly-labeled placeholder via <PortfolioMedia> instead of a
 * photo — deliberately NOT styled to look like finished art, so it can
 * never be mistaken for a real portfolio piece. Swapping to `image` (a
 * real uploaded shot) requires no component changes, only a data change.
 *
 * Used everywhere a project has an image — cover, thumbnail, gallery, and
 * every case-study stage's image array — rather than a separate
 * real-image-only type for case-study images, which would have made it
 * impossible to populate wireframes/logo/moodboard/etc. with honest
 * placeholders the way every other image on the site works.
 *
 * `layout` is only read by <CaseStudyGallery> (project detail page §04's
 * data-driven gallery) — it's a hint for how much width a gallery image
 * should claim, not a rendering instruction any single component owns.
 * Ignored everywhere else (cover/thumbnail always render at their own
 * container's full size regardless).
 */
export type GalleryLayout = "full" | "half" | "third";

/**
 * Frame *shape* — independent of `layout` (which only controls how much
 * grid width a gallery tile claims). `landscape`/`portrait`/`square` let a
 * gallery image opt into a frame shape that actually matches its source
 * proportions instead of always inheriting `layout`'s default ratio (e.g.
 * a `layout: "full"` image no longer has to be 16:9 — it can be portrait).
 * Unset means "use `layout`'s existing default," so every image without
 * this field renders exactly as it did before this field existed.
 */
export type MediaAspect = "landscape" | "portrait" | "square";

/**
 * How the image fills its frame. `cover` (fills the frame, crops overflow
 * — the existing sitewide default) or `contain` (shows the whole image,
 * letterboxed on `color-background-alt` — never crops). Unset means
 * "decide automatically": <PortfolioMedia> compares the image's real
 * (loaded) aspect ratio against its frame's and falls back to `contain`
 * only when `cover` would crop a large portion of the source — see
 * PortfolioMedia.tsx. An explicit value here always wins over that
 * auto-detection.
 */
export type MediaFit = "cover" | "contain";

export type CoverMedia =
  | {
      kind: "image";
      src: string;
      alt: string;
      objectPosition?: string;
      layout?: GalleryLayout;
      aspect?: MediaAspect;
      fit?: MediaFit;
      /** [CMS Phase D3] Short, visible caption rendered under the image in `CaseStudyGallery` — distinct from `alt` (screen-reader only). Optional; nothing renders when unset. */
      caption?: string;
      /** [CMS Phase D3] Longer-form description, rendered under `caption` when both are present. */
      description?: string;
    }
  | { kind: "placeholder"; category: MediaCategory; alt: string; layout?: GalleryLayout };

/**
 * Which image array/slot a gallery item belongs to — every existing
 * `CoverMedia[]` location on `Project`/`CaseStudy`, named to match. Used by
 * the admin's flattened gallery UI (`src/lib/admin/gallery.ts`'s
 * `AdminMediaSection`, which this type intentionally mirrors) and by
 * `GalleryItem` below.
 */
export type GallerySection =
  | "cover"
  | "thumbnail"
  | "gallery"
  | "wireframes"
  | "finalDesign"
  | "moodboard"
  | "logo"
  | "applications"
  | "exploration"
  | "brandGuidelines";

/**
 * [CMS Phase B, documentation-level only] The normalized shape
 * docs/CMS_CONTENT_MODEL.md §12 describes for a future flat media
 * library/admin gallery UI — `id`, `image`, `alt`, `caption`, `section`,
 * `layout`, `order`. This is NOT a new storage format: today's real data
 * stays exactly `CoverMedia[]` arrays on `Project`/`CaseStudy`, addressed
 * by which array they're in (their `GallerySection`) — no project's actual
 * gallery data is restructured into this shape as part of this phase. Its
 * purpose is to give Phase C's dynamic admin editor (and any future
 * persistence layer) one typed target shape to render/normalize toward,
 * derivable from existing data with zero information loss: `image`/`alt`
 * already exist on every `CoverMedia`, `caption`/`order` already exist on
 * `AdminMedia` (`src/lib/admin/types.ts`), and `section` already exists as
 * `AdminMediaSection` — this type just names the combined shape once. `id`
 * is the one genuinely new concept (today's admin flatten step synthesizes
 * a non-persisted key instead — see `flattenGallery()` in
 * `src/lib/admin/gallery.ts`).
 */
export interface GalleryItem {
  id: string;
  image: CoverMedia;
  /** Mirrors `image.alt` — included per the normalized spec; not a second source of truth. */
  alt: string;
  caption?: string;
  /** [CMS Phase D1] Longer-form description, distinct from `caption` — mirrors `AdminMedia.description` (src/lib/admin/types.ts). */
  description?: string;
  section: GallerySection;
  layout: GalleryLayout;
  order: number;
}

/**
 * Covers every visual category the portfolio needs across graphic design,
 * branding, and product work: mockups, posters, brochures, logos, UI
 * screens, website screenshots, social media designs, editorial work,
 * packaging, campaign design. `logo`/`brochure` render via the closest
 * existing treatment (brand-mark, editorial) rather than adding
 * near-duplicate categories.
 */
export type MediaCategory =
  | "brand-mark"
  | "ui-screen"
  | "website"
  | "poster"
  | "editorial"
  | "campaign"
  | "social"
  | "packaging"
  | "typography";

/**
 * Structured case-study model. Only `overview` and `outcome` are required
 * — every other field is optional so a simple graphic-design project
 * doesn't need to fake UX-research fields it never had, while a full
 * UI/UX case study can populate the complete research → design → testing
 * arc. There's no `variant` switch — a case-study page renders whichever
 * fields are present, not a fixed per-category template (see
 * ProjectStory.tsx for how the 3 documented story flows — Branding,
 * Graphic Design, UI/UX — map onto this one field set).
 *
 * `[project-detail pass]` Added `typography` and `exploration` — genuinely
 * missing stages named in the Branding and Graphic Design story flows with
 * no existing field to reuse. Removed the field-level `gallery` that
 * duplicated `Project.gallery` (docs/IMPLEMENTATION_PLAN.md-style note:
 * two "gallery" fields on the same entity is exactly the kind of drift
 * this project's docs have flagged before) — the project-level gallery is
 * now the one general/overall gallery; these stage arrays are the
 * story-embedded images for that specific stage.
 */
export interface CaseStudy {
  overview: string;
  outcome: string;

  // Framing
  problem?: string;
  context?: string;
  /** PROJECT_SPEC.md §4.3: every case study should state its constraint near the top — kept from the earlier model, not part of the new brief's list but not contradicted by it either. */
  constraint?: string;
  /** Rendered as "Objective" for Graphic Design projects, "Goals" for UI/UX — same field, category-contextual label (see ProjectStory.tsx). */
  goals?: string[];

  // Research & strategy — full UX case-study support
  research?: string;
  researchMethods?: string[];
  insights?: string;
  userJourney?: string;
  informationArchitecture?: string;

  // Design process
  wireframes?: CoverMedia[];
  /** Rendered as "Brand Strategy" for Branding projects, "Design Direction" otherwise — same field, category-contextual label. */
  designDirection?: string;
  designSystem?: string;
  /** Rendered as "UI" for UI/UX projects, "Final Design" otherwise — the finished screens/artifacts, same field either way. */
  finalDesign?: CoverMedia[];
  testing?: string;

  // Wrap-up
  reflection?: string;

  // Branding / graphic-design-specific extensions. The brief's field list
  // is UX-shaped; real branding and print work needs these too, so they're
  // kept as optional additions rather than dropped. Unused by UI/UX case
  // studies.
  moodboard?: CoverMedia[];
  concept?: string;
  /** Branding story's "Typography" stage. */
  typography?: string;
  colorSystem?: string;
  logo?: CoverMedia[];
  applications?: CoverMedia[];
  /** Graphic Design story's "Exploration" stage — directions considered before the final one. */
  exploration?: CoverMedia[];

  // ---------------------------------------------------------------------
  // [CMS Phase B] Category-schema extensions — docs/CMS_CONTENT_MODEL.md.
  // All optional, all additive: no existing project (Gridmark, any demo
  // project) sets any of these, so nothing below changes what already
  // renders. Each is consumed by one or more of the 8 canonical
  // categories' field schemas in src/types/category-config.ts — see that
  // file for exactly which category uses which field, and under what
  // admin/public label. Several fields here are intentionally *shared*
  // across categories (the same pattern `designDirection`/`finalDesign`
  // already use) rather than each category getting its own near-duplicate
  // field — e.g. `targetAudience` serves Branding, Web Design, Digital
  // Marketing, and Social Media Design alike.
  // ---------------------------------------------------------------------

  /** The core challenge/problem statement being solved — a common field, distinct from `constraint` (a practical limit) and `problem` (UI/UX-flow specific). */
  challenge?: string;

  // UI/UX Design extensions
  /** Persona description — who the research identified as the primary user(s). */
  userPersona?: string;
  /** What's frustrating/blocking users today, ahead of the proposed solution. */
  painPoints?: string;
  /** Link to an interactive prototype (e.g. a Figma prototype URL). Shared with Web Design. */
  prototype?: string;
  /** [Project CMS — Figma] Direct, explicitly-labeled Figma prototype link for UI/UX projects — distinct from `prototype` (a generic "interactive prototype, any tool" field kept for Web Design and any project not built in Figma). Renders publicly as its own clickable link via the same `type: "url"` -> `CaseStudyLinkSection` path every other URL field already uses — no new rendering mechanism. */
  figmaPrototypeUrl?: string;
  /** [Project CMS] Optional link to an external case-study writeup of this project (e.g. a Medium/Behance article), distinct from this project's own `/work/[slug]` detail page. */
  caseStudyUrl?: string;
  /** Narrative of what changed across design iterations. */
  iterations?: string;
  /** Summary of the final solution, distinct from the `finalDesign` screens gallery. */
  finalSolution?: string;

  // Branding extensions
  /** Overall audience the brand/product/campaign targets. Shared across Branding, Web Design, Digital Marketing, Social Media Design. */
  targetAudience?: string;
  /** Market/brand positioning statement. */
  positioning?: string;
  /** The construction logic/geometry behind the logo mark specifically. */
  logoConstruction?: string;
  /** Grid-system reasoning — serves as Branding's "Grid Geometry" and Graphic Design's "Grid" (same underlying concept, category-relabeled). */
  gridGeometry?: string;
  /** Summary of the overall visual identity system. */
  visualIdentity?: string;
  /** Brand guideline spreads/pages, as images — kept distinct from `applications` (real-world use) and `logo` (the mark itself). */
  brandGuidelines?: CoverMedia[];

  // Graphic Design extensions
  /** What the client specifically asked for, distinct from `context` (situational framing). */
  clientRequirement?: string;
  /** The creative direction/approach taken. Shared across Graphic Design, Digital Marketing, Social Media Design. */
  creativeDirection?: string;
  /** Narrative of the design process/steps followed. */
  designProcess?: string;
  /** Layout/composition reasoning. */
  composition?: string;

  // Web Design / Digital Marketing extensions
  /** The business goal this project served — serves as Web Design's "Business Goal" and Digital Marketing's "Business Objective" (shared field, category-relabeled). */
  businessGoal?: string;
  /** UX strategy narrative — Web Design specific. */
  uxStrategy?: string;
  /** Sitemap narrative/structure description. */
  sitemap?: string;
  /** How the design adapts across breakpoints/devices. */
  responsiveStrategy?: string;
  /** Notes on the development/build/handoff process. */
  development?: string;

  // Digital Marketing extensions
  /** The overall marketing strategy narrative. */
  marketingStrategy?: string;
  /** Content strategy narrative — shared with Social Media Design. */
  contentStrategy?: string;
  /** Channels used, e.g. ["Email", "Instagram", "Paid Search"]. Shared with Social Media Design (as `platform`). */
  channels?: string[];
  /** Advertising strategy narrative. */
  adStrategy?: string;
  /** Funnel narrative — awareness → conversion structure. */
  funnel?: string;
  /** The call-to-action used/tested. */
  cta?: string;
  /** Deliverables produced, e.g. ["3 email templates", "Landing page"]. Shared with Social Media Design. */
  deliverables?: string[];
  /**
   * Real, admin-entered performance metrics only — e.g. [{ label: "Open rate", value: "34%" }].
   * NEVER auto-generated or inferred; absent/empty means no metrics were
   * supplied, not "not measured yet." This field exists so a project can
   * add real metrics later without a schema change — it is not populated
   * by anything in this phase.
   */
  metrics?: MetricEntry[];

  // Social Media Design extensions
  /** Platforms this content was designed for, e.g. ["Instagram", "TikTok"]. */
  platform?: string[];
  /** Content format(s), e.g. ["Carousel", "Reel cover", "Story template"]. */
  contentType?: string[];

  // Print Design extensions
  /** The kind of print piece, e.g. "Poster", "Menu", "Packaging". */
  printType?: string;
  /** Physical dimensions, e.g. "18in x 24in". */
  dimensions?: string;
  /** Paper stock, finish, binding, or other print-production specification. */
  printSpecification?: string;
  /** Notes on the print production process itself. */
  production?: string;

  // UX Research extensions — additive, no existing project sets any of
  // these. Several UX Research fields deliberately reuse fields already
  // shared with UI/UX rather than duplicating them under a new name — see
  // category-config.ts's `uxResearchConfig` for exactly which existing
  // field each maps to (e.g. "Research Problem" -> `problem`, "Research
  // Goals" -> `goals`, "Methodology" -> `researchMethods`, "Journey /
  // Experience Map" -> `userJourney`, "Learnings" -> `reflection",
  // "External Research Link" -> `caseStudyUrl`, "Research Artifacts" ->
  // `exploration`).
  /** Distinct from `goals` (what the research set out to answer) — the specific open questions the research was designed to answer. */
  researchQuestions?: string[];
  /** e.g. "Qualitative", "Quantitative", "Mixed-methods" — free text, not an enforced enum. */
  researchType?: string;
  /** Who was studied — count, profile, segment. Never invented; leave blank if not disclosed. */
  participants?: string;
  /** How participants were recruited/sourced. */
  recruitment?: string;
  /** Elaboration on the specific interview/survey/usability-testing protocol used, beyond the `researchMethods` tag list. */
  methodDetails?: string;
  /** What users actually need, distinct from `painPoints` (what's currently frustrating them). */
  userNeeds?: string;
  /** Where the findings point to a real opportunity, distinct from `recommendations` (the concrete proposed action). */
  opportunityAreas?: string;
  /** Concrete, actionable recommendations arising from the research. */
  recommendations?: string;
  /** How the recommendations translate into actual design decisions/direction. */
  designImplications?: string;

  // Custom category — typed, extensible sections rather than an
  // any-based escape hatch. See `CustomSection` below.
  customSections?: CustomSection[];
}

/** A single real, admin-entered performance metric — see `CaseStudy.metrics`. */
export interface MetricEntry {
  label: string;
  value: string;
}

/** One item within a `CustomSection`'s optional repeatable list — see `CustomSection.items`. */
export interface CustomSectionItem {
  id: string;
  label: string;
  text?: string;
}

/**
 * One flexible, typed section for the Custom category — lets a one-off
 * project define its own narrative sections beyond the fixed per-category
 * schema, without resorting to `any`.
 *
 * [CMS Phase D1] `description`/`image`/`items`/`order` added — all
 * optional, additive (no real Custom project exists yet, confirmed by
 * grep across src/content/**, so nothing is broken by extending this
 * shape). `type` is now optional rather than required: Phase B's original
 * design used it to strictly discriminate "this section is either text or
 * a gallery," but a real flexible section reasonably wants a title,
 * short description, body text, a single header image, AND a gallery
 * together rather than choosing exactly one — `type` is kept as an
 * advisory hint (which content is primary) rather than an enforced
 * either/or, since removing it outright would be a real breaking change
 * for zero benefit.
 */
export interface CustomSection {
  id: string;
  /** Section title. */
  label: string;
  /** Short one-line description shown under the title. */
  description?: string;
  /** Advisory hint for which of `text`/`images` is this section's primary content — not enforced. */
  type?: "text" | "gallery";
  /** Body/content. */
  text?: string;
  /** Optional single header/illustrative image, distinct from the `images` gallery below. */
  image?: CoverMedia;
  /** Optional image gallery for this section. */
  images?: CoverMedia[];
  /** Optional repeatable sub-items — e.g. a list of highlights within this section. */
  items?: CustomSectionItem[];
  /** Explicit sort key among a project's custom sections — mirrors `GalleryItem.order`'s pattern (§12); falls back to array position when unset. */
  order?: number;
  /** [Behance-style flexibility] Off = kept in the admin, not shown publicly — same "visible" convention as `HeroVisual`/`HomepageCard`. Unset means visible, so every section saved before this field existed keeps rendering unchanged. */
  visible?: boolean;
  /** [Phase J] Per-section entrance animation — unset means the site's existing default reveal behavior. */
  animation?: AnimationConfig;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  category: ProjectCategory;
  projectType: ProjectType;
  year: number;
  client?: string;
  role: string;
  /** 1-line, used on cards. */
  shortDescription: string;
  /** Longer overview for detail pages — optional, falls back to shortDescription where not yet written. */
  description?: string;
  coverImage: CoverMedia;
  /** Optimized for small grid cards; falls back to coverImage where not provided. */
  thumbnail?: CoverMedia;
  gallery: CoverMedia[];
  featured: boolean;
  featuredOrder?: number;
  published: boolean;
  tags: string[];
  tools: string[];
  /** Which of the site's service offerings this project falls under, e.g. ["Brand Identity & Systems"]. */
  services: string[];
  /** Live URL to the shipped product/site, if one exists. */
  projectUrl?: string;
  caseStudy: CaseStudy;
  /** General display-order for listings (Work page, category showcases) — distinct from featuredOrder, which only applies within the featured set. */
  order: number;
  /** [CMS Phase D3] Optional SEO overrides — see `SeoMeta` below. Read by `generateMetadata()` in work/[slug]/page.tsx as an override layered on top of the existing title/description derivation, never a replacement for it. */
  seo?: SeoMeta;
}

/**
 * [CMS Phase D3] Relocated here from `src/lib/admin/types.ts` (which now
 * re-exports it for backward compatibility) — this is a CMS-wide concept
 * consumed by public `generateMetadata()` calls (project detail, and now
 * /about, /contact), not an admin-only shape, so it belongs in the public
 * schema file rather than the admin-designated one. Still fully optional
 * everywhere it's used; still prototype-in-spirit (only `Project.seo` is
 * actually read by a route as of this phase — About/Contact's `seo` wiring
 * is added in this same phase, Settings' `seoDefaults` remains unread).
 */
export interface SeoMeta {
  metaTitle?: string;
  metaDescription?: string;
  /** Social-share title — falls back to metaTitle when unset. Kept distinct because OG preview copy and search-result copy often need to differ. */
  ogTitle?: string;
  /** Social-share description — falls back to metaDescription when unset. */
  ogDescription?: string;
  ogImage?: CoverMedia;
  canonicalPath?: string;
  noIndex?: boolean;
}
