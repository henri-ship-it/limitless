-- Deleting your entries should leave nothing behind that says you wrote them.

/*
 * Clears a member's own journal work, and only that.
 *
 * The first version deleted the entries but left every week still ticked as
 * complete, so somebody who asked to start again was told they had finished
 * several weeks of a journal that was now empty. It also only ever existed in
 * the SQL editor, never here, which is how the gap went unnoticed.
 *
 * Deliberately untouched: their profile, their scorecard and pre-assessment,
 * the Start Guide tick list, and the record of time on the platform. This is a
 * request to clear what they wrote, not to leave the programme.
 *
 * A null auth.uid() matches no rows, so an unauthenticated call is a no-op.
 */
create or replace function wipe_my_entries()
  returns void
  language sql
  security definer
  set search_path = public
as $$
  delete from member_journal  where member_id = auth.uid();
  delete from member_progress where member_id = auth.uid();
$$;

grant execute on function wipe_my_entries() to authenticated;
