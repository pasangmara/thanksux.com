import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { getAuditById } from "@/lib/audit/auditsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { buildRoadmap, quickWins, topPriorities, whatsWorking } from "@/lib/audit/derive";
import { DashboardHeader } from "@/components/audit/DashboardHeader";
import { CategoryHealth, CategoryHealthDetail } from "@/components/audit/ScoreOverview";
import { FindingsExplorer } from "@/components/audit/FindingsExplorer";
import { TopPriorities, QuickWins } from "@/components/audit/PrioritiesAndWins";
import { WhatsWorking } from "@/components/audit/WhatsWorking";
import { Roadmap } from "@/components/audit/Roadmap";
import { UxFlow } from "@/components/audit/UxFlow";
import { DesignGuideSection } from "@/components/audit/DesignGuideSection";
import { AuditLimitations } from "@/components/audit/AuditLimitations";

// Audit reports are private-by-default (§27) and reflect a point-in-time
// analysis, not evergreen content — never statically cached/indexed.
export const dynamic = "force-dynamic";

const AUDIT_TYPE_LABEL: Record<string, string> = { ux: "UX Audit", web: "Web Audit", design: "Design Audit" };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const current = await getCurrentPublicUser();
  const audit = await getAuditById(id, current?.authUserId ?? null);
  if (!audit) return {};
  return {
    title: `${AUDIT_TYPE_LABEL[audit.auditType] ?? "UX Audit"} Report`,
    // §27 — never publicly indexed by default; this is a report link, not a public content page.
    robots: { index: false, follow: false },
  };
}

/**
 * [UX Audit Engine — dashboard] Diagnostic-product layout: a compact
 * header (score/confidence/coverage/severity counts), a sticky category
 * nav on desktop (CategoryHealth in the sidebar — hidden below the
 * `desktop` breakpoint, where the in-flow CategoryHealthDetail section
 * below already covers the same information without needing a fixed
 * rail), then priorities -> category health -> filterable findings ->
 * recommendations -> supplementary reference material -> limitations,
 * replacing the old single-column document-style report.
 */
export default async function AuditResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentPublicUser();
  const audit = await getAuditById(id, current?.authUserId ?? null);

  // Same non-leaking "doesn't exist" vs "not yours" response every other
  // ownership-gated read in this app already uses (see signals/[id]/page.tsx).
  if (!audit) notFound();

  if (audit.status === "failed") {
    return (
      <main>
        <section className="py-16 tablet:py-24">
          <Container variant="narrow">
            <p className="text-caption text-text-tertiary">{AUDIT_TYPE_LABEL[audit.auditType]}</p>
            <h1 className="text-h1 mt-2">This audit couldn&rsquo;t be completed</h1>
            <p className="text-body mt-4 text-text-secondary">
              {audit.errorMessage || "Something went wrong while analyzing this input."}
            </p>
            <Link href="/audit" className="text-body mt-6 inline-block text-ink underline hover:text-accent">
              Try another audit
            </Link>
          </Container>
        </section>
      </main>
    );
  }

  if (audit.status !== "completed") {
    return (
      <main>
        <section className="py-16 tablet:py-24">
          <Container variant="narrow">
            <p className="text-caption text-text-tertiary">{AUDIT_TYPE_LABEL[audit.auditType]}</p>
            <h1 className="text-h1 mt-2">Still analyzing…</h1>
            <p className="text-body mt-4 text-text-secondary">
              This audit is still in progress (status: {audit.status}). Refresh in a moment.
            </p>
          </Container>
        </section>
      </main>
    );
  }

  const { findings, categoryScores } = audit;
  const priorities = topPriorities(findings);
  const wins = quickWins(findings);
  const working = whatsWorking(findings);
  const roadmap = buildRoadmap(findings);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border py-10 tablet:py-16">
        <div className="atmosphere-audit pointer-events-none absolute inset-0" aria-hidden="true" />
        <Container variant="wide" className="relative">
          <DashboardHeader audit={audit} />

          {audit.inputType === "screenshot" && audit.screenshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={audit.screenshotUrl}
              alt="Uploaded screenshot"
              className="mt-6 max-h-[420px] w-full rounded-md border border-border object-contain"
            />
          ) : null}
        </Container>
      </section>

      <section className="py-10 tablet:py-16">
        <Container variant="wide">
          <div className="desktop:grid desktop:grid-cols-[220px_1fr] desktop:gap-10 desktop:items-start">
            <aside className="desktop:sticky desktop:top-24 hidden desktop:block">
              <p className="text-label text-text-tertiary">Categories</p>
              <div className="mt-3">
                <CategoryHealth categoryScores={categoryScores} />
              </div>
            </aside>

            <div className="flex flex-col gap-12 tablet:gap-16">
              <div>
                <p className="text-label">CATEGORY HEALTH</p>
                <h2 className="text-h2 mt-2">Scores by category</h2>
                <div className="mt-6">
                  <CategoryHealthDetail categoryScores={categoryScores} />
                </div>
              </div>

              {priorities.length > 0 ? (
                <div>
                  <p className="text-label">FIX THESE FIRST</p>
                  <h2 className="text-h2 mt-2">Top priorities</h2>
                  <div className="mt-6 rounded-lg border border-border bg-surface p-4 tablet:p-6">
                    <TopPriorities findings={priorities} />
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-label">FINDINGS</p>
                <h2 className="text-h2 mt-2">All findings</h2>
                <div className="mt-6">
                  <FindingsExplorer findings={findings} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8 tablet:grid-cols-2">
                <div>
                  <p className="text-label">RECOMMENDATIONS</p>
                  <h3 className="text-h3 mt-2">Quick wins</h3>
                  <p className="text-caption mt-1 text-text-tertiary">High impact, low effort</p>
                  <div className="mt-4">
                    <QuickWins findings={wins} />
                  </div>
                </div>
                <div>
                  <p className="text-label">WHAT&rsquo;S WORKING</p>
                  <h3 className="text-h3 mt-2">Real strengths</h3>
                  <div className="mt-4">
                    <WhatsWorking findings={working} />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-label">ROADMAP</p>
                <h2 className="text-h2 mt-2">What to do, and when</h2>
                <div className="mt-6">
                  <Roadmap roadmap={roadmap} />
                </div>
              </div>

              {audit.inputType === "url" ? (
                <div>
                  <p className="text-label">UX FLOW</p>
                  <h2 className="text-h2 mt-2">Entry to confirmation</h2>
                  <div className="mt-6">
                    <UxFlow findings={findings} categoryScores={categoryScores} />
                  </div>
                </div>
              ) : null}

              <div>
                <p className="text-label">DESIGN GUIDE</p>
                <h2 className="text-h2 mt-2">Reference guidance</h2>
                <p className="text-body mt-3 max-w-2xl text-text-secondary">
                  General, always-applicable design principles — not generated from this specific audit.
                </p>
                <div className="mt-6">
                  <DesignGuideSection />
                </div>
              </div>

              <div>
                <p className="text-label">AUDIT LIMITATIONS</p>
                <h2 className="text-h2 mt-2">What this audit couldn&rsquo;t verify</h2>
                <div className="mt-6">
                  <AuditLimitations audit={audit} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
