-- Seeing how a cohort is getting on, and letting a member opt out of having
-- their writing inform what they are sent.

alter table profiles
  add column last_seen_at        timestamptz,
  add column personalised_nudges boolean not null default true,
  add column is_admin            boolean not null default false;

create index profiles_last_seen_idx on profiles (last_seen_at desc nulls last);

-- A member may update these two things about themselves and nothing else.
-- Row level security cannot restrict which columns an update touches, so both
-- go through a function that can only ever write the one field.

create function touch_last_seen()
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update profiles set last_seen_at = now() where id = auth.uid();
$$;

create function set_personalised_nudges(enabled boolean)
  returns void
  language sql
  security definer
  set search_path = public
as $$
  update profiles set personalised_nudges = enabled where id = auth.uid();
$$;

grant execute on function touch_last_seen() to authenticated;
grant execute on function set_personalised_nudges(boolean) to authenticated;

/*
 * Whether the caller runs the programme.
 *
 * This has to be a security definer function rather than a subquery inside the
 * policy. A policy on `profiles` that reads `profiles` re-triggers itself, and
 * Postgres rejects the whole query with "infinite recursion detected" — which
 * takes out every member's own profile read, not just the admin ones.
 */
create function is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

grant execute on function is_admin() to authenticated;

-- Admins read everything. Everyone else still sees only their own, which the
-- existing policies handle.
create policy "admins read all profiles"   on profiles         for select using (is_admin());
create policy "admins read all progress"   on member_progress  for select using (is_admin());
create policy "admins read all checklists" on member_checklist for select using (is_admin());
create policy "admins read all journals"   on member_journal   for select using (is_admin());
