-- Photographs of the printed journal, for the people who write on paper.

/*
 * A private bucket of its own rather than a folder in member-files, because
 * these are the most personal thing on the platform and the rules are
 * different: a member may write here, and member-files is read only.
 *
 * Objects are stored as <member uid>/<entry number>/<name>, and every policy
 * below turns on the first segment of that path being the member's own id.
 */
insert into storage.buckets (id, name, public)
values ('journal-photos', 'journal-photos', false)
on conflict (id) do nothing;

create policy "members read own photos"
  on storage.objects for select
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "members add own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "members delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'journal-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "admins read all photos"
  on storage.objects for select
  using (bucket_id = 'journal-photos' and is_admin());

/*
 * Which photo belongs to which entry.
 *
 * The bucket alone would answer this from the path, but listing a bucket per
 * entry is a request per page. This is one read for the whole journal.
 */
create table member_photos (
  member_id     uuid not null references profiles (id) on delete cascade,
  entry_number  int not null check (entry_number between 1 and 112),
  path          text not null,
  created_at    timestamptz not null default now(),
  primary key (member_id, path)
);

create index member_photos_entry_idx on member_photos (member_id, entry_number);

alter table member_photos enable row level security;

create policy "read own photos"
  on member_photos for select using (auth.uid() = member_id);
create policy "add own photos"
  on member_photos for insert with check (auth.uid() = member_id);
create policy "delete own photos"
  on member_photos for delete using (auth.uid() = member_id);
create policy "admins read all member photos"
  on member_photos for select using (is_admin());

/*
 * Starting again has to take the photographs with it. The rows go here; the
 * files themselves are removed by the server action first, since storage
 * objects are not reached by a foreign key.
 */
create or replace function wipe_my_entries()
  returns void
  language sql
  security definer
  set search_path = public
as $$
  delete from member_journal  where member_id = auth.uid();
  delete from member_progress where member_id = auth.uid();
  delete from member_photos   where member_id = auth.uid();
$$;

grant execute on function wipe_my_entries() to authenticated;
