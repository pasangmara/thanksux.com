"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { fireConversion } from "@/lib/analytics/conversions";
import { useMarketingConfig } from "@/lib/analytics/MarketingConfigProvider";
import { getFirstTouch, getLatestTouch } from "@/lib/analytics/attribution";
import { trackEvent } from "@/lib/analytics/track";
import type { LeadContext } from "@/types/leads";
import type { LeadFormFieldConfig, LeadFormFieldKey } from "@/types/marketing";

/**
 * [Phase L — Reusable, Context-Aware Lead Form] One component, mounted
 * wherever a real lead-capture moment exists (currently `/contact` — see
 * that page for how `context` is derived from a `?project=` query param).
 * Field set is entirely admin-configured (`LeadFormSettings`, `/admin/marketing`
 * → Lead Forms) — this component renders whichever fields are enabled, in
 * their configured order, honoring required/optional, rather than a fixed
 * hardcoded field list.
 *
 * Submits to `POST /api/leads` (public, unauthenticated by design — see
 * that route) with the visitor's real captured attribution
 * (`attribution.ts`) and whatever `context` this instance was given —
 * the visitor never manually re-enters "which project I'm asking about."
 */

const FIELD_TYPE: Record<LeadFormFieldKey, "text" | "email" | "tel" | "textarea"> = {
  name: "text",
  email: "email",
  phone: "tel",
  company: "text",
  service: "text",
  projectType: "text",
  budget: "text",
  timeline: "text",
  preferredContactMethod: "text",
  message: "textarea",
};

type FormValues = Partial<Record<LeadFormFieldKey, string>>;
type SubmitStatus = "idle" | "submitting" | "success" | "error";

export function LeadForm({
  fields,
  context,
  formName = "General Inquiry",
  successMessage = "Thanks — I'll get back to you shortly.",
}: {
  fields: LeadFormFieldConfig[];
  context?: LeadContext;
  formName?: string;
  successMessage?: string;
}) {
  const marketing = useMarketingConfig();
  const [values, setValues] = useState<FormValues>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const activeFields = [...fields].filter((f) => f.enabled).sort((a, b) => a.order - b.order);

  function update(key: LeadFormFieldKey, value: string) {
    if (!started) {
      setStarted(true);
      trackEvent("lead_form_start", { form_name: formName });
    }
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);
    trackEvent("lead_form_submit", { form_name: formName, page: context?.page, project_id: context?.projectId });

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          ...values,
          firstTouch: getFirstTouch(),
          latestTouch: getLatestTouch(),
          context,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not submit — please try again.");

      setStatus("success");
      trackEvent("lead_form_success", { form_name: formName });
      trackEvent("project_inquiry", { form_name: formName, project_id: context?.projectId });
      fireConversion(marketing, "lead_form_submit", data.leadId);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not submit — please try again.");
      trackEvent("lead_form_error", { form_name: formName });
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-md border border-border bg-surface p-6">
        <p className="text-body text-ink">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {activeFields.map((field) => (
        <div key={field.key}>
          <label htmlFor={`lead-${field.key}`} className="mb-1.5 block text-caption font-medium text-ink">
            {field.label}
            {field.required ? <span className="ml-1 text-error">*</span> : null}
          </label>
          {FIELD_TYPE[field.key] === "textarea" ? (
            <textarea
              id={`lead-${field.key}`}
              required={field.required}
              value={values[field.key] ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
              rows={4}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:shadow-focus focus:outline-none"
            />
          ) : (
            <input
              id={`lead-${field.key}`}
              type={FIELD_TYPE[field.key]}
              required={field.required}
              value={values[field.key] ?? ""}
              onChange={(e) => update(field.key, e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:shadow-focus focus:outline-none"
            />
          )}
        </div>
      ))}

      {status === "error" && error ? <p className="text-caption text-error">{error}</p> : null}

      <Button variant="primary" type="submit" disabled={status === "submitting"} className="w-fit">
        {status === "submitting" ? "Sending…" : "Send Inquiry"}
      </Button>
    </form>
  );
}
