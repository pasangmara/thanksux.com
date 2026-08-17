import type { CaseStudy, CoverMedia, CustomSection, MetricEntry, Project } from "@/types/project";
import { getCategoryConfig, getDynamicFields, type CategoryFieldDef } from "@/types/category-config";
import {
  CaseStudyCustomSectionsSection,
  CaseStudyGallerySection,
  CaseStudyLinkSection,
  CaseStudyListSection,
  CaseStudyMetricsSection,
  CaseStudyTextSection,
  OutcomeBlock,
} from "./CaseStudySection";

/**
 * [CMS Phase D3] Project Story — now genuinely data-driven per category,
 * closing the gap CMS_CONTENT_MODEL.md §17 and the Phase D3 brief both
 * named: every category-specific field defined in `CATEGORY_CONFIG`
 * (src/types/category-config.ts) — not just the original 3 documented
 * flows' fields — now gets a stage here automatically, in the config's own
 * field order, under its `publicLabel` (falling back to `adminLabel`).
 * This is the single source of truth Phase B/C's docs both pointed at:
 * the admin's dynamic editor and this renderer now read the exact same
 * field list, so they cannot drift apart the way the old hand-written
 * per-category switch inevitably would have as more fields were added.
 *
 * Verified behavior-preserving for every category with real content
 * (Gridmark, Branding) before this change shipped: Gridmark's only
 * populated fields (`constraint`/`designDirection`/`concept`/`typography`
 * /`colorSystem`/`reflection`) produce the identical rendered stage
 * sequence under the new config-driven path as the old hand-written
 * switch produced, because every newly-eligible field is empty for
 * Gridmark and `hasContent()` still filters empty stages exactly as
 * before. The one visible addition is `overview` (see below) — it was
 * never rendered on the detail page at all previously, only used by the
 * homepage spotlight.
 *
 * Only `scope: "caseStudy"` fields become stages here — `scope: "project"`
 * fields a category's config lists (e.g. `tools`, or Social Media
 * Design/Print Design's `gallery`) are already rendered elsewhere
 * (`ProjectOverview`'s Tools column, the detail page's own general
 * Gallery section) and would otherwise render twice.
 *
 * Legacy categories (`Editorial`/`Campaign` — see `LegacyProjectCategory`
 * in src/types/project.ts; `UX Research` was promoted to a real canonical
 * category with its own config) have no `CATEGORY_CONFIG` entry; they keep
 * the exact old generic fallback field list, unchanged,
 * since nothing about their schema was ever formalized into config.
 *
 * Overview/Challenge (if present) now open the story, before Constraint —
 * both already existed as real, editable schema fields but had no public
 * destination at all until this phase. Constraint/Reflection's existing
 * always-first/always-last positions are unchanged.
 *
 * [CMS Phase D3 follow-up] `type: "url"` fields (e.g. `prototype`) get
 * their own `"link"` stage instead of being folded into the generic text
 * stage — a URL rendered as inert `<p>` text (the prior behavior) has no
 * real public destination; a URL is only meaningful on the public site as
 * a clickable link. See `CaseStudyLinkSection` in CaseStudySection.tsx.
 */

type Stage =
  | { kind: "text"; label: string; text?: string; secondaryLabel?: string; secondaryList?: string[] }
  | { kind: "list"; label: string; items?: string[] }
  | { kind: "gallery"; label: string; images?: CoverMedia[] }
  | { kind: "metrics"; label: string; metrics?: MetricEntry[] }
  | { kind: "custom-sections"; label: string; sections?: CustomSection[] }
  | { kind: "link"; label: string; url?: string };

const TEXT_FIELD_TYPES = new Set(["text", "textarea", "richtext"]);

function fieldToStage(field: CategoryFieldDef, cs: CaseStudy): Stage | null {
  const label = field.publicLabel ?? field.adminLabel;
  const value = (cs as unknown as Record<string, unknown>)[field.key];

  if (field.type === "url") {
    return { kind: "link", label, url: typeof value === "string" ? value : undefined };
  }
  if (TEXT_FIELD_TYPES.has(field.type)) {
    return { kind: "text", label, text: typeof value === "string" ? value : undefined };
  }
  if (field.type === "tags") {
    return { kind: "list", label, items: Array.isArray(value) ? (value as string[]) : undefined };
  }
  if (field.type === "gallery") {
    return { kind: "gallery", label, images: Array.isArray(value) ? (value as CoverMedia[]) : undefined };
  }
  if (field.type === "repeatable") {
    if (field.key === "metrics") {
      return { kind: "metrics", label, metrics: Array.isArray(value) ? (value as MetricEntry[]) : undefined };
    }
    if (field.key === "customSections") {
      return { kind: "custom-sections", label, sections: Array.isArray(value) ? (value as CustomSection[]) : undefined };
    }
  }
  // "select"/"toggle"/"number"/"year"/"color"/"image" — no current
  // caseStudy-scoped field uses any of these types; nothing to render.
  return null;
}

/** Unchanged from the pre-D3 hand-written `default` branch — the 3 legacy categories' fallback, verbatim. */
function legacyDefaultStages(cs: CaseStudy): Stage[] {
  return [
    { kind: "text", label: "Context", text: cs.context },
    { kind: "text", label: "Problem", text: cs.problem },
    { kind: "list", label: "Goals", items: cs.goals },
    {
      kind: "text",
      label: "Research",
      text: cs.research,
      secondaryLabel: "Methods",
      secondaryList: cs.researchMethods,
    },
    { kind: "text", label: "Insights", text: cs.insights },
    { kind: "text", label: "User Journey", text: cs.userJourney },
    { kind: "text", label: "Information Architecture", text: cs.informationArchitecture },
    { kind: "text", label: "Concept", text: cs.concept },
    { kind: "text", label: "Design Direction", text: cs.designDirection },
    { kind: "gallery", label: "Wireframes", images: cs.wireframes },
    { kind: "text", label: "Typography", text: cs.typography },
    { kind: "text", label: "Color", text: cs.colorSystem },
    { kind: "gallery", label: "Logo", images: cs.logo },
    { kind: "gallery", label: "Exploration", images: cs.exploration },
    { kind: "gallery", label: "Final Design", images: cs.finalDesign },
    { kind: "gallery", label: "Applications", images: cs.applications },
    { kind: "text", label: "Testing", text: cs.testing },
  ];
}

/**
 * Every category's config lists `reflection` (so it's editable in that
 * category's own "Outcome" admin group) but it isn't in `COMMON_FIELD_KEYS`
 * (it's the one common-to-every-category field that isn't a `Project`-
 * level or basic-info field) — `getDynamicFields` alone wouldn't exclude
 * it, and it's already rendered as this component's fixed trailing stage
 * (see `stages` below), so it's excluded here to avoid rendering it twice.
 */
const STORY_HANDLED_ELSEWHERE = new Set<string>(["reflection"]);

function categoryStages(project: Project): Stage[] {
  const cs = project.caseStudy;
  const config = getCategoryConfig(project.category);
  if (!config) return legacyDefaultStages(cs);

  return getDynamicFields(project.category)
    .filter((field) => field.scope === "caseStudy" && !STORY_HANDLED_ELSEWHERE.has(field.key))
    .map((field) => fieldToStage(field, cs))
    .filter((stage): stage is Stage => stage !== null);
}

function hasContent(stage: Stage): boolean {
  if (stage.kind === "text") return Boolean(stage.text);
  if (stage.kind === "list") return Boolean(stage.items && stage.items.length > 0);
  if (stage.kind === "gallery") return Boolean(stage.images && stage.images.length > 0);
  if (stage.kind === "metrics") return Boolean(stage.metrics && stage.metrics.length > 0);
  if (stage.kind === "link") return Boolean(stage.url);
  return Boolean(stage.sections && stage.sections.length > 0);
}

export function ProjectStory({ project }: { project: Project }) {
  const cs = project.caseStudy;

  const stages: Stage[] = [
    { kind: "text", label: "Overview", text: cs.overview } satisfies Stage,
    { kind: "text", label: "Challenge", text: cs.challenge } satisfies Stage,
    { kind: "text", label: "Constraint", text: cs.constraint } satisfies Stage,
    ...categoryStages(project),
    { kind: "text", label: "Reflection", text: cs.reflection } satisfies Stage,
  ].filter(hasContent);

  return (
    <>
      {stages.map((stage) => {
        if (stage.kind === "gallery") {
          return (
            <CaseStudyGallerySection
              key={stage.label}
              label={stage.label}
              images={stage.images ?? []}
            />
          );
        }
        if (stage.kind === "list") {
          return (
            <CaseStudyListSection
              key={stage.label}
              label={stage.label}
              items={stage.items ?? []}
            />
          );
        }
        if (stage.kind === "metrics") {
          return (
            <CaseStudyMetricsSection
              key={stage.label}
              label={stage.label}
              metrics={stage.metrics ?? []}
            />
          );
        }
        if (stage.kind === "custom-sections") {
          return (
            <CaseStudyCustomSectionsSection
              key={stage.label}
              label={stage.label}
              sections={stage.sections ?? []}
            />
          );
        }
        if (stage.kind === "link") {
          return (
            <CaseStudyLinkSection
              key={stage.label}
              label={stage.label}
              url={stage.url ?? ""}
            />
          );
        }
        return (
          <CaseStudyTextSection
            key={stage.label}
            label={stage.label}
            text={stage.text ?? ""}
            secondaryLabel={stage.secondaryLabel}
            secondaryList={stage.secondaryList}
          />
        );
      })}

      <OutcomeBlock outcome={cs.outcome} />
    </>
  );
}
