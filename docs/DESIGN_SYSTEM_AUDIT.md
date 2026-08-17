# DESIGN_SYSTEM_AUDIT.md
## Senior audit of DESIGN_SYSTEM.md v1
**Verdict:** Sound overall direction, but the spec has real gaps that would cause implementation drift and accessibility failures if built as-written. Findings below are grouped and each maps to a fix applied in DESIGN_SYSTEM.md v2.

---

## A. Inconsistencies

1. **Duplicate token, two names, one value.** `color-text-primary` (`#0E1B33`) and `color-border-strong` (`#0E1B33`) are identical values doing overlapping jobs (deep-blue text *and* deep-blue structural rules). Two tokens for one value invites drift the moment someone updates one and not the other. → **Fix:** collapse into a single `color-ink` token, aliased for both roles.

2. **"Primary button" has three silently different definitions.** Default primary (deep-blue fill), "Primary (on dark section)" (accent fill), and the hover states of each move in different directions (deep-blue→accent, vs accent→accent-hover). But no "dark section" is defined anywhere else in the system — Section 0 explicitly avoids dark-mode-heavy design, and no page/section in PROJECT_SPEC calls for a dark background. This variant is solving a problem the system doesn't have. → **Fix:** remove the dark-section variant; one Primary, one Secondary, one Text Link.

3. **Two different "quote" treatments contradict the type rules.** Section 2 states headlines are the *only* sanctioned use of the Display face, and body-length text must use the Body face. Section 7 then uses Display face for both the Testimonial quote *and* the Case-Study pull-quote — via two different size/style rules for what is conceptually the same content type (a quotation). → **Fix:** one Quote component, one Display treatment, reused in both contexts.

4. **Redundant/self-contradicting breakpoint note.** Section 11's `wide` row says "container-wide caps at 1280px" as if it's a rule specific to that breakpoint, but `container-wide` is already globally capped at 1280px in Section 4. Restating it inside the breakpoint table reads as a second, competing definition. → **Fix:** remove the restatement; state once in Section 4 that no container ever exceeds its max-width regardless of viewport.

5. **Icon target-size rule contradicts itself.** Section 8 requires a 40×40px minimum tap target for icon buttons, then the Footer sub-section specifies social icons at 24×24px with no stated hit-slop/padding — a direct violation of the rule stated two paragraphs earlier in the same file. → **Fix:** keep the 24×24px *visual* icon but require 40×40px minimum *interactive* hit area via padding, stated explicitly.

---

## B. Unnecessary Components

1. **Compact 40px button variant.** Defined in Section 6 ("used inside cards/forms") but never actually referenced by any component in Sections 7–10. Project cards are fully clickable (no button inside them); forms use the standard 48px submit button. This is a component built for a use case that doesn't exist in the spec. → **Fix:** remove; if a compact action control is ever needed inside a dense component, that's a new, explicit design decision — not a default variant sitting unused.

2. **`radius-sm` (2px) as a special exception.** Justified only as "0px reads as a rendering error" for chips — a subjective, untested claim, and the one crack in an otherwise-strict zero-radius system. A system with one unexplained exception is weaker than a system with none. → **Fix:** remove `radius-sm`; chips use `radius-none` like everything else. If testing later shows a real legibility/rendering issue, that's a deliberate future amendment, not a day-one hedge.

3. **`color-success` token with no confirmed usage.** Defined in the palette, but Section 9 explicitly states form success is handled by replacing the form with a confirmation message — meaning no persistent success-colored UI element actually exists anywhere in the spec. A token with zero specified application is dead weight that will get misused later ("well, we have a green, let's use it somewhere"). → **Fix:** remove `color-success` entirely. Keep `color-error` only, since it has a real, specified use (inline field validation).

---

## C. Weak Hierarchy

1. **`text-caption` is overloaded across unrelated semantic roles**, currently doing: category tags, form field labels, timestamps, structural section numbers ("01 — Selected Work"), and testimonial name/role. Five different jobs on one style means none of them reads as distinct, and a structural section-number label — which is supposed to function as a bold graphic motif — visually disappears into the same style as a muted timestamp. → **Fix:** split into two tokens: `text-caption` (quiet metadata: timestamps, testimonial name/role, form labels) and `text-label` (structural/graphic: section numbers, category tags on project cards, active filter chips) — same size, but `text-label` gets `color-ink` + wider tracking, `text-caption` gets `color-text-secondary` + normal tracking. This restores the "graphic element" function the original spec claimed for tags/numbers but never actually differentiated.

2. **No stated usage boundary between `text-display`, `text-h1`, and `text-h2`.** All three are large, bold, Display-face styles, but nothing says which component uses which — an implementer could plausibly use any of the three for the Home hero and any of the other two for page titles, producing inconsistent hierarchy page to page. → **Fix:** explicit usage table added — `text-display` = Home hero only (used once per site); `text-h1` = page titles (Work, About, Contact, Case Study title); `text-h2` = section headers within a page. This is the actual hierarchy fix — a scale without usage rules isn't a hierarchy, it's just a list of sizes.

3. **Filter chip has no default (inactive) state defined** — only the active-state transition is specified. An implementer has no spec to build the resting state from. → **Fix:** explicit inactive/active/hover spec added.

4. **One-size project-card image ratio flattens category differences.** Forcing a 4:3 crop on every project regardless of category will crop UI/UX mobile screenshots (naturally tall/portrait) and some branding posters (also often portrait) into an awkward, distorted, or badly-cropped frame — undermining the craft the whole site exists to prove. → **Fix:** define a cover-image capture methodology (custom-composed cover shot per project, not a raw screenshot) so the 4:3 ratio is always something intentionally designed for, never a forced crop of existing artwork.

---

## D. Accessibility Problems

1. **`color-accent` (#D9622B) on `color-background` (#FAFAF7) does not reliably clear 4.5:1** at normal text sizes (contrast ratio ≈ 2.9:1 by calculation), yet v1 left this as a conditional "verify, and if it fails, fall back" note — an unresolved hedge instead of a resolved rule. Shipping a spec with an open contrast question is itself the accessibility problem. → **Fix:** resolved now, not deferred — orange is restricted to non-text UI (button fills with white text on top, focus rings, icons, underlines) and is never used as text color at body/caption sizes. Where orange must convey an active/selected state on text (e.g., active nav link), it's paired with the underline device already in the spec, satisfying non-text contrast (3:1) rather than text contrast (4.5:1).

2. **Footer icon tap targets below accessible minimum**, per Inconsistency A.5 above — a real WCAG 2.5.8 (target size, minimum) risk on mobile footers specifically, where footer icons are a primary contact path per PROJECT_SPEC's mobile contact priority. → **Fixed** via the 40×40px hit-area padding rule.

3. **No specified behavior for `prefers-reduced-motion` beyond a single closing line** — the rule existed in v1 but wasn't tied to specific components, making it easy to skip during implementation. → **Fix:** each motion rule in the interaction table now has an explicit reduced-motion fallback stated inline, not as a separate footnote.

4. **No empty/error state specifications** — a Work page with an active filter returning zero results, a failed form submission beyond inline field errors, and a 404/missing case study are all real states a visitor can hit, and none were specified. Missing states aren't a visual nice-to-have; an unspecified empty state usually means a broken-feeling layout or leftover dev placeholder text ships to real users. → **Fix:** minimum empty/error state specs added to Section 13 (new).

---

## Summary of changes carried into DESIGN_SYSTEM.md v2
- Removed: `color-border-strong` (merged into `color-ink`), `color-success`, `radius-sm`, compact button variant, dark-section button variant.
- Added: `text-label` token, heading usage table, filter chip states, cover-image methodology note, footer icon hit-area rule, resolved accent-contrast rule, inline reduced-motion fallbacks, empty/error state specs.
- Consolidated: quote treatment into one reusable component instead of two divergent ones.
