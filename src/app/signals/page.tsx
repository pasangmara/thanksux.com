import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { SignalCard } from "@/components/community/SignalCard";
import { SignalFilters } from "@/components/community/SignalFilters";
import { getApprovedContributionCounts, listPublicSignals } from "@/lib/community/thanksSignalsRepository";
import { getContributorNames } from "@/lib/community/publicProfiles";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";
import { THANKS_SIGNAL_CATEGORIES, type ThanksSignalCategory } from "@/types/thanksSignal";

// [Phase 6F §2] Same reasoning as /work's own force-dynamic: this route
// must read the live thanks_signals table per request, never a cached
// snapshot — a newly-published Signal (or a newly-approved Contribution
// changing a card's count) should show up on the very next load.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type SearchParams = Promise<{ category?: string; q?: string; page?: string }>;

function isSignalCategory(value: string): value is ThanksSignalCategory {
  return (THANKS_SIGNAL_CATEGORIES as readonly string[]).includes(value);
}

function resolveCategory(raw: string | undefined): string {
  return raw && isSignalCategory(raw) ? raw : "All";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const [{ category }, settings] = await Promise.all([searchParams, getSiteSettings()]);
  const resolved = resolveCategory(category);
  const brand = settings.brandName || "Joy Howlader";
  const title = resolved === "All" ? `ThanksUX Signals — ${brand}` : `${resolved} Signals — ThanksUX — ${brand}`;
  const description = "Real problems shared by real people — and the design responses they've inspired.";
  return {
    title,
    description,
    // Filtered/search views are the same content re-sliced — canonical
    // stays on the unfiltered URL, same reasoning as /work/page.tsx.
    alternates: { canonical: "/signals" },
    openGraph: { title, description, type: "website" },
  };
}

export default async function SignalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = resolveCategory(params.category);
  const search = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { signals, total } = await listPublicSignals({
    category: category === "All" ? undefined : category,
    search: search || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const [counts, names] = await Promise.all([
    getApprovedContributionCounts(signals.map((s) => s.id)),
    getContributorNames(signals.map((s) => s.authorId)),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main>
      <section className="relative overflow-hidden py-16 tablet:py-20">
        <div className="atmosphere-signals pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container variant="wide" className="relative">
          <p className="text-caption text-text-tertiary">THANKS UX</p>
          <h1 className="text-h1 mt-2">Real problems, designed responses</h1>
          <p className="text-body-lg mt-4 max-w-2xl text-text-secondary">
            Every signal here started as a real moment of design/UX friction someone actually lived through. Browse
            what people have shared, and see how the design community has responded.
          </p>
        </Container>
      </section>

      <SignalFilters activeCategory={category} search={search} />

      <Container variant="wide">
        <div className="py-8 tablet:py-12">
          {signals.length === 0 ? (
            <EmptyState hasFilters={category !== "All" || Boolean(search)} />
          ) : (
            <div className="grid grid-cols-1 gap-[16px] tablet:grid-cols-2 tablet:gap-[20px] desktop:grid-cols-3 desktop:gap-[24px]">
              {signals.map((signal, i) => (
                <ScrollReveal key={signal.id} delayMs={(i % 3) * 50}>
                  <SignalCard
                    signal={signal}
                    authorName={names.get(signal.authorId)?.name || "Someone"}
                    contributionCount={counts.get(signal.id) ?? 0}
                  />
                </ScrollReveal>
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <Pagination page={page} totalPages={totalPages} category={category} search={search} />
          ) : null}
        </div>
      </Container>
    </main>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background-alt px-6 py-16 text-center">
      <p className="text-body-lg text-text-secondary">
        {hasFilters ? "No signals match this filter yet." : "No signals have been shared publicly yet — check back soon."}
      </p>
      {hasFilters ? (
        <Link href="/signals" className="text-body text-ink underline hover:text-accent">
          View all signals
        </Link>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  category,
  search,
}: {
  page: number;
  totalPages: number;
  category: string;
  search: string;
}) {
  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (search) params.set("q", search);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/signals?${qs}` : "/signals";
  }

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-body text-ink underline hover:text-accent">
          ← Previous
        </Link>
      ) : (
        <span className="text-body text-text-tertiary">← Previous</span>
      )}
      <span className="text-caption text-text-tertiary">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-body text-ink underline hover:text-accent">
          Next →
        </Link>
      ) : (
        <span className="text-body text-text-tertiary">Next →</span>
      )}
    </nav>
  );
}
