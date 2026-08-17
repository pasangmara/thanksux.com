import type {
  CanonicalProjectCategory,
  CaseStudy,
  Project,
  ProjectCategory,
} from "./project";

/**
 * [CMS Phase B] Canonical category field-schema configuration —
 * docs/CMS_CONTENT_MODEL.md. This is the single source of truth for "what
 * fields does category X have, in what order, with what admin/public
 * labels, rendered with what input type" — Phase C's dynamic admin editor
 * (category selected → only that category's fields render) is built by
 * iterating `CATEGORY_CONFIG[category].fields`, not by hand-coding a new
 * form per category. See `src/components/admin/ProjectFieldRenderer.tsx`
 * for the consumer.
 *
 * This file defines *schema*, not behavior: it does not change what
 * ProjectStory.tsx renders on the public site. Every field key referenced
 * below already exists as an optional property on `CaseStudy` or `Project`
 * (src/types/project.ts) — `keyof` typing means this file cannot silently
 * drift from the real schema; a typo or a removed field fails to compile
 * here, not just at runtime.
 *
 * [CMS Phase C addition] Each `CategoryFieldDef` now also carries `scope`
 * (does this field live on `Project` or on `Project.caseStudy`? — the
 * dynamic renderer needs this to know where to read/write) and `group` (an
 * admin-form subsection label, e.g. "Research", "Strategy" — so the
 * category-specific block never renders as one uninterrupted field list).
 * Both are additive to the type Phase B shipped; nothing that read this
 * file in Phase B breaks.
 */

export type CmsFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "url"
  | "select"
  | "tags"
  | "repeatable"
  | "image"
  | "gallery"
  | "color"
  | "year"
  | "number"
  | "toggle";

/** Sub-field shape for a repeatable group's items — e.g. a `metrics` entry is `{ label, value }`, a `customSections` entry is `{ label, type, text, images }`. */
export interface RepeatableSubField {
  key: string;
  label: string;
  type: CmsFieldType;
  /** Fixed choices — only meaningful when `type` is `"select"`. */
  options?: string[];
}

export interface CategoryFieldDef {
  /** Property this field reads/writes — on `Project` for basic fields, `CaseStudy` for everything else. Typed against the real interfaces so this config can't reference a field that doesn't exist. */
  key: keyof Project | keyof CaseStudy;
  /** Which object this field actually lives on — disambiguates `key` for the dynamic renderer, since `Project` and `CaseStudy` are read/written through different setters in the admin editor. */
  scope: "project" | "caseStudy";
  /** Label shown in the admin editor. */
  adminLabel: string;
  /**
   * Label shown in the public section heading, when this field renders
   * publicly under a different name than its admin label (mirrors the
   * existing `designDirection`/`finalDesign` category-relabeling pattern —
   * see `relabelForCategory` below). Omit when the admin label is already
   * the public label, or the field doesn't render publicly (e.g. SEO).
   */
  publicLabel?: string;
  type: CmsFieldType;
  /** Almost always false — per CMS_CONTENT_MODEL.md, only `overview` and `outcome` are required at the schema level. A field being "in a category's config" does not make it mandatory. */
  required?: boolean;
  helpText?: string;
  /** Fixed choices — only meaningful when `type` is `"select"`. */
  options?: string[];
  /** Only meaningful when `type` is `"repeatable"` — describes each item's shape. */
  repeatableFields?: RepeatableSubField[];
  /**
   * [Phase C] Admin-form subsection this field renders under within a
   * category's dynamic block — e.g. "Research", "Strategy", "Identity
   * Concept". Fields sharing a `group` render together, in `fields` array
   * order, under one `Section`. Fields common to every category (rendered
   * once, outside the dynamic block — see `COMMON_FIELDS`) don't set this.
   */
  group?: string;
}

export interface CategoryConfig {
  category: CanonicalProjectCategory;
  displayName: string;
  description: string;
  /** Non-binding examples for this category's `projectType` free-text field (`ProjectType = string` stays free entry — these are placeholder/autocomplete hints, never an enforced enum). */
  exampleProjectTypes: string[];
  fields: CategoryFieldDef[];
}

// ---------------------------------------------------------------------------
// Common fields — every project, regardless of category. See
// docs/CMS_CONTENT_MODEL.md §3. `overview`/`challenge`/`outcome` are
// conceptually universal but are stored on `Project.caseStudy`, not on
// `Project` itself — documented here rather than silently relocated (see
// PORTFOLIO_CMS_ARCHITECTURE.md §0 finding 7, which flagged this same
// mismatch and recommended against a silent move). Rendered once, in fixed
// admin sections (Basic Information / Case Study Basics / Publishing) —
// never inside a category's dynamic block. `getDynamicFields()` below
// filters any per-category field sharing one of these keys, so nothing
// renders twice.
// ---------------------------------------------------------------------------

export const COMMON_FIELDS: CategoryFieldDef[] = [
  { key: "id", scope: "project", adminLabel: "ID", type: "text", required: true, helpText: "Stable internal identifier, auto-generated" },
  { key: "slug", scope: "project", adminLabel: "Slug", type: "text", required: true, helpText: "URL segment — must match the image folder name" },
  { key: "title", scope: "project", adminLabel: "Title", type: "text", required: true },
  { key: "category", scope: "project", adminLabel: "Category", type: "select", required: true },
  { key: "year", scope: "project", adminLabel: "Year", type: "year", required: true },
  { key: "client", scope: "project", adminLabel: "Client", type: "text", helpText: "Omit for personal/NDA'd work" },
  { key: "role", scope: "project", adminLabel: "Role", type: "text", required: true },
  { key: "shortDescription", scope: "project", adminLabel: "Short Description", type: "textarea", required: true, helpText: "One line — shown on project cards" },
  { key: "overview", scope: "caseStudy", adminLabel: "Overview", publicLabel: "Overview", type: "textarea", required: true, helpText: "Stored on caseStudy, not Project — used by the homepage Case Study Preview" },
  { key: "challenge", scope: "caseStudy", adminLabel: "Challenge", publicLabel: "Challenge", type: "textarea", helpText: "The core challenge/problem being solved" },
  { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, helpText: "Honest outcome — never a fabricated metric" },
  { key: "services", scope: "project", adminLabel: "Services", type: "tags", helpText: "Should match site.ts's services list" },
  { key: "tools", scope: "project", adminLabel: "Tools", type: "tags" },
  { key: "tags", scope: "project", adminLabel: "Tags", type: "tags" },
  { key: "featured", scope: "project", adminLabel: "Featured", type: "toggle" },
  { key: "published", scope: "project", adminLabel: "Published", type: "toggle", required: true },
  { key: "order", scope: "project", adminLabel: "Order", type: "number", required: true },
];

export const COMMON_FIELD_KEYS: ReadonlySet<keyof Project | keyof CaseStudy> = new Set(
  COMMON_FIELDS.map((f) => f.key),
);

// ---------------------------------------------------------------------------
// Per-category field schemas
// ---------------------------------------------------------------------------

/**
 * [Behance-style flexibility] Shared sub-field shape for `customSections` —
 * one definition, reused by every category's config below instead of
 * repeating the same literal 8 times. Originally scoped to the "Custom"
 * category only; extending the `customSections` field to every category
 * needs no new editor or renderer — `ProjectFieldRenderer.tsx`'s
 * `CustomSectionsEditor` and `ProjectStory.tsx`'s `fieldToStage()` both
 * already key off `field.key === "customSections"` generically, so adding
 * this one field to a category's `fields` array is the entire change.
 */
const CUSTOM_SECTION_REPEATABLE_FIELDS: RepeatableSubField[] = [
  { key: "label", label: "Section Title", type: "text" },
  { key: "description", label: "Short Description", type: "text" },
  { key: "text", label: "Body / Content", type: "textarea" },
  { key: "image", label: "Image", type: "image" },
  { key: "images", label: "Gallery", type: "gallery" },
  { key: "items", label: "Repeatable Items", type: "repeatable" },
  { key: "order", label: "Order", type: "number" },
  { key: "visible", label: "Visible", type: "toggle" },
];

function customSectionsField(helpText?: string): CategoryFieldDef {
  return {
    key: "customSections",
    scope: "caseStudy",
    adminLabel: "Custom Sections",
    type: "repeatable",
    helpText: helpText ?? "Optional — add freely-defined sections (text, image, gallery, or repeatable items) beyond the fields above.",
    group: "Custom Sections",
    repeatableFields: CUSTOM_SECTION_REPEATABLE_FIELDS,
  };
}

const uiUxConfig: CategoryConfig = {
  category: "UI/UX",
  displayName: "UI/UX Design",
  description: "Product and app interface design — full research-to-prototype case studies.",
  exampleProjectTypes: ["Mobile App", "Web App", "Dashboard", "Design System"],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Project Basics" },
    { key: "problem", scope: "caseStudy", adminLabel: "Problem", publicLabel: "Problem", type: "textarea", group: "Project Basics" },
    { key: "context", scope: "caseStudy", adminLabel: "Context", publicLabel: "Context", type: "textarea", group: "Project Basics" },
    { key: "research", scope: "caseStudy", adminLabel: "Research", publicLabel: "Research", type: "textarea", group: "Research" },
    { key: "researchMethods", scope: "caseStudy", adminLabel: "Research Methods", type: "tags", helpText: 'e.g. "User interviews", "Usability testing"', group: "Research" },
    { key: "userPersona", scope: "caseStudy", adminLabel: "User Persona", type: "textarea", group: "Research" },
    { key: "insights", scope: "caseStudy", adminLabel: "User Insights", publicLabel: "Insights", type: "textarea", group: "Research" },
    { key: "painPoints", scope: "caseStudy", adminLabel: "Pain Points", type: "textarea", group: "Research" },
    { key: "goals", scope: "caseStudy", adminLabel: "Goal", publicLabel: "Goals", type: "tags", group: "UX Strategy" },
    { key: "userJourney", scope: "caseStudy", adminLabel: "User Journey / Flow", publicLabel: "User Journey", type: "textarea", group: "UX Strategy" },
    { key: "informationArchitecture", scope: "caseStudy", adminLabel: "Information Architecture", publicLabel: "Information Architecture", type: "textarea", group: "UX Strategy" },
    { key: "wireframes", scope: "caseStudy", adminLabel: "Wireframes", publicLabel: "Wireframes", type: "gallery", group: "Design" },
    { key: "designDirection", scope: "caseStudy", adminLabel: "Design Direction", publicLabel: "Design Direction", type: "textarea", group: "Design" },
    { key: "designSystem", scope: "caseStudy", adminLabel: "Design System", type: "textarea", group: "Design" },
    { key: "finalDesign", scope: "caseStudy", adminLabel: "UI Design", publicLabel: "UI", type: "gallery", helpText: 'Rendered publicly as "UI" for this category', group: "Design" },
    { key: "prototype", scope: "caseStudy", adminLabel: "Prototype Link", type: "url", helpText: "Any interactive prototype tool — leave blank if Figma Prototype URL below covers it", group: "Design" },
    { key: "figmaPrototypeUrl", scope: "caseStudy", adminLabel: "Figma Prototype URL", type: "url", group: "Design" },
    { key: "testing", scope: "caseStudy", adminLabel: "Usability Testing", publicLabel: "Testing", type: "textarea", group: "Validation" },
    { key: "iterations", scope: "caseStudy", adminLabel: "Iterations", type: "textarea", group: "Validation" },
    { key: "finalSolution", scope: "caseStudy", adminLabel: "Final Solution", type: "textarea", group: "Validation" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Outcome" },
    { key: "caseStudyUrl", scope: "caseStudy", adminLabel: "Case Study URL", type: "url", helpText: "Optional — link to a writeup of this project hosted elsewhere (e.g. Medium, Behance)", group: "Outcome" },
    { key: "tools", scope: "project", adminLabel: "Tools", type: "tags", group: "Outcome" },
    customSectionsField(),
  ],
};

const uxResearchConfig: CategoryConfig = {
  category: "UX Research",
  displayName: "UX Research",
  description: "Research-led work — study design through findings, insights, and recommendations.",
  exampleProjectTypes: ["Usability Study", "Discovery Research", "Concept Testing", "Longitudinal Study"],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Project Basics" },
    { key: "problem", scope: "caseStudy", adminLabel: "Research Problem", publicLabel: "Research Problem", type: "textarea", group: "Project Basics" },
    { key: "goals", scope: "caseStudy", adminLabel: "Research Goals", publicLabel: "Research Goals", type: "tags", group: "Project Basics" },
    { key: "researchQuestions", scope: "caseStudy", adminLabel: "Research Questions", publicLabel: "Research Questions", type: "tags", group: "Project Basics" },
    { key: "researchType", scope: "caseStudy", adminLabel: "Research Type", type: "text", helpText: 'e.g. "Qualitative", "Quantitative", "Mixed-methods"', group: "Methodology" },
    { key: "researchMethods", scope: "caseStudy", adminLabel: "Methodology", publicLabel: "Methodology", type: "tags", helpText: 'e.g. "Interviews", "Usability testing", "Survey"', group: "Methodology" },
    { key: "methodDetails", scope: "caseStudy", adminLabel: "Interview / Survey / Usability Testing Details", publicLabel: "Method Details", type: "textarea", group: "Methodology" },
    { key: "participants", scope: "caseStudy", adminLabel: "Participants", publicLabel: "Participants", type: "textarea", helpText: "Real count/profile only — never invented", group: "Methodology" },
    { key: "recruitment", scope: "caseStudy", adminLabel: "Recruitment", publicLabel: "Recruitment", type: "textarea", group: "Methodology" },
    { key: "research", scope: "caseStudy", adminLabel: "Research Data", publicLabel: "Research Data", type: "textarea", group: "Findings" },
    { key: "insights", scope: "caseStudy", adminLabel: "Insights", publicLabel: "Insights", type: "textarea", group: "Findings" },
    { key: "userNeeds", scope: "caseStudy", adminLabel: "User Needs", publicLabel: "User Needs", type: "textarea", group: "Findings" },
    { key: "painPoints", scope: "caseStudy", adminLabel: "Pain Points", publicLabel: "Pain Points", type: "textarea", group: "Findings" },
    { key: "opportunityAreas", scope: "caseStudy", adminLabel: "Opportunity Areas", publicLabel: "Opportunity Areas", type: "textarea", group: "Findings" },
    { key: "userPersona", scope: "caseStudy", adminLabel: "User Persona", publicLabel: "User Persona", type: "textarea", group: "Findings" },
    { key: "userJourney", scope: "caseStudy", adminLabel: "Journey / Experience Map", publicLabel: "Journey / Experience Map", type: "textarea", group: "Findings" },
    { key: "recommendations", scope: "caseStudy", adminLabel: "Recommendations", publicLabel: "Recommendations", type: "textarea", group: "Recommendations" },
    { key: "designImplications", scope: "caseStudy", adminLabel: "Design Implications", publicLabel: "Design Implications", type: "textarea", group: "Recommendations" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Learnings", publicLabel: "Learnings", type: "textarea", group: "Outcome" },
    { key: "exploration", scope: "caseStudy", adminLabel: "Research Artifacts", publicLabel: "Research Artifacts", type: "gallery", helpText: "Whiteboards, affinity maps, screener docs, etc. — distinct from the general Gallery below", group: "Outcome" },
    { key: "prototype", scope: "caseStudy", adminLabel: "Prototype / Figma URL", type: "url", helpText: "Only if this research fed a testable prototype", group: "Outcome" },
    { key: "caseStudyUrl", scope: "caseStudy", adminLabel: "External Research Link", type: "url", helpText: "Optional — a hosted research report/deck elsewhere", group: "Outcome" },
    customSectionsField(),
  ],
};

const brandingConfig: CategoryConfig = {
  category: "Branding",
  displayName: "Branding",
  description: "Brand identity systems — strategy through to real-world applications.",
  exampleProjectTypes: ["Brand Identity", "Rebrand", "Logo System"],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Brand Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Brand Overview" },
    { key: "challenge", scope: "caseStudy", adminLabel: "Challenge", publicLabel: "Challenge", type: "textarea", group: "Brand Overview" },
    { key: "designDirection", scope: "caseStudy", adminLabel: "Brand Strategy", publicLabel: "Brand Strategy", type: "textarea", helpText: "Shared field — see relabelForCategory()", group: "Strategy" },
    { key: "targetAudience", scope: "caseStudy", adminLabel: "Target Audience", type: "textarea", group: "Strategy" },
    { key: "positioning", scope: "caseStudy", adminLabel: "Positioning", type: "textarea", group: "Strategy" },
    { key: "concept", scope: "caseStudy", adminLabel: "Logo Concept", publicLabel: "Concept", type: "textarea", helpText: "The idea behind the mark", group: "Identity Concept" },
    { key: "logoConstruction", scope: "caseStudy", adminLabel: "Logo Construction", type: "textarea", group: "Identity Concept" },
    { key: "gridGeometry", scope: "caseStudy", adminLabel: "Grid / Geometry", type: "textarea", group: "Identity Concept" },
    { key: "logo", scope: "caseStudy", adminLabel: "Logo", publicLabel: "Logo", type: "gallery", group: "Logo" },
    { key: "typography", scope: "caseStudy", adminLabel: "Typography", publicLabel: "Typography", type: "textarea", group: "Typography & Color" },
    { key: "colorSystem", scope: "caseStudy", adminLabel: "Color System", publicLabel: "Color", type: "textarea", group: "Typography & Color" },
    { key: "visualIdentity", scope: "caseStudy", adminLabel: "Visual Identity", type: "textarea", group: "Typography & Color" },
    { key: "applications", scope: "caseStudy", adminLabel: "Brand Applications", publicLabel: "Applications", type: "gallery", group: "Applications" },
    { key: "brandGuidelines", scope: "caseStudy", adminLabel: "Brand Guidelines", type: "gallery", group: "Applications" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Outcome" },
    { key: "tools", scope: "project", adminLabel: "Tools", type: "tags", group: "Outcome" },
    customSectionsField(),
  ],
};

const graphicDesignConfig: CategoryConfig = {
  category: "Graphic Design",
  displayName: "Graphic Design",
  description: "Print and digital graphic design — posters, editorial, packaging, and other standalone pieces.",
  exampleProjectTypes: ["Poster Series", "Editorial Layout", "Packaging"],
  fields: [
    { key: "context", scope: "caseStudy", adminLabel: "Design Brief", publicLabel: "Context", type: "textarea", helpText: "Shares the Context field", group: "Brief" },
    { key: "clientRequirement", scope: "caseStudy", adminLabel: "Client Requirement", type: "textarea", group: "Brief" },
    { key: "goals", scope: "caseStudy", adminLabel: "Design Objective", publicLabel: "Objective", type: "tags", group: "Brief" },
    { key: "creativeDirection", scope: "caseStudy", adminLabel: "Creative Direction", type: "textarea", group: "Creative Direction" },
    { key: "concept", scope: "caseStudy", adminLabel: "Concept", publicLabel: "Concept", type: "textarea", group: "Creative Direction" },
    { key: "designProcess", scope: "caseStudy", adminLabel: "Design Process", type: "textarea", group: "Creative Direction" },
    { key: "designDirection", scope: "caseStudy", adminLabel: "Design Direction", publicLabel: "Design Direction", type: "textarea", group: "Design Details" },
    { key: "typography", scope: "caseStudy", adminLabel: "Typography", type: "textarea", group: "Design Details" },
    { key: "colorSystem", scope: "caseStudy", adminLabel: "Color Palette", type: "textarea", group: "Design Details" },
    { key: "composition", scope: "caseStudy", adminLabel: "Composition", type: "textarea", group: "Design Details" },
    { key: "gridGeometry", scope: "caseStudy", adminLabel: "Grid", type: "textarea", group: "Design Details" },
    { key: "tools", scope: "project", adminLabel: "Software", type: "tags", helpText: "Reuses the project-level Tools field", group: "Design Details" },
    { key: "exploration", scope: "caseStudy", adminLabel: "Exploration", publicLabel: "Exploration", type: "gallery", group: "Design Details" },
    { key: "finalDesign", scope: "caseStudy", adminLabel: "Final Design", publicLabel: "Final Design", type: "gallery", group: "Design Details" },
    { key: "applications", scope: "caseStudy", adminLabel: "Applications", publicLabel: "Applications", type: "gallery", group: "Design Details" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Outcome" },
    customSectionsField(),
  ],
};

const webDesignConfig: CategoryConfig = {
  category: "Web Design",
  displayName: "Web Design",
  description: "Marketing sites and web products — UX strategy through build/handoff.",
  exampleProjectTypes: ["Marketing Site", "Landing Page", "Web App"],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Project Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Overview" },
    { key: "problem", scope: "caseStudy", adminLabel: "Problem", publicLabel: "Problem", type: "textarea", group: "Overview" },
    { key: "businessGoal", scope: "caseStudy", adminLabel: "Business Goal", type: "textarea", group: "Overview" },
    { key: "targetAudience", scope: "caseStudy", adminLabel: "Target Audience", type: "textarea", group: "Overview" },
    { key: "uxStrategy", scope: "caseStudy", adminLabel: "UX Strategy", type: "textarea", group: "Strategy" },
    { key: "informationArchitecture", scope: "caseStudy", adminLabel: "Information Architecture", type: "textarea", group: "Structure" },
    { key: "sitemap", scope: "caseStudy", adminLabel: "Sitemap", type: "textarea", group: "Structure" },
    { key: "wireframes", scope: "caseStudy", adminLabel: "Wireframes", type: "gallery", group: "Structure" },
    { key: "designDirection", scope: "caseStudy", adminLabel: "UI Direction", publicLabel: "UI Direction", type: "textarea", helpText: "Shared field — see relabelForCategory()", group: "Design" },
    { key: "designSystem", scope: "caseStudy", adminLabel: "Design System", type: "textarea", group: "Design" },
    { key: "responsiveStrategy", scope: "caseStudy", adminLabel: "Responsive Strategy", type: "textarea", group: "Design" },
    { key: "prototype", scope: "caseStudy", adminLabel: "Prototype URL", type: "url", group: "Build" },
    { key: "development", scope: "caseStudy", adminLabel: "Development / Tech / Platform", type: "textarea", group: "Build" },
    { key: "finalSolution", scope: "caseStudy", adminLabel: "Solution", type: "textarea", group: "Outcome" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Outcome" },
    { key: "tools", scope: "project", adminLabel: "Tools", type: "tags", group: "Outcome" },
    customSectionsField(),
  ],
};

const digitalMarketingConfig: CategoryConfig = {
  category: "Digital Marketing",
  displayName: "Digital Marketing",
  description: "Campaign strategy and creative for digital marketing work.",
  exampleProjectTypes: ["Email Campaign", "Paid Social Campaign", "Launch Campaign"],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Campaign Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Overview" },
    { key: "businessGoal", scope: "caseStudy", adminLabel: "Business Objective", type: "textarea", helpText: "Shares the Business Goal field", group: "Overview" },
    { key: "targetAudience", scope: "caseStudy", adminLabel: "Target Audience", type: "textarea", group: "Overview" },
    { key: "marketingStrategy", scope: "caseStudy", adminLabel: "Marketing Strategy", type: "textarea", group: "Strategy" },
    { key: "contentStrategy", scope: "caseStudy", adminLabel: "Content Strategy", type: "textarea", group: "Strategy" },
    { key: "channels", scope: "caseStudy", adminLabel: "Channels", type: "tags", group: "Strategy" },
    { key: "adStrategy", scope: "caseStudy", adminLabel: "Ad Strategy", type: "textarea", group: "Strategy" },
    { key: "funnel", scope: "caseStudy", adminLabel: "Funnel", type: "textarea", group: "Strategy" },
    { key: "concept", scope: "caseStudy", adminLabel: "Campaign Concept", publicLabel: "Concept", type: "textarea", group: "Creative" },
    { key: "creativeDirection", scope: "caseStudy", adminLabel: "Creative Direction", type: "textarea", group: "Creative" },
    { key: "cta", scope: "caseStudy", adminLabel: "CTA", type: "text", group: "Creative" },
    { key: "deliverables", scope: "caseStudy", adminLabel: "Deliverables", type: "tags", group: "Deliverables" },
    {
      key: "metrics",
      scope: "caseStudy",
      adminLabel: "Metrics",
      type: "repeatable",
      helpText: "Only enter real, admin-supplied metrics — never invent a number. Leave empty if none exist.",
      group: "Deliverables",
      repeatableFields: [
        { key: "label", label: "Metric", type: "text" },
        { key: "value", label: "Value", type: "text" },
      ],
    },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Outcome" },
    customSectionsField(),
  ],
};

const socialMediaDesignConfig: CategoryConfig = {
  category: "Social Media Design",
  displayName: "Social Media Design",
  description: "Social content design — platform-specific creative and content systems.",
  exampleProjectTypes: ["Instagram Content System", "Content Calendar", "Launch Content"],
  fields: [
    { key: "context", scope: "caseStudy", adminLabel: "Campaign", publicLabel: "Context", type: "textarea", helpText: "Shares the Context field", group: "Overview" },
    { key: "platform", scope: "caseStudy", adminLabel: "Platform", type: "tags", helpText: 'e.g. "Instagram", "TikTok"', group: "Overview" },
    { key: "contentType", scope: "caseStudy", adminLabel: "Content Type", type: "tags", group: "Overview" },
    { key: "targetAudience", scope: "caseStudy", adminLabel: "Audience", type: "textarea", helpText: "Shares the Target Audience field", group: "Overview" },
    { key: "goals", scope: "caseStudy", adminLabel: "Objective", type: "tags", helpText: "Shares the Goals field", group: "Overview" },
    { key: "creativeDirection", scope: "caseStudy", adminLabel: "Creative Direction", type: "textarea", group: "Creative" },
    { key: "contentStrategy", scope: "caseStudy", adminLabel: "Content Strategy", type: "textarea", group: "Creative" },
    { key: "designSystem", scope: "caseStudy", adminLabel: "Design System", type: "textarea", group: "Creative" },
    { key: "deliverables", scope: "caseStudy", adminLabel: "Deliverables", type: "tags", group: "Deliverables" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "gallery", scope: "project", adminLabel: "Gallery", type: "gallery", helpText: "Uses the project-level Gallery field", group: "Deliverables" },
    customSectionsField(),
  ],
};

const printDesignConfig: CategoryConfig = {
  category: "Print Design",
  displayName: "Print Design",
  description: "Physical print pieces — from brief to production specification.",
  exampleProjectTypes: ["Poster", "Menu", "Packaging", "Editorial Print"],
  fields: [
    { key: "printType", scope: "caseStudy", adminLabel: "Print Type", type: "text", helpText: 'e.g. "Poster", "Menu", "Packaging"', group: "Overview" },
    { key: "context", scope: "caseStudy", adminLabel: "Brief", publicLabel: "Context", type: "textarea", helpText: "Shares the Context field", group: "Overview" },
    { key: "goals", scope: "caseStudy", adminLabel: "Objective", type: "tags", helpText: "Shares the Goals field", group: "Overview" },
    { key: "concept", scope: "caseStudy", adminLabel: "Concept", publicLabel: "Concept", type: "textarea", group: "Concept" },
    { key: "typography", scope: "caseStudy", adminLabel: "Typography", type: "textarea", group: "Concept" },
    { key: "colorSystem", scope: "caseStudy", adminLabel: "Color System", type: "textarea", group: "Concept" },
    { key: "dimensions", scope: "caseStudy", adminLabel: "Dimensions", type: "text", helpText: 'e.g. "18in x 24in"', group: "Specification" },
    { key: "printSpecification", scope: "caseStudy", adminLabel: "Print Specification", type: "textarea", helpText: "Stock, finish, binding, etc.", group: "Specification" },
    { key: "production", scope: "caseStudy", adminLabel: "Production", type: "textarea", group: "Specification" },
    { key: "applications", scope: "caseStudy", adminLabel: "Applications", publicLabel: "Applications", type: "gallery", group: "Specification" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Outcome" },
    { key: "gallery", scope: "project", adminLabel: "Gallery", type: "gallery", helpText: "Uses the project-level Gallery field", group: "Outcome" },
    customSectionsField(),
  ],
};

const customConfig: CategoryConfig = {
  category: "Custom",
  displayName: "Custom",
  description: "For work that doesn't fit the other 7 categories — common fields plus freely-defined sections.",
  exampleProjectTypes: [],
  fields: [
    { key: "overview", scope: "caseStudy", adminLabel: "Overview", publicLabel: "Overview", type: "textarea", required: true, group: "Overview" },
    { key: "outcome", scope: "caseStudy", adminLabel: "Outcome", publicLabel: "Outcome", type: "textarea", required: true, group: "Overview" },
    { key: "reflection", scope: "caseStudy", adminLabel: "Reflection", publicLabel: "Reflection", type: "textarea", group: "Overview" },
    customSectionsField(
      "Add as many freely-defined sections as this project needs — title, description, body, image, gallery, and repeatable items are all optional.",
    ),
  ],
};

/** Canonical, keyed lookup — the object `CATEGORY_CONFIG[category]` form Phase C's dynamic editor consumes. `Record<CanonicalProjectCategory, …>` means TypeScript enforces that all 8 canonical categories have a config; there is no way for one to be silently missing. */
export const CATEGORY_CONFIG: Record<CanonicalProjectCategory, CategoryConfig> = {
  "UI/UX": uiUxConfig,
  "UX Research": uxResearchConfig,
  Branding: brandingConfig,
  "Graphic Design": graphicDesignConfig,
  "Web Design": webDesignConfig,
  "Digital Marketing": digitalMarketingConfig,
  "Social Media Design": socialMediaDesignConfig,
  "Print Design": printDesignConfig,
  Custom: customConfig,
};

/** Config for a category, or `undefined` for a deprecated `LegacyProjectCategory` value (none of which have a config — see project.ts's `LegacyProjectCategory` doc comment). */
export function getCategoryConfig(category: ProjectCategory): CategoryConfig | undefined {
  return (CATEGORY_CONFIG as Record<string, CategoryConfig>)[category];
}

/** Clean, user-facing label for a category — falls back to the raw internal value for a legacy category (which has no config entry). */
export function getCategoryDisplayName(category: ProjectCategory): string {
  return getCategoryConfig(category)?.displayName ?? category;
}

/**
 * [Phase C] The fields the dynamic admin editor should actually render for
 * a category — `CATEGORY_CONFIG[category].fields` with anything already
 * covered by `COMMON_FIELDS` filtered out, so e.g. every category's
 * `overview`/`outcome`/`tools` entry (present in every config for
 * documentation completeness — see CMS_CONTENT_MODEL.md §4-§11) doesn't
 * render a second time next to the fixed common-fields section. Returns
 * `[]` for a legacy category (no config, nothing to render).
 */
export function getDynamicFields(category: ProjectCategory): CategoryFieldDef[] {
  const config = getCategoryConfig(category);
  if (!config) return [];
  return config.fields.filter((f) => !COMMON_FIELD_KEYS.has(f.key));
}

/**
 * The one piece of category-dependent label logic that genuinely existed
 * in two places before Phase B — ProjectStory.tsx's `categoryStages()`
 * switch and the admin editor's own local ternary both independently
 * encoded "Branding calls `designDirection` 'Brand Strategy'" / "UI/UX
 * calls `finalDesign` 'UI'". Both call this instead, so the mapping can
 * only be changed in one place. Output is unchanged from before Phase B —
 * see docs/CMS_CONTENT_MODEL.md §17 for the exact before/after strings
 * this was verified against.
 */
export function relabelForCategory(
  category: ProjectCategory,
  field: "designDirection" | "finalDesign",
): string {
  if (field === "designDirection") {
    return category === "Branding" ? "Brand Strategy" : "Design Direction";
  }
  return category === "UI/UX" ? "UI" : "Final Design";
}
