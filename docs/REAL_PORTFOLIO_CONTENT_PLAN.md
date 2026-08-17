# REAL_PORTFOLIO_CONTENT_PLAN.md

## Real Portfolio Content — Architecture Audit & Ingestion Plan

**Status:** Planning document only. No code written, no packages installed, no visual changes made, no production file modified, demo content untouched. This document is the deliverable for this task.

**Scope:** How to replace the 8 placeholder projects in `demo-projects.ts` with real graphic-design, branding, print, and UI/UX work — using the content architecture that already exists in this codebase. The admin dashboard and database are explicitly out of scope (see §10).

---

## 0. Headline finding: most of this was already built

Before auditing further, the most important finding is this: **a content-ingestion system already exists and is more complete than a typical "content plan" starts from.** Three docs and one file already define almost everything requested in this task:

- `docs/CONTENT_GUIDE.md` — full workflow, image specs table, per-category content checklist, "do not fabricate" rules.
- `src/content/README.md` — the exact one-line switch that moves the whole site from demo to real data.
- `public/images/projects/README.md` + `_example-project/` — the folder convention, mapped 1:1 to schema fields.
- `src/content/real-projects.ts` — an empty array with a full commented template matching `src/types/project.ts` field-for-field, ready to copy per project.

This plan's job is therefore **audit, verify, and fill the specific gaps this task asked about** (image dimensions by placement, mandatory-vs-optional broken out explicitly, published/draft behavior, what changes with the Admin Dashboard) — not invent a parallel system. Every claim below was checked against the actual component code, not just against what the existing docs assert.

---

## 1. Required image fields — every project

From `src/types/project.ts`'s `Project` and `CaseStudy` interfaces:

| Field | Type | Required? | Fallback if omitted |
|---|---|---|---|
| `coverImage` | `CoverMedia` | **Required** | None — every project needs one |
| `thumbnail` | `CoverMedia` | Optional | Falls back to `coverImage` on cards |
| `gallery` | `CoverMedia[]` | Required key, but empty array is valid | Gallery section on the detail page simply doesn't render (`ProjectDetailPage` checks `project.gallery.length > 0`) |
| `caseStudy.wireframes` | `CoverMedia[]` | Optional | Stage omitted |
| `caseStudy.finalDesign` | `CoverMedia[]` | Optional | Stage omitted |
| `caseStudy.moodboard` | `CoverMedia[]` | Optional | Stage omitted |
| `caseStudy.logo` | `CoverMedia[]` | Optional | Stage omitted |
| `caseStudy.applications` | `CoverMedia[]` | Optional | Stage omitted |
| `caseStudy.exploration` | `CoverMedia[]` | Optional | Stage omitted |

Every `CoverMedia` entry (whether `coverImage`, `thumbnail`, or an item inside any array above) requires `alt` — this is enforced by TypeScript at compile time (`CoverMedia`'s `image` and `placeholder` variants both require `alt: string`), not just documented as a convention. You cannot ship an image without alt text; the project won't type-check.

`objectPosition` is optional per image — only needed when the default center-crop would cut off something that matters (most commonly: a portrait mobile screenshot placed in a landscape gallery tile — see §5).

---

## 2. Fields required per category

All `caseStudy` fields beyond `overview`/`outcome` are optional at the type level (§4 below) — "required per category" here means **which fields `ProjectStory.tsx` actually renders into that category's narrative**, verified directly against `categoryStages()`'s switch statement:

### Graphic Design
Renders, in order (only stages with content show): Constraint → Context → Objective (`goals`) → Concept → Design Direction → Exploration (gallery) → Final Design (gallery) → Applications (gallery) → Reflection → Outcome.
**Practically load-bearing:** `goals` (renders as "Objective"), `finalDesign` or `exploration` (a Graphic Design case study with zero images is a thin page), `applications`.

### Branding
Renders: Constraint → Context → Research → Brand Strategy (`designDirection`) → Concept → Logo (gallery) → Typography → Color (`colorSystem`) → Applications (gallery) → Reflection → Outcome.
**Practically load-bearing:** `logo` (gallery), `applications` (gallery) — a branding case study is weak without seeing the mark and its real-world use.

### UI/UX
Renders: Constraint → Problem → Research (+ `researchMethods` as a chip list) → Insights → User Journey → Information Architecture → Wireframes (gallery) → Design Direction → UI (renders `finalDesign` under the label "UI") → Testing → Reflection → Outcome.
**Practically load-bearing:** `problem`, `finalDesign` (the actual screens) — CONTENT_GUIDE.md's checklist calls this out as the same field as "Final Design," not a duplicate.

### UX Research / Web Design / Editorial / Campaign
These four categories exist in `PROJECT_CATEGORIES` (`src/types/project.ts`) and are real, filterable Work-page categories, but **have no dedicated narrative flow** — `ProjectStory.tsx`'s `default` branch renders a generic ordering covering every possible field (Context → Problem → Goals → Research → Insights → User Journey → IA → Concept → Design Direction → Wireframes → Typography → Color → Logo → Exploration → Final Design → Applications → Testing → Reflection → Outcome). Any of these four categories will render correctly with whatever subset of fields you provide — there's no category-specific checklist to write here beyond CONTENT_GUIDE.md's existing per-category sections (pick whichever fields make sense for the actual work).

---

## 3. Mandatory vs. optional case-study fields

At the type level (`src/types/project.ts`'s `CaseStudy` interface), exactly **two** fields are non-optional:

- `overview: string` — required. Pulled by `CaseStudyPreview` (homepage) and used as the fallback for `UIUXShowcase`'s "Problem" line when `problem` is absent.
- `outcome: string` — required. Rendered by every category's `OutcomeBlock` unconditionally — this is the one section that always appears on every case study.

**Every other `caseStudy` field is optional**, including `problem`, `context`, `constraint`, `goals`, `research`, `researchMethods`, `insights`, `userJourney`, `informationArchitecture`, `wireframes`, `designDirection`, `designSystem`, `finalDesign`, `testing`, `reflection`, `moodboard`, `concept`, `typography`, `colorSystem`, `logo`, `applications`, `exploration`. `ProjectStory.tsx`'s `hasContent()` filter means an absent field never renders an empty section, heading, or placeholder box — confirmed by reading the filter logic directly, not just the docs' claim.

At the `Project` level, only `id`, `title`, `slug`, `category`, `projectType`, `year`, `role`, `shortDescription`, `coverImage`, `gallery` (can be `[]`), `featured`, `published`, `tags`, `tools`, `services`, `order`, and `caseStudy` are required. `client`, `description`, `thumbnail`, `featuredOrder`, and `projectUrl` are optional.

---

## 4. Recommended image dimensions/aspect ratios by placement

CONTENT_GUIDE.md §2 already documents this by **image type** (cover/thumbnail/gallery/etc.) with source resolution, format, and file-size targets — that table is accurate and this plan doesn't repeat it. What's added here is the mapping from **placement** (what this task asked for) to the actual `ASPECT` constant each placement uses, verified against every consuming component (`src/content/media.ts` + each component's `aspectRatio` prop):

| Placement | Component | Aspect ratio used | Notes |
|---|---|---|---|
| **Homepage hero** (top of page) | `Hero.tsx` | Mobile: `card` (4:3). Tablet: `card` ×2. Desktop: primary tile is `auto` (fills a `row-span-2` grid cell — supply a generously tall source), secondary tile `square` (1:1), bottom tile `wide` (21:9) | Pulls from the top 3 `featuredOrder` projects' `coverImage` directly — no separate "hero image" field exists |
| **Featured Work — primary card** | `ProjectCard` (`variant="primary"`) | `wide` (21:9), `radius-lg` | The `featuredOrder: 1` project |
| **Featured Work — secondary cards** | `ProjectCard` (default) | `card` (4:3), `radius-md` | Same ratio as every standard project card sitewide |
| **Work page — lead card** | `WorkGrid` | `wide` (21:9) via primary variant | Top-ranked featured project |
| **Work page — medium tier** | `WorkGrid` | `tall` (3:4) if 2 medium projects, `wide` (21:9) if only 1 | |
| **Work page — standard grid cards** | `ProjectGrid` → `ProjectCard` | `card` (4:3) | Same component/ratio as Featured Work's secondary cards |
| **Category showcase — Graphic Design lead** | `GraphicDesignShowcase` | `tall` (3:4), `radius-lg` | Portrait-oriented lead treatment |
| **Category showcase — UI/UX rows** | `UIUXShowcase` | `wide` (21:9), `radius-lg` | |
| **Project detail hero** | `ProjectHero` | `spotlight` (21:9), `radius-lg` | Same ratio as the homepage Case Study Preview spotlight |
| **Gallery — `layout: "full"`** | `CaseStudyGallery` | `galleryFull` (16:9) | Deliberately gentler than 21:9 — CONTENT_GUIDE.md notes a full-width gallery shot reads better at a standard photographic ratio than a banner ratio |
| **Gallery — `layout: "half"`** (default) | `CaseStudyGallery` | `card` (4:3) | |
| **Gallery — `layout: "third"`** | `CaseStudyGallery` | `square` (1:1) | Desktop-only tier — collapses to `half`-equivalent width on tablet |
| **UI screens** (`wireframes`/`finalDesign` on UI/UX projects) | Same `CaseStudyGallery` machinery via `CaseStudyGallerySection` | Whichever `layout` you assign per image | Supply screenshots at native resolution (desktop ~16:9, mobile ~9:19.5 portrait) and let the frame crop — **for a portrait mobile screenshot, set `objectPosition: "top"`**, or the default center-crop cuts off the top of the screen, not the bottom |
| **Branding applications** (`applications`, `logo`) | Same `CaseStudyGallery` machinery | Whichever `layout` fits the mockup's natural composition | CONTENT_GUIDE.md recommends 2400×1800 (4:3, matches `half`) or 2000×2000 (1:1, matches `third`) source depending on the shot |

**The underlying mechanism, confirmed by reading `PortfolioMedia.tsx`:** every image renders inside a fixed-`aspectRatio` frame with `object-fit: cover`. The frame's ratio is fixed by the *placement*, not the source file — so exact pixel-perfect source cropping is never required, only a generously-sized source roughly matching the frame's orientation (landscape source for landscape frames, etc.), per CONTENT_GUIDE.md §2.

---

## 5. Recommended folder structure for portfolio assets

Already fully defined and present in the repo — `public/images/projects/README.md` plus the working example at `public/images/projects/_example-project/`:

```
public/images/projects/
  <project-slug>/                  <- must exactly match Project.slug
    cover.jpg                      -> Project.coverImage
    thumbnail.jpg                  -> Project.thumbnail
    gallery/
      01.jpg                       -> Project.gallery[0]
      02.jpg                       -> Project.gallery[1]
    case-study/
      wireframes/                  -> Project.caseStudy.wireframes[]
      moodboard/                   -> Project.caseStudy.moodboard[]
      logo/                        -> Project.caseStudy.logo[]
      applications/                -> Project.caseStudy.applications[]
      final-design/                -> Project.caseStudy.finalDesign[]
      exploration/                 -> Project.caseStudy.exploration[]
```

**Confirmed accurate against the schema**: every subfolder name maps 1:1 to a `CaseStudy` field that takes a `CoverMedia[]`. **Only create the subfolders a given project actually uses** — a Graphic Design project might need only `exploration/` + `final-design/`; a Branding project only `logo/` + `moodboard/` + `applications/`. Nothing in the code reads a folder that isn't referenced by that project's data — this was verified by checking `PortfolioMedia`, which only ever receives whatever `src` string the content file gives it; there's no directory-scanning anywhere.

---

## 6. Naming convention for images

Consolidated from CONTENT_GUIDE.md §2's per-row naming column:

| File | Convention |
|---|---|
| Cover | `cover.jpg` |
| Thumbnail | `thumbnail.jpg` |
| Gallery | `gallery/01.jpg`, `02.jpg`, … — sequential, matching array order |
| UI screenshots (desktop) | `case-study/final-design/desktop-01.png` (PNG — crisp UI edges/text) |
| UI screenshots (mobile) | `case-study/final-design/mobile-01.png` |
| Branding applications | `case-study/applications/tote-bag.jpg` — **descriptive, not numbered** (CONTENT_GUIDE.md is explicit that these vary too much for `01.jpg`-style naming to stay meaningful) |
| Everything else in `case-study/<field>/` | `01.jpg`, `02.jpg`, … sequential; PNG instead of JPG only when the source has sharp vector edges (logo marks, wireframes) |

Format rule: JPG for photos/mockups/renders, PNG for anything with hard vector edges (logos, wireframe line art, UI screenshots with small text). File-size targets range ≤200KB (thumbnail) to ≤500KB (desktop UI screenshot) — see CONTENT_GUIDE.md §2's full table; `next/image` re-encodes to WebP/AVIF and resizes per-device automatically, so these targets are about the source file, not what ships to a browser.

---

## 7. How to add a new real project without modifying components

**Verified, not assumed** — I grepped every file under `src/components` and `src/app` for any import of `demo-projects` or `real-projects` directly. Exactly one file touches `demo-projects` at all (`ProjectHero.tsx`, and only to read the already-abstracted `usingDemoData` boolean from `projects.ts` — not the raw data). Every other project-consuming component (`Hero`, `FeaturedWork`, `GraphicDesignShowcase`, `UIUXShowcase`, `CaseStudyPreview`, `ProjectNavigation`, the Work page, the project detail page) imports only from `@/content/projects` — `featuredProjects`, `publishedProjects`, `projectsByCategory()`, or `getCaseStudyPreviewProject()`, all of which are derived, memoized-at-module-load selectors over a single `projects` array. **The workflow genuinely requires zero component edits:**

1. Write the project's content (§2/§3 above + CONTENT_GUIDE.md's checklist).
2. Prepare and place images per §5/§6.
3. Copy the commented template in `src/content/real-projects.ts`, fill it in, delete unused optional `caseStudy` fields, add it to the `realProjects` array.
4. Leave `published: false` until it's ready — the project can exist in the file, fully typed, without appearing anywhere on the live site.
5. **Only when ready to go live sitewide**, flip the one switch in `src/content/projects.ts` (§9 below covers exactly when this should happen).

---

## 8. How published/draft projects currently behave

Traced directly through the code (`projects.ts`, `WorkGrid.tsx`, `work/[slug]/page.tsx`, category showcase components):

- **`publishedProjects`** = `projects.filter(p => p.published)`, sorted by `order`. Every listing surface (`Hero`, Work page, category showcases, `ProjectNavigation`) reads from this or a further-filtered derivative — a `published: false` project is invisible everywhere.
- **The project detail route itself doesn't exist for an unpublished project.** `generateStaticParams()` in `work/[slug]/page.tsx` maps only `publishedProjects`, and `getProject(slug)` also searches only `publishedProjects`. This means visiting `/work/<draft-slug>` directly returns a real 404 (via `notFound()`) — **there is currently no preview/draft-view capability at all.** `published: false` is a hard hide, not a "visible only with a special link" state. Worth knowing before writing a project up in stages: nothing about it is reachable until you flip it to `true`.
- **`featured` + `featuredOrder`** control the homepage `Hero`'s top-3 tiles and `FeaturedWork`'s primary/secondary split — `featuredOrder` only matters when `featured: true`; ordering among non-featured projects uses the separate `order` field.
- **Category showcase sections silently disappear when empty.** `GraphicDesignShowcase` and `UIUXShowcase` both `return null` if `projectsByCategory(...)` comes back empty — so publishing zero UI/UX projects, for instance, simply removes that homepage section rather than rendering it empty. Same pattern extends naturally to any of the 7 categories.
- **The Work page's empty state is a real, designed state, not a blank page** — `WorkGrid`'s `EmptyState` (DESIGN_SYSTEM.md §14's documented pattern) shows "No {category} projects published yet — check back soon" plus a link back to "All" when a category filter matches zero published projects.
- **`ProjectNavigation`'s prev/next wraps within `publishedProjects` only** — draft projects are never a "next project" target, and the wrap means there's always a next/prev even at the ends of the published list.
- **Partial rollout is fully supported today**: you can have 3 published real projects and 5 drafts sitting in `real-projects.ts` simultaneously, and the published 3 behave exactly as if they were the only projects that existed.

---

## 9. What can remain optional

Directly from §4 plus practical framing from CONTENT_GUIDE.md's "do not fabricate" section:

- `client` — omit entirely for personal/unpublished/NDA'd work (the field is optional; `ProjectOverview` simply drops that grid cell).
- `description` — falls back to `shortDescription` on the detail page hero.
- `thumbnail` — falls back to `coverImage` on every card.
- `gallery` — empty array is valid; the gallery section just doesn't render.
- `projectUrl` — omit if nothing shipped publicly.
- `featuredOrder` — only meaningful when `featured: true`.
- Every `caseStudy` field except `overview`/`outcome` (§4) — and per CONTENT_GUIDE.md, explicitly **delete rather than pad**: a shorter, honest case study renders correctly; a field filled with filler doesn't get rewarded with a nicer layout.
- **Never invent to fill a gap** — no fabricated client names, metrics, or outcomes. An honest process-based outcome ("shipped, client adopted it") is treated as equally valid to a metric-based one, per CONTENT_GUIDE.md and this session's standing instruction not to invent content.

---

## 10. What changes later, when the Admin Dashboard is introduced

PROJECT_SPEC.md §9 defines the target CMS requirements (dashboard, project list, structured project editor, draft/published toggle, featured toggle + ordering, media library, required-field validation on publish). Comparing that against what exists today:

- **The schema is already CMS-shaped.** `src/types/project.ts` *is* the content model PROJECT_SPEC.md §9 describes — the Admin Dashboard's job will be to produce/edit data in this same shape, not to redesign it. Nothing here needs to change when that work starts.
- **The current manual-TS-file workflow is, functionally, a hand-operated v0 CMS** — a human plays the role of "save button" by editing `real-projects.ts` directly. The Admin Dashboard replaces *that authoring mechanism* (likely backed by a real database per PROJECT_SPEC.md §8's Sanity/Payload note — still an open, undecided choice, correctly out of scope for this task) — it does not replace the rendering layer, which already reads through the same `projects.ts` selectors regardless of where the data originates.
- **Required-field validation partially already exists, and is stronger than typical CMS validation**: `alt` text is enforced by TypeScript at compile time today (§1) — a project literally cannot be added without it. PROJECT_SPEC.md §9 asks for "alt text and outcome statement cannot be empty on publish" as an admin-side validation rule; `alt` is already unconditionally guaranteed, and `outcome` is already a required field on the `CaseStudy` type. The Admin Dashboard mainly needs to add validation for fields TypeScript can't currently guard because they're legitimately optional and content-dependent (e.g., preventing a *publish* with zero images at all, which is presently allowed and just renders sparsely).
- **Real draft-preview will need new work**: today, `published: false` means no route exists at all (§8) — there's no "preview as draft" link. A dashboard implies wanting to review a project before flipping it live; that requires either a preview mode/route or relaxing `generateStaticParams`/`getProject` to include drafts behind an auth check — a genuine new capability, not present today.
- **Media upload UI is new work** — today, "upload" means placing a file in `public/images/projects/<slug>/` by hand. A CMS-backed media library (§9's requirement) is a different asset-storage model entirely (likely CDN-backed per PROJECT_SPEC.md §8) and would probably retire the local `public/images/projects/` convention in favor of the CMS's own asset URLs — at that point, `CoverMedia`'s `image.src` field just points elsewhere; `PortfolioMedia` doesn't care where the string points.
- **Dashboard counts, recent activity, single-user auth** — all net-new, nothing in the current architecture provides any of this.

**Net effect for this content-ingestion phase:** proceed with the manual `real-projects.ts` workflow now — it is not throwaway work. Every project written this way slots into the future CMS/database with the same shape; the only things that change later are *how* the data gets in (typed TS file → admin form/database) and *where* images live (local folder → CDN), not the shape of the data or any component.

---

## 11. Other findings worth flagging (not fixed — out of scope for this task)

Two pre-existing issues surfaced during this audit that are relevant to the real-content switch but are **not addressed here**, per this task's no-code-changes constraint:

1. **`CaseStudyPreview.tsx` hardcodes the "Sample project" label**, unlike `ProjectHero.tsx` (which correctly gates the same label behind the `usingDemoData` flag). Line: `<p className="text-label">{project.category} · Sample project</p>` — no `usingDemoData` check, no import of it at all. **If the demo→real switch (§9's step 5 in `projects.ts`) happens without also fixing this one line, the homepage's Case Study Preview section will permanently display "· Sample project" next to a real client's spotlighted case study.** This is a one-line fix (mirror `ProjectHero.tsx`'s pattern) that should happen in the same change as the data switch — flagged here so it isn't missed, not fixed in this pass.
2. **The site nav's "About" link (`href: "/about"` in `site.ts`) points to a route that doesn't exist** — there's no `src/app/about/page.tsx`. `/contact` similarly isn't a real route (Contact is a homepage anchor section, `#contact`). This predates this task and is unrelated to project-content ingestion; noted only because it surfaced while auditing the content architecture.

---

## Summary

### Files created
- `docs/REAL_PORTFOLIO_CONTENT_PLAN.md` (this document) — the only file touched.

### Files modified
None.

### Architecture findings
- A complete content-ingestion system already exists (`CONTENT_GUIDE.md`, `real-projects.ts` template, `public/images/projects/` convention) and is accurate — verified against actual component code, not just trusted at face value.
- Every project-consuming component reads only through `@/content/projects`'s derived selectors; zero components need to change to add real projects or to switch from demo to real data.
- `published: false` is a hard hide today — no route exists at all for a draft project (no preview capability yet).
- Only `overview` and `outcome` are truly mandatory `caseStudy` fields at the type level; category "requirements" (§2) are about what a category's narrative actually renders, not compiler-enforced.
- `alt` text is already compiler-enforced on every image — stronger than the PROJECT_SPEC.md §9 CMS validation requirement asks for.
- Found one real bug relevant to the upcoming switch: `CaseStudyPreview.tsx`'s hardcoded "Sample project" label isn't gated by `usingDemoData` (§11) — needs a one-line fix in the same change that performs the data switch.

### Recommended asset structure
```
public/images/projects/<project-slug>/
  cover.jpg
  thumbnail.jpg
  gallery/01.jpg, 02.jpg, …
  case-study/
    wireframes/ | moodboard/ | logo/ | applications/ | final-design/ | exploration/
    (only the subfolders that project actually uses)
```
Already implemented and documented in the repo (`public/images/projects/README.md`, `_example-project/`) — no changes needed, just follow it.

### Exact workflow for your first real project
1. Pick one project and gather its assets — cover + thumbnail at minimum (§1, §5, §6 for exact specs/naming).
2. Write its content using CONTENT_GUIDE.md's checklist for its category, filtered through §2/§3/§4 above for what's actually mandatory vs. what to skip rather than pad.
3. Create `public/images/projects/<slug>/` and place images per §5/§6.
4. Copy the commented template block in `src/content/real-projects.ts`, fill it in, delete unused optional fields, set `published: false` initially.
5. Review it — nothing is live yet; the route doesn't exist while `published: false` (§8).
6. When ready to go live: flip that one project's `published` to `true`, and **in the same change**, apply the one-line `CaseStudyPreview.tsx` fix from §11 and perform the `projects.ts` import switch from `demo-projects` to `real-projects` (§7/§9) — this last step is a code change and, per this session's standing process, should go through the same explicit-approval flow as the ContactSection integration did, not happen silently inside a "content" commit.

---

*This document is a plan only. No production code was written, no packages were installed, and no demo content was modified or deleted.*
