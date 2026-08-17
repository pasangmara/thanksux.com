/**
 * ["I can solve this" real notification flow — Part F/O] Architecture
 * only, deliberately NOT a working send path — same honest posture as
 * src/lib/notifications/channels/emailChannel.ts (the CRM lead-email
 * stub), which this project already established as the pattern for "no
 * real provider wired yet": `isConfigured()` reflects real env var
 * presence, `send()` never fakes success. Kept as its own small file
 * rather than folded into the CRM's `NotificationChannel`/`dispatch.ts`
 * system — that system's `NotificationEvent` type is hard-coupled to
 * `Lead` (src/lib/notifications/types.ts), a different domain; reshaping
 * it to also carry ThanksSignal/Contribution data would touch working CRM
 * code for a single new call site, which is out of scope here.
 *
 * Verified live before writing this: grepped the whole repo and `.env.local`
 * for any SMTP/provider credential (RESEND_API_KEY, SENDGRID_API_KEY,
 * SMTP_HOST, etc.) — none exist. No email dependency is installed either
 * (`nodemailer` or similar isn't in package.json). So `isConfigured()`
 * below is honestly `false` today; wiring a real provider later is a
 * self-contained change to just this file.
 */

export interface AuthorOfferEmailInput {
  toEmail: string;
  authorName: string;
  problemTitle: string;
  contributorName: string;
  message: string | null;
  signalUrl: string;
}

/**
 * Server-only, service-role lookup of a real auth user's email — `profiles`
 * has no email column (deliberately, per publicProfiles.ts's own header
 * comment), so this is the one legitimate path to it: Supabase's Admin API
 * (`GET /auth/v1/admin/users/:id`), same technique this project's own QA
 * tooling already uses to provision disposable test accounts. Only ever
 * called server-side, only when a real provider is actually configured
 * (see isEmailProviderConfigured() below) — never reaches the client.
 */
export async function getAuthUserEmail(authUserId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/auth/v1/admin/users/${authUserId}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string };
  return data.email ?? null;
}

export function isEmailProviderConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim() || process.env.SMTP_HOST?.trim(),
  );
}

export async function sendAuthorOfferEmail(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the intended call shape; unused until a real provider is wired, same as emailChannel.ts's own send()
  _input: AuthorOfferEmailInput,
): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "No email provider is configured (RESEND_API_KEY/SENDGRID_API_KEY/SMTP_HOST) — email delivery is not implemented yet." };
}
