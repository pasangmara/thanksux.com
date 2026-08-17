import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { getSignalById } from "@/lib/community/thanksSignalsRepository";
import { getThanksSignalMedia } from "@/lib/community/publicMedia";
import { listActiveContributionsForSignal } from "@/lib/community/contributionsRepository";
import { getContributorNames } from "@/lib/community/publicProfiles";
import { SignalForm } from "./SignalForm";

const STATUS_LABEL: Record<string, string> = {
  submitted: "offered to help",
  under_review: "under review",
  approved: "approved",
  published: "published",
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.round(ms / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default async function EditSignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentPublicUser();
  if (!current) redirect(`/login?from=/share/${id}`);

  const signal = await getSignalById(id);
  // RLS already means this is either the caller's own row or a public one
  // — but /share/[id] is specifically the *editor*, not a public viewer,
  // so someone else's (even public) signal sends the visitor to the
  // read-only public page instead of a form they can't actually save.
  if (!signal) notFound();
  if (signal.authorId !== current.authUserId) redirect(`/signals/${id}`);

  const editable = signal.status === "draft" || signal.status === "submitted";
  const media = await getThanksSignalMedia(signal.id);

  // ["I can solve this" real notification flow, Part K] Reuses the
  // existing author-scoped RLS read (contributions_select already lets a
  // Signal's own author see every Contribution against it) — no new
  // dashboard, just a section on the page that already represents "your
  // ThanksSignal." Only fetched once the signal has actually been shared
  // (past draft) — a draft has no contributors to speak of.
  const activeContributions = signal.status === "draft" ? [] : await listActiveContributionsForSignal(signal.id);
  const contributorNames = await getContributorNames(activeContributions.map((c) => c.contributorId));

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <p className="text-caption text-text-tertiary">SHARE → UNDERSTAND</p>
        <h1 className="text-h1 mt-2">{editable ? "Your ThanksSignal" : "Your ThanksSignal (in review)"}</h1>
        {!editable ? (
          <p className="text-body mt-4 max-w-lg text-text-secondary">
            This signal is past the draft stage (status: <strong className="text-ink">{signal.status}</strong>) and
            can no longer be edited from here.
          </p>
        ) : null}
        <div className="mt-8 max-w-lg">
          <SignalForm signal={signal} editable={editable} initialMedia={media} />
        </div>

        {activeContributions.length > 0 ? (
          <div className="mt-12 max-w-lg border-t border-border pt-8">
            <h2 className="text-h3">People interested in helping</h2>
            <div className="mt-4 flex flex-col gap-4">
              {activeContributions.map((c) => (
                <div key={c.id} className="rounded-md border border-border bg-surface p-4">
                  <p className="text-body font-medium text-ink">{contributorNames.get(c.contributorId)?.name || "A community member"}</p>
                  {c.explanation ? <p className="text-body mt-1 text-text-secondary">&ldquo;{c.explanation}&rdquo;</p> : null}
                  <p className="text-caption mt-2 text-text-tertiary">
                    {relativeTime(c.createdAt)} · {STATUS_LABEL[c.status] ?? c.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}
