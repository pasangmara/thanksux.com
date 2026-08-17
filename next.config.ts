import type { NextConfig } from "next";

/**
 * [Phase 4C — media storage] Supabase Storage-hosted media (new uploads
 * only — existing local /images/... files are untouched and need no
 * remote pattern) needs next/image's remote-host allowlist, or the public
 * site's <Image> usage (PortfolioMedia.tsx) throws for any URL outside
 * this app's own origin. Derived from NEXT_PUBLIC_SUPABASE_URL rather than
 * hardcoded — resolves to an empty pattern list (no-op) if that env var
 * isn't set, so this never breaks a checkout without Supabase configured.
 */
function supabaseStorageRemotePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const hostname = new URL(url).hostname;
    return [{ protocol: "https" as const, hostname, pathname: "/storage/v1/object/public/**" }];
  } catch {
    return [];
  }
}

/**
 * [Temporary GitHub Pages deployment] `STATIC_EXPORT=1` is set ONLY by the
 * `deploy` job in .github/workflows/ci.yml, against a pruned checkout that
 * has already removed every server-only route (see that job's comments).
 * Unset (every other build — `npm run dev`, `npm run build`/`start` for
 * real Node hosting, and the `verify` CI job) leaves this file byte-for-
 * byte equivalent to before: no `output`, default (optimized) images.
 * `unoptimized: true` is required alongside `output: "export"` because
 * static export has no server to run the Image Optimization API against
 * (see next.config's own bundled docs, static-exports.md's "Image
 * Optimization" section) — this only relaxes anything for the pruned
 * export build, never for the real app.
 */
const STATIC_EXPORT = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(STATIC_EXPORT ? { output: "export" as const, trailingSlash: true } : {}),
  images: {
    remotePatterns: supabaseStorageRemotePattern(),
    ...(STATIC_EXPORT ? { unoptimized: true } : {}),
  },
};

export default nextConfig;
