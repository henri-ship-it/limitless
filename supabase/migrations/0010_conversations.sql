-- What Chris learned about somebody by actually talking to them.

/*
 * The 1:1s, kept as both what was said and what was learned from it.
 *
 * The raw transcript is stored because a distillation is an opinion, and a
 * better prompt in three months should be able to go back to the source rather
 * than to the last summary of it. `notes` is that distillation: how this person
 * is motivated, how to talk to them, what they are working towards, and the
 * few things worth remembering about their life outside the programme.
 *
 * This is the one record on the platform with no member policy at all. A
 * member reads their own journal, their own scorecard, their own everything
 * else; they do not read Chris's working notes on how to motivate them, which
 * is a different kind of document and is ruined by being written for its
 * subject. Admin only, and subject to the same asymmetry as everything else.
 */
create table member_conversations (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references profiles (id) on delete cascade,
  happened_on   date not null,
  transcript    text not null,
  notes         jsonb,
  created_at    timestamptz not null default now()
);

create index member_conversations_member_idx
  on member_conversations (member_id, happened_on desc);

alter table member_conversations enable row level security;

create policy "admins read visible conversations"
  on member_conversations for select using (may_read(member_id));
create policy "admins write conversations"
  on member_conversations for insert with check (is_admin());
create policy "admins update conversations"
  on member_conversations for update using (is_admin());
create policy "admins delete conversations"
  on member_conversations for delete using (is_admin());
