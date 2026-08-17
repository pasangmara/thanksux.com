"use client";

/**
 * [Phase 5B — auth error states] Thin wrapper around fetch for the public
 * auth forms — the one place that turns "fetch itself threw" (offline, DNS
 * failure, the dev server not running) into a message a visitor can
 * actually act on, instead of whatever raw string the browser's fetch
 * implementation happens to throw (e.g. "Failed to fetch" / "NetworkError
 * when attempting to fetch resource."). Server-returned errors (4xx/5xx
 * with a JSON `{error}` body) are untouched — those are already
 * meaningful and route-specific.
 */
export async function authFetchJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
