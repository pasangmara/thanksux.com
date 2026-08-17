import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Contribution, ContributionDraftInput, DesignResponse, DesignResponseDraftInput } from "@/types/contribution";

/**
 * [Phase 6E] RLS-bound (server session client, never service-role) — same
 * architectural boundary as thanksSignalsRepository.ts. Every write here
 * only ever touches fields a normal contributor is allowed to set;
 * contributor_id/author_id/status/published_project_id are never accepted
 * as input. `submitContribution()` is the one hardcoded transition this
 * phase exposes (draft -> submitted, on both the Contribution and its
 * linked DesignResponse together — see that function's own comment for
 * why they move as one unit).
 */

interface ContributionRow {
  id: string;
  thanks_signal_id: string;
  contributor_id: string;
  title: string | null;
  contribution_type: string | null;
  explanation: string | null;
  research: string | null;
  observation: string | null;
  proposed_direction: string | null;
  prototype_url: string | null;
  figma_url: string | null;
  external_url: string | null;
  status: Contribution["status"];
  created_at: string;
  updated_at: string;
}

interface DesignResponseRow {
  id: string;
  contribution_id: string;
  author_id: string;
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
  published_project_id: string | null;
  status: DesignResponse["status"];
  created_at: string;
  updated_at: string;
}

function rowToContribution(r: ContributionRow): Contribution {
  return {
    id: r.id,
    signalId: r.thanks_signal_id,
    contributorId: r.contributor_id,
    title: r.title,
    contributionType: r.contribution_type,
    explanation: r.explanation,
    research: r.research,
    observation: r.observation,
    proposedDirection: r.proposed_direction,
    prototypeUrl: r.prototype_url,
    figmaUrl: r.figma_url,
    externalUrl: r.external_url,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToDesignResponse(r: DesignResponseRow): DesignResponse {
  return {
    id: r.id,
    contributionId: r.contribution_id,
    authorId: r.author_id,
    discipline: r.discipline,
    summary: r.summary,
    researchFindings: r.research_findings,
    designDecisions: r.design_decisions,
    outcome: r.outcome,
    problemStatement: r.problem_statement,
    approach: r.approach,
    toolsUsed: r.tools_used,
    prototypeUrl: r.prototype_url,
    figmaUrl: r.figma_url,
    caseStudyUrl: r.case_study_url,
    externalUrl: r.external_url,
    publishedProjectId: r.published_project_id,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface ContributionBundle {
  contribution: Contribution;
  designResponse: DesignResponse;
}

/**
 * [§7 — "I can solve this"] Product decision, documented since no prior
 * phase established it: **one active Contribution per (contributor,
 * signal)**. "Active" means not `rejected`/`archived` — a contributor
 * whose attempt was rejected (or who archived their own abandoned draft)
 * can start a fresh one rather than being permanently blocked, but they
 * can never silently accumulate two live drafts/submissions against the
 * same Signal. If an active one already exists, this opens it; otherwise
 * it creates a new Contribution (draft) and its one linked DesignResponse
 * (draft) together. If the DesignResponse insert fails, the just-created
 * Contribution is deleted rather than left as an orphaned shell with no
 * response to edit — same orphan-prevention principle as Phase 4C's media
 * upload path.
 */
export async function getOrCreateContribution(signalId: string): Promise<ContributionBundle> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: existingRows, error: existingErr } = await supabase
    .from("contributions")
    .select("*")
    .eq("thanks_signal_id", signalId)
    .eq("contributor_id", user.id)
    .not("status", "in", "(rejected,archived)")
    .order("created_at", { ascending: false })
    .limit(1);
  if (existingErr) throw new Error(existingErr.message);

  if (existingRows && existingRows.length > 0) {
    const contribution = rowToContribution(existingRows[0] as ContributionRow);
    const { data: drRows, error: drErr } = await supabase
      .from("design_responses")
      .select("*")
      .eq("contribution_id", contribution.id)
      .limit(1);
    if (drErr) throw new Error(drErr.message);
    if (drRows && drRows[0]) {
      return { contribution, designResponse: rowToDesignResponse(drRows[0] as DesignResponseRow) };
    }
    // Existing contribution with no linked response (shouldn't normally happen — belt-and-suspenders): create one now.
    const created = await createLinkedDesignResponse(supabase, contribution);
    return { contribution, designResponse: created };
  }

  const { data: newContribRows, error: insertErr } = await supabase
    .from("contributions")
    .insert({ thanks_signal_id: signalId, contributor_id: user.id, status: "draft" })
    .select("*")
    .single();
  if (insertErr) throw new Error(insertErr.message);
  const contribution = rowToContribution(newContribRows as ContributionRow);

  try {
    const designResponse = await createLinkedDesignResponse(supabase, contribution);
    return { contribution, designResponse };
  } catch (err) {
    await supabase.from("contributions").delete().eq("id", contribution.id).eq("status", "draft");
    throw err;
  }
}

async function createLinkedDesignResponse(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  contribution: Contribution,
): Promise<DesignResponse> {
  const { data, error } = await supabase
    .from("design_responses")
    .insert({
      contribution_id: contribution.id,
      author_id: contribution.contributorId,
      discipline: contribution.contributionType || "Other",
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToDesignResponse(data as DesignResponseRow);
}

/**
 * ["I can solve this" real notification flow, Part C/L] Read-only check —
 * never creates anything, unlike getOrCreateContribution() — used to decide
 * the CTA's initial state (show the form vs. "already offered") without a
 * side effect from merely loading the page or opening the button.
 */
export async function getMyContributionStatus(signalId: string): Promise<Contribution | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("thanks_signal_id", signalId)
    .eq("contributor_id", user.id)
    .not("status", "in", "(rejected,archived)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToContribution(data as ContributionRow) : null;
}

/**
 * ["I can solve this" real notification flow, Part K] Every non-draft
 * (i.e. actually-offered, not an empty in-progress shell) Contribution
 * against one Signal, for that Signal's own author to see who wants to
 * help. RLS's `contributions_select` policy (migration 0012) already
 * grants this: `... or exists (select 1 from thanks_signals s where s.id =
 * thanks_signal_id and s.author_id = auth.uid())` — the signal author can
 * read every Contribution against their own Signal regardless of its
 * status, not just `approved` ones (that clause is the anon/public-facing
 * case). The explicit filters here narrow that to what's actually useful
 * to show ("people who want to help", not draft noise).
 */
export async function listActiveContributionsForSignal(signalId: string): Promise<Contribution[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("thanks_signal_id", signalId)
    .not("status", "in", "(draft,rejected,archived)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as ContributionRow[]).map(rowToContribution);
}

export async function getOwnContributionBundle(contributionId: string): Promise<ContributionBundle | null> {
  const supabase = await createSupabaseServerClient();
  const { data: contribRow, error: contribErr } = await supabase
    .from("contributions")
    .select("*")
    .eq("id", contributionId)
    .maybeSingle();
  if (contribErr) throw new Error(contribErr.message);
  if (!contribRow) return null;

  const { data: drRow, error: drErr } = await supabase
    .from("design_responses")
    .select("*")
    .eq("contribution_id", contributionId)
    .maybeSingle();
  if (drErr) throw new Error(drErr.message);
  if (!drRow) return null;

  return {
    contribution: rowToContribution(contribRow as ContributionRow),
    designResponse: rowToDesignResponse(drRow as DesignResponseRow),
  };
}

export async function updateOwnContribution(id: string, input: Partial<ContributionDraftInput>): Promise<Contribution | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title || null;
  if (input.contributionType !== undefined) patch.contribution_type = input.contributionType || null;
  if (input.explanation !== undefined) patch.explanation = input.explanation || null;
  if (input.research !== undefined) patch.research = input.research || null;
  if (input.observation !== undefined) patch.observation = input.observation || null;
  if (input.proposedDirection !== undefined) patch.proposed_direction = input.proposedDirection || null;
  if (input.prototypeUrl !== undefined) patch.prototype_url = input.prototypeUrl || null;
  if (input.figmaUrl !== undefined) patch.figma_url = input.figmaUrl || null;
  if (input.externalUrl !== undefined) patch.external_url = input.externalUrl || null;

  const { data, error } = await supabase.from("contributions").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToContribution(data as ContributionRow) : null;
}

/**
 * Updates the one DesignResponse linked to the caller's own contribution.
 * `discipline` is kept in sync with the Contribution's own `contributionType`
 * automatically by the API route, not accepted as free client input here,
 * so the two never drift apart.
 */
export async function updateOwnDesignResponse(
  contributionId: string,
  input: Partial<DesignResponseDraftInput>,
): Promise<DesignResponse | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.discipline !== undefined) patch.discipline = input.discipline;
  if (input.summary !== undefined) patch.summary = input.summary || null;
  if (input.researchFindings !== undefined) patch.research_findings = input.researchFindings || null;
  if (input.designDecisions !== undefined) patch.design_decisions = input.designDecisions || null;
  if (input.outcome !== undefined) patch.outcome = input.outcome || null;
  if (input.problemStatement !== undefined) patch.problem_statement = input.problemStatement || null;
  if (input.approach !== undefined) patch.approach = input.approach || null;
  if (input.toolsUsed !== undefined) patch.tools_used = input.toolsUsed || null;
  if (input.prototypeUrl !== undefined) patch.prototype_url = input.prototypeUrl || null;
  if (input.figmaUrl !== undefined) patch.figma_url = input.figmaUrl || null;
  if (input.caseStudyUrl !== undefined) patch.case_study_url = input.caseStudyUrl || null;
  if (input.externalUrl !== undefined) patch.external_url = input.externalUrl || null;

  const { data, error } = await supabase
    .from("design_responses")
    .update(patch)
    .eq("contribution_id", contributionId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToDesignResponse(data as DesignResponseRow) : null;
}

/**
 * [§9] The one submit action: draft -> submitted, on the Contribution and
 * its linked DesignResponse together — a single "I'm ready for review"
 * moment covers the whole package, not two separate submit steps. Both
 * updates are individually RLS-guarded exactly like every other hardcoded
 * transition in this app; if the DesignResponse update fails after the
 * Contribution one succeeded, the Contribution is reverted to draft so the
 * two never end up out of sync.
 */
export async function submitContribution(id: string): Promise<ContributionBundle | null> {
  const supabase = await createSupabaseServerClient();
  const { data: contribData, error: contribErr } = await supabase
    .from("contributions")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (contribErr) throw new Error(contribErr.message);
  if (!contribData) return null;

  const { data: drData, error: drErr } = await supabase
    .from("design_responses")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("contribution_id", id)
    .eq("status", "draft")
    .select("*")
    .maybeSingle();
  if (drErr || !drData) {
    await supabase.from("contributions").update({ status: "draft" }).eq("id", id).eq("status", "submitted");
    if (drErr) throw new Error(drErr.message);
    return null;
  }

  return { contribution: rowToContribution(contribData as ContributionRow), designResponse: rowToDesignResponse(drData as DesignResponseRow) };
}

/**
 * [Phase 6F §4/§6 — public rendering] Published DesignResponses attached
 * to one Signal, paired with their originating Contribution. Two plain
 * queries, not a PostgREST embedded join — matching this file's own
 * existing style (getOrCreateContribution() above already reads
 * contributions then design_responses as separate round-trips). RLS's
 * `contributions_select`/`design_responses_select` policies already scope
 * `status = 'approved'`/`'published'` as anon-readable (migration 0012);
 * the explicit filters below are the same belt-and-suspenders convention
 * every function in this file already follows.
 */
export async function listPublishedResponsesForSignal(signalId: string): Promise<ContributionBundle[]> {
  const supabase = await createSupabaseServerClient();
  const { data: contribRows, error: contribErr } = await supabase
    .from("contributions")
    .select("*")
    .eq("thanks_signal_id", signalId)
    .eq("status", "approved");
  if (contribErr) throw new Error(contribErr.message);
  const contributions = (contribRows as ContributionRow[]).map(rowToContribution);
  if (contributions.length === 0) return [];

  const { data: drRows, error: drErr } = await supabase
    .from("design_responses")
    .select("*")
    .in(
      "contribution_id",
      contributions.map((c) => c.id),
    )
    .eq("status", "published");
  if (drErr) throw new Error(drErr.message);

  const drByContribId = new Map((drRows as DesignResponseRow[]).map((d) => [d.contribution_id, rowToDesignResponse(d)]));
  return contributions
    .filter((c) => drByContribId.has(c.id))
    .map((c) => ({ contribution: c, designResponse: drByContribId.get(c.id)! }));
}

/**
 * [Phase 6F §6 — public /responses/[id]] One published DesignResponse by
 * id, with its parent Contribution — the public case-study page's data
 * source. RLS's `design_responses_select` policy already requires
 * `status = 'published'` for an anon/unrelated reader; the explicit filter
 * is the same belt-and-suspenders pattern as every other public read here.
 */
export async function getPublishedDesignResponse(id: string): Promise<ContributionBundle | null> {
  const supabase = await createSupabaseServerClient();
  const { data: drRow, error: drErr } = await supabase
    .from("design_responses")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (drErr) throw new Error(drErr.message);
  if (!drRow) return null;
  const designResponse = rowToDesignResponse(drRow as DesignResponseRow);

  const { data: contribRow, error: contribErr } = await supabase
    .from("contributions")
    .select("*")
    .eq("id", designResponse.contributionId)
    .maybeSingle();
  if (contribErr) throw new Error(contribErr.message);
  if (!contribRow) return null;

  return { contribution: rowToContribution(contribRow as ContributionRow), designResponse };
}
