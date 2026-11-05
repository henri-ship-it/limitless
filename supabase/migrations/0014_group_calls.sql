-- The Wednesday group call, arriving on its own.

/*
 * A group call is the same kind of record as a 1:1 and a different kind of
 * event. One recording holds four people, so it becomes four rows: each member
 * gets the whole conversation as their transcript, because what Chris said to
 * somebody else is often the context for what he said to them, and a
 * distillation written about that one person.
 *
 * `external_id` is Pocket's recording id and exists because their webhooks are
 * at-least-once. Without it a retry, or the second of the two events that carry
 * a transcript, would file the same call again and the member's notes would be
 * built from a doubled record.
 */
alter table member_conversations
  add column if not exists source text not null default 'one-to-one',
  add column if not exists external_id text;

comment on column member_conversations.source is
  'one-to-one for a call with Chris alone, group for the weekly drop-in.';
comment on column member_conversations.external_id is
  'The recording id at whatever produced it. Dedupes at-least-once webhooks.';

-- One row per member per recording, and only where there is an id to go on.
create unique index if not exists member_conversations_external_idx
  on member_conversations (member_id, external_id)
  where external_id is not null;

/*
 * What a member is called on the recording, where that is not their first name.
 *
 * Speaker labels come from whatever the person typed into Pocket once, so they
 * are "Chaz" and "Bry" as often as they are the name on the account. Matching on
 * first name alone drops those people silently, which is the worst way for this
 * to fail: the call is ingested, nothing errors, and two of the four members
 * simply never get any of it.
 */
alter table profiles add column if not exists recording_name text;

comment on column profiles.recording_name is
  'What this member is labelled as on call recordings, if not their first name.';
