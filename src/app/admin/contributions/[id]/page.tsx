"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSecondary, adminButtonSmall, SaveStatusMessage, Section, Spinner } from "@/components/admin/fields";
import { getContribution, moderateContribution, type AdminContributionDetail, type ContributionModerationAction } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

/**
 * [Phase 6E] Mirrors /admin/signals/[id] (Phase 6D) exactly: CONTENT vs
 * MODERATION separation, disabled-until-eligible action buttons, confirm()
 * on consequential actions, useSaveStatus for loading/success/error. Two
 * action groups instead of one, reflecting the real two-row reality: the
 * Contribution's own moderation (review/approve/reject/archive) and the
 * DesignResponse's publish step (only reachable once the Contribution is
 * approved) — see adminContributionsRepository.ts's header comment.
 */
const CONTRIB_PRECONDITIONS: Record<"review" | "approve" | "reject" | "archive", string[]> = {
  review: ["submitted"],
  approve: ["under_review"],
  reject: ["submitted", "under_review"],
  archive: ["approved"],
};

const CONFIRM_COPY: Partial<Record<ContributionModerationAction, string>> = {
  reject: "Reject this Contribution? This cannot be undone from here.",
  archive: "Archive this Contribution?",
  publish: "Publish this Contribution's design response? It becomes eligible for public rendering.",
};

const ACTION_LABEL: Record<ContributionModerationAction, string> = {
  review: "Mark under review",
  approve: "Approve",
  reject: "Reject",
  archive: "Archive",
  publish: "Publish response",
};

export default function AdminContributionReviewPage() {
  const params = useParams<{ id: string }>();
  const [contribution, setContribution] = useState<AdminContributionDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busyAction, setBusyAction] = useState<ContributionModerationAction | null>(null);
  const actionState = useSaveStatus();

  useEffect(() => {
    let cancelled = false;
    getContribution(params.id).then((c) => {
      if (cancelled) return;
      if (!c) {
        setNotFound(true);
        return;
      }
      setContribution(c);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No Contribution with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/contributions" className="text-body text-accent underline">
          Back to Contributions
        </Link>
      </div>
    );
  }
  if (!contribution) return <p className="text-body text-text-secondary">Loading…</p>;

  async function runAction(action: ContributionModerationAction) {
    if (busyAction) return;
    const confirmMsg = CONFIRM_COPY[action];
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyAction(action);
    await actionState.run(async () => {
      const updated = await moderateContribution(params.id, action);
      setContribution(updated);
    });
    setBusyAction(null);
  }

  const dr = contribution.designResponse;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <Link href="/admin/contributions" className="text-caption text-accent underline">
          ← All Contributions
        </Link>
        <h1 className="text-h1 mt-2">{contribution.title || "(untitled)"}</h1>
        <p className="text-caption mt-1 text-text-tertiary">
          id: {contribution.id} · signal: {contribution.signalTitle} · by {contribution.contributorName} · created{" "}
          {new Date(contribution.createdAt).toLocaleString()} · updated {new Date(contribution.updatedAt).toLocaleString()}
        </p>
      </div>

      <Section title="Content" description="Exactly what the contributor submitted — never edited here.">
        <p className="text-body">
          <span className="text-text-tertiary">Type:</span> {contribution.contributionType || "—"}
        </p>
        <div>
          <p className="text-caption text-text-tertiary">Why they can help</p>
          <p className="text-body mt-1 whitespace-pre-wrap">{contribution.explanation || "—"}</p>
        </div>

        {dr ? (
          <div className="mt-2 flex flex-col gap-3 rounded-md border border-border bg-background-alt p-4">
            <p className="text-label text-text-tertiary">Design response</p>
            {([
              ["Problem", dr.problemStatement],
              ["Approach", dr.approach],
              ["Research findings", dr.researchFindings],
              ["Design rationale", dr.designDecisions],
              ["Outcome", dr.outcome],
              ["Solution summary", dr.summary],
              ["Tools used", dr.toolsUsed],
            ] as const).map(([label, value]) =>
              value ? (
                <div key={label}>
                  <p className="text-caption text-text-tertiary">{label}</p>
                  <p className="text-body mt-1 whitespace-pre-wrap">{value}</p>
                </div>
              ) : null,
            )}
            <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
              {dr.figmaUrl ? (
                <p className="text-body">
                  <span className="text-text-tertiary">Figma:</span>{" "}
                  <a href={dr.figmaUrl} className="text-accent underline" target="_blank" rel="noreferrer">
                    {dr.figmaUrl}
                  </a>
                </p>
              ) : null}
              {dr.prototypeUrl ? (
                <p className="text-body">
                  <span className="text-text-tertiary">Prototype:</span>{" "}
                  <a href={dr.prototypeUrl} className="text-accent underline" target="_blank" rel="noreferrer">
                    {dr.prototypeUrl}
                  </a>
                </p>
              ) : null}
              {dr.caseStudyUrl ? (
                <p className="text-body">
                  <span className="text-text-tertiary">Case study:</span>{" "}
                  <a href={dr.caseStudyUrl} className="text-accent underline" target="_blank" rel="noreferrer">
                    {dr.caseStudyUrl}
                  </a>
                </p>
              ) : null}
              {dr.externalUrl ? (
                <p className="text-body">
                  <span className="text-text-tertiary">Project URL:</span>{" "}
                  <a href={dr.externalUrl} className="text-accent underline" target="_blank" rel="noreferrer">
                    {dr.externalUrl}
                  </a>
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-caption text-text-tertiary">No linked design response.</p>
        )}
        <p className="text-caption text-text-tertiary">
          Media: none — Contribution/DesignResponse media attachment isn&rsquo;t wired up in this phase&rsquo;s UI yet (the
          contribution_media/design_response_media tables exist from Phase 6A/6B, but no upload path was built).
        </p>
      </Section>

      <Section title="Moderation" description="Contribution status and design-response publication — admin-only from here on.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-sm border border-accent px-2.5 py-1 text-caption text-accent">
            contribution: {contribution.status}
          </span>
          <span className="inline-flex rounded-sm border border-border px-2.5 py-1 text-caption text-text-secondary">
            response: {dr?.status ?? "—"}
          </span>
        </div>

        <SaveStatusMessage status={actionState.status} error={actionState.error} savedLabel="Updated" />

        <div className="flex flex-wrap gap-2">
          {(["review", "approve", "reject", "archive"] as const).map((action) => {
            const eligible = CONTRIB_PRECONDITIONS[action].includes(contribution.status);
            return (
              <button
                key={action}
                type="button"
                disabled={!eligible || Boolean(busyAction)}
                onClick={() => runAction(action)}
                className={adminButtonSmall}
              >
                {busyAction === action ? <Spinner /> : null}
                {busyAction === action ? "Working…" : ACTION_LABEL[action]}
              </button>
            );
          })}
          <button
            type="button"
            disabled={contribution.status !== "approved" || dr?.status === "published" || Boolean(busyAction)}
            onClick={() => runAction("publish")}
            className={adminButtonSmall}
          >
            {busyAction === "publish" ? <Spinner /> : null}
            {busyAction === "publish" ? "Working…" : dr?.status === "published" ? "Published" : ACTION_LABEL.publish}
          </button>
        </div>
        <p className="text-caption text-text-tertiary">
          Publish requires the Contribution to be &ldquo;approved&rdquo; first — it publishes the linked design response, not
          the Contribution row itself (Contributions have no &ldquo;published&rdquo; status in the schema).
        </p>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <Link href="/admin/contributions" className={adminButtonSecondary}>
          Back
        </Link>
      </div>
    </div>
  );
}
