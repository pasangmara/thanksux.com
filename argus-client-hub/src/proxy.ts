import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast gate for the dashboard: no session cookie → login page.
 * The real check (cookie → session row → member) happens in
 * src/app/hub/(app)/layout.tsx and in every server action.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("argus_hub_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/hub/login";
    url.search = request.nextUrl.pathname === "/hub" ? "" : `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/hub", "/hub/((?!login).*)"],
};
