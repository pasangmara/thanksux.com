"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { PublicUser } from "@/types/auth";
import type { IconAsset } from "@/lib/admin/types";
import { SignalLiveDot } from "./SignalLiveDot";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin" },
  { label: "Homepage", href: "/admin/homepage" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Reviews", href: "/admin/reviews" },
  { label: "Banners", href: "/admin/banners" },
  { label: "About", href: "/admin/about" },
  { label: "Contact", href: "/admin/contact" },
  { label: "Leads / CRM", href: "/admin/leads" },
  { label: "ThanksSignals", href: "/admin/signals" },
  { label: "Contributions", href: "/admin/contributions" },
  { label: "Marketing", href: "/admin/marketing" },
  { label: "Site Settings", href: "/admin/settings" },
] as const;

const UNAUTHENTICATED_PATHS = ["/admin/login", "/admin/setup"];

/**
 * Admin shell — Phase 2 local CMS prototype, extended in Phase 1 with a
 * real identity.
 *
 * [Phase 1 — Authentication Foundation] The banner text below used to
 * read "No authentication" — now false, updated to reflect the real
 * current posture (real login required, but still no rate limiting on
 * most admin actions, no CSRF token, no audit log — a deliberately scoped
 * foundation, not a claim of full production hardening). Route
 * protection itself lives in `proxy.ts` + each API route's own
 * `requireAdmin()` call, not here — this component only displays who's
 * logged in and offers Logout; it is not itself a security boundary.
 *
 * Deliberately its own, separate chrome: no SiteNav/SiteFooter (those
 * self-hide on /admin/* routes — see SiteNav.tsx / SiteFooter.tsx), and
 * never linked from public navigation. This is an internal tool, isolated
 * on purpose, not a redesign of the public site.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [newSignalCount, setNewSignalCount] = useState<number | null>(null);
  const [adminLogo, setAdminLogo] = useState<IconAsset | undefined>(undefined);
  const isAuthPage = UNAUTHENTICATED_PATHS.some((p) => pathname === p);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { user: PublicUser | null }) => setUser(data.user))
      .catch(() => setUser(null));
  }, [pathname]);

  // [Signal media attachments Part F/H + Admin Dashboard Brand Identity —
  // perf consolidation] Both the signals live-dot count and the admin
  // logo are re-fetched on every navigation, not just once, so they never
  // go stale after moderating a signal or saving a new logo elsewhere —
  // unchanged behavior. What changed: these used to be two separate
  // `fetch()`s (`/api/admin/signals/counts`, `/api/admin/settings`), each
  // running its own full `requireAdmin()` auth check (a session lookup +
  // a user lookup) before doing its own query — 2 auth checks + 2 round
  // trips for data that's always needed together. Now one `/api/admin/
  // shell` call does one `requireAdmin()` and returns both — same data,
  // same security boundary, half the redundant auth cost on every click
  // through the sidebar. No realtime subscription exists in this codebase
  // (grep confirmed — see final report): the admin panel authenticates via
  // the hand-rolled cookie session, not Supabase Auth, so Postgres
  // Changes' RLS-based authorization doesn't apply without new auth-
  // bridging infrastructure that's out of scope here — this is the
  // "efficient server/API-backed check" the spec calls for instead,
  // triggered by navigation, never a timer/interval poll. Non-fatal on
  // failure — the dot/logo just render their unset state rather than
  // blocking the rest of the shell.
  useEffect(() => {
    if (isAuthPage) return;
    let cancelled = false;
    fetch("/api/admin/shell", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { counts?: { new: number }; adminLogo?: IconAsset } | null) => {
        if (cancelled) return;
        setNewSignalCount(data?.counts ? data.counts.new : null);
        setAdminLogo(data?.adminLogo);
      })
      .catch(() => {
        if (!cancelled) {
          setNewSignalCount(null);
          setAdminLogo(undefined);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, isAuthPage]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  if (isAuthPage) {
    // Login/setup render without the authenticated sidebar/nav — there's
    // no user session yet to show, and every nav link would just bounce
    // back here via proxy.ts, so showing it would be visual noise, not a
    // security concern either way.
    return <div className="min-h-screen bg-background-alt px-4 tablet:px-8">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <div className="border-b border-error bg-error/10 px-4 py-2 text-center text-caption font-medium text-error">
        DEVELOPMENT-STAGE ADMIN — real login required (Phase 1 foundation), but no rate limiting
        on admin actions, no CSRF token, no audit log yet. Not linked from the public site.
      </div>

      <div className="mx-auto flex max-w-[1440px] flex-col tablet:flex-row">
        <aside className="shrink-0 border-b border-border bg-surface tablet:w-[220px] tablet:border-b-0 tablet:border-r">
          <div className="p-4">
            <Link href="/admin" className="text-h3 text-ink">
              Admin
            </Link>
            {adminLogo?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adminLogo.src} alt={adminLogo.alt || "Admin dashboard logo"} className="mt-1 h-8 max-w-[160px] object-contain object-left" />
            ) : (
              <p className="text-caption mt-1 text-text-tertiary">Thanks UX CMS — Joy Howlader (local)</p>
            )}
          </div>
          <nav className="flex gap-1 overflow-x-auto px-4 pb-4 tablet:flex-col tablet:gap-1 tablet:overflow-visible">
            {ADMIN_NAV.map((item) => {
              const active = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              const isSignalsNav = item.href === "/admin/signals";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-body transition-colors duration-150 ease-out focus-visible:shadow-focus focus-visible:outline-none ${
                    active ? "bg-ink text-white" : "text-ink hover:bg-background-alt"
                  }`}
                >
                  <span>{item.label}</span>
                  {isSignalsNav ? <SignalLiveDot active={Boolean(newSignalCount)} /> : null}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            {user ? (
              <div className="flex flex-col gap-2">
                <p className="text-caption text-text-tertiary">
                  Signed in as <span className="text-ink">{user.email}</span> ({user.role})
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-fit text-caption text-accent underline disabled:pointer-events-none disabled:opacity-60"
                >
                  {loggingOut ? "Signing out…" : "Log out"}
                </button>
              </div>
            ) : null}
            <Link href="/" className="mt-2 block text-caption text-text-secondary hover:text-accent">
              ← Back to public site
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 tablet:p-8">{children}</main>
      </div>
    </div>
  );
}
