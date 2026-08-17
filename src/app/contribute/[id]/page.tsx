import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { getOwnContributionBundle } from "@/lib/community/contributionsRepository";
import { getDesignResponseMedia } from "@/lib/community/publicMedia";
import { ContributionEditor } from "./ContributionEditor";

/**
 * [Phase 6E] Private editor for one Contribution + its linked
 * DesignResponse — mirrors /share/[id]'s shape exactly (Phase 6C). Not a
 * public route: RLS's `contributions_select` policy would let the
 * Signal's own author or an admin read this row too, but this specific
 * page is the *editor*, so anyone other than the actual contributor gets
 * a plain 404 here — there is no public/read-only Contribution viewer yet
 * (out of scope this phase; admin has its own separate
 * /admin/contributions/[id]).
 */
export default async function ContributePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentPublicUser();
  if (!current) redirect(`/login?from=/contribute/${id}`);

  const bundle = await getOwnContributionBundle(id);
  if (!bundle || bundle.contribution.contributorId !== current.authUserId) notFound();

  // [Phase 6F §5] "If already published: show the published response" —
  // once the linked DesignResponse is publicly live, send the contributor
  // to the same page anyone else would see rather than this private
  // editor shell, so they see their own work exactly as it renders publicly.
  if (bundle.designResponse.status === "published") {
    redirect(`/responses/${bundle.designResponse.id}`);
  }

  const editable = bundle.contribution.status === "draft" || bundle.contribution.status === "submitted";
  const media = await getDesignResponseMedia(bundle.designResponse.id);

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <p className="text-caption text-text-tertiary">SHARE → UNDERSTAND → DESIGN</p>
        <h1 className="text-h1 mt-2">Your response</h1>
        <p className="text-body mt-2 text-text-secondary">
          A calm, structured way to respond to a real problem — no likes, no reactions, no public feed yet.
        </p>
        <div className="mt-8">
          <ContributionEditor
            contribution={bundle.contribution}
            designResponse={bundle.designResponse}
            editable={editable}
            initialMedia={media.map((m) => ({ id: m.id, url: m.url, order: m.order }))}
          />
        </div>
      </Container>
    </section>
  );
}
