# COMPONENT_NORMALIZATION.md

## Component Normalization Standard — Joy Portfolio

**Status:** Standard only. No code integrated, no packages installed, no production components modified as part of this document.

**Applies to:** every component currently sitting in `components/*.txt` (see `docs/21ST_COMPONENT_AUDIT.md`), and any future imported/inspired component considered for this codebase. Nothing in this document authorizes integration by itself — it defines the bar a component must clear, and the process it must pass through, before it may.

---

==================================================
## 01 — DESIGN SYSTEM SOURCE OF TRUTH
==================================================

The existing Joy Portfolio design system is the **only** visual source of truth. An imported component is a source of *interaction ideas and structure* — never of color, type, radius, shadow, or motion decisions.

**Priority order, strict and non-negotiable:**

1. `docs/DESIGN_SYSTEM.md` (v3) — the written specification.
2. `src/styles/tokens.css`, `src/styles/layout.css`, `src/styles/motion.css`, `src/styles/typography.css` — its code implementation.
3. Existing approved portfolio components (`src/components/ui/*`, `src/components/site/*`) — the working precedent for how the tokens above are actually applied.
4. Imported 21st.dev/Aceternity component **structure** (its markup shape, prop surface, state logic) — usable as a reference, never verbatim.
5. Imported 21st.dev/Aceternity component **styling** — lowest priority. Its class names, colors, radii, shadows, and animation curves are not sources of truth for anything; they exist to be replaced, not read as intent.

This order never reverses. If step 5 and step 1 disagree — which, per `docs/21ST_COMPONENT_AUDIT.md`, they do on nearly every file audited — step 1 wins, unconditionally, with no "just this once" exception. A conflict between an imported component's styling and this design system is not a judgment call to make case-by-case; it is resolved by this priority order before normalization work even starts.

---

==================================================
## 02 — COLOR CONSISTENCY
==================================================

Every component must draw its color exclusively from the tokens defined in `src/styles/tokens.css`. No other color — no default Tailwind palette entry, no shadcn semantic token, no arbitrary hex — may appear in a normalized component's className or inline style.

### Approved token set (the entire palette — nothing else exists)

| Token | Hex | Role |
|---|---|---|
| `color-background` | `#F6F7F9` | Primary page background |
| `color-background-alt` | `#EDEFF3` | Section-break band |
| `color-surface` | `#FFFFFF` | Cards, form fields, elevated content |
| `color-ink` | `#0E1B33` | Headline/body text, nav text, structural rule lines |
| `color-ink-hover` | `#16274A` | Primary button hover only |
| `color-text-secondary` | `#4A5568` | Supporting copy, captions, metadata |
| `color-text-tertiary` | `#8A93A3` | Placeholders, disabled states, timestamps |
| `color-accent` | `#D9622B` | Non-text UI only: focus rings, active-state marks, secondary/text-link hover — **never** body/caption text color, **never** a large fill |
| `color-accent-hover` | `#B94E1E` | Accent hover/pressed state |
| `color-border` | `#E1E4EA` | Card borders, dividers, input borders |
| `color-error` | `#B3261E` | Inline form validation only |
| `white` / `black` / `transparent` / `current` | — | Tailwind base keywords, kept as-is |

That's the full set. There is no `color-success` (deliberately removed — see `DESIGN_SYSTEM.md` §1) and no purple/violet/indigo anywhere in this system.

### Explicitly forbidden, no exceptions

- Purple, violet, indigo (any shade, any utility)
- Arbitrary `black`/`zinc`/`neutral`/`slate`/`gray`/`stone` scale utilities (`bg-zinc-900`, `text-neutral-500`, etc.)
- shadcn's default semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `border-input`, `ring`, `ring-offset-*`) — these do not resolve to anything in this codebase's `@theme` (`--color-*: initial` removes the default palette entirely) and are not simply "off-brand," they generate **no CSS at all**
- `dark:*` variants of any kind — this site has one theme
- Any hex value not already listed in the table above

### Mapping table — translate, don't guess

When an imported component uses one of these, replace it exactly as follows. Do not invent a new mapping ad hoc; if a class isn't listed here, stop and resolve it against `DESIGN_SYSTEM.md` §1 before proceeding.

| Imported class/pattern | Normalize to | Note |
|---|---|---|
| `bg-background`, `bg-white` (page-level) | `bg-background` | Page background only, never a card/section fill |
| `bg-background` (card/surface-level) | `bg-surface` | White surfaces (cards, inputs) use `color-surface`, not `color-background` |
| `text-foreground` | `text-ink` | |
| `text-muted-foreground`, `text-zinc-500`, `text-neutral-500` | `text-text-secondary` or `text-text-tertiary` | Secondary = supporting copy; tertiary = placeholder/disabled/timestamp. Pick by role, not by how visually similar the shade looks. |
| `bg-primary` | `bg-ink` (buttons only) | Never reuse as a generic accent fill elsewhere |
| `text-primary-foreground` | `text-white` | |
| `bg-secondary`, `bg-muted` | `bg-background-alt` or `bg-surface` | By context: section band vs. card |
| `border`, `border-input`, `border-zinc-200`, `border-neutral-200` | `border-border` | |
| `ring-*`, `ring-offset-*`, focus box-shadow rings | `shadow-focus` | The only focus treatment this system defines: `0 0 0 2px color-accent` |
| `dark:bg-*`, `dark:text-*`, `dark:border-*` | **Delete entirely** | Not mapped — removed, no dark equivalent exists or is being built |
| `bg-zinc-900`/`bg-neutral-950` (dark-mode-only surface) | **Redesign for light mode** | Cannot be literally mapped — must be rebuilt against `color-surface`/`color-background`/`color-background-alt`, not translated 1:1 |
| Any purple/violet/rose/emerald/green accent | **Redesign** | No mapping exists; re-derive the intended emphasis using `color-accent` (sparingly, non-text only) or drop it |
| `text-red-*` / `text-destructive` (error states) | `text-error` | Inline form validation only, per §1's stated scope |

`color-accent` keeps its documented restriction through normalization: it may color icons, rings, underlines, and small active-state marks — never body or caption text, never a background fill larger than a chip/underline.

---

==================================================
## 03 — TYPOGRAPHY
==================================================

Two typefaces, one scale, no exceptions:

- **Display:** General Sans (`--font-display`) — medium (500)/semibold (600) only.
- **Body:** Inter (`--font-body`, self-hosted via `next/font/google`) — regular (400)/medium (500) only.

No third typeface may be introduced by any adapted component, ever — not for a "distinctive" testimonial quote, not for a logo wordmark, not for a stylistic flourish.

### Normalize every dimension of type — not just the font-family

An imported component's headline may match `font-family` after mapping and still be off-system if its size, weight, line-height, or tracking don't match. Normalize all five together, always through the closed class set below — never through a raw `text-[Npx]` arbitrary value, never through `font-black`/`font-extrabold`/`font-thin`, never through a bespoke `line-height` or `letter-spacing` inline style:

| Class | Size (desktop / mobile) | Weight | Line-height | Tracking | Use |
|---|---|---|---|---|---|
| `.text-display` | 72px / 40px | 600 | 1.05 | -0.02em | Home hero headline only — once per site |
| `.text-h1` | 56px / 34px | 600 | 1.1 | -0.01em | Page title — once per page |
| `.text-h2` | 40px / 28px | 600 | 1.15 | -0.01em | Section header — multiple per page |
| `.text-h3` | 28px / 22px | 500 | 1.2 | 0 | Card/component title |
| `.text-quote` | 24px / 20px | 500 italic | 1.4 | 0 | The one Quote component only |
| `.text-body-lg` | 20px / 18px | 400 | 1.5 | 0 | Lead paragraph copy |
| `.text-body` | 16px | 400 | 1.6 | 0 | Default body copy |
| `.text-label` | 13px | 500 | 1.4 | 0.06em, uppercase | Structural/graphic role: section numbers, tags, active states |
| `.text-caption` | 13px | 400 | 1.4 | 0.02em | Quiet/metadata role: timestamps, attributions, form labels |

The heading-hierarchy rule from `DESIGN_SYSTEM.md` §2 carries through normalization unchanged: a component may never reach "up" a level (a card title using `text-h2`) or "down" a level (a page title using `text-h3`). An imported component that visually implies a different hierarchy (e.g., an oversized testimonial headline at `text-6xl`) must be re-leveled into this table, not preserved at its original visual weight.

**Cross-page consistency requirement:** the same normalized type classes must produce identical results wherever they're used — Home, Work, Project Detail, Case Study, About, Contact, and any future Admin surface. A component is not "normalized" if it merely avoids obviously-wrong fonts; it must produce type that is indistinguishable in kind from type already on the site.

---

==================================================
## 04 — RADIUS
==================================================

Exactly three radius values exist in this system, each a multiple of the 8px spacing unit, plus the sharp-corner escape hatch:

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 8px | Chips/tags, icon hit-targets |
| `radius-md` | 16px | Buttons, standard cards, inputs, standard image containers |
| `radius-lg` | 24px | Large/spotlight image containers |
| `rounded-none` | 0 | Anywhere a sharp corner is deliberately wanted (Tailwind's static utility, unchanged) |

**Nothing above `radius-lg` exists in this system.** Forbidden, with no exceptions unless a future amendment to `DESIGN_SYSTEM.md` itself explicitly authorizes a new value (the same kind of deliberate, documented process that produced the v2→v3 radius change — not a component-level workaround):

- `rounded-full`
- `rounded-2xl`, `rounded-3xl`, `rounded-[Npx]` for any N > 24, `rounded-[3rem]`, `rounded-[40px]`, `rounded-[48px]`, or any other arbitrary/oversized value
- Pill-shaped buttons, chips, or badges of any kind

Buttons, cards, image containers, inputs, and every other interactive surface share this exact three-step hierarchy — an adapted component may not invent a fourth radius value "just for this one card," even if it visually resembles one of the three approved sizes but isn't literally one of them.

---

==================================================
## 05 — BUTTON SYSTEM
==================================================

There is exactly one Button component in this codebase: `src/components/ui/Button.tsx`. Its API is closed:

```ts
type ButtonVariant = "primary" | "secondary" | "text-link";
// href present -> renders next/link; href absent -> renders <button>
```

- **Primary:** `color-ink` fill, white text, hover → `color-ink-hover`.
- **Secondary:** transparent fill, `color-ink` text + 1px `color-ink` border, hover → `color-accent` text/border.
- **Text link:** transparent, underlined `color-ink`, hover → `color-accent`.
- Fixed 48px height (`h-6` at the 8px base), `space-3` horizontal padding, `text-body` weight 500 label, `radius-md`, 150ms ease-out color/border/fill transition, `shadow-focus` on focus-visible.

**No second Button implementation may be installed or referenced.** This explicitly rules out, as a standalone dependency:

- shadcn's `Button` (`class-variance-authority` + `@radix-ui/react-slot` + `asChild` polymorphism)
- Any Radix `Slot`-based button
- Any `cva`-driven variant system

If an imported component's button interaction is genuinely worth keeping (e.g., an icon-plus-label composition, a loading state), the *behavior* must be built as new logic inside `Button.tsx`'s existing API — extending its variant/prop surface in place — never as a parallel component that happens to look similar. There is one Button; every button on the site, adapted or original, renders through it.

All buttons, regardless of origin, must end up sharing: the same radius (`radius-md`), the same typography (`text-body`, weight 500), the same padding logic (`space-3` horizontal, 48px height), the same primary/secondary color treatment, the same focus state (`shadow-focus`), the same hover transition (150ms ease-out, color/border/fill only), and the same responsive behavior (no separate mobile button variant exists or should be invented).

---

==================================================
## 06 — SHADOWS
==================================================

Default posture: **no decorative drop shadows.** Depth and separation come from `color-border`, surface contrast (`color-surface` against `color-background`/`color-background-alt`), and spacing — never from shadow.

The only shadow value this system defines:

| Token | Value | Use |
|---|---|---|
| `shadow-none` | none | Default, everywhere |
| `shadow-focus` | `0 0 0 2px color-accent` | Focus-visible state on buttons/interactive controls only |

Forbidden on import, with no partial-credit version ("just a subtle one"):

- Multi-layer box-shadows (inset + outer stacks)
- Skeuomorphic "physical material" shadows (the kind seen in `components/1.txt`'s card/button treatments)
- Large floating/ambient shadows under cards, images, or panels
- Hover-triggered shadow "lift" effects (`hover:shadow-2xl`, `hover:shadow-xl`, etc.)

If an imported component uses shadow to communicate elevation or interactivity, that signal must be re-expressed through border and/or the existing `PortfolioMedia`/`ProjectCard` hover treatment (1.02 image scale, 400ms ease-out) — not preserved as shadow.

---

==================================================
## 07 — MOTION
==================================================

Motion exists only to confirm a state change (`DESIGN_SYSTEM.md` Principle 5) — never to perform, entertain, or demonstrate technical capability.

### Explicitly prohibited — carried over unchanged from the design system, zero exceptions during normalization

- Parallax scrolling
- Scroll-linked card/element transformations (scroll-driven `rotate`/`scale`/`translate` tied to `scrollYProgress`)
- Auto-playing carousels (including "infinite marquee" testimonial/logo strips)
- Bounce easing
- Spring physics (`type: "spring"` on any transition)
- Infinite decorative animation of any kind (looping without a stop condition)
- Cursor-follow/magnetic buttons, mouse-reactive tilt

Every one of these appears in at least one of the six audited components. None survive normalization as originally implemented — the interaction must be re-derived using an approved pattern, or dropped.

### Preferred / approved motion vocabulary

| Interaction | Motion | Duration | Easing |
|---|---|---|---|
| Button hover | Color transition | 150ms | ease-out |
| Link hover | Underline color shift | 150ms | ease-out |
| Project card / image hover | Scale 1.02 | 400ms | ease-out |
| Mobile nav overlay | Fade + 16px slide | 250ms | ease-in-out |
| Scroll-triggered reveal | Fade + 16px slide, once per element | 400ms | ease-out |
| Filter chip active state | Underline transition | 150ms | ease-out |
| Form field focus | Border-color transition | 150ms | ease-out |

`src/styles/motion.css`'s `.reveal`/`.is-visible` pair is the canonical implementation pattern (opacity 0→1, `translateY(16px)`→`none`, 400ms ease-out) and should be the template for any new reveal-style entrance, rather than a bespoke animation library sequence.

### Reduced motion is not optional

Every animated component, adapted or original, **must** implement a `prefers-reduced-motion: reduce` fallback that renders the final state immediately (no transition, no transform) — this is a per-component requirement, not a sitewide footnote satisfied once. None of the six audited components currently do this; it must be added during normalization, not assumed to be "fine because it's subtle."

**Default to no motion.** If an imported component's animation isn't necessary for understanding what happened or confirming an interaction succeeded, remove it during normalization rather than finding a compliant way to keep it.

---

==================================================
## 08 — RESPONSIVE CONSISTENCY
==================================================

Every normalized component must work identically in kind — not just "not broken" — across mobile, tablet, and desktop, using the site's existing responsive system, not a component-specific one.

### Breakpoints — use these names, not Tailwind's defaults

`src/styles/tokens.css` explicitly zeroes Tailwind's default breakpoint set (`--breakpoint-*: initial`) and replaces it with exactly three named breakpoints:

| Name | Range |
|---|---|
| `tablet:` | ≥768px |
| `desktop:` | ≥1200px |
| `wide:` | ≥1600px (no separate layout rule — `container-wide` still caps at 1280px) |

**Critical normalization fact:** because the defaults were removed, Tailwind's `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` prefixes generate **no responsive behavior at all** in this build. Every one of the six audited components uses `md:`/`lg:` extensively. During normalization, every occurrence must be rewritten to `tablet:`/`desktop:`/`wide:` — this is not a style preference, it's the difference between a working and a silently-inert responsive rule.

### Containers and grid — reuse, don't reinvent

- `container-narrow` (720px max) — case study copy, bio, form content.
- `container-wide` (1280px max, absolute cap even at `wide`) — hero, project grids, most sections.
- `container-full` (100vw) — full-bleed imagery, at most once per page.
- `grid-system` — 4-col mobile / 8-col tablet / 12-col desktop, with the documented 16/20/24px gutters.
- Spacing scale (`space-1`…`space-16`, 8px base) for all internal/section spacing — no arbitrary padding/margin values.

### Prohibited responsive patterns

- A separate visual system per breakpoint (e.g., a completely different card layout or color treatment on mobile vs. desktop, beyond the documented composition changes like Hero's three distinct tile arrangements)
- JS-only viewport detection (`window.innerWidth` checks, `resize` listeners) where a CSS breakpoint (`tablet:`/`desktop:`/`wide:`) would do the same job — several audited components (1, 6) use a mount-time or resize-driven `isMobile` boolean instead of CSS; this pattern must be eliminated during normalization unless the specific behavior is genuinely inexpressible in CSS (rare, and must be justified, not defaulted to)

---

==================================================
## 09 — ACCESSIBILITY
==================================================

Every adapted component must support, without exception:

- **Semantic HTML** — real `<label>`/`<button>`/`<nav>`/heading elements, not `<div>`s wearing their visual role. (Direct finding from the audit: `components/4.txt`'s floating label is a `<div>` of spans, not a `<label htmlFor>` — this is exactly the kind of regression normalization must catch and fix.)
- **Keyboard interaction** — every interactive element reachable and operable via keyboard alone, in a sensible tab order.
- **Visible focus state** — `shadow-focus` (the one focus treatment this system defines), never removed via `outline-none` without a replacement.
- **Accessible labels** — real, programmatically-associated labels for every form control; meaningful (non-empty, non-generic) `alt` text for every content image; `aria-hidden` correctly applied to genuinely decorative elements only.
- **ARIA only where necessary** — prefer native semantics; add ARIA to fill a real gap, not by default, and not as a substitute for semantic HTML.
- **Sufficient contrast** — respect the contrast rules already resolved in `DESIGN_SYSTEM.md` §1 (`color-accent` is restricted to non-text UI specifically because it fails 4.5:1 text contrast — this restriction may not be "adapted away" for a component that wants accent-colored text).
- **Reduced-motion support** — per §07 above, no exceptions.

**Do not sacrifice any of the above for a visual effect.** If an imported component's visual polish depends on removing a focus outline, skipping a label, or hijacking scroll in a way that breaks keyboard/screen-reader use, the polish is what gets cut during normalization — not the accessibility requirement.

---

==================================================
## 10 — IMAGE SYSTEM
==================================================

All portfolio imagery renders through the existing media architecture — primarily `src/components/site/PortfolioMedia.tsx`, which wraps `next/image`, enforces the token radius scale (`sm`/`md`/`lg`), a persistent `color-border`, the sitewide 1.02/400ms hover scale, and an honest placeholder state (`PlaceholderMedia`) for content that doesn't exist yet.

- Media is typed as `CoverMedia` (`src/types/project.ts`): either `{ kind: "image", src, alt, objectPosition?, layout? }` or `{ kind: "placeholder", category, alt, layout? }` — never a raw `<img src="...">` with a hardcoded remote URL.
- Aspect ratios come from the named constants in `src/content/media.ts` (`ASPECT.card`, `.tall`, `.square`, `.wide`, `.spotlight`, `.portrait`, `.galleryFull`) — never an inline arbitrary ratio.

### Forbidden image sources — no exceptions during normalization

Every one of these appeared in the audited components and must be replaced, not merely relocated:

- Unsplash (`images.unsplash.com`)
- Cloudinary demo URLs (`res.cloudinary.com`)
- ImageKit demo assets (`ik.imagekit.io`)
- Aceternity demo assets (`ui.aceternity.com`)
- `cdn.simpleicons.org` or any other third-party logo/icon CDN
- Any other remote placeholder/stock image host

**Production components must consume real project data through the existing content architecture** (`src/content/projects.ts`, `real-projects.ts`, and the `CoverMedia`/`Project` types) and images stored under `public/images/projects/` following the existing per-project structure — or the deliberate, clearly-labeled `PlaceholderMedia` state where real photography doesn't exist yet. A normalized component with no real content to show renders the honest placeholder, not a hotlinked stock photo standing in for one.

---

==================================================
## 11 — DEPENDENCY POLICY
==================================================

`package.json` currently declares exactly three runtime dependencies — `next`, `react`, `react-dom` — and no animation, icon, or utility-class library of any kind. That zero-dependency runtime footprint is a deliberate property of this codebase, not an oversight, and normalization must not casually spend it.

**Before installing any new package, in order:**

1. **Check `package.json`.** Confirm the capability isn't already available.
2. **Check whether an existing pattern already solves it.** E.g., icons → `src/components/icons.tsx`'s hand-built SVG set, not a new icon library; class merging → the plain template-literal concatenation already used in `Button.tsx`, not `clsx`/`tailwind-merge`; scroll-triggered reveal → `ScrollReveal.tsx` + `motion.css`'s `IntersectionObserver` pattern, not a new animation library.
3. **Check whether React/CSS/browser APIs alone can do it.** `IntersectionObserver`, CSS transitions, native `<details>`/`<dialog>`, `prefers-reduced-motion` media queries, etc. cover the overwhelming majority of what the audited components used a library for.
4. **Prefer the simplest existing solution**, even if it takes a few more lines than a library call would.

**Do not install a dependency solely because an imported component happened to use it.** `gsap`, `motion`/`framer-motion`, `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, and `react-use-measure` were all flagged in the audit as "not installed, and not justified by any current named use case" (`DESIGN_SYSTEM.md` Principle 6). None may be added as a side effect of porting a component. If a genuine, named use case for one of them emerges later, that is its own deliberate decision — argued on its own merits, reviewed on its own, and recorded as its own change — never bundled into a component-normalization pass.

---

==================================================
## 12 — COMPONENT ARCHITECTURE
==================================================

Every imported component, without exception, passes through this full pipeline before it may touch a production page:

```
IMPORT
  ↓
AUDIT              — documented per-component (docs/21ST_COMPONENT_AUDIT.md pattern):
  ↓                  purpose, dependencies, props, a11y/perf concerns, classification
ADAPT              — rewrite against this document's rules: tokens, radius,
  ↓                  typography, motion, Button API, image system
NORMALIZE          — pass every item in the §15 Visual Consistency Check
  ↓
ISOLATED TEST      — built and viewed in a non-production test surface (§13)
  ↓
RESPONSIVE TEST    — verified at mobile / tablet / desktop / wide
  ↓
ACCESSIBILITY TEST — keyboard-only pass, screen-reader spot check, contrast check,
  ↓                  reduced-motion check
VISUAL QA          — side-by-side comparison against existing approved components
  ↓
PRODUCTION APPROVAL — explicit sign-off before src/app or src/components/site
                       is touched
```

**Never:**

```
IMPORT
  ↓
PRODUCTION
```

Skipping any stage — including "it's a small change" or "it already looks close enough" — is treated as a process violation, not a shortcut.

---

==================================================
## 13 — ISOLATED COMPONENT TESTING
==================================================

No production page may be modified to test an adapted component. Testing happens in a surface that is reachable during development but excluded from the live site.

**Standard, using only Next.js's own routing (no new package required):** a route group such as `src/app/(lab)/lab/<component-name>/page.tsx`, explicitly guarded at the top of the page with a production check (`if (process.env.NODE_ENV === "production") return notFound();`), never linked from `SiteNav`, `SiteFooter`, or `src/content/site.ts`'s `nav` list, and never referenced by `sitemap`/`robots` output. This keeps the isolated component reachable at `/lab/<component-name>` in development while guaranteeing it 404s in a production build — no test framework, no Storybook, no new dependency.

The component is built and reviewed in this isolated surface first, against every rule in this document, **before** it is ever wired into (or used to replace/enhance) an existing production component or page. This document does not create the `(lab)` route group now — it defines the convention to use when normalization work actually begins.

---

==================================================
## 14 — CONTENT CONSISTENCY
==================================================

Every normalized component consumes the existing portfolio data model — `src/content/personal.ts`, `site.ts`, `projects.ts`, `real-projects.ts`, `media.ts` — and nothing else.

**Forbidden, without exception:**

- Fake clients (the "Powering the best teams" logo wall pattern from `components/2.txt`)
- Fake projects (the Cloudinary/Unsplash demo screenshots used across several audited components)
- Fake metrics (`components/1.txt`'s "365 Days Sober" counter — invented numeric content with no relationship to any real project)
- Fake testimonials (`components/5.txt`'s nine placeholder ERP-software quotes)
- Fake statistics of any kind
- Fake portfolio content generally — any copy, image, or data point that exists only because a demo needed something to display

**Do not invent personal information.** `personal.ts` holds real identity data (name, roles) — a normalized component may never introduce placeholder biographical content, invented job titles, or fabricated credentials to fill a layout gap.

If a normalized component needs a content field that doesn't exist yet (e.g., a logo-wall component would need a "companies worked with" field), that is a content-model change to propose and make deliberately in `src/content/` and `src/types/` — not something to fake inline inside the component to make a demo look complete.

---

==================================================
## 15 — VISUAL CONSISTENCY CHECK
==================================================

Before any adapted component may be marked **APPROVED**, run this checklist against the live, existing site (not against the design system document alone — the built site is the practical ground truth):

- [ ] **Color** — every color traces to a token in §02's table; no `dark:`, no off-palette utility, no arbitrary hex
- [ ] **Typography** — every text element maps to exactly one row of §03's table; no arbitrary size/weight; heading hierarchy not violated
- [ ] **Radius** — every corner is `radius-sm`/`md`/`lg`/`none`; nothing larger, nothing pill-shaped
- [ ] **Spacing** — every gap/padding/margin is on the `space-1`…`space-16` (8px) scale
- [ ] **Borders** — `color-border` only, 1px, used the same way existing cards/inputs/dividers use it
- [ ] **Shadows** — `shadow-none` by default, `shadow-focus` only on focus; nothing else
- [ ] **Motion** — matches an approved pattern from §07's table; includes a `prefers-reduced-motion` fallback; none of the seven prohibited techniques present
- [ ] **Buttons** — renders through `src/components/ui/Button.tsx`; no second Button implementation present anywhere in the diff
- [ ] **Image treatment** — renders through `PortfolioMedia`/`PlaceholderMedia`; uses an `ASPECT` constant; no hotlinked remote host
- [ ] **Responsive behavior** — uses `tablet:`/`desktop:`/`wide:`; no leftover `sm:`/`md:`/`lg:`/`xl:`/`2xl:`; no JS-only viewport branching where CSS would work
- [ ] **Accessibility** — semantic HTML, keyboard operable, visible focus, real labels, sufficient contrast

**The test that matters most:** the component should look like it was designed specifically for Joy Portfolio. It must not look like — and a reviewer glancing at it should not be able to say — "a 21st.dev component inserted into Joy Portfolio." If any checklist item fails, or if the component still visually "reads" as imported despite passing every individual item, it goes back to ADAPT, not forward to APPROVED.

---

==================================================
## 16 — COMPONENT CLASSIFICATION
==================================================

Every component carries exactly one of these four statuses at any point in time:

| Status | Meaning |
|---|---|
| **REJECTED** | Not appropriate for this portfolio. Conflicts with a named, deliberate design-system rule (not an ambiguous gap) and is not worth adapting. Stays rejected unless the underlying design-system rule itself is deliberately amended. |
| **ADAPT** | Useful concept, but the imported implementation must be substantially modified — colors, radius, typography, motion, and often the Button/label/image plumbing all need real rework — before it can enter the pipeline in §12. |
| **REBUILD** | The concept is useful but the imported implementation is unsuitable as a starting point at all (missing source, fundamentally incompatible architecture, or so far from the design system that porting-and-fixing costs more than writing fresh). Rebuilt from the design system outward, using the imported version only as inspiration for *what* it does, never *how* it's coded. |
| **APPROVED** | Has completed the full §12 pipeline, passed the §15 checklist, and received explicit production sign-off. |

**A component may never be marked APPROVED merely because it compiles, renders without errors, or "basically works."** Compiling is a precondition for entering the pipeline, not a stage of it.

---

==================================================
## 17 — CURRENT AUDIT DECISIONS
==================================================

Per `docs/21ST_COMPONENT_AUDIT.md`, the following classifications are in effect and are not reopened by this document:

| # | File | Component | Status |
|---|---|---|---|
| 1 | `components/1.txt` | `CinematicHero` | **REJECTED** — do not integrate |
| 2 | `components/2.txt` | `HeroSection` / `HeroHeader` | **REJECTED** — do not integrate |
| 3 | `components/3.text` | `PhoneMockupBasic` / `PhoneCarousel` | **REBUILD LATER** — see below |
| 4 | `components/4.txt` | Floating-label `Input` | **ADAPT** — see below |
| 5 | `components/5.txt` | `TestimonialsSection` | **REJECTED** — do not integrate |
| 6 | `components/6.txt` | `ContainerScroll` | **REJECTED** — do not integrate |

**Component 4 (`Input`):** ADAPT status applies **only if and when** its controlled `label`/`value` interaction shape becomes genuinely useful for a real form need (currently, the Contact form's existing bordered-input pattern already fully covers this — see `DESIGN_SYSTEM.md` §9). If adapted: the prohibited spring/bounce behavior, the disappearing label, the underline-only style, and the `zinc`/`dark:` palette are all removed — none of them survive normalization. Only the prop shape (`label: string`, `value: string`, controlled) is worth carrying forward, and it must be rebuilt around a real, always-visible, programmatically-associated `<label>` per §09.

**Component 3 (`PhoneCarousel`):** REBUILD LATER status applies **only if and when** a genuine mobile-app portfolio project enters the content model (`src/content/projects.ts`) and actually needs a device-frame presentation. It is not to be built preemptively "to demonstrate the component" or to have something ready — per §14, a component built to showcase itself rather than real content is exactly the kind of fake-content problem this standard prohibits. Its core carousel source is also still missing (see the audit's §2.3) and would need to be located or rebuilt from scratch regardless.

---

==================================================
## 18 — FINAL RULE
==================================================

The goal is **not**:

> "Use as many 21st.dev components as possible."

The goal **is**:

> "Use only the best interaction ideas from 21st.dev while making every component feel native to the Joy Portfolio design system."

- Quality > quantity.
- Consistency > novelty.
- Portfolio work > decorative UI.
- Usability > animation.
- Performance > visual gimmicks.

A component that clears every rule in this document but adds no real value to a visitor evaluating this portfolio's work is still not worth shipping. The bar is not "does it comply" alone — it's "does it belong."

---

*This document is a standard only. No packages were installed, no production components were modified, and no imported component was integrated in the course of producing it.*
