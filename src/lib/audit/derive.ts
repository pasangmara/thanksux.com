import type { AuditFinding, AuditEffort, AuditImpact, AuditSeverity } from "@/types/audit";

/**
 * [UX Audit Engine — report derivation] Every list on the report page
 * (priorities, quick wins, roadmap, what's working) is computed from the
 * same persisted `findings` array, never stored separately — one source of
 * truth, no risk of the derived lists drifting from the findings that
 * justify them.
 */

const SEVERITY_WEIGHT: Record<AuditSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1, good: 0 };
const IMPACT_WEIGHT: Record<AuditImpact, number> = { high: 3, medium: 2, low: 1 };
const EFFORT_WEIGHT: Record<AuditEffort, number> = { low: 1, medium: 2, high: 3 };

function priorityScore(f: AuditFinding): number {
  return (SEVERITY_WEIGHT[f.severity] * IMPACT_WEIGHT[f.impact]) / EFFORT_WEIGHT[f.effort];
}

/** "Fix these first" — ranked by severity × impact, favoring low effort, worst problems only (never "good" findings). */
export function topPriorities(findings: AuditFinding[], limit = 5): AuditFinding[] {
  return findings
    .filter((f) => f.severity !== "good")
    .slice()
    .sort((a, b) => priorityScore(b) - priorityScore(a))
    .slice(0, limit);
}

/** High impact, low effort — the fixes with the best return for the least work. */
export function quickWins(findings: AuditFinding[]): AuditFinding[] {
  return findings.filter((f) => f.severity !== "good" && f.impact === "high" && f.effort === "low");
}

export function topProblems(findings: AuditFinding[], limit = 5): AuditFinding[] {
  return findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice()
    .sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity])
    .slice(0, limit);
}

export function whatsWorking(findings: AuditFinding[]): AuditFinding[] {
  return findings.filter((f) => f.severity === "good");
}

export interface Roadmap {
  today: AuditFinding[];
  thisWeek: AuditFinding[];
  later: AuditFinding[];
}

/**
 * TODAY: critical/high severity with low/medium effort — worth fixing
 * immediately because it's both urgent and cheap.
 * THIS WEEK: everything else that's medium severity, or high-severity but
 * high-effort (still urgent, just needs more planning).
 * LATER: low-severity polish.
 */
export function buildRoadmap(findings: AuditFinding[]): Roadmap {
  const problems = findings.filter((f) => f.severity !== "good");
  const today: AuditFinding[] = [];
  const thisWeek: AuditFinding[] = [];
  const later: AuditFinding[] = [];

  for (const finding of problems) {
    if ((finding.severity === "critical" || finding.severity === "high") && finding.effort !== "high") {
      today.push(finding);
    } else if (finding.severity === "low") {
      later.push(finding);
    } else {
      thisWeek.push(finding);
    }
  }

  return { today, thisWeek, later };
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/** Counts of actual problems by severity — "good" findings are strengths, not problems, so they're excluded here (see whatsWorking() for those). */
export function severityCounts(findings: AuditFinding[]): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const f of findings) {
    if (f.severity === "good") continue;
    counts[f.severity]++;
  }
  return counts;
}

/** Coarse, deterministic label from the numeric score alone — never a second opinion on top of the score, just a human-readable band for it. */
export function scoreStatusLabel(score: number | null): string {
  if (score === null) return "Not enough evidence";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Improvement";
  return "Poor";
}

/** Best-effort display label for the audited input — the bare hostname for a URL, or a fixed label for a screenshot. Falls back to the raw URL if it fails to parse (never throws). */
export function inputDisplayLabel(inputType: "url" | "screenshot", inputUrl: string | null): string {
  if (inputType !== "url" || !inputUrl) return "Uploaded screenshot";
  try {
    return new URL(inputUrl).hostname.replace(/^www\./, "");
  } catch {
    return inputUrl;
  }
}

/** Stable anchor id for a category — shared between the category-health nav (link target) and the findings list (link source), so both always agree. */
export function categorySlug(category: string): string {
  return `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export function groupByCategory(findings: AuditFinding[]): Map<string, AuditFinding[]> {
  const map = new Map<string, AuditFinding[]>();
  for (const finding of findings) {
    const list = map.get(finding.category) ?? [];
    list.push(finding);
    map.set(finding.category, list);
  }
  return map;
}
