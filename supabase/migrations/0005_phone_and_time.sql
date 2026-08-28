-- Reaching Pro members on WhatsApp, and knowing where time actually goes.

alter table profiles add column phone text;

/*
 * Seconds spent on a page, per member, per day.
 *
 * Kept coarse on purpose. This answers "did they read the week" and "where
 * does attention go", not "what were they doing at 21:43". A day is the
 * smallest bucket, so nothing here reconstructs a session.
 */
create table member_time (
  member_id    uuid not null references profiles (id) on delete cascade,
  path         text not null,
  day          date not null default current_date,
  seconds      int not null default 0,
  primary key (member_id, path, day)
);

create index member_time_day_idx on member_time (day desc);

alter table member_time enable row level security;

create policy "read own time"
  on member_time for select using (auth.uid() = member_id);

create policy "admins read all time"
  on member_time for select using (is_admin());

/*
 * Adding time goes through a function so a member can only ever add to their
 * own row, and only ever add. A plain update policy would let one member
 * rewrite another's figures.
 */
create function add_time(page text, amount int)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  -- A tab left open overnight should not report eight hours.
  if amount < 1 or amount > 600 then
    return;
  end if;

  insert into member_time (member_id, path, day, seconds)
  values (auth.uid(), page, current_date, amount)
  on conflict (member_id, path, day)
  do update set seconds = member_time.seconds + excluded.seconds;
end;
$$;

grant execute on function add_time(text, int) to authenticated;
