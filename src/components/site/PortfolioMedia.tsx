"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { CoverMedia, MediaFit } from "@/types/project";
import { ASPECT_FOR_MEDIA_ASPECT } from "@/content/media";
import { PlaceholderMedia } from "./PlaceholderMedia";

const radiusClass = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
} as const;

/** Parses a CSS aspect-ratio string like "21 / 9" into a number. Returns null for non-numeric values (e.g. "auto"). */
function parseRatio(css: string): number | null {
  const match = css.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/);
  if (!match) return null;
  const [, w, h] = match;
  const ratio = Number(w) / Number(h);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null;
}

/**
 * How far a `cover` crop would need to cut into the source before it's
 * treated as "cropping important content" and swapped for `contain`
 * instead. 0.35 means: once the frame's ratio is more than ~35% off from
 * the image's real ratio, stop cropping and letterbox it instead. Chosen
 * so a reasonably-composed photo in a similarly-shaped frame still crops
 * normally (the common, intended case), while a near-square source forced
 * into a 21:9/16:9 banner frame — exactly the case
 * docs/IMAGE_PIPELINE_AUDIT.md flagged — falls back to `contain`.
 */
const AUTO_CONTAIN_THRESHOLD = 0.35;

/**
 * Reusable portfolio media frame — homepage polish brief §02, revised for
 * the "premium editorial" visual-refinement pass (§06: "portfolio image
 * containers should feel like intentional presentation frames"), and again
 * for the mixed-aspect-ratio rendering fix (docs/IMAGE_PIPELINE_AUDIT.md).
 *
 * Every visual on the site (project cards, hero tiles, case-study
 * spotlight, gallery shots) should render through this one component so
 * swapping placeholder data for real photography later is a data change,
 * never a layout change. Handles:
 *  - real image (next/image: responsive srcset, loading strategy, alt)
 *  - object-fit / object-position, now content-aware: an explicit
 *    `media.fit` always wins; otherwise the real (loaded) image ratio is
 *    compared against the frame's ratio, and `cover` only applies when it
 *    wouldn't crop away a large portion of the source — see
 *    AUTO_CONTAIN_THRESHOLD above. This never changes anything for an
 *    image that already fits its frame reasonably well.
 *  - aspect ratio, supplied by the caller from src/content/media.ts
 *    (never hardcoded ad hoc inside a section)
 *  - radius, from the 3-step scale (src/styles/tokens.css) — always sm/md/lg,
 *    never an arbitrary value, so nothing drifts off-system
 *  - a persistent subtle border (the "card" trait from §05), not just on
 *    hover — border/radius/overflow-clip live on this one element rather
 *    than being split across a wrapping div a consumer adds separately
 *  - the single sitewide hover treatment (1.02 scale, 400ms ease-out —
 *    only actually visible when this sits inside a `.group` ancestor,
 *    e.g. ProjectCard's Link; harmless no-op otherwise)
 *  - honest placeholder state when no real image exists yet
 */
export function PortfolioMedia({
  media,
  aspectRatio,
  mobileAspectRatio,
  autoMobileAspect = false,
  radius = "md",
  sizes = "(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw",
  priority = false,
  className = "",
  placeholderLabel,
  hoverHighlight = false,
}: {
  media: CoverMedia;
  aspectRatio: string;
  /**
   * [Mobile media adaptation — Featured Work portrait fix] Explicit
   * aspect-ratio override used only below the `tablet` breakpoint (768px)
   * — `aspectRatio` always applies at `tablet` and up, unconditionally
   * (see layout.css's `.portfolio-media-frame` rule), so passing this can
   * never change anything above mobile. Unset (every existing caller)
   * means mobile silently uses the exact same ratio as everywhere else —
   * zero behavior change. Takes priority over both the CMS `media.aspect`
   * field and `autoMobileAspect` below when given explicitly.
   */
  mobileAspectRatio?: string;
  /**
   * [Mobile media adaptation] Opt-in, defaults to `false` — every existing
   * caller (Hero tiles, About photo, case-study gallery, secondary project
   * cards) renders byte-identical to before this prop existed. When
   * `true` and `mobileAspectRatio` wasn't given, the mobile frame ratio is
   * decided from the actual artwork instead of the fixed `aspectRatio`
   * everywhere else uses: the CMS's per-image `media.aspect` tag
   * (portrait/landscape/square) when set, via ASPECT_FOR_MEDIA_ASPECT — or,
   * when that's unset too, the image's own *loaded* natural ratio, so an
   * untagged image still gets a shape that matches its real content rather
   * than a guess (there's necessarily a brief moment before it loads where
   * it shows the same ratio as `aspectRatio`, unavoidable without knowing
   * real dimensions ahead of time).
   */
  autoMobileAspect?: boolean;
  radius?: keyof typeof radiusClass;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** [Phase D3.5] Only used when `media.kind === "placeholder"` — see PlaceholderMedia.tsx's `label` prop. Unused (default) callers get the exact same category-derived label as before. */
  placeholderLabel?: string;
  /**
   * [Visual Design / Motion Phase — v4] Opt-in, defaults to `false` — every
   * existing caller (Hero tiles, About photo, case-study imagery) renders
   * byte-identical to before this prop existed. When `true` (Work grid's
   * `ProjectCard` opts in), a soft gradient wash fades in on `.group`
   * hover, inside this frame's own rounded/clipped bounds — the "gradient/
   * glass highlight appears subtly" hover trait §11 asks for, implemented
   * once here rather than duplicated at each card call site.
   */
  hoverHighlight?: boolean;
}) {
  const explicitFit = media.kind === "image" ? media.fit : undefined;
  const [autoFit, setAutoFit] = useState<MediaFit | null>(null);
  const fit: MediaFit = explicitFit ?? autoFit ?? "cover";

  const frameRatio = parseRatio(aspectRatio);

  // [Mobile media adaptation] `media.aspect` (CMS-tagged, known at render
  // time — no flash) wins over the client-detected natural ratio (only
  // known once the image has actually loaded).
  const knownAspect = media.kind === "image" ? media.aspect : undefined;
  const [detectedMobileRatio, setDetectedMobileRatio] = useState<string | null>(null);
  const effectiveMobileAspectRatio =
    mobileAspectRatio ??
    (knownAspect
      ? ASPECT_FOR_MEDIA_ASPECT[knownAspect]
      : autoMobileAspect
        ? (detectedMobileRatio ?? undefined)
        : undefined);

  function handleLoad(img: HTMLImageElement) {
    if (!img.naturalWidth || !img.naturalHeight) return;
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    // An explicit per-image `fit` always wins — never override an
    // intentional content-author choice with auto-detection.
    if (!explicitFit && frameRatio) {
      const diff = Math.abs(naturalRatio - frameRatio) / frameRatio;
      setAutoFit(diff > AUTO_CONTAIN_THRESHOLD ? "contain" : "cover");
    }
    // [Mobile media adaptation] Only reached when the caller opted in and
    // no CMS orientation tag exists — the real natural ratio becomes the
    // mobile frame's own ratio, so the frame ends up matching the image
    // almost exactly (no meaningful cropping/letterboxing left either way).
    if (autoMobileAspect && !mobileAspectRatio && !knownAspect) {
      setDetectedMobileRatio(String(naturalRatio));
    }
  }

  return (
    <div
      className={`portfolio-media-frame relative w-full overflow-hidden border border-border bg-background-alt ${radiusClass[radius]} ${className}`}
      style={
        {
          "--pm-aspect": aspectRatio,
          ...(effectiveMobileAspectRatio ? { "--pm-aspect-mobile": effectiveMobileAspectRatio } : {}),
        } as CSSProperties
      }
    >
      {media.kind === "image" ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={(e) => handleLoad(e.currentTarget)}
          style={{ objectFit: fit, objectPosition: media.objectPosition ?? "center" }}
          className="transition-transform duration-[400ms] ease-out group-hover:scale-[1.02]"
        />
      ) : (
        <PlaceholderMedia
          category={media.category}
          alt={media.alt}
          label={placeholderLabel}
          className="transition-transform duration-[400ms] ease-out group-hover:scale-[1.02]"
        />
      )}
      {hoverHighlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/15 via-transparent to-accent/10 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        />
      ) : null}
    </div>
  );
}
