-- ["I can solve this" real notification flow] Purely additive: one new
-- table, zero changes to any existing table. No existing "notifications"
-- concept exists anywhere in the schema (the CRM's src/lib/notifications/
-- is an outbound email/webhook *dispatcher* for leads — no table backs
-- it) — this is the first in-app, database-backed notification model, and
-- it's kept intentionally general (`type`/`reference_type`/`reference_id`)
-- so a future notification kind never needs a new table, only a new `type`
-- value.

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references public.profiles(id) on delete cascade,
  type            text not null,
  title           text not null,
  message         text,
  reference_type  text,
  reference_id    uuid,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;

-- A recipient reads only their own notifications — never anyone else's,
-- including another contributor's or another signal author's.
create policy "notifications_select_own" on public.notifications
  for select using (recipient_id = auth.uid());

-- "Mark as read" is the only write a normal user ever performs here, and
-- only on their own row.
create policy "notifications_update_own" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- Deliberately NO insert policy for regular users: every notification is
-- created by trusted server code (the API route, via the service-role
-- key) as a side effect of an already-authorized action (e.g. a
-- Contribution being submitted) — never directly by a client session, the
-- same "no client insert path" posture media_assets already has.
