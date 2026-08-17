# 21ST_COMPONENT_AUDIT.md

## Inventory & Compatibility Audit — Imported 21st.dev / Aceternity Component Prompts

**Status:** Audit only. No code integrated, no packages installed, no existing pages or components modified as part of this document.

**Source of truth for all compatibility judgments below:** `docs/DESIGN_SYSTEM.md` (v3) and its implementation in `src/styles/tokens.css`, `src/styles/typography.css`, `src/styles/layout.css`, `src/styles/motion.css`. The imported files are treated strictly as inspiration/candidates to evaluate against that spec — never as a source of new tokens, colors, or conventions.

---

## 0. What was inspected

**Existing Joy Portfolio (source of truth):**
- Architecture: `src/app/{layout,page,not-found}.tsx`, `src/app/work/page.tsx`, `src/app/work/[slug]/page.tsx` — Next.js 16 App Router, React 19, TypeScript strict mode.
- Components: 28 files under `src/components/site/` (page sections) + `src/components/ui/` (`Button`, `Chip`, `Container`) + `src/components/icons.tsx` (hand-built SVG set, no icon library).
- Design system: `docs/DESIGN_SYSTEM.md` v3, implemented token-for-token in `src/styles/tokens.css` (Tailwind v4 `@theme`), `typography.css`, `layout.css`, `motion.css`.
- Dependencies: `package.json` — **only** `next`, `react`, `react-dom` (runtime) and Tailwind v4/TypeScript/ESLint (dev). Zero animation, icon, or utility-class libraries installed.
- Content architecture: `src/content/*.ts` (typed content modules: `personal`, `site`, `projects`, `media`, `real-projects`, `demo-projects`).

**Imported candidate files** (`components/*.txt`, project root — not under `src/`):
Each is a full "21st.dev-style" integration prompt: task instructions + complete component source (in fenced code blocks) + a `demo.tsx` + an `Install NPM dependencies` list. None of this code is currently wired into the app; nothing in `src/` imports from `components/*.txt`.

| File | Component name | One-line purpose |
|---|---|---|
| `components/1.txt` | `CinematicHero` | Full-viewport, GSAP scroll-hijacked cinematic hero for a mobile app landing page (sobriety-tracker app demo content) |
| `components/2.txt` | `HeroSection` / `HeroHeader` | Generic SaaS marketing hero + sticky nav + infinite client-logo marquee |
| `components/3.text` | `PhoneMockupBasic` / `PhoneCarousel` | Rotating iPhone-frame carousel for app screenshots (**core carousel source file not included**) |
| `components/4.txt` | `Input` (floating label) | Text input whose label animates upward letter-by-letter on focus |
| `components/5.txt` | `TestimonialsSection` | Auto-scrolling 3-column infinite testimonial marquee with a built-in dark-mode toggle |
| `components/6.txt` | `ContainerScroll` | Scroll-linked 3D tilt/scale "device frame" reveal (Aceternity-style) |

---

## 1. Component Inventory (detailed)

### 1.1 `CinematicHero` — `components/1.txt`

| Field | Detail |
|---|---|
| **Purpose** | Cinematic, scroll-driven hero for a mobile app's marketing landing page. Pins the viewport for a ~7000px scroll runway while a headline, an iPhone mockup, floating achievement badges, and an app-store CTA sequence animate in/out. |
| **Visual behavior** | Film-grain overlay, animated background grid, mouse-reactive 3D tilt on the phone mockup, skeuomorphic "physical" card/button materials (multi-layer inset/outer box-shadows, gradients, sheen), animated SVG progress ring, animated counter. |
| **Dependencies (code)** | `gsap`, `gsap/ScrollTrigger`, `cn` from `@/lib/utils` (not present in this repo). |
| **NPM packages required** | `gsap` (declared); `@/lib/utils` cn-helper is used but not declared or installed. |
| **Animation libraries** | GSAP + ScrollTrigger (scroll-pin, timeline sequencing, `requestAnimationFrame`-driven mouse parallax). |
| **External assets** | None (pure CSS/SVG, plus emoji used as icons). App Store / Google Play links point to `href="#"` placeholders. |
| **Props/API** | `CinematicHeroProps`: brand name, two taglines, card heading/description, a metric value/label, CTA heading/description, plus passthrough `HTMLAttributes<HTMLDivElement>`. All content is app-marketing shaped (brand name, "Days Sober" metric), not portfolio-shaped. |
| **Responsive behavior** | Explicit mobile/desktop branches inside the GSAP timeline (`isMobile` check on mount only, not on resize) and Tailwind breakpoints for layout order. Scroll-pin duration is fixed regardless of viewport. |
| **Accessibility concerns** | Scroll-jacking (`pin: true`, ~7000px runway) is a significant vestibular/motion concern with **no `prefers-reduced-motion` branch anywhere in the file** — direct conflict with DESIGN_SYSTEM.md §13's per-component requirement. Decorative layers are correctly `aria-hidden`, which is a plus. CTAs are non-functional placeholders. |
| **Performance concerns** | Pinned 7000px ScrollTrigger timeline, animated SVG `feTurbulence` grain filter, `backdrop-filter: blur(24px)` badges, continuous mousemove listener (mitigated by rAF but still global), many simultaneous layered box-shadows — heavy GPU/CPU cost, especially on mid-tier mobile. |
| **Compatibility — Next.js/TS setup** | Needs `"use client"` (present). `gsap`/`ScrollTrigger` registration is guarded for SSR (`typeof window !== "undefined"`), which is correct. `cn` import is unresolved in this repo as-is. |
| **Compatibility — design system** | **Fails broadly.** Uses `var(--color-foreground)`/`var(--color-background)` shadcn-style semantic tokens that don't exist in this repo's closed `@theme`; hardcoded hex colors (`#162C6D`, `#0A101D`, `#3B82F6`, etc.) unrelated to the ink/accent palette; heavy drop-shadows (Principle 3 explicitly forbids shadows as a separation technique); arbitrary `rounded-[32px]`/`rounded-[40px]`/`rounded-[1.25rem]` values outside the 3-step radius scale; scroll-hijack/parallax pattern is explicitly prohibited (§13). |
| **Where it could be used** | Nowhere in the current IA. This is an app-landing-page pattern; the portfolio has no "download our app" page, and Home already has an approved Hero (`src/components/site/Hero.tsx`). |
| **Classification** | **D — Not appropriate for this portfolio.** |

---

### 1.2 `HeroSection` (+ `HeroHeader`, `InfiniteSlider`, `ProgressiveBlur`, shadcn `Button`) — `components/2.txt`

| Field | Detail |
|---|---|
| **Purpose** | Generic SaaS product hero: sticky/blurring nav with mobile menu, large headline + two CTAs, background demo video, and a "Powering the best teams" infinite logo marquee below the fold. |
| **Visual behavior** | Nav background fades to `backdrop-blur` past a scroll threshold (`useScroll` from `motion`); mobile menu slides/fades via `data-state` attribute selectors; autoplaying looping muted background video; infinitely-scrolling logo row with edge fade + progressive blur masks. |
| **Dependencies (code)** | `next/link`, shadcn `Button` (`@radix-ui/react-slot`, `class-variance-authority`), `InfiniteSlider` (`framer-motion`, `react-use-measure`), `ProgressiveBlur` (`motion/react`), `lucide-react` (`Menu`, `X`, `ChevronRight`), `cn` from `@/lib/utils`. |
| **NPM packages required** | `motion`, `lucide-react`, `@radix-ui/react-slot`, `class-variance-authority`, `framer-motion`, `react-use-measure` — six new packages for one hero block, two of which (`motion` and `framer-motion`) are overlapping/duplicate installs of the same underlying animation engine imported two different ways across the same file set. |
| **Animation libraries** | `motion`/`framer-motion` (scroll progress subscription, infinite `animate()` loop, mask/blur transitions). |
| **External assets** | Remote video (`ik.imagekit.io` CDN), 8 remote logo images from `cdn.simpleicons.org`. |
| **Props/API** | No props — `HeroSection` is a hardcoded, non-parameterized block; all copy ("Build 10x Faster with NS", menu items, logo list) is placeholder marketing content baked into the component. |
| **Responsive behavior** | Tailwind breakpoints (`md`, `lg`) throughout; mobile nav becomes a dropdown panel via `group-data-[state=active]`. |
| **Accessibility concerns** | Menu button has correct `aria-label` toggling; icon cross-fade uses `group-data-*` selectors that need the `dark:`/group infra to work as intended. Background **autoplaying video** and an **infinite, non-pausable logo marquee** have no reduced-motion handling. Decorative logo images have real (non-empty) `alt` text, which is fine, but the marquee duplicates all children for the loop illusion, and the duplicate set is not marked `aria-hidden` (unlike the more careful treatment in `components/5.txt`), so screen readers may announce every logo twice. |
| **Performance concerns** | Autoplay `<video>` adds real network/decode cost for a purely decorative background element; `useScroll` subscription re-renders nav state on every scroll tick; the logo `InfiniteSlider` runs an uncapped `animate()` loop indefinitely, including when scrolled off-screen (no viewport gating shown). |
| **Compatibility — Next.js/TS setup** | `"use client"` present. Uses plain `<img>` for logos (Next's `no-img-element` ESLint rule under `eslint-config-next` will flag this) instead of `next/image`; none of the referenced image/video hosts are in `next.config.ts`'s (currently empty) `images.remotePatterns`, so even switching to `next/image` would need config changes. |
| **Compatibility — design system** | **Fails broadly.** Entirely built on shadcn's semantic Tailwind tokens (`bg-background`, `text-muted-foreground`, `bg-primary`, `border-input`, `dark:hover:bg-white/5`, etc.) — none of which exist in this repo's closed token set (`src/styles/tokens.css` zeroes the default Tailwind palette via `--color-*: initial`). Ships full `dark:` variants for a single-theme site. `rounded-full`, `rounded-3xl`, `rounded-[3rem]` all exceed the `radius-lg` (24px) cap and violate the explicit "no pill shapes" rule. Introduces a second, competing `Button` component (`cva`/`asChild`/Radix `Slot`-based) that duplicates and conflicts with the existing hand-rolled `src/components/ui/Button.tsx` (3 fixed variants, no `asChild`). The client-logo marquee has no equivalent field anywhere in `src/content/*` — there is no "logos of companies I've worked with" concept in this portfolio's content model. |
| **Where it could be used** | Nowhere as a composite. The *concept* of a "featured in / tools used" logo strip is the only piece with any future relevance, and only if a content field for it is deliberately added later — not a current gap. |
| **Classification** | **D — Not appropriate for this portfolio** (whole composite). Its `InfiniteSlider`/`ProgressiveBlur` sub-primitives are technically portable in isolation, but nothing in the current site calls for them (Principle 6: "no component ships without a named use case") — noted only as a **C**-level idea for a possible future "tools/skills marquee," not a current recommendation. |

---

### 1.3 `PhoneMockupBasic` / `PhoneCarousel` — `components/3.text`

| Field | Detail |
|---|---|
| **Purpose** | Displays a rotating carousel of app screenshots inside an iPhone-style frame — the kind of element a UI/UX case study page might use to showcase a mobile app project. |
| **Visual behavior** | Unknown in detail — **the actual `PhoneCarousel` implementation lives in `@/components/ui/phone-mockups-1-utils/phone-carousel`, and that file's source is not included in this prompt.** Only the thin wrapper (`PhoneMockupBasic`) and a `demo.tsx` are provided. |
| **Dependencies (code)** | Wrapper imports `ImageItem`/`PhoneCarousel` from the (missing) utils file. The prompt separately bundles shadcn's `Button` (`@radix-ui/react-slot`, `class-variance-authority`) as a "dependency," even though the visible wrapper code never references `Button` — suggesting the missing carousel file uses it internally (e.g., prev/next controls) but this can't be confirmed. |
| **NPM packages required** | `@radix-ui/react-slot`, `class-variance-authority` (declared); real requirements are unknown until the missing carousel source is located. |
| **Animation libraries** | Unknown (not visible in the provided code). |
| **External assets** | 4 remote screenshot images hosted on `res.cloudinary.com` (Behance, Notion, "One", Reddit app screens) — demo content only, not usable for a real case study without replacement. |
| **Props/API** | `PhoneCarousel` accepts `images: ImageItem[]` (`{ src, alt }`) per the wrapper's usage — the only fact establishable from the visible code. |
| **Responsive behavior** | Unknown (implementation not visible). |
| **Accessibility concerns** | Unknown — carousels of this kind commonly need pause/prev/next controls and non-auto-advancing behavior to satisfy WCAG 2.2.2, but this can't be verified without the missing source. |
| **Performance concerns** | Unknown for the same reason. |
| **Compatibility — Next.js/TS setup** | Cannot be fully assessed — the component as supplied **will not compile**, since its only import target doesn't exist in this file. |
| **Compatibility — design system** | Cannot be fully assessed for the same reason; the visible wrapper itself has no styling to judge. The *concept* (a phone-frame device mockup) doesn't inherently conflict with the design system the way components 1, 2, 5, 6 do — a device-frame treatment is a plausible, editorial way to present mobile UI work, and nothing in DESIGN_SYSTEM.md rules it out. |
| **Where it could be used** | If rebuilt from scratch (not ported) using `PortfolioMedia`/token radii, this concept could plausibly support a case-study section for a mobile app project — but no such project currently exists in `src/content/projects.ts` / `real-projects.ts`, so there's no current placement, only a hypothetical future one. |
| **Classification** | **C — Experimental / optional**, blocked on missing source. Cannot be honestly upgraded past "experimental" until `phone-carousel.tsx` is located or the concept is rebuilt natively against this design system (dropping the shadcn `Button` dependency entirely). |

---

### 1.4 Floating-label `Input` — `components/4.txt`

| Field | Detail |
|---|---|
| **Purpose** | A single-line text input whose label sits centered over the field until focus/typing, at which point each letter of the label animates upward and fades, functioning as a floating-label effect. |
| **Visual behavior** | On focus or non-empty value, label letters individually translate up (`y: "-120%"`) and shift color via a spring, staggered 0.05s per character; underline-only input (bottom border, no box). |
| **Dependencies (code)** | `motion` (`motion/react`'s `motion` component), `cn` from `@/lib/utils` (not present in this repo). |
| **NPM packages required** | `motion`. |
| **Animation libraries** | Motion (Framer Motion's current package name) — spring-based per-letter stagger. |
| **External assets** | None. |
| **Props/API** | `label: string`, `value: string`, `className?: string`, plus passthrough `InputHTMLAttributes`. Small, clean, controlled-component API — the best-scoped prop surface of the six candidates. |
| **Responsive behavior** | None needed/implemented — a single-line input has no breakpoint logic. |
| **Accessibility concerns** | **The floating "label" is a `motion.div` of individually-spanned characters, not a real `<label>` element associated with the input via `htmlFor`/`id`.** It is visually a label but not programmatically one — a real regression for screen-reader users versus a standard `<label>`. It also directly conflicts with DESIGN_SYSTEM.md §9's own form spec: *"Label: `text-caption`, always visible above the field"* — this component's entire premise is making the label disappear on focus/fill, which is the opposite of "always visible." No `prefers-reduced-motion` handling for the spring animation, despite §13 requiring one per component. Placeholder-less password-manager/autofill UX may also break since there's no persistent visible label once a browser autofills the value. |
| **Performance concerns** | Negligible — a handful of animated `<span>` elements per input, only re-triggered on focus/blur/value transitions. |
| **Compatibility — Next.js/TS setup** | `"use client"` present. `cn` import unresolved in this repo as-is (trivial to inline away — the component's only use of `cn` is a single class-merge on the wrapper `div`). |
| **Compatibility — design system** | Hardcoded `text-zinc-900`/`zinc-50`/`dark:` classes instead of `color-ink`/`color-border`/`color-accent` tokens; underline-only style contradicts §9's **v3** update, which moved inputs to a full bordered box (`radius-md`, `color-border` on all sides, `color-accent` border + `shadow-focus` on focus) specifically because "an underline has no visible corner to round." Uses spring easing, which §13 explicitly lists under "Explicitly prohibited." |
| **Where it could be used** | Contact form (`ContactSection.tsx`) is the only field in the whole site that takes text input — but the existing form spec (bordered box, always-visible `text-caption` label, `color-accent` focus + `shadow-focus`) already fully covers that need and was a deliberate, documented v2→v3 revision. Adopting this component would mean *reverting* an already-resolved design decision. |
| **Classification** | **C — Experimental / optional.** The controlled-input API shape is worth borrowing as an idea, but the concrete implementation (animated disappearing label, spring easing, underline style, hardcoded zinc palette) conflicts with a specific, already-resolved section of the design system and would need a full rebuild, not an adaptation, to be usable. |

---

### 1.5 `TestimonialsSection` — `components/5.txt`

| Field | Detail |
|---|---|
| **Purpose** | Marketing-site testimonial wall: three columns of quote cards that scroll vertically and infinitely, plus a page-level light/dark mode toggle demo. |
| **Visual behavior** | Each column is a duplicated (`×2`) list of quote cards animated via `motion.ul` with `animate={{ translateY: "-50%" }}`, `repeat: Infinity`, `ease: "linear"` — a continuous, non-stoppable auto-scroll. Cards `whileHover`/`whileFocus` scale up with a spring and a heavy drop-shadow. A fixed top-right button toggles a `.dark` class on `<html>`. |
| **Dependencies (code)** | `framer-motion`, `lucide-react` (`Sun`, `Moon`). |
| **NPM packages required** | `lucide-react`, `framer-motion`. |
| **Animation libraries** | Framer Motion (infinite linear translateY loop, per-card hover/focus springs, `whileInView` entrance on the section). |
| **External assets** | 9 hotlinked Unsplash avatar images (`images.unsplash.com`), placeholder ERP-software testimonial copy. |
| **Props/API** | None — fully hardcoded data array (`testimonials`) and fully hardcoded copy ("What our users say" / ERP quotes) baked into the component; not parameterized for reuse with different content. |
| **Responsive behavior** | Column 2 hidden below `md`, column 3 hidden below `lg` — a real responsive consideration, one of the better-handled aspects of this file. |
| **Accessibility concerns** | **This is a textbook auto-playing carousel** — DESIGN_SYSTEM.md §13 lists "auto-playing carousels" under "Explicitly prohibited" by name. It runs forever with no pause/stop control, which is also a WCAG 2.2.2 (Pause, Stop, Hide) concern for any auto-updating content lasting longer than 5 seconds. To its credit, the duplicated half of each column is correctly `aria-hidden="true"`/`tabIndex={-1}`, avoiding double-announcement — better accessibility hygiene than `components/2.txt`'s marquee, but it doesn't fix the core "can't be paused" problem. No `prefers-reduced-motion` fallback anywhere. |
| **Performance concerns** | Up to 54 simultaneously-animated list items (9 testimonials × 2 for the loop × 3 columns) with continuous `transform` animation that never stops, including while scrolled out of view (no `viewport`/`inView` gating on the marquee itself — only the outer section wrapper has a one-time `whileInView`). |
| **Compatibility — Next.js/TS setup** | No `"use client"` directive despite using `useState`/`useEffect`/Framer Motion hooks — **this file would fail to build as a Server Component as-written** and needs `"use client"` added just to compile correctly under the App Router. Uses plain `<img>` (ESLint `no-img-element` flag again) for hotlinked Unsplash avatars with no `next.config.ts` remote-pattern entry. |
| **Compatibility — design system** | **Fails broadly and on multiple explicit, named rules simultaneously**: auto-playing carousel (prohibited by name in §13), spring easing on hover (prohibited by name in §13), `rounded-3xl`/`rounded-full` (exceeds `radius-lg`, violates the "no pill shapes" rule), heavy `box-shadow` on hover (Principle 3: "No drop shadows as a separation technique"), full shadcn/`neutral-*`/`dark:` palette instead of design tokens, and a redundant dark-mode toggle the site doesn't have or need. Note: DESIGN_SYSTEM.md §7 *already* defines a consolidated **Quote component** for testimonials/pull-quotes (bordered `color-surface` card, `text-quote`, `color-accent` rule, `text-caption` attribution) — this is the correct, already-approved pattern for testimonial content on this site; this imported component reinvents the same need incompatibly rather than filling a gap. |
| **Where it could be used** | Nowhere. If the site ever adds a testimonials section, the already-specced Quote component (§7) is the correct vehicle, not this one. |
| **Classification** | **D — Not appropriate for this portfolio.** Multiple explicit, named rule violations, and the underlying content need (testimonials) is already solved by an approved, unused-so-far component. |

---

### 1.6 `ContainerScroll` (+ `Header`, `Card`) — `components/6.txt`

| Field | Detail |
|---|---|
| **Purpose** | Aceternity-style scroll-linked reveal: as the user scrolls a tall (`60rem`/`80rem`) container, a title fades/translates and a large framed "device" card rotates from a tilted 3D perspective (`rotateX: 20 → 0`) down to flat while scaling in — commonly used to showcase a product screenshot. |
| **Visual behavior** | `useScroll`/`useTransform` (Framer Motion) map scroll progress within the container to `rotateX`, `scale`, and `translateY` on the card and title; a heavy multi-layer `box-shadow` and a hardcoded dark bezel (`#222222` fill, `#6C6C6C` border) frame arbitrary `children`. |
| **Dependencies (code)** | `framer-motion` (`useScroll`, `useTransform`, `motion`, `MotionValue`). |
| **NPM packages required** | `framer-motion`. |
| **Animation libraries** | Framer Motion, scroll-linked (not time-based) — a parallax-style effect. |
| **External assets** | Demo only: a `next/image` pointed at `ui.aceternity.com/_next/image?...` — a documentation-site URL, not a usable asset, and not in `next.config.ts`'s remote patterns. |
| **Props/API** | `titleComponent: string \| ReactNode`, `children: ReactNode` — a clean, generic wrapper API; the best-scoped API surface after the `Input` component. |
| **Responsive behavior** | One `resize`-listener-driven `isMobile` boolean (checked at `768px`) swaps the scale range; otherwise the same scroll-linked behavior runs on all viewport sizes, including small ones — scroll-linked 3D transforms on mobile are also more likely to feel janky given typically lower-powered GPUs/compositors. |
| **Accessibility concerns** | Scroll-linked parallax transform with **no `prefers-reduced-motion` fallback** — DESIGN_SYSTEM.md §13 explicitly lists "Parallax scrolling" under "Explicitly prohibited," and separately requires every animated interaction to degrade for reduced motion. This is a direct, named conflict on both counts. |
| **Performance concerns** | `useTransform` recalculates three separate motion values on every scroll frame for as long as the ~960–1280px-tall container is in the scroll range; six stacked `box-shadow` layers are recomputed against a changing `scale`/`rotateX`, which is more compositor work than a static shadow. |
| **Compatibility — Next.js/TS setup** | `"use client"` present. The `Header` sub-component types its props as `any` (`export const Header = ({ translate, titleComponent }: any) => ...`) — a type-safety regression against this repo's `strict: true` TypeScript config; would need real typing before it could pass this project's type checks cleanly. |
| **Compatibility — design system** | **Fails broadly.** Parallax scroll-linked motion is explicitly prohibited by name (§13). Hardcoded dark bezel colors (`#222222`, `#6C6C6C`) have no relationship to `color-ink`/`color-border`. Multi-layer box-shadow again violates Principle 3. `rounded-[30px]` and `md:rounded-[3rem]` sit well outside the 3-step radius scale and its explicit "no pill/oversized rounding" boundary. |
| **Where it could be used** | Nowhere in the current IA — the closest candidate, a project's cover/spotlight image, is already covered by the approved `radius-lg` framed treatment in `ProjectCard`/`ProjectHero`/`PortfolioMedia`, which was a deliberate v3 decision (DESIGN_SYSTEM.md §4 notes full-bleed + rounded corners were judged incompatible, favoring a contained frame instead — the opposite instinct from this component's 3D-tilt showcase). |
| **Classification** | **D — Not appropriate for this portfolio.** |

---

## 2. Dependency Inventory

### 2.1 NPM packages referenced across all six files (none currently installed)

| Package | Referenced by | Current status | Purpose in source |
|---|---|---|---|
| `gsap` | 1 | Not installed | Scroll-pin timeline, mouse-tilt tween |
| `motion` | 2, 4 | Not installed | Framer Motion's current package name (`motion/react` import path) |
| `framer-motion` | 2 (dep list only), 5, 6 | Not installed | Same underlying library as `motion`, imported under its legacy package name — **installing both `motion` and `framer-motion` would be redundant/conflicting; the codebase should pick exactly one name if this library is ever adopted.** |
| `lucide-react` | 2, 5 | Not installed | Icon components (`Menu`, `X`, `ChevronRight`, `Sun`, `Moon`) — the existing site deliberately hand-rolls its own icon set instead (`src/components/icons.tsx`) |
| `@radix-ui/react-slot` | 2, 3, 4 (via shadcn `Button`) | Not installed | Powers shadcn `Button`'s `asChild` polymorphism |
| `class-variance-authority` | 2, 3, 4 (via shadcn `Button`) | Not installed | Variant-class management for shadcn `Button` — the existing `Button.tsx` achieves the same 3-variant need with a plain `Record` lookup, no library |
| `react-use-measure` | 2 | Not installed | Element size measurement for `InfiniteSlider` |

### 2.2 Non-npm "phantom" dependency

- **`@/lib/utils` (`cn` helper)** — imported by components 1, 2, 3 (indirectly via `Button`), and 4, but **this file does not exist anywhere in this repository**. Every one of these components would fail to compile today, independent of any design-system concerns. The existing codebase's equivalent (`Button.tsx`) instead joins classes with a plain template literal — no `clsx`/`tailwind-merge` dependency exists or is implied elsewhere in the project.

### 2.3 Missing source dependency

- **`@/components/ui/phone-mockups-1-utils/phone-carousel`** (component 3) — referenced but not included in `components/3.text`. The file cannot be evaluated as a working component until this is supplied or the concept is rebuilt from scratch.

### 2.4 External network assets referenced (all would need replacing, not just relocating)

| Host | Used by | Type |
|---|---|---|
| `api.fontshare.com` | *(already in use by the existing site for General Sans — not a new dependency)* | font CSS |
| `ik.imagekit.io` | 2 | background demo video |
| `cdn.simpleicons.org` | 2 | 8 client-logo images |
| `res.cloudinary.com` | 3 | 4 app-screenshot images |
| `images.unsplash.com` | 5 | 9 avatar images |
| `ui.aceternity.com` | 6 (demo only) | one screenshot image |

None of these hosts are present in `next.config.ts`'s `images.remotePatterns` (currently unset/empty), and several components use raw `<img>` instead of `next/image` in the first place, which sidesteps that config but loses Next's image optimization and will surface `eslint-config-next`'s `no-img-element` warning.

---

## 3. Compatibility Analysis — systemic findings

These four findings recur across nearly every file and are worth stating once rather than six times:

1. **Token vocabulary mismatch.** All six files are written against shadcn/ui's default semantic Tailwind tokens (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `border-input`, `text-muted-foreground`, `zinc-*`, `neutral-*`, `ring-offset-background`, etc.). This repo's Tailwind v4 `@theme` (`src/styles/tokens.css`) explicitly zeroes the default palette (`--color-*: initial`) and replaces it with a closed, named set (`color-background`, `color-ink`, `color-accent`, …). Classes like `bg-primary` or `text-zinc-500` will not generate *any* CSS in this project — they are silently broken, not just off-brand.
2. **No dark mode.** Every file ships `dark:` variants, and one (`components/5.txt`) ships an actual dark/light toggle. This portfolio is single-theme by design (nothing in `DESIGN_SYSTEM.md` or the codebase defines a `dark` variant strategy) — all `dark:` classes are dead weight at best, and the toggle is a feature this project doesn't have and hasn't asked for.
3. **Motion-rule violations are the norm, not the exception.** DESIGN_SYSTEM.md §13 names four techniques as "Explicitly prohibited": parallax scrolling, auto-playing carousels, bounce/spring easing, and cursor-follow/magnetic buttons. Between them, the six files use **three of the four by name** (component 1: scroll-pin/parallax + mouse-tilt; component 5: auto-playing carousel + spring hover; component 6: parallax scroll-link). None of the six provide the `prefers-reduced-motion` fallback that §13 requires per-component.
4. **Two Button systems would collide.** Three of the files (2, 3, 4-adjacent) depend on shadcn's `cva`/Radix-`Slot`-based `Button`, a fully different API (`asChild`, `variant`/`size` enums via `class-variance-authority`) from the existing, approved `src/components/ui/Button.tsx` (fixed `primary`/`secondary`/`text-link`, `href`-vs-`onClick` discriminated union). Installing the shadcn version alongside the existing one would mean two components answering to the same conceptual role with incompatible props.

---

## 4. Recommended Use Cases

Given the findings above, **no imported component has a recommended current use case as supplied.** The only forward-looking notes are:

- **Component 3 (phone mockup/carousel)** — the *concept* of a device-frame presentation for mobile UI work is not itself in conflict with the design system, and could be worth a from-scratch build (using `PortfolioMedia` + token radii, no autoplay, no shadcn `Button`) *if and when* a mobile-app case study is added to `src/content/projects.ts`. No such project exists today, so there is no current placement.
- **Component 4 (floating-label input)** — the controlled `label`/`value` prop shape is a reasonable API reference, but the visual/motion execution directly contradicts the already-resolved `DESIGN_SYSTEM.md` §9 forms spec. Any future contact-form work should keep the existing bordered-input pattern, not this one.
- **Everything else (1, 2, 5, 6)** — solve problems (app-landing hero, SaaS marketing hero, testimonial wall, product-screenshot parallax reveal) that don't correspond to any gap in the current, approved information architecture (Home, Work, Project detail). They are not "adapt later" candidates; they're a different genre of site.

---

## 5. Components to Reject

| Component | File | Reason |
|---|---|---|
| `CinematicHero` | `components/1.txt` | Scroll-hijacking + mouse-parallax (explicitly prohibited motion), full shadcn/hardcoded-hex palette, heavy multi-layer shadows, app-landing content model with no portfolio equivalent |
| `HeroSection` / `HeroHeader` | `components/2.txt` | Duplicates/would-replace the existing, approved `Hero.tsx` + `SiteNav.tsx`; competing `Button` implementation; autoplay video; logo marquee with no content-model support; full shadcn/`dark:` token usage |
| `TestimonialsSection` | `components/5.txt` | Auto-playing carousel and spring easing, both explicitly prohibited by name; `rounded-full`/heavy shadows; redundant dark-mode toggle; the testimonial need is already solved by the approved, unused Quote component (§7) |
| `ContainerScroll` | `components/6.txt` | Parallax scroll-linked motion, explicitly prohibited by name; hardcoded non-token bezel colors; heavy shadow stack; `any`-typed prop breaks strict TS |

## 6. Components to Adapt (if ever pursued — not now)

| Component | File | What would need to change |
|---|---|---|
| Floating-label `Input` | `components/4.txt` | Full rebuild, not a port: drop spring easing, restore an always-visible real `<label htmlFor>` (per §9), swap to bordered-box style with `color-border`/`color-accent`/`shadow-focus`, remove `zinc`/`dark:` classes, add `prefers-reduced-motion` fallback. Only the controlled `label`/`value` prop shape is worth keeping. |
| `PhoneMockupBasic` / `PhoneCarousel` | `components/3.text` | Cannot be "adapted" yet — its core logic is an unresolved missing file. If pursued, rebuild natively (no shadcn `Button`, no autoplay-without-controls, `PortfolioMedia`-based framing, token radii) once a mobile-app project actually exists in the content model to justify it. |

## 7. Components Safe to Integrate As-Is

**None.** All six files fail one or more of: compiles-without-modification, uses only existing design tokens, respects the documented motion/shadow/radius rules, or avoids introducing a second competing primitive (Button, icon set, utility helper) for a role the site already has covered.

---

## 8. Potential Design-System Conflicts (summary table)

| Rule (DESIGN_SYSTEM.md) | Violated by | How |
|---|---|---|
| §1 closed color palette | 1, 2, 3(via Button), 5, 6 | shadcn semantic tokens / hardcoded hex not in `tokens.css` |
| §5 radius scale caps at `radius-lg` (24px), no pill shapes | 1, 2, 5, 6 | `rounded-full`, `rounded-3xl`, `rounded-[40px]`, `rounded-[3rem]`, `rounded-[30px]` |
| §5 shadows: `shadow-none` default, only a focus ring is scaled | 1, 5, 6 | multi-layer skeuomorphic/hover box-shadows |
| Principle 3: no drop shadows as a separation technique | 1, 5, 6 | same as above |
| §2 closed type scale / two-typeface system | 1, 2, 5 | arbitrary `text-5xl`…`text-[8rem]`, `font-black`/`font-extrabold`, default Tailwind font stack |
| §9 forms: bordered input, always-visible `text-caption` label | 4 | underline-only input, label hides on focus/fill |
| §13 explicitly prohibited: parallax scrolling | 1, 6 | ScrollTrigger pin + mouse-tilt (1); `useScroll`/`useTransform` scroll-linked card (6) |
| §13 explicitly prohibited: auto-playing carousels | 5 (and possibly 3, unverified) | infinite `repeat: Infinity` marquee |
| §13 explicitly prohibited: bounce/spring easing | 4, 5 | `type: "spring"` label animation (4); `whileHover`/`whileFocus` spring (5) |
| §13: every animated interaction needs a stated reduced-motion fallback | 1, 2, 4, 5, 6 | none of the five provide one |
| No dark mode / single theme | 1, 2, 4, 5 | `dark:` variants throughout, plus a working toggle in 5 |
| One `Button` component, one API | 2, 3, 4(dep) | shadcn `cva`/Radix `Slot` Button competes with `src/components/ui/Button.tsx` |
| Principle 6: no component without a named use case | 2 (logo marquee), 5 (testimonials — already covered by §7 Quote) | content model has no field/slot for either |

---

## 9. Recommended Integration Order

Because zero components clear the bar for direct integration, "integration order" here means the order in which *investigative/preparatory* work would need to happen before any of these ideas could responsibly move forward — not a rollout plan.

1. **Do not integrate 1, 2, 5, or 6 in any form.** They conflict with named, deliberate rules in an already-approved spec (not ambiguous gaps) — reopening them would mean re-litigating decisions the design system document already made (e.g., the v2→v3 radius change, the "no pill shapes" boundary, the explicit motion prohibitions).
2. **Locate or reconstruct `phone-carousel.tsx`** (component 3's missing dependency) before forming any real opinion on that concept — right now it's an idea sketch, not an evaluable component.
3. **If a mobile-app case study is ever added to the content model**, revisit the phone-mockup concept as a from-scratch build against `PortfolioMedia`/token radii — never as a port of the supplied code, and never with autoplay unless a pause control ships with it.
4. **If the contact form is ever revisited**, treat `components/4.txt` purely as a prop-shape reference (`label`/`value`), and re-derive the visual/motion behavior from `DESIGN_SYSTEM.md` §9 as it stands today — that section was already deliberately revised once (v2 underline → v3 bordered box) and this component would undo that revision.
5. **Any future animation-library adoption** (GSAP, Motion/Framer Motion, or otherwise) should be its own deliberate, named decision — evaluated against Principle 6 ("no token, component, or variant ships without a named use case") — not an incidental side effect of porting one of these six files. Given the zero-dependency footprint of the current site, that bar should stay high.
6. Until any of the above happens: **`src/app`, `src/components`, `src/styles`, and `src/content` remain untouched**, per this task's constraints.

---

*This document is an audit only. No packages were installed and no existing pages or components were modified in the course of producing it.*
