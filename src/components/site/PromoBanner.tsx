import { Button, Container } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { ASPECT } from "@/content/media";
import { accentLastWord } from "@/lib/text/accentLastWord";
import type { BannerVariant } from "@/lib/cms/bannersRepository";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal } from "./ScrollReveal";

/**
 * [Promotional Banner / Campaign System] Shared shape both the public
 * homepage call site (bannersRepository.ts's `PublishedBanner`) and the
 * admin editor's live preview (a draft `AdminPromoBanner` in progress, not
 * yet saved) can satisfy — this component itself never fetches or persists
 * anything, so it renders identically (and can be visually verified)
 * whether its data came from the live database or an admin's unsaved form
 * state. Only a type-only import comes from bannersRepository.ts (erased
 * at compile time), so this stays safe to render from the "use client"
 * admin editor too.
 */
export interface PromoBannerData {
  title: string;
  eyebrow: string | null;
  description: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageDecorative: boolean;
  variant: BannerVariant;
  badgeLabel: string | null;
}

const SECTION_CLASS: Record<BannerVariant, string> = {
  gradient: "bg-surface",
  // [Dark theme fix] Was `bg-ink` — see tokens.css's `--promo-inverted-*`
  // comment for why that literally inverts (white block) once the page
  // itself is already dark. These tokens keep this variant's light-mode
  // appearance pixel-identical while giving dark mode its own correct
  // "stays elevated/distinct from the page" treatment.
  dark: "bg-[var(--promo-inverted-bg)]",
  light: "bg-background-alt",
  image: "bg-surface",
};

const TEXT_CLASS: Record<BannerVariant, { heading: string; body: string; eyebrow: string; badge: string }> = {
  gradient: { heading: "text-ink", body: "text-text-secondary", eyebrow: "text-text-tertiary", badge: "border-border text-text-secondary" },
  dark: {
    heading: "text-[var(--promo-inverted-fg)]",
    body: "text-[var(--promo-inverted-fg-secondary)]",
    eyebrow: "text-[var(--promo-inverted-fg-tertiary)]",
    badge: "border-[var(--promo-inverted-border)] text-[var(--promo-inverted-fg)]",
  },
  light: { heading: "text-ink", body: "text-text-secondary", eyebrow: "text-text-tertiary", badge: "border-border text-text-secondary" },
  image: { heading: "text-ink", body: "text-text-secondary", eyebrow: "text-text-tertiary", badge: "border-border text-text-secondary" },
};

/**
 * Reusable promotional banner — ThanksUX-native composition (eyebrow +
 * headline + supporting text + CTAs on one side, a premium image frame on
 * the other), inspired only by the reference screenshot's proportions/
 * hierarchy per the brief, not its branding or exact design.
 *
 * `variant` controls background treatment only (§6/§16): `gradient` reuses
 * the existing `.atmosphere-cta` wash on `color-surface`, `dark` is a solid
 * `color-ink` block (the primary CTA's flat accent fill already contrasts
 * against it with no override needed — see the Mature Button Design
 * System's tokens.css comment), `light` is a soft `color-background-alt`
 * block, `image` leaves the surface plain so the photography carries the
 * visual weight. No new hex colors anywhere — every value derives from the
 * existing closed palette via already-defined tokens/classes.
 *
 * Mobile order is headline -> supporting text -> CTA -> visual (§2) purely
 * from DOM order: the text column is the first grid child and only gets
 * reordered via `desktop:order-*`, so no JS/media-query branching is
 * needed to satisfy that requirement.
 */
export function PromoBanner({ banner }: { banner: PromoBannerData }) {
  const text = TEXT_CLASS[banner.variant];
  const hasPrimaryCta = Boolean(banner.primaryCtaLabel && banner.primaryCtaUrl);
  const hasSecondaryCta = Boolean(banner.secondaryCtaLabel && banner.secondaryCtaUrl);
  const media = banner.imageUrl
    ? {
        kind: "image" as const,
        src: banner.imageUrl,
        // [§17 accessibility] Admin can mark the image purely decorative —
        // an empty alt is the correct, honest a11y treatment for that case
        // (not "no alt attribute," which would be worse), same convention
        // every other decorative image on the site follows.
        alt: banner.imageDecorative ? "" : banner.imageAlt || banner.title,
      }
    : { kind: "placeholder" as const, category: "campaign" as const, alt: banner.imageDecorative ? "" : banner.title };

  return (
    <section
      className={`relative overflow-hidden border-y border-border py-12 tablet:py-16 ${SECTION_CLASS[banner.variant]}`}
    >
      {banner.variant === "gradient" ? (
        <div className="atmosphere-cta pointer-events-none absolute inset-0" aria-hidden="true" />
      ) : null}

      <Container variant="wide">
        <div className="relative grid grid-cols-1 items-center gap-10 desktop:grid-cols-12 desktop:gap-8">
          <ScrollReveal variant="left" className="desktop:order-1 desktop:col-span-7">
            {banner.badgeLabel ? (
              <span className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${text.badge}`}>
                {banner.badgeLabel}
              </span>
            ) : null}
            {banner.eyebrow ? <p className={`text-label ${banner.badgeLabel ? "mt-3" : ""} ${text.eyebrow}`}>{banner.eyebrow}</p> : null}
            <h2 className={`text-h2 mt-2 max-w-[22ch] ${text.heading}`}>{accentLastWord(banner.title)}</h2>
            {banner.description ? (
              <p className={`text-body-lg mt-4 max-w-[52ch] ${text.body}`}>{banner.description}</p>
            ) : null}

            {hasPrimaryCta || hasSecondaryCta ? (
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {hasPrimaryCta ? (
                  <Button variant="primary" href={banner.primaryCtaUrl!}>
                    {banner.primaryCtaLabel}
                    <ArrowRightIcon className="btn-icon h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : null}
                {hasSecondaryCta ? (
                  <Button
                    variant="secondary"
                    href={banner.secondaryCtaUrl!}
                    className={banner.variant === "dark" ? "!text-[var(--promo-inverted-fg)] hover:!text-accent" : ""}
                  >
                    {banner.secondaryCtaLabel}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </ScrollReveal>

          <ScrollReveal variant="right" delayMs={80} className="desktop:order-2 desktop:col-span-5">
            <div className="relative mx-auto max-w-[420px] desktop:mx-0">
              <div className="banner-glow-orb pointer-events-none absolute -inset-6 opacity-80" aria-hidden="true" />
              <div className="glass-surface relative rounded-lg p-2">
                <PortfolioMedia
                  media={media}
                  aspectRatio={ASPECT.tall}
                  radius="lg"
                  sizes="(min-width: 1200px) 420px, 60vw"
                  placeholderLabel={banner.title}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
