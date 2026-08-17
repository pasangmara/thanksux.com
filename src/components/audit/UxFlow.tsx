import type { AuditCategory, AuditFinding, CategoryScore } from "@/types/audit";

/**
 * [UX Audit Engine — §20] Entry → Understand → Explore → Decide → Act →
 * Confirm, populated only from real findings already tied to real
 * evidence — never a fabricated behavioral claim. "Confirm" (what happens
 * after a form submits or a purchase completes) is never observable from
 * a static HTML fetch or a single screenshot, so it always reads "Needs
 * manual verification," honestly, rather than being guessed at.
 */
const STAGE_MAP: { stage: string; categories: AuditCategory[] }[] = [
  { stage: "Entry", categories: ["SEO / Discoverability", "Responsive"] },
  { stage: "Understand", categories: ["Information Architecture", "Content"] },
  { stage: "Explore", categories: ["Navigation"] },
  { stage: "Decide", categories: ["CTA / Conversion", "Visual Design"] },
  { stage: "Act", categories: ["Forms"] },
];

export function UxFlow({ findings, categoryScores }: { findings: AuditFinding[]; categoryScores: CategoryScore[] }) {
  const evidenceByCategory = new Map(categoryScores.map((c) => [c.category, c.evidenceLevel]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-label text-text-tertiary">
        {[...STAGE_MAP.map((s) => s.stage), "Confirm"].map((stage, i, arr) => (
          <span key={stage} className="flex items-center gap-2">
            <span className="text-ink">{stage}</span>
            {i < arr.length - 1 ? <span aria-hidden="true">→</span> : null}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
        {STAGE_MAP.map(({ stage, categories }) => {
          const hasEvidence = categories.some((c) => evidenceByCategory.get(c) === "sufficient");
          const friction = findings.filter((f) => categories.includes(f.category) && f.severity !== "good");
          return (
            <div key={stage} className="rounded-md border border-border bg-surface p-4">
              <p className="text-caption font-medium text-ink">{stage}</p>
              {!hasEvidence ? (
                <p className="text-body mt-2 text-text-tertiary">Not enough evidence for this stage.</p>
              ) : friction.length === 0 ? (
                <p className="text-body mt-2 text-text-secondary">No friction observed in this area.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-1.5">
                  {friction.map((f) => (
                    <li key={f.id} className="text-body text-text-secondary">
                      <span className="text-caption font-medium text-ink">Potential friction:</span> {f.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-caption font-medium text-ink">Confirm</p>
          <p className="text-body mt-2 text-text-secondary">
            Needs manual verification — what happens after a form submits or a purchase completes can&rsquo;t be observed
            from a static page fetch or a single screenshot.
          </p>
        </div>
      </div>
    </div>
  );
}
