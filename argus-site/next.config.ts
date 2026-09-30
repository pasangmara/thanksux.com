import path from "node:path";
import type { NextConfig } from "next";

// Static export: `npm run build` writes a plain HTML/CSS/JS site to `out/`,
// which can be uploaded to any host (Hostinger, Netlify, cPanel, GitHub Pages).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // This app lives inside the ThanksUX repo; keep Turbopack from treating the
  // parent folder (with its own lockfile, proxy and PostCSS config) as the root.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
