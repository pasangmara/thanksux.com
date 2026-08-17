/**
 * [Phase 6E — Contribution + DesignResponse foundation] Client-facing
 * shapes for the `contributions`/`design_responses` tables. Both tables
 * were created in Phase 6A/6B (migration 0012); Phase 6E only adds the
 * columns this phase's product spec actually needs (migration 0014) —
 * `contributions.title` and five `design_responses` columns
 * (problem_statement/approach/tools_used/case_study_url/external_url).
 *
 * Status values below are the *real* CHECK-constraint values, inspected
 * live before writing this file — not the idealized lifecycle described in
 * the product brief. Two differences worth stating plainly:
 *   - `ContributionStatus` has no `published` value. A Contribution's own
 *     moderation ceiling is `approved` (or `rejected`/`archived`) —
 *     "published" is exclusively a `DesignResponseStatus` value. This
 *     matches the architecture doc's original reasoning: a Contribution is
 *     the pitch/response *shell*; its linked DesignResponse is the actual
 *     artifact that gets published.
 *   - `under_review` (not `reviewed`) is the real value here — a different
 *     table than `thanks_signals`, which does use `reviewed` (see
 *     Phase 6D's report for that mismatch). Reusing each table's own exact
 *     existing vocabulary rather than unifying them cosmetically.
 */

export type ContributionType =
  | "UX Research"
  | "UX/UI Design"
  | "UI Design"
  | "Graphic Design"
  | "Branding"
  | "Motion / Interaction"
  | "Case Study"
  | "Other";

export const CONTRIBUTION_TYPES: ContributionType[] = [
  "UX Research",
  "UX/UI Design",
  "UI Design",
  "Graphic Design",
  "Branding",
  "Motion / Interaction",
  "Case Study",
  "Other",
];

export type ContributionStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected" | "archived";
export type DesignResponseStatus = "draft" | "submitted" | "under_review" | "approved" | "published" | "rejected" | "archived";

export interface Contribution {
  id: string;
  signalId: string;
  contributorId: string;
  title: string | null;
  contributionType: ContributionType | string | null;
  explanation: string | null;
  research: string | null;
  observation: string | null;
  proposedDirection: string | null;
  prototypeUrl: string | null;
  figmaUrl: string | null;
  externalUrl: string | null;
  status: ContributionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DesignResponse {
  id: string;
  contributionId: string;
  authorId: string;
  discipline: string;
  summary: string | null;
  researchFindings: string | null;
  designDecisions: string | null;
  outcome: string | null;
  problemStatement: string | null;
  approach: string | null;
  toolsUsed: string | null;
  prototypeUrl: string | null;
  figmaUrl: string | null;
  caseStudyUrl: string | null;
  externalUrl: string | null;
  publishedProjectId: string | null;
  status: DesignResponseStatus;
  createdAt: string;
  updatedAt: string;
}

/** Fields a contributor may set on their own Contribution — author_id/signal_id/status are server-derived or hardcoded transitions only. */
export interface ContributionDraftInput {
  title?: string;
  contributionType?: string;
  explanation?: string;
  research?: string;
  observation?: string;
  proposedDirection?: string;
  prototypeUrl?: string;
  figmaUrl?: string;
  externalUrl?: string;
}

/** Fields a contributor may set on their own DesignResponse — author_id/contribution_id/status/published_project_id are never client-settable (RLS additionally refuses published_project_id at the database level — see migration 0015). */
export interface DesignResponseDraftInput {
  discipline?: string;
  summary?: string;
  researchFindings?: string;
  designDecisions?: string;
  outcome?: string;
  problemStatement?: string;
  approach?: string;
  toolsUsed?: string;
  prototypeUrl?: string;
  figmaUrl?: string;
  caseStudyUrl?: string;
  externalUrl?: string;
}

export type DesignResponseFieldKey = keyof DesignResponseDraftInput;

interface FieldConfigEntry {
  key: DesignResponseFieldKey;
  label: string;
  kind: "text" | "textarea" | "url";
}

/**
 * [§2/§8 — one central configuration source] Which DesignResponse fields
 * are relevant for a given Contribution type, and what to call them —
 * "problem statement" reads as "research problem" for UX Research and
 * "brief / problem" for Graphic Design, same underlying `problem_statement`
 * column either way. `summary` and `tools_used` are deliberately common to
 * every type (rendered outside this per-type list) rather than repeated
 * here. This is the one place a new contribution type or field mapping
 * gets added — never hardcode this list a second time anywhere else.
 */
export const CONTRIBUTION_TYPE_FIELDS: Record<ContributionType, FieldConfigEntry[]> = {
  "UX Research": [
    { key: "problemStatement", label: "Research problem", kind: "textarea" },
    { key: "approach", label: "Methodology", kind: "textarea" },
    { key: "researchFindings", label: "Findings", kind: "textarea" },
    { key: "outcome", label: "Insights", kind: "textarea" },
  ],
  "UX/UI Design": [
    { key: "problemStatement", label: "Problem", kind: "textarea" },
    { key: "approach", label: "Approach", kind: "textarea" },
    { key: "designDecisions", label: "Design rationale", kind: "textarea" },
    { key: "figmaUrl", label: "Figma prototype URL", kind: "url" },
    { key: "prototypeUrl", label: "Live prototype URL", kind: "url" },
  ],
  "UI Design": [
    { key: "problemStatement", label: "Problem", kind: "textarea" },
    { key: "approach", label: "Approach", kind: "textarea" },
    { key: "designDecisions", label: "Design rationale", kind: "textarea" },
    { key: "figmaUrl", label: "Figma prototype URL", kind: "url" },
    { key: "prototypeUrl", label: "Live prototype URL", kind: "url" },
  ],
  "Graphic Design": [
    { key: "problemStatement", label: "Brief / problem", kind: "textarea" },
    { key: "approach", label: "Concept", kind: "textarea" },
    { key: "designDecisions", label: "Design rationale", kind: "textarea" },
    { key: "externalUrl", label: "Project URL", kind: "url" },
  ],
  Branding: [
    { key: "problemStatement", label: "Brief / problem", kind: "textarea" },
    { key: "approach", label: "Concept", kind: "textarea" },
    { key: "designDecisions", label: "Design rationale", kind: "textarea" },
    { key: "externalUrl", label: "Project URL", kind: "url" },
  ],
  "Motion / Interaction": [
    { key: "problemStatement", label: "Problem", kind: "textarea" },
    { key: "approach", label: "Approach", kind: "textarea" },
    { key: "designDecisions", label: "Design rationale", kind: "textarea" },
    { key: "prototypeUrl", label: "Live prototype URL", kind: "url" },
    { key: "externalUrl", label: "Project URL", kind: "url" },
  ],
  "Case Study": [
    { key: "problemStatement", label: "Problem", kind: "textarea" },
    { key: "approach", label: "Process", kind: "textarea" },
    { key: "outcome", label: "Outcome", kind: "textarea" },
    { key: "caseStudyUrl", label: "Case study URL", kind: "url" },
  ],
  Other: [
    { key: "problemStatement", label: "Problem", kind: "textarea" },
    { key: "approach", label: "Approach", kind: "textarea" },
    { key: "outcome", label: "Outcome", kind: "textarea" },
    { key: "externalUrl", label: "Project URL", kind: "url" },
  ],
};

/** Every DesignResponse field shown regardless of type — kept small on purpose (progressive disclosure lives in CONTRIBUTION_TYPE_FIELDS). */
export const COMMON_RESPONSE_FIELDS: FieldConfigEntry[] = [
  { key: "summary", label: "Solution summary", kind: "textarea" },
  { key: "toolsUsed", label: "Tools used", kind: "text" },
];
