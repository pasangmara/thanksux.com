# CMS_CONTENT_MODEL.md

## Phase B — Content Model & Dynamic Category System

**Status:** Schema and documentation only. `demo-projects.ts` and `real-projects.ts` were not modified — Gridmark's actual content is untouched, and no fake content was invented anywhere. Every field added below is optional (except where explicitly noted as already-required at the type level: `caseStudy.overview`, `caseStudy.outcome`), so every existing project continues to compile and render exactly as before. Verified by a clean `npm run lint`, `npm run build`, and `tsc --noEmit` pass — see §16/§17-adjacent QA note at the end of this document.

---

## 1. Canonical category list

Resolved in `src/types/project.ts`. Eight canonical, user-facing categories — one source of truth, exported as `CanonicalProjectCategory` (the type) and `PROJECT_CATEGORIES` (the ordered array every filter/select reads from):

| # | Internal value (`Project.category`) | Display name (`CATEGORY_CONFIG[x].displayName`) |
|---|---|---|
| 1 | `"UI/UX"` | UI/UX Design |
| 2 | `"Branding"` | Branding |
| 3 | `"Graphic Design"` | Graphic Design |
| 4 | `"Web Design"` | Web Design |
| 5 | `"Digital Marketing"` | Digital Marketing |
| 6 | `"Social Media Design"` | Social Media Design |
| 7 | `"Print Design"` | Print Design |
| 8 | `"Custom"` | Custom |

Every internal value doubles as its own display name **except** `"UI/UX"`, whose clean display name is `"UI/UX Design"`. This one exception exists so the internal value — and therefore every existing project's `category: "UI/UX"`, every `/work?category=UI%2FUX` URL, and `projectsByCategory("UI/UX")` call — never had to change. `getCategoryDisplayName(category)` (`src/types/category-config.ts`) is the one place that resolves internal → display; nothing else should hand-write this mapping.

---

## 2. Category mapping — what changed and why

**Before this phase**, `ProjectCategory` had 7 values: `"Graphic Design" | "Branding" | "UI/UX" | "Web Design" | "UX Research" | "Editorial" | "Campaign"`. Verified by grep across `src/content/**`: only 3 of those 7 were ever actually used by real or demo data — `"Branding"` (Gridmark, the one real project), `"UI/UX"`, and `"Graphic Design"` (demo projects only). `"Web Design"`, `"UX Research"`, `"Editorial"`, and `"Campaign"` were declared in the type but never assigned to any project.

**This phase's resolution:**
- `"Branding"`, `"Graphic Design"`, `"Web Design"` — kept exactly as-is (already matched the requested canonical names).
- `"UI/UX"` — kept as the internal value; `"UI/UX Design"` added as its display name only (see §1). **Not** renamed to `"UI/UX Design"` internally — that would have been a breaking/destructive change to Gridmark-adjacent data, every `projectsByCategory("UI/UX")` call site, and every existing `/work?category=` link.
- `"Digital Marketing"`, `"Social Media Design"`, `"Print Design"`, `"Custom"` — new canonical values, added to `CanonicalProjectCategory`. No project uses them yet; adding them is purely additive.
- `"UX Research"`, `"Editorial"`, `"Campaign"` — moved to a new `LegacyProjectCategory` type, still part of the overall `ProjectCategory` union (so nothing referencing them would fail to compile — though grep confirms nothing does), but **excluded** from `PROJECT_CATEGORIES`/`CATEGORY_CONFIG`. They no longer appear as a filter chip or an admin category choice. Not deleted outright: deleting a compiling, harmless union member for zero functional benefit is the kind of needless churn this phase was told to avoid. A future phase can remove them outright once it's confirmed nothing anywhere (including any external references) still expects them.

**One source of truth, concretely:**
- `ProjectCategory` / `CanonicalProjectCategory` / `LegacyProjectCategory` / `PROJECT_CATEGORIES` — all defined once, in `src/types/project.ts`.
- `CATEGORY_CONFIG` — defined once, in `src/types/category-config.ts`, typed as `Record<CanonicalProjectCategory, CategoryConfig>` (so TypeScript itself enforces that all 8 — and only those 8 — have a config; nothing can silently be missing or duplicated).
- The public `CategoryFilter.tsx` and the admin category `<select>` both already read `PROJECT_CATEGORIES` from `@/types/project` (confirmed by reading both files) — neither hardcodes its own category list, so both automatically reflect the canonical 8 with zero component changes required in this phase.

**Deliberately not done in this phase:** the public `CategoryFilter.tsx` chip still renders the raw internal value as its visible label (so the `"UI/UX"` chip currently reads "UI/UX", not "UI/UX Design") — wiring `getCategoryDisplayName()` into that chip's rendered text is a small, safe follow-up left for a deliberate future pass rather than bundled silently into a content-model phase; see §17.

---

## 3. Common project fields

Every project needs these regardless of category (`src/types/category-config.ts`'s `COMMON_FIELDS`). No change to `Project`'s shape was needed — every one of these already existed:

| Field | Storage location | Required |
|---|---|---|
| `id` | `Project.id` | Yes |
| `slug` | `Project.slug` | Yes |
| `title` | `Project.title` | Yes |
| `category` | `Project.category` | Yes |
| `year` | `Project.year` | Yes |
| `client` | `Project.client` | No |
| `role` | `Project.role` | Yes |
| `shortDescription` | `Project.shortDescription` | Yes |
| `overview` | **`Project.caseStudy.overview`** | Yes |
| `challenge` | `Project.caseStudy.challenge` *(new, §9)* | No |
| `outcome` | **`Project.caseStudy.outcome`** | Yes |
| `services` | `Project.services` | No (empty array valid) |
| `tools` | `Project.tools` | No (empty array valid) |
| `tags` | `Project.tags` | No (empty array valid) |
| `featured` | `Project.featured` | Yes |
| `published` | `Project.published` | Yes |
| `order` | `Project.order` | Yes |

**Important note, carried forward from `PORTFOLIO_CMS_ARCHITECTURE.md` §0 finding 7 (not fixed here, deliberately):** `overview` and `outcome` are conceptually "every project has one" but are actually stored on `Project.caseStudy`, not on `Project` itself. This phase documents that mismatch rather than silently relocating the fields — moving them would touch every real/demo project object, `CaseStudyPreview.tsx`, `ProjectHero.tsx`, and the admin editor's save path, which is exactly the kind of destructive restructuring this phase was told not to do for a schema question nobody asked to have resolved yet.

`Project` also still carries a few fields outside the requested common list that nothing above should be read as removing: `projectType` (free text), `description` (optional longer hero paragraph), `coverImage`/`thumbnail`/`gallery` (media — see §11), `featuredOrder`, `projectUrl`.

---

## 4. UI/UX Design fields

`CATEGORY_CONFIG["UI/UX"]`. All optional except `overview`/`outcome`.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| overview | `caseStudy.overview` | textarea | Required |
| problem | `caseStudy.problem` | textarea | |
| goal | `caseStudy.goals` | tags | Existing field, plural array |
| research | `caseStudy.research` | textarea | |
| researchMethods | `caseStudy.researchMethods` | tags | |
| userInsights | `caseStudy.insights` | textarea | Reuses the existing `insights` field |
| userPersona | `caseStudy.userPersona` | textarea | **New field** |
| userJourney | `caseStudy.userJourney` | textarea | |
| painPoints | `caseStudy.painPoints` | textarea | **New field** |
| informationArchitecture | `caseStudy.informationArchitecture` | textarea | |
| userFlow | `caseStudy.userJourney` | textarea | Same concept as User Journey — one field, not a duplicate |
| wireframes | `caseStudy.wireframes` | gallery | |
| designSystem | `caseStudy.designSystem` | textarea | |
| uiDesign | `caseStudy.finalDesign` | gallery | Renders publicly as "UI" — see `relabelForCategory` |
| prototype | `caseStudy.prototype` | url | **New field** — link to an interactive prototype |
| usabilityTesting | `caseStudy.testing` | textarea | Reuses the existing `testing` field |
| iterations | `caseStudy.iterations` | textarea | **New field** |
| finalSolution | `caseStudy.finalSolution` | textarea | **New field** — distinct from the `uiDesign`/`finalDesign` screens gallery |
| outcome | `caseStudy.outcome` | textarea | Required |
| reflection | `caseStudy.reflection` | textarea | |
| tools | `Project.tools` | tags | Project-level, not case-study |

---

## 5. Branding fields

`CATEGORY_CONFIG.Branding`. Gridmark's real data uses `overview`, `outcome`, `constraint`, `designDirection`, `concept`, `typography`, `colorSystem`, `reflection` — every one of those fields is unchanged, so **Gridmark's content required zero edits and still compiles/renders identically.**

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| brandOverview | `caseStudy.overview` | textarea | Required |
| challenge | `caseStudy.challenge` | textarea | **New field** |
| brandStrategy | `caseStudy.designDirection` | textarea | Exact existing field — already labeled "Brand Strategy" for Branding today |
| targetAudience | `caseStudy.targetAudience` | textarea | **New field**, shared with Web Design/Digital Marketing/Social Media Design |
| positioning | `caseStudy.positioning` | textarea | **New field** |
| concept | `caseStudy.concept` | textarea | Existing field ("the idea behind the mark") — doubles as "Logo Concept" |
| logoConcept | `caseStudy.concept` | textarea | Same field as `concept` above, not a duplicate |
| logoConstruction | `caseStudy.logoConstruction` | textarea | **New field** |
| gridGeometry | `caseStudy.gridGeometry` | textarea | **New field**, shared with Graphic Design's "grid" |
| typography | `caseStudy.typography` | textarea | Existing field |
| colorSystem | `caseStudy.colorSystem` | textarea | Existing field |
| visualIdentity | `caseStudy.visualIdentity` | textarea | **New field** |
| brandApplications | `caseStudy.applications` | gallery | Existing field |
| brandGuidelines | `caseStudy.brandGuidelines` | gallery | **New field** — kept distinct from `applications`/`logo` |
| outcome | `caseStudy.outcome` | textarea | Required |
| reflection | `caseStudy.reflection` | textarea | Existing field |
| tools | `Project.tools` | tags | Project-level |

---

## 6. Graphic Design fields

`CATEGORY_CONFIG["Graphic Design"]`.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| designBrief | `caseStudy.context` | textarea | Reuses the existing `context` field |
| clientRequirement | `caseStudy.clientRequirement` | textarea | **New field** |
| designObjective | `caseStudy.goals` | tags | Existing field — already labeled "Objective" for this category |
| creativeDirection | `caseStudy.creativeDirection` | textarea | **New field**, shared with Digital Marketing/Social Media Design |
| concept | `caseStudy.concept` | textarea | Existing field |
| designProcess | `caseStudy.designProcess` | textarea | **New field** |
| typography | `caseStudy.typography` | textarea | Existing field |
| colorPalette | `caseStudy.colorSystem` | textarea | Reuses the existing `colorSystem` field |
| composition | `caseStudy.composition` | textarea | **New field** |
| grid | `caseStudy.gridGeometry` | textarea | **New field**, shared with Branding's "Grid / Geometry" |
| software | `Project.tools` | tags | Reuses the project-level `tools` field |
| finalDesign | `caseStudy.finalDesign` | gallery | Existing field |
| applications | `caseStudy.applications` | gallery | Existing field |
| outcome | `caseStudy.outcome` | textarea | Required |
| reflection | `caseStudy.reflection` | textarea | Existing field |

---

## 7. Web Design fields

`CATEGORY_CONFIG["Web Design"]`.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| projectOverview | `caseStudy.overview` | textarea | Required |
| businessGoal | `caseStudy.businessGoal` | textarea | **New field**, shared with Digital Marketing's "Business Objective" |
| targetAudience | `caseStudy.targetAudience` | textarea | Shared field, added in §5 |
| uxStrategy | `caseStudy.uxStrategy` | textarea | **New field** |
| informationArchitecture | `caseStudy.informationArchitecture` | textarea | Existing field |
| sitemap | `caseStudy.sitemap` | textarea | **New field** |
| wireframes | `caseStudy.wireframes` | gallery | Existing field |
| uiDirection | `caseStudy.designDirection` | textarea | Reuses the shared `designDirection` field, relabeled "UI Direction" for this category |
| designSystem | `caseStudy.designSystem` | textarea | Existing field |
| responsiveStrategy | `caseStudy.responsiveStrategy` | textarea | **New field** |
| prototype | `caseStudy.prototype` | url | Shared field, added in §4 |
| development | `caseStudy.development` | textarea | **New field** |
| outcome | `caseStudy.outcome` | textarea | Required |
| reflection | `caseStudy.reflection` | textarea | Existing field |
| tools | `Project.tools` | tags | Project-level |

---

## 8. Digital Marketing fields

`CATEGORY_CONFIG["Digital Marketing"]`. **No performance metrics were invented anywhere in this schema.** See §12 for the metrics field's exact, deliberately-inert design.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| campaignOverview | `caseStudy.overview` | textarea | Required |
| businessObjective | `caseStudy.businessGoal` | textarea | Shared field, added in §7 |
| targetAudience | `caseStudy.targetAudience` | textarea | Shared field |
| marketingStrategy | `caseStudy.marketingStrategy` | textarea | **New field** |
| campaignConcept | `caseStudy.concept` | textarea | Reuses the existing `concept` field |
| contentStrategy | `caseStudy.contentStrategy` | textarea | **New field**, shared with Social Media Design |
| channels | `caseStudy.channels` | tags | **New field** |
| adStrategy | `caseStudy.adStrategy` | textarea | **New field** |
| funnel | `caseStudy.funnel` | textarea | **New field** |
| creativeDirection | `caseStudy.creativeDirection` | textarea | Shared field, added in §6 |
| cta | `caseStudy.cta` | text | **New field** |
| deliverables | `caseStudy.deliverables` | tags | **New field**, shared with Social Media Design |
| outcome | `caseStudy.outcome` | textarea | Required |
| reflection | `caseStudy.reflection` | textarea | Existing field |

---

## 9. Social Media Design fields

`CATEGORY_CONFIG["Social Media Design"]`.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| campaign | `caseStudy.context` | textarea | Reuses the existing `context` field |
| platform | `caseStudy.platform` | tags | **New field** |
| contentType | `caseStudy.contentType` | tags | **New field** |
| audience | `caseStudy.targetAudience` | textarea | Shared field |
| objective | `caseStudy.goals` | tags | Existing field |
| creativeDirection | `caseStudy.creativeDirection` | textarea | Shared field |
| contentStrategy | `caseStudy.contentStrategy` | textarea | Shared field |
| designSystem | `caseStudy.designSystem` | textarea | Existing field |
| deliverables | `caseStudy.deliverables` | tags | Shared field |
| outcome | `caseStudy.outcome` | textarea | Required |
| gallery | `Project.gallery` | gallery | Project-level general gallery — no new field needed |

---

## 10. Print Design fields

`CATEGORY_CONFIG["Print Design"]`.

| Requested field | Schema field | Type | Notes |
|---|---|---|---|
| printType | `caseStudy.printType` | text | **New field** |
| brief | `caseStudy.context` | textarea | Reuses the existing `context` field |
| objective | `caseStudy.goals` | tags | Existing field |
| concept | `caseStudy.concept` | textarea | Existing field |
| dimensions | `caseStudy.dimensions` | text | **New field** |
| printSpecification | `caseStudy.printSpecification` | textarea | **New field** |
| typography | `caseStudy.typography` | textarea | Existing field |
| colorSystem | `caseStudy.colorSystem` | textarea | Existing field |
| production | `caseStudy.production` | textarea | **New field** |
| applications | `caseStudy.applications` | gallery | Existing field |
| outcome | `caseStudy.outcome` | textarea | Required |
| gallery | `Project.gallery` | gallery | Project-level general gallery |

---

## 11. Custom fields

`CATEGORY_CONFIG.Custom`. Common fields (§3) plus a typed, extensible section list — **not** an `any`-based escape hatch:

```ts
export interface CustomSection {
  id: string;
  label: string;
  type: "text" | "gallery"; // discriminates which of text/images is meaningful
  text?: string;
  images?: CoverMedia[];
}
```

`caseStudy.customSections?: CustomSection[]` — a Custom project can define as many typed sections as it needs, each one either a text block or an image gallery, fully type-checked, with zero use of `any`/`unknown`-as-escape-hatch.

---

## 12. Gallery model

Two layers, kept deliberately separate:

1. **Actual storage (unchanged):** every image lives in a `CoverMedia[]` array — `Project.gallery` or one of `CaseStudy`'s stage arrays (`wireframes`, `finalDesign`, `moodboard`, `logo`, `applications`, `exploration`, and now `brandGuidelines`). This phase did not touch any real image path, resize/regenerate any file, or restructure how these arrays are stored. `CoverMedia` already carries `src`, `alt` (required), `objectPosition`, `layout` (`full`/`half`/`third`), `aspect` (`landscape`/`portrait`/`square`), and `fit` (`cover`/`contain`) — everything the requested "supported layouts" list asked for already existed before this phase.
2. **Normalized documentation type (new, additive-only):** `GalleryItem` (`src/types/project.ts`) names the flat `{ id, image, alt, caption, section, layout, order }` shape a future admin gallery UI/persistence layer should render toward — `id`/`image`/`alt`/`caption`/`section`/`order` all already exist in some form today (`AdminMedia` already has `caption`/`order`; `AdminMediaSection`/the new `GallerySection` already names which array an item belongs to); `id` is the one genuinely new concept, since today's admin flatten step (`flattenGallery()` in `src/lib/admin/gallery.ts`) synthesizes a non-persisted key instead of a stable id. **No existing gallery data was migrated into this shape** — it exists purely so Phase C has one typed target to build toward.

`GallerySection` — one value per existing image slot: `"cover" | "thumbnail" | "gallery" | "wireframes" | "finalDesign" | "moodboard" | "logo" | "applications" | "exploration" | "brandGuidelines"`.

---

## 13. SEO model

Already fully built as `SeoMeta` in `src/lib/admin/types.ts` — this phase adds nothing new here, since the request's `seoTitle`/`seoDescription`/`seoImage` are already covered:

| Requested field | Existing field | Notes |
|---|---|---|
| seoTitle | `SeoMeta.metaTitle` | Optional, falls back to `title` |
| seoDescription | `SeoMeta.metaDescription` | Optional, falls back to `description ?? shortDescription` |
| seoImage | `SeoMeta.ogImage` | Optional, falls back to `coverImage` |

Also present: `canonicalPath`, `noIndex` (both optional). As before this phase, `SeoMeta` is saved by the admin overlay but **not yet read by any route's `generateMetadata()`** — wiring that up is explicitly out of scope here (per Phase B's instructions not to change existing public metadata behavior) and remains a Phase H-territory task per `CMS_IMPLEMENTATION_PLAN.md` §14.

---

## 14. Field types

`CmsFieldType` (`src/types/category-config.ts`) — the full set requested, mapped to the admin form primitive that already exists (`src/components/admin/fields.tsx`, `src/components/admin/media.tsx`) or will render it once Phase C builds a dynamic renderer:

| `CmsFieldType` | Existing admin primitive |
|---|---|
| `text` | `TextField` |
| `textarea` | `TextAreaField` |
| `richtext` | No rich-text editor exists — reserved for a future addition; renders as `textarea` until then |
| `url` | `TextField` (`type="url"`) |
| `select` | `SelectField` |
| `tags` | `TagListField` |
| `repeatable` | No generic repeatable-group primitive exists yet — Phase C territory (used today by `metrics` and `customSections`) |
| `image` | `MediaField` |
| `gallery` | `GalleryManager` |
| `color` | No dedicated color-picker primitive exists yet — no field in this schema is typed `color` today (color choices are captured as prose in `colorSystem`, matching current real content); reserved for a future structured color-token field |
| `year` | `NumberField` |
| `number` | `NumberField` |
| `toggle` | `ToggleField` |

No new package was installed to support any of the above — the project's zero-new-dependency policy (`COMPONENT_NORMALIZATION.md` §11) is unchanged.

---

## 15. Required vs. optional

Unchanged, restated for clarity: at the type level, exactly **two** fields are non-optional anywhere in this schema — `CaseStudy.overview` and `CaseStudy.outcome`. Every field this phase added is optional. `Project`'s own required fields (`id`, `title`, `slug`, `category`, `projectType`, `year`, `role`, `shortDescription`, `coverImage`, `gallery`, `featured`, `published`, `tags`, `tools`, `services`, `order`) are unchanged from before this phase. `CategoryFieldDef.required` in `category-config.ts` is `true` only on `overview`/`outcome`/`id`/`slug`/`title`/`category`/`year`/`role`/`shortDescription`/`published`/`order` — matching the real schema, not inventing a stricter one.

---

## 16. Data persistence boundary

**Unchanged in this phase, by explicit instruction.** Restated from `CMS_IMPLEMENTATION_PLAN.md` §1/§15 so this document is self-contained:

- The admin dashboard (`src/app/admin/**`) persists edits to **browser `localStorage`** (`src/lib/admin/store.ts`), as a draft overlay on top of `real-projects.ts`. The public site reads `real-projects.ts` directly, server-side — it has no mechanism to see anything saved in a browser's localStorage.
- Every function in `store.ts` (`listProjects`, `getProject`, `saveProject`, `discardProjectEdits`, `createProject`, plus the About/Contact/Settings equivalents) is preserved exactly as it was — this phase did not touch `store.ts`.
- The new fields added to `CaseStudy` pass through the admin layer automatically and safely: `AdminCaseStudy` (`src/lib/admin/types.ts`) is built as `Omit<CaseStudy, "wireframes" | "finalDesign" | ...> & { …AdminMedia overrides… }` — every field this phase added to `CaseStudy` that isn't in that `Omit` list flows through to `AdminCaseStudy` unchanged, automatically, with zero edits required to `types.ts`. Verified: `npx tsc --noEmit` passes with no changes to that file.
- **What a future persistence phase (Stage 1.5, per `PORTFOLIO_CMS_ARCHITECTURE.md` §12) must still change:** give `saveProject`/`saveAbout`/`saveContact`/`saveSettings` a real write path (a server action that regenerates the relevant `.ts` file, or a lightweight server-side datastore) — the function *signatures* in `store.ts` do not need to change for this, by design. A true `deleteProject()` still does not exist (confirmed still absent — out of scope for Phase B, which was not asked to add delete). The new `metrics`/`customSections`/`brandGuidelines` fields will need the same eventual write path as every other field once persistence is real; nothing about them requires special-casing.

---

## 17. Future Admin implementation notes (for Phase C)

Not built in this phase, by explicit instruction — notes for whoever builds Phase C:

1. **The dynamic, category-driven editor itself.** `CATEGORY_CONFIG[project.category].fields` is now the one place that knows "which fields does this category have, in what order, with what label and input type." Phase C's editor should render by iterating that array (`Section`/`FieldGrid`/the individual `*Field` components in `fields.tsx` already exist and don't need to change) rather than hand-coding a new form per category, and rather than continuing to show every field for every category the way `src/app/admin/projects/[id]/page.tsx` still does today (deliberately left as-is this phase — see `CMS_IMPLEMENTATION_PLAN.md` §9's original finding, still accurate).
2. **A generic `repeatable` field renderer** — needed for `metrics` (Digital Marketing) and `customSections` (Custom). `RepeatableSubField[]` on a `CategoryFieldDef` already describes each item's shape; no admin primitive renders that shape yet.
3. **A color-token field primitive**, if/when a category wants structured color values instead of prose — no field in this schema uses `type: "color"` yet.
4. **Wiring `getCategoryDisplayName()` into the public `CategoryFilter.tsx` chip label** (see §2's "deliberately not done" note) — a one-line, purely-cosmetic change, deliberately deferred rather than bundled into this phase.
5. **`relabelForCategory()` could grow** if a future category needs its own overloaded-field relabeling (the same pattern `designDirection`/`finalDesign` already use) — extend the function's `field` parameter type rather than adding a third hand-written ternary elsewhere.
6. **None of the new fields in §4–§11 are wired into `ProjectStory.tsx`'s public rendering yet** — only `designDirection`'s/`finalDesign`'s *labels* were touched (§2's "one source of truth" fix), and that was verified byte-for-byte behavior-preserving (see the code comment on `relabelForCategory`). Deciding the actual public narrative order for fields like `userPersona`, `prototype`, `channels`, `metrics`, etc. is a content/design decision this phase was not asked to make unilaterally — it belongs with whoever builds the next real category-specific case study using them.

---

## QA results (this phase)

- `npx tsc --noEmit -p .` — clean, zero errors, both immediately after `src/types/project.ts`'s changes and again after every subsequent file.
- `npm run lint` — clean, zero warnings/errors.
- `npm run build` — succeeds. `/work/gridmark` (Gridmark, the one real project) still prerenders via `generateStaticParams()`. The only build-time warning (`metadataBase` not set) is pre-existing and unrelated to this phase.
- `src/content/demo-projects.ts` and `src/content/real-projects.ts` — byte-unchanged.
- `src/lib/admin/store.ts`, `src/lib/admin/gallery.ts`, `src/components/admin/fields.tsx`, `src/components/admin/media.tsx` — byte-unchanged.
