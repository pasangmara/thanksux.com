import type { AuditCategory, AuditConfidence, AuditEffort, AuditImpact, AuditSeverity, AuditType, AuditVerificationStatus } from "@/types/audit";
import type { WebsiteEvidence } from "./extractWebsiteSignals";
import type { ScreenshotEvidence } from "./extractScreenshotSignals";

/**
 * [UX Audit Engine — rule engine] Deterministic rules only: same evidence
 * in, same findings out, every time — no randomness, no external model
 * call. Each rule is a plain function of the evidence object; a rule that
 * finds nothing returns `null` and produces no finding at all (§6's "do
 * not create findings when the rule's evidence is absent").
 *
 * `id` here is the stable rule identifier (docs/spec's example:
 * "missing-image-alt") — kept on the finding for debugging/QA (verifying
 * "no duplicate findings" means no rule id appears twice for one audit),
 * not shown in the report UI.
 */

export interface RuleFinding {
  ruleId: string;
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  evidence: string;
  problem: string;
  whyItMatters: string;
  recommendation: string;
  impact: AuditImpact;
  effort: AuditEffort;
  verificationStatus: AuditVerificationStatus;
  confidence: AuditConfidence;
}

/**
 * Every rule below reads a literal attribute, tag, or byte count straight
 * out of the fetched HTML/file — that's a directly observed fact, not a
 * guess, so `observed`/`high` is the correct default for nearly all of
 * them. The few rules whose finding also carries an interpretive leap
 * beyond the raw fact (word count standing in for "real content," image
 * width standing in for "device," file size standing in for "compression")
 * pass an explicit override — see each call site below.
 */
function f(input: Omit<RuleFinding, "verificationStatus" | "confidence"> & Partial<Pick<RuleFinding, "verificationStatus" | "confidence">>): RuleFinding {
  return { verificationStatus: "observed", confidence: "high", ...input };
}

const VAGUE_LINK_TEXTS = new Set(["click here", "here", "read more", "more", "link", "this page", "learn more", "go", "submit"]);
const VAGUE_CTA_TEXTS = new Set(["submit", "click here", "go", "ok", "continue", "next"]);

// ---------------------------------------------------------------------------
// Website rules
// ---------------------------------------------------------------------------

function titleRules(e: WebsiteEvidence): RuleFinding[] {
  const out: RuleFinding[] = [];
  if (!e.title) {
    out.push(
      f({
        ruleId: "missing-title",
        category: "SEO / Discoverability",
        severity: "high",
        title: "Page is missing a title",
        evidence: "No <title> element was found in the page's <head>.",
        problem: "The page has no title, or the title is empty.",
        whyItMatters: "The title is what appears in search results, browser tabs, and shared links — without one, visitors and search engines can't identify the page.",
        recommendation: "Add a concise, descriptive <title> (roughly 50–60 characters) that states what the page is.",
        impact: "high",
        effort: "low",
      }),
    );
  } else if (e.title.length < 10) {
    out.push(
      f({
        ruleId: "weak-title",
        category: "SEO / Discoverability",
        severity: "low",
        title: "Page title is very short",
        evidence: `Title text: "${e.title}" (${e.title.length} characters).`,
        problem: "A very short title rarely conveys enough context about the page.",
        whyItMatters: "Search results and browser tabs have room for more descriptive context than this uses.",
        recommendation: "Expand the title to describe the page and its value, roughly 50–60 characters.",
        impact: "medium",
        effort: "low",
      }),
    );
  } else {
    out.push(
      f({
        ruleId: "good-title",
        category: "SEO / Discoverability",
        severity: "good",
        title: "Page has a descriptive title",
        evidence: `Title text: "${e.title}" (${e.title.length} characters).`,
        problem: "",
        whyItMatters: "A clear title helps both visitors and search engines understand the page at a glance.",
        recommendation: "Keep it updated if the page's purpose changes.",
        impact: "medium",
        effort: "low",
      }),
    );
  }
  return out;
}

function metaDescriptionRules(e: WebsiteEvidence): RuleFinding[] {
  if (!e.metaDescription) {
    return [
      f({
        ruleId: "missing-meta-description",
        category: "SEO / Discoverability",
        severity: "medium",
        title: "Missing meta description",
        evidence: "No <meta name=\"description\"> tag was found.",
        problem: "Search engines have no author-supplied summary to show for this page.",
        whyItMatters: "Without one, search engines generate their own snippet from page text, which is often a poor summary and hurts click-through.",
        recommendation: "Add a meta description (roughly 120–155 characters) summarizing the page's value.",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  const len = e.metaDescription.length;
  if (len < 50 || len > 160) {
    return [
      f({
        ruleId: "weak-meta-description",
        category: "SEO / Discoverability",
        severity: "low",
        title: len < 50 ? "Meta description is quite short" : "Meta description may be truncated in search results",
        evidence: `Meta description is ${len} characters: "${e.metaDescription.slice(0, 120)}${len > 120 ? "…" : ""}"`,
        problem: len < 50 ? "The description is too brief to summarize the page well." : "Search engines typically truncate descriptions past ~155–160 characters.",
        whyItMatters: "The meta description is often what convinces someone to click through from search results.",
        recommendation: "Aim for roughly 120–155 characters that clearly summarize the page.",
        impact: "low",
        effort: "low",
      }),
    ];
  }
  return [
    f({
      ruleId: "good-meta-description",
      category: "SEO / Discoverability",
      severity: "good",
      title: "Meta description is present and reasonably sized",
      evidence: `Meta description is ${len} characters.`,
      problem: "",
      whyItMatters: "A well-sized description gives search engines a real summary to display.",
      recommendation: "Keep it aligned with the page's actual content.",
      impact: "low",
      effort: "low",
    }),
  ];
}

function headingRules(e: WebsiteEvidence): RuleFinding[] {
  const out: RuleFinding[] = [];
  const h1s = e.headings.filter((h) => h.level === 1);

  if (h1s.length === 0) {
    out.push(
      f({
        ruleId: "missing-h1",
        category: "Information Architecture",
        severity: "high",
        title: "No H1 heading found",
        evidence: `${e.headings.length} heading(s) found on the page, none at level 1.`,
        problem: "The page has no top-level (H1) heading.",
        whyItMatters: "The H1 anchors the page's content hierarchy for both visitors skimming the page and assistive technology navigating by headings.",
        recommendation: "Add a single H1 that states the main purpose of the page.",
        impact: "high",
        effort: "low",
      }),
    );
  } else if (h1s.length > 1) {
    out.push(
      f({
        ruleId: "multiple-h1",
        category: "Information Architecture",
        severity: "medium",
        title: "Multiple H1 headings found",
        evidence: `${h1s.length} H1 headings found: ${h1s.map((h) => `"${h.text}"`).slice(0, 3).join(", ")}${h1s.length > 3 ? "…" : ""}.`,
        problem: "More than one H1 dilutes the page's single, clear top-level heading.",
        whyItMatters: "A page with multiple H1s makes the content hierarchy ambiguous for screen-reader users and search engines.",
        recommendation: "Use exactly one H1 per page; demote the others to H2/H3 as appropriate.",
        impact: "medium",
        effort: "low",
      }),
    );
  }

  let skipFound = false;
  let prevLevel = 0;
  for (const h of e.headings) {
    if (prevLevel > 0 && h.level > prevLevel + 1) skipFound = true;
    prevLevel = h.level;
  }
  if (skipFound) {
    out.push(
      f({
        ruleId: "heading-hierarchy-skip",
        category: "Information Architecture",
        severity: "medium",
        title: "Heading levels skip a level",
        evidence: `Heading sequence: ${e.headings.map((h) => `H${h.level}`).join(" → ")}.`,
        problem: "The heading order jumps (e.g. H1 to H3) rather than descending one level at a time.",
        whyItMatters: "Skipped levels break the outline assistive technology relies on to navigate content structure.",
        recommendation: "Restructure headings so each level descends by one step at a time.",
        impact: "medium",
        effort: "medium",
      }),
    );
  }

  if (h1s.length === 1 && !skipFound && e.headings.length > 1) {
    out.push(
      f({
        ruleId: "good-heading-hierarchy",
        category: "Information Architecture",
        severity: "good",
        title: "Heading hierarchy is well-structured",
        evidence: `Single H1, ${e.headings.length} headings total, no skipped levels: ${e.headings.map((h) => `H${h.level}`).join(" → ")}.`,
        problem: "",
        whyItMatters: "A clean heading outline helps every visitor — and assistive technology — scan and understand the page's structure.",
        recommendation: "Keep this pattern as new sections are added.",
        impact: "medium",
        effort: "low",
      }),
    );
  }
  return out;
}

function imageAltRules(e: WebsiteEvidence): RuleFinding[] {
  if (e.images.length === 0) return [];
  const missing = e.images.filter((img) => img.alt === null);
  if (missing.length > 0) {
    const ratio = Math.round((missing.length / e.images.length) * 100);
    return [
      f({
        ruleId: "missing-image-alt",
        category: "Accessibility",
        severity: missing.length === e.images.length ? "critical" : "high",
        title: "Images missing alternative text",
        evidence: `${missing.length} of ${e.images.length} <img> elements (${ratio}%) have no alt attribute at all.`,
        problem: "Some images have no alt attribute, so assistive technology has no way to know what they convey (or that they're decorative).",
        whyItMatters: "Screen-reader users get no information about these images — for meaningful images this can mean missing content entirely.",
        recommendation: "Add concise, descriptive alt text to every meaningful image; use alt=\"\" only for genuinely decorative images.",
        impact: "high",
        effort: "low",
      }),
    ];
  }
  return [
    f({
      ruleId: "good-image-alt",
      category: "Accessibility",
      severity: "good",
      title: "All images have alt attributes",
      evidence: `${e.images.length} of ${e.images.length} <img> elements have an alt attribute (empty alt counted as an intentional decorative marker).`,
      problem: "",
      whyItMatters: "Assistive technology can announce or correctly skip every image on the page.",
      recommendation: "Keep verifying alt text describes content accurately as images change.",
      impact: "high",
      effort: "low",
    }),
  ];
}

function linkTextRules(e: WebsiteEvidence): RuleFinding[] {
  if (e.links.length === 0) return [];
  const vague = e.links.filter((l) => VAGUE_LINK_TEXTS.has(l.text.trim().toLowerCase()));
  if (vague.length > 0) {
    return [
      f({
        ruleId: "generic-link-text",
        category: "Content",
        severity: "medium",
        title: "Generic link text found",
        evidence: `${vague.length} link(s) use non-descriptive text, e.g. ${[...new Set(vague.map((l) => `"${l.text}"`))].slice(0, 3).join(", ")}.`,
        problem: "Links like \"click here\" or \"read more\" don't say where they lead when read out of context.",
        whyItMatters: "Screen-reader users often navigate by a list of links alone — generic text like this gives them no way to tell links apart.",
        recommendation: "Rewrite link text to describe its destination, e.g. \"Read the pricing guide\" instead of \"click here.\"",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  return [];
}

function formRules(e: WebsiteEvidence): RuleFinding[] {
  if (e.forms.length === 0) return [];
  const totalInputs = e.forms.reduce((sum, form) => sum + form.inputCount, 0);
  const totalLabeled = e.forms.reduce((sum, form) => sum + form.labeledInputCount, 0);
  if (totalInputs === 0) return [];
  if (totalLabeled < totalInputs) {
    const missing = totalInputs - totalLabeled;
    return [
      f({
        ruleId: "missing-form-labels",
        category: "Forms",
        severity: "high",
        title: "Form fields missing labels",
        evidence: `${missing} of ${totalInputs} form field(s) have no associated <label>, aria-label, or aria-labelledby.`,
        problem: "Some form fields have no programmatically associated label.",
        whyItMatters: "Users may have difficulty understanding what each field expects — this is especially disruptive for screen-reader and voice-control users.",
        recommendation: "Add a <label for=\"id\"> (or aria-label) for every input, select, and textarea.",
        impact: "high",
        effort: "low",
      }),
    ];
  }
  return [
    f({
      ruleId: "good-form-labels",
      category: "Forms",
      severity: "good",
      title: "Form fields are labeled",
      evidence: `${totalLabeled} of ${totalInputs} form field(s) across ${e.forms.length} form(s) have an associated label.`,
      problem: "",
      whyItMatters: "Well-labeled forms are usable by everyone, including screen-reader and voice-control users.",
      recommendation: "Keep labeling new fields as forms evolve.",
      impact: "high",
      effort: "low",
    }),
  ];
}

function navigationRules(e: WebsiteEvidence): RuleFinding[] {
  if (!e.landmarks.nav) {
    return [
      f({
        ruleId: "missing-nav-landmark",
        category: "Navigation",
        severity: "medium",
        title: "No navigation landmark found",
        evidence: "No <nav> element or role=\"navigation\" was found in the page markup.",
        problem: "The page's navigation isn't marked up as a landmark.",
        whyItMatters: "Screen-reader users rely on landmarks to jump directly to navigation instead of tabbing through the entire page.",
        recommendation: "Wrap the primary navigation in a <nav> element.",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  return [
    f({
      ruleId: "good-nav-landmark",
      category: "Navigation",
      severity: "good",
      title: "Navigation is marked up as a landmark",
      evidence: "A <nav> element (or role=\"navigation\") is present.",
      problem: "",
      whyItMatters: "Assistive technology users can jump straight to navigation.",
      recommendation: "Keep primary navigation inside this landmark as the site grows.",
      impact: "medium",
      effort: "low",
    }),
  ];
}

function mainLandmarkRules(e: WebsiteEvidence): RuleFinding[] {
  if (!e.landmarks.main) {
    return [
      f({
        ruleId: "missing-main-landmark",
        category: "Accessibility",
        severity: "low",
        title: "No main content landmark found",
        evidence: "No <main> element or role=\"main\" was found.",
        problem: "The page's primary content isn't marked up as a landmark.",
        whyItMatters: "Without a <main> landmark, screen-reader users can't skip repeated header/nav content to jump straight to the page's content.",
        recommendation: "Wrap the primary content area in a <main> element.",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  return [];
}

function viewportRules(e: WebsiteEvidence): RuleFinding[] {
  if (!e.viewportMeta) {
    return [
      f({
        ruleId: "missing-viewport-meta",
        category: "Responsive",
        severity: "high",
        title: "No responsive viewport meta tag",
        evidence: "No <meta name=\"viewport\"> tag was found.",
        problem: "Without a viewport meta tag, mobile browsers typically render the page at a fixed desktop width and scale it down.",
        whyItMatters: "This produces tiny, hard-to-read text and controls on phones — one of the most reliable signals of a non-responsive page.",
        recommendation: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
        impact: "high",
        effort: "low",
      }),
    ];
  }
  return [
    f({
      ruleId: "good-viewport-meta",
      category: "Responsive",
      severity: "good",
      title: "Responsive viewport meta tag is present",
      evidence: `<meta name="viewport" content="${e.viewportMeta}">`,
      problem: "",
      whyItMatters: "This is the baseline signal that the page is intended to adapt to different screen sizes.",
      recommendation: "This only confirms intent, not actual layout behavior — resize testing on real devices is still worthwhile.",
      impact: "high",
      effort: "low",
    }),
  ];
}

function ctaRules(e: WebsiteEvidence): RuleFinding[] {
  const candidates = [...e.buttonTexts, ...e.links.filter((l) => l.text).map((l) => l.text)];
  if (candidates.length === 0) return [];
  const vague = candidates.filter((t) => VAGUE_CTA_TEXTS.has(t.trim().toLowerCase()));
  if (vague.length > 0) {
    return [
      f({
        ruleId: "weak-cta-wording",
        category: "CTA / Conversion",
        severity: "medium",
        title: "Vague call-to-action wording",
        evidence: `Button/link text found: ${[...new Set(vague.map((t) => `"${t}"`))].slice(0, 3).join(", ")}.`,
        problem: "Some calls to action use generic verbs that don't state the outcome.",
        whyItMatters: "Users decide whether to act partly from the label itself — vague labels ask for more trust with less information.",
        recommendation: "Use outcome-specific labels, e.g. \"Start free trial\" instead of \"Submit\" or \"Continue.\"",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  return [];
}

function contentDensityRules(e: WebsiteEvidence): RuleFinding[] {
  if (e.wordCount < 30) {
    return [
      f({
        ruleId: "very-thin-content",
        category: "Content",
        severity: "low",
        title: "Very little text content detected in the initial HTML",
        evidence: `Only ${e.wordCount} words of text found in the page body's initial HTML.`,
        problem: "This may mean the page genuinely has little content, or that content is injected client-side after the initial HTML loads.",
        whyItMatters: "If this is a client-rendered app, this audit's HTML-only view won't reflect what a visitor actually sees — the content itself needs a manual check either way.",
        recommendation: "Needs manual verification: load the page in a browser and confirm what content actually renders.",
        impact: "medium",
        effort: "low",
        verificationStatus: "inferred",
        confidence: "low",
      }),
    ];
  }
  return [];
}

function performanceRules(e: WebsiteEvidence): RuleFinding[] {
  const out: RuleFinding[] = [];
  if (e.htmlByteLength > 300 * 1024) {
    out.push(
      f({
        ruleId: "heavy-html-payload",
        category: "Performance",
        severity: e.htmlByteLength > 700 * 1024 ? "high" : "medium",
        title: "Initial HTML document is large",
        evidence: `The HTML document is ${(e.htmlByteLength / 1024).toFixed(0)}KB, before images/scripts/styles finish loading.`,
        problem: "A large initial HTML payload delays first render, especially on slower connections.",
        whyItMatters: "The first byte of usable content takes longer to arrive the larger this document is.",
        recommendation: "Look for large inline scripts/styles or repeated markup that could be reduced or moved to external, cacheable files.",
        impact: "medium",
        effort: "medium",
        confidence: "medium",
      }),
    );
  }
  if (e.blockingScriptCount > 3) {
    out.push(
      f({
        ruleId: "render-blocking-scripts",
        category: "Performance",
        severity: "medium",
        title: "Multiple render-blocking scripts",
        evidence: `${e.blockingScriptCount} external <script> tag(s) found without async or defer attributes.`,
        problem: "Scripts loaded without async/defer block HTML parsing until they finish downloading and executing.",
        whyItMatters: "This delays when the page becomes visible and interactive, especially on slower networks.",
        recommendation: "Add defer (or async, for independent scripts) to non-critical <script> tags, or move them to the end of <body>.",
        impact: "medium",
        effort: "low",
        confidence: "medium",
      }),
    );
  }
  return out;
}

function langAttributeRules(e: WebsiteEvidence): RuleFinding[] {
  if (!e.hasLangAttribute) {
    return [
      f({
        ruleId: "missing-lang-attribute",
        category: "Accessibility",
        severity: "medium",
        title: "Missing lang attribute on <html>",
        evidence: "No lang attribute was found on the <html> element.",
        problem: "The page doesn't declare its language.",
        whyItMatters: "Screen readers use this to choose the correct pronunciation/voice — without it, they often guess wrong.",
        recommendation: "Add lang=\"en\" (or the correct language code) to the <html> element.",
        impact: "medium",
        effort: "low",
      }),
    ];
  }
  return [];
}

function discoverabilityRules(e: WebsiteEvidence): RuleFinding[] {
  const out: RuleFinding[] = [];
  if (!e.hasOpenGraph) {
    out.push(
      f({
        ruleId: "missing-open-graph",
        category: "SEO / Discoverability",
        severity: "low",
        title: "No Open Graph tags found",
        evidence: "No <meta property=\"og:...\"> tags were found.",
        problem: "The page has no Open Graph metadata.",
        whyItMatters: "Without it, links shared on social platforms fall back to a generic (or blank) preview card.",
        recommendation: "Add og:title, og:description, and og:image tags.",
        impact: "low",
        effort: "low",
      }),
    );
  }
  if (!e.hasCanonical) {
    out.push(
      f({
        ruleId: "missing-canonical",
        category: "SEO / Discoverability",
        severity: "low",
        title: "No canonical link found",
        evidence: "No <link rel=\"canonical\"> was found.",
        problem: "The page doesn't declare its canonical URL.",
        whyItMatters: "Without it, search engines may treat URL variants (with tracking params, trailing slashes, etc.) as separate pages, diluting ranking signals.",
        recommendation: "Add a <link rel=\"canonical\" href=\"...\"> pointing at the page's preferred URL.",
        impact: "low",
        effort: "low",
      }),
    );
  }
  return out;
}

const CATEGORY_WEIGHT_BY_TYPE: Record<AuditType, Partial<Record<AuditCategory, number>>> = {
  ux: { Usability: 1.4, Navigation: 1.2, "Information Architecture": 1.2, Content: 1.1, Forms: 1.1, "CTA / Conversion": 1.2, Accessibility: 1 },
  web: { Accessibility: 1.3, "SEO / Discoverability": 1.2, Forms: 1.1, Performance: 1.2, Responsive: 1.2, Navigation: 1 },
  design: { "Visual Design": 1.4, Typography: 1.3, Color: 1.3, Spacing: 1.2, "CTA / Conversion": 1.1 },
};

export function categoryWeight(auditType: AuditType, category: AuditCategory): number {
  return CATEGORY_WEIGHT_BY_TYPE[auditType][category] ?? 1;
}

export function evaluateWebsiteRules(e: WebsiteEvidence): RuleFinding[] {
  return [
    ...titleRules(e),
    ...metaDescriptionRules(e),
    ...headingRules(e),
    ...imageAltRules(e),
    ...linkTextRules(e),
    ...formRules(e),
    ...navigationRules(e),
    ...mainLandmarkRules(e),
    ...viewportRules(e),
    ...ctaRules(e),
    ...contentDensityRules(e),
    ...performanceRules(e),
    ...langAttributeRules(e),
    ...discoverabilityRules(e),
  ];
}

// ---------------------------------------------------------------------------
// Screenshot rules — deliberately small, see extractScreenshotSignals.ts
// ---------------------------------------------------------------------------

export function evaluateScreenshotRules(e: ScreenshotEvidence): RuleFinding[] {
  const out: RuleFinding[] = [];

  if (e.width && e.height) {
    out.push(
      f({
        ruleId: "screenshot-dimensions",
        category: "Responsive",
        severity: "good",
        title: `Screenshot captured at ${e.width}×${e.height}`,
        evidence: `Image dimensions: ${e.width}×${e.height}px (aspect ratio ${e.aspectRatio}). This looks like a ${e.likelyDevice} capture based on width alone.`,
        problem: "",
        whyItMatters: "Behavior at other breakpoints can't be confirmed from a single image.",
        recommendation: `Needs manual verification: check behavior at other breakpoints — this audit only has evidence for the ${e.likelyDevice} width captured here.`,
        impact: "low",
        effort: "low",
        confidence: "medium",
      }),
    );
  }

  if (e.fileSizeBytes > 4 * 1024 * 1024) {
    out.push(
      f({
        ruleId: "large-screenshot-file",
        category: "Performance",
        severity: "low",
        title: "Screenshot file is unusually large",
        evidence: `Uploaded file is ${(e.fileSizeBytes / (1024 * 1024)).toFixed(1)}MB.`,
        problem: "A very large screenshot file often indicates an uncompressed export.",
        whyItMatters: "This is about the exported file, not necessarily the live page's own image weight — worth checking real production assets separately.",
        recommendation: "If this reflects real production images, consider modern compressed formats (WEBP/AVIF) and appropriate sizing.",
        impact: "low",
        effort: "low",
        verificationStatus: "inferred",
        confidence: "low",
      }),
    );
  }

  return out;
}
