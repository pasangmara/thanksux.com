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

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseStorageRemotePattern(),
  },
};

export default nextConfig;
