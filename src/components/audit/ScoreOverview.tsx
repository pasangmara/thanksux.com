import type { CategoryScore } from "@/types/audit";
import { categorySlug } from "@/lib/audit/derive";
import { ConfidenceLine, StatusGlyph, StatusPill, VisualVerificationUnavailable } from "./ConfidenceBadge";

/** A scored category is "verified" for this purpose (real findings exist); an unscored one is "excluded" — distinct from a finding's own verified/limited/not_verified language, but the same restrained visual vocabulary (see ConfidenceBadge.tsx). */
function categoryStatus(score: number | null): "verified" | "excluded" {
  return score === null ? "excluded" : "verified";
}

/**
 * [UX Audit Engine] Renders exactly what scoring.ts computed — a category
 * with `score: null` always renders "Not enough evidence," never a
 * fabricated number (§8's explicit requirement).
 */
function scoreTone(score: number): string {
  if (score >= 80) return "text-ink";
  if (score >= 60) return "text-accent";
  return "text-error";
}

function barTone(score: number): string {
  if (score >= 80) return "bg-ink";
  if (score >= 60) return "bg-accent";
  return "bg-error";
}

/** No rule (website or screenshot) currently produces real visual evidence for these — see rules.ts's header comment — so "insufficient evidence" here specifically means visual rendering was never available, not that the audit merely didn't get around to it. */
const VISUAL_ONLY_CATEGORIES = new Set(["Visual Design", "Typography", "Color", "Spacing"]);

export function OverallScore({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div>
        <p className="text-h2 mt-2 text-text-tertiary">Not enough evidence</p>
        <p className="text-caption mt-1 text-text-secondary">
          None of this audit&rsquo;s rules found enough evidence to score — see the findings below for what was checked.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-display ${scoreTone(score)}`}>{score}</span>
      <span className="text-body-lg text-text-secondary">/ 100</span>
    </div>
  );
}

/**
 * Compact bar list — doubles as the report's category navigation: each row
 * is an anchor to that category's findings (see categorySlug()/derive.ts),
 * shared by the sticky sidebar (desktop) and the in-flow section (tablet/
 * mobile) so there is exactly one implementation of "category health,"
 * never two views that could drift apart.
 */
export function CategoryHealth({ categoryScores }: { categoryScores: CategoryScore[] }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {categoryScores.map((c) => (
        <li key={c.category}>
          <a href={`#${categorySlug(c.category)}`} className="flex flex-col gap-1 rounded-sm px-2 py-2 hover:bg-background-alt">
            <span className="flex items-center justify-between gap-2">
              <span className="text-caption font-medium leading-snug text-ink">{c.category}</span>
              <StatusGlyph status={categoryStatus(c.score)} />
            </span>
            {c.score === null ? (
              VISUAL_ONLY_CATEGORIES.has(c.category) ? (
                <span className="text-caption text-text-tertiary">Visual unavailable</span>
              ) : (
                <span className="text-caption text-text-tertiary">No evidence</span>
              )
            ) : (
              <span className="flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-sm bg-background-alt">
                  <span className={`block h-full ${barTone(c.score)}`} style={{ width: `${c.score}%` }} />
                </span>
                <span className={`w-7 shrink-0 text-right text-caption font-medium ${scoreTone(c.score)}`}>{c.score}</span>
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Full detail view of the same data as CategoryHealth — used in the main content column (not the nav), one card per category with finding count + confidence + the id CategoryHealth's links point at. */
export function CategoryHealthDetail({ categoryScores }: { categoryScores: CategoryScore[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
      {categoryScores.map((c) => (
        <div key={c.category} className="rounded-md border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-caption font-medium text-ink">{c.category}</p>
            <span className="flex items-center gap-2">
              {c.score !== null ? <span className={`text-h3 ${scoreTone(c.score)}`}>{c.score}</span> : null}
              <StatusPill status={categoryStatus(c.score)} />
            </span>
          </div>
          {c.score === null ? (
            VISUAL_ONLY_CATEGORIES.has(c.category) ? (
              <VisualVerificationUnavailable />
            ) : (
              <p className="text-body mt-1 text-text-tertiary">Not enough evidence to score this category.</p>
            )
          ) : (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-caption text-text-tertiary">
                {c.findingCount} finding{c.findingCount === 1 ? "" : "s"}
              </p>
              {c.confidence ? <ConfidenceLine confidence={c.confidence} /> : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
