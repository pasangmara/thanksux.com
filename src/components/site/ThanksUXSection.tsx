import { Accent, Button, Container } from "@/components/ui";
import { SignalCard } from "@/components/community/SignalCard";
import { getApprovedContributionCounts, listPublicSignals } from "@/lib/community/thanksSignalsRepository";
import { getContributorNames } from "@/lib/community/publicProfiles";
import { ScrollReveal } from "./ScrollReveal";

const HOMEPAGE_SIGNAL_LIMIT = 3;

/**
 * [Phase 6F §11 — homepage integration] The homepage's whole "architecture"
 * is a fixed, hardcoded list of independent async section components in
 * src/app/page.tsx (Hero, FeaturedWork, CaseStudyPreview, …) — there is no
 * CMS-driven section-ordering system to restructure. Adding this section
 * follows that exact same pattern (its own component, fetches its own
 * data, one new line in page.tsx), so it's additive, not a restructuring —
 * the STOP-and-document condition in the brief doesn't apply here.
 *
 * Renders nothing when there are zero published Signals yet, same "no
 * empty placeholder section" rule as the rest of this phase.
 */
export async function ThanksUXSection() {
  const { signals } = await listPublicSignals({ limit: HOMEPAGE_SIGNAL_LIMIT });
  if (signals.length === 0) return null;

  const [counts, names] = await Promise.all([
    getApprovedContributionCounts(signals.map((s) => s.id)),
    getContributorNames(signals.map((s) => s.authorId)),
  ]);

  return (
    <section className="relative overflow-hidden border-t border-border py-16 tablet:py-24">
      <div className="atmosphere-signals pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container variant="wide" className="relative">
        <div className="flex flex-col items-start justify-between gap-4 tablet:flex-row tablet:items-end">
          <div>
            <p className="text-caption text-text-tertiary">THANKS UX</p>
            <h2 className="text-h2 mt-2">
              Real problems. Designed <Accent>responses</Accent>.
            </h2>
          </div>
          <Button href="/signals" variant="secondary">
            Explore ThanksUX
          </Button>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-[16px] tablet:grid-cols-3 tablet:gap-[20px]">
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
      </Container>
    </section>
  );
}
