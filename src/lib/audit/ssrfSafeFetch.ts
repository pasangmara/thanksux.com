import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * [UX Audit Engine — SSRF protection] The audit engine is the first thing
 * in this codebase that fetches a server-side URL supplied by an arbitrary,
 * possibly-anonymous visitor (every other outbound fetch in this project is
 * to Supabase's own fixed, trusted host). That makes this a real SSRF
 * surface: without these checks, a visitor could point an audit at
 * `http://169.254.169.254/...` (cloud metadata), `http://localhost:5432`,
 * or an internal service, and use this server as a proxy to reach it.
 *
 * Defense in depth, in order:
 *  1. Protocol allowlist (http/https only — no file:, gopher:, data:, etc.)
 *  2. Hostname/IP-literal check against every private/reserved range before
 *     any network call is made.
 *  3. DNS resolution, then the SAME check against the resolved IP(s) — a
 *     hostname can pass step 2 (its literal text isn't a private IP) yet
 *     still resolve to one (DNS rebinding / attacker-controlled DNS).
 *  4. Manual redirect handling — each redirect target is re-validated from
 *     scratch (steps 1-3) before being followed, capped at a small hop
 *     limit, so a URL that's safe at request time can't hop to an internal
 *     address via a 3xx response.
 *  5. Hard timeout via AbortSignal.
 *  6. Hard response-size cap, enforced by reading the stream and aborting
 *     once exceeded — Content-Length is checked as a fast-path only, since
 *     it can be absent or wrong.
 *
 * No new dependency: `node:dns/promises` and `node:net` are Node built-ins,
 * consistent with this project's zero-runtime-dependency policy.
 */

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB — plenty for HTML, never needed for a UX audit
const USER_AGENT = "ThanksUX-Audit-Bot/1.0 (+https://thanksux.com/audit)";

export class UnsafeUrlError extends Error {}
export class FetchTimeoutError extends Error {}
export class ResponseTooLargeError extends Error {}

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inIpv4Range(ip: string, base: string, maskBits: number): boolean {
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

const BLOCKED_IPV4_RANGES: [string, number][] = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. 169.254.169.254 cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16],
  ["198.18.0.0", 15], // benchmark
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
  ["255.255.255.255", 32], // broadcast
];

// fc00::/7 (unique local, covers fc*/fd*), fe80::/10 (link-local, covers
// fe8*/fe9*/fea*/feb*), ff00::/8 (multicast), 2001:db8::/32 (documentation).
const BLOCKED_IPV6_PREFIXES = ["fc", "fd", "fe8", "fe9", "fea", "feb", "ff", "2001:db8"];

function isBlockedIpv4(ip: string): boolean {
  return BLOCKED_IPV4_RANGES.some(([base, bits]) => inIpv4Range(ip, base, bits));
}

function isBlockedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) — check the embedded IPv4 address too.
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]);
  return BLOCKED_IPV6_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true; // not a recognizable IP at all — refuse rather than guess
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal", "metadata"]);

/** Validates protocol + hostname shape, then resolves DNS and validates the resolved IP(s) too. Throws UnsafeUrlError on any failure. Returns the resolved IP actually used, for logging/debugging only. */
async function assertSafeUrl(rawUrl: string): Promise<{ url: URL; resolvedIp: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a valid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are supported.");
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new UnsafeUrlError("This host can't be audited.");
  }

  // If the hostname is itself an IP literal, check it directly.
  const literalVersion = isIP(hostname);
  if (literalVersion && isBlockedIp(hostname)) {
    throw new UnsafeUrlError("This host can't be audited.");
  }

  if (!literalVersion) {
    let resolved: { address: string }[];
    try {
      resolved = await lookup(hostname, { all: true, verbatim: true });
    } catch {
      throw new UnsafeUrlError("Could not resolve this host.");
    }
    if (resolved.length === 0) throw new UnsafeUrlError("Could not resolve this host.");
    for (const { address } of resolved) {
      if (isBlockedIp(address)) throw new UnsafeUrlError("This host resolves to a private or reserved address and can't be audited.");
    }
    return { url, resolvedIp: resolved[0].address };
  }

  return { url, resolvedIp: hostname };
}

export interface SafeFetchResult {
  finalUrl: string;
  status: number;
  headers: Headers;
  body: string;
}

/**
 * Fetches `rawUrl` with full SSRF protection, a hard timeout, a hard
 * response-size cap, and manually-validated redirect following. Throws
 * UnsafeUrlError / FetchTimeoutError / ResponseTooLargeError / a generic
 * Error for network failures — callers turn these into user-facing audit
 * failure states, never into a partial/fabricated result.
 */
export async function ssrfSafeFetch(rawUrl: string): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url } = await assertSafeUrl(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new FetchTimeoutError("The site took too long to respond.");
      }
      throw new Error("Could not reach this site.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Site returned a redirect with no destination.");
      if (hop === MAX_REDIRECTS) throw new Error("Too many redirects.");
      currentUrl = new URL(location, url).toString();
      continue;
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new ResponseTooLargeError("This page is too large to audit.");
    }

    const body = await readBodyWithCap(res);
    return { finalUrl: url.toString(), status: res.status, headers: res.headers, body };
  }

  throw new Error("Too many redirects.");
}

async function readBodyWithCap(res: Response): Promise<string> {
  if (!res.body) return res.text();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        reader.cancel().catch(() => {});
        throw new ResponseTooLargeError("This page is too large to audit.");
      }
      chunks.push(value);
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}
