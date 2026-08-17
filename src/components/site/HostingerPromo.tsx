import { WebsiteIcon } from "@/components/icons";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import { Container } from "@/components/ui";
import { ScrollReveal } from "./ScrollReveal";

/**
 * [Hostinger referral promo] Static, homepage-only placement between Hero
 * and FeaturedWork — deliberately not wired into the CMS-driven
 * PromoBanner/bannersRepository system (PromoBannerSection), which is a
 * separate, admin-editable campaign mechanism placed after FeaturedWork.
 * This is a single fixed personal referral, so a plain component is the
 * honest amount of infrastructure, not a second CMS-backed banner.
 *
 * Compact, bordered `.glass-surface` card rather than a full atmosphere
 * section (contrast with PromoBanner's full-bleed treatment) so it reads
 * as a quiet aside, not a second hero-scale announcement competing with
 * the actual Hero above it.
 */
const HOSTINGER_REFERRAL_URL = "https://www.hostinger.com?REFERRALCODE=NB0PASANGUZL";

export function HostingerPromo() {
  return (
    <section className="py-6 tablet:py-8">
      <Container variant="wide">
        <ScrollReveal variant="fade">
          <div className="glass-surface flex flex-col gap-5 rounded-lg px-6 py-6 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-8 tablet:px-8">
            <div className="flex items-start gap-4">
              <span
                className="hidden h-10 w-10 flex-none items-center justify-center rounded-sm border border-border text-text-secondary tablet:flex"
                aria-hidden="true"
              >
                <WebsiteIcon className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-h3">Building a website?</p>
                  <span className="inline-flex rounded-sm border border-border px-2 py-0.5 text-caption text-text-secondary">
                    20% OFF
                  </span>
                </div>
                <p className="text-body mt-1 max-w-[52ch] text-text-secondary">
                  Get 20% off your first Hostinger plan through my referral.
                </p>
                <p className="text-caption mt-2 text-text-tertiary">
                  Referral link — I may earn a commission at no extra cost to you.
                </p>
              </div>
            </div>
            <TrackedCTA
              variant="primary"
              href={HOSTINGER_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              ctaType="hostinger_referral"
              location="homepage_promo"
              className="flex-none self-start tablet:self-auto"
            >
              Get 20% OFF
            </TrackedCTA>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
