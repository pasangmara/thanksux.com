# IMPLEMENTATION_PLAN.md
## Personal Portfolio — Cross-Document Implementation Plan
**Synthesized from:** `PROJECT_SPEC.md`, `DESIGN_SYSTEM.md` (v2), `Portfolio-Strategy-Blueprint.md` (used as the homepage/UX spec — `HOMEPAGE_SPEC.md` does not exist in `docs/`), `DESIGN_SYSTEM_AUDIT.md` (context only).
**Status:** Planning only. No code written. Awaiting approval.

---

## 0. How this document was built

`PROJECT_SPEC.md` is explicitly the most recent, "operationalized" document — it supersedes the Blueprint where the two disagree (the Blueprint is Phase 01 strategy; the spec is the actionable follow-on). `DESIGN_SYSTEM.md` v2 is the audited, corrected version of the design system and is authoritative over anything in the Blueprint's Section 11–12 (which is the pre-audit draft version of the same system). Where a document is silent, I've marked it **MISSING** rather than filling it in. Where two documents disagree, I've marked it **CONTRADICTION** in Section 11 and picked the more-authoritative source for the plan itself, but the underlying decision still needs your sign-off.

---

## 1. Project Architecture

- **Framework:** Next.js (App Router) + TypeScript — confirmed, consistent across `PROJECT_SPEC.md` §8 and Blueprint §15.
- **Rendering:** SSG/ISR for `/work` and `/work/[slug]` (SEO + speed on image-heavy pages).
- **Styling:** Tailwind CSS, theme config mapped 1:1 to `DESIGN_SYSTEM.md` tokens (Section 4 below) — no ad hoc values.
- **Data layer:** headless CMS (Sanity or Payload named as candidates, **not confirmed** — see Section 11) driving `/work` and `/work/[slug]` via the `Project` content model; static pages (`/about`, `/contact`, home copy) can be local/CMS-optional.
- **Image pipeline:** CDN-backed asset delivery (Cloudinary or CMS-native) + `next/image`.
- **Auth:** single-user, admin-only (email/password or magic link) — no public auth surface.
- **Analytics:** Plausible or Vercel Analytics (privacy-respecting, lightweight).
- **High-level shape:**
  ```
  app/
    (site)/
      page.tsx                 → Home
      work/page.tsx             → Work (grid + filters)
      work/[slug]/page.tsx      → Case Study
      about/page.tsx
      contact/page.tsx
    (admin)/
      admin/...                 → CMS-adjacent or CMS-hosted, TBD by Section 11 decision
  components/
    ui/                         → Button, Tag, FilterChip, Input, etc. (design-system primitives)
    site/                       → Nav, Footer, Hero, ProjectCard, CaseStudySection, Quote, etc.
  lib/
    cms/                        → content-fetching client, typed per Project model
  ```

---

## 2. Required Pages

Confirmed identically across `PROJECT_SPEC.md` §2 and Blueprint §04 — no contradiction here.

| Route | Purpose |
|---|---|
| `/` | Home |
| `/work` | Unified, filterable project grid |
| `/work/[slug]` | Case study (dynamic template, 2 content variants) |
| `/about` | Bio, philosophy, resume link |
| `/contact` | Direct channels + short form |
| *(internal)* Admin | Dashboard, project list, project editor, media library, login — see Section 9 |

**Explicitly excluded at launch** (both docs agree): per-discipline top-level pages, a Services page, a Blog/Journal, an admin link in public nav.
**404 / not-found for `/work/[slug]`** is specified in `DESIGN_SYSTEM.md` §14 — dedicated layout, not a generic error page.

---

## 3. Required Components

Derived from `DESIGN_SYSTEM.md` §6–11 (authoritative — this is the audited component set):

**Primitives (`components/ui/`)**
- Button — Primary / Secondary / Text Link (single 48px size; no compact/dark variants — those were removed in the v2 audit)
- Tag / `text-label` element (category tags, section numbers)
- Filter Chip (inactive / hover / active states, per §11)
- Form input (underline style), Textarea, Select (project-type dropdown)
- Icon button (24×24 visual / 40×40 hit area)

**Site components (`components/site/`)**
- Top Nav (desktop) + full-screen overlay Nav (mobile)
- Footer (3-col desktop / stacked mobile, contact icons)
- Hero (Split Proof composition — see Section 5)
- Quick Proof / Trust Strip
- Project Card (image, `text-label` tag, `text-h3` title, 1-line outcome; hover = 1.02 image scale)
- Filter Chip Row
- Process/Approach step block
- About Snapshot block
- Quote (single consolidated component — used for both testimonials and in-case-study pull-quotes, per the v2 audit fix)
- Outcome Summary Block
- Constraint Callout
- Case-Study Section (alternating text/image, two-column desktop / stacked mobile)
- Image-with-caption
- Contact band / persistent "Let's talk" CTA (mobile bottom bar)
- 404 / empty-state components (Work-page zero-results, case-study-not-found)

---

## 4. Design Tokens

Source of truth: `DESIGN_SYSTEM.md` v2 (Blueprint §11–12 is the pre-audit draft of the same system — do not implement from the Blueprint's version).

**Color**
| Token | Hex | Notes |
|---|---|---|
| `color-background` | `#FAFAF7` | |
| `color-background-alt` | `#F2F1EC` | |
| `color-surface` | `#FFFFFF` | |
| `color-ink` | `#0E1B33` | merged text+structural-rule token |
| `color-text-secondary` | `#4A5568` | |
| `color-text-tertiary` | `#8A93A3` | |
| `color-accent` | `#D9622B` | non-text UI only — fails 4.5:1 as text |
| `color-accent-hover` | `#B94E1E` | |
| `color-border` | `#DCDAD2` | |
| `color-error` | `#B3261E` | |

**Typography:** 2 faces only (Display: Söhne/General Sans/Neue Montreal family — **not finalized, see Section 11**; Body: Inter/Aeonik/Suisse Int'l family — **not finalized**). 9-step scale (`display, h1, h2, h3, quote, body-lg, body, label, caption`) with a hard usage table (no reaching up/down a level).

**Spacing:** 8px base — `8/16/24/32/48/64/96/128`.

**Grid:** Desktop 12-col/24px gutter, Tablet 8-col/20px gutter, Mobile 4-col/16px gutter. Containers: `narrow` 720px, `wide` 1280px (hard cap at all viewports), `full` 100vw (≤1×/page).

**Radius:** `0px` everywhere, no exceptions.

**Shadows:** none by default; `shadow-focus` = `0 0 0 2px color-accent` only.

**Motion:** every interaction has a stated duration/easing **and** a required `prefers-reduced-motion` fallback (table in `DESIGN_SYSTEM.md` §13) — this must be implemented per-component, not as a single global CSS media query hack.

---

## 5. Homepage Component Hierarchy

Order confirmed identically in `PROJECT_SPEC.md` §4.1 and Blueprint §05 (Blueprint is the more detailed source, PROJECT_SPEC is the confirming shorthand):

```
<Home>
 ├─ <Hero>                      Split Proof Hero: name, positioning statement,
 │                              1-line differentiator, primary CTA ("View Selected Work"),
 │                              secondary CTA ("Let's Talk"), composed work-fragment visual
 ├─ <QuickProofStrip>           years of experience / role / industries — credibility line
 ├─ <FeaturedWork>               3–4 curated ProjectCards, mixed disciplines, "View all work" CTA
 ├─ <Approach>                  3–4 step process framework (visual, not text-heavy)
 ├─ <AboutSnapshot>             photo, 2–3 specific facts, link to /about
 ├─ <Testimonials>              2–3 Quote components — OMIT ENTIRELY if none collected (do not fake)
 └─ <FinalCTA / ContactBand>    availability restatement + fastest contact channel
```

Hero concept is locked: **Split Proof Hero** (Blueprint §05 Concept 2, explicitly restated in `PROJECT_SPEC.md` §4.1) — headline + a composed arrangement of 2–3 real work fragments. This is not open for re-litigation; it's the one hero decision both documents converge on identically.

---

## 6. Responsive Strategy

Confirmed identically in `PROJECT_SPEC.md` §7 and Blueprint §13 (Blueprint has the rationale, PROJECT_SPEC has the table — no conflict).

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Nav | Full horizontal | Full horizontal | Icon → full-screen overlay |
| Hero | Split composition | Split, condensed | Stacked, single strong image |
| Type | Full scale | Stepped-down | Distinct mobile scale (not just scaled) |
| Project grid | 3-col | 2-col | 1-col, full-width |
| Case study | Side-by-side | Case-by-case | Strictly sequential, image-first |
| CTA | Inline | Inline | Persistent bottom contact bar |
| Footer | Multi-column | Multi-column/stacked | Single stacked, no accordions |
| Contact | Links + form | Links + form | Tap-links prioritized above form |
| Admin | Full tool | Functional | Read-only/quick-edit only |

Breakpoints (from `DESIGN_SYSTEM.md` §12): mobile 0–767, tablet 768–1199, desktop 1200–1599, wide ≥1600 (wide does not get its own layout rules — `container-wide` caps content at 1280px regardless).

---

## 7. Content/Data Structure

Authoritative model: `PROJECT_SPEC.md` §9 (more complete than the Blueprint's §14 model — see Section 11, Contradiction #3).

```
Project {
  title, slug, category: enum(UI/UX, Branding, Graphic Design),
  tags[], status: enum(draft, published), featured: boolean, featuredOrder: number,
  coverImage: image (alt required, custom-composed — see Section 8),
  summary (1-line), client (optional), role, year,
  caseStudy: {
    variant: enum(ui-ux, branding),   ← see Section 11, Contradiction #4 (only 2 variants, 3 categories)
    constraint, problem, research, insights, strategy,
    process: repeatable[{ title, description, image (alt required) }],
    // UI/UX-only: ia, wireframes[], ui[], testing
    // Branding-only: moodboard[], concept, typography, colorSystem, logo[], applications[]
    outcome (required)
  }
}
```

Required-field validation on publish: `coverImage.alt` and `caseStudy.outcome` cannot be empty (`PROJECT_SPEC.md` §9).

**No actual content exists yet** — none of the four documents contain real project data, bio copy, testimonial quotes, or the "4+ years · Digital Hub BD" style credibility line (Blueprint §05 gives this as an *illustrative example*, not confirmed real copy — do not ship it verbatim without confirming it's accurate).

---

## 8. Image/Media Requirements

- **Project cover image:** per `DESIGN_SYSTEM.md` §7's v2 addition, this is **not** a raw crop of existing work — it's a custom-composed shot deliberately designed to fit a 4:3 frame, distinct from in-case-study screenshots. This is a content-production task, not a dev task, and needs to happen per project before the CMS can be populated.
- **Case study images:** wireframes[], ui[] (UI/UX) or moodboard[], logo[], applications[] (branding) — all require alt text at the CMS level (non-optional field).
- **Hero visual:** composed arrangement of 2–3 real work fragments (Split Proof) — also a content-production task, needed before Hero can be built with real assets (can be stubbed with placeholders for dev).
- **About photo:** real photo required (`PROJECT_SPEC.md` §4.4) — no placeholder/stock allowed per positioning goals.
- **Delivery:** CDN-backed, responsive srcset via `next/image`, aggressive optimization on hero + above-the-fold assets, lazy-load below the fold. Sub-2s LCP target.
- **OG images:** per-project, for case-study social sharing (SEO requirement, `PROJECT_SPEC.md` §8).

---

## 9. Future CMS/Admin Requirements

From `PROJECT_SPEC.md` §4.6 and §9 (Blueprint §14 is the same scope at lower fidelity — no conflict, just less detail):

- Dashboard: project counts, draft/published breakdown, recent activity
- Project list: filter/sort by category, status, featured
- Project editor: full structured form matching the Section 7 content model (not a single rich-text blob)
- Draft/Published toggle; Featured toggle + manual ordering (drives Home's Featured Work)
- Media library: upload once, reuse across projects
- Required-field validation at publish time (alt text, outcome)
- Single-user auth only — no roles/permissions, no collaboration features, no public blog content type
- **Not a visual-polish priority** — functional only, mobile view is read-only/quick-edit at most

**Open:** whether this is a headless CMS's native admin UI (Sanity Studio / Payload admin) or a hand-built admin panel depends entirely on the CMS platform decision — see Section 11. This materially changes whether "Required Components" Section 3 needs admin-specific UI components at all.

---

## 10. Recommended Implementation Order

Blueprint §"PRIORITIZED ROADMAP" gives a 9-phase strategy-to-launch roadmap; the portion relevant to code (post-approval) collapses to:

1. **Resolve Section 11 open decisions below** — nothing after this should start until these are answered.
2. Design tokens → Tailwind theme config (Section 4), 1:1 mapping, no ad hoc values.
3. Primitive components (Button, Tag, FilterChip, Form inputs) — these are shared by every page.
4. Site-wide shell: Nav (desktop + mobile overlay), Footer, layout containers/grid.
5. Case Study template (both variants) + content model wiring — this is the highest-complexity, highest-reuse piece; build it before Home so Featured Work has real cards to point to.
6. Work page (grid + filters + featured pinning).
7. Home page (depends on Featured Work + Case Study existing).
8. About, Contact.
9. CMS/admin wiring (content population unblocks real content on all of the above).
10. Empty/error states (`DESIGN_SYSTEM.md` §14), reduced-motion pass, accessibility/contrast verification, performance pass.
11. SEO (meta, OG images, sitemap), analytics wiring, launch QA against `PROJECT_SPEC.md`'s Approval Checklist and Blueprint §18's risk list.

---

## 11. Contradictions, Gaps & Open Decisions — must be resolved before implementation

These are not stylistic nitpicks — each one blocks a concrete implementation choice.

1. **Palette identity — unresolved, flagged in the source docs themselves.** `PROJECT_SPEC.md` §1 states this as an "Open decision (must resolve before Phase 03)": the new off-white/deep-blue/orange palette vs. the existing Joy UI Designs brand (navy `#0F1F3D` / gold `#C9943A`, Syne Bold). `DESIGN_SYSTEM.md` proceeds entirely on the new palette's assumption but the checklist item is still unchecked. **I have not silently picked one — Section 4 above uses the new-palette hex values only because that's what `DESIGN_SYSTEM.md` v2 committed to on paper, not because the decision is actually closed.**

2. **Work-page filter chips: 4 vs 5 items, differ across documents.** `PROJECT_SPEC.md` §2 and §4.2: `All / UI-UX / Branding / Graphic Design` (4 chips, matches the 3-category enum in the content model). Blueprint §04: `All / UI-UX / Branding / Graphic Design / Case Studies` (5 chips) — "Case Studies" isn't a category and doesn't correspond to anything filterable in the content model. **Plan follows `PROJECT_SPEC.md`'s 4-chip version** as the more recent, internally-consistent source — but this should be explicitly confirmed, not assumed.

3. **Case study content model: two different versions exist.** `PROJECT_SPEC.md` §9 has the full model (variant, constraint, discipline-specific fields, required outcome). Blueprint §14 has an earlier, simpler model (no variant, no constraint, no discipline split). These aren't just different levels of detail — Blueprint's model literally cannot represent a branding case study's Moodboard/Logo/Typography sections. **Plan uses `PROJECT_SPEC.md`'s model as authoritative**, treating the Blueprint's as superseded, not as an alternate spec to reconcile.

4. **3 project categories but only 2 case-study variants — unresolved mapping.** `PROJECT_SPEC.md`'s `category` enum has 3 values (`UI/UX`, `Branding`, `Graphic Design`), but `caseStudy.variant` only has 2 (`ui-ux`, `branding`). Neither `PROJECT_SPEC.md` nor the Blueprint states which variant a `Graphic Design`-category project should use, or whether a third variant is needed. This is a real gap, not an inference I'm willing to make silently — **needs your decision** before the Case Study template (Section 10, step 5) can be built for that category.

5. **CMS platform: named as "preferred," never confirmed.** Both `PROJECT_SPEC.md` §8 and Blueprint §15 say a headless CMS (Sanity/Payload examples) is the *pragmatic recommendation* over a custom build — but `PROJECT_SPEC.md`'s own Approval Checklist lists "CMS platform choice confirmed" as an open, unchecked item. This decision changes Section 1 (project architecture), Section 9 (admin scope), and whether admin-specific UI components need to be built at all.

6. **Font families are candidate lists, not final picks.** `DESIGN_SYSTEM.md` §2 gives 3 acceptable options per typeface family (e.g., "Söhne / General Sans / Neue Montreal") rather than one final choice. Needed before token/Tailwind config (Section 4) can be finalized — licensing and self-hosting requirements differ per typeface.

7. **Cover-image methodology isn't reflected back into `PROJECT_SPEC.md` yet.** `DESIGN_SYSTEM.md` v2's own Traceability section (last paragraph) flags this itself: the custom-composed cover-shot requirement (Section 8 above) is a CMS content-model implication that `PROJECT_SPEC.md`'s `Project.coverImage` field definition hasn't been updated to reflect. Small but real doc-sync gap.

8. **`HOMEPAGE_SPEC.md` does not exist.** Per your direction, Blueprint §05 was used in its place for this plan. If a dedicated homepage spec is meant to exist separately (with content that supersedes or refines Blueprint §05), it needs to be written or pointed to before Home implementation (Section 10, step 7).

9. **No real content exists anywhere yet** (Section 7): final project list (target 8–12, per `PROJECT_SPEC.md`'s checklist), case study copy for the featured 3–4, testimonials (collect or explicitly omit — both docs agree faking is not acceptable), About bio, resume file, and the credibility-line copy for Quick Proof (the "4+ years · Digital Hub BD" line in Blueprint §05 is an illustrative example, not confirmed real data).

10. **`PROJECT_SPEC.md`'s own Approval Checklist is still fully unchecked** — palette decision, final project list, case-study content for featured projects, CMS platform choice, testimonials collected-or-excluded. The document's own stated gate ("No visual design or code should begin until the Approval Checklist above is resolved") hasn't been satisfied yet, independent of anything in this plan.

---

## Next Step

This is a plan, not a build — no code has been written. Please resolve or explicitly waive items 1–10 in Section 11 (particularly #1, #3/#4, and #5, which materially change the architecture), and confirm this plan overall, before implementation begins.
