# PHASE_5B_PRODUCTION_CHECKLIST.md

Concise production-readiness checklist for public-user (Supabase Auth) sign-in on Thanks UX. Admin auth (Phase 1, `data/users.json`) is a separate system and isn't covered here — see `docs/AUTH_PHASE_1.md`.

**Nothing in this document has been deployed.** thanksux.com has no confirmed live DNS/hosting as of this phase — items below are prepared, not activated.

| Item | Current state | What's needed before production |
|---|---|---|
| **Supabase Site URL** | `http://localhost:3000` | Change to `https://thanksux.com` in Supabase Dashboard → Authentication → URL Configuration, **at deploy time** — changing it now would be premature (nothing is live there yet). |
| **Redirect URL allowlist** | `http://localhost:3000/**, https://thanksux.com/**, https://www.thanksux.com/**` (already updated this phase) | Nothing further — already covers the production domain (with and without `www`) alongside localhost. |
| **SMTP / email provider** | **Not configured** — using Supabase's shared default mailer (`smtp_host` unset, `rate_limit_email_sent: 2`/hour). Confirmed live: the shared mailer's rate limit is already exhausted for this project. | Configure a real provider in Supabase Dashboard → Authentication → Emails → SMTP Settings (host, port, username, password, sender address — e.g. Postmark, Resend, SES, SendGrid). Nothing in this app needs to change once that's set; `resetPasswordForEmail`/`signUp` already call the right APIs. |
| **Production domain** | thanksux.com ownership/DNS status not verified by this session — no deployment has occurred at any point in this project's work. | Confirm DNS + hosting before flipping Site URL. |
| **Environment variables** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` set in `.env.local` (dev only). `NEXT_PUBLIC_SITE_URL` unset (falls back to `http://localhost:3000`). | Set all four in the production hosting platform's env config; `NEXT_PUBLIC_SITE_URL=https://thanksux.com` specifically controls the confirmation/reset email redirect targets this app constructs. |
| **RLS** | `profiles`: public read, self-only update (role-escalation blocked by policy), admin full access — verified live this phase, including a real cross-user mutation attempt (0 rows affected). | No further action — already the correct production shape for this table. |
| **Rate limiting** | In-memory, per-IP (`lib/rateLimit.ts`) on signup/login/password-reset/profile-update — verified live this phase. | Known, already-documented limitation (Phase 1): resets on restart, doesn't coordinate across multiple instances. Acceptable for a single-instance deploy; needs a shared store (Redis/Upstash) for a multi-instance production deploy. |
| **Cookie/session behavior** | `@supabase/ssr` default cookie handling via `proxy.ts`'s `refreshSupabaseSession()`. Session persists across requests; logout is real server-side revocation (verified). | Confirm `secure` cookie attribute is active once served over real HTTPS (the library sets this based on request protocol — nothing to configure manually). |
| **Password reset** | Full flow built and wired (request → email → `/reset-password` → new password); invalid/expired links now detected and reported clearly (Phase 5B). | Blocked only by the SMTP item above — the code path is production-ready once email delivery is. |
| **Email verification** | Required (`mailer_autoconfirm: false`); UI correctly shows "check your email" and never claims an unconfirmed account is active. | Same SMTP blocker — verification itself is correctly enforced, only delivery is unresolved. |
| **Admin separation** | Verified live with an active public session: `/admin/*` pages and `/api/admin/*` remain unreachable regardless of public sign-in state. | No action — already correct. |

## Summary
The only real production blocker is **SMTP configuration** — everything else (RLS, redirects, session handling, admin separation, rate limiting) is already in a correct, verified state. Domain cutover (Site URL) is a deliberate manual step to take at actual deploy time, not before.
