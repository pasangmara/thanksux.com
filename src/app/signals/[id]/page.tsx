import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { DesignResponseCard } from "@/components/community/DesignResponseCard";
import { getApprovedContributionCounts, getSignalById } from "@/lib/community/thanksSignalsRepository";
import { getMyContributionStatus, listPublishedResponsesForSignal } from "@/lib/community/contributionsRepository";
import { getContributorNames } from "@/lib/community/publicProfiles";
import { getThanksSignalMedia } from "@/lib/community/publicMedia";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";
import { ICanSolveThisButton } from "./ICanSolveThisButton";

// [Phase 6F §3] Same reasoning as /signals — must read the live table per
// request, never a cached snapshot.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const signal = await getSignalById(id);
  if (!signal || signal.visibility !== "public") return {};
  const settings = await getSiteSettings();
  const brand = settings.brandName || "Joy Howlader";
  const title = `${signal.title} — ThanksUX — ${brand}`;
  const description = signal.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/signals/${signal.id}` },
    openGraph: { title, description, type: "article" },
  };
}

/**
 * [Phase 6C detail page, extended Phase 6F] Public detail page — RLS
 * (`thanks_signals_select`) is the real gate: getSignalById() returns null
 * for anything not `visibility = 'public'` unless the caller happens to be
 * the author or admin, so an anonymous or unrelated visitor genuinely
 * cannot fetch a private draft's data at all, not merely have it hidden by
 * this component. No internal fields are rendered here regardless — no
 * author_id, no moderation notes (none exist yet), nothing beyond what the
 * product concept itself calls public: title, description, category,
 * context, audience, status, author display name, published responses.
 */
export default async function PublicSignalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const signal = await getSignalById(id);

  // Covers both "doesn't exist" and "exists but not visible to you" —
  // deliberately the same response either way, so this page can never be
  // used to confirm a private signal's existence.
  if (!signal || signal.visibility !== "public") notFound();

  const [current, responses, counts, media] = await Promise.all([
    getCurrentPublicUser(),
    listPublishedResponsesForSignal(signal.id),
    getApprovedContributionCounts([signal.id]),
    getThanksSignalMedia(signal.id),
  ]);

  const names = await getContributorNames([signal.authorId, ...responses.map((r) => r.contribution.contributorId)]);
  const authorName = names.get(signal.authorId)?.name || "A community member";
  const contributionCount = counts.get(signal.id) ?? 0;

  // ["I can solve this" real notification flow] Only relevant for a
  // signed-in, non-author visitor — the author never sees this CTA at all
  // (below), and an anonymous visitor has no Contribution to look up.
  const myOfferStatus =
    current && current.authUserId !== signal.authorId ? (await getMyContributionStatus(signal.id))?.status ?? null : null;

  return (
    <>
      <section className="py-16 tablet:py-24">
        <Container variant="narrow">
          <p className="text-caption text-text-tertiary">{signal.category || "ThanksSignal"}</p>
          <h1 className="text-h1 mt-2">{signal.title}</h1>
          <p className="text-caption mt-3 text-text-tertiary">
            Shared by {authorName} · {new Date(signal.createdAt).toLocaleDateString()}
            {contributionCount > 0
              ? ` · ${contributionCount} designer${contributionCount === 1 ? "" : "s"} responding`
              : ""}
          </p>

          <p className="text-body mt-6 whitespace-pre-wrap text-text-secondary">{signal.description}</p>

          {signal.context ? (
            <div className="mt-6">
              <p className="text-caption font-medium text-ink">Context</p>
              <p className="text-body mt-1 whitespace-pre-wrap text-text-secondary">{signal.context}</p>
            </div>
          ) : null}

          {signal.audience ? (
            <div className="mt-4">
              <p className="text-caption font-medium text-ink">Audience</p>
              <p className="text-body mt-1 text-text-secondary">{signal.audience}</p>
            </div>
          ) : null}

          {media.length > 0 ? (
            <div className="mt-6">
              <p className="text-caption font-medium text-ink">Attachments</p>
              <div className="mt-2 grid grid-cols-2 gap-3 tablet:grid-cols-3">
                {media.map((m) => {
                  const isImage = Boolean(m.mimeType?.startsWith("image/"));
                  return isImage ? (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-md border border-border transition-colors duration-150 ease-out hover:border-ink"
                    >
                      <div className="relative aspect-[4/3] w-full bg-background-alt">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={m.filename ? `Attachment: ${m.filename}` : "Attached image"}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    </a>
                  ) : (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-md border border-border bg-background-alt px-2 text-center transition-colors duration-150 ease-out hover:border-ink"
                    >
                      <span className="text-caption font-medium text-ink">Document</span>
                      <span className="line-clamp-2 text-caption text-text-tertiary">{m.filename || "download"}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-10 border-t border-border pt-8">
            <p className="text-caption text-text-tertiary">UNDERSTAND → DESIGN</p>
            <h2 className="text-h3 mt-1">See a way forward?</h2>
            {current && current.authUserId === signal.authorId ? (
              <p className="text-body mt-3 text-text-secondary">
                This is your own problem —{" "}
                <Link href={`/share/${signal.id}`} className="text-ink underline hover:text-accent">
                  see who wants to help
                </Link>
                .
              </p>
            ) : current ? (
              <div className="mt-3">
                <ICanSolveThisButton signalId={signal.id} initialStatus={myOfferStatus} />
              </div>
            ) : (
              <p className="text-body mt-3 text-text-secondary">
                <Link href={`/login?from=/signals/${signal.id}`} className="text-ink underline hover:text-accent">
                  Log in
                </Link>{" "}
                to respond with a contribution.
              </p>
            )}
            {responses.length > 0 ? (
              <a href="#responses" className="text-caption mt-4 inline-block text-ink underline hover:text-accent">
                View design responses ({responses.length})
              </a>
            ) : null}
          </div>
        </Container>
      </section>

      {responses.length > 0 ? (
        <section id="responses" className="border-t border-border py-16 tablet:py-24">
          <Container variant="wide">
            <p className="text-caption text-text-tertiary">DESIGN RESPONSES</p>
            <h2 className="text-h2 mt-1">
              {responses.length} response{responses.length === 1 ? "" : "s"} so far
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-[16px] tablet:grid-cols-2 tablet:gap-[20px] desktop:grid-cols-3 desktop:gap-[24px]">
              {responses.map((r, i) => (
                <ScrollReveal key={r.designResponse.id} delayMs={(i % 3) * 50}>
                  <DesignResponseCard
                    designResponse={r.designResponse}
                    contributionTitle={r.contribution.title}
                    contributionType={r.contribution.contributionType}
                    contributorName={names.get(r.contribution.contributorId)?.name || "A contributor"}
                  />
                </ScrollReveal>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}
