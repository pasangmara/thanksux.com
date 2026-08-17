# DESIGN_SYSTEM.md (v4 — visual depth & motion phase)
## Personal Portfolio — Design System Specification
**Derived from:** PROJECT_SPEC.md, Sections 5 & 6 (Design Direction: Structured Studio)
**Revision note:** v2 resolved the findings in DESIGN_SYSTEM_AUDIT.md. v3 is a deliberate direction change made after the first full homepage build was reviewed and judged "too sharp, rigid, and slightly wireframe-like" — moving from a strictly zero-radius, warm-off-white "Structured Studio" system toward a "premium editorial" one: controlled rounded corners, a cool-neutral background, softer structural dividers. The brand colors (deep blue, orange), grid, spacing, and typefaces are unchanged. Changes from v2 are called out inline as `[v3]`.
**v4 revision note:** A dedicated visual-design/motion phase, commissioned explicitly to add gradient atmosphere, a glass-surface material, an expanded scroll-reveal vocabulary, and a formally-scoped exception to §13's blanket parallax prohibition — a deliberate, evidence-based amendment of the same kind v3 itself made to the v2 radius rule (see §5's note), not a casual reversal. `docs/21ST_COMPONENT_AUDIT.md`'s six imported candidate components remain fully rejected — none of this phase's additions are ports of that code; every new gradient/glass/motion primitive below is original, hand-built CSS reusing the *existing* closed color palette (no new hues), and every new motion respects `prefers-reduced-motion`. Changes from v3 are called out inline as `[v4]`.
**Status:** Implemented in code (src/styles/tokens.css, src/styles/depth.css, src/styles/motion.css, and consuming components) as of this revision.

---

## 0. Design Principles

1. **Structure is the decoration.** Grid lines, rules, and alignment carry visual interest — not shadows or gradients. `[v3]` A controlled, small radius scale was reintroduced (§5) because zero-radius read as sharp/wireframe-like rather than "precise" in practice — structure still carries the design, radius softens its edges without replacing it as the visual interest.
2. **Orange is a signal, not a color scheme.** It appears only where action or attention is required. It is never used decoratively, and — `[v2]` — never used as text color at body or caption sizes, only on non-text UI (fills, rings, underlines, icons).
3. **Whitespace separates, borders structure.** No drop shadows as a separation technique.
4. **Two typefaces, one hierarchy, and every size has one job.** `[v2]` No style exists without a stated usage boundary — a scale is only a hierarchy if implementers can't legally use the wrong size.
5. **Motion confirms, it doesn't perform.** Every animation communicates a state change, and every animation has a stated reduced-motion fallback.
6. **No token, component, or variant ships without a named use case.** `[v2]` If nothing in this spec calls for it, it doesn't exist yet.

---

## 1. Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `color-background` | `#F6F7F9` | Primary page background. `[v3]` Was `#FAFAF7` (a warm off-white) — shifted to a cool neutral per the refinement brief's explicit "avoid cream/beige/yellowish white/warm paper tones." |
| `color-background-alt` | `#EDEFF3` | Section-break background, alternating bands. `[v3]` Was `#F2F1EC` (warm); same cool-neutral shift as `color-background`. |
| `color-surface` | `#FFFFFF` | Cards, form fields, elevated content on `background-alt`. Unchanged — pure white was already correct and stays the dominant surface color. |
| `color-ink` | `#0E1B33` | **`[v2]` Merged token** — deep-blue headline/body text, nav text, AND structural rule lines/section-number marks. One value, one name, used consistently for anything "deep blue." Unchanged in v3 — brand colors were explicitly out of scope for the refinement. |
| `color-ink-hover` | `#16274A` | `[v3]` **New.** Primary button hover state. A primary button appears on nearly every section; hovering it into `color-accent` (the old v2 behavior) meant orange fired on every routine hover, which the v3 brief's "do not use orange excessively" directly argues against. Hover now stays in the blue family; `color-accent` is reserved for secondary/text-link hover, focus rings, and active-state indicators. |
| `color-text-secondary` | `#4A5568` | Supporting copy, captions, metadata |
| `color-text-tertiary` | `#8A93A3` | Placeholder text, disabled states, timestamps |
| `color-accent` | `#D9622B` | Secondary/text-link hover, focus rings, active-state indicators — never body/caption text color, never a primary-button fill state, never a large fill. `[v3]` Scope narrowed: see `color-ink-hover` above. |
| `color-accent-hover` | `#B94E1E` | Hover/pressed state of accent (secondary button hover → accent, then this on further press/focus) |
| `color-border` | `#E1E4EA` | Card borders, dividers, input borders. `[v3]` Was `#DCDAD2` (warm beige-gray) — shifted cool to match the new background family. |
| `color-error` | `#B3261E` | Inline form validation only |

`[v2]` **Removed:** `color-border-strong` (duplicate of `color-ink`), `color-success` (no confirmed use case — see audit finding C-success). If a future need for a success state arises, it should be added deliberately with a named component, not carried as unused inventory.

### Contrast rules — resolved, not deferred
`[v2]` `color-accent` on `color-background` measures ≈2.9:1 — it does **not** clear 4.5:1 text contrast. Resolution: `color-accent` is restricted to non-text UI only (button fills with off-white text on top, focus rings, underlines, icons, small active-state marks), which only needs to clear 3:1 non-text contrast — which it does. It is never applied as the color of body or caption text. Where an "active/selected" state needs to be shown on text (e.g. active nav link, active filter chip), it's shown via an underline/rule device in `color-accent`, with the text itself remaining `color-ink`.

---

## 2. Typography Scale

### Typefaces
- **Display/Headline:** geometric sans-serif (Söhne / General Sans / Neue Montreal family), medium–semibold weights only.
- **Body/Workhorse:** neutral grotesk (Inter / Aeonik / Suisse Int'l family), regular and medium weights.
- No third typeface.

### Scale
| Token | Desktop | Mobile | Weight | Line-height | Tracking | Face |
|---|---|---|---|---|---|---|
| `text-display` | 72px | 40px | 600 | 1.05 | -0.02em | Display |
| `text-h1` | 56px | 34px | 600 | 1.1 | -0.01em | Display |
| `text-h2` | 40px | 28px | 600 | 1.15 | -0.01em | Display |
| `text-h3` | 28px | 22px | 500 | 1.2 | 0 | Display |
| `text-quote` | 24px | 20px | 500 (italic) | 1.4 | 0 | Display `[v2]` — see Section 7, single reusable quote style |
| `text-body-lg` | 20px | 18px | 400 | 1.5 | 0 | Body |
| `text-body` | 16px | 16px | 400 | 1.6 | 0 | Body |
| `text-label` | 13px | 13px | 500 | 1.4 | 0.06em, uppercase | Body, `color-ink` |
| `text-caption` | 13px | 13px | 400 | 1.4 | 0.02em | Body, `color-text-secondary` |

`[v2]` **Split `text-caption` into two tokens** (audit finding C-1):
- **`text-label`** — the *graphic/structural* role: section numbers ("01 — Selected Work"), category tags on project cards, filter chip labels, active nav indicators. Bold-reading via `color-ink` + wide tracking, so it actually functions as the "design motif" the system claims.
- **`text-caption`** — the *quiet/metadata* role: timestamps, testimonial name/role, form field labels, image captions. `color-text-secondary`, normal tracking, deliberately recedes.

### `[v2]` Heading usage table — resolves audit finding C-2
| Token | Where it is used | Frequency |
|---|---|---|
| `text-display` | Home hero headline **only** | Once per site |
| `text-h1` | Page title: Work, About, Contact, and the Case Study project title | Once per page |
| `text-h2` | Section headers within a page (Home's "Featured Work," a case study's "Research," etc.) | Multiple per page, one per section |
| `text-h3` | Card/component-level titles (project card title, process-step title) | Multiple per section |

No component is permitted to reach "up" a level (e.g., a project card title may never use `text-h2`) or "down" (a page title may never use `text-h3`). This is what makes the scale a hierarchy rather than a menu.

---

## 3. Spacing System

Unchanged from v1 — audit found no issues here.

| Token | Value |
|---|---|
| `space-1` | 8px |
| `space-2` | 16px |
| `space-3` | 24px |
| `space-4` | 32px |
| `space-6` | 48px |
| `space-8` | 64px |
| `space-12` | 96px |
| `space-16` | 128px |

- Component-internal: `space-1`–`space-3`.
- Section-internal: `space-3`–`space-4`.
- Section-to-section: `space-8` desktop / `space-6` mobile.
- `space-16` never used below tablet.

---

## 4. Grid & Containers

### Grid
- **Desktop (≥1200px):** 12 columns, 24px gutter, `space-8` margin.
- **Tablet (768–1199px):** 8 columns, 20px gutter, `space-4` margin.
- **Mobile (<768px):** 4 columns, 16px gutter, `space-2` margin.

### Containers
| Token | Max-width | Usage |
|---|---|---|
| `container-narrow` | 720px | Case study body copy, About bio, form content |
| `container-wide` | 1280px | Hero, project grids, featured work — **absolute cap, holds at every viewport including `wide` (≥1600px); extra viewport width becomes margin, never extra content width.** `[v2]` Stated once, here, as the single source of truth — removed the redundant restatement that previously lived in the breakpoint table (audit finding A-4). |
| `container-full` | 100vw | Full-bleed imagery, used at most once per page. `[v3]` Not currently used on the homepage — the Case Study Preview spotlight that used it now uses a contained `radius-lg` frame instead, since true edge-to-edge bleed and rounded corners are incompatible (a rounded corner sitting at the literal viewport edge reads as a bug). The token remains valid for a future page where true bleed fits the moment. |

### Structural grid motif
Section dividers use a 1px rule spanning the container width, paired with a `text-label`-styled section number. Applied consistently across Home, Work, and Case Study. `[v3]` Rule color changed from `color-ink` to `color-border` (cool-neutral, subtle) — hard black/navy lines throughout the page were part of what read as rigid/wireframe-like; the structural motif itself (a rule + number opening every section) is unchanged, only its weight/contrast is quieter now.

---

## 5. Border Radius & Shadows

### Border radius
`[v3]` **Reintroduced as a controlled 3-step scale.** The v2 "one rule, no exceptions" zero-radius system was a deliberate choice at the time, but reading the built homepage back, it landed as sharp/rigid/wireframe-like rather than "precise" — a real, evidence-based amendment of exactly the kind v2 itself left the door open for ("that's a deliberate, tested amendment to this document — not a day-one hedge"), not a casual reversal. Each value is a multiple of the 8px spacing unit, so radius stays tied to the same system rather than becoming a set of unrelated numbers:

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 8px | Small UI elements — chips/tags, icon hit-targets (footer/contact icons) |
| `radius-md` | 16px | Buttons, standard project cards, form inputs, hero exhibition tiles |
| `radius-lg` | 24px | Large/spotlight image containers — case-study spotlight, primary featured card, editorial lead images |

`radius-none` remains available (Tailwind's static utility) for anywhere a genuinely sharp corner is still wanted. Nothing above `radius-lg` exists — no `rounded-full`/pill shapes anywhere in the system; that boundary is as deliberate as the radius itself.

### Shadows
| Token | Value | Usage |
|---|---|---|
| `shadow-none` | none | Default everywhere |
| `shadow-focus` | `0 0 0 2px color-accent` | Focus-visible states on buttons/interactive controls |
| `shadow-elevated` `[v4]` | `0 8px 20px -8px rgb(14 27 51 / 0.18)` | Button/card hover lift (`.lift-on-hover`) — single-layer, never stacked |
| `shadow-glass` `[v4]` | `0 8px 32px -12px rgb(14 27 51 / 0.16)` | Glass surfaces (§15) |

Both v4 additions stay single-layer and low-opacity — the multi-layer skeuomorphic shadow stacks in `docs/21ST_COMPONENT_AUDIT.md`'s rejected candidates remain out of system.

---

## 6. Buttons

`[v2]` **Simplified to two variants** (removed the compact 40px variant and the "on dark section" variant — audit findings B-1 and A-2; this system has no dark-background sections and no component that needed a compact button).

| Variant | Fill | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `color-ink` solid | `color-white` | none | `[v3]` Fill shifts to `color-ink-hover` (was `color-accent` in v2 — see §1's `color-ink-hover` entry for why) |
| Secondary | transparent | `color-ink` | 1px `color-ink` | Text/border shift to `color-accent` |
| Text link | transparent | `color-ink`, underlined | none | Underline shifts to `color-accent` |

`[v3]` Primary's text token corrected to `color-white` — with `color-background` now a visibly cool-tinted off-white rather than a near-white, using it as button text was no longer precise; the button needs true white.

### Sizing
- Height: 48px (the one button size in this system).
- Horizontal padding: `space-3` (24px).
- Label: `text-body`, weight 500.
- Radius: `[v3]` `radius-md`.
- Icon buttons: 40×40px minimum, `[v3]` `radius-sm`.

### States
Default / Hover / Focus (`shadow-focus`) / Disabled (`color-text-tertiary` text and border, no fill). Transition: 150ms ease on color/border/fill only.

---

## 7. Cards & Reusable Content Components

### Project Card
- Cover image (see `[v2]` methodology note below), `space-2` gap, `text-label` category tag, `text-h3` title, `text-body` 1-line outcome in `color-text-secondary`.
- `[v3]` Persistent `color-border` 1px border + `radius-md` on the image (was hover-only + `radius-none` in v2 — the refinement brief names "subtle border" as an inherent card trait, not a hover reveal; `radius-lg` for a large/lead card instead of `radius-md`).
- Hover: image scales 1.02, 400ms ease. `[v2]` **Decision made, not left open** (audit finding C-4/decision-gap): this is the single sitewide hover treatment; the "or image swap" alternative from v1 is dropped to avoid an unresolved either/or shipping into build.
- Entire card is the click target.

### `[v2]` Cover-image methodology (resolves audit finding C-4)
Because project source material varies wildly in native aspect ratio (tall UI screenshots, portrait posters, landscape web UI), the 4:3 project-card image is never a raw crop of existing work. Each project requires one **custom-composed cover shot** — a deliberately designed frame (e.g., a mockup, a cropped detail, or a composed arrangement) built to fit 4:3 intentionally. This is a content-production requirement, not just a CSS rule, and should be flagged back into PROJECT_SPEC's CMS content model as a required, distinct asset from any in-case-study screenshots.

### Case-Study Section Card (process steps)
- `text-label` step marker ("PROCESS — 02"), `text-h3` step title, `text-body` description (40–60 word cap), optional image.
- Two-column desktop (alternating text/image sides for rhythm), stacked mobile.
- No border — separated by `space-8` and the structural rule motif.

### `[v2]` Quote (consolidated component — resolves audit finding A-3)
One quote treatment, used identically whether it's a client testimonial or an in-case-study pull-quote: `text-quote` style (Section 2), a `color-accent` rule (24px × 2px) above it as a graphic marker, `text-caption` attribution line below (name + role, or omitted for an anonymous insight quote). Placed inside a bordered `color-surface` card only when it appears on a `color-background-alt` band (i.e., the Home testimonials section); border-less and inline when it appears within a case study's narrow text column.

### Outcome Summary Block
`color-background-alt` full-bleed band, `text-h2` outcome statement, optional metric row (Display-face numerals + `text-label` below each).

### `[v2]` Constraint Callout
`color-background-alt` inline box near the top of a case study, `text-body` in `color-text-secondary`, `space-3` padding, no border.

---

## 8. Navigation

### Desktop (≥1200px)
- Height 88px. Logo/name left, nav links right (Home · Work · About · Contact), "Let's Talk" Secondary button far right.
- Active page: `color-accent` 2px underline (non-text UI — clears 3:1 contrast requirement; see Section 1 resolution).
- 1px `color-ink` `[v2]` — was `color-border-strong`, now `color-ink` per the token merge — bottom border, always visible.

### Mobile (<768px)
- Height 64px. Full-screen overlay on menu tap: `text-h2`-scale links stacked, `space-4` gap, Primary button ("Let's Talk") pinned full-width at the bottom.

### Footer
- `color-background-alt` band, `container-wide`.
- Three-column desktop / single stacked column mobile.
- `[v2]` **Contact icons: 24×24px visual glyph, but 40×40px minimum interactive hit area via padding** — resolves audit finding A-5/D-2. The visible icon stays small and quiet per the editorial direction; the tappable/clickable region does not.

---

## 9. Forms

- `[v3]` Bordered inputs: `color-border` 1px border on all sides, `color-surface` (white) background, `radius-md`. Focus: border becomes `color-accent`, plus `shadow-focus`. Was underline-only (`color-border` 1px bottom border only, `radius-none`) in v2 — an underline has no visible corner to round, which made it incompatible with the v3 "inputs: medium radius" direction, so the field became a proper bordered box rather than leaving radius un-appliable here.
- Label: `text-caption` (quiet role, per the Section 2 split), always visible above the field.
- Field height: 48px single-line, min 120px textarea.
- Field spacing: `space-3` vertical gap.
- Validation: `color-error` text below field, shown on submit-attempt only.
- Submit: Primary button, full-width mobile, auto-width desktop.

`[v2]` **Success state, resolved:** no success-colored field state exists (no `color-success` token — see Section 1). On successful submit, the form is replaced by a confirmation message set in `text-body-lg`, `color-ink`.

---

## 10. Case-Study Components — reference index

| Component | Spec location |
|---|---|
| Section header | `text-label` numbered marker + `text-h2` title |
| Process step block | Section 7, Case-Study Section Card |
| Image-with-caption | Full/half-width image, `text-caption` below, left-aligned to image edge |
| Quote | Section 7, consolidated Quote component |
| Outcome summary block | Section 7 |
| Constraint callout | Section 7 |

---

## 11. Filter Chip

`[v2]` **New — resolves audit finding C-3 (undefined default state).**

| State | Fill | Text | Border |
|---|---|---|---|
| Inactive (default) | transparent | `color-ink` (`text-label` style) | 1px `color-border` |
| Hover | transparent | `color-ink` | 1px `color-ink` |
| Active/selected | transparent | `color-ink` | 1px `color-ink`, plus 2px `color-accent` underline beneath the label |

Height 36px, horizontal padding `space-2`, `radius-none`, single row, no wrap-to-second-row layout — if the category count ever grows enough to wrap, that's a signal to revisit the filter UI, not to let it wrap silently.

---

## 12. Responsive Breakpoints

| Breakpoint | Range | Grid | Notes |
|---|---|---|---|
| `mobile` | 0–767px | 4-col | Full-screen nav, stacked layouts, bottom contact bar |
| `tablet` | 768–1199px | 8-col | Hybrid layouts, nav stays horizontal |
| `desktop` | 1200–1599px | 12-col | Full system as specified |
| `wide` | ≥1600px | 12-col | `container-wide` still caps at 1280px per Section 4 — no separate rule needed here `[v2]` |

Mobile-first implementation, matching PROJECT_SPEC's Tailwind mobile-first approach.

---

## 13. Interaction & Motion Rules

**Global constraint:** motion exists only to confirm state changes.

| Interaction | Motion | Duration | Easing | `[v2]` Reduced-motion fallback |
|---|---|---|---|---|
| Button hover | Color transition | 150ms | ease-out | Instant color change, no transition |
| Link hover | Underline color shift | 150ms | ease-out | Instant |
| Project card hover | Image scale 1.02 | 400ms | ease-out | No scale; hover shown via border appearance only |
| Mobile nav overlay | Fade + 16px slide | 250ms | ease-in-out | Fade only, no slide |
| Scroll-triggered reveal | Fade + 16px slide, once per element | 400ms | ease-out | Content renders in final state immediately, no reveal animation |
| Filter chip active | Underline transition | 150ms | ease-out | Instant |
| Form field focus | Border color transition | 150ms | ease-out | Instant |
| Form submit | Inline button label swap ("Sending…") | n/a | n/a | n/a (no motion involved) |

### `[v4]` Expanded scroll-reveal vocabulary
`ScrollReveal.tsx`'s `variant` prop — same IntersectionObserver-once mechanism as the row above, only the hidden-state transform/filter differs:

| Variant | Hidden state | Duration | Use |
|---|---|---|---|
| `up` (default) | translateY(16px) | 400ms | Unchanged v2/v3 behavior — every existing call site until this phase |
| `fade` | opacity only | 600ms | Calm content (Design Process steps) |
| `scale` | scale(0.97) | 600ms | Image/card reveals (project cards, case-study galleries, CTA bands) |
| `blur` | blur(8px) | 700ms | Section headers wanting a softer arrival (Client Reviews, ProjectHero) |
| `left` / `right` | translateX(∓24px) | 600ms | Alternating editorial rows (UI/UX Showcase, Designer Intro) |

All five, like `up`, render in final state immediately under `prefers-reduced-motion: reduce` — no exceptions.

### `[v4]` Parallax — narrow, scoped exception to the v2/v3 prohibition
The blanket "parallax scrolling" prohibition below predates `HeroParallax.tsx`, which already implements exactly the constrained pattern this amendment formalizes (desktop-only, ≥1200px; capped ~10px/depth-unit movement; `translateY` only; passive + rAF-throttled scroll listener; fully disabled under `prefers-reduced-motion`). v4 extends this same constrained pattern — never a new, unconstrained parallax engine — to a small, named allow-list:

- Hero visual grid tiles (existing, `HeroParallax.tsx`)
- Purely decorative atmosphere gradients (§15) — background position only, never content

**Never** applied to: forms, buttons, navigation, body/caption text, or any accessibility control — motion there stays exactly as prohibited below. A future addition to this allow-list needs the same explicit, named justification this note gives, not an incidental side effect of an unrelated change.

### Explicitly prohibited
Auto-playing carousels, bounce/spring easing, staggered cascade grid reveals, cursor-follow/magnetic buttons, and parallax scrolling **outside the narrow allow-list immediately above**.

Every row above must check `prefers-reduced-motion` and apply its fallback — this is a per-component implementation requirement, not a general footnote. `[v2]`

---

## 14. `[v2]` Empty & Error States — new, resolves audit finding D-4

| Situation | Spec |
|---|---|
| Work page filter returns zero results | Centered `text-body-lg` message in `color-text-secondary` ("No projects in this category yet — check back soon"), plus a Text Link back to "All" |
| Case study not found (bad/removed slug) | Dedicated 404 layout: `text-h1` "Page not found," `text-body` supporting line, Primary button back to Work |
| Form submission fails (network/server error, distinct from field validation) | Inline `color-error` banner above the form, `text-body`, does not clear the user's entered field values |
| Featured Work has fewer than 3 curated projects at a given time | Section still renders with however many are marked featured (2 minimum) rather than force-padding with non-featured projects — the CMS's featured-count is not artificially enforced to a fixed number |

---

## 15. `[v4]` Glass Surfaces

One recipe (`.glass-surface` / `.glass-surface-alt` / `.nav-glass`, `src/styles/depth.css`), not per-component variants — "glass" should read as one consistent material sitewide. `color-mix()`'d from `color-surface`, never a new color.

**Allow-list (glass is used only here):**
- Navbar, once scrolled (§6 amendment below)
- Audit input panel + audit progress state
- Audit report's Overall Score card and Top Priorities panel
- Scroll-to-top button
- Footer's "Get in touch" panel

**Never** on: ordinary content cards (project cards, review cards, service cards) — those stay `color-surface` solid, exactly as v3 specified. Glass marks a small, deliberate set of "floating/highlighted" surfaces, not a sitewide material change.

**Fallback:** `@supports not (backdrop-filter: blur(1px))` swaps to a solid, still-fully-readable background — no browser ever renders unreadable translucent text.

## 16. `[v4]` Gradient Atmosphere

Named, decorative-only gradient layers (`src/styles/depth.css`'s `.atmosphere-*` classes) — large, soft-edged, low-opacity (peak ≈14%), every stop fading to full transparency. Every hue is `color-mix()`'d from the existing closed palette (`color-ink`, `color-accent`, `color-live`, `color-background`) — no new colors. Always `aria-hidden="true"` + `pointer-events-none`, always behind real content in stacking order, never the sole carrier of information.

| Class | Where | Recipe |
|---|---|---|
| `.atmosphere-hero` | Home hero | Ink + accent radial glow |
| `.atmosphere-cta` | HiringCTA | Accent radial + linear wash |
| `.atmosphere-audit` | `/audit`, `/audit/[id]` | Ink radial + faint dot grid ("technical" language) |
| `.atmosphere-signals` | `/signals`, homepage ThanksUX section | Live-green + ink radial |
| `.atmosphere-footer` | Site footer | Accent radial, upward glow |

"Soft blue" / "soft violet-blue" from the original visual-direction brief are implemented as lighter **tints of `color-ink`** (already a deep blue) via `color-mix()`, not a new violet hue — this keeps the palette closed per Design Principle 6 rather than adding an unused-elsewhere color for one gradient recipe.

## `[v4]` Section 6 amendment — Navigation

Adds a scroll-triggered glass transition, `useScrolled()` (`src/lib/motion/useScrolled.ts`) driven: at the top of the page, nav renders exactly as documented above (`bg-background`, 1px `border-border` bottom border); past an 8px scroll threshold, it crossfades (300ms) to `.nav-glass` (§15's recipe, bottom-border-only variant). Height (88px desktop / 64px mobile) never changes between states — only background/blur/shadow.

## Traceability

This document remains fully scoped to *how things look and behave*, per PROJECT_SPEC.md Sections 5, 6, 7, and 9. `[v2]` changes are corrections and completions of that same scope — no new pages, flows, or content-model fields were introduced, with one exception: the cover-image methodology note in Section 7 surfaces a CMS content-model implication (a distinct cover-shot asset per project) that should be reflected back into PROJECT_SPEC.md's `Project.coverImage` field definition before the CMS is built.

---

*This is a specification only. Figma design system build and code implementation should not begin until this revised document is reviewed and approved.*
