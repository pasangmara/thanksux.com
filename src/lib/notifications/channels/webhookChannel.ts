import type { NotificationChannel, NotificationEvent, NotificationResult } from "../types";

/**
 * [Phase 7 — n8n webhook] The one channel that's genuinely implemented
 * end-to-end, not just an interface stub — a webhook POST needs no new
 * dependency (native `fetch`), unlike email (a real SMTP/API provider
 * client) or Slack/WhatsApp (their own SDKs), which is exactly why this
 * one is real today and those are documented interfaces only (see
 * `emailChannel.ts`). n8n itself is then responsible for fanning this one
 * event out to email/Slack/WhatsApp/Sheets/etc. — this codebase doesn't
 * need to know about any of those to support them.
 *
 * `N8N_WEBHOOK_URL` — server-only env var, read via `process.env`, never
 * exposed to the client (no `NEXT_PUBLIC_` prefix, never referenced from
 * a "use client" file). Unset means `isConfigured()` returns false and
 * the dispatcher skips this channel entirely — no request ever attempted,
 * no error ever thrown.
 *
 * [Privacy note] The "never send PII to analytics" rule applies to GA4/
 * Google Ads event parameters (`track.ts`'s `PII_PARAM_KEYS` filter) — a
 * fundamentally different data flow from this one. This webhook is an
 * admin-configured internal automation endpoint (the site owner's own
 * n8n instance), not a third-party ad platform; it needs the lead's real
 * contact details to be useful for follow-up/CRM sync, the same way this
 * codebase's own `/admin/leads` UI already shows them.
 */
export const webhookChannel: NotificationChannel = {
  name: "n8n_webhook",

  isConfigured(): boolean {
    return Boolean(process.env.N8N_WEBHOOK_URL?.trim());
  },

  async send(event: NotificationEvent): Promise<NotificationResult> {
    const url = process.env.N8N_WEBHOOK_URL?.trim();
    if (!url) return { ok: false, error: "N8N_WEBHOOK_URL not configured" };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: event.type,
          detail: event.detail,
          lead: {
            id: event.lead.id,
            name: event.lead.name,
            email: event.lead.email,
            phone: event.lead.phone,
            company: event.lead.company,
            service: event.lead.service,
            status: event.lead.status,
            priority: event.lead.priority,
            source: event.lead.firstTouch?.source,
            campaign: event.lead.firstTouch?.campaign,
            context: event.lead.context,
            createdAt: event.lead.createdAt,
          },
        }),
      });
      if (!res.ok) return { ok: false, error: `Webhook responded with ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Webhook request failed" };
    }
  },
};
