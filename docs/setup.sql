-- All three migrations in order, for pasting into the Supabase SQL editor.
-- Generated from supabase/migrations. Run once, on a new project.

-- ===== 0001_init.sql =====
-- Limitless learning platform, cohort 4.0.
-- Members are created ahead of time. Sign-in is magic link only, so a member
-- who is not in `profiles` has bought nothing and gets Core by default.

create type member_tier as enum ('core', 'pro');

create table cohorts (
  label                            text primary key,
  start_date                       date not null,
  onboarding_call_at               timestamptz,
  onboarding_call_recording_url    text,
  created_at                       timestamptz not null default now()
);

create table profiles (
  id                 uuid primary key references auth.users on delete cascade,
  email              text not null,
  first_name         text,
  tier               member_tier not null default 'core',
  cohort             text not null default '4.0' references cohorts (label),
  kit_subscriber_id  text,
  created_at         timestamptz not null default now()
);

create index profiles_cohort_idx on profiles (cohort);

-- One row per week a member has marked as done.
create table member_progress (
  member_id     uuid not null references profiles (id) on delete cascade,
  week_number   int not null check (week_number between 1 and 16),
  completed_at  timestamptz not null default now(),
  primary key (member_id, week_number)
);

-- Start Guide tick list. `item_key` is defined in src/content/checklist.ts.
create table member_checklist (
  member_id     uuid not null references profiles (id) on delete cascade,
  item_key      text not null,
  completed_at  timestamptz not null default now(),
  primary key (member_id, item_key)
);

-- Recording URLs, the journal PDF path and the Pro WhatsApp invite. Gated by
-- tier so a Core member never receives the Pro invite, even in a JSON payload.
create table assets (
  key         text primary key,
  url         text,
  min_tier    member_tier not null default 'core',
  note        text,
  updated_at  timestamptz not null default now()
);

alter table profiles          enable row level security;
alter table member_progress   enable row level security;
alter table member_checklist  enable row level security;
alter table assets            enable row level security;
alter table cohorts           enable row level security;

create policy "read own profile"
  on profiles for select using (auth.uid() = id);

create policy "read own progress"
  on member_progress for select using (auth.uid() = member_id);
create policy "write own progress"
  on member_progress for insert with check (auth.uid() = member_id);
create policy "delete own progress"
  on member_progress for delete using (auth.uid() = member_id);

create policy "read own checklist"
  on member_checklist for select using (auth.uid() = member_id);
create policy "write own checklist"
  on member_checklist for insert with check (auth.uid() = member_id);
create policy "delete own checklist"
  on member_checklist for delete using (auth.uid() = member_id);

create policy "read cohort"
  on cohorts for select using (auth.uid() is not null);

-- Pro-only assets are invisible to Core at the database level, not just in the
-- interface.
create policy "read assets for own tier"
  on assets for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
        and (assets.min_tier = 'core' or p.tier = 'pro')
    )
  );

insert into cohorts (label, start_date, onboarding_call_at)
values ('4.0', '2026-08-31', '2026-08-26 11:00:00+00');

-- ===== 0002_storage.sql =====
-- Private bucket for the journal PDF. Downloads go through a signed URL issued
-- by the server, so the file is never publicly addressable.

insert into storage.buckets (id, name, public)
values ('member-files', 'member-files', false)
on conflict (id) do nothing;

create policy "members read member-files"
  on storage.objects for select
  using (bucket_id = 'member-files' and auth.uid() is not null);

-- ===== 0003_journal.sql =====
-- The digital journal. One row per member per entry, holding whatever they
-- have typed. A single jsonb column keeps the shape of an entry in the app
-- rather than the schema, since entries differ in how many prompts they carry.

create table member_journal (
  member_id     uuid not null references profiles (id) on delete cascade,
  entry_number  int not null check (entry_number between 1 and 112),
  data          jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  primary key (member_id, entry_number)
);

alter table member_journal enable row level security;

create policy "read own journal"
  on member_journal for select using (auth.uid() = member_id);
create policy "write own journal"
  on member_journal for insert with check (auth.uid() = member_id);
create policy "update own journal"
  on member_journal for update using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

