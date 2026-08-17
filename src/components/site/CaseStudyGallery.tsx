import { ASPECT } from "@/content/media";
import type { CoverMedia, GalleryLayout, MediaAspect } from "@/types/project";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Data-driven gallery grid — project detail brief §04. Each image's own
 * `layout` field (full/half/third) decides how much width it claims;
 * nothing here is hardcoded per project. A 6-column base grid (divisible
 * by both 2 and 3) makes the three tiers exact: full=6, half=3 (2-up),
 * third=2 (3-up, desktop only — tablet shows thirds as halves since 3-up
 * gets cramped below 1200px).
 *
 * Frame *shape* is a separate concern from `layout`'s width tier — see
 * `MediaAspect` in src/types/project.ts. `ASPECT_FOR_LAYOUT` below is the
 * existing default shape per width tier (unchanged, so any image without
 * an explicit `aspect` renders exactly as it always has); `ASPECT_FOR_ASPECT`
 * lets a specific image opt into a different, intentional shape — e.g. a
 * `layout: "full"` image no longer has to be forced into 16:9 if it's
 * actually a portrait shot.
 */
const SPAN: Record<GalleryLayout, string> = {
  full: "col-span-6",
  half: "col-span-6 tablet:col-span-3",
  third: "col-span-6 tablet:col-span-3 desktop:col-span-2",
};

const ASPECT_FOR_LAYOUT: Record<GalleryLayout, string> = {
  full: ASPECT.galleryFull,
  half: ASPECT.card,
  third: ASPECT.square,
};

const ASPECT_FOR_ASPECT: Record<MediaAspect, string> = {
  landscape: ASPECT.galleryFull,
  portrait: ASPECT.tall,
  square: ASPECT.square,
};

// Full-width tiles render at close to the container's full 1280px cap, not
// the ~33vw grid-tile share PortfolioMedia's default `sizes` assumes —
// docs/IMAGE_PIPELINE_AUDIT.md §2.3 flagged this as a real (if secondary)
// contributor to blurry full-width gallery images.
const FULL_WIDTH_SIZES = "(min-width: 1200px) 1280px, 100vw";

export function CaseStudyGallery({ images }: { images: CoverMedia[] }) {
  if (images.length === 0) return null;

  return (
    <div className="grid grid-cols-6 gap-[16px] tablet:gap-[20px] desktop:gap-[24px]">
      {images.map((media, i) => {
        const layout = media.layout ?? "half";
        const aspect = media.kind === "image" ? media.aspect : undefined;
        const aspectRatio = aspect ? ASPECT_FOR_ASPECT[aspect] : ASPECT_FOR_LAYOUT[layout];
        // [CMS Phase D3] caption/description only exist on the "image"
        // variant (see CoverMedia in src/types/project.ts) — a placeholder
        // has no real content to caption.
        const caption = media.kind === "image" ? media.caption : undefined;
        const description = media.kind === "image" ? media.description : undefined;
        return (
          <ScrollReveal key={i} className={SPAN[layout]} delayMs={(i % 4) * 50}>
            <PortfolioMedia
              media={media}
              aspectRatio={aspectRatio}
              radius="md"
              sizes={layout === "full" ? FULL_WIDTH_SIZES : undefined}
            />
            {caption || description ? (
              <div className="mt-2">
                {caption ? <p className="text-caption text-ink">{caption}</p> : null}
                {description ? <p className="text-caption mt-0.5 text-text-tertiary">{description}</p> : null}
              </div>
            ) : null}
          </ScrollReveal>
        );
      })}
    </div>
  );
}
