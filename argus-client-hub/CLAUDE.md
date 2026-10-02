@AGENTS.md

# ARGUS Client Hub: guide for Claude Code

You are working on ARGUS Client Hub: a client feedback form plus a relationship dashboard for **ARGUS**. ARGUS is a Bangladesh studio for brand, website, AI automation, ads and content. Founder: **Joy Howlader**.

Read `README.md` for the product. `docs/N8N.md` covers integrations and `docs/DESIGN.md` covers the design.

## What this product is (and is not)

- **Is:**
  - ARGUS's own clients rate an ARGUS project through a personal link (`/feedback/<code>`).
  - The ARGUS team manages clients, follow-ups and testimonial posts in `/hub`.
- **Is not:**
  - a tool for ARGUS's clients' customers (no restaurant or shop reviews);
  - a creative editor;
  - a social publishing tool.
- **Honesty rules (from the owner):**
  - Never add fake reviews, fake numbers, fake countdowns or fabricated results.
  - Sample data exists only in demo mode and is always labelled "Sample data".
  - Never post feedback without the client's permission. This is enforced in `services/feedback.ts` and by the DB constraint `post_needs_permission`.
- **Language:**
  - The public form is English + বাংলা. Every string lives in `src/lib/i18n/form.ts`; keep both languages in sync.
  - The dashboard is English.
  - All dates show in Asia/Dhaka (`src/lib/util-client.ts`).

## Commands

```bash
npm run dev          # demo mode if DATABASE_URL is empty (login joy@argus.demo / argus-demo)
npm run typecheck && npm run lint && npm run build   # run all three before you finish
npm run db:migrate   # apply db/migrations/*.sql
npm run demo:reset   # fresh sample data
```

There is no unit-test runner yet. Verify UI changes in the browser. Playwright works if it is installed:
- form: `/feedback/orbit-clinic-m2k8wd`
- dashboard: `/hub`
- every component: `/design`

## Architecture (follow these patterns)

- **Data access:**
  - Use `getStore()` from `src/lib/data/store.ts`. Two implementations share one interface: `pg-store.ts` (Postgres via `postgres` npm) and `demo-store.ts` (JSON in `.data/`).
  - Column names are snake_case and identical in both stores, so there is no mapping layer.
  - A new table needs: SQL in a **new** file `db/migrations/00N_*.sql` (never edit applied migrations) + the `TableName` union + seed (`data/seed.ts`) + demo `EMPTY`.
- **Business logic:**
  - Lives in `src/lib/services/*`.
  - Pages (server components) call services directly. Client components call **server actions** in `src/app/hub/actions/*` or `src/app/feedback/[code]/actions.ts`.
- **Server actions:**
  - Always `run(async () => { const me = await assertMember(); … })`.
  - Validate with zod and return `ActionResult` (`ok(data, message)` / `fail(error, fieldErrors)`).
  - Throw `UserError` for messages the user should see.
  - Call `revalidatePath("/hub", "layout")` after mutations.
  - Admin-only work uses `assertMember({ admin: true })`.
  - Render-time checks are not security.
- **Integrations:**
  - Never call n8n or Google directly from a service. Use `emit(event, data)` from `src/lib/integrations/outbox.ts`; it writes to the outbox, tries delivery, and never throws.
  - A new event type means: add it to `EVENT_NAMES` in `domain/types.ts`, then document its payload in `docs/N8N.md` and `EVENT_HELP` in `components/hub/SettingsForms.tsx`.
- **Files:**
  - Images go through `saveImage()`, which checks the real signature (JPG/PNG/WEBP, max 5 MB; SVG is not allowed).
  - They are stored in the Postgres `files` table and served by `/api/files/[id]`.
- **Auth:**
  - Custom: scrypt + DB sessions (`src/lib/auth`).
  - `proxy.ts` (Next 16's renamed middleware) only redirects when there is no cookie. The real check is `requireMember()` in `hub/(app)/layout.tsx` and in every action.

## UI conventions

- **Tokens** are in `src/app/globals.css` (`@theme`). Use Tailwind names (`bg-surface`, `text-muted`, `border-line`, `text-mint`…), never hex in components. Utilities: `card`, `field`, `label-mono`, `skeleton`.
- **Fonts:**
  - Space Grotesk: `font-display`, for titles.
  - Geist: UI.
  - Geist Mono: `label-mono`.
  - Noto Sans Bengali: `lang-bn` / `font-bn`.
- **Primitives** are in `src/components/ui`; reuse them before adding new ones:
  - Button / ButtonLink
  - Pill (tones)
  - RatingInput / StarRow
  - Chip
  - Toggle
  - Segmented
  - Modal / Drawer (focus trap, Esc)
  - Toast (`useToast`)
  - Field components
- **Motion:**
  - Use `motion/react`. `MotionConfig reducedMotion="user"` is global.
  - **Keyframe arrays (`[0, 1, 0]`) need `transition={{ type: "tween" }}`.** Springs only take two values, and a spring with keyframes throws inside the frame loop and freezes *all* animations on the page.
- **Forms:**
  - Use `onSubmit` + `new FormData(e.currentTarget)`, not `<form action={fn}>`. React resets uncontrolled fields after a function action, which loses input when validation fails.
  - The login page is the exception (`useActionState`).
- **Lint:** reading `localStorage` in effects needs an `eslint-disable-next-line react-hooks/set-state-in-effect` with a reason (hydration). Avoid setState-in-effect elsewhere.
- **Status colors** are in `src/lib/domain/labels.ts`. Keep them in one place.

## Next.js 16 notes (this is NOT Next 14)

- `params`, `searchParams`, `cookies()` and `headers()` are **async**: `await` them.
- Middleware is now `proxy.ts` (`export function proxy`).
- Server Action body limit is set to 6 MB in `next.config.ts` for uploads.
- Turbopack is the default. `turbopack.root` is set because this folder sits inside the larger thanksux.com repo.
- Read `node_modules/next/dist/docs/` before using an API you're unsure about.

## Environment

See `.env.example`.
- `DATABASE_URL` empty = demo mode.
- A production build refuses demo mode unless `ALLOW_DEMO_IN_PRODUCTION=true`.
- Never commit real secrets.
- n8n URL/secret can come from env (wins) or from Settings (stored in the `settings` row; never sent to the browser).

## Brand assets

`public/brand/`:
- `argus-logo.png`
- `argus-symbol.png` / `argus-symbol-256.png`
- `founder-thank-you.webp` (default thank-you photo)
- `founder-avatar.webp` (default round photo)

Admins can replace both founder photos at runtime in Settings → Form branding.
