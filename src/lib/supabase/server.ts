import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * [Phase 5 — Public user auth foundation] Server-side Supabase client for
 * Server Components / Route Handlers / Server Actions — authenticates AS
 * the requesting user (via their session cookie), so every query it makes
 * is subject to RLS exactly as that user, never bypassing it. This is
 * deliberately distinct from every other Supabase client in this project
 * (src/lib/supabase/rest.ts, used by the CMS repositories) which always
 * uses the service-role key and bypasses RLS — that's correct for
 * admin-gated CMS operations (already authorized by requireAdmin() before
 * ever reaching Supabase) but would be wrong here: public-user operations
 * must be enforced by RLS itself, per this phase's explicit security
 * model, not by an application-layer check alone.
 *
 * Uses the publishable/anon key only — never the service-role key.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component render, which can't set cookies
          // — harmless as long as proxy.ts's refreshSupabaseSession() is
          // also running (it is, for every non-admin route), since that's
          // what actually persists a refreshed token.
        }
      },
    },
  });
}
