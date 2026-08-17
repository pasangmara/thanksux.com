"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * [Phase 5 — Public user auth foundation] Browser-side Supabase client —
 * used only by Client Components that need to call Supabase Auth's own
 * methods directly (signUp/signInWithPassword/signOut/resetPasswordForEmail),
 * the standard @supabase/ssr pattern. Publishable/anon key only, safe to
 * ship to the browser by design (RLS is the real security boundary, not
 * secrecy of this key). Never import this into a Server Component or
 * Route Handler — use createSupabaseServerClient() there instead.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set.");
  }
  return createBrowserClient(url, key);
}
