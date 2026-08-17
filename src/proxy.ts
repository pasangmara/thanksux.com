import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserById } from "@/lib/auth/usersRepository";
import { getValidSession } from "@/lib/auth/sessionsRepository";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * [Phase 1 — Authentication Foundation] Route-level protection for every
 * `/admin/*` page and `/api/admin/*` API route.
 *
 * Named `proxy.ts`, not `middleware.ts` — Next.js 16 deprecated and
 * renamed the file convention (confirmed via this exact version's bundled
 * docs, `node_modules/next/dist/docs/.../proxy.md`, per this project's
 * own AGENTS.md instruction to check that before writing framework code).
 * Critically, **Proxy defaults to the Node.js runtime in v16** (unlike
 * the old Edge-only Middleware), which is what makes it safe to import
 * the real, `fs`-backed `usersRepository`/`sessionsRepository` directly
 * here — no Edge-runtime filesystem restriction applies. If this project
 * ever deploys to an edge/CDN platform, this file's session lookup would
 * need to move to a KV/DB-backed store at that point (the same DB
 * migration this project's architecture already anticipates for Phase 2).
 *
 * This is the *first* gate, not the only one — every `/api/admin/*` route
 * handler also calls `requireAdmin()` itself (`lib/auth/requireAuth.ts`),
 * exactly matching Next's own `proxy.js` documentation's explicit
 * recommendation: "Always verify authentication and authorization inside
 * each Server Function rather than relying on Proxy alone," since a
 * future matcher change could silently remove this file's coverage
 * without anyone noticing.
 *
 * `/admin/login` and `/admin/setup` are the two admin-namespace routes
 * that must stay reachable *without* a valid admin session — otherwise
 * nobody could ever log in. Everything else under `/admin/*` requires a
 * valid session with `role === "admin"`.
 *
 * [Phase 5 — Public user auth foundation] `handleAdminGate()` below is
 * byte-for-byte the same logic this file had before this phase — admin
 * auth stays entirely on its own hand-rolled JSON session system,
 * completely untouched by and unaware of Supabase Auth. The only addition
 * is `refreshSupabaseSession()`, which runs for every *other* route so a
 * signed-in public user's session cookie gets refreshed before it expires
 * — the standard @supabase/ssr proxy/middleware pattern. The two paths
 * never share a code path or a cookie name, so neither can affect the
 * other's behavior.
 */

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup"];

async function resolveAdminSession(request: NextRequest): Promise<boolean> {
  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return false;
  const session = await getValidSession(sessionId);
  if (!session) return false;
  const user = await getUserById(session.userId);
  return user?.role === "admin";
}

async function handleAdminGate(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/admin");
  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!isApi && isPublicAdminPage) {
    return NextResponse.next();
  }

  const isAdmin = await resolveAdminSession(request);
  if (isAdmin) {
    return NextResponse.next();
  }

  if (isApi) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * Standard @supabase/ssr proxy/middleware session-refresh pattern: reads
 * the request's Supabase cookies, and if the access token is expired but
 * the refresh token is still valid, issues a new one and writes it onto
 * the response — so a signed-in visitor never gets silently logged out
 * mid-session just because a page load happened to land between token
 * refreshes. A no-op (safe) when Supabase isn't configured or the visitor
 * has no session at all.
 */
async function refreshSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() (not getSession()) — validates the token against Supabase's
  // Auth server rather than trusting the cookie's own claims, and is what
  // actually triggers the refresh-if-expired behavior this function exists
  // for. The result itself isn't used here; downstream Server Components
  // call their own createSupabaseServerClient() and get the now-fresh cookie.
  await supabase.auth.getUser();
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdminGate(request);
  }
  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|images/).*)"],
};
