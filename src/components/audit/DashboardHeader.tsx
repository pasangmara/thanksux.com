import type { Audit } from "@/types/audit";
import { inputDisplayLabel, scoreStatusLabel, severityCounts } from "@/lib/audit/derive";
import { OverallScore } from "./ScoreOverview";
import { ConfidenceLine } from "./ConfidenceBadge";

const AUDIT_TYPE_LABEL: Record<string, string> = { ux: "UX Audit", web: "Web Audit", design: "Design Audit" };

const SEVERITY_ROWS: { key: "critical" | "high" | "medium" | "low"; label: string }[] = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

/**
 * [UX Audit Engine — dashboard] The compact diagnostic-product header this
 * report opens with: what/when, the score + its plain-language band, how
 * much of the audit surface actually had evidence (confidence + coverage
 * — never hidden, see ConfidenceBadge.tsx), and the severity breakdown a
 * reader needs before they've scrolled at all. Replaces the old
 * long-document hero that only showed the score.
 */
export function DashboardHeader({ audit }: { audit: Audit }) {
  const counts = severityCounts(audit.findings);
  const label = inputDisplayLabel(audit.inputType, audit.inputUrl);

  return (
    <div className="glass-surface rounded-lg p-6 tablet:p-8">
      <div className="flex flex-col gap-6 tablet:flex-row tablet:items-start tablet:justify-between">
        <div>
          <p className="text-label text-text-tertiary">{AUDIT_TYPE_LABEL[audit.auditType] ?? "UX Audit"}</p>
          <h1 className="text-h1 mt-2">
            {audit.inputType === "url" && audit.inputUrl ? (
              <a href={audit.inputUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
                {label}
              </a>
            ) : (
              label
            )}
          </h1>
          <p className="text-caption mt-1 text-text-tertiary">{new Date(audit.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-1 tablet:items-end tablet:text-right">
          <OverallScore score={audit.overallScore} />
          {audit.overallScore !== null ? <p className="text-body-lg text-text-secondary">{scoreStatusLabel(audit.overallScore)}</p> : null}
          <div className="mt-2 flex flex-col gap-0.5 tablet:items-end">
            <ConfidenceLine confidence={audit.confidence} />
            <span className="text-caption text-text-tertiary">Evidence coverage: {audit.evidenceCoveragePercent}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 tablet:grid-cols-4">
        {SEVERITY_ROWS.map((row) => (
          <div key={row.key}>
            <p className="text-h3">{counts[row.key]}</p>
            <p className="text-caption text-text-tertiary">{row.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-caption text-text-tertiary">
          Evidence coverage describes how much of the audit surface had enough evidence to score — it is not a measure
          of how good or bad the website is.
        </p>
        {audit.confidence !== "high" ? (
          <p className="text-caption mt-1.5 font-medium text-accent">
            Interpret with caution — several audit categories could not be scored from the available evidence. See
            Audit Limitations below.
          </p>
        ) : null}
      </div>
    </div>
  );
}
