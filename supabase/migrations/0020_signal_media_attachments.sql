-- [Signal media attachments] Purely additive: one new join table + one
-- new nullable column on the existing media_assets table. No existing
-- table is altered structurally, no column is dropped or renamed, no
-- existing row is touched.
--
-- thanks_signal_media follows the exact same shape and RLS pattern as
-- contribution_media / design_response_media (migration 0012) — reusing
-- the established "media_assets is the physical file, a small join table
-- attaches it to its owning row" architecture rather than inventing a
-- parallel one. See docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md for that
-- established pattern's rationale.

create table if not exists public.thanks_signal_media (
  id                uuid primary key default gen_random_uuid(),
  thanks_signal_id  uuid not null references public.thanks_signals(id) on delete cascade,
  media_asset_id    uuid not null references public.media_assets(id) on delete cascade,
  "order"           int not null default 0
);
create index if not exists thanks_signal_media_signal_idx on public.thanks_signal_media (thanks_signal_id, "order");

alter table public.thanks_signal_media enable row level security;

-- Visible under the exact same condition the parent Signal itself is
-- visible (thanks_signals_select, migration 0012): public, the author's
-- own, or admin.
create policy "thanks_signal_media_select" on public.thanks_signal_media
  for select using (
    exists (
      select 1 from public.thanks_signals s
      where s.id = thanks_signal_id
        and (s.visibility = 'public' or s.author_id = auth.uid() or public.is_admin())
    )
  );

-- Writable only while the parent Signal is still in the author's own
-- editable window (draft/submitted — thanks_signals_author_update's own
-- precondition, migration 0012), or by admin at any time.
create policy "thanks_signal_media_author_write" on public.thanks_signal_media
  for all using (
    exists (
      select 1 from public.thanks_signals s
      where s.id = thanks_signal_id and s.author_id = auth.uid() and s.status in ('draft', 'submitted')
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.thanks_signals s
      where s.id = thanks_signal_id and s.author_id = auth.uid() and s.status in ('draft', 'submitted')
    )
    or public.is_admin()
  );

-- Additive, nullable column — the original client-supplied filename for a
-- given upload (Storage paths use a generated collision-safe name, never
-- the user's own filename, so this is the only place it's preserved).
-- NULL for every pre-existing media_assets row (not backfilled
-- retroactively, matching migration 0010's own "do not modify existing
-- data unnecessarily" convention) and for every future caller that
-- doesn't supply one (admin CMS uploads, which never accepted this before
-- and don't need to start now).
alter table public.media_assets add column if not exists original_filename text;
