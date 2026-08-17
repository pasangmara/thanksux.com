import { supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";
import { resolveMediaUrls } from "@/lib/community/publicMedia";
import type {
  Audit,
  AuditCreateInput,
  AuditFinding,
  AuditStatus,
  CategoryScore,
} from "@/types/audit";
import type { RuleFinding } from "./rules";

/**
 * [UX Audit Engine — repository] Uses the service-role client
 * (src/lib/supabase/rest.ts), same as every CMS/media repository in this
 * project — NOT the RLS-bound client thanksSignalsRepository.ts uses.
 * Deliberate, not an inconsistency: the audit's rule engine runs entirely
 * server-side inside a single trusted API route (never client-submitted
 * content, unlike a Signal's title/description), so the API route itself
 * — which validates input, rate-limits, and derives `user_id` from the
 * real session before ever calling this module — is the trust boundary,
 * exactly like `siteContentRepository.ts`/`projectsRepository.ts`.
 *
 * There's also a real RLS mechanics reason this couldn't use the
 * RLS-bound client even if it wanted to: `audit_findings_insert_own`'s
 * WITH CHECK does `exists (select 1 from audits a where ... a.user_id =
 * auth.uid() or a.user_id is null)` — but that subquery against `audits`
 * is itself filtered by `audits`' own `audits_select_own` policy
 * (`user_id = auth.uid()`) when run as the anon-key session role. For an
 * anonymous audit, `user_id is null` and `auth.uid()` is also null, and
 * `null = null` is not true in SQL — so the row is invisible to the
 * subquery regardless of the `or a.user_id is null` clause, and the
 * finding insert would be silently rejected. Service-role bypasses RLS
 * entirely, sidestepping this correctly rather than working around it.
 *
 * Reads enforce ownership in application code instead (getAuditById below)
 * — replicating exactly what `audits_select_own` documents as the intended
 * model (migration 0022's header comment): an owned audit is visible only
 * to its owner; an anonymous audit (user_id null) is visible to anyone who
 * has its unguessable id, since there is no owner to restrict it to.
 */

interface AuditRow {
  id: string;
  user_id: string | null;
  audit_type: Audit["auditType"];
  input_type: Audit["inputType"];
  input_url: string | null;
  input_media_asset_id: string | null;
  status: AuditStatus;
  error_message: string | null;
  overall_score: number | null;
  evidence_coverage_percent: number;
  confidence: Audit["confidence"];
  category_scores: CategoryScore[];
  evidence: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

interface FindingRow {
  id: string;
  audit_id: string;
  category: AuditFinding["category"];
  severity: AuditFinding["severity"];
  title: string;
  evidence: string;
  problem: string;
  why_it_matters: string;
  recommendation: string;
  impact: AuditFinding["impact"];
  effort: AuditFinding["effort"];
  order: number;
  verification_status: AuditFinding["verificationStatus"];
  confidence: AuditFinding["confidence"];
}

function findingRowToFinding(row: FindingRow): AuditFinding {
  return {
    id: row.id,
    category: row.category,
    severity: row.severity,
    title: row.title,
    evidence: row.evidence,
    problem: row.problem,
    whyItMatters: row.why_it_matters,
    recommendation: row.recommendation,
    impact: row.impact,
    effort: row.effort,
    order: row.order,
    verificationStatus: row.verification_status,
    confidence: row.confidence,
  };
}

async function auditRowToAudit(row: AuditRow, findings: FindingRow[]): Promise<Audit> {
  let screenshotUrl: string | null = null;
  if (row.input_media_asset_id) {
    const map = await resolveMediaUrls([row.input_media_asset_id]);
    screenshotUrl = map.get(row.input_media_asset_id)?.url ?? null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    auditType: row.audit_type,
    inputType: row.input_type,
    inputUrl: row.input_url,
    screenshotUrl,
    status: row.status,
    errorMessage: row.error_message,
    overallScore: row.overall_score,
    evidenceCoveragePercent: row.evidence_coverage_percent ?? 0,
    confidence: row.confidence ?? "low",
    categoryScores: row.category_scores ?? [],
    findings: findings.map(findingRowToFinding).sort((a, b) => a.order - b.order),
    evidence: row.evidence ?? {},
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

/** Creates a new audit row in 'pending' status. `userId` is null for an anonymous visitor — never accepted as client input, always derived server-side from the real session before this is called. */
export async function createAudit(input: AuditCreateInput, userId: string | null, inputMediaAssetId: string | null): Promise<Audit> {
  const [row] = await supabaseInsert<AuditRow[]>("audits", {
    user_id: userId,
    audit_type: input.auditType,
    input_type: input.inputType,
    input_url: input.url ?? null,
    input_media_asset_id: inputMediaAssetId,
    context: input.context ?? null,
    status: "pending",
    category_scores: [],
    evidence: {},
  });
  return auditRowToAudit(row, []);
}

export async function setAuditStatus(id: string, status: AuditStatus): Promise<void> {
  await supabaseUpdate("audits", `id=eq.${id}`, { status });
}

export async function failAudit(id: string, errorMessage: string): Promise<void> {
  await supabaseUpdate("audits", `id=eq.${id}`, {
    status: "failed",
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  });
}

/** Persists the engine's findings + scores and marks the audit completed — the one write that turns a pending audit into a real report. */
export async function completeAudit(
  id: string,
  params: {
    findings: RuleFinding[];
    categoryScores: CategoryScore[];
    overallScore: number | null;
    evidenceCoveragePercent: number;
    confidence: Audit["confidence"];
    evidence: Record<string, unknown>;
  },
): Promise<void> {
  if (params.findings.length > 0) {
    const rows = params.findings.map((finding, index) => ({
      audit_id: id,
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      evidence: finding.evidence,
      problem: finding.problem,
      why_it_matters: finding.whyItMatters,
      recommendation: finding.recommendation,
      impact: finding.impact,
      effort: finding.effort,
      order: index,
      verification_status: finding.verificationStatus,
      confidence: finding.confidence,
    }));
    await supabaseInsert("audit_findings", rows);
  }

  await supabaseUpdate("audits", `id=eq.${id}`, {
    status: "completed",
    overall_score: params.overallScore,
    evidence_coverage_percent: params.evidenceCoveragePercent,
    confidence: params.confidence,
    category_scores: params.categoryScores,
    evidence: params.evidence,
    completed_at: new Date().toISOString(),
  });
}

/**
 * Reads one audit by id, enforcing the ownership model described above:
 * an owned audit (`user_id` set) is only returned to that same user; an
 * anonymous audit (`user_id` null) is returned to anyone with the id —
 * its unguessable uuid is the access credential. Returns null for "doesn't
 * exist" and "exists but you're not authorized" alike, so this can never
 * be used to confirm a private audit's existence either.
 */
export async function getAuditById(id: string, requestingUserId: string | null): Promise<Audit | null> {
  const rows = await supabaseSelect<AuditRow[]>("audits", `select=*&id=eq.${id}&limit=1`);
  const row = rows[0];
  if (!row) return null;
  if (row.user_id && row.user_id !== requestingUserId) return null;

  const findingRows = await supabaseSelect<FindingRow[]>("audit_findings", `select=*&audit_id=eq.${id}&order=order.asc`);
  return auditRowToAudit(row, findingRows);
}
