-- When each Elite member's own year began.

/*
 * Elite is sold one person at a time rather than in cohorts, so there is no
 * date the programme begins for everybody. Two members are usually in
 * different chapters on the same day, and a third joining tomorrow starts at
 * chapter one while they carry on.
 *
 * The sixteen week programme can hold its start date in the code because the
 * cohort shares one. This cannot, so it goes on the member.
 *
 * A date rather than a timestamp: a chapter opens on a day, and storing a time
 * would mean somebody in a different timezone saw their chapter open on the
 * wrong one. Everything downstream counts whole days in UTC from here.
 */
alter table profiles add column if not exists elite_start_date date;

comment on column profiles.elite_start_date is
  'First day of this member''s Elite year. Chapter n opens 28*(n-1) days later. Null for everyone not on Elite.';
