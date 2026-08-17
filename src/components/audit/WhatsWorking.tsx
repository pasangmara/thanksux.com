import type { AuditFinding } from "@/types/audit";

/** [UX Audit Engine — §21] Positive findings — every one still backed by real evidence, not a courtesy compliment. */
export function WhatsWorking({ findings }: { findings: AuditFinding[] }) {
  if (findings.length === 0) {
    return <p className="text-body text-text-secondary">No positive findings were recorded for this audit.</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {findings.map((finding) => (
        <li key={finding.id} className="flex items-start gap-2">
          <span className="text-live text-body" aria-hidden="true">
            ✓
          </span>
          <span className="text-body text-ink">{finding.title}</span>
        </li>
      ))}
    </ul>
  );
}
