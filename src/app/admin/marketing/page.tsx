"use client";

import { useEffect, useState } from "react";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonSecondary,
  adminButtonSmall,
  FieldGrid,
  ReorderControls,
  SaveStatusMessage,
  Section,
  SelectField,
  Spinner,
  TextField,
  ToggleField,
} from "@/components/admin/fields";
import {
  getLeadFormSettings,
  getMarketingSettings,
  getNotificationChannelStatus,
  listLeads,
  saveLeadFormSettings,
  saveMarketingSettings,
} from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import {
  ga4Status,
  googleAdsStatus,
  gtmStatus,
  type ConversionMapping,
  type LeadFormSettings,
  type MarketingSettings,
} from "@/types/marketing";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { Lead } from "@/types/leads";

/**
 * /admin/marketing — Analytics, Google Tag Manager, Google Ads,
 * Conversion Tracking, Remarketing, Lead Forms, Attribution, and Consent
 * in one place, per Phase L's brief. No ID here is ever pre-filled with a
 * real value — every integration starts empty/disabled (see
 * `seedMarketingSettings()`), and status is computed as "Configured" (an
 * ID is present and the toggle is on) vs "Not configured" — never
 * "Connected", since this codebase has no way to verify a real
 * server-side handshake with Google.
 */

function StatusBadge({ status }: { status: "configured" | "not-configured" }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${
        status === "configured" ? "border-ink bg-ink text-white" : "border-border text-text-tertiary"
      }`}
    >
      {status === "configured" ? "Configured" : "Not configured"}
    </span>
  );
}

let keyCounter = 0;
function genId(): string {
  keyCounter += 1;
  return `conv-${Date.now()}-${keyCounter}`;
}

export default function AdminMarketingPage() {
  const [marketing, setMarketing] = useState<MarketingSettings | null>(null);
  const [leadForm, setLeadForm] = useState<LeadFormSettings | null>(null);
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [notificationChannels, setNotificationChannels] = useState<{ name: string; configured: boolean }[] | null>(
    null,
  );
  const saveState = useSaveStatus();

  useEffect(() => {
    getMarketingSettings().then(setMarketing);
    getLeadFormSettings().then(setLeadForm);
    listLeads().then(setLeads);
    getNotificationChannelStatus().then(setNotificationChannels);
  }, []);

  if (!marketing || !leadForm) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<MarketingSettings>) {
    setMarketing((m) => (m ? { ...m, ...patch } : m));
  }
  function updateLeadFormFields(patch: Partial<LeadFormSettings>) {
    setLeadForm((f) => (f ? { ...f, ...patch } : f));
  }

  function addConversion() {
    if (!marketing) return;
    const next: ConversionMapping = {
      id: genId(),
      name: "New Conversion",
      triggerEvent: "lead_form_submit",
      conversionId: marketing.googleAds.conversionId,
      conversionLabel: "",
      enabled: true,
    };
    update({ conversions: [...marketing.conversions, next] });
  }
  function updateConversion(id: string, patch: Partial<ConversionMapping>) {
    if (!marketing) return;
    update({ conversions: marketing.conversions.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  }
  function removeConversion(id: string) {
    if (!marketing) return;
    update({ conversions: marketing.conversions.filter((c) => c.id !== id) });
  }

  function moveField(index: number, direction: -1 | 1) {
    if (!leadForm) return;
    const ordered = [...leadForm.fields].sort((a, b) => a.order - b.order);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    updateLeadFormFields({ fields: next.map((f, i) => ({ ...f, order: i })) });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-h1">Marketing / Analytics</h1>
        <p className="text-body mt-2 text-text-secondary">
          Analytics, tracking, conversions, and lead forms — every integration below starts
          disabled with no ID. Enter your own real IDs to activate each one; nothing here is ever
          pre-filled or claimed as &ldquo;Connected&rdquo; without one.
        </p>
      </div>

      <Section
        title="Status Overview"
        description="Real data only — CTA-level click analytics live in GA4/GTM directly (this codebase doesn't persist raw click events server-side); what's shown here is what this CMS's own CRM actually has on record."
      >
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
          {[
            ["GA4", ga4Status(marketing.ga4)],
            ["GTM", gtmStatus(marketing.gtm)],
            ["Google Ads", googleAdsStatus(marketing.googleAds)],
            ["Consent gating", marketing.consent.required ? "configured" : "not-configured"],
          ].map(([label, status]) => (
            <div key={label} className="rounded-md border border-border bg-surface p-3">
              <p className="text-caption text-text-tertiary">{label}</p>
              <div className="mt-1"><StatusBadge status={status as "configured" | "not-configured"} /></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4">
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-caption text-text-tertiary">Leads captured</p>
            <p className="text-h2 mt-1">{leads ? leads.length : "…"}</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-caption text-text-tertiary">Won</p>
            <p className="text-h2 mt-1">{leads ? leads.filter((l) => l.status === "Won").length : "…"}</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-caption text-text-tertiary">Leads with attribution</p>
            <p className="text-h2 mt-1">
              {leads ? leads.filter((l) => l.firstTouch?.source || l.firstTouch?.gclid).length : "…"}
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-caption text-text-tertiary">Conversion mappings active</p>
            <p className="text-h2 mt-1">{marketing.conversions.filter((c) => c.enabled).length}</p>
          </div>
        </div>
        {leads && leads.length === 0 ? (
          <p className="text-caption text-text-tertiary">
            No leads yet — this section will populate as soon as someone submits the lead form.
          </p>
        ) : null}
      </Section>

      <Section
        title="Notifications"
        description="Lead Created → Notification Service → Configured Channels. A channel with nothing configured is silently skipped — never an error, never a fake send."
      >
        {!notificationChannels ? (
          <p className="text-caption text-text-tertiary">Loading…</p>
        ) : (
          notificationChannels.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded-md border border-border bg-surface p-3">
              <p className="text-body text-ink">{c.name === "n8n_webhook" ? "n8n Webhook" : "Email"}</p>
              <StatusBadge status={c.configured ? "configured" : "not-configured"} />
            </div>
          ))
        )}
        <p className="text-caption text-text-tertiary">
          Set via server-only environment variables (<code>N8N_WEBHOOK_URL</code>,{" "}
          <code>NOTIFY_EMAIL_TO</code> — see .env.example), never editable from this UI since
          they&rsquo;re secrets/server config, not content. Email is architecture-only today — the
          address can be configured but no provider is wired up to actually send yet.
        </p>
      </Section>

      <Section title="Google Analytics 4">
        <FieldGrid>
          <TextField
            id="ga4-id"
            label="GA4 Measurement ID"
            value={marketing.ga4.measurementId}
            onChange={(v) => update({ ga4: { ...marketing.ga4, measurementId: v } })}
            help="e.g. G-XXXXXXXXXX"
          />
          <ToggleField
            id="ga4-enabled"
            label="Enabled"
            checked={marketing.ga4.enabled}
            onChange={(v) => update({ ga4: { ...marketing.ga4, enabled: v } })}
          />
        </FieldGrid>
        <StatusBadge status={ga4Status(marketing.ga4)} />
      </Section>

      <Section title="Google Tag Manager">
        <FieldGrid>
          <TextField
            id="gtm-id"
            label="GTM Container ID"
            value={marketing.gtm.containerId}
            onChange={(v) => update({ gtm: { ...marketing.gtm, containerId: v } })}
            help="e.g. GTM-XXXXXXX"
          />
          <ToggleField
            id="gtm-enabled"
            label="Enabled"
            checked={marketing.gtm.enabled}
            onChange={(v) => update({ gtm: { ...marketing.gtm, enabled: v } })}
          />
        </FieldGrid>
        <StatusBadge status={gtmStatus(marketing.gtm)} />
      </Section>

      <Section title="Google Ads">
        <FieldGrid>
          <TextField
            id="ads-id"
            label="Google Ads Conversion ID"
            value={marketing.googleAds.conversionId}
            onChange={(v) => update({ googleAds: { ...marketing.googleAds, conversionId: v } })}
            help="e.g. AW-XXXXXXXXX"
          />
          <ToggleField
            id="ads-enabled"
            label="Enabled"
            checked={marketing.googleAds.enabled}
            onChange={(v) => update({ googleAds: { ...marketing.googleAds, enabled: v } })}
          />
        </FieldGrid>
        <StatusBadge status={googleAdsStatus(marketing.googleAds)} />
      </Section>

      <Section
        title="Conversion Tracking"
        description="Map an internal event to a real Google Ads conversion label. A trigger with no enabled mapping here simply never fires a conversion."
      >
        {marketing.conversions.length === 0 ? (
          <p className="text-caption text-text-tertiary">No conversions configured yet.</p>
        ) : (
          marketing.conversions.map((c) => (
            <div key={c.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-3">
              <FieldGrid>
                <TextField id={`conv-${c.id}-name`} label="Name" value={c.name} onChange={(v) => updateConversion(c.id, { name: v })} />
                <SelectField
                  id={`conv-${c.id}-trigger`}
                  label="Trigger Event"
                  value={c.triggerEvent}
                  options={ANALYTICS_EVENTS as unknown as string[]}
                  onChange={(v) => updateConversion(c.id, { triggerEvent: v })}
                />
              </FieldGrid>
              <FieldGrid>
                <TextField
                  id={`conv-${c.id}-id`}
                  label="Conversion ID"
                  value={c.conversionId}
                  onChange={(v) => updateConversion(c.id, { conversionId: v })}
                  help="Usually the same as the account-level Google Ads Conversion ID above"
                />
                <TextField
                  id={`conv-${c.id}-label`}
                  label="Conversion Label"
                  value={c.conversionLabel}
                  onChange={(v) => updateConversion(c.id, { conversionLabel: v })}
                />
              </FieldGrid>
              <div className="flex items-center justify-between gap-2">
                <ToggleField
                  id={`conv-${c.id}-enabled`}
                  label="Enabled"
                  checked={c.enabled}
                  onChange={(v) => updateConversion(c.id, { enabled: v })}
                />
                <button type="button" onClick={() => removeConversion(c.id)} className={adminButtonDanger}>
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
        <button type="button" onClick={addConversion} className={`w-fit ${adminButtonSmall}`}>
          + Add conversion mapping
        </button>
      </Section>

      <Section
        title="Remarketing"
        description="Behavioral signals (viewed project, started/completed lead form, clicked WhatsApp/email/CTA, …) are already tracked as GA4/GTM events once Analytics/GTM above are enabled — real remarketing audiences are then built and managed on Google's side (Google Ads/Analytics), not in this codebase. This toggle only controls whether that data is treated as eligible for audience-building at all."
      >
        <ToggleField
          id="remarketing-enabled"
          label="Enabled"
          checked={marketing.remarketing.enabled}
          onChange={(v) => update({ remarketing: { enabled: v } })}
        />
      </Section>

      <Section
        title="Consent"
        description="When required, visitors see a consent banner and Analytics/Marketing scripts (GA4, GTM) don't load until they choose. Necessary site function is never gated."
      >
        <ToggleField
          id="consent-required"
          label="Require consent before loading analytics/marketing"
          checked={marketing.consent.required}
          onChange={(v) => update({ consent: { required: v } })}
        />
      </Section>

      <Section
        title="Lead Forms"
        description="Which fields the public lead form (/contact and anywhere else it's mounted) shows, in what order, and whether each is required."
      >
        {[...leadForm.fields].sort((a, b) => a.order - b.order).map((field, i) => (
          <div key={field.key} className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-3">
            <p className="w-40 shrink-0 text-body text-ink">{field.label}</p>
            <ToggleField
              id={`leadfield-${field.key}-enabled`}
              label="Enabled"
              checked={field.enabled}
              onChange={(v) =>
                updateLeadFormFields({
                  fields: leadForm.fields.map((f) => (f.key === field.key ? { ...f, enabled: v } : f)),
                })
              }
            />
            <ToggleField
              id={`leadfield-${field.key}-required`}
              label="Required"
              checked={field.required}
              onChange={(v) =>
                updateLeadFormFields({
                  fields: leadForm.fields.map((f) => (f.key === field.key ? { ...f, required: v } : f)),
                })
              }
            />
            <ReorderControls
              className="ml-auto"
              canMoveUp={i > 0}
              canMoveDown={i < leadForm.fields.length - 1}
              onMoveUp={() => moveField(i, -1)}
              onMoveDown={() => moveField(i, 1)}
            />
          </div>
        ))}
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          onClick={async () => {
            saveState.reset();
            const [m, f] = await Promise.all([getMarketingSettings(), getLeadFormSettings()]);
            setMarketing(m);
            setLeadForm(f);
          }}
          disabled={saveState.isBusy}
          className={adminButtonSecondary}
        >
          Discard unsaved edits
        </button>
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={() =>
            saveState.run(async () => {
              await Promise.all([saveMarketingSettings(marketing), saveLeadFormSettings(leadForm)]);
            })
          }
          className={adminButtonPrimary}
        >
          {saveState.isBusy ? <Spinner className="text-white" /> : null}
          {saveState.isBusy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
