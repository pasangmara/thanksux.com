import Link from "next/link";
import { PortfolioMedia } from "@/components/site/PortfolioMedia";
import { ASPECT } from "@/content/media";
import type { ThanksSignal } from "@/types/thanksSignal";

/**
 * [Phase 6F §2 — public discovery card] `thanks_signals` has no attached
 * media of its own (only Contributions/DesignResponses can carry media —
 * see docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md §9); this always renders
 * the honest placeholder frame rather than inventing a signal-level cover
 * image field, matching this codebase's existing "never dress up an empty
 * slot as finished work" rule (PlaceholderMedia.tsx's header comment).
 */
export function SignalCard({
  signal,
  authorName,
  contributionCount,
}: {
  signal: ThanksSignal;
  authorName: string;
  contributionCount: number;
}) {
  return (
    <Link href={`/signals/${signal.id}`} className="group block">
      <PortfolioMedia
        media={{ kind: "placeholder", category: "ui-screen", alt: signal.title }}
        aspectRatio={ASPECT.card}
        radius="md"
        placeholderLabel={signal.category || "ThanksSignal"}
      />
      <div className="mt-3">
        <p className="text-label">{signal.category || "ThanksSignal"}</p>
        <h3 className="text-h3 mt-2">{signal.title}</h3>
        <p className="text-body mt-1 line-clamp-2 text-text-secondary">{signal.description}</p>
      </div>
      <p className="text-caption mt-2 text-text-tertiary">
        {authorName} · {new Date(signal.createdAt).toLocaleDateString()}
        {contributionCount > 0 ? ` · ${contributionCount} responding` : ""}
      </p>
    </Link>
  );
}
