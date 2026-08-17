-- [UX Audit platform] Purely additive: two new tables, zero changes to any
-- existing table. Reuses media_assets/Storage for screenshot uploads (no
-- parallel media system) — see mediaUpload.ts's createMediaAsset().
--
-- One audit engine, three scopes ("ux"/"web"/"design" — audit_type), per
-- the explicit "do not build three unrelated systems" instruction — the
-- scope only changes which rule categories run and how they're weighted,
-- never the schema.
--
-- Security model (see auditsRepository.ts's header comment for the full
-- reasoning): an authenticated visitor's audits are strictly owner-only
-- (RLS `audits_select_own` — `user_id = auth.uid()`, never satisfied by
-- anyone else, including anonymous). An anonymous audit (`user_id is
-- null`) has no session to scope it to at all, so it is NOT reachable via
-- RLS from any client session (anonymous or otherwise) — deliberately, to
-- prevent an unauthenticated session from enumerating every anonymous
-- audit via an unfiltered `select=*`. Anonymous audits are instead read
-- back through one server-side, single-row-by-id API route
-- (/api/audit/[id]) using the service-role key — the audit's own
-- unguessable uuid `id` is the access credential, the same "anyone with
-- the link" model most no-login report tools use. There is no `select *`
-- surface anywhere that could enumerate them.

create table if not exists public.audits (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references public.profiles(id) on delete set null,
  audit_type            text not null check (audit_type in ('ux', 'web', 'design')),
  input_type            text not null check (input_type in ('url', 'screenshot')),
  input_url             text,
  input_media_asset_id  uuid references public.media_assets(id),
  context               text,
  status                text not null default 'pending'
                          check (status in ('pending', 'fetching', 'analyzing', 'scoring', 'completed', 'failed')),
  error_message         text,
  overall_score         int,
  category_scores       jsonb not null default '{}',
  evidence              jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);
create index if not exists audits_user_idx on public.audits (user_id, created_at desc);

create table if not exists public.audit_findings (
  id              uuid primary key default gen_random_uuid(),
  audit_id        uuid not null references public.audits(id) on delete cascade,
  category        text not null,
  severity        text not null check (severity in ('critical', 'high', 'medium', 'low', 'good')),
  title           text not null,
  evidence        text not null,
  problem         text not null,
  why_it_matters  text not null,
  recommendation  text not null,
  impact          text not null check (impact in ('high', 'medium', 'low')),
  effort          text not null check (effort in ('high', 'medium', 'low')),
  "order"         int not null default 0
);
create index if not exists audit_findings_audit_idx on public.audit_findings (audit_id, "order");

alter table public.audits enable row level security;
alter table public.audit_findings enable row level security;

-- Strictly owner-only — an anonymous audit (user_id is null) is never
-- selected by this policy for *anyone*, including the visitor who created
-- it (auth.uid() is also null for them, and null = null is not true in
-- SQL) — that's deliberate, see this file's header comment; anonymous
-- reads go through the service-role API route instead, never direct
-- client REST.
create policy "audits_select_own" on public.audits
  for select using (user_id = auth.uid());

-- Both an authenticated visitor's own audit and an anonymous one
-- (user_id left null) can be inserted through the RLS-bound session
-- client — this is a write-only allowance; immediately after insert, an
-- anonymous session still can't read the row back via RLS (by design),
-- which is why the create flow always returns the new row directly from
-- the insert response rather than relying on a follow-up SELECT.
create policy "audits_insert_own" on public.audits
  for insert with check (user_id = auth.uid() or user_id is null);

create policy "audit_findings_select_own" on public.audit_findings
  for select using (
    exists (select 1 from public.audits a where a.id = audit_id and a.user_id = auth.uid())
  );

create policy "audit_findings_insert_own" on public.audit_findings
  for insert with check (
    exists (
      select 1 from public.audits a
      where a.id = audit_id and (a.user_id = auth.uid() or a.user_id is null)
    )
  );
