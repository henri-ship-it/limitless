-- What a member has said in the group chat.

/*
 * The third thing Chris knows about somebody, after what they wrote in the
 * journal and what they said on a call. A group chat is where people mention
 * the thing they would never write down in an exercise: the week that got away
 * from them, the bit they found hard, the small win nobody asked about.
 *
 * One row per message, attributed to the member who sent it. Messages from
 * people who could not be matched are not stored at all rather than being kept
 * against nobody: a message with no owner cannot be read back on anybody's
 * profile and cannot inform a draft, so keeping it would only be holding
 * somebody's words for no purpose.
 *
 * `fingerprint` is what makes a re-import safe. WhatsApp's export is the whole
 * history every time, not what is new since last time, so the same file lands
 * again every week with more on the end. Without this the first month of the
 * chat would be stored four times over and the drafting brief would read it
 * that way.
 */
create table if not exists member_messages (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references profiles (id) on delete cascade,
  sent_on     date not null,
  sender      text not null,
  body        text not null,
  source      text not null default 'whatsapp',
  fingerprint text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists member_messages_unique_idx
  on member_messages (member_id, fingerprint);

create index if not exists member_messages_recent_idx
  on member_messages (member_id, sent_on desc);

/*
 * Admin only, like the 1:1 notes and for the same reason. A member reads their
 * own journal and their own scorecard; a record of what they said in the group,
 * collected and kept for someone else to read before writing to them, is a
 * different kind of document.
 */
alter table member_messages enable row level security;
