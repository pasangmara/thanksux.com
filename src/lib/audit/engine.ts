import type { AuditConfidence, AuditType, CategoryScore } from "@/types/audit";
import { evaluateScreenshotRules, evaluateWebsiteRules, type RuleFinding } from "./rules";
import { computeScores } from "./scoring";
import type { WebsiteEvidence } from "./extractWebsiteSignals";
import type { ScreenshotEvidence } from "./extractScreenshotSignals";

export interface EngineResult {
  findings: RuleFinding[];
  categoryScores: CategoryScore[];
  overallScore: number | null;
  evidenceCoveragePercent: number;
  confidence: AuditConfidence;
}

/** Runs the deterministic rule set for a URL/HTML audit and scores the result. Pure function of its input — no I/O, no randomness. */
export function runWebsiteAudit(evidence: WebsiteEvidence, auditType: AuditType): EngineResult {
  const findings = evaluateWebsiteRules(evidence);
  const { categoryScores, overallScore, evidenceCoveragePercent, confidence } = computeScores(findings, auditType);
  return { findings, categoryScores, overallScore, evidenceCoveragePercent, confidence };
}

/** Runs the (deliberately small — see extractScreenshotSignals.ts) rule set for a screenshot audit. */
export function runScreenshotAudit(evidence: ScreenshotEvidence, auditType: AuditType): EngineResult {
  const findings = evaluateScreenshotRules(evidence);
  const { categoryScores, overallScore, evidenceCoveragePercent, confidence } = computeScores(findings, auditType);
  return { findings, categoryScores, overallScore, evidenceCoveragePercent, confidence };
}
