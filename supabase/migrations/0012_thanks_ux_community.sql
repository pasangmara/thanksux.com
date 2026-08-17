-- [Phase 6A — Thanks UX community data model] NOT YET APPLIED. Written for
-- review per the explicit instruction "Do not execute the new migration
-- yet unless explicitly approved after review." See
-- docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md for the full design rationale.
--
-- Purely additive: five new tables, zero changes to any existing table
-- (profiles, media_assets, projects, and everything else are referenced
-- by FK only, never altered). Fully reversible with `drop table` in
-- reverse dependency order — see the architecture doc's rollback section.

-- ---------------------------------------------------------------------
-- thanks_signals — a real-world problem/opportunity a user submits.
-- ---------------------------------------------------------------------
create table if not exists public.thanks_signals (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text not null,
  category     text,
  context      text,
  audience     text,
  status       text not null default 'draft'
                 check (status in ('draft','submitted','reviewed','open','in_progress','resolved','archived')),
  visibility   text not null default 'private'
                 check (visibility in ('private','public')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists thanks_signals_author_idx on public.thanks_signals (author_id);
create index if not exists thanks_signals_status_idx on public.thanks_signals (status);
create index if not exists thanks_signals_visibility_idx on public.thanks_signals (visibility);

-- ---------------------------------------------------------------------
-- contributions — someone responding to a thanks_signal.
-- ---------------------------------------------------------------------
create table if not exists public.contributions (
  id                  uuid primary key default gen_random_uuid(),
  thanks_signal_id    uuid not null references public.thanks_signals(id) on delete cascade,
  contributor_id      uuid not null references public.profiles(id) on delete cascade,
  contribution_type   text,
  explanation         text,
  research            text,
  observation         text,
  proposed_direction  text,
  prototype_url       text,
  figma_url           text,
  external_url        text,
  status              text not null default 'draft'
                        check (status in ('draft','submitted','under_review','approved','rejected','archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists contributions_signal_idx on public.contributions (thanks_signal_id);
create index if not exists contributions_contributor_idx on public.contributions (contributor_id);
create index if not exists contributions_status_idx on public.contributions (status);

-- Media attached to a contribution — reuses media_assets (no new image
-- table), one row per attached asset, ordered.
create table if not exists public.contribution_media (
  id              uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.contributions(id) on delete cascade,
  media_asset_id  uuid not null references public.media_assets(id) on delete cascade,
  "order"         int not null default 0
);
create index if not exists contribution_media_contribution_idx on public.contribution_media (contribution_id, "order");

-- ---------------------------------------------------------------------
-- design_responses — the actual design/UX response to a contribution.
-- ---------------------------------------------------------------------
create table if not exists public.design_responses (
  id                   uuid primary key default gen_random_uuid(),
  contribution_id      uuid not null references public.contributions(id) on delete cascade,
  author_id            uuid not null references public.profiles(id) on delete cascade,
  discipline           text not null, -- free text, same convention as projects.category — no CHECK enum, so a new discipline never needs a migration
  summary              text,
  research_findings    text,
  design_decisions     text,
  outcome              text,
  case_study           jsonb not null default '{}', -- same flexible-narrative pattern as projects.case_study (Phase 2B/3B) — category-driven fields without a column per field
  prototype_url        text,
  figma_url            text,
  published_project_id uuid references public.projects(id) on delete set null, -- optional link ONLY — projects itself is never altered
  status               text not null default 'draft'
                          check (status in ('draft','submitted','under_review','approved','published','rejected','archived')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists design_responses_contribution_idx on public.design_responses (contribution_id);
create index if not exists design_responses_author_idx on public.design_responses (author_id);
create index if not exists design_responses_status_idx on public.design_responses (status);
create index if not exists design_responses_project_idx on public.design_responses (published_project_id);

create table if not exists public.design_response_media (
  id                 uuid primary key default gen_random_uuid(),
  design_response_id uuid not null references public.design_responses(id) on delete cascade,
  media_asset_id     uuid not null references public.media_assets(id) on delete cascade,
  "order"            int not null default 0
);
create index if not exists design_response_media_response_idx on public.design_response_media (design_response_id, "order");

-- ---------------------------------------------------------------------
-- RLS — reuses the existing public.is_admin() helper (Phase 3B) exactly
-- as every current table does. Pattern per table: public can read
-- published/public rows; the author/contributor can read and edit their
-- own row while it's still in an author-owned status (draft/submitted);
-- once a moderator-owned status is reached, only admin can change it
-- further; admin has full access throughout, matching every existing
-- table's admin_write policy.
-- ---------------------------------------------------------------------
alter table public.thanks_signals    enable row level security;
alter table public.contributions     enable row level security;
alter table public.contribution_media enable row level security;
alter table public.design_responses  enable row level security;
alter table public.design_response_media enable row level security;

-- thanks_signals
create policy "thanks_signals_select" on public.thanks_signals
  for select using (visibility = 'public' or author_id = auth.uid() or public.is_admin());
create policy "thanks_signals_author_insert" on public.thanks_signals
  for insert with check (author_id = auth.uid());
create policy "thanks_signals_author_update" on public.thanks_signals
  for update
  using (author_id = auth.uid() and status in ('draft','submitted'))
  with check (author_id = auth.uid() and status in ('draft','submitted'));
create policy "thanks_signals_author_delete" on public.thanks_signals
  for delete using (author_id = auth.uid() and status = 'draft');
create policy "thanks_signals_admin_all" on public.thanks_signals
  for all using (public.is_admin()) with check (public.is_admin());

-- contributions
create policy "contributions_select" on public.contributions
  for select using (
    status = 'approved'
    or contributor_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.thanks_signals s where s.id = thanks_signal_id and s.author_id = auth.uid())
  );
create policy "contributions_author_insert" on public.contributions
  for insert with check (contributor_id = auth.uid());
create policy "contributions_author_update" on public.contributions
  for update
  using (contributor_id = auth.uid() and status in ('draft','submitted'))
  with check (contributor_id = auth.uid() and status in ('draft','submitted'));
create policy "contributions_author_delete" on public.contributions
  for delete using (contributor_id = auth.uid() and status = 'draft');
create policy "contributions_admin_all" on public.contributions
  for all using (public.is_admin()) with check (public.is_admin());

-- contribution_media (visibility/write follows the parent contribution)
create policy "contribution_media_select" on public.contribution_media
  for select using (
    exists (
      select 1 from public.contributions c
      where c.id = contribution_id
        and (c.status = 'approved' or c.contributor_id = auth.uid() or public.is_admin())
    )
  );
create policy "contribution_media_author_write" on public.contribution_media
  for all using (
    exists (select 1 from public.contributions c where c.id = contribution_id and c.contributor_id = auth.uid() and c.status in ('draft','submitted'))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.contributions c where c.id = contribution_id and c.contributor_id = auth.uid() and c.status in ('draft','submitted'))
    or public.is_admin()
  );

-- design_responses
create policy "design_responses_select" on public.design_responses
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.contributions c join public.thanks_signals s on s.id = c.thanks_signal_id
      where c.id = contribution_id and s.author_id = auth.uid()
    )
  );
create policy "design_responses_author_insert" on public.design_responses
  for insert with check (author_id = auth.uid());
create policy "design_responses_author_update" on public.design_responses
  for update
  using (author_id = auth.uid() and status in ('draft','submitted','under_review'))
  with check (author_id = auth.uid() and status in ('draft','submitted','under_review'));
create policy "design_responses_author_delete" on public.design_responses
  for delete using (author_id = auth.uid() and status = 'draft');
create policy "design_responses_admin_all" on public.design_responses
  for all using (public.is_admin()) with check (public.is_admin());

-- design_response_media (visibility/write follows the parent design_response)
create policy "design_response_media_select" on public.design_response_media
  for select using (
    exists (
      select 1 from public.design_responses d
      where d.id = design_response_id
        and (d.status = 'published' or d.author_id = auth.uid() or public.is_admin())
    )
  );
create policy "design_response_media_author_write" on public.design_response_media
  for all using (
    exists (select 1 from public.design_responses d where d.id = design_response_id and d.author_id = auth.uid() and d.status in ('draft','submitted','under_review'))
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.design_responses d where d.id = design_response_id and d.author_id = auth.uid() and d.status in ('draft','submitted','under_review'))
    or public.is_admin()
  );
