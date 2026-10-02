# Deploy: Supabase (Postgres) + Vercel

Time needed: about 20 minutes.

## 1. Database (Supabase)

1. Go to https://supabase.com → **New project**.
   - Region: Singapore (or Mumbai).
   - Save the database password somewhere safe.
2. Open **Project Settings → Database → Connection string**.
   - Pick **Transaction pooler** (port **6543**) and copy the URI.
   - Replace `[YOUR-PASSWORD]` in it.
3. On your computer, in `argus-client-hub/`:
   ```bash
   npm install
   echo 'DATABASE_URL=postgres://…6543/postgres' > .env.local
   npm run db:migrate
   npm run admin:create -- --email neonemiami@gmail.com --name "Joy Howlader"
   ```
   Keep the printed password.

The app connects with the `postgres` npm driver. `prepare: false` is set, which the transaction pooler needs.

Supabase's REST API (anon key) cannot read these tables: RLS is on with no policies. **Do not add RLS policies** unless you also build a client-side Supabase feature on purpose.

## 2. App (Vercel)

1. https://vercel.com → **Add New → Project**, then import the GitHub repo.
2. **Root Directory:** `argus-client-hub`. The framework is detected as Next.js.
3. **Environment variables** (Production + Preview):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the pooler URI from step 1 |
   | `PUBLIC_BASE_URL` | `https://feedback.argusofficial.com` (your final domain) |
   | `CRON_SECRET` | a long random string (`openssl rand -base64 32`) |
   | `N8N_WEBHOOK_URL` / `N8N_WEBHOOK_SECRET` | later, or set them in the dashboard |

4. Click **Deploy**.
5. **Settings → Domains:** add `feedback.argusofficial.com` (or `app.argusofficial.com`). At your domain registrar, add the CNAME Vercel shows.
6. Visit `https://<domain>/api/health` and expect `{"ok":true,"store":"postgres"}`.
7. Sign in at `/hub/login`, then change your password in **Settings → My account**.

Cron: `vercel.json` schedules `/api/cron/daily` every day at 04:00 UTC (10:00 Bangladesh). Vercel adds the `Authorization: Bearer $CRON_SECRET` header itself.

## 3. Updating

- Push to the branch Vercel watches; it redeploys.
- For a schema change, add a **new** file `db/migrations/002_xxx.sql` and run `npm run db:migrate` against production **before** deploying code that needs it.

## 4. Backups

Supabase takes daily backups on paid plans. For the free plan, export weekly from **Dashboard → Feedback → Export CSV**, or use `pg_dump "$DATABASE_URL" > backup.sql`.

## 5. Other hosts

- Any Node 20+ server: `npm ci && npm run build && npm start` (port 3000), behind HTTPS.
- Any Postgres 14+: Neon, Railway, RDS or self-hosted.
- With more than one server instance, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (same value everywhere). Also note the login/submit rate limiter is in memory: switch `src/lib/rate-limit.ts` to Redis (Upstash) if you scale out.
