/**
 * [Icon/Logo CMS] Minimal SVG sanitizer for admin-uploaded icon/logo files.
 *
 * This is defense-in-depth, not the primary safety mechanism. The actual
 * guarantee against script execution is architectural: every sanitized SVG
 * on this site is rendered exclusively via a plain `<img src="...">` (see
 * IconField's admin preview and SiteNav/SiteFooter's logo rendering) —
 * never inlined into the DOM via `dangerouslySetInnerHTML` or an inline
 * `<svg>` element. A browser does not execute `<script>` tags, event-
 * handler attributes, or external resource loads inside an `<img>`-sourced
 * SVG; it's treated as a static raster-equivalent image, the same
 * restricted rendering mode used for a `background-image: url(...)`. That
 * property holds even if this sanitizer has a gap, which a regex-based
 * pass over untrusted markup always might (a fully correct guarantee would
 * require a real XML parser, not added here per the project's documented
 * zero-new-dependency policy — see docs/CMS_CONTENT_MODEL.md §14 — for a
 * belt this project already has a suspenders-grade fallback for).
 *
 * What this pass actually does, on top of that: strips the highest-signal
 * dangerous constructs so a saved file also looks clean if ever inspected
 * or reused outside this app's own rendering path, and rejects outright
 * anything that doesn't look like a plausible icon/logo SVG.
 */

const SCRIPT_TAG_RE = /<script\b[\s\S]*?<\/script\s*>/gi;
const SCRIPT_TAG_OPEN_RE = /<script\b[^>]*>?/gi;
const EVENT_HANDLER_ATTR_RE = /\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const FOREIGN_OBJECT_RE = /<foreignObject\b[\s\S]*?<\/foreignObject\s*>/gi;
const IFRAME_RE = /<iframe\b[\s\S]*?<\/iframe\s*>/gi;
const JAVASCRIPT_URI_ATTR_RE = /(\s(?:href|xlink:href|src)\s*=\s*)("|')\s*javascript:[^"']*\2/gi;
const DATA_TEXT_HTML_URI_ATTR_RE = /(\s(?:href|xlink:href|src)\s*=\s*)("|')\s*data:text\/html[^"']*\2/gi;
const DOCTYPE_ENTITY_RE = /<!DOCTYPE[^>]*\[[\s\S]*?\]>/gi;
const HTML_COMMENT_RE = /<!--[\s\S]*?-->/g;

export interface SvgSanitizeResult {
  ok: boolean;
  cleaned?: string;
  error?: string;
}

export function sanitizeSvgUpload(raw: string): SvgSanitizeResult {
  if (raw.length > 512 * 1024) {
    return { ok: false, error: "SVG file is too large." };
  }

  let s = raw;
  // Comments can hide/split otherwise-matchable tags across sanitizer
  // passes — stripped first, unconditionally.
  s = s.replace(HTML_COMMENT_RE, "");
  s = s.replace(DOCTYPE_ENTITY_RE, ""); // internal DTD subsets — XXE-style entity definitions, no legitimate icon needs one.
  s = s.replace(SCRIPT_TAG_RE, "");
  s = s.replace(SCRIPT_TAG_OPEN_RE, ""); // catches an unterminated/self-closed <script> the paired regex above wouldn't.
  s = s.replace(FOREIGN_OBJECT_RE, ""); // can embed arbitrary HTML (including <script>) inside an SVG.
  s = s.replace(IFRAME_RE, "");
  s = s.replace(EVENT_HANDLER_ATTR_RE, "");
  s = s.replace(JAVASCRIPT_URI_ATTR_RE, "$1$2$2");
  s = s.replace(DATA_TEXT_HTML_URI_ATTR_RE, "$1$2$2");

  const trimmed = s.trim();
  if (!/^(<\?xml[^>]*\?>\s*)?<svg[\s>]/i.test(trimmed)) {
    return { ok: false, error: "File does not look like a valid SVG (must start with an <svg> root element)." };
  }
  // Final guard: if anything script-shaped survived the passes above
  // (a gap in this regex-based pass), reject rather than serve it — the
  // <img>-only rendering rule below is the real backstop, but a file that
  // still contains these strings shouldn't be written to disk at all.
  if (/<script\b/i.test(trimmed) || /\bon[a-z]+\s*=/i.test(trimmed)) {
    return { ok: false, error: "SVG contains disallowed script content and was rejected." };
  }

  return { ok: true, cleaned: trimmed };
}
