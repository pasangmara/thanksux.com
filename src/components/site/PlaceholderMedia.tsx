import { ImagePlaceholderIcon } from "@/components/icons";
import type { MediaCategory } from "@/types/project";

/**
 * Honest placeholder — deliberately NOT styled to look like finished
 * artwork (an earlier version of this build used abstract token-built
 * compositions per category; the homepage polish pass replaced that with
 * this, because a placeholder dressed up as "finished" work risks being
 * mistaken for the real portfolio piece — see docs/HOMEPAGE_SPEC.md §3
 * update). A calm frame + icon + category label reads unambiguously as
 * "real image goes here," which is what an unpopulated CMS field should
 * look like.
 */
const categoryLabels: Record<MediaCategory, string> = {
  "brand-mark": "Brand identity",
  "ui-screen": "UI screen",
  website: "Website",
  poster: "Poster",
  editorial: "Editorial / print",
  campaign: "Campaign",
  social: "Social",
  packaging: "Packaging",
  typography: "Typography",
};

export function PlaceholderMedia({
  category,
  alt,
  label,
  className = "",
}: {
  category: MediaCategory;
  alt: string;
  /** [Phase D3.5] Optional override for the visible label text — falls back to the category-derived label (unchanged default) when unset. Lets a caller with its own admin-entered organizational label (e.g. a Hero Visual's `title`) show that instead of a generic category name, without adding a second text element or changing this component's layout. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-background-alt ${className}`}
    >
      <ImagePlaceholderIcon className="h-6 w-6 text-text-tertiary" />
      <p className="text-label text-text-tertiary">{label ?? categoryLabels[category]}</p>
    </div>
  );
}
