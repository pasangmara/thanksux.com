"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonPrimary, adminButtonSecondary, adminButtonSmallDanger, SaveStatusMessage, Section, Spinner } from "@/components/admin/fields";
import { getSignal, moderateSignal, type AdminSignalDetail, type ModerationAction } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

/**
 * [Phase 6D] Admin review + moderation for a single ThanksSignal.
 * CONTENT (what the author wrote) and MODERATION (status/visibility +
 * actions) are two separate Sections on purpose, per the explicit
 * instruction to keep them visually distinct.
 *
 * The precondition map below mirrors `MODERATION_PRECONDITIONS` in
 * adminThanksSignalsRepository.ts exactly, so a button is only enabled
 * when the action would actually succeed — but this is a UX convenience
 * only, not the real gate: the PATCH route re-checks the same
 * precondition server-side (and the DB-level status filter is the actual
 * atomic guard against a stale double-click), so a disabled button here
 * is not the security boundary.
 */
const PRECONDITIONS: Record<ModerationAction, string[]> = {
  review: ["submitted"],
  approve: ["reviewed"],
  reject: ["submitted", "reviewed"],
  publish: ["open", "in_progress", "resolved"],
  archive: ["open", "in_progress", "resolved"],
};

const CONFIRM_COPY: Partial<Record<ModerationAction, string>> = {
  reject: "Reject this ThanksSignal? It will be archived and will not be public. This cannot be undone from here.",
  publish: "Publish this ThanksSignal? It becomes visible on the public /signals page immediately.",
  archive: "Archive this ThanksSignal? It will be removed from public visibility if it was published.",
};

const ACTION_LABEL: Record<ModerationAction, string> = {
  review: "Mark under review",
  approve: "Approve",
  reject: "Reject",
  publish: "Publish",
  archive: "Archive",
};

/**
 * [Moderation UI redesign §E] The ONE next forward step for the current
 * status — surfaced as a single prominent primary button instead of
 * making the admin scan five buttons (three of which are usually
 * invalid). Never invents a transition PRECONDITIONS doesn't already
 * allow — this is presentation only, same server/DB-enforced gate as
 * before.
 */
function primaryActionFor(status: string, visibility: string): ModerationAction | null {
  if (status === "submitted") return "review";
  if (status === "reviewed") return "approve";
  if ((status === "open" || status === "in_progress" || status === "resolved") && visibility !== "public") return "publish";
  return null;
}

export default function AdminSignalReviewPage() {
  const params = useParams<{ id: string }>();
  const [signal, setSignal] = useState<AdminSignalDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busyAction, setBusyAction] = useState<ModerationAction | null>(null);
  const actionState = useSaveStatus();

  useEffect(() => {
    let cancelled = false;
    getSignal(params.id).then((s) => {
      if (cancelled) return;
      if (!s) {
        setNotFound(true);
        return;
      }
      setSignal(s);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No ThanksSignal with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/signals" className="text-body text-accent underline">
          Back to ThanksSignals
        </Link>
      </div>
    );
  }
  if (!signal) return <p className="text-body text-text-secondary">Loading…</p>;

  async function runAction(action: ModerationAction) {
    if (busyAction) return;
    const confirmMsg = CONFIRM_COPY[action];
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyAction(action);
    await actionState.run(async () => {
      const updated = await moderateSignal(params.id, action);
      setSignal(updated);
    });
    setBusyAction(null);
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <Link href="/admin/signals" className="text-caption text-accent underline">
          ← All ThanksSignals
        </Link>
        <h1 className="text-h1 mt-2">{signal.title || "(untitled)"}</h1>
        <p className="text-caption mt-1 text-text-tertiary">
          id: {signal.id} · by {signal.authorName} · created {new Date(signal.createdAt).toLocaleString()} · updated{" "}
          {new Date(signal.updatedAt).toLocaleString()}
        </p>
      </div>

      <Section title="Content" description="Exactly what the author submitted — never edited here.">
        <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
          <p className="text-body">
            <span className="text-text-tertiary">Category:</span> {signal.category || "—"}
          </p>
          <p className="text-body">
            <span className="text-text-tertiary">Audience:</span> {signal.audience || "—"}
          </p>
        </div>
        <div>
          <p className="text-caption text-text-tertiary">Description</p>
          <p className="text-body mt-1 whitespace-pre-wrap">{signal.description || "—"}</p>
        </div>
        <div>
          <p className="text-caption text-text-tertiary">Context</p>
          <p className="text-body mt-1 whitespace-pre-wrap">{signal.context || "—"}</p>
        </div>
      </Section>

      <Section title="Attachments" description="Files the author attached — contained inside this card, opens in a new tab.">
        {signal.media.length === 0 ? (
          <p className="text-body text-text-secondary">No attachments.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
            {signal.media.map((m) => {
              const isImage = Boolean(m.mimeType?.startsWith("image/"));
              return (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-md border border-border bg-background-alt transition-colors duration-150 ease-out hover:border-ink"
                >
                  <div className="relative aspect-[4/3] w-full bg-surface">
                    {isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={m.filename ? `Attachment: ${m.filename}` : "Attached image"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-caption text-text-tertiary">
                        {(m.mimeType || "file").split("/")[1]?.toUpperCase() || "FILE"}
                      </div>
                    )}
                  </div>
                  <div className="p-1.5">
                    <p className="truncate text-caption text-ink" title={m.filename ?? undefined}>
                      {m.filename || "(unnamed file)"}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      {m.mimeType || "unknown type"}
                      {m.fileSize ? ` · ${(m.fileSize / (1024 * 1024)).toFixed(1)}MB` : ""}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="Moderation" description="Status and public visibility — admin-only from here on.">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex rounded-sm border px-2.5 py-1 text-caption ${
              signal.visibility === "public" ? "border-ink bg-ink text-white" : "border-accent text-accent"
            }`}
          >
            {signal.visibility === "public" ? "published" : `status: ${signal.status}`}
          </span>
          {signal.visibility !== "public" ? (
            <span className="inline-flex rounded-sm border border-border px-2.5 py-1 text-caption text-text-secondary">
              visibility: {signal.visibility}
            </span>
          ) : null}
        </div>

        <SaveStatusMessage status={actionState.status} error={actionState.error} savedLabel="Updated" />

        {(() => {
          const primary = primaryActionFor(signal.status, signal.visibility);
          const rejectEligible = PRECONDITIONS.reject.includes(signal.status);
          const archiveEligible = PRECONDITIONS.archive.includes(signal.status);
          const isTerminal = signal.status === "archived";

          if (isTerminal) {
            return <p className="text-body text-text-secondary">This signal has been archived — no further action available.</p>;
          }

          return (
            <div className="flex flex-wrap items-center gap-3">
              {primary ? (
                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => runAction(primary)}
                  className={adminButtonPrimary}
                >
                  {busyAction === primary ? <Spinner className="text-white" /> : null}
                  {busyAction === primary ? "Working…" : ACTION_LABEL[primary]}
                </button>
              ) : null}

              {/* [§E] Reject/Archive are secondary, visually distinct (danger)
                  actions, shown only when actually valid for the current
                  status — never a fourth/fifth grayed-out button cluttering
                  the primary workflow. */}
              {rejectEligible ? (
                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => runAction("reject")}
                  className={adminButtonSmallDanger}
                >
                  {busyAction === "reject" ? <Spinner className="text-error" /> : null}
                  {busyAction === "reject" ? "Working…" : "Reject"}
                </button>
              ) : null}
              {archiveEligible ? (
                <button
                  type="button"
                  disabled={Boolean(busyAction)}
                  onClick={() => runAction("archive")}
                  className={adminButtonSmallDanger}
                >
                  {busyAction === "archive" ? <Spinner className="text-error" /> : null}
                  {busyAction === "archive"
                    ? "Working…"
                    : signal.visibility === "public"
                      ? "Archive (unpublish)"
                      : "Archive"}
                </button>
              ) : null}
            </div>
          );
        })()}

        <p className="text-caption text-text-tertiary">
          Only the actions valid for the current status are shown — e.g. Approve only appears once a signal is
          &ldquo;reviewed&rdquo;, Publish only once it&rsquo;s &ldquo;open&rdquo;/&ldquo;in_progress&rdquo;/&ldquo;resolved&rdquo;.
          No moderation-note field exists on this table yet, so Reject/Archive only ask for confirmation, not a saved reason.
        </p>
      </Section>

      {signal.visibility === "public" ? (
        <Link href={`/signals/${signal.id}`} className="text-body text-accent underline">
          View public page →
        </Link>
      ) : null}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <Link href="/admin/signals" className={adminButtonSecondary}>
          Back
        </Link>
      </div>
    </div>
  );
}
