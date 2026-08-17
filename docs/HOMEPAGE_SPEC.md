# HOMEPAGE_SPEC.md
## Personal Portfolio — Homepage Specification (as-built)
**Derived from:** PROJECT_SPEC.md §4.1, Portfolio-Strategy-Blueprint.md §05, and the homepage implementation brief that commissioned this build.
**Status:** Implemented (`src/app/page.tsx` + `src/components/site/*`). This document records what was actually built, closing the gap flagged twice in `docs/IMPLEMENTATION_PLAN.md` §11 item 8 — this file didn't exist before this pass.

---

## 1. Section order (as implemented)

The original PROJECT_SPEC.md §4.1 / Blueprint §05 homepage had 7 sections (Hero, Quick Proof, Featured Work, Approach, About Snapshot, Testimonials, Final CTA). The implementation brief for this build expanded that to 13, folding Testimonials out (none collected — PROJECT_SPEC.md's own instruction was to omit rather than fake) and adding Services, Case Study Preview, and split category showcases. That expansion is a direct instruction from the build brief, not a silent invention — recorded here for traceability.

| # | Section | Component | Numbered on-page? |
|---|---|---|---|
| — | Navigation | `SiteNav` (in root layout, all pages) | — |
| — | Hero | `Hero` | No (name + role eyebrow instead) |
| 01 | Featured Work | `FeaturedWork` | Yes |
| 02 | Designer Introduction | `DesignerIntro` | Yes |
| 03 | Services | `Services` | Yes |
| 04 | Case Study Preview | `CaseStudyPreview` | Yes |
| 05 | Graphic Design Showcase | `CategoryShowcase` | Yes |
| 06 | UI/UX Showcase | `CategoryShowcase` | Yes |
| 07 | Design Process | `DesignProcess` | Yes |
| 08 | About / Skills | `AboutSkills` | Yes |
| — | Hiring CTA | `HiringCTA` | No (banner, not content) |
| 09 | Contact | `ContactSection` | Yes |
| — | Footer | `SiteFooter` (in root layout, all pages) | — |

Numbering follows DESIGN_SYSTEM.md v2's structural grid motif (§4: "Section dividers use a 1px color-ink rule... paired with a text-label-styled section number"). Hero and Hiring CTA are deliberately exempt — Hero is the single non-numbered entry point, Hiring CTA is a persuasive banner reusing the Outcome Summary Block treatment, not a numbered content section.

---

## 2. Hero direction

Implements **Split Proof Hero** (Blueprint §05 Concept 2, restated verbatim in PROJECT_SPEC.md §4.1) as an "exhibition wall" composition:

- **Headline:** PROJECT_SPEC.md §1's approved positioning statement, verbatim: "Systems-minded design, from brand to product."
- **Role eyebrow:** "Joy — Graphic Design · UI/UX Design · UX Research" — resolves the build brief's explicit requirement that the hero immediately state all three disciplines, not just imply them visually.
- **Visual composition:** reuses the actual `coverArt` from the top 3 featured projects (not disconnected decorative tiles), plus one standalone typography-specimen tile as the site's own type-craft signature. This makes the hero a genuine preview of what's shown in full in Featured Work below it.
- **Three distinct compositions per breakpoint**, not one layout scaled down:
  - Mobile (<768px): single strongest tile.
  - Tablet (768–1199px): condensed 2-tile row.
  - Desktop (≥1200px): full 4-tile grid (one tall tile spanning 2 rows, two square tiles, one wide tile) beside the headline.
- **container-full** (DESIGN_SYSTEM.md §4's "used at most once per page" full-bleed rule) is intentionally *not* used in the hero — nesting a viewport-edge bleed inside the hero's split grid was judged too fragile. It's used once, in Case Study Preview's spotlight image, instead.
- No shadows, no radius, axis-aligned tiles only (no rotation) — consistent with "Structure is the decoration" (DESIGN_SYSTEM.md Principle 1) and the brief's "curated exhibition, not random floating cards" requirement.

---

## 3. Content architecture

- `src/types/project.ts` — the `Project`/`CaseStudy` type mirrors PROJECT_SPEC.md §9's content model field-for-field, so pointing it at a real CMS response later requires no restructuring.
- `src/content/projects.ts` — **placeholder data**, explicitly marked as such in the file. No real project list, case study copy, or photography exists yet (IMPLEMENTATION_PLAN.md §11 item 9). 8 sample projects across the 3 categories let every data-driven section (Featured Work, category showcases, Case Study Preview) be built and evaluated now.
- `src/content/site.ts` — nav, footer, contact methods, bio facts, skills/tools, service framing. Copy taken verbatim from PROJECT_SPEC.md/Blueprint.md where it exists (positioning statement, CTA labels, response-time line); everything else is flagged inline `NEEDS REAL DATA` where no source document ever confirmed a value (contact handles, years of experience, tool list).
- `src/components/site/ProjectArtwork.tsx` — since no real project photography exists, cover art is a token-built abstract composition (7 variants: brand-mark, ui-screen, poster, editorial, campaign, typography, packaging) rather than a photo. The `CoverArt` type supports both `{kind: "artwork"}` (today) and `{kind: "image"}` (once real assets exist) with no component changes required to switch.

---

## 4. Contact form — no backend yet

Per the brief, CMS/database work is out of scope for this pass. `ContactSection`'s form does client-side validation only; on successful validation it opens a `mailto:` link with the message pre-filled (visible to the user via an explicit caption: "Opens your email client with this pre-filled"). This is intentionally honest rather than faking a "message sent" confirmation with no backend behind it. Replace with a real submission endpoint when the CMS phase begins.

---

## 5. Deviations and open items carried forward

- General Sans is loaded from Fontshare's CDN, not fully self-hosted (see `src/app/layout.tsx` comment) — matches the decision made during foundation setup.
- Contact handles (email address, WhatsApp number, LinkedIn/Behance/Fiverr URLs), bio facts, years of experience, and the tool/skill list are all placeholder — flagged `NEEDS REAL DATA` in `src/content/site.ts`.
- All 8 sample projects in `src/content/projects.ts` are fictional and must be replaced before launch.
- `/work`, `/about`, `/contact`, and every `/work/[slug]` route are linked to from this homepage but not yet built — they will 404 until those pages exist, per the brief's explicit scope limit for this pass.
