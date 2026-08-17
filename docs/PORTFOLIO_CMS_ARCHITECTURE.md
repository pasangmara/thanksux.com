# PORTFOLIO_CMS_ARCHITECTURE.md

## CMS-Ready Content Model — Joy Portfolio

**Status:** Architecture design only. No production code, components, or packages were touched or installed while producing this document. No database was migrated. The public website is unchanged.

---

## 0. Inspection summary — what actually exists today

Before proposing anything, this section states what was found by direct inspection, not assumption.

**Read in full:** `src/types/project.ts`, `src/content/projects.ts`, `src/content/real-projects.ts`, `src/content/demo-projects.ts`, `src/content/personal.ts`, `src/content/site.ts`, `src/content/media.ts`, `src/app/layout.tsx`, `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx`, and every component that consumes project/site/personal content: `ProjectHero`, `ProjectOverview`, `ProjectStory`, `CaseStudySection`, `CaseStudyGallery`, `ProjectCard`, `WorkGrid`, `ProjectGrid`, `WorkHero`, `CategoryFilter`, `Hero`, `FeaturedWork`, `CaseStudyPreview`, `GraphicDesignShowcase`, `UIUXShowcase`, `DesignerIntro`, `AboutSkills`, `ContactSection`, `SiteNav`, `SiteFooter`, `PortfolioMedia`, `PlaceholderMedia`.

**Findings that shape everything below:**

1. **The `Project`/`CaseStudy` schema (`src/types/project.ts`) is already close to CMS-ready** — this was noted in `PROJECT_SPEC.md` §9's own implementation note and confirmed true by this pass. Most of §§1–4 below documents that existing shape rather than inventing a new one.
2. **There is no dedicated About or Contact route.** `src/app/` contains only `/`, `/work`, `/work/[slug]`, `/not-found`, and a dev-only `/lab/*` route. `nav` in `site.ts` links to `/about` and `/contact`, but those paths 404 — "About" and "Contact" are anchor sections (`#about`, `#skills`, `#contact`) on the homepage, rendered by `DesignerIntro`, `AboutSkills`, and `ContactSection`. §7 and §8 below define content schemas for that real content, not for pages that don't exist yet — building `/about` and `/contact` as standalone routes is a separate, future decision this document doesn't make.
3. **Work page copy is hardcoded**, not content-driven. `WorkHero.tsx`'s heading/description are literal JSX strings; `work/page.tsx`'s `BASE_DESCRIPTION` (used for meta description) is a literal constant in the route file. There is currently no `workPage` content object anywhere. §6 proposes one.
4. **No project, page, or site-wide record has explicit SEO override fields.** `generateMetadata()` in `work/page.tsx` and `work/[slug]/page.tsx` currently *derives* title/description from existing content fields (`project.description ?? project.shortDescription`, etc.) rather than reading dedicated SEO fields. §9 proposes an optional, additive `SeoMeta` object — it does not change how metadata is derived today, only adds an override path.
5. **Gallery images have no `caption`, `section`, or explicit `order` field today.** `CoverMedia` is `{ kind, src, alt, objectPosition?, layout? }`. "Section" (which case-study stage an image belongs to — Logo vs. Applications vs. Moodboard, etc.) is implicit today: it's whichever `CaseStudy` array the image object happens to sit inside in the TypeScript file (`cs.logo`, `cs.applications`, …). "Order" is implicit array position. This works for a hand-edited `.ts` file; it does not work for a database row or an admin drag-to-reorder UI, which need these as real, explicit fields. §4 proposes them as additions, not replacements.
6. **One naming overload exists today that an admin form needs to resolve explicitly**: `CaseStudy.designDirection` is a single field that `ProjectStory.tsx` labels "Brand Strategy" when `category === "Branding"` and "Design Direction" otherwise (same for `finalDesign`, labeled "UI" for UI/UX and "Final Design" otherwise). §3 documents this and recommends the admin UI preserve the single underlying field but relabel it per-category in the form, rather than splitting storage — see §3's note.
7. **`overview` is a `CaseStudy` field today, not a top-level `Project` field** — `caseStudy.overview`, required, pulled by `CaseStudyPreview` and used as `ProjectHero`'s Branding-flow fallback. The requested field list for this document groups `overview` under "Basic," which doesn't match current storage. §2 flags this explicitly rather than silently relocating it.

---

## 1. Core primitive: the Media object

Every image on the site already renders through one component, `PortfolioMedia.tsx`, and one type, `CoverMedia` (`src/types/project.ts`). This is the existing reusable media object — the CMS model extends it, rather than inventing a parallel one, so nothing downstream needs to change.

### Current shape (`CoverMedia`, in code today)
```ts
type CoverMedia =
  | { kind: "image"; src: string; alt: string; objectPosition?: string; layout?: "full" | "half" | "third" }
  | { kind: "placeholder"; category: MediaCategory; alt: string; layout?: "full" | "half" | "third" }
```

### Proposed CMS-facing Media schema
A database row (or admin-form object) can't cleanly be a TypeScript discriminated union — it needs a flat, nullable-friendly shape. This is purely a storage-shape change; `PortfolioMedia` already only cares about the two cases below, so no component changes are implied.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `kind` | `"image" \| "placeholder"` | Required | Discriminates real photography from the honest "not shot yet" state | Auto-set: `"placeholder"` until a file is uploaded, then `"image"` | `PortfolioMedia.tsx` branches on this |
| `src` | string (URL/path) | Required if `kind: "image"` | Where the file lives — local `/images/projects/<slug>/...` today, a CDN URL after migration | Image upload widget (writes the resulting URL) | `next/image`'s `src` in `PortfolioMedia.tsx` |
| `alt` | string | **Required, always** | Accessibility + honesty — already compiler-enforced today, never optional | Single-line text, required to save | `<Image alt>` / `PlaceholderMedia`'s `aria-label` |
| `caption` | string | Optional — **new field, does not exist today** | A visible caption under a gallery image (currently nothing on the page shows one — `alt` is invisible, screen-reader only) | Single-line text | Not yet rendered anywhere; would require a small, explicitly-scoped `CaseStudyGallery` addition when built |
| `objectPosition` | string (CSS value, e.g. `"center top"`) | Optional | Fixes a bad default crop (e.g. portrait screenshot losing its top) | Small fixed-choice select: Center / Top / Bottom / Left / Right | `PortfolioMedia`'s `style.objectPosition` |
| `layout` | `"full" \| "half" \| "third"` | Optional, defaults to `"half"` | How much grid width this image claims in `CaseStudyGallery` | Segmented control: Full / Half / Third | `CaseStudyGallery.tsx`'s `SPAN`/`ASPECT_FOR` lookup |
| `category` | `MediaCategory` (9-value enum, see below) | Required if `kind: "placeholder"` | Which icon+label the honest placeholder shows | Select, only shown when no file is uploaded | `PlaceholderMedia.tsx` |
| `section` | enum, see below | Optional — **new field, does not exist today** | Which case-study stage this image belongs to, so a flat media list can be assigned via dropdown instead of living in a hardcoded array | Select | Determines which `CaseStudy` array (`logo`, `applications`, `wireframes`, …) or `Project.gallery` the image is grouped into when the admin saves |
| `order` | integer | Optional — **new field, does not exist today**, defaults to array position | Explicit sort key for drag-to-reorder in the admin | Drag handle in a list UI (writes the resulting integer) | Sort key when rendering a `section`'s images |

`MediaCategory` (existing, unchanged): `brand-mark` · `ui-screen` · `website` · `poster` · `editorial` · `campaign` · `social` · `packaging` · `typography`.

`section` (new enum, one value per existing `CoverMedia[]` slot on `Project`/`CaseStudy`): `cover` · `thumbnail` · `gallery` · `wireframes` · `finalDesign` · `moodboard` · `logo` · `applications` · `exploration`.

---

## 2. Projects — basic fields

Table covers every field the task's "Basic" list named, cross-checked against `src/types/project.ts`'s actual `Project` interface.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `id` | string | Required | Stable internal identifier, independent of `slug` (which can theoretically change) | Auto-generated, read-only | Not rendered — internal key only |
| `title` | string | Required | Project name | Single-line text | `ProjectHero` (h1), `ProjectCard` (h3), nav/OG titles |
| `slug` | string | Required, unique | URL segment; must match its image folder name (`public/images/projects/<slug>/`) | Single-line text, auto-suggested from `title`, editable, validated unique + URL-safe | Route param for `/work/[slug]`, every internal link |
| `category` | enum (7 values, see `PROJECT_CATEGORIES`) | Required | Drives which `ProjectStory` narrative flow renders, and Work-page filtering | Select (fixed list, not free text) | `CategoryFilter`, `ProjectStory`'s flow selection, card meta line |
| `projectType` | string (free text by design) | Required | Sub-classification within category, e.g. "Mobile App," "Brand Identity" | Single-line text, free entry | `ProjectHero`'s meta line |
| `year` | number | Required | Project year | Number input | `ProjectHero`, `ProjectOverview`, card meta line |
| `client` | string | **Optional** | Client name; omit for personal/NDA'd work | Single-line text, nullable | `ProjectOverview`'s grid (only shown if present) |
| `role` | string | Required | The designer's role on this project | Single-line text | `ProjectOverview`'s grid |
| `shortDescription` | string | Required | One-line card summary | Single-line text | `ProjectCard`, `WorkGrid` primary card, falls back to this if `description` absent |
| `description` | string | Optional | Longer hero paragraph | Multi-line plain text | `ProjectHero`'s lede (falls back to `shortDescription`) |
| `overview` *(see §0 finding 7)* | string | **Required, but currently stored at `caseStudy.overview`, not here** | Framing sentence for spotlight/preview contexts | Multi-line plain text | `CaseStudyPreview` (homepage spotlight), `ProjectHero`'s Branding-flow fallback |
| `featured` | boolean | Required | Whether this project appears in Featured Work / homepage Hero rotation | Toggle switch | `Hero`, `FeaturedWork`, `WorkGrid`'s lead/medium tiers |
| `featuredOrder` | number | Optional, only meaningful when `featured: true` | Manual ordering within the featured set | Number input, shown only when `featured` is on | `Hero`'s top-3 tiles, `FeaturedWork`'s primary/secondary split |
| `published` | boolean | Required | Hard visibility gate — `false` means the route itself doesn't exist (`notFound()`) | Toggle switch, defaults to `false` on creation | Gates every listing surface + `generateStaticParams` |
| `tags` | string[] | Required (empty array valid) | Short descriptive chips shown in card meta | Multi-select/tag input, free entry | `ProjectCard`'s meta line (first 2 shown) |
| `tools` | string[] | Required (empty array valid) | Software/tools used | Multi-select/tag input, free entry | `ProjectOverview`'s grid (column hidden if empty) |
| `services` | string[] | Required (empty array valid) | Which of the site's service offerings this falls under — should match `site.ts`'s `services` list | Multi-select from the existing services list (not free text, to prevent drift) | `ProjectOverview`'s grid |
| `projectUrl` | string (URL) | Optional | Live shipped URL, if one exists | URL input, validated | Not currently rendered anywhere in the inspected components — a real gap; would need a small explicit addition (e.g., a "Visit site" link in `ProjectHero`) when actually wired up |
| `order` | number | Required | General listing sort order, distinct from `featuredOrder` | Number input | `publishedProjects` sort, `WorkGrid`'s standard tier |

`coverImage`, `thumbnail`, and `gallery` are Media objects/arrays — see §4 rather than repeating here.

---

## 3. Case studies — universal fields

Only `overview` and `outcome` are non-optional at the type level today; every field below is optional so a project only carries what it actually has. `ProjectStory.tsx`'s `hasContent()` filter means an absent field renders nothing — no empty section, no placeholder box. **The CMS admin form should preserve this**: an empty/untouched field must save as absent, not as an empty string that then renders a blank section.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `constraint` | string | Optional | Budget/timeline/stakeholder/technical constraint, always opens the story if present | Multi-line plain text | First stage in `ProjectStory`, every category |
| `context` | string | Optional | Who the client is / situational framing | Multi-line plain text | Branding flow's "Context"; generic fallback flow |
| `problem` | string | Optional | The core problem statement | Multi-line plain text | UI/UX flow's "Problem"; `CaseStudyPreview` fallback |
| `research` | string | Optional | Research narrative | Multi-line plain text | UI/UX + Branding flows' "Research" |
| `researchMethods` | string[] | Optional | Short method tags (e.g. "User interviews") | Tag input | Rendered as a chip row under Research (UI/UX flow) |
| `insights` | string | Optional | What the research revealed | Multi-line plain text | UI/UX flow's "Insights" |
| `userJourney` | string | Optional | Flow narrative | Multi-line plain text | UI/UX flow's "User Journey" |
| `informationArchitecture` | string | Optional | IA narrative | Multi-line plain text | UI/UX flow's "Information Architecture" |
| `wireframes` | Media[] | Optional | Early-stage screens | Repeatable image list | UI/UX flow's "Wireframes" gallery |
| `designDirection` | string | Optional | **Overloaded field** — see §0 finding 6 | Multi-line plain text; admin form should label this "Brand Strategy" when `category === "Branding"`, "Design Direction" otherwise, matching runtime behavior exactly | Branding flow: "Brand Strategy"; other flows: "Design Direction" |
| `designSystem` | string | Optional | Type/system rules used | Multi-line plain text | Generic fallback flow only (not in the 3 named flows) |
| `finalDesign` | Media[] | Optional | **Overloaded field**, same pattern as above | Repeatable image list; admin form should label this "UI" for UI/UX, "Final Design" otherwise | UI/UX flow: "UI"; Graphic Design flow: "Final Design" |
| `testing` | string | Optional | Testing narrative | Multi-line plain text | UI/UX flow's "Testing" |
| `reflection` | string | Optional | What would be done differently; always closes the story before Outcome | Multi-line plain text | Last stage in `ProjectStory`, every category |
| `outcome` | string | **Required** | Honest outcome statement — never a fabricated metric | Multi-line plain text, required to save | `OutcomeBlock`, rendered unconditionally on every case study |

---

## 4. Branding-specific content

These are additions kept specifically for real branding/print work — unused by the UI/UX flow, all optional.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `brandStrategy` *(see §0 finding 6)* | — | — | **Requested name; current storage is the shared `designDirection` field, not a separate column.** Recommendation: keep one field, admin-relabeled per category (§3), rather than adding a second field that could drift out of sync with `designDirection` for non-Branding projects. If a future need arises to have *both* a generic Design Direction AND a distinct Brand Strategy on the same project, that's a real schema change to make deliberately, not a side effect of this document. | — | — |
| `concept` | string | Optional | The idea behind the mark/direction | Multi-line plain text | Branding + Graphic Design flows' "Concept" |
| `logo` | Media[] | Optional | The mark itself, variations | Repeatable image list | Branding flow's "Logo" gallery |
| `typography` | string | Optional | Type choices and reasoning | Multi-line plain text | Branding flow's "Typography" |
| `colorSystem` | string | Optional | Palette and reasoning | Multi-line plain text | Branding flow's "Color" |
| `applications` | Media[] | Optional | Real-world use / mockups | Repeatable image list | Branding + Graphic Design flows' "Applications" gallery |
| `exploration` | Media[] | Optional | Rejected/earlier directions | Repeatable image list | Graphic Design flow's "Exploration" gallery |
| `moodboard` | Media[] | Optional | Reference/mood collection | Repeatable image list | Generic fallback flow only (not in the 3 named flows — a real gap if a Branding project wants to show one; would need a small, explicit `ProjectStory.tsx` addition) |

---

## 5. Project gallery / images

Two distinct galleries exist today and the CMS model should keep them distinct rather than merging them (a prior architecture pass deliberately removed a duplicate field for this exact reason — see `project.ts`'s own comment history).

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `coverImage` | Media | Required | Hero banner (detail page) + homepage exhibition tiles | Single image upload (required to publish) | `ProjectHero`, `Hero` (top featured tiles), `CaseStudyPreview` |
| `thumbnail` | Media | Optional | Card/grid-optimized image | Single image upload, nullable | `ProjectCard` (falls back to `coverImage` if absent) |
| `gallery` | Media[] | Required key, empty array valid | The **general/overall** project gallery — distinct from any case-study stage | Repeatable image list, drag-to-reorder | Standalone "Gallery" section on the detail page, only rendered if non-empty |

Every stage-specific gallery (`wireframes`, `finalDesign`, `moodboard`, `logo`, `applications`, `exploration`) is documented in §3/§4 above — they are `CaseStudy` fields, not `Project.gallery`. See §1's proposed `section` field for how a future flat media library would route an uploaded image into the correct one of these arrays.

---

## 6. Work page settings *(new — does not exist as content today, see §0 finding 3)*

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `label` | string | Required | Small eyebrow label above the heading | Single-line text | `WorkHero`'s `text-label` ("Work") |
| `heading` | string | Required | Page H1 | Single-line text | `WorkHero`'s `h1` |
| `description` | string | Required | Supporting paragraph | Multi-line plain text | `WorkHero`'s lede paragraph |
| `metaDescription` | string | Optional, falls back to `description` | SEO description for `/work` and its category-filtered variants | Multi-line plain text | `generateMetadata()` in `work/page.tsx` (currently a hardcoded `BASE_DESCRIPTION` constant — this field would replace that constant) |
| `visibleCategories` | `ProjectCategory[]` | Optional, defaults to all 7 | Which categories show as filter chips | Multi-select from the fixed 7-category list | `CategoryFilter.tsx` (currently always shows all 7 via `PROJECT_CATEGORIES` — this would become an override, not a replacement, to avoid a category with real published work being accidentally hidden) |

---

## 7. About page *(currently a homepage section, not a route — see §0 finding 2)*

Schema covers the real content currently rendered by `DesignerIntro.tsx` + `AboutSkills.tsx`, sourced today from `personal.ts` + `site.ts`.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `name` | string | Required | Already in `personal.ts` | Single-line text | Nav wordmark, `DesignerIntro`'s greeting, footer, page `<title>` |
| `roles` | string[] | Required | e.g. "Graphic Design," "UI/UX Design," "UX Research" | Tag input | `Hero`'s eyebrow line |
| `bio` | string | Required | Short bio | Multi-line plain text | Not directly rendered today in the inspected components — currently only `designPhilosophy` (below) is shown; `bio` exists in `personal.ts` but appears unused in the read component set, worth reconciling when this is actually built |
| `designPhilosophy` | string | Required | Longer "how I work" paragraph | Multi-line plain text | `DesignerIntro`'s main paragraph |
| `aboutFacts` | string[] | Required (currently 3 entries) | Short specific credibility facts | Repeatable text-list input | `DesignerIntro`'s bulleted list |
| `photo` | Media | Optional (currently unset — placeholder shown) | Real headshot, required per `PROJECT_SPEC.md` §4.4 but not yet supplied | Single image upload | `DesignerIntro`'s portrait frame (currently a labeled "Photo pending" placeholder) |
| `location` | string | Optional (currently a literal `"[Location]"` placeholder — flagged `NEEDS REAL DATA` in code) | Where the designer is based | Single-line text, nullable | Not currently rendered in the inspected components — present in `personal.ts` but unconsumed |
| `experienceSummary` | string \| null | Optional | Years of experience / credibility line | Single-line text, nullable | `AboutSkills`'s "Experience" column (shows a bracketed placeholder string when null — should instead simply hide the column, matching the site's own "absent field renders nothing" convention) |
| `skills.design` | string[] | Required (empty valid) | Design-discipline skill chips | Tag input | `AboutSkills`'s "Design" column |
| `skills.tools` | string[] | Required (empty valid) | Tool chips | Tag input | `AboutSkills`'s "Tools" column |
| `resumeUrl` | string (URL) | Optional | CV/résumé download link, required by `PROJECT_SPEC.md` §4.4 but **not implemented in any inspected component today** | URL/file input | Not rendered anywhere yet — a genuine future addition, not a rename of something existing |

---

## 8. Contact page *(currently a homepage section, not a route — see §0 finding 2)*

Sourced today from `ContactSection.tsx` (hardcoded copy) + `personal.ts`'s `socialLinks` + `site.ts`'s `projectTypes`/`responseTimeLine`.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `heading` | string | Required | Section title | Single-line text | `ContactSection`'s `SectionHeader` — currently hardcoded `"Contact"`, not content-driven |
| `description` | string | Optional | Supporting line | Multi-line plain text | `ContactSection`'s `SectionHeader` description — currently a hardcoded string |
| `socialLinks` | SocialLink[] | Required (see §9 for shape) | Direct contact channels, in priority order | Reuses the Social Link schema | `ContactSection`'s channel list, `SiteFooter`'s icon row |
| `projectTypes` | string[] | Required | Dropdown options in the contact form | Repeatable text-list input | `ContactSection`'s form `<select>` |
| `responseTimeLine` | string | Optional | e.g. "Usually replies within 24 hours" | Single-line text, nullable | `ContactSection`, below the channel list |

The contact form itself (`name`/`email`/`projectType`/`message` → `mailto:` link) has no backend today — it's client-only, and its recipient address is derived from `socialLinks`' `email` entry rather than a separate field. This document doesn't propose changing that mechanism; a real backend (form submission storage/email delivery) is out of scope here and would be its own deliberate addition.

---

## 9. Social link schema *(already exists — `SocialLink` in `personal.ts`, documented as-is)*

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `label` | string | Required | Channel name, e.g. "Email" | Single-line text | `ContactSection` list, `SiteFooter` `aria-label` |
| `value` | string | Required | Display text, e.g. "Message on WhatsApp" | Single-line text | `ContactSection`'s secondary line under the label |
| `href` | string (URL or `mailto:`) | Required | The actual link target | URL input, validated | `<a href>` in `ContactSection` + `SiteFooter` |
| `icon` | enum: `email` \| `whatsapp` \| `facebook` \| `linkedin` \| `instagram` \| `behance` \| `dribbble` | Required | Which glyph renders | Select (fixed list — matches `contactIcons`' available icon set, not free text) | `contactIcons[method.icon]` in both consuming components |
| `priority` | enum: `primary` \| `secondary` \| `passive` | Required | Visual/ordering weight | Select | Currently read but not visibly differentiated in the inspected markup beyond array order — worth confirming intended visual treatment if this becomes admin-editable ordering |

---

## 10. SEO metadata schema *(new — proposed, additive; see §0 finding 4)*

Not a new mechanism — `generateMetadata()` already exists per-route in `work/page.tsx` and `work/[slug]/page.tsx` and already derives sensible defaults from content. This schema formalizes optional **overrides**, attachable to a `Project`, the Work page settings object (§6), or a future About/Contact page object, without changing today's fallback behavior when left unset.

| Field | Type | Required | Purpose | Admin input type | Public rendering location |
|---|---|---|---|---|---|
| `metaTitle` | string | Optional, falls back to `title` (+ site suffix, e.g. `" — Joy"`) | Override for `<title>` / OG title | Single-line text, nullable | `generateMetadata()`'s `title` |
| `metaDescription` | string | Optional, falls back to `description ?? shortDescription` | Override for meta/OG description | Multi-line plain text, nullable | `generateMetadata()`'s `description` |
| `ogImage` | Media | Optional, falls back to `coverImage` (only set today if `coverImage.kind === "image"` — a placeholder is deliberately never used as a social-share image) | Custom social-share image | Single image upload, nullable | `openGraph.images` |
| `canonicalPath` | string | Optional, auto-derived from `slug`/route today | Rare override for canonical URL | Single-line text, nullable | `alternates.canonical` |
| `noIndex` | boolean | Optional, defaults to `false` | Keep a page out of search results (useful for a published-but-not-ready project) | Toggle switch | Would require a small, explicit addition to each route's `generateMetadata()` — `robots: { index: false }` — not present in any inspected file today |

---

## 11. Rendering rule — carries forward unchanged

Every schema above follows the same rule already implemented in `ProjectStory.tsx`'s `hasContent()` filter and confirmed sitewide: **an absent/empty optional field renders nothing — no empty heading, no placeholder box, no "coming soon" text.** This is not a new rule this document introduces; it's the existing, working convention, restated here so the future Admin Dashboard's save behavior doesn't violate it (e.g., saving an untouched textarea as `""` must be treated as "field not set," not as a section to render blank).

---

## 12. Migration path — TypeScript files → Admin Dashboard → Database/CMS

### Stage 0 — today
Hand-edited TypeScript: `demo-projects.ts` / `real-projects.ts`, `personal.ts`, `site.ts`. A human is the "save button," editing files directly. `src/content/projects.ts` is the single seam every component reads through (`featuredProjects`, `publishedProjects`, `projectsByCategory()`, `getCaseStudyPreviewProject()`) — proven already, in this project's own history, to support swapping the underlying data source (`demoProjects` → `realProjects`) with zero component changes.

### Stage 1 — Admin Dashboard, still file/JSON-backed
Build the dashboard's editor forms directly against the field tables in §§2–10 above — the shape doesn't change, only who edits it and how it's saved. A server action or API route writes structured data (JSON or regenerated `.ts`) back to disk (or a lightweight datastore), gated by the single-user auth `PROJECT_SPEC.md` §9 already specifies. Media uploads land in `public/images/projects/<slug>/` (or an equivalent simple upload endpoint) — no CDN required yet. Draft/publish is exactly today's `published` boolean; nothing new needed there. This stage requires no schema change from what's documented here.

### Stage 2 — real database / headless CMS
Move the same field shapes (§§1–10) into database tables or CMS collections (Postgres, Sanity, Payload — `PROJECT_SPEC.md` §8 leaves this choice open). Replace `src/content/projects.ts`'s array-literal exports with equivalent async data-fetching functions that return the **identical shapes** (`Project[]`, `featuredProjects`, `publishedProjects`, `projectsByCategory()`, `getCaseStudyPreviewProject()`) — the same "swap the source, keep the selector signatures" pattern already proven by the `demoProjects` → `realProjects` switch earlier in this project's history. This is the key reason §§1–10 matter: if the admin form and the eventual database schema both match this document field-for-field, this migration becomes a data-layer swap, not a rendering rewrite. Media moves to a CDN/asset host at the same time; `Media.src` simply points elsewhere, and `PortfolioMedia.tsx` doesn't need to know or care.

### Stage 3 — full admin capability set
Once Stage 2 is real, layer on `PROJECT_SPEC.md` §9's remaining CMS requirements: dashboard counts/recent-activity, list/filter/sort by category+status+featured, required-field validation on publish (alt text and `outcome` are already compiler-enforced today at the TS-file level — Stage 3 needs to replicate that enforcement at the database/form-validation level once TypeScript itself is no longer the gate), and a real draft-preview capability (today `published: false` means the route doesn't exist at all — no preview link — which Stage 3 should address deliberately, not as a side effect).

---

## 13. Summary of genuine gaps found (not fixed here — flagged for a future, separately-scoped pass)

- No dedicated `/about` or `/contact` route exists; `nav` links to both anyway (pre-existing, noted in an earlier audit too).
- Work page copy (`WorkHero`, `work/page.tsx`'s meta description) is hardcoded, not content-driven — §6 defines the schema to fix this when it's actually built.
- No SEO override fields exist on any content object today — §10 is fully additive/proposed.
- Gallery images have no `caption`, explicit `section`, or explicit `order` field — §1 proposes adding them.
- `personal.ts`'s `bio` and `location` fields exist but weren't found consumed by any inspected component.
- `resumeUrl` (`PROJECT_SPEC.md` §4.4's "Resume/CV download link") has no field or rendering anywhere yet.
- `projectUrl` exists on `Project` today but isn't rendered by any inspected component.
- `AboutSkills`'s `experienceSummary` renders a bracketed placeholder string when unset, instead of hiding the column — inconsistent with the site's own "absent field renders nothing" convention (§11).

None of these were fixed as part of this document — per the task's scope, this is architecture design only.

---

*This document defines a content model. No production code was written, no components were modified, no packages were installed, and no database migration occurred.*
