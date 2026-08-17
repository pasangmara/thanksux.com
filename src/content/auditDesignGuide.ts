import type { AuditCategory } from "@/types/audit";

/**
 * [UX Audit Engine — Design Guide] Persistent reference content shown on
 * every audit report (§24) — genuinely-true, generically-applicable design
 * guidance, not generated per-audit. Each finding links to the topic(s)
 * most relevant to its category (CATEGORY_TO_GUIDE_TOPICS below) so "Show
 * Design Guidance" can jump straight to the right section instead of
 * dumping the whole guide on every finding.
 *
 * Spacing's starting scale is explicitly labeled a starting point, not a
 * law (§17) — deliberately not tied to this project's own 8px token scale,
 * since a guide meant for *any* audited site shouldn't imply this
 * portfolio's own design system is a universal standard.
 */

export type DesignGuideTopic =
  | "color"
  | "typography"
  | "spacing"
  | "grid"
  | "buttons"
  | "forms"
  | "navigation"
  | "accessibility"
  | "responsive"
  | "content"
  | "motion";

export interface DesignGuideSection {
  topic: DesignGuideTopic;
  title: string;
  principle: string;
  whatToCheck: string[];
  commonMistake: string;
  howToImprove: string[];
  startingGuidance?: string;
}

export const DESIGN_GUIDE: DesignGuideSection[] = [
  {
    topic: "color",
    title: "Color",
    principle: "Color should carry meaning and guide attention — not decorate for its own sake.",
    whatToCheck: [
      "Text-to-background contrast, especially for body copy and disabled/placeholder text",
      "Whether color is the only way a state (error, success, active) is communicated",
      "How many colors are used for interactive elements vs. how many are truly needed",
    ],
    commonMistake: "Using color alone to signal an error or required field, with no icon or text backup for colorblind users.",
    howToImprove: [
      "Increase contrast between text and its background where it looks tight.",
      "Pair color with an icon, label, or pattern for any state that matters.",
      "Reserve your most saturated/brand color for the few actions that matter most — if everything is highlighted, nothing is.",
    ],
    startingGuidance: "Verify contrast against the applicable WCAG contrast requirement for the text size in question — don't guess.",
  },
  {
    topic: "typography",
    title: "Typography",
    principle: "Type hierarchy should make scanning effortless — the eye should land on what matters first.",
    whatToCheck: [
      "Whether headings are visually distinct enough from body text (size, weight, or both)",
      "Line length for body paragraphs (very long lines are tiring to read)",
      "Line-height relative to font size — tighter for headings, looser for body text",
      "How many different font sizes/weights are in active use",
    ],
    commonMistake: "Too many similar font sizes close together, so nothing reads as clearly \"more important.\"",
    howToImprove: [
      "Establish 4–6 clear steps in your type scale and use them consistently.",
      "Keep body paragraphs to roughly 45–75 characters per line for comfortable reading.",
      "Increase line-height as text gets smaller, decrease it as text gets larger.",
    ],
  },
  {
    topic: "spacing",
    title: "Spacing",
    principle: "Consistent spacing creates rhythm; inconsistent spacing reads as visual noise even when nothing else is \"wrong.\"",
    whatToCheck: [
      "Whether padding around similar components (cards, buttons, form fields) is actually consistent",
      "Whether related items sit closer together than unrelated ones (proximity)",
      "Cramped sections vs. sections with excessive, disorienting whitespace",
    ],
    commonMistake: "Ad-hoc pixel values chosen per-component instead of drawing from a shared scale — small inconsistencies accumulate into visual disorder.",
    howToImprove: [
      "Pick a base spacing scale and use only its steps — this reduces one-off decisions and keeps rhythm consistent.",
      "Group related elements with smaller gaps, separate unrelated groups with larger ones.",
      "Audit your most-repeated components (cards, list items, form rows) for spacing consistency first — the payoff is largest there.",
    ],
    startingGuidance: "A common starting scale (in pixels): 8, 16, 24, 32, 48, 64 — a starting system, not an absolute rule. Adopt whatever scale fits the product, and use it consistently.",
  },
  {
    topic: "grid",
    title: "Grid",
    principle: "A grid gives every element a reason to be where it is — alignment is what makes a layout feel intentional.",
    whatToCheck: [
      "Whether elements share consistent left/right edges across sections",
      "Column counts and gutters at different viewport widths",
      "Elements that appear to float independently of everything around them",
    ],
    commonMistake: "Content that's centered or positioned by eye rather than aligned to a shared grid, causing subtle misalignment across sections.",
    howToImprove: [
      "Define a column grid (with consistent gutters) and align major content blocks to it.",
      "Check alignment across sections, not just within one — inconsistency between sections is a common miss.",
    ],
  },
  {
    topic: "buttons",
    title: "Buttons",
    principle: "A button's visual weight should match its importance — primary actions should be obviously primary.",
    whatToCheck: [
      "Whether primary and secondary actions are visually distinguishable",
      "Whether multiple buttons on the same screen compete for the same visual weight",
      "Touch target size on mobile (buttons that are hard to tap accurately)",
      "Button label clarity — does it say what will happen?",
    ],
    commonMistake: "Two or more buttons with equal visual emphasis, leaving the user to guess which one is the primary action.",
    howToImprove: [
      "Establish one clear primary style, reserved for the single most important action per screen/section.",
      "Use secondary/tertiary styles (outline, text-link) for less critical actions.",
      "Keep touch targets comfortably large on mobile — cramped targets cause mis-taps.",
    ],
  },
  {
    topic: "forms",
    title: "Forms",
    principle: "A form should tell the user exactly what's expected, and exactly what went wrong if something did.",
    whatToCheck: [
      "Every field has a visible, associated label (not just a placeholder that disappears on focus)",
      "Required fields are marked clearly",
      "Error messages are specific and appear near the field they describe",
      "Field order follows a logical, expected sequence",
    ],
    commonMistake: "Using placeholder text as the only label — it disappears the moment the user starts typing, and it's the field they're most likely to need reminding about.",
    howToImprove: [
      "Always pair a real <label> with every field, in addition to (not instead of) a placeholder.",
      "Show validation errors inline, next to the field, in specific language (not just \"invalid input\").",
      "Group related fields together and separate unrelated groups visually.",
    ],
  },
  {
    topic: "navigation",
    title: "Navigation",
    principle: "Navigation should answer \"where am I\" and \"where can I go\" at a glance.",
    whatToCheck: [
      "Whether the current page/section is visually indicated in the navigation",
      "Number of top-level navigation items (too many overwhelms; too few can hide important sections)",
      "Whether navigation is marked up as a real landmark for assistive technology",
      "Mobile navigation pattern clarity (is it obvious how to open/close it?)",
    ],
    commonMistake: "Navigation that looks identical whether or not the user is on that page — no active/current-page state.",
    howToImprove: [
      "Add a clear visual state for the current page or section.",
      "Keep top-level navigation to a small, memorable set of items; use secondary navigation for the rest.",
      "Test the mobile navigation pattern specifically — it's often the least-tested part of a design.",
    ],
  },
  {
    topic: "accessibility",
    title: "Accessibility",
    principle: "Accessible design is fundamentally about not excluding anyone from being able to use the interface at all.",
    whatToCheck: [
      "Image alt text on meaningful images",
      "Form field labels",
      "Heading hierarchy (single H1, no skipped levels)",
      "Color contrast for text",
      "Keyboard focus states on interactive elements",
    ],
    commonMistake: "Treating accessibility as a final pass instead of a baseline — it's far cheaper to build in from the start than to retrofit.",
    howToImprove: [
      "Fix the structural basics first: alt text, labels, heading order — they're usually the cheapest, highest-impact changes.",
      "Verify keyboard-only navigation actually reaches every interactive element in a sensible order.",
      "This audit can't verify everything automatically — treat anything flagged \"needs manual verification\" as a real to-do, not a pass.",
    ],
  },
  {
    topic: "responsive",
    title: "Responsive",
    principle: "A responsive design adapts its layout to the viewport, not just shrinks it.",
    whatToCheck: [
      "A viewport meta tag is present (baseline requirement for mobile rendering to even attempt to adapt)",
      "Content reflows (rather than requiring horizontal scrolling) at common breakpoints",
      "Touch targets are large enough on small screens",
      "Text remains readable without zooming",
    ],
    commonMistake: "Designing and testing only at desktop width, then discovering layout problems on real devices after launch.",
    howToImprove: [
      "Test at real breakpoints, not just by shrinking a desktop browser window.",
      "Design mobile layouts as their own layout, not a squeezed version of desktop.",
      "This audit can only confirm intent (or a single captured screenshot) — real cross-device testing still matters.",
    ],
  },
  {
    topic: "content",
    title: "Content",
    principle: "Content should say what it means as plainly as possible — clarity beats cleverness.",
    whatToCheck: [
      "Whether headings and labels use the audience's own vocabulary, not internal jargon",
      "Whether calls to action describe the actual outcome",
      "Content density — is there enough context, or is the page too sparse to explain itself?",
      "Link text that makes sense out of context",
    ],
    commonMistake: "Vague link/button text (\"click here,\" \"submit,\" \"learn more\") that gives no indication of the destination or outcome.",
    howToImprove: [
      "Rewrite CTAs to state the outcome: \"Start your free trial\" instead of \"Submit.\"",
      "Read headings and labels as if seeing them for the first time — would they make sense with zero other context?",
      "Cut jargon in favor of words the actual audience uses.",
    ],
  },
  {
    topic: "motion",
    title: "Motion",
    principle: "Motion should clarify a transition or draw attention to something that matters — never be decoration for its own sake.",
    whatToCheck: [
      "Whether animations are purposeful (indicating a state change, guiding attention) vs. purely decorative",
      "Whether prefers-reduced-motion is respected for users sensitive to motion",
      "Animation duration — too slow feels sluggish, too fast can be missed entirely",
    ],
    commonMistake: "Long or large-scale animations on every interaction, which start to feel slow and get in the user's way once they're used often.",
    howToImprove: [
      "Keep functional micro-interactions short (roughly 150–300ms is a common comfortable range).",
      "Always provide a reduced-motion fallback for users who've requested it at the OS level.",
      "Use motion to explain a state change (e.g. what just opened, what moved where), not just to add visual interest.",
    ],
  },
];

export const CATEGORY_TO_GUIDE_TOPICS: Record<AuditCategory, DesignGuideTopic[]> = {
  Usability: ["navigation", "forms", "content"],
  Navigation: ["navigation"],
  "Information Architecture": ["navigation", "grid"],
  "Visual Design": ["color", "grid", "buttons"],
  Typography: ["typography"],
  Color: ["color"],
  Spacing: ["spacing", "grid"],
  Accessibility: ["accessibility"],
  Content: ["content"],
  Forms: ["forms"],
  "CTA / Conversion": ["buttons", "content"],
  Responsive: ["responsive"],
  Performance: ["motion"],
  "SEO / Discoverability": ["content"],
};

export function guideSectionsFor(category: AuditCategory): DesignGuideSection[] {
  const topics = CATEGORY_TO_GUIDE_TOPICS[category] ?? [];
  return DESIGN_GUIDE.filter((section) => topics.includes(section.topic));
}
