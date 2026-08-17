import { NextResponse } from "next/server";
import { createLeadRecord } from "@/lib/cms/leadsRepository";
import { getLeadFormSettings } from "@/lib/cms/siteContentRepository";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import type { LeadSubmission } from "@/types/leads";

/**
 * [Phase L — Lead Form System] The one public, unauthenticated write
 * endpoint in this admin-only-elsewhere API surface — `LeadForm.tsx`
 * posts here directly from the public site. Every field is read
 * individually and coerced to `string | undefined` (never spread from the
 * raw body) so a client can only ever set the fields `LeadSubmission`
 * actually defines — no `status`/`priority`/`id`/`activity` override is
 * possible from here; those are exclusively server-assigned in
 * `createLeadRecord()`.
 *
 * [Phase 1 — Rate limiting] The only public write endpoint in this
 * codebase, so it's the only one that needed a limit — per-IP, in-memory
 * (see `lib/rateLimit.ts`'s own header comment for its single-process
 * limitation). 5 submissions per 10 minutes per IP is generous for a real
 * visitor (nobody submits an inquiry 5 times in 10 minutes) while
 * blocking a naive scripted flood.
 */

const MAX_FIELD_LENGTH = 2000;
const LEAD_RATE_LIMIT = 5;
const LEAD_RATE_WINDOW_MS = 10 * 60 * 1000;

function str(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, MAX_FIELD_LENGTH);
  return trimmed || undefined;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`leads:${clientIp(request)}`, LEAD_RATE_LIMIT, LEAD_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many submissions — please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  if (!name && !email && !phone) {
    return NextResponse.json({ error: "At least a name, email, or phone number is required." }, { status: 400 });
  }

  const firstTouch = typeof body.firstTouch === "object" && body.firstTouch !== null ? body.firstTouch : undefined;
  const latestTouch = typeof body.latestTouch === "object" && body.latestTouch !== null ? body.latestTouch : undefined;
  const context = typeof body.context === "object" && body.context !== null ? body.context : undefined;

  const submission: LeadSubmission = {
    formName: str(body.formName),
    name,
    email,
    phone,
    company: str(body.company),
    service: str(body.service),
    projectType: str(body.projectType),
    budget: str(body.budget),
    timeline: str(body.timeline),
    preferredContactMethod: str(body.preferredContactMethod),
    message: str(body.message),
    // Attribution/context objects are stored as-provided (they only ever
    // come from this codebase's own client-side capture — attribution.ts/
    // LeadForm.tsx — not free-text visitor input), same trust boundary
    // every other structured field on this codebase's JSON records uses.
    firstTouch: firstTouch as LeadSubmission["firstTouch"],
    latestTouch: latestTouch as LeadSubmission["latestTouch"],
    context: context as LeadSubmission["context"],
  };

  // [Phase 7 UI/CRM polish] `LeadForm.tsx` already enforces each field's
  // admin-configured `required` flag client-side (native HTML `required`),
  // but that's advisory only — a non-browser POST to this endpoint could
  // skip it entirely. Re-checking the same admin-configured requirement
  // here is what makes "server-side validation remains authoritative"
  // actually true, not just a client-side nicety. Only fields the admin
  // both enabled AND marked required are checked — an admin-disabled
  // field was never collected in the first place, so requiring it here
  // would incorrectly reject every submission.
  const formSettings = await getLeadFormSettings();
  const values: Record<string, string | undefined> = {
    name,
    email,
    phone,
    company: submission.company,
    service: submission.service,
    projectType: submission.projectType,
    budget: submission.budget,
    timeline: submission.timeline,
    message: submission.message,
    preferredContactMethod: submission.preferredContactMethod,
  };
  const missingRequired = formSettings.fields
    .filter((f) => f.enabled && f.required && !values[f.key])
    .map((f) => f.label);
  if (missingRequired.length > 0) {
    return NextResponse.json({ error: `${missingRequired.join(", ")} ${missingRequired.length === 1 ? "is" : "are"} required.` }, { status: 400 });
  }

  try {
    const lead = await createLeadRecord(submission);
    return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save your inquiry — please try again." }, { status: 500 });
  }
}
