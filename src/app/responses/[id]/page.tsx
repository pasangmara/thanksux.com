import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { PortfolioMedia } from "@/components/site/PortfolioMedia";
import { ExternalLinkButton } from "@/components/community/ExternalLinkButton";
import { ASPECT } from "@/content/media";
import { getPublishedDesignResponse } from "@/lib/community/contributionsRepository";
import { getSignalById } from "@/lib/community/thanksSignalsRepository";
import { getContributorNames } from "@/lib/community/publicProfiles";
import { getContributionMedia, getDesignResponseMedia } from "@/lib/community/publicMedia";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";

// [Phase 6F §6] Reads the live design_responses/contributions tables per
// request — an admin unpublishing a response must take it down immediately,
// not on the next deploy.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const bundle = await getPublishedDesignResponse(id);
  if (!bundle) return {};
  const settings = await getSiteSettings();
  const brand = settings.brandName || "Joy Howlader";
  const title = `${bundle.contribution.title || "Design response"} — ThanksUX — ${brand}`;
  const descriptionSource = bundle.designResponse.summary || bundle.designResponse.problemStatement || "";
  const description = descriptionSource ? descriptionSource.slice(0, 155) : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/responses/${id}` },
    openGraph: { title, description, type: "article" },
  };
}

/**
 * [Phase 6F §6 — public case-study page] Only ever reachable for a
 * `status = 'published'` DesignResponse — getPublishedDesignResponse()'s
 * own RLS-backed filter (contributionsRepository.ts) is the real gate;
 * this page 404s for anything else rather than distinguishing "doesn't
 * exist" from "not public yet", same non-leaking pattern as
 * /signals/[id]. Every section below only renders when its underlying
 * field actually has content — no empty-placeholder sections.
 */
export default async function PublicResponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bundle = await getPublishedDesignResponse(id);
  if (!bundle) notFound();
  const { contribution, designResponse } = bundle;

  const [signal, names, drMedia, contribMedia] = await Promise.all([
    getSignalById(contribution.signalId),
    getContributorNames([contribution.contributorId]),
    getDesignResponseMedia(designResponse.id),
    getContributionMedia(contribution.id),
  ]);

  const contributorName = names.get(contribution.contributorId)?.name || "A contributor";
  const media = [...drMedia, ...contribMedia];

  return (
    <article className="py-16 tablet:py-24">
      <Container variant="narrow">
        {signal ? (
          <Link href={`/signals/${signal.id}`} className="text-caption text-accent underline hover:text-ink">
            ← {signal.title}
          </Link>
        ) : null}

        <p className="text-caption mt-4 text-text-tertiary">
          {contribution.contributionType || designResponse.discipline || "Design response"}
        </p>
        <h1 className="text-h1 mt-2">{contribution.title || "Design response"}</h1>
        <p className="text-caption mt-3 text-text-tertiary">By {contributorName}</p>

        {designResponse.problemStatement || contribution.explanation ? (
          <Section title="Problem">{designResponse.problemStatement || contribution.explanation}</Section>
        ) : null}

        {designResponse.approach || contribution.proposedDirection ? (
          <Section title="Approach">{designResponse.approach || contribution.proposedDirection}</Section>
        ) : null}

        {designResponse.researchFindings || contribution.research || contribution.observation ? (
          <Section title="Research">
            {designResponse.researchFindings || contribution.research || contribution.observation}
          </Section>
        ) : null}

        {designResponse.designDecisions ? <Section title="Design rationale">{designResponse.designDecisions}</Section> : null}

        {designResponse.summary || designResponse.outcome ? (
          <Section title="Solution">
            {designResponse.summary}
            {designResponse.summary && designResponse.outcome ? " " : ""}
            {designResponse.outcome}
          </Section>
        ) : null}
      </Container>

      {media.length > 0 ? (
        <Container variant="wide">
          <div className="mt-12 grid grid-cols-1 gap-[16px] tablet:grid-cols-2 tablet:gap-[20px]">
            {media.map((m, i) => (
              <ScrollReveal key={m.id} delayMs={(i % 2) * 50}>
                <PortfolioMedia
                  media={{ kind: "image", src: m.url, alt: contribution.title || "Design response image" }}
                  aspectRatio={ASPECT.card}
                  radius="md"
                />
              </ScrollReveal>
            ))}
          </div>
        </Container>
      ) : null}

      <Container variant="narrow">
        {designResponse.figmaUrl || designResponse.prototypeUrl ? (
          <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
            <ExternalLinkButton href={designResponse.figmaUrl}>View prototype</ExternalLinkButton>
            <ExternalLinkButton href={designResponse.prototypeUrl}>View live prototype</ExternalLinkButton>
          </div>
        ) : null}

        {designResponse.toolsUsed ? (
          <div className="mt-8">
            <p className="text-caption font-medium text-ink">Tools</p>
            <p className="text-body mt-1 text-text-secondary">{designResponse.toolsUsed}</p>
          </div>
        ) : null}

        {designResponse.caseStudyUrl || designResponse.externalUrl ? (
          <div className="mt-8 flex flex-col gap-2">
            <ExternalLinkButton href={designResponse.caseStudyUrl} variant="text-link">
              Read the full case study
            </ExternalLinkButton>
            <ExternalLinkButton href={designResponse.externalUrl} variant="text-link">
              View project
            </ExternalLinkButton>
          </div>
        ) : null}
      </Container>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8">
      <p className="text-caption font-medium text-ink">{title}</p>
      <p className="text-body mt-1 whitespace-pre-wrap text-text-secondary">{children}</p>
    </div>
  );
}
