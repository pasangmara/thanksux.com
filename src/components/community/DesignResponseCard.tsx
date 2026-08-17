import Link from "next/link";
import type { DesignResponse } from "@/types/contribution";

/**
 * [Phase 6F §4 — published response card] Rendered on a Signal's detail
 * page for each published DesignResponse — contributor, contribution
 * type, solution title, short summary, tools. No media thumbnail here:
 * media renders on the full /responses/[id] case-study page, not
 * duplicated at card scale (keeps this card a lightweight index read, no
 * extra media_assets resolution per card in a grid — see performance
 * note in publicMedia.ts's header comment).
 */
export function DesignResponseCard({
  designResponse,
  contributionTitle,
  contributionType,
  contributorName,
}: {
  designResponse: DesignResponse;
  contributionTitle: string | null;
  contributionType: string | null;
  contributorName: string;
}) {
  return (
    <Link
      href={`/responses/${designResponse.id}`}
      className="group block rounded-md border border-border bg-surface p-5 transition-colors duration-150 ease-out hover:border-ink"
    >
      <p className="text-label text-text-tertiary">{contributionType || designResponse.discipline || "Design response"}</p>
      <h3 className="text-h3 mt-2">{contributionTitle || "Untitled response"}</h3>
      {designResponse.summary ? (
        <p className="text-body mt-2 line-clamp-3 text-text-secondary">{designResponse.summary}</p>
      ) : null}
      <p className="text-caption mt-3 text-text-tertiary">
        By {contributorName}
        {designResponse.toolsUsed ? ` · ${designResponse.toolsUsed}` : ""}
      </p>
    </Link>
  );
}
