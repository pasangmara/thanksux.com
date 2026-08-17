import Link from "next/link";
import type { Project } from "@/types/project";
import { ASPECT } from "@/content/media";
import { ArrowRightIcon } from "@/components/icons";
import { PortfolioMedia } from "./PortfolioMedia";

/**
 * Project Card — docs/DESIGN_SYSTEM.md v2 §7, extended with a `variant`
 * prop for the Featured Work hierarchy (homepage polish brief §03), and a
 * `contentMode` prop for the Work page's editorial masonry grid (§08 of
 * that brief: "content below" vs. a selective "content overlay" mode).
 *
 * The title is always `text-h3` regardless of variant/mode — DESIGN_SYSTEM.md
 * §2 states, verbatim, "a project card title may never use text-h2." An
 * earlier version of this component broke that rule to make the primary
 * card "feel bigger"; hierarchy here comes from the wider image, the
 * larger `text-body-lg` summary, and a "Featured" label instead — real
 * visual weight without reaching up a heading level. `contentMode="overlay"`
 * keeps that same rule; it only changes where the text sits, never its size.
 *
 * The image carries a persistent subtle border + radius-md via
 * PortfolioMedia (visual-refinement brief §05 — border is a "card" trait
 * now, not hover-only). Image scales 1.02 on hover (400ms ease-out) — the
 * single sitewide hover treatment, per the v2 audit's resolved decision.
 * Entire card is the click target.
 */
export function ProjectCard({
  project,
  variant = "secondary",
  aspectRatio,
  radius,
  contentMode = "below",
}: {
  project: Project;
  variant?: "primary" | "secondary";
  /** Overrides the variant's default aspect ratio — for editorial showcase layouts that need a specific shape. */
  aspectRatio?: string;
  /** Overrides the default radius-md — e.g. radius-lg for a large editorial lead card. */
  radius?: "sm" | "md" | "lg";
  /**
   * [Work page masonry §08] `"below"` (default) is the original, unchanged
   * layout — every existing call site (homepage showcases, WorkGrid's
   * medium tier) renders byte-identical since none of them pass this prop.
   * `"overlay"` renders category/title/arrow directly on top of the image
   * with a bottom scrim, for selective editorial use on a grid's one
   * feature cell — never the default, per the brief's "do not make every
   * project use overlay."
   */
  contentMode?: "below" | "overlay";
}) {
  const isPrimary = variant === "primary";
  const isOverlay = contentMode === "overlay";
  const meta = [String(project.year), ...project.tags.slice(0, 2)].join(" · ");

  if (isOverlay) {
    return (
      <Link href={`/work/${project.slug}`} className="lift-on-hover group relative block overflow-hidden rounded-lg">
        <PortfolioMedia
          media={project.thumbnail ?? project.coverImage}
          aspectRatio={aspectRatio ?? ASPECT.wide}
          radius={radius ?? "lg"}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-ink/85 via-ink/10 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 tablet:p-6">
          <div>
            <p className="text-label text-on-ink/75">
              {project.category}
              {isPrimary ? " · Featured" : ""}
            </p>
            <h3 className="text-h3 mt-2 text-on-ink">{project.title}</h3>
          </div>
          <ArrowRightIcon
            className="btn-icon h-5 w-5 shrink-0 text-on-ink transition-transform duration-200 ease-out group-hover:translate-x-1"
            aria-hidden="true"
          />
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/work/${project.slug}`} className="lift-on-hover group block rounded-lg">
      <PortfolioMedia
        media={project.thumbnail ?? project.coverImage}
        aspectRatio={aspectRatio ?? (isPrimary ? ASPECT.wide : ASPECT.card)}
        // [Mobile media adaptation — Featured Work portrait fix] Only the
        // primary card's own *default* wide frame (no caller-supplied
        // `aspectRatio` override) adapts on mobile — an explicit override
        // is a deliberate editorial choice elsewhere (e.g. WorkGrid's lead
        // card) that this doesn't second-guess. Desktop/tablet always keep
        // the wide collage shape; see PortfolioMedia.tsx / layout.css for
        // how mobile-only adaptation is guaranteed structurally.
        autoMobileAspect={isPrimary && !aspectRatio}
        radius={radius ?? (isPrimary ? "lg" : "md")}
        hoverHighlight
      />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-label">
            {project.category}
            {isPrimary ? " · Featured" : ""}
          </p>
          <h3 className="text-h3 mt-2">{project.title}</h3>
          <p className={`${isPrimary ? "text-body-lg max-w-[48ch]" : "text-body max-w-[60ch]"} mt-1.5 text-text-secondary`}>
            {project.shortDescription}
          </p>
        </div>
      </div>
      <p className="text-caption mt-3">{meta}</p>
    </Link>
  );
}
