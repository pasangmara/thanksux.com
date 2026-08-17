import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AnalyticsRuntime } from "@/components/analytics/AnalyticsRuntime";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteNav } from "@/components/site/SiteNav";
import { BackToTopButton } from "@/components/site/BackToTopButton";
import { personal } from "@/content/personal";
import { positioning } from "@/content/site";
import { MarketingConfigProvider } from "@/lib/analytics/MarketingConfigProvider";
import { getAboutContent, getMarketingSettings, getSiteSettings } from "@/lib/cms/siteContentRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

// [Theme system] Prevents a light->dark (or dark->light) flash on first
// paint. Must run as a blocking, synchronous inline script in <head> —
// before any CSS paints — since ThemeProvider itself only runs after
// React hydrates, which is too late to avoid a visible flash. Reads the
// exact same localStorage key ThemeProvider writes
// (THEME_STORAGE_KEY = "thanksux-theme", inlined as a literal here since
// this script runs standalone, outside the React/module graph) and sets
// the same `data-theme` attribute tokens.css's `:root[data-theme="..."]`
// blocks key off. No stored preference -> no attribute set -> the existing
// automatic `prefers-color-scheme` CSS handles it, unchanged.
const themeInitScript = `(function(){try{var t=localStorage.getItem("thanksux-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

// Body face — DESIGN_SYSTEM.md §2 (regular + medium weights only).
// Self-hosted automatically by next/font, no external request at runtime.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * [CMS bugfix] `description` reads the persisted, admin-editable
 * `settings.siteDescription` (/admin/settings → "Site Description")
 * instead of a hardcoded literal that only ever matched that field's
 * *seeded* value, then silently diverged the moment an admin edited it —
 * `saveSettings()`/`data/settings.json` always persisted the edit
 * correctly; this route just never read it back. Required converting
 * `metadata` from a static export to `generateMetadata()`, since a static
 * object literal is evaluated once at build/module-load time and can't
 * read per-request data — every other CMS-backed route's metadata
 * (work/[slug], /about, /contact) already uses this same async pattern.
 * Falls back to `positioning` (the exact text the old hardcoded literal
 * always held) if Site Description is ever saved empty, so clearing the
 * field can't produce a blank <meta description>.
 *
 * [Site Identity — Part J] `title` now reads `settings.siteTitle` (falling
 * back to the exact previous literal, `${personal.name} — Portfolio}`, if
 * ever saved empty) — the one-line follow-up an earlier pass explicitly
 * deferred ("that field has the same disconnect ... wiring it is a
 * one-line follow-up left for a deliberate decision"). This is that
 * deliberate decision: Site Identity is the intended source for default
 * page-title metadata (Part J), so the disconnect is now closed.
 *
 * [Site Identity — Site URL] `metadataBase` now reads `settings.siteUrl`
 * when set and a valid absolute URL — closes a real, previously-unfixable
 * gap: every route's OG/canonical metadata was silently resolving against
 * Next's dev-only "http://localhost:3000" fallback (confirmed via Next's
 * own build warning), with no admin field to ever change that in
 * production. Invalid/unset values fall back to that exact previous
 * behavior (`metadataBase` simply omitted) — never a thrown error from a
 * malformed URL an admin might type.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const fallbackTitle = `${personal.name} — Portfolio`;
  let metadataBase: URL | undefined;
  if (settings.siteUrl) {
    try {
      metadataBase = new URL(settings.siteUrl);
    } catch {
      metadataBase = undefined;
    }
  }
  return {
    title: settings.siteTitle || fallbackTitle,
    description: settings.siteDescription || positioning,
    icons: settings.favicon?.src ? { icon: settings.favicon.src } : undefined,
    metadataBase,
  };
}

// [CMS Phase D2] Async — fetches the persisted, admin-editable site
// name/nav/footer content once per request and passes it down to SiteNav/
// SiteFooter (both "use client", so they can't read the server-only
// repository themselves — see those components' own doc comments).
//
// [Site Identity — Part H/J] `siteName` now resolves to
// `settings.brandName` when set, falling back to About's `name` otherwise
// — see SiteSettings.brandName's doc comment (lib/admin/types.ts) for why
// the two are deliberately distinct fields. `logo`/`logoDisplayMode` pass
// straight through to SiteNav/SiteFooter, both already defaulting to
// today's exact text-only behavior when unset.
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [about, settings, marketing, currentUser] = await Promise.all([
    getAboutContent(),
    getSiteSettings(),
    getMarketingSettings(),
    // ["I can solve this" real notification flow, Part G] Only used to
    // decide whether SiteNav renders the notification bell wrapper at
    // all — the bell's own client-side fetch to /api/community/notifications
    // is the real, live source of truth for its count/list.
    getCurrentPublicUser(),
  ]);
  const brandName = settings.brandName || about.name;

  return (
    // [Theme system] `suppressHydrationWarning` is scoped to this one element
    // and, per React, only suppresses the mismatch warning for `<html>`'s own
    // attributes — not its children. The theme-init script below deliberately
    // sets `data-theme` on this exact tag before hydration runs, so its value
    // will legitimately differ from the server-rendered markup; without this,
    // React logs a false-positive hydration error every time a visitor has a
    // stored preference.
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* [Theme system] Must be the first thing in <head> — blocks paint
            until it runs, so `data-theme` is set (or not) before any CSS
            using tokens.css's theme-conditioned custom properties applies.
            `next/script` with `beforeInteractive` (not a raw `<script>` tag)
            — Next's App Router injects/dedupes this specially so it runs
            once during the initial HTML parse without React logging a
            "scripts inside React components are never executed on the
            client" warning on every subsequent client render. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {/*
          [Perf] `preconnect` (+ `dns-prefetch` fallback for browsers that
          don't support Resource Hints' priority form) starts the DNS/TCP/
          TLS handshake to Fontshare's origin immediately, in parallel with
          the rest of <head> parsing, instead of only once the browser
          reaches the <link rel="stylesheet"> below — same origin, so one
          hint covers both the CSS and the font files it references. This
          doesn't change what loads or how it looks, only how early the
          connection starts.
        */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.fontshare.com" />
        {/*
          Display face — General Sans (DESIGN_SYSTEM.md §2, medium + semibold
          only). Not distributed via Google Fonts or an npm/Fontsource
          package, so it's loaded from Fontshare's CDN (same pattern as a
          Google Fonts <link>) rather than self-hosted via next/font/local.
          Swap this for next/font/local once licensed font files are
          downloaded directly, if fully self-hosting becomes a requirement.
        */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=general-sans@500,600&display=swap"
        />
      </head>
      <body>
        <ThemeProvider>
          <MarketingConfigProvider settings={marketing}>
            <SiteNav
              siteName={brandName}
              navItems={settings.navLabels}
              logo={settings.logo}
              logoMobile={settings.logoMobile}
              displayMode={settings.logoDisplayMode}
              isSignedIn={Boolean(currentUser)}
            />
            {children}
            <SiteFooter
              siteName={brandName}
              footerBrandName={settings.footerBrandName}
              footerPositioning={settings.positioning}
              navItems={settings.navLabels}
              // [Phase 7 — placeholder hygiene] Filtered here, server-side,
              // not just inside SiteFooter's own render — a disabled
              // (visible: false) placeholder link's raw href/value should
              // never even reach the client bundle's RSC payload, not just
              // be hidden from the rendered DOM. SiteFooter's own
              // `.filter((m) => m.visible !== false)` stays as a second,
              // harmless no-op guard, same defense-in-depth posture this
              // project already uses elsewhere (e.g. admin-only fields never
              // passed to a public component in the first place).
              footerSocialLinks={settings.socialLinks.filter((link) => link.visible !== false)}
              copyrightText={settings.footerText}
              logo={settings.logo}
              displayMode={settings.logoDisplayMode}
            />
            <BackToTopButton />
            <AnalyticsRuntime />
          </MarketingConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
