"use client";

import { useMemo, useState } from "react";
import type { AuditFinding, AuditSeverity } from "@/types/audit";
import { categorySlug, groupByCategory } from "@/lib/audit/derive";
import { FindingCard } from "./FindingCard";

type Filter = "all" | Exclude<AuditSeverity, "good">;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

/**
 * [UX Audit Engine — dashboard] Severity filter + category-grouped finding
 * list, replacing the old always-everything "Full report" wall. "good"
 * findings are excluded here (they live in the What's Working section) —
 * this view is specifically about problems that need attention. Section
 * ids match categorySlug() exactly, so CategoryHealth's sidebar links land
 * here directly.
 */
export function FindingsExplorer({ findings }: { findings: AuditFinding[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const problems = useMemo(() => findings.filter((f) => f.severity !== "good"), [findings]);
  const filtered = useMemo(() => (filter === "all" ? problems : problems.filter((f) => f.severity === filter)), [problems, filter]);
  const byCategory = useMemo(() => groupByCategory(filtered), [filtered]);

  const filterCount = (key: Filter) => (key === "all" ? problems.length : problems.filter((f) => f.severity === key).length);

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Filter findings by severity" className="flex flex-wrap gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`text-label inline-flex h-[36px] shrink-0 items-center gap-1.5 rounded-sm border px-3 transition-colors duration-150 ease-out ${
              filter === f.key ? "border-ink bg-ink text-on-ink" : "border-border text-text-secondary hover:border-ink hover:text-ink"
            }`}
          >
            {f.label}
            <span className={filter === f.key ? "text-on-ink" : "text-text-tertiary"}>{filterCount(f.key)}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-body text-text-secondary">No {filter === "all" ? "" : `${filter}-severity `}findings in this audit.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {[...byCategory.entries()].map(([category, categoryFindings]) => (
            <div key={category} id={categorySlug(category)} className="scroll-mt-24">
              <p className="text-caption font-medium text-text-secondary">{category}</p>
              <div className="mt-3 flex flex-col gap-3">
                {categoryFindings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
