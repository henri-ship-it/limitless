-- The address somebody answers a scorecard from is not always the one they
-- enrolled with, which is the single case the webhook cannot resolve alone.

alter table profiles add column if not exists alt_email text;

create index if not exists profiles_alt_email_idx on profiles (lower(alt_email));

/*
 * Set by an admin from the member's profile. There is no member facing way to
 * change it: it decides which record an incoming scorecard attaches to, so
 * letting a member set their own would let them attach one to somebody else.
 */
create policy "admins update profiles"
  on profiles for update using (is_admin()) with check (is_admin());
