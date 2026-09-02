-- The Limitless Pro Blueprint: the two-page read a member gets after their
-- pre-assessment and welcome call.
--
-- Its own column rather than another slot inside `assessment`, because that
-- column is owned by the scorecard webhook and holds what somebody answered.
-- A blueprint is written from those answers, not received with them, and the
-- two should not be able to overwrite each other.
--
-- No new policy on profiles: "read own profile" already scopes this to the
-- member it belongs to, and admins reach it through the same view they use
-- for the assessments.

alter table profiles add column if not exists blueprint jsonb;

comment on column profiles.blueprint is
  'Authored blueprint content, shaped by the Blueprint type in src/content/blueprint.ts. Null until one is published for this member.';


/*
 * Storage, and a policy that has to get narrower.
 *
 * The print version goes to blueprints/<member id>.pdf in the existing private
 * bucket. Until now everything in member-files was the same journal PDF for
 * everybody, so "any signed-in member may read this bucket" was the right
 * policy. A blueprint is the first per-member file in there, and under that
 * policy one member who knew another's id could sign a URL for their blueprint.
 *
 * Policies are OR'd, so adding a narrow one would not have taken anything away.
 * The broad policy is replaced instead: shared files stay readable by any
 * member, and anything under blueprints/ is readable only by the member whose
 * id names it.
 */

drop policy if exists "members read member-files" on storage.objects;

create policy "members read shared member-files"
  on storage.objects for select
  using (
    bucket_id = 'member-files'
    and auth.uid() is not null
    and name not like 'blueprints/%'
  );

create policy "members read own blueprint"
  on storage.objects for select
  using (
    bucket_id = 'member-files'
    and name = 'blueprints/' || auth.uid()::text || '.pdf'
  );
