import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { listMySignals } from "@/lib/community/thanksSignalsRepository";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted — awaiting review",
  reviewed: "Reviewed",
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  archived: "Archived",
};

/**
 * [Phase 6C] Minimal authenticated user area — "My ThanksSignals" only,
 * per the explicit scope boundary (no contribution management, no large
 * dashboard). Public detail link only offered once a signal has actually
 * left draft/submitted — never claims something is publicly visible when
 * its own status says otherwise.
 */
export default async function DashboardPage() {
  const current = await getCurrentPublicUser();
  if (!current) redirect("/login?from=/dashboard");

  const signals = await listMySignals();

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="wide">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-h1">My ThanksSignals</h1>
            <p className="text-body mt-2 text-text-secondary">Signed in as {current.profile.name || current.email}</p>
          </div>
          <Button href="/share" variant="primary">
            Share a problem
          </Button>
        </div>

        {signals.length === 0 ? (
          <p className="text-body mt-10 text-text-secondary">
            Nothing yet.{" "}
            <Link href="/share" className="text-ink underline hover:text-accent">
              Share your first problem
            </Link>
            .
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {signals.map((s) => {
              return (
                <div key={s.id} className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 tablet:flex-row tablet:items-center tablet:justify-between">
                  <div>
                    <p className="text-body text-ink">{s.title || "(untitled draft)"}</p>
                    <p className="text-caption mt-1 text-text-secondary">
                      {s.category || "No category yet"} · {STATUS_LABEL[s.status] ?? s.status}
                    </p>
                    <p className="text-caption text-text-tertiary">
                      Created {new Date(s.createdAt).toLocaleDateString()} · Updated {new Date(s.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {s.status === "draft" ? (
                      <Button href={`/share/${s.id}`} variant="secondary">
                        Continue draft
                      </Button>
                    ) : (
                      <Button href={`/share/${s.id}`} variant="secondary">
                        View
                      </Button>
                    )}
                    {s.visibility === "public" ? (
                      <Button href={`/signals/${s.id}`} variant="text-link">
                        View public signal
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
