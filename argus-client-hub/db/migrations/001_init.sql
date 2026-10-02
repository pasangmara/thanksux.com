-- ARGUS Client Hub: initial schema.
-- Run with `npm run db:migrate` (uses DATABASE_URL), or paste into the
-- Supabase SQL editor. Safe to run more than once.
--
-- Access model: only the Next.js server talks to this database, with the
-- connection string in DATABASE_URL. The browser never connects directly.
-- RLS is enabled with NO policies, so Supabase's public API (anon key)
-- cannot read or write any of these tables.

create table if not exists team_members (
  id            text primary key,
  email         text not null unique,
  name          text not null,
  role          text not null check (role in ('admin', 'staff')),
  password_hash text not null,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists sessions (
  id         text primary key,           -- sha256(token); the raw token only lives in the cookie
  member_id  text not null references team_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_member_idx on sessions(member_id);

create table if not exists clients (
  id                 text primary key,
  name               text not null,
  company            text,
  whatsapp           text,
  email              text,
  services           text[] not null default '{}',
  package            text,
  status             text not null check (status in ('onboarding', 'active', 'completed', 'paused')),
  start_date         date,
  end_date           date,
  completed_at       timestamptz,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'bn')),
  feedback_code      text not null unique,
  link_status        text not null default 'not_sent' check (link_status in ('not_sent', 'sent', 'opened', 'submitted')),
  link_sent_at       timestamptz,
  link_opened_at     timestamptz,
  last_contact_at    timestamptz,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists clients_status_idx on clients(status);

create table if not exists feedback (
  id                text primary key,
  ref               text not null unique,  -- FB-0001
  client_id         text not null references clients(id) on delete cascade,
  feedback_code     text not null,
  created_at        timestamptz not null default now(),
  client_name       text not null,
  company           text,
  services          text[] not null default '{}',
  rating            smallint not null check (rating between 1 and 5),
  communication     smallint check (communication between 1 and 5),
  result            smallint check (result between 1 and 5),
  did_well          text,
  do_better         text,
  recommend         text check (recommend in ('yes', 'maybe', 'no')),
  public_permission boolean not null default false,
  display_mode      text check (display_mode in ('name_company', 'first_name', 'anonymous')),
  display_name      text,
  photo_file_id     text,
  language          text not null default 'en' check (language in ('en', 'bn')),
  follow_up         text check (follow_up in ('open', 'done')),
  post_status       text not null default 'not_for_post' check (post_status in ('not_for_post', 'pending', 'posted')),
  post_link         text,
  posted_at         timestamptz,
  updated_at        timestamptz not null default now(),
  -- Posting needs the client's permission (enforced here and in the app).
  constraint post_needs_permission check (public_permission or post_status = 'not_for_post')
);
create index if not exists feedback_client_idx on feedback(client_id);
create index if not exists feedback_created_idx on feedback(created_at desc);

create table if not exists activity (
  id         text primary key,
  client_id  text not null references clients(id) on delete cascade,
  type       text not null,
  text       text not null,
  actor      text,
  created_at timestamptz not null default now()
);
create index if not exists activity_client_idx on activity(client_id, created_at desc);

create table if not exists settings (
  id         text primary key,             -- always 'main'
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Integration events for n8n. Written in the same request as the change,
-- delivered after; failed or not-yet-connected events wait here.
create table if not exists outbox (
  id              text primary key,
  event           text not null,
  payload         jsonb not null,
  status          text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts        int not null default 0,
  last_error      text,
  next_attempt_at timestamptz,
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);
create index if not exists outbox_status_idx on outbox(status, created_at);

-- Uploaded images (founder photo, client photo/logo). Small volume, so
-- they live in Postgres: no separate storage bucket to configure.
create table if not exists files (
  id         text primary key,
  name       text not null,
  mime       text not null,
  size       int not null,
  created_at timestamptz not null default now(),
  data       bytea not null
);

alter table team_members enable row level security;
alter table sessions     enable row level security;
alter table clients      enable row level security;
alter table feedback     enable row level security;
alter table activity     enable row level security;
alter table settings     enable row level security;
alter table outbox       enable row level security;
alter table files        enable row level security;

create table if not exists schema_migrations (
  name       text primary key,
  applied_at timestamptz not null default now()
);
