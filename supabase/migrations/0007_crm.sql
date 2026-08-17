-- [Phase 3A prep] Not yet applied anywhere.
--
-- Direct carry-over of data/leads.json's Lead shape — no transformation
-- beyond splitting notes[]/activity[] into child tables. first_touch /
-- latest_touch stay jsonb (atomic attribution snapshots, never queried by
-- sub-field in the current app). See docs/PHASE_3A_SUPABASE_PREP.md.

create table if not exists public.leads (
  id                        uuid primary key default gen_random_uuid(),
  form_name                 text,
  name                      text,
  email                     text,
  phone                     text,
  company                   text,
  service                   text,
  project_type              text,
  budget                    text,
  timeline                  text,
  preferred_contact_method  text,
  message                   text,
  first_touch               jsonb,
  latest_touch              jsonb,
  context                   jsonb,
  status                    text not null default 'New',
  priority                  text not null default 'Medium',
  follow_up_date            date,
  follow_up_status          text not null default 'none',
  last_contacted_at         timestamptz,
  next_action               text,
  tags                      text[] not null default '{}',
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_idx on public.leads (created_at desc);

create table if not exists public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  text       text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_activity (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  type       text not null,
  detail     text,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_idx on public.lead_notes (lead_id, created_at);
create index if not exists lead_activity_lead_idx on public.lead_activity (lead_id, created_at);
