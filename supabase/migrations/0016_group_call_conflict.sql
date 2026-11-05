-- Make the dedupe index one that ON CONFLICT can actually use.

/*
 * The index added in 0014 was partial: unique on (member_id, external_id)
 * where external_id is not null. That is the correct shape for what it
 * describes, and it is unusable for the thing it was added for.
 *
 * Postgres resolves ON CONFLICT by inferring an index from the columns named.
 * It will only infer a partial index when the statement repeats the index's
 * predicate, and PostgREST does not, so every upsert of a group call failed
 * with 42P10, "no unique or exclusion constraint matching the ON CONFLICT
 * specification". Nothing was ever written, and because the caller discarded
 * the error it read as nobody on the call being recognised.
 *
 * Dropping the predicate costs nothing. Nulls are distinct in a unique index
 * unless declared otherwise, so a member can still have any number of 1:1s
 * with no external id, and at most one row per recording that has one.
 */
drop index if exists member_conversations_external_idx;

create unique index if not exists member_conversations_external_idx
  on member_conversations (member_id, external_id);
