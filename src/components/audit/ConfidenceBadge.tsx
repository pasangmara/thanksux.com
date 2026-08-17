import type { AuditConfidence, AuditVerificationStatus } from "@/types/audit";

/**
 * [UX Audit Engine — trustworthiness] Every finding/category/audit carries
 * these two, always rendered together: verification status says whether
 * the underlying evidence is a direct fact, an inference from one, or
 * absent; confidence says how much to trust the resulting claim. Neither
 * is ever hidden when it's low — a quiet "Confidence: Low" is the entire
 * point of this system (unknown must not read as failure).
 */

const CONFIDENCE_LABEL: Record<AuditConfidence, string> = { high: "High", medium: "Medium", low: "Low" };

export function ConfidenceLine({ confidence }: { confidence: AuditConfidence }) {
  return <span className="text-caption text-text-tertiary">Confidence: {CONFIDENCE_LABEL[confidence]}</span>;
}

/**
 * [UX Audit Engine — status visual language] The four states a reader
 * needs to scan in a second, restrained to this project's existing
 * palette (same border/text tones SeverityBadge already uses — no new
 * colors invented): a directly-observed, high-confidence fact reads
 * "Verified" (live/green); an inference or a lower-confidence read is
 * "Limited evidence" (accent/amber); genuinely absent evidence is
 * "Not verified" (neutral); a category excluded from scoring entirely is
 * "Excluded" (neutral, dash glyph — visually distinct from "Not verified"
 * only by icon/label, deliberately, since both are neutral-toned: neither
 * is a failure).
 */
export type LimitationStatus = "verified" | "limited" | "not_verified" | "excluded";

const STATUS_CONFIG: Record<LimitationStatus, { icon: string; label: string; tone: string }> = {
  verified: { icon: "✓", label: "Verified", tone: "border-live text-live" },
  limited: { icon: "!", label: "Limited evidence", tone: "border-accent text-accent" },
  not_verified: { icon: "?", label: "Not verified", tone: "border-border text-text-tertiary" },
  excluded: { icon: "—", label: "Excluded", tone: "border-border text-text-tertiary" },
};

export function StatusPill({ status }: { status: LimitationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2 py-0.5 text-caption font-medium ${cfg.tone}`}>
      <span aria-hidden="true">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

/** Icon-only variant — same tones as StatusPill, for tight spaces (compact category-nav rows) where a bordered label pill would crowd the layout. The label still reaches assistive tech via `title`/`aria-label`. */
export function StatusGlyph({ status }: { status: LimitationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-caption font-medium ${cfg.tone.replace(/border-\S+/, "")}`} aria-label={cfg.label} title={cfg.label}>
      {cfg.icon}
    </span>
  );
}

/**
 * Collapses a finding's two independent trust signals (how it was found,
 * how sure the engine is) into the single scannable status above.
 * `not_verified` always wins (no evidence at all outranks a weak read);
 * otherwise anything short of a directly-observed, high-confidence fact
 * is "limited," never silently upgraded to "verified."
 */
export function findingStatus(finding: { verificationStatus: AuditVerificationStatus; confidence: AuditConfidence }): LimitationStatus {
  if (finding.verificationStatus === "not_verified") return "not_verified";
  if (finding.verificationStatus === "inferred" || finding.confidence !== "high") return "limited";
  return "verified";
}

/** Standing disclaimer for categories no rule can currently give visual evidence for (Visual Design/Typography/Color/Spacing) — see rules.ts's header comment on HTML-only evidence. */
export function VisualVerificationUnavailable() {
  return <p className="text-body text-text-tertiary">Visual verification unavailable.</p>;
}
