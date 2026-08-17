import type { CaseStudy, CoverMedia, Project, SeoMeta } from "@/types/project";
import type { SocialIcon } from "@/content/personal";
import type { AnimationConfig } from "@/types/animation";

/** [CMS Phase D3] Re-exported for backward compatibility — every existing `import type { SeoMeta } from "@/lib/admin/types"` keeps working unchanged. Canonical definition now lives in src/types/project.ts (see that file for why). */
export type { SeoMeta };

/**
 * Admin-only content types — Phase 2 (local CMS prototype).
 *
 * These extend the real, production `Project`/`CoverMedia` types from
 * `@/types/project` rather than replacing them. `AdminMedia` adds `caption`
 * and `order` — fields proposed but not yet implemented in
 * docs/PORTFOLIO_CMS_ARCHITECTURE.md §1 — as optional additions, so an
 * `AdminProject` is still structurally a valid `Project` and can be passed
 * directly into the real public components (`ProjectHero`, `ProjectStory`,
 * `CaseStudyGallery`, …) for the admin Preview screen with zero component
 * changes.
 *
 * `seo` is fully new/prototype-only (CMS doc §10) — it is stored here so
 * the admin form has somewhere to save it, but nothing in the public
 * rendering pipeline reads it yet. Wiring it into `generateMetadata()` is
 * explicitly out of scope for this phase (see docs/PORTFOLIO_CMS_ARCHITECTURE.md §10).
 */

export type AdminMediaSection =
  | "cover"
  | "thumbnail"
  | "gallery"
  | "wireframes"
  | "finalDesign"
  | "moodboard"
  | "logo"
  | "applications"
  | "exploration"
  /** [CMS Phase C] Added alongside CaseStudy.brandGuidelines (Phase B) — same override pattern as every other stage array below, so Branding's Brand Guidelines gallery field is actually editable via GalleryManager. */
  | "brandGuidelines";

export type AdminMedia = CoverMedia & {
  /** Explicit sort key within its section — proposed field; today's real schema uses array position instead. */
  order?: number;
};

export interface AdminCaseStudy
  extends Omit<
    CaseStudy,
    "wireframes" | "finalDesign" | "moodboard" | "logo" | "applications" | "exploration" | "brandGuidelines"
  > {
  wireframes?: AdminMedia[];
  finalDesign?: AdminMedia[];
  moodboard?: AdminMedia[];
  logo?: AdminMedia[];
  applications?: AdminMedia[];
  exploration?: AdminMedia[];
  brandGuidelines?: AdminMedia[];
}

export interface AdminProject extends Omit<Project, "coverImage" | "thumbnail" | "gallery" | "caseStudy" | "seo"> {
  coverImage: AdminMedia;
  thumbnail?: AdminMedia;
  gallery: AdminMedia[];
  caseStudy: AdminCaseStudy;
  seo?: SeoMeta;
  /** Set once a project only exists in the local admin overlay (never in real-projects.ts). Informational only. */
  isAdminDraft?: boolean;
}

/** docs/PORTFOLIO_CMS_ARCHITECTURE.md §7 — About content, currently rendered as homepage sections (DesignerIntro + AboutSkills), not a dedicated route. */
export interface AboutContent {
  name: string;
  title: string;
  roles: string[];
  bio: string;
  designPhilosophy: string;
  aboutFacts: string[];
  photo?: AdminMedia;
  location?: string;
  experienceSummary?: string;
  skillsDesign: string[];
  skillsTools: string[];
  resumeUrl?: string;
  seo?: SeoMeta;
}

/** docs/PORTFOLIO_CMS_ARCHITECTURE.md §8 — Contact content, currently rendered by ContactSection.tsx (homepage anchor, not a dedicated route). */
export interface AdminSocialLink {
  label: string;
  value: string;
  href: string;
  icon: SocialIcon;
  priority: "primary" | "secondary" | "passive";
  /** [Icon CMS] Mirrors `SocialLink.customIcon` (src/content/personal.ts) — optional admin-uploaded icon overriding the built-in glyph. */
  customIcon?: IconAsset;
  /** [Social/Account Manager] Mirrors `SocialLink.visible` — off = kept in the admin, not shown publicly. Unset means visible. */
  visible?: boolean;
}

/** [Site Identity / Icon CMS] A small uploaded image asset — logo, brand mark, favicon, or a custom social icon. Deliberately not `AdminMedia`/`CoverMedia`: those model photography with a category-based placeholder state, which doesn't fit a vector brand asset. `src === ""` means "not set." */
export interface IconAsset {
  src: string;
  alt: string;
}

/** [Site Identity] Part H — how the nav/footer render the brand: text only (default, zero visual change until an admin opts in), the logo image alone, or both together. */
export type LogoDisplayMode = "logo-only" | "logo-and-name" | "name-only";

export interface ContactContent {
  heading: string;
  description: string;
  /** Prototype addition — today the form's mailto: recipient is derived from socialLinks' "email" entry instead of a standalone field. */
  email?: string;
  /** Prototype addition — no phone field exists anywhere in the current schema. */
  phone?: string;
  /** Prototype addition — personal.ts has a similar `location` field used for About; this is a separate, contact-specific value. */
  location?: string;
  socialLinks: AdminSocialLink[];
  projectTypes: string[];
  /** "Availability" / response-time line — maps to site.ts's responseTimeLine. */
  responseTimeLine?: string;
  successMessage?: string;
  seo?: SeoMeta;
}

/** docs/PORTFOLIO_CMS_ARCHITECTURE.md — site-wide settings (nav labels, footer, SEO defaults). Sourced from site.ts today. */
export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  positioning: string;
  differentiator: string;
  navLabels: { label: string; href: string }[];
  footerText: string;
  socialLinks: AdminSocialLink[];
  seoDefaults: SeoMeta;

  /**
   * [Site Identity — Part H/I/J] Global brand identity, distinct from
   * About's `name` (the designer's own name, which the site's public brand
   * may deliberately differ from — e.g. About "Joy Howlader," brand
   * "Thanks UX," the actual current values as of the Thanks UX brand
   * migration). Unset/empty means "use About's name," exactly today's
   * behavior — nothing here changes what renders until an admin explicitly
   * sets it. The domain itself is never read as a source for any of this
   * (Part J) — only these fields are.
   */
  brandName?: string;
  /** Wordmark/logo image — SVG, PNG, or WEBP (see /api/admin/icons). Rendered via a plain `<img>`, never next/image (see IconField.tsx). */
  logo?: IconAsset;
  /**
   * [Logo system] Optional compact mark shown in place of `logo` below the
   * 768px breakpoint (SiteNav's mobile header) — a real, consumed variant,
   * distinct from the "Light/Dark Logo" fields floated in an earlier
   * request and deliberately NOT added: this site has no dark-mode
   * implementation anywhere, so a light/dark pair would be unused schema
   * with no rendering consumer. Unset falls back to `logo` at every
   * breakpoint — the exact previous behavior.
   */
  logoMobile?: IconAsset;
  /** Optional compact mark (e.g. a monogram) distinct from the full logo — not currently rendered anywhere on its own; reserved for a future compact placement so it has a real field to save into today rather than being invented later. */
  brandMark?: IconAsset;
  /** Browser tab icon. When unset, Next's default `app/favicon.ico` handling applies unchanged. */
  favicon?: IconAsset;
  /** Defaults to `"name-only"` (see seedSettings()) — the exact current behavior (a plain text wordmark), so this field is additive-only until an admin picks something else. */
  logoDisplayMode: LogoDisplayMode;
  /**
   * [Site Identity — Site URL] The site's real public domain, e.g.
   * "https://joyportfolio.com" — used as `generateMetadata()`'s
   * `metadataBase` (src/app/layout.tsx) so relative OG/canonical URLs
   * resolve to a real domain instead of Next's dev-only
   * "http://localhost:3000" fallback (which is what every route's
   * metadata silently used before this field existed — confirmed via
   * Next's own build-time warning: "metadataBase property in metadata
   * export is not set"). Unset means exactly that previous fallback
   * behavior — this field is optional and additive, not a requirement to
   * configure before the site otherwise works.
   */
  siteUrl?: string;
  /** [Site Identity] Optional override for the footer's brand-row text specifically — unset falls back to `brandName` (or About's name), the exact previous behavior. A real, distinct use case: some sites want a fuller/different name in the footer's brand row than the compact nav wordmark. */
  footerBrandName?: string;
  /**
   * [Admin Dashboard Brand Identity] Logo shown in the admin panel's own
   * sidebar/header (AdminShell.tsx), distinct from `logo` (the public
   * site's nav/footer wordmark) — the admin chrome is deliberately its own
   * separate surface (see AdminShell.tsx's header comment), so it gets its
   * own asset rather than reusing the public logo. Same `IconAsset` shape
   * and same upload/choose-existing/clear `IconField` UI every other brand
   * asset on this page already uses. Unset means "show the existing
   * 'Thanks UX CMS' text label," the exact previous behavior.
   */
  adminLogo?: IconAsset;
}

/**
 * [CMS architecture correction] Homepage Hero content — the actual copy
 * `src/components/site/Hero.tsx` visually renders (headline, supporting
 * description, both CTAs), edited at /admin/hero. Deliberately separate
 * from `SiteSettings`: `positioning`/`siteDescription`/`differentiator`
 * are global identity/footer/SEO fields (Settings' own "Identity" section
 * documents `positioning` as "Shown in the footer, under the site name"),
 * not Hero content — an earlier pass wired the Hero headline to
 * `positioning` directly, which was a semantically incorrect shortcut,
 * not the field's intended purpose. This type gives Hero copy its own
 * real home instead of borrowing a field that belongs to something else.
 */
export interface HeroContent {
  /**
   * Optional override for the eyebrow line above the headline. Left
   * unset by default: the eyebrow already has a correct, legitimate CMS
   * source — `{about.name} — {about.roles.join(" · ")}` from
   * /admin/about's Name/Roles fields — and this field exists only so an
   * admin can deliberately say something different on the homepage
   * specifically, without duplicating About's identity fields as the
   * default behavior.
   */
  eyebrow?: string;
  headline: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  /** [Phase D3.5] Defaults to `true` via seedHero() — hides the button without deleting its label/URL. */
  primaryCtaVisible: boolean;
  /** [Phase D3.5] When true, the primary CTA opens in a new tab (`target="_blank" rel="noreferrer"`). Default unset/false — same tab, unchanged from before this field existed. */
  primaryCtaOpenInNewTab?: boolean;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  secondaryCtaVisible: boolean;
  secondaryCtaOpenInNewTab?: boolean;
  /**
   * [Phase D3.5] Replaces Hero.tsx's previous automatic "top 3 featured
   * projects + 1 fixed typography tile" composition. That system is gone,
   * not merely supplemented — this array is now the Hero visual grid's
   * only data source, so every tile is genuinely admin-controlled
   * (including the one that used to be a permanently-hardcoded
   * "typography specimen" tile). The grid's *layout* (one tall tile, two
   * square tiles, one wide tile, exact same responsive breakpoints) is
   * unchanged — see Hero.tsx — only what fills each of those 4 fixed
   * slots is now data. Sorted by `order`, filtered by `visible`, only the
   * first 4 are rendered (the layout has exactly 4 fixed positions by
   * design — see docs/PROJECT_EDITOR_ARCHITECTURE.md §16 on not turning
   * layout itself into a CMS field). A 5th visible item is stored, not
   * silently deleted, simply not rendered until the layout itself changes.
   */
  visuals: HeroVisual[];
  /** [Phase D3.5] Homepage-specific SEO override — same `SeoMeta` shape and override-over-derivation pattern already used by Project/About/Contact/Settings. Read by src/app/page.tsx's `generateMetadata()`. */
  seo?: SeoMeta;
}

/**
 * [Phase D3.5] One Hero visual tile. `image` is the same `AdminMedia`
 * (CoverMedia + optional order) every other image field on the site
 * already uses — reuses `MediaField` (Choose existing / Upload new /
 * Clear) with zero new media code. No separate top-level `alt` field:
 * `image.alt` is the single source of truth (mirrors how every other
 * `CoverMedia` on the site already carries its own alt text) rather than
 * duplicating it here and risking the two drifting apart.
 */
/**
 * [Homepage CMS — Services/Design Process] One repeatable card, shared
 * shape for both `HomepageContent.services` and `HomepageContent.process`
 * — mirrors `HeroVisual`'s id/order/visible convention exactly. `icon`
 * reuses the same `IconAsset` (Choose existing/Upload SVG-PNG-WEBP/Clear)
 * every other small brand asset field on the site already uses (Logo,
 * Brand Mark, Favicon, a social link's custom icon) — no new icon
 * mechanism. `url` is optional and only exposed in the Services editor
 * (Design Process steps have no requested link field); left on the shared
 * type rather than a second near-duplicate interface so one list-editor
 * component can serve both.
 */
export interface HomepageCard {
  id: string;
  title: string;
  description: string;
  icon?: IconAsset;
  /** [Icon system] Rendered size — unset/`"sm"` matches the exact previous fixed `h-4` size, so nothing changes until an admin picks something else. */
  iconSize?: "sm" | "md" | "lg";
  /** [Icon system] `"inline"` (default — beside the number badge, previous fixed layout) or `"top"` (larger, above the title — a genuinely different, real layout this card component now supports). */
  iconPosition?: "inline" | "top";
  url?: string;
  order: number;
  visible: boolean;
  /** [Phase J] Per-card entrance animation — unset means the site's existing default reveal behavior (`DEFAULT_ANIMATION`, src/types/animation.ts), so every card saved before this field existed renders unchanged. The icon animates together with the rest of the card's content, not as a separate config — a second, independent animation just for a 16–24px glyph inside an already-animated card would be visual noise, not a real enhancement. */
  animation?: AnimationConfig;
}

/**
 * [Homepage CMS — Services/Design Process] `data/homepage.json`,
 * `/admin/homepage`. Deliberately its own record, not folded into
 * `HeroContent` — Hero already has a well-scoped, separately-editable
 * identity; Services/Design Process are homepage sections below the Hero,
 * not part of it. Seeded once from `site.ts`'s `services`/`process`
 * constants (byte-identical first-load content), per every other
 * `seed*()` function in `siteContentRepository.ts`.
 */
export interface HomepageContent {
  services: HomepageCard[];
  process: HomepageCard[];
}

export interface HeroVisual {
  id: string;
  image: AdminMedia;
  /**
   * Admin-facing organizational label. Also becomes the *visible* text
   * inside this tile's frame — but only while `image` is still a
   * `"placeholder"` (the same category-labeled placeholder text the site
   * has always shown for unset imagery, e.g. "Brand identity" — see
   * PlaceholderMedia.tsx's new optional `label` override). Once a real
   * photo is set, this stops being rendered as visible text (the site has
   * never overlaid captions on real Hero imagery, and adding one now
   * would be a layout change, not a content wiring fix) — it remains
   * available for admin organization and as a11y context regardless.
   */
  title: string;
  description?: string;
  href?: string;
  order: number;
  visible: boolean;
  /**
   * [Phase J — parallel/multi-element animation] Per-tile entrance
   * animation — this is what makes "Image A -> Fade Up, Image B ->
   * Scale, Image C -> Float, Image D -> Fade Right, running in parallel"
   * a real, independently-admin-controlled setting per Hero visual, not
   * a single shared effect. Unset means the existing default (`reveal`,
   * same motion the Hero grid already had), so nothing changes until an
   * admin sets one. A `"parallax"` type is read directly by Hero.tsx
   * into the tile's existing `data-parallax-depth` mechanism rather than
   * through `Animated.tsx` — see that file's header comment.
   */
  animation?: AnimationConfig;
}
