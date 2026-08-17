"use client";

import { useState, type ReactNode } from "react";
import type { Audit } from "@/types/audit";
import { StatusPill, type LimitationStatus } from "./ConfidenceBadge";

const VISUAL_ONLY_CATEGORIES = new Set(["Visual Design", "Typography", "Color", "Spacing"]);

const NOT_VERIFIED_ITEMS = ["Form submission outcomes", "Post-purchase behavior", "Behavior at uncaptured breakpoints", "Content that only appears after client-side JavaScript runs"];

interface LimitationCardProps {
  id: string;
  title: string;
  status: LimitationStatus;
  summary: ReactNode;
  details: ReactNode;
  open: boolean;
  onToggle: () => void;
}

/** One scannable card: a status pill + compact summary up front, the fuller explanation behind "Show details" — see DesignGuideSection.tsx for the same collapsible pattern this reuses. */
function LimitationCard({ title, status, summary, details, open, onToggle }: LimitationCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label text-text-tertiary">{title}</p>
        <StatusPill status={status} />
      </div>
      <div>{summary}</div>
      <div>
        <button type="button" onClick={onToggle} aria-expanded={open} className="text-caption font-medium text-ink underline hover:text-accent">
          {open ? "Hide details" : "Show details"}
        </button>
        {open ? <div className="text-body mt-2 text-text-secondary">{details}</div> : null}
      </div>
    </div>
  );
}

/**
 * [UX Audit Engine — trustworthiness] Same underlying facts as before
 * (categoryScores' real evidenceLevel, audit.confidence/evidenceCoveragePercent)
 * — restructured from a scrolling wall of paragraphs into scannable
 * dashboard cards, each with a status pill and a collapsible "why." Never
 * hides a limitation entirely (§11): every card is always visible, only
 * its longer explanation is collapsed by default.
 */
export function AuditLimitations({ audit }: { audit: Audit }) {
  const [openCard, setOpenCard] = useState<string | null>(null);
  const toggle = (id: string) => setOpenCard((cur) => (cur === id ? null : id));

  const insufficient = audit.categoryScores.filter((c) => c.evidenceLevel === "insufficient");
  const visualUnavailable = insufficient.filter((c) => VISUAL_ONLY_CATEGORIES.has(c.category));
  const otherUnscored = insufficient.filter((c) => !VISUAL_ONLY_CATEGORIES.has(c.category));

  return (
    <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
      {visualUnavailable.length > 0 ? (
        <LimitationCard
          id="visual"
          title="Visual verification"
          status="not_verified"
          open={openCard === "visual"}
          onToggle={() => toggle("visual")}
          summary={
            <ul className="flex flex-wrap gap-1.5">
              {visualUnavailable.map((c) => (
                <li key={c.category} className="rounded-sm border border-border px-2 py-0.5 text-caption text-text-secondary">
                  {c.category}
                </li>
              ))}
            </ul>
          }
          details={
            <p>
              This audit reads the page&rsquo;s markup{audit.inputType === "screenshot" ? " and the uploaded screenshot’s file properties" : ""} — it does not
              render the page in a browser. No rule here can currently confirm spacing, hierarchy, color, or typography
              from markup alone, so these categories are never scored, and no visual claim is ever guessed at.
            </p>
          }
        />
      ) : null}

      <LimitationCard
        id="coverage"
        title="Evidence coverage"
        status={audit.evidenceCoveragePercent >= 65 ? "verified" : audit.evidenceCoveragePercent >= 35 ? "limited" : "not_verified"}
        open={openCard === "coverage"}
        onToggle={() => toggle("coverage")}
        summary={
          <div className="flex items-baseline gap-3">
            <span className="text-h2">{audit.evidenceCoveragePercent}%</span>
            <span className="text-caption text-text-tertiary">Confidence: {audit.confidence}</span>
          </div>
        }
        details={
          <p>
            {audit.evidenceCoveragePercent}% of this audit&rsquo;s category surface had enough evidence to score. This
            describes how much of the site could actually be checked — it is not a measure of how good or bad the
            site is, and unscored categories are excluded from the overall score entirely rather than assumed to
            pass.
          </p>
        }
      />

      {otherUnscored.length > 0 ? (
        <LimitationCard
          id="excluded"
          title="Excluded from score"
          status="excluded"
          open={openCard === "excluded"}
          onToggle={() => toggle("excluded")}
          summary={
            <ul className="flex flex-wrap gap-1.5">
              {otherUnscored.map((c) => (
                <li key={c.category} className="rounded-sm border border-border px-2 py-0.5 text-caption text-text-secondary">
                  {c.category}
                </li>
              ))}
            </ul>
          }
          details={<p>Not enough evidence was found to score these categories, so they were left out of the overall score entirely — never filled in with an assumed or default value.</p>}
        />
      ) : null}

      <LimitationCard
        id="not-verified"
        title="Not verified"
        status="not_verified"
        open={openCard === "not-verified"}
        onToggle={() => toggle("not-verified")}
        summary={
          <ul className="flex flex-col gap-1">
            {NOT_VERIFIED_ITEMS.map((item) => (
              <li key={item} className="text-body text-text-secondary">
                {item}
              </li>
            ))}
          </ul>
        }
        details={<p>None of these are observable from a static page fetch or a single screenshot — they would need a real browser session (or a manual walkthrough) to confirm, so this audit reports them as unverified rather than guessing.</p>}
      />
    </div>
  );
}
