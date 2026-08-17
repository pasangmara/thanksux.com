/**
 * [UX Audit Engine] Lightweight, dependency-free HTML signal extraction —
 * regex-based, not a real DOM parser (no cheerio/jsdom: this project has a
 * deliberate zero-new-runtime-dependency policy, and a full browser/DOM is
 * a much bigger, riskier addition than this phase's scope). This is a
 * genuine limitation, not hidden: anything that needs actual rendering
 * (computed layout, real contrast values, JS-injected content) is never
 * claimed here — see rules.ts's "Needs manual verification" findings for
 * exactly which categories that affects.
 *
 * Every extractor below is a plain string→structured-data function with no
 * side effects, so it's independently testable and the evidence it returns
 * is always traceable back to literal source text.
 */

export interface HeadingSignal {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ImageSignal {
  src: string;
  alt: string | null;
  hasMeaningfulAlt: boolean;
}

export interface LinkSignal {
  href: string;
  text: string;
}

export interface FormSignal {
  inputCount: number;
  labeledInputCount: number;
  hasSubmit: boolean;
}

export interface WebsiteEvidence {
  url: string;
  finalUrl: string;
  statusCode: number;
  title: string | null;
  metaDescription: string | null;
  viewportMeta: string | null;
  hasCanonical: boolean;
  hasOpenGraph: boolean;
  hasLangAttribute: boolean;
  headings: HeadingSignal[];
  images: ImageSignal[];
  links: LinkSignal[];
  buttonTexts: string[];
  forms: FormSignal[];
  landmarks: { nav: boolean; main: boolean; header: boolean; footer: boolean };
  wordCount: number;
  htmlByteLength: number;
  /** Real, observable-from-markup performance signals — not a substitute for a real timing/Lighthouse run, which this codebase has no infrastructure for. */
  scriptTagCount: number;
  blockingScriptCount: number;
  stylesheetLinkCount: number;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Removes non-content blocks so word count / heading text never picks up JS or CSS source. */
function stripNonContent(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function extractAttr(tag: string, attr: string): string | null {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"|${attr}\\s*=\\s*'([^']*)'`, "i"));
  if (!match) return null;
  return decodeEntities(match[1] ?? match[2] ?? "");
}

function extractHeadings(html: string): HeadingSignal[] {
  const headings: HeadingSignal[] = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = stripTags(m[2]);
    if (text) headings.push({ level: Number(m[1]) as HeadingSignal["level"], text });
  }
  return headings;
}

function extractImages(html: string): ImageSignal[] {
  const images: ImageSignal[] = [];
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const src = extractAttr(tag, "src") ?? "";
    const hasAltAttr = /\balt\s*=/.test(tag);
    const alt = extractAttr(tag, "alt");
    const isDecorative = hasAltAttr && (alt ?? "").trim() === "";
    images.push({ src, alt, hasMeaningfulAlt: hasAltAttr && !isDecorative && (alt ?? "").trim().length > 0 });
  }
  return images;
}

function extractLinks(html: string): LinkSignal[] {
  const links: LinkSignal[] = [];
  const re = /<a\b[^>]*href\s*=\s*("([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = decodeEntities(m[2] ?? m[3] ?? "");
    const text = stripTags(m[4]);
    if (href) links.push({ href, text });
  }
  return links;
}

function extractButtonTexts(html: string): string[] {
  const texts: string[] = [];
  const buttonRe = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let m: RegExpExecArray | null;
  while ((m = buttonRe.exec(html))) {
    const text = stripTags(m[1]);
    if (text) texts.push(text);
  }
  const inputRe = /<input\b[^>]*type\s*=\s*"(submit|button)"[^>]*>/gi;
  let im: RegExpExecArray | null;
  while ((im = inputRe.exec(html))) {
    const value = extractAttr(im[0], "value");
    if (value) texts.push(value);
  }
  return texts;
}

function extractForms(html: string): FormSignal[] {
  const forms: FormSignal[] = [];
  const formRe = /<form\b[^>]*>([\s\S]*?)<\/form>/gi;
  let m: RegExpExecArray | null;
  while ((m = formRe.exec(html))) {
    const block = m[1];
    const fieldRe = /<(input|select|textarea)\b([^>]*)>/gi;
    let fm: RegExpExecArray | null;
    let inputCount = 0;
    let labeledInputCount = 0;
    const ids: string[] = [];
    while ((fm = fieldRe.exec(block))) {
      const attrs = fm[2];
      const type = extractAttr(`<x ${attrs}>`, "type");
      if (type === "hidden" || type === "submit" || type === "button") continue;
      inputCount++;
      const id = extractAttr(`<x ${attrs}>`, "id");
      const ariaLabel = extractAttr(`<x ${attrs}>`, "aria-label");
      const ariaLabelledby = extractAttr(`<x ${attrs}>`, "aria-labelledby");
      if (ariaLabel || ariaLabelledby) {
        labeledInputCount++;
      } else if (id) {
        ids.push(id);
      }
      // No aria-label/aria-labelledby and no id at all: unlabelable by any
      // means this extractor can check — counted as unlabeled.
    }
    for (const id of ids) {
      if (new RegExp(`<label\\b[^>]*for\\s*=\\s*["']${id}["']`, "i").test(block)) labeledInputCount++;
    }
    const hasSubmit = /<button\b[^>]*type\s*=\s*"submit"|<input\b[^>]*type\s*=\s*"submit"|<button\b(?![^>]*type\s*=\s*"(button|reset)")/i.test(block);
    forms.push({ inputCount, labeledInputCount, hasSubmit });
  }
  return forms;
}

function extractPerformanceSignals(rawHtml: string): { scriptTagCount: number; blockingScriptCount: number; stylesheetLinkCount: number } {
  const scriptTags = rawHtml.match(/<script\b[^>]*>/gi) ?? [];
  const externalScripts = scriptTags.filter((t) => /\bsrc\s*=/.test(t));
  const blockingScriptCount = externalScripts.filter((t) => !/\basync\b/i.test(t) && !/\bdefer\b/i.test(t)).length;
  const stylesheetLinkCount = (rawHtml.match(/<link\b[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi) ?? []).length;
  return { scriptTagCount: scriptTags.length, blockingScriptCount, stylesheetLinkCount };
}

export function extractWebsiteSignals(rawHtml: string, url: string, finalUrl: string, statusCode: number): WebsiteEvidence {
  const html = stripNonContent(rawHtml);
  const performance = extractPerformanceSignals(rawHtml);

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) || null : null;

  const metaDescMatch = html.match(/<meta\b[^>]*name\s*=\s*["']description["'][^>]*>/i);
  const metaDescription = metaDescMatch ? extractAttr(metaDescMatch[0], "content") : null;

  const viewportMatch = html.match(/<meta\b[^>]*name\s*=\s*["']viewport["'][^>]*>/i);
  const viewportMeta = viewportMatch ? extractAttr(viewportMatch[0], "content") : null;

  const hasCanonical = /<link\b[^>]*rel\s*=\s*["']canonical["']/i.test(html);
  const hasOpenGraph = /<meta\b[^>]*property\s*=\s*["']og:/i.test(html);

  const htmlTagMatch = rawHtml.match(/<html\b[^>]*>/i);
  const hasLangAttribute = htmlTagMatch ? /\blang\s*=\s*["'][a-zA-Z-]+["']/.test(htmlTagMatch[0]) : false;

  const landmarks = {
    nav: /<nav\b|role\s*=\s*["']navigation["']/i.test(html),
    main: /<main\b|role\s*=\s*["']main["']/i.test(html),
    header: /<header\b/i.test(html),
    footer: /<footer\b/i.test(html),
  };

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const wordCount = stripTags(bodyHtml).split(/\s+/).filter(Boolean).length;

  return {
    url,
    finalUrl,
    statusCode,
    title,
    metaDescription,
    viewportMeta,
    hasCanonical,
    hasOpenGraph,
    hasLangAttribute,
    headings: extractHeadings(html),
    images: extractImages(html),
    links: extractLinks(html),
    buttonTexts: extractButtonTexts(html),
    forms: extractForms(html),
    landmarks,
    wordCount,
    htmlByteLength: Buffer.byteLength(rawHtml, "utf8"),
    ...performance,
  };
}
