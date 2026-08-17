import type { AuditFinding } from "@/types/audit";
import { ImpactEffortTag } from "./SeverityBadge";

/** [UX Audit Engine — §13] "Fix these first," ranked by severity × impact ÷ effort — see derive.ts's topPriorities(). */
export function TopPriorities({ findings }: { findings: AuditFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {findings.map((finding, i) => (
        <div key={finding.id} className="flex gap-4 rounded-md border border-border bg-surface p-4">
          <span className="text-h3 shrink-0 text-text-tertiary">{String(i + 1).padStart(2, "0")}</span>
          <div className="flex flex-col gap-1.5">
            <p className="text-body font-medium text-ink">{finding.title}</p>
            <ImpactEffortTag impact={finding.impact} effort={finding.effort} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** [UX Audit Engine — §22] High impact, low effort — surfaced prominently. */
export function QuickWins({ findings }: { findings: AuditFinding[] }) {
  if (findings.length === 0) {
    return <p className="text-body text-text-secondary">No high-impact, low-effort fixes were found in this audit.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((finding) => (
        <li key={finding.id} className="flex items-start gap-2 rounded-md border border-border bg-surface p-3">
          <span className="text-body text-ink" aria-hidden="true">
            →
          </span>
          <span className="text-body text-ink">{finding.title}</span>
        </li>
      ))}
    </ul>
  );
}
