import { Button, Container } from "@/components/ui";
import { ASPECT } from "@/content/media";
import type { Project } from "@/types/project";
import { ProjectCard } from "./ProjectCard";
import { ScrollReveal } from "./ScrollReveal";

/**
 * [Work page editorial masonry] Asymmetric project grid — Work page brief
 * §01/§10/§11: varied visual weights instead of one uniform card grid,
 * driven entirely by the existing `featured`/`featuredOrder`/`order`
 * fields (no schema change, no invented layout data on `Project`).
 *
 * Layout mechanism, deliberately NOT a JS masonry library or forced
 * equal-height `grid-row` spanning (real cards have variable-length
 * descriptions/titles — spanning rows to a fixed pixel height would either
 * crop content or leave ragged gaps): a plain 3-column CSS Grid at desktop
 * with `grid-auto-flow: dense` (`desktop:grid-flow-row-dense`), where
 * asymmetry comes from `col-span` variety (1 or 2 of 3 columns) and
 * varied image aspect ratios (tall/standard/wide) instead. `dense` is the
 * standard native-CSS way to backfill the gaps that variety would
 * otherwise leave (the same technique Pinterest-style CSS grids use) — one
 * trade-off worth stating: dense packing can visually reorder a card
 * relative to the curated DOM order to fill a gap, exactly like any
 * CSS-native masonry grid. Tablet drops to 2 columns, mobile to a single,
 * unreordered column in the same curated order — §11/§12's explicit
 * "reduce complexity, don't preserve desktop masonry on mobile" rule.
 *
 * - Lead: the single top-ranked featured project (by featuredOrder) — the
 *   one deliberately overlay-mode ("Mode B", ProjectCard's `contentMode`)
 *   cell, spanning 2 of 3 columns, 16:9-ish `ASPECT.wide`.
 * - Everything else cycles through 3 "Mode A" (below) variants — tall
 *   (3:4, 1 column), standard (4:3, 1 column), wide (16:9, 2 columns) — so
 *   neighboring cards read as visually varied without any per-project
 *   stored "size" field.
 */
const REST_VARIANTS = [
  { key: "tall", aspectRatio: ASPECT.tall, colSpan: "desktop:col-span-1" },
  { key: "standard", aspectRatio: ASPECT.card, colSpan: "desktop:col-span-1" },
  { key: "wide", aspectRatio: ASPECT.galleryFull, colSpan: "desktop:col-span-2" },
] as const;

export function WorkGrid({ projects, categoryLabel }: { projects: Project[]; categoryLabel: string }) {
  if (projects.length === 0) {
    return <EmptyState categoryLabel={categoryLabel} />;
  }

  const sorted = [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.featured && b.featured) return (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0);
    return a.order - b.order;
  });
  const [lead, ...rest] = sorted;

  return (
    <Container variant="wide">
      <div className="grid grid-cols-1 gap-[20px] py-8 tablet:grid-cols-2 tablet:py-12 desktop:grid-cols-3 desktop:grid-flow-row-dense desktop:gap-[24px]">
        {lead ? (
          <ScrollReveal variant="scale" className="tablet:col-span-2 desktop:col-span-2">
            <ProjectCard project={lead} variant="primary" contentMode="overlay" aspectRatio={ASPECT.wide} radius="lg" />
          </ScrollReveal>
        ) : null}

        {rest.map((project, i) => {
          const v = REST_VARIANTS[i % REST_VARIANTS.length];
          return (
            <ScrollReveal key={project.slug} delayMs={(i % 3) * 60} className={v.colSpan}>
              <ProjectCard project={project} aspectRatio={v.aspectRatio} />
            </ScrollReveal>
          );
        })}
      </div>
    </Container>
  );
}

/**
 * DESIGN_SYSTEM.md §14's already-documented empty-state pattern, reused
 * as specified: "centered text-body-lg message in color-text-secondary...
 * plus a Text Link back to All."
 */
function EmptyState({ categoryLabel }: { categoryLabel: string }) {
  return (
    <Container variant="wide">
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background-alt px-6 py-16 text-center">
        <p className="text-body-lg text-text-secondary">
          No {categoryLabel ? `${categoryLabel} ` : ""}projects published yet — check back soon.
        </p>
        {categoryLabel ? (
          <Button variant="text-link" href="/work">
            View all work
          </Button>
        ) : null}
      </div>
    </Container>
  );
}
