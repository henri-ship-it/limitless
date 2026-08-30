-- Being an admin should not mean being readable by every other admin.

/*
 * Whether admins other than this member may read them.
 *
 * Henri runs the platform and Chris runs the programme; Chris has no reason to
 * read Henri's journal, and the fact that Henri can see everybody is a
 * consequence of maintaining the thing rather than a licence in both
 * directions. Everyone is visible by default: this is switched off one person
 * at a time and only ever by hand.
 */
alter table profiles add column if not exists visible_to_admins boolean not null default true;

/*
 * The single question every admin policy now asks.
 *
 * Security definer so it can read the flag without tripping over the policy it
 * is being used by, which is the same recursion that once took out every
 * member's own profile read.
 */
create or replace function may_read(member uuid)
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select auth.uid() = member
    or (is_admin() and coalesce((select visible_to_admins from profiles where id = member), true));
$$;

grant execute on function may_read(uuid) to authenticated;

drop policy if exists "admins read all profiles"      on profiles;
drop policy if exists "admins read all progress"      on member_progress;
drop policy if exists "admins read all journals"      on member_journal;
drop policy if exists "admins read all time"          on member_time;
drop policy if exists "admins read all arrivals"      on member_arrivals;
drop policy if exists "admins read all checklists"    on member_checklist;
drop policy if exists "admins read all member photos" on member_photos;

create policy "admins read visible profiles"
  on profiles for select using (may_read(id));
create policy "admins read visible progress"
  on member_progress for select using (may_read(member_id));
create policy "admins read visible journals"
  on member_journal for select using (may_read(member_id));
create policy "admins read visible time"
  on member_time for select using (may_read(member_id));
create policy "admins read visible arrivals"
  on member_arrivals for select using (may_read(member_id));
create policy "admins read visible photos"
  on member_photos for select using (may_read(member_id));
create policy "admins read visible checklists"
  on member_checklist for select using (may_read(member_id));

-- Storage objects carry the member id as the first segment of their path.
drop policy if exists "admins read all photos" on storage.objects;
create policy "admins read visible photo files"
  on storage.objects for select
  using (
    bucket_id = 'journal-photos'
    and may_read(((storage.foldername(name))[1])::uuid)
  );
