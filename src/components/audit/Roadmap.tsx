import type { Roadmap as RoadmapData } from "@/lib/audit/derive";

const COLUMNS: { key: keyof RoadmapData; label: string }[] = [
  { key: "today", label: "TODAY" },
  { key: "thisWeek", label: "THIS WEEK" },
  { key: "later", label: "LATER" },
];

/** [UX Audit Engine — §23] Deterministic bucketing by severity + effort — see derive.ts's buildRoadmap(). */
export function Roadmap({ roadmap }: { roadmap: RoadmapData }) {
  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = roadmap[col.key];
        return (
          <div key={col.key} className="rounded-md border border-border bg-surface p-4">
            <p className="text-label">{col.label}</p>
            {items.length === 0 ? (
              <p className="text-body mt-3 text-text-tertiary">Nothing here.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {items.map((finding) => (
                  <li key={finding.id} className="text-body text-ink">
                    {finding.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
