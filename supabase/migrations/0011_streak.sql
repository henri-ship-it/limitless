-- Which days somebody actually turned up.

/*
 * `last_seen_at` answers "when were they last here" and cannot answer "how many
 * days in a row", because it is overwritten every visit. One row per day is the
 * smallest thing that can: a hundred and twelve days of a member is a hundred
 * and twelve rows at worst.
 *
 * The day is London's, not UTC. A member writing at half eleven at night in
 * November would otherwise have it counted as tomorrow, and break a streak by
 * keeping it.
 */
create table member_days (
  member_id uuid not null references profiles (id) on delete cascade,
  day       date not null,
  primary key (member_id, day)
);

alter table member_days enable row level security;

create policy "read own days"
  on member_days for select using (may_read(member_id));

/*
 * Recorded by the same call that already notes someone is about, so a streak
 * costs no extra round trip. Security definer, so the insert does not need a
 * policy of its own: nothing but this function may write here.
 */
create or replace function touch_last_seen()
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update profiles set last_seen_at = now() where id = auth.uid();
  insert into member_days (member_id, day)
    values (auth.uid(), (now() at time zone 'Europe/London')::date)
    on conflict do nothing;
$$;

/*
 * Days in a row, counting back from today.
 *
 * A streak survives until the day after it would break: somebody who came
 * yesterday and has not been in yet today still has theirs, and loses it at
 * midnight tonight. Punishing a person at 00:01 for not having read a chapter
 * yet would make the number an anxiety rather than an encouragement.
 *
 * The count is the leading run of consecutive days. Numbering the days
 * backwards from the anchor, a day is part of that run exactly while it equals
 * the anchor minus its own position; once a gap is crossed every later day
 * falls further behind and no later day can match again.
 */
create or replace function my_streak()
  returns int
  language sql
  stable
  security definer
  set search_path = public
as $$
  with today as (
    select (now() at time zone 'Europe/London')::date as d
  ),
  mine as (
    select day from member_days where member_id = auth.uid()
  ),
  anchor as (
    select max(day) as day from mine, today where mine.day >= today.d - 1
  )
  select coalesce((
    select count(*)::int
    from (
      select mine.day, row_number() over (order by mine.day desc) as n
      from mine, anchor
      where anchor.day is not null and mine.day <= anchor.day
    ) run, anchor
    where run.day = anchor.day - (run.n - 1)
  ), 0);
$$;

grant execute on function my_streak() to authenticated;

/*
 * Nobody has a history before this table existed, so everyone would show a
 * streak of zero on the day it ships even if they have been here all week.
 * Seeding today from last_seen_at starts everybody who is currently around on
 * one rather than nothing.
 */
insert into member_days (member_id, day)
  select id, (last_seen_at at time zone 'Europe/London')::date
  from profiles
  where last_seen_at is not null
    and last_seen_at > now() - interval '2 days'
  on conflict do nothing;
