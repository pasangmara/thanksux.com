import "server-only";
import { createHmac } from "node:crypto";
import { getStore } from "@/lib/data/store";
import type { EventName, OutboxEvent, Settings } from "@/lib/domain/types";
import { getSettings, n8nConfig } from "@/lib/services/settings";
import { nowIso, uid } from "@/lib/util";

/**
 * Transactional outbox for n8n.
 *
 *   change happens → enqueue(event) writes a row → deliver() POSTs it to n8n
 *
 * The database is the source of truth. If n8n is not connected yet (today),
 * or is down, events simply wait with status "pending"/"failed" and are sent
 * later: from Settings → "Send pending events", or by the cron endpoint
 * /api/cron/outbox. Nothing is ever lost because n8n was unavailable.
 *
 * Contract (see docs/N8N.md):
 *   POST <webhook>  JSON { id, event, created_at, source, data, notify }
 *   X-Argus-Event, X-Argus-Delivery, X-Argus-Timestamp,
 *   X-Argus-Signature: sha256=HMAC_SHA256(secret, `${timestamp}.${body}`)
 */

const MAX_ATTEMPTS = 8;
const BACKOFF_MIN = [1, 5, 30, 120, 360, 720, 1440, 1440];
const TIMEOUT_MS = 8000;

export interface Envelope {
  id: string;
  event: EventName;
  created_at: string;
  source: "argus-client-hub";
  data: Record<string, unknown>;
  notify: Settings["notify"] & { urgent: boolean };
}

export async function enqueue(event: EventName, data: Record<string, unknown>, opts: { urgent?: boolean } = {}) {
  const [store, settings] = await Promise.all([getStore(), getSettings()]);
  const enabled = settings.n8n.events[event] !== false;
  const row: OutboxEvent = {
    id: uid(),
    event,
    payload: { data, urgent: Boolean(opts.urgent) },
    status: enabled ? "pending" : "skipped",
    attempts: 0,
    last_error: enabled ? null : "Event turned off in Settings",
    next_attempt_at: null,
    created_at: nowIso(),
    sent_at: null,
  };
  await store.insert<OutboxEvent>("outbox", row);
  return row;
}

function envelope(row: OutboxEvent, settings: Settings): Envelope {
  const p = row.payload as { data?: Record<string, unknown>; urgent?: boolean };
  return {
    id: row.id,
    event: row.event,
    created_at: row.created_at,
    source: "argus-client-hub",
    data: p.data ?? {},
    notify: { ...settings.notify, urgent: Boolean(p.urgent) },
  };
}

export function sign(secret: string, timestamp: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

async function post(url: string, secret: string, env: Envelope): Promise<{ ok: boolean; error?: string }> {
  const body = JSON.stringify(env);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "argus-client-hub/1.0",
    "x-argus-event": env.event,
    "x-argus-delivery": env.id,
    "x-argus-timestamp": timestamp,
  };
  if (secret) headers["x-argus-signature"] = sign(secret, timestamp, body);
  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (res.ok) return { ok: true };
    return { ok: false, error: `n8n answered ${res.status} ${res.statusText}`.trim() };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg.includes("timeout") ? "n8n did not answer within 8 seconds" : msg };
  }
}

/** Try to send one event now. Leaves it "pending" (untouched) if n8n isn't connected. */
export async function deliver(row: OutboxEvent, settings?: Settings): Promise<OutboxEvent> {
  const s = settings ?? (await getSettings());
  const cfg = n8nConfig(s);
  if (!cfg.connected || row.status === "sent" || row.status === "skipped") return row;
  const store = await getStore();
  const result = await post(cfg.url, cfg.secret, envelope(row, s));
  const attempts = row.attempts + 1;
  const patch: Partial<OutboxEvent> = result.ok
    ? { status: "sent", attempts, sent_at: nowIso(), last_error: null, next_attempt_at: null }
    : {
        status: "failed",
        attempts,
        last_error: result.error ?? "Unknown error",
        next_attempt_at:
          attempts >= MAX_ATTEMPTS
            ? null
            : new Date(Date.now() + BACKOFF_MIN[Math.min(attempts - 1, BACKOFF_MIN.length - 1)] * 60_000).toISOString(),
      };
  return (await store.update<OutboxEvent>("outbox", row.id, patch)) ?? { ...row, ...patch };
}

/** Sends everything waiting (pending + failed that are due). Used by Settings and the cron route. */
export async function deliverDue(opts: { force?: boolean; limit?: number } = {}) {
  const settings = await getSettings();
  if (!n8nConfig(settings).connected) return { sent: 0, failed: 0, waiting: await countWaiting(), connected: false };
  const store = await getStore();
  const rows = [
    ...(await store.list<OutboxEvent>("outbox", { where: { status: "pending" }, orderBy: { column: "created_at", dir: "asc" } })),
    ...(await store.list<OutboxEvent>("outbox", { where: { status: "failed" }, orderBy: { column: "created_at", dir: "asc" } })),
  ]
    .filter((r) => opts.force || r.status === "pending" || (r.next_attempt_at && new Date(r.next_attempt_at) <= new Date()))
    .filter((r) => opts.force || r.attempts < MAX_ATTEMPTS)
    .slice(0, opts.limit ?? 50);
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const res = await deliver(row, settings);
    if (res.status === "sent") sent++;
    else failed++;
  }
  return { sent, failed, waiting: await countWaiting(), connected: true };
}

export async function countWaiting(): Promise<number> {
  const store = await getStore();
  return (await store.count("outbox", { status: "pending" })) + (await store.count("outbox", { status: "failed" }));
}

export async function recentEvents(limit = 20): Promise<OutboxEvent[]> {
  const store = await getStore();
  return store.list<OutboxEvent>("outbox", { orderBy: { column: "created_at", dir: "desc" }, limit });
}

/** Enqueue + try immediately. Never throws: integrations must not break the main flow. */
export async function emit(event: EventName, data: Record<string, unknown>, opts: { urgent?: boolean } = {}) {
  try {
    const row = await enqueue(event, data, opts);
    if (row.status === "pending") await deliver(row);
  } catch (err) {
    console.error(`[outbox] ${event}`, err);
  }
}
