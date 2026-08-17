"use client";

import { useState } from "react";
import type { AuditFinding } from "@/types/audit";
import { guideSectionsFor } from "@/content/auditDesignGuide";
import { SeverityBadge, ImpactEffortTag } from "./SeverityBadge";
import { ConfidenceLine, StatusPill, findingStatus } from "./ConfidenceBadge";

/** [UX Audit Engine — §14] Collapsed: severity/category/title. Expanded: evidence, problem, why it matters, recommendation, impact/effort, and an optional "Show Design Guidance" panel scoped to the finding's category. */
export function FindingCard({ finding }: { finding: AuditFinding }) {
  const [open, setOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideSections = guideSectionsFor(finding.category);

  return (
    <div className="rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <span className="text-label text-text-tertiary">{finding.category}</span>
            <StatusPill status={findingStatus(finding)} />
          </div>
          <p className="text-body font-medium text-ink">{finding.title}</p>
        </div>
        <span className="mt-1 shrink-0 text-body text-text-tertiary" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-4 border-t border-border p-4">
          {finding.evidence ? (
            <div>
              <p className="text-caption font-medium text-ink">Evidence</p>
              <p className="text-body mt-1 text-text-secondary">{finding.evidence}</p>
            </div>
          ) : null}
          {finding.problem ? (
            <div>
              <p className="text-caption font-medium text-ink">Problem</p>
              <p className="text-body mt-1 text-text-secondary">{finding.problem}</p>
            </div>
          ) : null}
          <div>
            <p className="text-caption font-medium text-ink">Why it matters</p>
            <p className="text-body mt-1 text-text-secondary">{finding.whyItMatters}</p>
          </div>
          <div>
            <p className="text-caption font-medium text-ink">Recommendation</p>
            <p className="text-body mt-1 text-text-secondary">{finding.recommendation}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {finding.severity !== "good" ? <ImpactEffortTag impact={finding.impact} effort={finding.effort} /> : null}
            <ConfidenceLine confidence={finding.confidence} />
          </div>

          {guideSections.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setGuideOpen((v) => !v)}
                className="text-caption font-medium text-ink underline hover:text-accent"
              >
                {guideOpen ? "Hide Design Guidance" : "Show Design Guidance"}
              </button>
              {guideOpen ? (
                <div className="mt-3 flex flex-col gap-4 rounded-md border border-border bg-background-alt p-4">
                  {guideSections.map((section) => (
                    <div key={section.topic}>
                      <p className="text-label">{section.title}</p>
                      <p className="text-body mt-1 text-ink">{section.principle}</p>
                      <p className="text-caption mt-2 font-medium text-ink">Guidance</p>
                      <ul className="mt-1 list-disc pl-5 text-body text-text-secondary">
                        {section.howToImprove.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                      {section.startingGuidance ? (
                        <p className="text-caption mt-2 text-text-tertiary">{section.startingGuidance}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
