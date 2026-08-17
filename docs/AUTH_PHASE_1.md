# AUTH_PHASE_1.md

## Phase 1 — Authentication Foundation

**Status:** Implemented and QA'd against the real running dev server. No database migration, no JSON data touched, no public Thanks UX community feature added. `/admin/*` and `/api/admin/*` now require a real admin session; the public portfolio and all existing CMS functionality are unaffected for an authenticated admin.

---

## 1. Chosen approach — and why it's not "Supabase" yet

Three providers were compared for the eventual production target (Supabase Auth+Postgres, Auth.js/NextAuth+Postgres, Firebase) per the approved architecture audit. **Supabase remains the recommended long-term choice** — built-in social login, Row Level Security matching this project's ownership model, and a natively relational fit for the Problem→Contribution→CaseStudy data shape planned for later phases.

**This phase does not install any of them.** Two hard constraints made that the correct call for Phase 1 specifically, not a compromise:

1. **No real credentials exist.** Supabase/Firebase both require a provisioned external project (URL + API keys) before a single line of auth code can be tested. This agent has no ability to create that account. Installing the SDK now would mean shipping untestable code — exactly the "no fake completion" rule this phase was built under.
2. **The task explicitly deferred the database.** "Do not create the full production schema yet unless authentication absolutely requires the minimum user/auth tables... keep the repository abstraction compatible with the future migration: JSON repository → database repository → same interface." Supabase Auth *is* backed by Postgres — adopting it now would mean starting Phase 2's database migration inside Phase 1, which was explicitly out of scope.

**What was actually built:** a real, working, fully self-contained auth foundation using this project's own established pattern — a JSON-backed repository (`data/users.json`, `data/sessions.json`, via `lib/cms/fileStore.ts`, the exact mechanism `projectsRepository.ts`/`leadsRepository.ts` already use) — with zero new npm dependencies (password hashing via Node's built-in `crypto.scrypt`, sessions as cryptographically random opaque tokens, not JWTs). This is a real, secure, testable-today implementation, architected so the Phase 2 swap to Supabase (or any Postgres-backed provider) only changes the *internals* of `usersRepository.ts`/`sessionsRepository.ts` — every caller (API routes, `proxy.ts`, `getCurrentUser()`) keeps the same function signatures, the same migration discipline already proven for every other entity in this project (see the prior architecture audit's Phase C).

---

## 2. Architecture

```
Browser
  → src/proxy.ts (Next.js 16's "Proxy" — see §3)
      → allowed?  → page/route renders
      → denied?   → redirect (page) or 401/403 JSON (API)

Route Handler (e.g. /api/admin/projects)
  → requireAdmin() (lib/auth/requireAuth.ts) — defense-in-depth, see §3
      → 401/403 if not admin
      → proceeds otherwise, unchanged from before this phase
```

**Files:**
- `src/types/auth.ts` — `User`, `PublicUser`, `Session`, `UserRole`
- `src/lib/auth/passwords.ts` — scrypt hash/verify, timing-safe compare
- `src/lib/auth/usersRepository.ts` — `data/users.json`
- `src/lib/auth/sessionsRepository.ts` — `data/sessions.json`
- `src/lib/auth/session.ts` — `getCurrentUser()` (Server Components/Route Handlers)
- `src/lib/auth/requireAuth.ts` — `requireUser()` / `requireAdmin()` (Route Handlers)
- `src/lib/auth/ownership.ts` — `isOwnerOrAdmin()` (unused today, ready for Phase 5/6)
- `src/lib/auth/constants.ts` — cookie name/maxAge/secure-flag logic
- `src/lib/rateLimit.ts` — in-memory sliding-window limiter
- `src/proxy.ts` — route-level enforcement
- `src/app/api/auth/{signup,login,logout,session,setup,request-password-reset}/route.ts`
- `src/app/admin/{login,setup}/page.tsx`
- `src/components/admin/AdminShell.tsx` — extended with logged-in-user display + Logout

---

## 3. Why `proxy.ts`, not `middleware.ts`

Verified against this exact Next.js version's own bundled docs
(`node_modules/next/dist/docs/.../proxy.md`), per this project's own
`AGENTS.md` instruction to check that before writing framework code:
**Next.js 16 deprecated and renamed `middleware.ts` to `proxy.ts`**
(export name `proxy`, not `middleware`). Critically, **Proxy defaults to
the Node.js runtime in v16** — the old Edge-only restriction that would
have blocked `fs`-based session lookups from running inside route
protection no longer applies, which is what makes this JSON-file-backed
approach viable at the route-protection layer at all.

Next's own documentation for this feature explicitly recommends a
second, independent check inside each protected handler ("Always verify
authentication and authorization inside each Server Function rather than
relying on Proxy alone") — that's `requireAdmin()`, called at the top of
all 14 existing `/api/admin/*` route handlers. This isn't redundant
defensiveness for its own sake; it's the documented mitigation against a
future matcher change or route refactor silently removing Proxy coverage
without anyone noticing.

---

## 4. Role model

| Role | Meaning today | Meaning (future) |
|---|---|---|
| *(no account)* | Visitor — full public site, can submit the lead form | same |
| `user` | Default role for anyone who signs up | Registered User — submit a problem, give Thanks, save work |
| `creator` | Signup default cannot produce this — reserved | Creator/Contributor — publish a design response |
| `admin` | Full CMS/CRM/marketing access | same |

**Not every authenticated user is an admin** — `/api/auth/signup` always creates `role: "user"`. The only path to an admin account is `/api/auth/setup`, which permanently disables itself the moment any account exists.

---

## 5. Session model

Opaque, cryptographically random 256-bit token (`crypto.randomBytes(32)`), stored server-side in `data/sessions.json` with a 30-day expiry, set as an `httpOnly`, `sameSite=lax` cookie (`secure` in production only, so local `http://localhost` dev still works). No signing secret, no JWT — the token's own unguessability is the security property, and revocation is a real delete (`/api/auth/logout` removes the row, not just the cookie), unlike a stateless JWT that stays valid until natural expiry even after "logout."

---

## 6. Protected routes

Every existing `/admin/*` page and `/api/admin/*` route (14 API route files, 10 existing page files, verified by directory listing before implementation) is now admin-only, enforced at `proxy.ts` and again inside each API handler. `/admin/login` and `/admin/setup` are the two admin-namespace exceptions, always public (otherwise nobody could ever log in). Public routes (`/`, `/work`, `/work/[slug]`, `/about`, `/contact`) and `/api/leads` (POST) are completely untouched — no auth check added, no behavior change.

---

## 7. Ownership model

`lib/auth/ownership.ts`'s `isOwnerOrAdmin(user, ownerId)` exists and is unit-testable today but is **not called anywhere yet** — no user-owned content exists (Projects, Leads, every CMS record are still exclusively admin-owned). It's ready for Phase 5/6, when `Problem`/`Contribution` records get a real `ownerId` to check against.

---

## 8. Environment variables

**None are required for this phase to function.** See `.env.example`'s new comment block. `N8N_WEBHOOK_URL`/`NOTIFY_EMAIL_TO` (from the prior CRM/marketing phase) are unrelated to auth and unchanged.

---

## 9. Email dependency — explicitly not production-ready

Password reset (`POST /api/auth/request-password-reset`) reuses the existing `emailChannel` abstraction from the CRM notification system (`lib/notifications/`) rather than inventing a second email concept. It checks `emailChannel.isConfigured()` and **honestly refuses** (503, clear message) rather than pretending to send a reset email that will never arrive. Email verification on signup is similarly not enforced — `emailVerifiedAt` stays unset and login is never gated on it, since gating on an unreachable verification step would be a permanent lockout, not a security improvement. **Do not consider password reset or email verification production-ready until a real email provider is wired into `emailChannel.send()` and tested end-to-end.**

---

## 10. Rate limiting — status

`POST /api/leads` (the one public write endpoint) now has a real, working per-IP limit: 5 submissions per 10 minutes, enforced via `lib/rateLimit.ts`. **Known, stated limitation:** this is in-memory, single-process — it resets on every server restart and does not coordinate across multiple server instances/serverless cold starts. That's an explicit, deliberate scope boundary for this phase, not an oversight — a real distributed limit needs a shared store (Redis/Upstash) fronting every instance, which this phase does not add, per the task's own "if it requires a broader infrastructure decision, document it and do not over-engineer" instruction. Admin routes have no rate limiting yet (lower priority — they require a valid admin session already, unlike the fully public lead endpoint).

---

## 11. Future database migration path

Exactly the migration story from the approved architecture audit's Phase C: when Phase 2 introduces a real database, only `usersRepository.ts`'s and `sessionsRepository.ts`'s internal function bodies change (swap `readJsonFile`/`writeJsonFile` calls for DB queries) — every caller (`proxy.ts`, `requireAuth.ts`, every API route) keeps importing the same named exports with the same signatures. `data/users.json`/`data/sessions.json` would be imported into the new schema via the same "verify row-for-row before flipping" discipline already specified for Projects/Leads.

---

## 12. Rollback strategy

Auth is fully additive — no existing file was rewritten beyond adding an import + 2-line check at the top of existing handlers, and `AdminShell.tsx`'s banner text. To roll back:
1. Delete `src/proxy.ts` — every route becomes reachable exactly as it was pre-Phase-1 (the `requireAdmin()` calls inside route handlers would then 401 everyone including the admin, so this alone isn't sufficient — see step 2).
2. Alternatively/additionally, comment out or remove the `requireAdmin()` calls added to each route handler (all changes are additive 2-3 line blocks, easy to identify and revert per file).
3. `data/users.json`/`data/sessions.json` can simply be deleted — no other part of the CMS reads them; the CMS's own data (`projects.json`, `settings.json`, etc.) is completely unaffected either way.

No data migration ever happened this phase, so there is nothing to reverse on that front.
