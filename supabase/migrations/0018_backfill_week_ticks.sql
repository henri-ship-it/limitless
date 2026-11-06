-- Credit the weeks that were already closed by writing the huddle.

/*
 * A one off, and only because the rule changed underneath data that already
 * existed.
 *
 * Until today a week was ticked by reading its digest, and from today it is
 * ticked by writing its huddle. The new rule was applied going forward only:
 * `saveJournalEntry` writes the tick when a closing entry is saved, and it has
 * no reason to walk back over entries saved months ago. So every week closed
 * before the change is sitting there written and uncredited.
 *
 * That is twenty seven weeks across six members of 4.0, and it is worst for the
 * people who wrote the most. One member has written eight huddles and is shown
 * one week complete. Telling somebody they are a sixteenth of the way through a
 * programme they are half way through is a worse first impression of the new
 * rule than the old button ever made.
 *
 * Insert only. Five other members hold ticks they earned under the reading rule
 * with no huddle behind them, and those are left exactly where they are. They
 * were given credit in good faith under the rule in force at the time, and
 * taking it back now would be the platform quietly rewriting what somebody did,
 * which is the thing this whole change was meant to stop.
 *
 * `completed_at` is the day the huddle was last saved rather than the day this
 * runs, so the record says when the week was actually closed.
 *
 * The test for "written" is the same one `isWritten` applies in the
 * application: any answer to the exercise, any line of the huddle, or any of
 * the three review questions. Keep the two in step if either moves.
 */
insert into member_progress (member_id, week_number, completed_at)
select j.member_id,
       j.entry_number / 7,
       j.updated_at
from member_journal j
where j.entry_number % 7 = 0
  and j.entry_number between 7 and 112
  and (
    exists (
      select 1 from jsonb_each_text(coalesce(j.data->'fields', '{}'::jsonb)) f
      where length(trim(coalesce(f.value, ''))) > 0
    )
    or exists (
      select 1 from jsonb_array_elements_text(
        case when jsonb_typeof(j.data->'huddle') = 'array'
             then j.data->'huddle' else '[]'::jsonb end
      ) h
      where length(trim(coalesce(h, ''))) > 0
    )
    or length(trim(coalesce(j.data->>'win', ''))) > 0
    or length(trim(coalesce(j.data->>'mind', ''))) > 0
    or length(trim(coalesce(j.data->>'grateful', ''))) > 0
  )
on conflict (member_id, week_number) do nothing;
