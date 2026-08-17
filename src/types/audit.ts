/**
 * [UX Audit Engine] Client-facing shapes for the `audits`/`audit_findings`
 * tables (migration 0022_audits.sql — schema already exists, not created
 * here). One engine, three scopes (`AuditType`) — the scope only changes
 * which rule categories run and how they're weighted (see
 * src/lib/audit/engine.ts), never this shape.
 */

export type AuditType = "ux" | "web" | "design";
export type AuditInputType = "url" | "screenshot";
export type AuditStatus = "pending" | "fetching" | "analyzing" | "scoring" | "completed" | "failed";

export type AuditSeverity = "critical" | "high" | "medium" | "low" | "good";
export type AuditImpact = "high" | "medium" | "low";
export type AuditEffort = "high" | "medium" | "low";

/** How sure the engine is about a finding/category/audit — always derived from real signal (evidence directness, coverage), never a vibe. */
export type AuditConfidence = "high" | "medium" | "low";

/**
 * OBSERVED: read directly from markup/file (an attribute, a byte count) —
 * a fact, not a guess. INFERRED: a reasonable conclusion drawn from an
 * observed fact, but not the fact itself (e.g. "likely device" from image
 * width). NOT_VERIFIED: the engine has no evidence either way — absence of
 * evidence is never treated as failure (§7/§8 of the audit spec).
 */
export type AuditVerificationStatus = "observed" | "inferred" | "not_verified";

/**
 * Every category a rule can be filed under. Not every audit produces a
 * score for every category — only categories with actual evaluated
 * evidence get one (see CategoryScore.evidenceLevel below); the rest are
 * simply absent, never invented.
 */
export type AuditCategory =
  | "Usability"
  | "Navigation"
  | "Information Architecture"
  | "Visual Design"
  | "Typography"
  | "Color"
  | "Spacing"
  | "Accessibility"
  | "Content"
  | "Forms"
  | "CTA / Conversion"
  | "Responsive"
  | "Performance"
  | "SEO / Discoverability";

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  title: string;
  /** The concrete, observable fact this finding is based on — never a claim without a source. */
  evidence: string;
  problem: string;
  whyItMatters: string;
  recommendation: string;
  impact: AuditImpact;
  effort: AuditEffort;
  order: number;
  /** Is `evidence` a directly-read fact, a conclusion drawn from one, or absent entirely? */
  verificationStatus: AuditVerificationStatus;
  confidence: AuditConfidence;
}

/**
 * A category's score, or an explicit statement that scoring wasn't
 * possible. `evidenceLevel: "insufficient"` means no rule in this category
 * had enough evidence to evaluate at all — the UI must render "Not enough
 * evidence," never a fabricated number.
 */
export interface CategoryScore {
  category: AuditCategory;
  score: number | null;
  evidenceLevel: "sufficient" | "insufficient";
  findingCount: number;
  /** Weakest-link confidence across this category's findings; null when there's no score to be confident about. */
  confidence: AuditConfidence | null;
}

export interface Audit {
  id: string;
  userId: string | null;
  auditType: AuditType;
  inputType: AuditInputType;
  inputUrl: string | null;
  screenshotUrl: string | null;
  status: AuditStatus;
  errorMessage: string | null;
  overallScore: number | null;
  /** How much of the audit's category surface actually had enough evidence to score — see computeScores() in scoring.ts for the exact definition. Never inflated by treating unscored categories as passing. */
  evidenceCoveragePercent: number;
  /** Deterministic function of evidenceCoveragePercent — see scoring.ts. Never an LLM/engine "vibe" score. */
  confidence: AuditConfidence;
  categoryScores: CategoryScore[];
  findings: AuditFinding[];
  /** Raw, structured evidence the engine actually gathered — surfaced on the report so a claim can be traced back to its source (e.g. page title text, heading list, image alt-coverage ratio). */
  evidence: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

/** What a client may submit to create an audit. `context` is reserved for a future optional free-text field (schema already supports it) — not exposed in this phase's UI. */
export interface AuditCreateInput {
  auditType: AuditType;
  inputType: AuditInputType;
  url?: string;
  context?: string;
}
