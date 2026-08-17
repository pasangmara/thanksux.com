/**
 * [Phase 6E §10 — Figma support] "Validate that it is a URL. Do not attempt
 * to authenticate with Figma. Do not build Figma API integration. Do not
 * invent preview embeds." This is the entire scope: a plain http(s) URL
 * shape check, reused for every stored URL field (figma_url/prototype_url/
 * case_study_url/external_url on both Contribution and DesignResponse) —
 * no Figma-specific parsing, no fetch to figma.com, no embed generation.
 */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
