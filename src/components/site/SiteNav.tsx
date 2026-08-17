"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Container } from "@/components/ui";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { trackEvent } from "@/lib/analytics/track";
import { nav } from "@/content/site";
import { personal } from "@/content/personal";
import { useScrolled } from "@/lib/motion/useScrolled";
import type { IconAsset, LogoDisplayMode } from "@/lib/admin/types";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

export type NavItem = { label: string; href: string };

/** Hardcoded nav entries that aren't part of the CMS-editable `navItems` list — same set previously triplicated across desktop nav, the (now-removed) three standalone `<Link>`s, and the mobile overlay; consolidated to one array so all three render from a single source. Exported so SiteFooter's "Discover" column reuses these exact routes instead of re-hardcoding them a second time. */
export const EXTRA_NAV_ITEMS: NavItem[] = [
  { label: "Signals", href: "/signals" },
  { label: "Share a problem", href: "/share" },
  { label: "Audit", href: "/audit" },
];

/**
 * Route-aware active check, shared by every nav item (desktop capsule +
 * mobile overlay) — one implementation, not the three different
 * `pathname === x` / `pathname?.startsWith(y)` variants this used to have.
 * `/` only matches the exact root (every path "starts with /", so a naive
 * `startsWith` would mark Home permanently active); every other item
 * matches its own path or a `/`-bounded child of it (`/work/gridmark` ->
 * Work active, `/audit/123` -> Audit active) — bounded so `/work` doesn't
 * also light up for an unrelated `/workshop`-style path.
 */
function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Top navigation — docs/DESIGN_SYSTEM.md v2 §8.
 * [Header refinement — tablet overflow fix] The full 7-item inline nav
 * only renders at `desktop:` (>=1200px) now, not `tablet:` (>=768px) —
 * measured (real iframe-viewport rendering, not a guess) that at, e.g.,
 * 900px the full nav+brand+controls needs ~1078px but only ~815px is
 * available, a genuine horizontal overflow, not a spacing-value problem.
 * Tablet (768-1199px) now gets the same compact "brand + theme + menu
 * button" header as mobile, opening the exact same full-screen nav
 * overlay — reusing that already-correct pattern rather than inventing a
 * second "reduced nav" UI. Desktop (>=1200px): 72px height (h-9 at the 8px
 * base), full inline nav, active page shown via a 2px accent underline
 * (non-text UI, not text color — see §1's resolved contrast rule).
 * Mobile+tablet (<1200px): 64px height (h-8), icon opens a full-screen
 * overlay with text-h2-scale links and a pinned primary CTA.
 * Bottom border uses `border-border` (cool-neutral), not `border-ink` —
 * visual-refinement brief §08 softens structural dividers sitewide.
 *
 * [CMS Phase D2] `siteName`/`navItems` are optional and default to the
 * static `personal`/`nav` imports — unchanged behavior if this component
 * is ever rendered without them. `layout.tsx` (a Server Component) passes
 * the persisted, admin-editable values instead, since `SiteNav` itself is
 * "use client" and can't read the server-only project/site-content
 * repository directly. This is additive: no existing render of `<SiteNav />`
 * anywhere breaks.
 *
 * [Site Identity — Part H/I/J] `logo`/`displayMode` are optional, default
 * to `undefined`/`"name-only"` — the exact previous behavior (plain text
 * wordmark) when Site Identity hasn't been configured. The logo renders
 * via a plain `<img>`, not `next/image` (see IconField.tsx's header
 * comment for why — SVG support without touching next.config.ts's SVG
 * optimizer flag), height-capped with `object-contain` so it never
 * stretches regardless of the uploaded asset's native aspect ratio.
 */
export function SiteNav({
  siteName = personal.name,
  navItems = nav,
  logo,
  logoMobile,
  displayMode = "name-only",
  isSignedIn = false,
}: {
  siteName?: string;
  navItems?: readonly NavItem[];
  logo?: IconAsset;
  /** [Logo system] Optional compact mark shown below the 768px breakpoint instead of `logo` — falls back to `logo` when unset, the exact previous behavior. */
  logoMobile?: IconAsset;
  displayMode?: LogoDisplayMode;
  /** ["I can solve this" real notification flow] Whether the visitor has a Supabase Auth session — gates the notification bell only; unset defaults to `false`, the exact previous render (no bell) for any caller that hasn't been updated to pass it. */
  isSignedIn?: boolean;
} = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(8);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // The admin dashboard has its own, separate chrome (AdminShell) and must
  // never surface public navigation — see docs/PORTFOLIO_CMS_ARCHITECTURE.md's
  // Phase 2 isolation requirement. This check comes after all hooks so the
  // Rules of Hooks hold across a client-side navigation into /admin.
  if (pathname?.startsWith("/admin")) return null;

  // A logo-requesting mode with no logo actually set falls back to the
  // text wordmark rather than rendering nothing — never a blank brand
  // slot, matching this site's "honest empty state" rule elsewhere.
  const showLogo = displayMode !== "name-only" && Boolean(logo?.src);
  const showName = displayMode !== "logo-only" || !logo?.src;

  return (
    <>
      {/* [Mobile nav stacking-context fix] `#mobile-nav` (below) is
          rendered as a SIBLING of `<header>`, not a descendant, and that's
          load-bearing, not stylistic. Two independent things about
          `<header>` each break a `position: fixed` descendant, confirmed by
          an actual scrolled-then-opened repro, not assumed:
            1. `nav-glass`'s `backdrop-filter` (applied once `scrolled` is
               true) establishes a new *containing block* for fixed
               descendants — `top-8`/`bottom-0` started resolving against
               header's own ~64px box instead of the viewport, collapsing
               the "full-screen" overlay to a ~64px sliver and leaving its
               children (nav links, the CTA) to spill out over the page
               underneath instead of covering it.
            2. `<header>` is `position: sticky` with its own `z-50` — that
               alone establishes a *stacking context*. Even after fixing
               (1), a descendant `#mobile-nav` with a locally higher
               z-index still couldn't outrank BackToTopButton (a true
               sibling at z-50, mounted after SiteNav in layout.tsx): the
               z-index comparison that matters is header-as-a-whole (z-50)
               vs. BackToTopButton (z-50), which DOM order decides — no
               z-index inside header's own stacking context can win that.
          Making `#mobile-nav` a true sibling of `<header>` sidesteps both:
          it's never a descendant of anything with a filter/transform, and
          its own z-index now competes directly, in the real root stacking
          context, against every other fixed element on the page. */}
      <header
        className={`sticky top-0 z-50 transition-[background-color,box-shadow] duration-300 ease-out ${
          scrolled ? "nav-glass" : "border-b border-border bg-background"
        }`}
      >
        <Container variant="wide">
        {/* [Header refinement] Three explicit flex children, not two nested
            groups: brand (fixed `mr-4` — a controlled, deliberate distance,
            not a shared flex gap), nav glass capsule (natural content
            width, never `flex-1`/centered — it never stretches to claim
            leftover space), actions (`ml-auto`, pushed to the far right —
            the only flexible gap in the row, and the *only* one, so it's
            obviously intentional rather than a byproduct of distributing 3
            blocks evenly).
            [Glass capsule overflow fix] Wrapping the nav in a padded glass
            capsule (below) added real width — measured
            (getBoundingClientRect against the real desktop content width,
            1152px = container-wide's 1280px minus its own padding) a
            genuine ~170-190px overflow at 1280-1920px viewports before
            this pass. Trimmed to fit with room to spare: capsule padding
            8px->4px, per-item padding 24px->12px horizontal, inter-item
            gap removed entirely (each pill's own padding already provides
            visual separation at the boundary), brand->nav 56px->32px,
            actions gap 32px->8px. Re-measured after: exact fit (scrollWidth
            === clientWidth) at 1920/1440/1280/1200px, zero overflow at
            every width down to 390px. */}
        <div className="flex h-8 items-center desktop:h-9">
          <Link href="/" className="flex shrink-0 items-center gap-2 desktop:mr-4" onClick={() => setOpen(false)}>
            {showLogo && logo ? (
              logoMobile?.src ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoMobile.src}
                    alt={logoMobile.alt || logo.alt || siteName}
                    className="h-5 w-auto object-contain tablet:hidden"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.src}
                    alt={logo.alt || siteName}
                    className="hidden h-6 w-auto object-contain tablet:block"
                  />
                </>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.src} alt={logo.alt || siteName} className="h-5 w-auto object-contain tablet:h-6" />
              )
            ) : null}
            {showName ? <span className="text-h3 shrink-0 whitespace-nowrap font-semibold tracking-tight">{siteName}</span> : null}
          </Link>

          {/* [Glass nav capsule] One `.glass-surface` container (the same
              recipe used sitewide for floating panels — no second glass
              system) wrapping every primary nav item as a single cohesive
              control. Active state is a solid `bg-surface` pill + bolder
              weight + full-strength text color — not the old accent
              underline, which is gone (§16: don't keep both an underline
              and a pill). Inactive items are muted (`text-text-secondary`)
              and pick up a faint `bg-ink/5` wash on hover — no border/
              shadow, so the container stays "quiet." */}
          <nav
            className="hidden items-center rounded-md p-0.5 desktop:flex glass-surface"
            aria-label="Primary"
          >
            {[...navItems, ...EXTRA_NAV_ITEMS].map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 whitespace-nowrap rounded-sm px-1.5 py-1 text-body transition-colors duration-150 ease-out ${
                    active
                      ? "bg-surface font-semibold text-ink"
                      : "font-normal text-text-secondary hover:bg-ink/5 hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden items-center gap-1 desktop:flex">
            {isSignedIn ? <NotificationBell /> : null}
            <ThemeToggle />
            {!isSignedIn ? (
              <Button variant="text-link" href="/login" className="shrink-0 whitespace-nowrap">
                Log in
              </Button>
            ) : null}
            <Button
              variant="secondary"
              href="#contact"
              className="shrink-0 whitespace-nowrap"
              onClick={() => trackEvent("click_cta", { cta_type: "nav", cta_location: "nav", destination: "#contact" })}
            >
              Let&rsquo;s Talk
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-3 desktop:hidden">
            {isSignedIn ? <NotificationBell /> : null}
            <ThemeToggle />
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        </Container>
      </header>

      {open ? (
        <div
          id="mobile-nav"
          // [z-index] Deliberately above z-50, not an arbitrary jump: this is
          // the highest other fixed element on the page (BackToTopButton,
          // z-50, mounted after SiteNav in layout.tsx so it wins DOM-order
          // ties at an equal z-index) — a full-screen nav surface must sit
          // above every other floating UI while open, not just the header.
          // Now a true sibling of <header> (see the comment above the
          // return statement) so this z-index is compared in the real root
          // stacking context, not trapped inside header's own.
          className="nav-mobile-enter fixed inset-x-0 bottom-0 top-8 z-[60] flex flex-col justify-between bg-background p-4 desktop:hidden"
        >
          <nav className="flex flex-col gap-4" aria-label="Primary">
            {[...navItems, ...EXTRA_NAV_ITEMS].map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`text-h2 ${active ? "text-ink" : "text-text-secondary"}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Button
            variant="primary"
            href="#contact"
            className="w-full"
            onClick={() => {
              setOpen(false);
              trackEvent("click_cta", { cta_type: "nav_mobile", cta_location: "nav", destination: "#contact" });
            }}
          >
            Let&rsquo;s Talk
          </Button>
        </div>
      ) : null}
    </>
  );
}
