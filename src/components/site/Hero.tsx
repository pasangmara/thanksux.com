import { Container } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ASPECT } from "@/content/media";
import { getAboutContent, getHeroContent } from "@/lib/cms/siteContentRepository";
import { accentLastWord } from "@/lib/text/accentLastWord";
import type { HeroVisual } from "@/lib/admin/types";
import { Animated } from "./Animated";
import { HeroEntrance } from "./HeroEntrance";
import { HeroParallax } from "./HeroParallax";
import { PortfolioMedia } from "./PortfolioMedia";

/**
 * [Phase J — parallel/multi-element animation] Scroll-linked parallax
 * strength for one Hero visual tile — `HeroParallax.tsx`'s existing
 * mechanism reads `data-parallax-depth` as a small multiplier (its own
 * `progress * depth * 10` math), unchanged. When a tile's own
 * `animation.type` is `"parallax"`, its `distance` field (the same
 * px-of-movement unit every other preset's `distance` already means) is
 * translated into that multiplier so admin-set values compose with the
 * existing engine instead of introducing a second one — see Animated.tsx's
 * header comment for why parallax specifically stays out of that
 * component. Falls back to each tile's original hardcoded depth (1/2/3/2)
 * so the desktop grid's default motion is unchanged for any tile that
 * hasn't been given a `"parallax"` animation explicitly.
 */
function parallaxDepth(visual: HeroVisual, fallback: number): number {
  if (visual.animation?.type === "parallax" && typeof visual.animation.distance === "number") {
    return visual.animation.distance / 10;
  }
  return fallback;
}

/**
 * Hero — Split Proof Hero (Blueprint §05 Concept 2, restated verbatim in
 * PROJECT_SPEC.md §4.1). The composition reuses the actual coverImage from
 * the top 3 featured projects rather than unrelated decorative tiles, so
 * the hero reads as a preview of real work shown in full below it, not a
 * disconnected illustration — plus one standalone typography tile as the
 * site's own type-craft signature piece.
 *
 * Three distinct compositions per breakpoint (not one layout scaled down):
 * mobile shows a single strongest tile, tablet a condensed 2-tile row,
 * desktop the full 4-tile exhibition grid beside the headline.
 *
 * [CMS architecture correction] Headline/description/both CTAs now render
 * `HeroContent` (data/hero.json, edited at /admin/hero) — its own
 * dedicated content record, not a borrowed Site Settings field. A prior
 * pass wired the headline to `settings.positioning`, reasoning it was "the
 * same text at the time" — but Positioning Statement is Settings'
 * global/footer field (its own admin help text says "Shown in the footer,
 * under the site name"), not Hero copy; that wiring changed the footer's
 * meaning by proxy any time Hero-specific copy needed to differ from the
 * footer tagline, which is exactly backwards. `settings.differentiator`
 * and the hardcoded `heroCtas` constant (src/content/site.ts, removed)
 * had the same problem: real content with no dedicated Hero-owned field.
 * Natural wrapping (no manual per-word `<br>` insertion) is the same
 * approach every other headline on the site already uses; a fixed
 * line-break split can't be precomputed for text an admin can freely
 * rewrite.
 *
 * Eyebrow still defaults to `about.name`/`about.roles` (About's own
 * fields — always correct, never duplicated) unless `hero.eyebrow` is
 * explicitly set as an override.
 *
 * [Homepage CMS completion] The visual grid's 4 fixed slots (tall, square,
 * square, wide — layout unchanged) are now filled from `hero.visuals`
 * (data/hero.json, edited at /admin/homepage §3), sorted by `order` and
 * filtered to `visible`, instead of the previous automatic "top 3 featured
 * projects + 1 fixed typography tile" composition. Fewer than 4 visible
 * visuals falls back to an honest, unlabeled placeholder per empty slot —
 * same pattern the rest of the site already uses for missing imagery, per
 * docs/PROJECT_EDITOR_ARCHITECTURE.md's "never invent an image" rule. A
 * visual with `href` set is a click target (wrapped in a Link); one
 * without renders as a static tile, exactly like before this field existed.
 */
function HeroVisualTile({
  visual,
  aspectRatio,
  radius,
  className = "",
  priority = false,
  autoMobileAspect = false,
}: {
  visual: HeroVisual;
  aspectRatio: string;
  radius?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
  /**
   * [Mobile media adaptation — Hero single-tile portrait fix] Opt-in,
   * defaults to `false` — the tablet 2-tile row and desktop 4-tile
   * exhibition grid (both >=768px) render unchanged. Only the mobile
   * single-tile (`tileA` below `tablet:hidden`) opts in, so a portrait
   * hero visual gets a portrait-shaped frame on mobile instead of being
   * squeezed into the fixed `ASPECT.card` (4:3) frame every tile uses —
   * same mechanism ProjectCard's primary Featured Work card already uses,
   * see PortfolioMedia.tsx.
   */
  autoMobileAspect?: boolean;
}) {
  const media = (
    <PortfolioMedia
      media={visual.image}
      aspectRatio={aspectRatio}
      radius={radius}
      className={className}
      priority={priority}
      placeholderLabel={visual.title || undefined}
      autoMobileAspect={autoMobileAspect}
    />
  );
  return visual.href ? (
    <TrackedLink
      href={visual.href}
      className="group block"
      ariaLabel={visual.title || undefined}
      ctaType="hero_visual"
      location="hero"
      eventParams={{ cta_name: visual.title || undefined }}
    >
      {media}
    </TrackedLink>
  ) : (
    media
  );
}

export async function Hero() {
  const [about, hero] = await Promise.all([getAboutContent(), getHeroContent()]);

  const slots = [...hero.visuals]
    .filter((v) => v.visible)
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);

  const emptySlot = (category: "brand-mark" | "ui-screen" | "typography" | "campaign"): HeroVisual => ({
    id: `empty-${category}`,
    image: { kind: "placeholder", category, alt: "Hero visual — not set yet" },
    title: "",
    order: 0,
    visible: true,
  });

  const [tileA, tileB, tileC, tileD] = [
    slots[0] ?? emptySlot("brand-mark"),
    slots[1] ?? emptySlot("ui-screen"),
    slots[2] ?? emptySlot("typography"),
    slots[3] ?? emptySlot("campaign"),
  ];

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="atmosphere-hero pointer-events-none absolute inset-0" aria-hidden="true" />
      <Container variant="wide">
        <div className="hero-entrance relative grid grid-cols-1 gap-8 py-8 tablet:py-12 desktop:grid-cols-12 desktop:items-center desktop:gap-6 desktop:py-16">
          <HeroEntrance className="desktop:col-span-7">
            <p className="text-label" data-hero-entrance="1">
              {hero.eyebrow || `${about.name} — ${about.roles.join(" · ")}`}
            </p>
            <h1 className="text-display mt-4" data-hero-entrance="2">
              {accentLastWord(hero.headline)}
            </h1>
            <p className="text-body-lg mt-4 max-w-[46ch] text-text-secondary" data-hero-entrance="3">
              {hero.description}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4" data-hero-entrance="4">
              {hero.primaryCtaVisible ? (
                <TrackedCTA
                  variant="primary"
                  href={hero.primaryCtaUrl}
                  target={hero.primaryCtaOpenInNewTab ? "_blank" : undefined}
                  rel={hero.primaryCtaOpenInNewTab ? "noreferrer" : undefined}
                  ctaType="primary"
                  location="hero"
                >
                  {hero.primaryCtaLabel}
                  <ArrowRightIcon className="btn-icon h-4 w-4" aria-hidden="true" />
                </TrackedCTA>
              ) : null}
              {hero.secondaryCtaVisible ? (
                <TrackedCTA
                  variant="text-link"
                  href={hero.secondaryCtaUrl}
                  target={hero.secondaryCtaOpenInNewTab ? "_blank" : undefined}
                  rel={hero.secondaryCtaOpenInNewTab ? "noreferrer" : undefined}
                  ctaType="secondary"
                  location="hero"
                >
                  {hero.secondaryCtaLabel}
                </TrackedCTA>
              ) : null}
            </div>
          </HeroEntrance>

          <HeroParallax className="desktop:col-span-5">
            {/* Mobile: single strongest tile */}
            <div className="tablet:hidden">
              <Animated config={tileA.animation} index={0}>
                <HeroVisualTile visual={tileA} aspectRatio={ASPECT.card} radius="lg" priority autoMobileAspect />
              </Animated>
            </div>

            {/* Tablet: condensed 2-tile row */}
            <div className="hidden gap-4 tablet:grid tablet:grid-cols-2 desktop:hidden">
              <Animated config={tileA.animation} index={0}>
                <HeroVisualTile visual={tileA} aspectRatio={ASPECT.card} radius="md" priority />
              </Animated>
              <Animated config={tileB.animation} index={1}>
                <HeroVisualTile visual={tileB} aspectRatio={ASPECT.card} radius="md" />
              </Animated>
            </div>

            {/* Desktop: full exhibition grid — each tile's own `animation`
                config plays independently (parallel), see parallaxDepth()
                above for how a "parallax"-typed tile's motion composes
                with HeroParallax's existing scroll-linked mechanism. */}
            <div className="hidden desktop:grid desktop:grid-cols-2 desktop:gap-4">
              <div className="row-span-2" data-parallax-depth={parallaxDepth(tileA, 1)}>
                <Animated config={tileA.animation} index={0} className="h-full">
                  <HeroVisualTile visual={tileA} aspectRatio="auto" radius="lg" className="h-full" priority />
                </Animated>
              </div>
              <div data-parallax-depth={parallaxDepth(tileB, 2)}>
                <Animated config={tileB.animation} index={1}>
                  <HeroVisualTile visual={tileB} aspectRatio={ASPECT.square} radius="md" />
                </Animated>
              </div>
              <div data-parallax-depth={parallaxDepth(tileC, 3)}>
                <Animated config={tileC.animation} index={2}>
                  <HeroVisualTile visual={tileC} aspectRatio={ASPECT.square} radius="md" />
                </Animated>
              </div>
              <div className="col-span-2" data-parallax-depth={parallaxDepth(tileD, 2)}>
                <Animated config={tileD.animation} index={3}>
                  <HeroVisualTile visual={tileD} aspectRatio={ASPECT.wide} radius="lg" />
                </Animated>
              </div>
            </div>

            <p className="text-caption mt-3 hidden tablet:block">
              Selected work, shown in full below.
            </p>
          </HeroParallax>
        </div>
      </Container>
    </section>
  );
}
