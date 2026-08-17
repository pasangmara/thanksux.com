"use client";

import { useState } from "react";
import { DESIGN_GUIDE } from "@/content/auditDesignGuide";

/** [UX Audit Engine — §24] Persistent, always-rendered reference — not generated per-audit. Each topic is collapsible so the full guide doesn't dominate the page by default. */
export function DesignGuideSection() {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      {DESIGN_GUIDE.map((section) => {
        const open = openTopic === section.topic;
        return (
          <div key={section.topic} className="rounded-md border border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpenTopic(open ? null : section.topic)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <span className="text-body font-medium text-ink">{section.title}</span>
              <span className="text-body text-text-tertiary" aria-hidden="true">
                {open ? "−" : "+"}
              </span>
            </button>
            {open ? (
              <div className="flex flex-col gap-4 border-t border-border p-4">
                <div>
                  <p className="text-caption font-medium text-ink">Principle</p>
                  <p className="text-body mt-1 text-text-secondary">{section.principle}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-ink">What to check</p>
                  <ul className="mt-1 list-disc pl-5 text-body text-text-secondary">
                    {section.whatToCheck.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-caption font-medium text-ink">Common mistake</p>
                  <p className="text-body mt-1 text-text-secondary">{section.commonMistake}</p>
                </div>
                <div>
                  <p className="text-caption font-medium text-ink">How to improve</p>
                  <ul className="mt-1 list-disc pl-5 text-body text-text-secondary">
                    {section.howToImprove.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                {section.startingGuidance ? (
                  <div>
                    <p className="text-caption font-medium text-ink">Starting guidance</p>
                    <p className="text-body mt-1 text-text-secondary">{section.startingGuidance}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
