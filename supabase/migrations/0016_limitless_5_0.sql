-- Limitless 5.0: Core sold on its own, begun whenever the member says.

/*
 * Until now the sixteen weeks have been a cohort thing. Everybody shared one
 * Monday, the platform kept that Monday in the code, and week n opened 7*(n-1)
 * days after it. Core sold on its own breaks that in one place only: two people
 * who bought a fortnight apart are in different weeks on the same day.
 *
 * Elite has already solved this once. It is sold one person at a time and keeps
 * `elite_start_date` on the profile, with chapter n opening a fixed number of
 * days later. This is the same answer for the sixteen week programme, and the
 * same reason for a date rather than a timestamp: a week opens on a day, and a
 * time would open it on the wrong one for anybody outside the UK.
 */

/*
 * How somebody came in, which is not the same question as what they bought.
 *
 * A cohort member and an evergreen member are both Core on 5.0, so the tier
 * cannot carry it and neither can the cohort. It is written at checkout rather
 * than worked out later from whether a start date is set: a member who has
 * paid and not yet finished onboarding has no start date, and is still an
 * evergreen member.
 */
create type enrolment_route as enum ('cohort', 'evergreen');

alter table profiles
  add column if not exists enrolment enrolment_route not null default 'cohort';

/*
 * First day of this member's sixteen weeks.
 *
 * Null means they run on their cohort's date, which is every 4.0 member and
 * anybody joining 5.0 as a cohort. Null on an evergreen member means they have
 * bought and not yet chosen, which is the state onboarding exists to leave.
 */
alter table profiles add column if not exists programme_start_date date;

comment on column profiles.programme_start_date is
  'First day of this member''s sixteen weeks. Week n opens 7*(n-1) days later. Null means run on the cohort date.';

/*
 * The hour their weekly digest lands, in UK time.
 *
 * The day is not theirs to pick and is not stored: the digest lands seven days
 * from the start of the programme, so their start date already decides it. The
 * hour is the only part anybody asked for. Null is the house default, which is
 * 16:00 and the same hour the chapter opens.
 */
alter table profiles add column if not exists digest_send_hour smallint
  check (digest_send_hour between 0 and 23);

/* Whether the printed journal was in the basket, which moves the start date
 * out far enough for the book to arrive before week one. */
alter table profiles add column if not exists journal_ordered boolean not null default false;

/* The pre-assessment answers, and the moment onboarding was finished. The
 * scorecard keeps its own column: that is the Know Thyself result and it comes
 * in from a webhook, not from this. */
alter table profiles add column if not exists onboarding jsonb;
alter table profiles add column if not exists onboarded_at timestamptz;

create index if not exists profiles_enrolment_idx on profiles (enrolment);

/*
 * A cohort no longer has to have a start date.
 *
 * 5.0 is the first one where the date is per member, so there is no Monday the
 * cohort shares. Null here says exactly that, rather than inventing a date that
 * nothing reads and that would be wrong for everybody on it.
 */
alter table cohorts alter column start_date drop not null;

comment on column cohorts.start_date is
  'The Monday this cohort begins, or null when its members each run on their own date.';

insert into cohorts (label, start_date)
values ('5.0', null)
on conflict (label) do nothing;

/*
 * Choosing when the programme begins.
 *
 * A function rather than an update policy on `profiles`, which is how every
 * other member write on this table already works. A policy wide enough to let
 * somebody set their own start date is wide enough to let them set their own
 * tier, and narrowing it to named columns is not something a policy can do.
 *
 * Two guards. The date cannot be in the past, because a member who could
 * backdate their start could open all sixteen weeks this afternoon. And it
 * cannot be moved once it has arrived: before it begins this is a plan and
 * changing it costs nothing, after it begins it is a record of what happened
 * and moving it would renumber every week they have already written.
 */
create or replace function start_programme(starts_on date, send_hour int default null)
  returns void
  language plpgsql
  security definer
  set search_path = public
as $$
declare
  today date := (now() at time zone 'Europe/London')::date;
  existing date;
begin
  select programme_start_date into existing from profiles where id = auth.uid();

  if existing is not null and existing <= today then
    raise exception 'The programme has already started';
  end if;

  if starts_on < today then
    raise exception 'The programme cannot start in the past';
  end if;

  if send_hour is not null and (send_hour < 0 or send_hour > 23) then
    raise exception 'That is not an hour of the day';
  end if;

  update profiles
     set programme_start_date = starts_on,
         digest_send_hour = coalesce(send_hour, digest_send_hour)
   where id = auth.uid();
end;
$$;

grant execute on function start_programme(date, int) to authenticated;

/* Finishing onboarding. The answers are the member's own, so this writes only
 * their row and only these two columns. */
create or replace function save_onboarding(answers jsonb)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update profiles
     set onboarding = answers,
         onboarded_at = coalesce(onboarded_at, now())
   where id = auth.uid();
$$;

grant execute on function save_onboarding(jsonb) to authenticated;
