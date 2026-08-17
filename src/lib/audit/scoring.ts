import type { AuditCategory, AuditConfidence, AuditSeverity, AuditType, CategoryScore } from "@/types/audit";
import type { RuleFinding } from "./rules";
import { categoryWeight } from "./rules";

/**
 * [UX Audit Engine — scoring] Fully deterministic: the same set of findings
 * always produces the same scores. No arbitrary numbers — every point
 * subtracted traces back to a real finding's severity (§8's explicit
 * requirement). A category with zero findings (nothing to praise, nothing
 * to flag) gets no score at all, ever — `evidenceLevel: "insufficient"`,
 * `score: null` — never a fabricated default like 100 or 50.
 */

export const ALL_CATEGORIES: AuditCategory[] = [
  "Usability",
  "Navigation",
  "Information Architecture",
  "Visual Design",
  "Typography",
  "Color",
  "Spacing",
  "Accessibility",
  "Content",
  "Forms",
  "CTA / Conversion",
  "Responsive",
  "Performance",
  "SEO / Discoverability",
];

const SEVERITY_DEDUCTION: Record<AuditSeverity, number> = {
  critical: 28,
  high: 16,
  medium: 8,
  low: 3,
  good: 0,
};

/**
 * "Usability" has no rules of its own — it's a genuine composite of how a
 * visitor actually experiences the page: can they navigate it, understand
 * its structure, use its forms, and act on its CTAs. Computed as the
 * average of whichever of these component categories have real evidence,
 * never invented when none of them do.
 */
const USABILITY_COMPONENTS: AuditCategory[] = ["Navigation", "Information Architecture", "Forms", "CTA / Conversion", "Content"];

const CONFIDENCE_RANK: Record<AuditConfidence, number> = { low: 0, medium: 1, high: 2 };

/** Weakest-link: a category is only as confident as its least-confident finding — never averaged up past a shaky one. */
function weakestConfidence(findings: RuleFinding[]): AuditConfidence {
  return findings.reduce<AuditConfidence>(
    (min, f) => (CONFIDENCE_RANK[f.confidence] < CONFIDENCE_RANK[min] ? f.confidence : min),
    "high",
  );
}

function scoreCategory(category: AuditCategory, findings: RuleFinding[]): CategoryScore {
  if (findings.length === 0) {
    return { category, score: null, evidenceLevel: "insufficient", findingCount: 0, confidence: null };
  }
  const deduction = findings.reduce((sum, finding) => sum + SEVERITY_DEDUCTION[finding.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - deduction));
  return { category, score, evidenceLevel: "sufficient", findingCount: findings.length, confidence: weakestConfidence(findings) };
}

export interface ScoringResult {
  categoryScores: CategoryScore[];
  overallScore: number | null;
  /** % of ALL_CATEGORIES (incl. Usability) that had enough evidence to score at all — the honest denominator is every category that *could* have been scored, not just the ones that were. */
  evidenceCoveragePercent: number;
  /**
   * Deterministic from coverage alone, not from how good the scores are —
   * confidence answers "how much of the site did we actually get to look
   * at," never "does the site look nice." Thresholds: >=65% high, >=35%
   * medium, else low. A site with 100% coverage and a low score is still
   * "high confidence" — the audit is confident that low score is real.
   */
  confidence: AuditConfidence;
}

export function computeScores(findings: RuleFinding[], auditType: AuditType): ScoringResult {
  const byCategory = new Map<AuditCategory, RuleFinding[]>();
  for (const category of ALL_CATEGORIES) byCategory.set(category, []);
  for (const finding of findings) {
    byCategory.get(finding.category)?.push(finding);
  }

  const categoryScores = ALL_CATEGORIES.filter((c) => c !== "Usability").map((category) =>
    scoreCategory(category, byCategory.get(category) ?? []),
  );

  const usabilityInputs = categoryScores.filter((c) => USABILITY_COMPONENTS.includes(c.category) && c.score !== null);
  const usabilityScore: CategoryScore =
    usabilityInputs.length > 0
      ? {
          category: "Usability",
          score: Math.round(usabilityInputs.reduce((sum, c) => sum + (c.score ?? 0), 0) / usabilityInputs.length),
          evidenceLevel: "sufficient",
          findingCount: usabilityInputs.reduce((sum, c) => sum + c.findingCount, 0),
          confidence: usabilityInputs.reduce<AuditConfidence>(
            (min, c) => (c.confidence && CONFIDENCE_RANK[c.confidence] < CONFIDENCE_RANK[min] ? c.confidence : min),
            "high",
          ),
        }
      : { category: "Usability", score: null, evidenceLevel: "insufficient", findingCount: 0, confidence: null };

  // Keep original category order, with Usability first (matches §8's example listing).
  const ordered = [usabilityScore, ...categoryScores];

  const scored = ordered.filter((c) => c.score !== null);
  const overallScore =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((sum, c) => sum + (c.score as number) * categoryWeight(auditType, c.category), 0) /
            scored.reduce((sum, c) => sum + categoryWeight(auditType, c.category), 0),
        );

  const evidenceCoveragePercent = Math.round((scored.length / ordered.length) * 100);
  const confidence: AuditConfidence = evidenceCoveragePercent >= 65 ? "high" : evidenceCoveragePercent >= 35 ? "medium" : "low";

  return { categoryScores: ordered, overallScore, evidenceCoveragePercent, confidence };
}
