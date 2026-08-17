"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { authFetchJson } from "@/lib/auth/authFetch";
import type { Contribution } from "@/types/contribution";

const MAX_MESSAGE = 500;

/** Anything past "draft" means this contributor already sent a real offer for this Signal — matches the same status values getMyContributionStatus()/the offer-help route already use, no new status invented. */
function hasAlreadyOffered(status: Contribution["status"] | null): boolean {
  return Boolean(status) && status !== "draft";
}

/**
 * ["I can solve this" real notification flow, Part B/C/L] Real
 * database-backed connect flow — never a mailto link. `initialStatus` is
 * fetched server-side (see signals/[id]/page.tsx) so a returning visitor
 * who already offered sees the correct state immediately, no flash of the
 * wrong CTA. Only ever rendered for a signed-in visitor (see
 * signals/[id]/page.tsx) — an anonymous visitor sees a "Log in to respond"
 * link instead, matching the pre-existing behavior this phase didn't touch.
 */
export function ICanSolveThisButton({ signalId, initialStatus }: { signalId: string; initialStatus: Contribution["status"] | null }) {
  const [status, setStatus] = useState<Contribution["status"] | null>(initialStatus);
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only set right after a successful send *this session* — distinguishes
  // "you just offered" (richer confirmation, knows the email outcome) from
  // "you'd already offered before loading this page" (plain restatement,
  // no email status to report since that attempt happened in a past request).
  const [justSent, setJustSent] = useState<{ emailStatus: "sent" | "failed" | "not_configured" } | null>(null);

  async function handleSend() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await authFetchJson(`/api/community/signals/${signalId}/offer-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not send your offer to help.");

      const contribution = data.contribution as Contribution;
      if (data.alreadyOffered) {
        // A race with another tab/request that already completed the offer
        // — same "already offered" state, not an error.
        setStatus(contribution.status);
        setFormOpen(false);
        return;
      }
      setStatus(contribution.status);
      setJustSent({ emailStatus: (data.emailStatus as "sent" | "failed" | "not_configured") ?? "not_configured" });
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (hasAlreadyOffered(status)) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-body text-ink">✓ You&rsquo;ve offered to help</p>
        <p className="text-caption text-text-secondary">
          {justSent
            ? "Your offer to help has been sent to the problem author."
            : "You've already offered to help with this problem."}
          {justSent?.emailStatus === "not_configured"
            ? " The problem author will be notified through ThanksUX."
            : justSent?.emailStatus === "sent"
              ? " They've also been emailed."
              : ""}
        </p>
      </div>
    );
  }

  if (!formOpen) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="primary" onClick={() => setFormOpen(true)} className="w-fit">
          I can solve this
        </Button>
        {error ? (
          <p role="alert" className="text-caption text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-md border border-border bg-surface p-4">
      <p className="text-body font-medium text-ink">I can help with this</p>
      <div>
        <label htmlFor="offer-message" className="text-caption text-text-secondary">
          Message <span className="text-text-tertiary">(optional)</span>
        </label>
        <textarea
          id="offer-message"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
          rows={3}
          maxLength={MAX_MESSAGE}
          disabled={busy}
          placeholder="What do you think you could help with?"
          className="mt-1.5 w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out focus:border-accent focus:shadow-focus focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" onClick={handleSend} disabled={busy}>
          {busy ? "Sending…" : "Send to the problem author"}
        </Button>
        <button
          type="button"
          onClick={() => setFormOpen(false)}
          disabled={busy}
          className="text-caption text-text-secondary underline disabled:pointer-events-none disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
