# PROJECT_EDITOR_ARCHITECTURE.md

## A flexible, category-driven Project CMS + Homepage CMS — architecture proposal

**Status: proposal only. No production code was changed to produce this document.** One read-only diagnostic was run against the live dev server (creating and deleting a throwaway draft project via the real API) to verify a specific claim before writing it down — no persisted data was left behind, Gridmark was not touched. Everything below is a plan to review and approve before implementation begins.

---

# PART 1 — PROJECT EDITOR

## 1. Current architecture (verified by reading the actual code, not assumed)

```
Admin "+ New draft project" (admin/projects/page.tsx)
  → createProject(title) (lib/admin/store.ts)
  → POST /api/admin/projects (route.ts)
  → createProjectRecord(title) (lib/cms/projectsRepository.ts)
  → data/projects.json  [category hardcoded to "Graphic Design", published: false, isAdminDraft: true]
  → router.push(/admin/projects/{id})

Admin project editor (admin/projects/[id]/page.tsx)
  → getCategoryConfig(category) / getDynamicFields(category)  (types/category-config.ts)
  → renders COMMON_FIELDS (fixed) + category's dynamic fields via <ProjectFieldRenderer>
  → Media/Gallery via shared <GalleryManager> (flattenGallery/applyFlatGallery, lib/admin/gallery.ts)
  → SEO via shared <SeoEditor> (already generic, already wired to Project.seo)
  → Save → saveProject() → PUT /api/admin/projects/[id] → saveProjectRecord() → data/projects.json

Public read (server-side, no HTTP round-trip)
  → src/content/projects.ts → projectsRepository.listAllProjects() → data/projects.json
  → /work, /work/[slug] filter to published: true
  → ProjectHero / ProjectOverview / ProjectStory / CaseStudyGallery render whatever fields are present
```

**The schema-driven core already exists and already works well:** `CATEGORY_CONFIG` (`src/types/category-config.ts`) is a single source of truth — `{ key, scope, adminLabel, publicLabel?, type, required?, group?, repeatableFields? }` per field, one array per category. `ProjectFieldRenderer.tsx` (admin) and `ProjectStory.tsx` (public, since the D3 pass) both iterate the *same* `getDynamicFields(category)` list — there is no `if (category === "UI/UX") { … }` branching anywhere. This is the right foundation; the proposal below **extends** it, it does not replace it.

**Persistence is already real, not localStorage.** `data/projects.json` is the live source for every project including Gridmark (`real-projects.ts` only seeds it once, on first read). Admin writes go through `/api/admin/projects/**`; the public site reads the repository directly, server-side.

**Media/upload is already unified.** `MediaField`/`GalleryManager` (`src/components/admin/media.tsx`) already support both "Choose existing image" and real "Upload new image" (added in a prior phase) — cover, thumbnail, and every gallery-section image all go through the same component and the same `POST /api/admin/images` endpoint.

## 2. Problems identified (from reading the code + one live diagnostic)

1. **No category-first creation moment.** `createProjectRecord()` hardcodes `category: "Graphic Design"` for every new draft — there is no "what kind of project is this?" prompt before or immediately after clicking "+ New draft project." The category `<select>` exists, but it's buried in the "Basic Information" section of an already-open editor, not the first decision. This is the literal complaint: *"the first important decision should be: PROJECT CATEGORY."*
2. **Slug collision risk on create.** `createProjectRecord()` derives `id = slugify(title) || project-${Date.now()}` with **no uniqueness check**. Two drafts titled "New Project" collide on the same `id`/`slug`; `saveProjectRecord()`'s `findIndex((p) => p.id === project.id)` would then silently overwrite the wrong row on save, and (if both were ever published) `/work/[slug]` would only ever resolve the first match. **Confirmed live**: creating a draft, reading it back, and deleting it all worked correctly for a *unique* title — the bug is specifically the missing collision guard, not general breakage.
3. **`customSections` (Behance-style custom blocks) only exists for the "Custom" category.** The underlying data field (`CaseStudy.customSections?: CustomSection[]`) is already generic and already renders publicly via the same config-driven mechanism every other field uses — it's gated out of every other category's `CATEGORY_CONFIG` entry, not out of the schema or the renderer. This is a **config change, not a new subsystem.**
4. **`CustomSection`'s shape is narrower than what's being asked for.** Today: `{ id, label, description?, type?: "text"|"gallery", text?, image?, images?, items?, order? }`. The request wants Video URL, Embed URL, Figma Prototype, Website Link, Quote, Divider, and two-column/image+text layouts — none of which exist yet.
5. **No structured "project links" object.** UI/UX and Web Design have a single free-text `prototype: string` field (label "Prototype Link"). There's no distinct Figma *file* URL vs. Figma *prototype* URL, no Live URL / App URL / "Other" URL as their own fields — everything would currently have to be crammed into one field or a custom section.
6. **Graphic Design has no deliverables/services checklist at all.** `graphicDesignConfig.fields` has no field for "what was actually produced" (Logo, Business Card, Poster, Packaging, …). The generic `Project.services` field exists but is a *different* concept (which of the site's ~3 marketing service offerings this falls under) rendered via a fixed checkbox list (`MultiCheckField` + `SERVICE_OPTIONS` from `site.ts`'s 3-item `services` array) — not an open, growing deliverables vocabulary.
7. **SEO is already solved — worth stating explicitly so it isn't rebuilt.** `Project.seo?: SeoMeta` already exists, is already editable via the shared `<SeoEditor>`, and is already read by `work/[slug]/page.tsx`'s `generateMetadata()`. Nothing to do here except confirm it stays intact.
8. **Admin editor page is already grouped, not one giant scroll** — `Section`/`Subsection` (by each field's `group`) already exist. The requested "Basic Information / Category / Content / Category-specific / Media / Links / Custom Sections / SEO / Publishing" structure is achievable by re-ordering/labeling existing sections plus adding two new ones (Links, Custom Sections-for-every-category) — not a rebuild.
9. **Draft vs. published is already clearly modeled** (`published: boolean`, defaults `false`, gates `generateStaticParams`/route existence) and **delete is already real and confirmed** (removes the row from `data/projects.json`, confirmed via the same diagnostic). Preview already exists (`/admin/projects/[id]/preview`, reuses the real public components). These do not need to be rebuilt — only Publish/Unpublish as a single explicit toggle-with-confirmation (today it's a plain `ToggleField` in Publishing) could get a small UX polish, not a new mechanism.

## 3. Proposed project schema (additive only)

No existing field is removed, renamed, or restructured. Gridmark's record needs zero migration.

### 3a. `ProjectLinks` — new, optional, on `Project`

```ts
export interface ProjectLinks {
  figmaPrototypeUrl?: string;
  figmaFileUrl?: string;
  liveUrl?: string;
  appUrl?: string;
  otherUrl?: string;
  otherLabel?: string; // e.g. "Case study on Behance"
}
```

Added as `Project.links?: ProjectLinks` (mirrors how `seo?: SeoMeta` was added — one optional nested object, not five new top-level fields). `CATEGORY_CONFIG` entries that want any of these fields reference `key: "links", scope: "project"` with a dedicated renderer (see §5) rather than five separate `CategoryFieldDef` entries — keeps the "Links" admin section and the per-field public rendering coherent as one unit.

### 3b. `CustomSection` — extended, all additions optional

```ts
export type CustomSectionType =
  | "text"
  | "richtext"        // same plain-string storage as `text` today — see fields.tsx's existing RichTextField note on why this project doesn't parse markdown/HTML
  | "image"
  | "gallery"
  | "video"            // videoUrl
  | "embed"            // embedUrl — rendered as a link/button by default, see §8
  | "figma"             // figmaUrl — same domain-gated embed rule as ProjectLinks
  | "link"              // linkUrl + linkLabel — a generic "Website Link" block
  | "quote"             // text = the quote, + quoteAttribution
  | "divider"           // no content fields at all
  | "two-column";       // renders `text` and `images[0]` (or a second `text`) side by side

export interface CustomSection {
  id: string;
  label: string;
  description?: string;
  type?: CustomSectionType;   // widened; still advisory/optional, defaults to "text" behavior for old records
  text?: string;
  image?: CoverMedia;
  images?: CoverMedia[];
  items?: CustomSectionItem[];
  order?: number;
  // New, all optional:
  videoUrl?: string;
  embedUrl?: string;
  figmaUrl?: string;
  linkUrl?: string;
  linkLabel?: string;
  quoteAttribution?: string;
}
```

Every existing `CustomSection` record (there are none in real content today — confirmed by grep in a prior phase) is a strict subset of this shape, so this is zero-risk for existing data.

### 3c. Graphic Design's deliverables — reuse an existing field, don't invent one

`CaseStudy.deliverables?: string[]` **already exists** (currently used only by Digital Marketing/Social Media Design). Add it to `graphicDesignConfig.fields` with `type: "tags"`. `TagListField` is already free-entry (type anything, press Enter) — this alone satisfies *"the admin can eventually add/manage services"* with **zero new catalog infrastructure**: there is no fixed enum to maintain, so there's nothing to "manage." The requested example list (Logo Design, Business Card, Brochure, Poster, Packaging, …) becomes the field's `helpText`, shown as guidance, not a hard-coded constraint. (A future, separate enhancement — a shared autocomplete catalog reused across projects — is noted in §12 as optional, not required.)

### 3d. Nothing else changes shape
`CaseStudy`'s existing ~50 optional fields already cover every UI/UX, Branding, Web Design, Digital Marketing, and Print Design field the brief lists (verified field-by-field against `docs/CMS_CONTENT_MODEL.md` §4–§11 and the current `category-config.ts` — every requested field like "User Persona," "Design Process," "Brand Guidelines," "Funnel," already has a home). The work here is **config** (which fields appear for which category, in what groups) plus the three additions above (§3a–3c), not new `CaseStudy` fields.

## 4. Category configuration — additive changes to `CATEGORY_CONFIG`

- Add `links`-scoped fields to `uiUxConfig`, `webDesignConfig` (Figma Prototype/File, Live URL, App URL, Other) — replacing the current single free-text `prototype` field's admin presentation, while keeping `prototype` itself as a backward-compatible alias (see §11).
- Add `deliverables` (tags) to `graphicDesignConfig`, grouped under "Service / Deliverable."
- Add `customSections` (repeatable) to **every** category's `fields` array, grouped under a new "Custom Sections" group — this is the one-line-per-category change that makes Behance-style blocks universal (§6).
- No category gets a field it doesn't already conceptually have in `CMS_CONTENT_MODEL.md` — this phase does not invent new case-study concepts, only exposes existing ones plus the three additions above.

## 5. Field system

`CmsFieldType` gains two new *rendering* concepts without becoming a second component system:

- **`"links"`** — a fixed-shape object (not a generic repeatable), rendered by one new admin component `ProjectLinksEditor` (small, ~5 fields, same primitives as everywhere else: `TextField` with `type="url"`) and consumed as its own public block (§8), not folded into the generic field-to-stage mapping.
- **`"quote"` / `"divider"` / `"video"` / `"embed"` / `"figma"` / `"link"` / `"two-column"`** are **not** new top-level `CmsFieldType` values — they only exist as `CustomSectionType`, handled entirely inside the (already-bespoke) `CustomSectionsEditor`/`CaseStudyCustomSectionsSection` pair, exactly like today. This avoids widening `ProjectFieldRenderer`'s `switch` for concepts that only ever appear inside a custom section.

Every other field type (`text`, `textarea`, `url`, `tags`, `gallery`, `repeatable`, …) is unchanged.

## 6. Custom sections — Behance-style blocks, structured (not freeform HTML)

- `CustomSectionsEditor` (already exists in `ProjectFieldRenderer.tsx`) gets a `type` `<select>` per section (currently the field exists but isn't exposed as a picker) and conditionally shows only the inputs relevant to the chosen type — same "only render what's relevant" principle as the category system itself, one level down.
- Reorder (`↑`/`↓`, already implemented for the Custom category), add, edit, delete — all already implemented; extending to every category is enabling the existing `customSections` field, not new UI code.
- **Public rendering**: extend `CaseStudyCustomSectionsSection` (`CaseStudySection.tsx`) with one render branch per new `type`. `quote`/`divider`/`video`/`embed`/`figma`/`link`/`two-column` are simple, bounded templates — no `dangerouslySetInnerHTML`, no arbitrary markup, matching the explicit "keep it structured and safe" instruction.
- `hasContent()`-style filtering (already the sitewide convention) applies per section: an empty/unfilled section of any type renders nothing.

## 7. Media system — reused as-is

No changes needed to `MediaField`, `GalleryManager`, or `/api/admin/images`. They already: support upload + existing-image choice, apply to cover/thumbnail/every gallery section, preserve aspect ratio via `PortfolioMedia`'s existing `aspect`/`fit`/`layout` fields, and are reorderable. The one addition: `CustomSection.images`/`.image` already exist and already route through the same `MediaField`/`RepeatableImagesSubField` components (confirmed in `ProjectFieldRenderer.tsx`'s existing `CustomSectionsEditor`) — no new media plumbing required even after §6.

## 8. Figma / link handling

- **Storage**: structured (`ProjectLinks`, §3a), not a single free-text blob.
- **Public rendering**: a new `ProjectLinksSection` (or extending `ProjectCTA`) renders each set link as a `CaseStudyLinkSection`-style button (the same pattern already built for `caseStudy.prototype`) — external, `target="_blank"`, `rel="noreferrer"`. **No automatic iframe embedding of arbitrary URLs.**
- **Optional safe embed**: only for `figmaPrototypeUrl`/`figmaUrl`, and only when the URL's hostname is exactly `www.figma.com` or `figma.com` (validated server-side at render time, not trusted from stored data blindly) — rendered as Figma's own `https://www.figma.com/embed?embed_host=...&url=...` iframe pattern, inside a fixed-aspect-ratio frame matching the site's existing media container conventions. If the URL doesn't match that allowlist, or embedding is off, it falls back to the safe external button. This satisfies *"do not introduce security risks from arbitrary iframe sources"* literally — the allowlist is the whole safety mechanism.
- `caseStudy.prototype` (existing field) stays as a backward-compatible alias — see §11.

## 9. Admin workflow

**Creation flow** — the one genuinely new UX moment:
```
"+ New draft project" → category picker (the 8 canonical categories, from PROJECT_CATEGORIES —
   same source the existing <select> already reads, not a new list) → title input →
   createProjectRecord(title, category) → editor opens already configured for that category
```
`createProjectRecord()` gains a `category` parameter (default remains `"Graphic Design"` only if somehow omitted, for backward compatibility with the API contract) and a **uniqueness check** on the generated slug (append `-2`, `-3`, … on collision — same pattern already used nowhere else in this codebase but a one-function, well-contained fix for Problem #2 above).

**Editor layout** — re-groups existing `Section`s (no new visual system) into the requested order:
```
Basic Information → Category-Specific Content (grouped by CATEGORY_CONFIG's `group`s, unchanged
mechanism) → Links (new) → Media / Gallery (existing GalleryManager) → Custom Sections (existing
CustomSectionsEditor, now available for every category) → SEO (existing SeoEditor) → Publishing
```
"Category" itself isn't a separate section in the *editing* flow (changing category on an existing project is one field inside Basic Information, unchanged) — it's only a distinct *first step* during creation, per §9's opening flow, matching the brief's "the first important decision should be category" without duplicating the category selector as its own permanent section.

**Buttons/feedback** — already correct as of the prior phase (`useSaveStatus`, `SaveStatusMessage`, `adminButtonPrimary/Secondary/Danger`, disabled-while-busy). No changes needed; new buttons (category picker's "Create," Links section, Custom Section type picker) reuse these same primitives.

## 10. Public rendering

- `ProjectStory.tsx` needs no structural change — it already iterates `getDynamicFields(category)` and renders whatever has content. Adding `deliverables`/`customSections` to a category's config is enough for them to appear, automatically, in the config's own field order.
- New: a `ProjectLinksSection` rendered once, positioned after the Outcome block (near `ProjectCTA`) — a natural "here's where to see more" close to the story, not interleaved mid-narrative.
- Extended: `CaseStudyCustomSectionsSection` handles the new section types (§6).
- **Nothing renders empty** — every new piece follows the exact same `hasContent()`/optional-chaining convention already used everywhere on this site.

## 11. Migration / backward compatibility

- **Gridmark**: uses none of the new fields (`links`, extended `customSections` types, `deliverables`) — confirmed by re-reading its current record. Its rendered output is provably unchanged: every new field is additive and optional, and `ProjectStory.tsx`'s existing `hasContent()` filter already means "field absent → nothing renders," which is exactly Gridmark's situation for all new fields.
- **`caseStudy.prototype`**: kept, unremoved. `ProjectLinks.figmaPrototypeUrl` becomes the *new* field categories default to displaying in the admin going forward; if `prototype` is already set on an existing record and `links.figmaPrototypeUrl` is not, the public renderer falls back to `caseStudy.prototype` — one line of `??` fallback, not a data migration script, and nothing is deleted.
- **`CustomSection.type`**: widened union is a superset; every existing value (`"text" | "gallery"`, and `undefined`) still means exactly what it meant before.
- No `data/projects.json` migration script is required — `normalizeProject()` (already exists in `projectsRepository.ts`) is the correct, already-proven place to backfill any genuinely-missing field with a neutral default if ever needed, following its own documented convention ("every default is an empty/neutral value, never an invented fact").

## 12. QA plan (maps directly to the 8 tests requested)

| # | Test | How it will be verified |
|---|---|---|
| 1 | New Graphic Design project: title/client/year/services/description/typography/colors/3 images/custom section → Save → persists | Live round trip via the real admin API (same method used for every prior phase's QA), then confirmed via a fresh `GET` |
| 2 | New UI/UX project: problem/goals/research/persona/journey/UI screens/Figma URL/gallery → Save → public renders | Live round trip + fetch the resulting `/work/[slug]` HTML, confirm each field's text/link is present |
| 3 | New Branding project: strategy/logo concept/typography/colors/applications | Same pattern as #1/#2 |
| 4 | Upload image → Save → public image appears | Reuses the exact upload-verification method already proven in a prior phase (POST to `/api/admin/images`, confirm `next/image` optimizer serves it, confirm it appears in the saved project's public render) |
| 5 | Add custom section, reorder, verify public order | Save two sections, swap order via the move buttons, confirm the public page's DOM order matches |
| 6 | Change category, verify fields change but data isn't lost | Save a project with Graphic Design fields populated, `PUT` a category change alone, re-`GET`, confirm the old fields' *values* are still present in the JSON even though the new category's config no longer surfaces them in the admin UI |
| 7 | Delete draft, confirm it disappears from admin | `DELETE`, then confirm `GET /api/admin/projects` no longer lists it (same method already used in this session's diagnostic) |
| 8 | Gridmark regression | Snapshot `client`/`year`/`category`/`coverImage`/`thumbnail`/all 7 gallery images+order/`published` before and after, byte-compare |

All of this is **HTTP-level verification against the real running dev server**, the same method every prior phase in this project used — not a claim of browser/visual testing, which will be explicitly flagged as untested if browser automation remains unavailable when implementation happens.

---

# PART 2 — HOMEPAGE CMS

## 13. Current homepage architecture (audited section by section)

`src/app/page.tsx` composes, in order: `Hero`, `FeaturedWork`, `DesignerIntro`, `Services`, `CaseStudyPreview`, `GraphicDesignShowcase`, `UIUXShowcase`, `DesignProcess`, `AboutSkills`, `HiringCTA`, `ContactSection`.

| Section | Current source | Classification |
|---|---|---|
| **Hero** (eyebrow, headline, description, both CTAs) | `HeroContent` (`data/hero.json`, `/admin/hero`) — built in a prior phase | **A — already CMS-controlled** |
| Hero visual (featured-project tile grid + 1 fixed typography tile) | `getFeaturedProjects()` (each project's own `featured`+`coverImage`) + one hardcoded placeholder tile | **A for the project tiles** (already CMS-controlled via Projects) / **E for the typography tile** (a deliberate design signature piece, not project content — see §16) |
| FeaturedWork | `getFeaturedProjects()` | **A** |
| DesignerIntro (name, philosophy, facts, photo) | `AboutContent` (`/admin/about`) | **A** (photo fixed in a prior phase) |
| Services (3 cards: title + description) | `src/content/site.ts`'s static `services` array | **B — needs a CMS field** |
| CaseStudyPreview | `getCaseStudyPreviewProject()` | **A** |
| GraphicDesignShowcase / UIUXShowcase | `getProjectsByCategory()` | **A** |
| DesignProcess (4 steps: title + description) | `src/content/site.ts`'s static `process` array | **B — needs a CMS field** |
| AboutSkills | `AboutContent` | **A** |
| HiringCTA (headline text + button href) | Headline hardcoded in the component; button href from `HeroContent.secondaryCtaUrl` | **B for the headline text** (button target already **A**) |
| ContactSection | `ContactContent` (`/admin/contact`) | **A** |
| `SectionHeader` numbers/eyebrows ("01", "02", …) and each section's own descriptive subheading (e.g. "Brand systems, print, and editorial work — grouped by project, not by asset type.") | Hardcoded per component | **E — intentionally static design language**, not content an admin would plausibly want to A/B test independently of the section existing at all (see §16 for the line drawn here) |

**Global social/contact links**: already centralized, already admin-editable, already consumed by both the footer and both Contact surfaces — `SiteSettings.socialLinks`/`ContactContent.socialLinks` (shared list), `/admin/contact` and `/admin/settings`, `SocialLinksEditor`. This satisfies the "Homepage Social / Global Settings" requirement almost entirely already — nothing to build, confirmed by re-reading `SiteFooter.tsx`/`ContactSection.tsx`/`SocialLinksEditor.tsx`.

**Homepage media/upload**: already the same architecture as projects (`MediaField`, `/api/admin/images` POST) — `HeroContent` doesn't yet have an image field to exercise it (see §14), but no *new* upload mechanism is needed once one is added.

## 14. What's actually missing (the real gap, precisely scoped)

Re-reading the actual `Hero.tsx` composition: the "hero visual" is **not** a single banner image — it's a **live grid of the top 3 featured projects' cover images**, by explicit design (`Hero.tsx`'s own doc comment: *"reuses the actual coverImage from the top 3 featured projects rather than unrelated decorative tiles, so the hero reads as a preview of real work shown in full below it, not a disconnected illustration"*). There is **no single "hero banner image" placeholder box sitting idle waiting for an upload** — every image slot in the Hero is already either a real featured project's cover image or an honest, category-labeled placeholder (`PlaceholderMedia`) shown only when fewer than 3 projects are featured, which is the same placeholder pattern used everywhere else on the site when content doesn't exist yet.

This matters for the proposal: adding a generic "Hero Visual" single-image upload field, or a repeatable "visual tiles" array, would either (a) sit unused alongside the existing, working, intentional featured-project-grid system, or (b) require deciding whether it *replaces* that grid — which **would** be a visual redesign, explicitly out of scope. **Recommendation: do not add a new Hero image field.** Instead:

- The existing gap that *is* real: if fewer than 3 projects are marked Featured, the Hero shows generic category-labeled placeholders (`"brand-mark"`, `"ui-screen"`, `"campaign"`) rather than *nothing* or a deliberate fallback. This is already the sitewide "honest placeholder" convention working as designed, not a bug — flagged here only so it isn't mistaken for the "permanently hardcoded placeholder" problem described in the brief. The actual fix for "the Hero visual isn't fully admin-controlled" is: **mark more projects as Featured and set their Cover Images** (already fully possible today, in Projects) — not a new field.
- **Services and Process cards** (`B` in the table above) *are* the genuine "repeated cards with hardcoded text" gap — these should become the repeatable arrays the brief describes.

## 15. Proposed homepage schema

### 15a. `HeroContent` — extend, don't replace (already exists from a prior phase)

```ts
export interface HeroContent {
  eyebrow?: string;
  headline: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  visible?: boolean; // NEW — see below
}
```

`visible` (default `true`) is the one genuinely missing capability from the current `HeroContent`: a section-visibility toggle, mirrored on every other new repeatable item below. **No new image field is added here** — see §14's reasoning. If, after reviewing this document, a genuine single-banner-image use case is wanted instead of (or in addition to) the featured-project grid, that is a real visual-design decision this document deliberately does not make unilaterally — it would need its own explicit approval, not a silent addition.

### 15b. `services` and `process` become repeatable, admin-editable arrays

```ts
export interface HomepageCard {
  id: string;
  title: string;
  description: string;
  order: number;
  visible: boolean;
}
```

Two new persisted lists — `data/homepageServices.json`, `data/homepageProcess.json` (or one `data/homepage.json` holding both, see §15c) — each an array of `HomepageCard`, seeded once from `site.ts`'s current `services`/`process` constants (byte-identical first-load content, same seeding convention as every other CMS record in this project). Admin: add/edit/remove/reorder, same list-editor pattern already proven by `CustomSectionsEditor`/`SocialLinksEditor` (no new UI pattern invented).

### 15c. One `HomepageContent` record, or several — recommendation

Rather than one giant `data/homepage.json` (risking exactly the "unstructured mega-form" the brief warns against) or five totally separate files, recommend **grouping by what's already separately admin-owned**:

- `HeroContent` stays its own file/route (`/admin/hero`) — already built, already correct.
- **New**: `HomepageContent` (`data/homepage.json`, `/admin/homepage` or nested under Hero's nav area) holding `{ services: HomepageCard[], process: HomepageCard[] }` — the two genuinely-hardcoded repeatable sections. Deliberately **not** a catch-all for every homepage section, because Featured Work / Case Study Preview / Showcases / About / Contact are already correctly owned by Projects/About/Contact respectively — duplicating a "homepage" copy of content that already has a real home elsewhere is exactly the "parallel content system" both this brief and the CMS's established convention (`GalleryItem`'s own doc comment, `PORTFOLIO_CMS_ARCHITECTURE.md` §12) warn against.

### 15d. Global social/contact settings

Already correctly modeled (`AdminSocialLink[]`, shared between `/admin/contact` and `/admin/settings`) — **no schema change proposed here.** If per-item enable/disable (distinct from deleting the row) is wanted, that's one boolean field addition (`AdminSocialLink.visible?: boolean`, default `true` for existing rows) — small, optional, deferred until explicitly requested since deleting a row already achieves "remove" today.

## 16. Where the line is drawn — what stays intentionally static

Per the brief's own instruction (*"Do NOT blindly convert decorative elements into CMS fields... the goal is content control, not making every CSS element editable"*):

- `SectionHeader` numbers (`"01"`–`"09"`) and each section's short descriptive subheading (e.g. UIUXShowcase's "Product and interface work, shown with the problem behind it…") stay hardcoded. These read as **editorial/structural voice**, consistent sitewide, not "content" in the sense of facts that change (a client name, a headline claim) — turning ~15 of these into CMS fields for a marginal editing convenience would meaningfully grow the admin surface for content nobody asked to change independently. Flagged here explicitly as a **deliberate exclusion**, open to reconsideration if the user disagrees with this specific line.
- The Hero's one fixed "typography specimen" tile (`Hero.tsx`'s `typographyTile` constant) — an intentional brand/type-craft signature element by design, not a content slot (its own code comment: *"one standalone typography tile as the site's own type-craft signature piece"*). Not proposed as a CMS field.
- Every homepage section's *existence and order* (`page.tsx`'s composition) stays code-level — reordering/hiding entire sections is a materially different, larger feature (a page-builder) than what's being asked for here, and isn't implied by anything in the brief beyond the single `HeroContent.visible` toggle proposed in §15a.

## 17. Persistence flow (homepage)

Identical pattern to every other CMS record in this project — no new architecture:
```
Admin Homepage editor → saveHomepage() (lib/admin/store.ts) → PUT /api/admin/homepage
  → saveHomepageContent() (siteContentRepository.ts) → data/homepage.json
Services / DesignProcess components → getHomepageContent() → data/homepage.json
```

## 18. Admin editing flow

`/admin/homepage` (new nav entry, alongside the existing "Homepage Hero" entry — or the two could merge into one "Homepage" nav item with Hero/Services/Process as sub-sections; recommend keeping Hero as its own top-level nav item since it's already built and already well-scoped, and adding Services/Process as a second, clearly-named item — e.g. "Homepage Content" — rather than restructuring the already-working Hero page).

## 19. Public rendering flow

`Services.tsx`/`DesignProcess.tsx` become `async` Server Components reading `getHomepageContent()` instead of the static `site.ts` import — same one-line conversion already done for every other component in this project that made this exact jump (`DesignerIntro`, `AboutSkills`, `ContactSection`, `Hero`, `HiringCTA`). Only cards with `visible: true` render, sorted by `order`; `hasContent()`-equivalent guard (empty title/description) means a half-filled card doesn't render as a blank box.

## 20. Image upload flow (homepage)

No new upload flow — if/when a genuine homepage image field is approved (see §14's deferred recommendation), it uses the exact same `MediaField`/`POST /api/admin/images` path every other image field in this CMS already uses. This document does not propose a homepage-specific media system because none is needed.

## 21. Preview/publish behavior

Homepage content has no "unpublished" concept today (unlike Projects) — Site Settings, About, Contact, and Hero all save-and-go-live immediately, consistently. Recommend the same for the new `HomepageContent` record, for consistency, **rather than introducing drafts for only one part of the site** (which would be a bigger, inconsistent architecture change). If true homepage draft/preview is wanted, that's a real feature to scope deliberately across *all* site-wide content (Settings/About/Contact/Hero/Homepage alike), not bolted onto just the two new cards.

## 22. Migration strategy (homepage)

Byte-identical first-load content: `data/homepage.json` is seeded from the current literal `services`/`process` arrays in `site.ts`, exactly like every other `seed*()` function in `siteContentRepository.ts` already works. No visual change occurs the moment this ships; every card is immediately editable from that point on.

---

## 23. Summary — what this proposal does and does not do

**Does:** add `ProjectLinks`, widen `CustomSection`, make custom sections available to every project category, reuse the existing `deliverables` field for Graphic Design, fix the category-first creation flow and its slug-collision bug, add a small `HomepageContent` record for Services/Process cards, add a `visible` toggle to `HeroContent`.

**Does not:** touch Gridmark's data, change any visual design/typography/spacing/motion, replace the Hero's featured-project visual system with a new single-image field, build a page-builder, build a second media system, build a second persistence system, add authentication, or start any work beyond what's described above.

**Everything above is a proposal. No production code has been changed.** Awaiting approval before implementation.
