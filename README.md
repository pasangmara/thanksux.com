# Thanks UX

Portfolio + CMS site for Thanks UX, built with Next.js (App Router) and Supabase. Includes a public site, an admin dashboard for managing content/leads, and a JSON-file fallback backend for local development without Supabase.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, React 19)
- [Supabase](https://supabase.com) (Postgres, Auth, Storage) — public-user auth, CMS content, and CRM leads
- Tailwind CSS 4
- TypeScript

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env.local
   ```

   `.env.local` is gitignored and never committed. See the comments in `.env.example` for what each variable does and where to find it (Supabase Dashboard → Settings → API for the Supabase values).

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Running without Supabase

The CMS, leads, and admin-auth repositories can run against local `data/*.json` files instead of Supabase — useful for quick local work without a Supabase project. Leave `DATA_BACKEND` unset in `.env.local` (or set it to anything other than `supabase`) to use the JSON backend. Set `DATA_BACKEND=supabase` to read/write Supabase instead. See `src/lib/cms/dataBackend.ts` for details — this is a single flag that switches both reads and writes together per domain.

The first admin account is created through `/admin/setup`, available only until the first account exists — there's no seeded credential.

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
npx tsc --noEmit  # type-check without emitting
```

## Environment variables

See `.env.example` for the full list with explanations. Summary:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Only if using Supabase | Public — safe to expose to the browser |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Only if using Supabase | Public — access is enforced by RLS, not key secrecy |
| `SUPABASE_SERVICE_ROLE_KEY` | Only if using Supabase | **Server-only.** Bypasses Row Level Security. Never expose to the client or commit it. |
| `SUPABASE_ACCESS_TOKEN` | Only for `supabase db push` | Personal access token, not a project API key. Never used at runtime. |
| `DATA_BACKEND` | No | `supabase` to use Supabase for CMS/CRM; unset for the local JSON backend. |
| `NEXT_PUBLIC_SITE_URL` | No (**required** in production) | Used to build auth email redirect links. Falls back to `http://localhost:3000`. Set to `https://thanksux.com` in the production hosting platform's env config. |
| `N8N_WEBHOOK_URL` | No | Optional lead-event webhook fan-out. |
| `NOTIFY_EMAIL_TO` | No | Only affects a status label in `/admin/marketing`; does not send email yet. |

## ThanksUX Production Deployment

Production domain: **https://thanksux.com** (registered at Hostinger; DNS/nameservers are managed there, unrelated to Vercel/Next.js config below). Actual hosting is provided by the office developer's existing server — see "Still needed from the hosting provider" below before anything can go live.

### Requirements

- **Node.js ≥ 20.9.0** (Next.js 16's own minimum — see `package.json`'s `engines` field)
- npm (this repo is committed with `package-lock.json`; use `npm ci` for reproducible installs)
- A process manager or platform that can run a persistent Node server (`npm run start`), **or** a static/serverless host that supports Next.js's App Router — see the filesystem note below before choosing a serverless target

### Install → build → start

```bash
npm ci
npm run build
npm run start   # serves on port 3000 by default; set PORT to override
```

### Environment variables

Set all of the variables listed under [Environment variables](#environment-variables) above in the hosting platform's environment configuration — never in a committed file. At minimum for production:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from the Supabase project's Settings → API
- `DATA_BACKEND=supabase` — routes CMS/CRM/admin-auth reads and writes to Supabase instead of local `data/*.json`. **Required for a normal production deploy**: the JSON fallback writes to the local filesystem, which does not persist correctly on most serverless/ephemeral hosts (see `src/lib/cms/fileStore.ts`'s header comment) and isn't shared across multiple server instances either way.
- `NEXT_PUBLIC_SITE_URL=https://thanksux.com` — controls password-reset/signup-confirmation email redirect links (`src/app/api/auth/user/*`) and is the base `generateMetadata()` falls back toward; **admin-editable `Settings → Site Identity → Site URL` is the actual source used for OG/canonical `metadataBase` and for `sitemap.ts`/`robots.ts`'s absolute URLs — set that field to `https://thanksux.com` in `/admin/settings` once the site is live**, independently of this env var.

### Supabase configuration to update at go-live (not before — nothing is live yet)

1. Dashboard → Authentication → URL Configuration → Site URL → `https://thanksux.com`
2. Redirect URL allowlist already includes `https://thanksux.com/**` and `https://www.thanksux.com/**` (done — see `docs/PHASE_5B_PRODUCTION_CHECKLIST.md`)
3. Dashboard → Authentication → Emails → SMTP Settings → configure a real provider (Postmark/Resend/SES/SendGrid) — the shared default mailer's rate limit is already exhausted for this project; this is the one remaining functional blocker per `docs/PHASE_5B_PRODUCTION_CHECKLIST.md`

### SSL

Required — Supabase Auth cookies and the redirect URLs above assume `https://`. Whether this is handled by the hosting platform, a reverse proxy (e.g. Caddy/nginx + Let's Encrypt), or Cloudflare in front of the origin is the office hosting provider's decision, not something this codebase configures.

### DNS

Not handled here. The domain is registered at Hostinger; DNS records must point at wherever the office server hosts this app (A/AAAA record, or a CNAME if fronted by a CDN/proxy). This is explicitly out of scope for this codebase change — coordinate directly with the office developer.

### GitHub workflow

`.github/workflows/ci.yml` runs `tsc --noEmit`, `lint`, and `build` on every push/PR — verification only, no deployment step, since the actual deploy target isn't known yet. Add a deploy job once it is (see "Still needed" below); avoid inventing SSH hosts/keys/paths in the meantime.

### Still needed from the hosting provider before going live

- [ ] Server type (VPS/dedicated/shared) and whether it can run a persistent Node process, vs. needing a reverse proxy + process manager (pm2/systemd) in front of `npm run start`
- [ ] Deployment mechanism (git pull + build on the server, rsync/SCP, a CI/CD deploy step, a Docker image, etc.) — determines what (if anything) gets added to `.github/workflows/`
- [ ] SSH/access details, hosting path, and any platform-specific env var configuration UI
- [ ] Whether SSL termination happens on that server or in front of it

None of the above is invented or assumed anywhere in this codebase — every reference to the production domain goes through `NEXT_PUBLIC_SITE_URL` / the admin-editable `Settings → Site URL` field, never a hardcoded literal.

See `docs/PHASE_5B_PRODUCTION_CHECKLIST.md` for the full Supabase/auth production-readiness checklist (RLS, rate limiting, sessions, admin separation).

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
