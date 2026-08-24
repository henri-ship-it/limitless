-- Private bucket for the journal PDF. Downloads go through a signed URL issued
-- by the server, so the file is never publicly addressable.

insert into storage.buckets (id, name, public)
values ('member-files', 'member-files', false)
on conflict (id) do nothing;

create policy "members read member-files"
  on storage.objects for select
  using (bucket_id = 'member-files' and auth.uid() is not null);
