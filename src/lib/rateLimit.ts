/**
 * [Phase 1 — Rate Limiting] In-memory sliding-window limiter — the
 * "small and isolated" option explicitly scoped for this phase, used
 * only by `POST /api/leads` today. One `Map<key, timestamps[]>`, no new
 * dependency, no external service.
 *
 * KNOWN LIMITATION, stated plainly rather than papered over: this state
 * lives in the Node process's memory. It resets on every server restart
 * and does **not** coordinate across multiple server instances/processes
 * (a serverless/multi-instance deployment would let each instance track
 * its own separate limit, weakening the effective limit by however many
 * instances are running). That's an explicit, out-of-scope infrastructure
 * decision for this phase — a real distributed limit needs a shared store
 * (Redis/Upstash) fronting every instance, which this phase deliberately
 * does not add. Documented here and in IMPLEMENTATION.md rather than
 * silently shipped as if it were the production-final answer.
 */

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/** [Phase 5] Extracted from /api/leads/route.ts's original inline helper — shared now that more than one route needs it. Standard reverse-proxy header; falls back to a shared bucket if unset (e.g. local dev). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (existing.length >= limit) {
    hits.set(key, existing);
    return { allowed: false, remaining: 0, resetAt: existing[0] + windowMs };
  }

  existing.push(now);
  hits.set(key, existing);
  return { allowed: true, remaining: limit - existing.length, resetAt: now + windowMs };
}
