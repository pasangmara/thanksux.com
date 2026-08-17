import type { AuditEffort, AuditImpact, AuditSeverity } from "@/types/audit";

/**
 * [UX Audit Engine] Same tone-badge pattern already established in
 * src/app/admin/leads/page.tsx (status/follow-up pills) — reused here
 * rather than inventing a second badge style. This project's color tokens
 * are deliberately restrained (docs/DESIGN_SYSTEM.md — no semantic red/
 * yellow/green palette beyond `color-error` and one narrowly-scoped
 * `color-live`), so severity is differentiated mostly by border/fill
 * weight and label text, matching how every other status pill here works.
 */

const SEVERITY_LABEL: Record<AuditSeverity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  good: "Good",
};

const SEVERITY_TONE: Record<AuditSeverity, string> = {
  critical: "border-ink bg-ink text-on-ink",
  high: "border-error text-error",
  medium: "border-accent text-accent",
  low: "border-border text-text-tertiary",
  good: "border-live text-live",
};

export function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-sm border px-2 py-0.5 text-caption font-medium ${SEVERITY_TONE[severity]}`}>
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

const TAG_TONE: Record<"high" | "medium" | "low", string> = {
  high: "border-ink text-ink",
  medium: "border-accent text-accent",
  low: "border-border text-text-tertiary",
};

export function ImpactEffortTag({ impact, effort }: { impact: AuditImpact; effort: AuditEffort }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-caption ${TAG_TONE[impact]}`}>
        {impact.toUpperCase()} IMPACT
      </span>
      <span className="text-caption text-text-tertiary">·</span>
      <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-caption ${TAG_TONE[effort]}`}>
        {effort.toUpperCase()} EFFORT
      </span>
    </span>
  );
}
