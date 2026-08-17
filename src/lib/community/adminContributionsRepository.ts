import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";

/**
 * [Phase 6E — admin moderation] Same architectural boundary as
 * adminThanksSignalsRepository.ts (Phase 6C/6D): the hand-rolled admin has
 * no Supabase Auth session, so every write here uses the service-role key,
 * gated by `requireAdmin()` + proxy.ts, not RLS's `is_admin()` path.
 *
 * A Contribution's own status ceiling is `approved` — there is no
 * `published` value for `contributions.status` (see
 * src/types/contribution.ts's header comment). "Publish" instead
 * transitions the linked DesignResponse's status (which does have
 * `published`) — that's the actual artifact meant to eventually render
 * publicly, per the product objective's own wording ("approved response
 * can eventually be published"). So admin moderation here is genuinely
 * two small action groups against two rows, not one linear status.
 */

export interface AdminContributionListItem {
  id: string;
  signalId: string;
  signalTitle: string;
  contributorName: string;
  title: string | null;
  contributionType: string | null;
  status: string;
  designResponseStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContributionDetail extends AdminContributionListItem {
  explanation: string | null;
  designResponse: {
    id: string;
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
    status: string;
  } | null;
}

interface ContribRow {
  id: string;
  thanks_signal_id: string;
  contributor_id: string;
  title: string | null;
  contribution_type: string | null;
  explanation: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DesignResponseRow {
  id: string;
  contribution_id: string;
  discipline: string;
  summary: string | null;
  research_findings: string | null;
  design_decisions: string | null;
  outcome: string | null;
  problem_statement: string | null;
  approach: string | null;
  tools_used: string | null;
  prototype_url: string | null;
  figma_url: string | null;
  case_study_url: string | null;
  external_url: string | null;
  status: string;
}

async function lookups(contribRows: ContribRow[]) {
  const signalIds = [...new Set(contribRows.map((c) => c.thanks_signal_id))];
  const contribIds = contribRows.map((c) => c.id);
  const [signals, profiles, designResponses] = await Promise.all([
    signalIds.length ? supabaseSelect<{ id: string; title: string }[]>("thanks_signals", `select=id,title&id=in.(${signalIds.join(",")})`) : Promise.resolve([]),
    supabaseSelect<{ id: string; name: string }[]>("profiles", "select=id,name"),
    contribIds.length ? supabaseSelect<DesignResponseRow[]>("design_responses", `select=*&contribution_id=in.(${contribIds.join(",")})`) : Promise.resolve([]),
  ]);
  return {
    signalTitleById: new Map(signals.map((s) => [s.id, s.title])),
    nameById: new Map(profiles.map((p) => [p.id, p.name])),
    drByContribId: new Map(designResponses.map((d) => [d.contribution_id, d])),
  };
}

function toListItem(
  c: ContribRow,
  signalTitleById: Map<string, string>,
  nameById: Map<string, string>,
  drByContribId: Map<string, DesignResponseRow>,
): AdminContributionListItem {
  return {
    id: c.id,
    signalId: c.thanks_signal_id,
    signalTitle: signalTitleById.get(c.thanks_signal_id) || "(unknown signal)",
    contributorName: nameById.get(c.contributor_id) || "Unknown",
    title: c.title,
    contributionType: c.contribution_type,
    status: c.status,
    designResponseStatus: drByContribId.get(c.id)?.status ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export async function listContributionsForAdmin(filter?: { status?: string; published?: boolean }): Promise<AdminContributionListItem[]> {
  const rows = await supabaseSelect<ContribRow[]>(
    "contributions",
    filter?.status ? `select=*&order=updated_at.desc&status=eq.${filter.status}` : "select=*&order=updated_at.desc",
  );
  const { signalTitleById, nameById, drByContribId } = await lookups(rows);
  let items = rows.map((c) => toListItem(c, signalTitleById, nameById, drByContribId));
  if (filter?.published) items = items.filter((i) => i.designResponseStatus === "published");
  return items;
}

export async function getContributionForAdmin(id: string): Promise<AdminContributionDetail | null> {
  const rows = await supabaseSelect<ContribRow[]>("contributions", `select=*&id=eq.${id}`);
  const row = rows[0];
  if (!row) return null;
  const { signalTitleById, nameById, drByContribId } = await lookups([row]);
  const dr = drByContribId.get(row.id) ?? null;
  return {
    ...toListItem(row, signalTitleById, nameById, drByContribId),
    explanation: row.explanation,
    designResponse: dr
      ? {
          id: dr.id,
          discipline: dr.discipline,
          summary: dr.summary,
          researchFindings: dr.research_findings,
          designDecisions: dr.design_decisions,
          outcome: dr.outcome,
          problemStatement: dr.problem_statement,
          approach: dr.approach,
          toolsUsed: dr.tools_used,
          prototypeUrl: dr.prototype_url,
          figmaUrl: dr.figma_url,
          caseStudyUrl: dr.case_study_url,
          externalUrl: dr.external_url,
          status: dr.status,
        }
      : null,
  };
}

export type ContributionModerationAction = "review" | "approve" | "reject" | "archive" | "publish";

export const CONTRIBUTION_MODERATION_PRECONDITIONS: Record<Exclude<ContributionModerationAction, "publish">, string[]> = {
  review: ["submitted"],
  approve: ["under_review"],
  reject: ["submitted", "under_review"],
  archive: ["approved"],
};

/** Publish's precondition is checked against the *Contribution's* status (must be approved) by the caller, since the action itself writes to design_responses, not contributions. */
export const PUBLISH_REQUIRES_CONTRIBUTION_STATUS = "approved";

async function transitionContribution(id: string, allowed: string[], patch: Record<string, unknown>): Promise<AdminContributionDetail | null> {
  const query = `id=eq.${id}&status=in.(${allowed.join(",")})`;
  const rows = await supabaseUpdate<ContribRow[]>("contributions", query, { ...patch, updated_at: new Date().toISOString() });
  const row = rows[0];
  if (!row) return null;
  return getContributionForAdmin(row.id);
}

export async function markContributionUnderReview(id: string) {
  return transitionContribution(id, CONTRIBUTION_MODERATION_PRECONDITIONS.review, { status: "under_review" });
}
export async function approveContribution(id: string) {
  return transitionContribution(id, CONTRIBUTION_MODERATION_PRECONDITIONS.approve, { status: "approved" });
}
export async function rejectContribution(id: string) {
  return transitionContribution(id, CONTRIBUTION_MODERATION_PRECONDITIONS.reject, { status: "rejected" });
}
export async function archiveContribution(id: string) {
  return transitionContribution(id, CONTRIBUTION_MODERATION_PRECONDITIONS.archive, { status: "archived" });
}

/** Publishes the DesignResponse linked to Contribution `contributionId` — the write target is design_responses, keyed by contribution_id, not contributions itself (see this file's header comment for why). */
export async function publishDesignResponse(contributionId: string): Promise<AdminContributionDetail | null> {
  const rows = await supabaseUpdate<DesignResponseRow[]>(
    "design_responses",
    `contribution_id=eq.${contributionId}&status=in.(submitted,under_review)`,
    { status: "published", updated_at: new Date().toISOString() },
  );
  if (!rows[0]) return null;
  return getContributionForAdmin(contributionId);
}
