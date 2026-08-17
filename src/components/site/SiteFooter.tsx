"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Container } from "@/components/ui";
import { ArrowRightIcon, contactIcons } from "@/components/icons";
import { footerCopyright, nav, positioning } from "@/content/site";
import { personal, socialLinks, type SocialLink } from "@/content/personal";
import { trackEvent } from "@/lib/analytics/track";
import { scrollToTop } from "@/lib/motion/scrollToTop";
import type { AnalyticsEventName } from "@/lib/analytics/events";
import type { IconAsset, LogoDisplayMode } from "@/lib/admin/types";
import { EXTRA_NAV_ITEMS, type NavItem } from "./SiteNav";

function footerClickEvent(icon: SocialLink["icon"]): AnalyticsEventName {
  if (icon === "email") return "click_email";
  if (icon === "whatsapp") return "click_whatsapp";
  return "click_social";
}

/** Small uppercase eyebrow + link list — the three "Explore / Discover / Connect" columns share this one rendering so the column headings/link styling can never drift apart from each other. */
function FooterNavGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-label text-text-tertiary">{title}</p>
      <nav className="mt-4 flex flex-col gap-2.5" aria-label={title}>
        {children}
      </nav>
    </div>
  );
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: ReactNode }) {
  const className = "text-body w-fit text-text-secondary transition-colors duration-150 ease-out hover:text-accent";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Footer — redesigned as a three-layer "closing statement" (premium
 * editorial pass): a closing CTA band, a brand + grouped-navigation grid,
 * then a thin bottom bar. Replaces the previous flat three-column
 * quick-links layout with the same underlying data — no new CMS fields,
 * no invented links; every URL below still comes from the exact same
 * props this component already received (site settings / social links /
 * nav labels), see each prop's own doc comment below.
 *
 * [CMS Phase D2] All props optional, defaulting to the static imports —
 * see SiteNav.tsx's identical pattern/rationale. `layout.tsx` passes the
 * persisted, admin-editable values.
 *
 * [Site Identity] `logo`/`displayMode` mirror SiteNav's — see that
 * component's doc comment. A social link's own `customIcon` (per-channel
 * uploaded SVG/PNG/WEBP) takes precedence over the built-in glyph when set.
 */
export function SiteFooter({
  siteName = personal.name,
  footerBrandName,
  footerPositioning = positioning,
  navItems = nav,
  footerSocialLinks = socialLinks,
  copyrightText = footerCopyright,
  logo,
  displayMode = "name-only",
}: {
  siteName?: string;
  /** [Site Identity] Optional override for the footer's brand-row text specifically — falls back to `siteName` (the same brand name the nav uses) when unset. */
  footerBrandName?: string;
  footerPositioning?: string;
  navItems?: readonly NavItem[];
  footerSocialLinks?: SocialLink[];
  copyrightText?: string;
  logo?: IconAsset;
  displayMode?: LogoDisplayMode;
} = {}) {
  const pathname = usePathname();

  // Same isolation rule as SiteNav — the admin dashboard has its own
  // chrome and must never surface the public footer.
  if (pathname?.startsWith("/admin")) return null;

  const displayName = footerBrandName || siteName;
  const showLogo = displayMode !== "name-only" && Boolean(logo?.src);
  const showName = displayMode !== "logo-only" || !logo?.src;
  const visibleSocial = footerSocialLinks.filter((m) => m.visible !== false);
  const emailLink = visibleSocial.find((m) => m.icon === "email");
  const whatsappLink = visibleSocial.find((m) => m.icon === "whatsapp");

  return (
    <footer className="relative overflow-hidden bg-background-alt">
      <div className="atmosphere-footer pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Layer 1 — closing CTA. Reuses the same #contact target SiteNav's
          own "Let's Talk" button already points at (never a second link
          destination), and the existing restrained Button/text-link
          variants — no new button style. */}
      <div className="relative border-b border-border">
        <Container variant="wide">
          <div className="flex flex-col items-start gap-6 py-12 tablet:py-16 desktop:flex-row desktop:items-center desktop:justify-between">
            <div>
              <h2 className="text-h2 max-w-[20ch]">Have a problem worth solving?</h2>
              <p className="text-body mt-3 max-w-[46ch] text-text-secondary">
                Let&rsquo;s turn the friction into something people actually enjoy using.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
              <Button
                variant="primary"
                href="#contact"
                onClick={() => trackEvent("click_cta", { cta_type: "primary", cta_location: "footer" })}
              >
                Let&rsquo;s work together
                <ArrowRightIcon className="btn-icon h-4 w-4" aria-hidden="true" />
              </Button>
              <Link
                href="/share"
                onClick={() => trackEvent("click_cta", { cta_type: "secondary", cta_location: "footer" })}
                className="text-body text-ink underline underline-offset-4 transition-colors duration-150 ease-out hover:text-accent"
              >
                Share a problem
              </Link>
            </div>
          </div>
        </Container>
      </div>

      {/* Layer 2 — brand + grouped navigation. Social block is placed last
          in source order so it lands after Connect on a single-column
          mobile stack; `desktop:col-start-1 desktop:row-start-2` pulls it
          back under the brand column once there's room for a real grid. */}
      <Container variant="wide" className="relative">
        <div className="grid grid-cols-1 gap-8 py-12 tablet:grid-cols-2 tablet:gap-10 tablet:py-16 desktop:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              {showLogo && logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.src} alt={logo.alt || displayName} className="h-6 w-auto object-contain" />
              ) : null}
              {showName ? <p className="text-h3">{displayName}</p> : null}
            </div>
            <p className="text-body mt-3 max-w-[36ch] text-text-secondary">{footerPositioning}</p>
          </div>

          <FooterNavGroup title="Explore">
            {navItems.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterNavGroup>

          <FooterNavGroup title="Discover">
            {EXTRA_NAV_ITEMS.map((item) => (
              <FooterLink key={item.href} href={item.href}>
                {item.label}
              </FooterLink>
            ))}
          </FooterNavGroup>

          <FooterNavGroup title="Connect">
            <FooterLink href="#contact">Let&rsquo;s Talk</FooterLink>
            {emailLink ? <FooterLink href={emailLink.href}>Email</FooterLink> : null}
            {whatsappLink ? (
              <FooterLink href={whatsappLink.href} external>
                WhatsApp
              </FooterLink>
            ) : null}
          </FooterNavGroup>

        </div>

        {/* [Bug fix] Was placed inside the 4-column grid's brand cell
            (`desktop:col-start-1`) — that cell measures ~306px on a real
            desktop viewport (confirmed via getBoundingClientRect), and
            each icon's *actual* hit area was `h-9 w-9` = 72x72px in this
            project's 8px spacing scale (not the 36px a default 4px scale
            would give — the miscalculation that caused this bug). 5 icons
            at 72px each need ~390px, so they wrapped after 3. Fixed two
            ways: icons resized to the 40x44px range the design spec always
            called for (`h-5 w-5` = 40px hit area, `h-3 w-3` = 24px glyph —
            the exact ratio the pre-redesign footer used), and the row
            moved out of the constrained grid cell to its own full-width
            flex row, so it always has the entire container's width to lay
            out in — never wraps on any real desktop/tablet size again. */}
        <div className="flex flex-wrap items-center gap-1 pb-12 tablet:pb-16" role="list" aria-label="Social links">
          {visibleSocial.map((method) => {
            const Icon = contactIcons[method.icon];
            const external = method.href.startsWith("http");
            return (
              <a
                key={method.label}
                href={method.href}
                aria-label={method.label}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                onClick={() => trackEvent(footerClickEvent(method.icon), { platform: method.icon, cta_location: "footer" })}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-transparent text-ink transition-colors duration-150 ease-out hover:border-border hover:bg-surface hover:text-accent focus-visible:shadow-focus focus-visible:outline-none"
              >
                {method.customIcon?.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={method.customIcon.src} alt="" className="h-3 w-3 object-contain" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
              </a>
            );
          })}
        </div>

        {/* Layer 3 — bottom bar. */}
        <div className="flex flex-col gap-3 border-t border-border py-6 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <p className="text-caption">{copyrightText}</p>
            <p className="text-caption mt-0.5 text-text-tertiary">Designed &amp; built with intention.</p>
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex w-fit items-center gap-1.5 text-caption text-text-secondary transition-colors duration-150 ease-out hover:text-accent focus-visible:shadow-focus focus-visible:outline-none"
          >
            Back to top
            <ArrowRightIcon className="h-3 w-3 -rotate-90" aria-hidden="true" />
          </button>
        </div>
      </Container>
    </footer>
  );
}
