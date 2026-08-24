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
