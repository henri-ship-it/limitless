# Going live

Week 1 opens **Sunday 30 August at 16:00 UK**. Everything below has to be done
before then. Steps marked **you** need an account Claude cannot reach.

Work top to bottom. Step 2 has a queue on it, so start that first.

---

## 1. Supabase project — **you**

1. Create a project at supabase.com. Region: London.
2. Project settings → API. Copy the project URL, the `anon` key and the
   `service_role` key.
3. SQL editor → new query → paste the **contents** of `docs/setup.sql` and run
   it. That file is the three migrations end to end, so it is one paste rather
   than three. Pasting the file path will not work.
4. The cohort row is created by the migration. Nothing to add by hand.

The service role key bypasses row level security. It belongs in `.env.local`
and in Vercel's environment variables, never in the browser.

## 2. Magic link email — **you, start this first**

Supabase's built-in SMTP is rate limited and lands in spam. It also locks the
email templates: the subject and body cannot be edited until custom SMTP is
enabled, and the default template uses a link that only works in the browser
that requested it. So this is not optional. Use Resend.

1. Sign up at resend.com, add `lmntaryperformance.com`, and add the SPF and
   DKIM records it gives you to your DNS. **Verification can take a few hours,
   which is why this goes first.**
2. Resend → API keys → create one.
3. Supabase → Project settings → Authentication → SMTP settings → enable
   custom SMTP:
   - Host `smtp.resend.com`, port `465`, username `resend`
   - Password: the Resend API key
   - Sender email `chris@lmntaryperformance.com`, sender name `Chris Bodman`
4. Authentication → URL configuration:
   - Site URL: the live domain
   - Redirect URLs: add `https://<domain>/auth/callback`
5. Authentication → Email templates → Magic Link. Replace the body with
   `docs/magic-link-email.html`.
6. Authentication → Sessions: set the session length to 30 days, so a member
   stays signed in on that device.

## 3. Repository and deploy — **you, then Claude**

1. Create a **private** GitHub repo. Tell Claude the owner and name and it will
   push. Private matters: the repo contains the whole programme.
2. Import the repo into Vercel. Framework preset: Next.js. No build overrides.
3. Add the environment variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SITE_URL
   ```

   `NEXT_PUBLIC_SITE_URL` is the live origin with no trailing slash. It builds
   the magic link redirect, so a wrong value breaks sign-in.

   Do **not** set `PREVIEW_WEEK` or `PREVIEW_TIER` in production. They override
   the release schedule and exist for local work only.
4. Point the domain at it.

## 4. Journal PDF

```bash
node scripts/upload-journal.mjs "/path/to/LP_Limitless_Journal_Combined_01.pdf"
```

Puts the file in the private `member-files` bucket. `/journal/download` issues
a ten minute signed URL, so the PDF is never publicly addressable.

## 5. Members

Simplest route out of Kit is one export per tier, since Kit's subscriber export
does not always carry a tags column.

Export **Limitless Pro 4.0** (22298774) and **Limitless Core 4.0** (21915934)
separately, then run the import once per file:

```bash
node scripts/import-members.mjs pro.csv --tier=pro --commit
```

```bash
node scripts/import-members.mjs core.csv --tier=core --commit
```

Drop `--commit` first to check the counts against Kit's tag numbers. If your
export does happen to include a tags column, one file works too and the tier is
read from it.

Members are created ahead of time and confirmed, so their first magic link
signs them straight in. Anyone who signs in without a profile gets Core, which
is the safe way round.

## 6. Content still to add

None of these stop launch, but members will see the gaps.

| Where | What |
|---|---|
| `src/content/assets.ts` | Onboarding call recording URL, Pro WhatsApp invite |
| `src/content/assets.ts` | The four workshop dates, so the buttons stop saying "to be confirmed" |
| `src/content/digests.ts` | Week 7, which exists only in Kit |
| `src/content/entry-extras.ts` | Nothing outstanding |
| `src/app/globals.css` | Brand green, once Dan confirms the hex |

## 7. Before you announce it

- [ ] Sign in as yourself with a real magic link, on a phone
- [ ] Week 1 reads; weeks 2 to 16 show a padlock
- [ ] The journal PDF downloads
- [ ] An entry saves what you type, then survives a reload
- [ ] Tick something on the Start Guide, reload, it is still ticked
- [ ] As a Pro member, the Pro page and WhatsApp link appear
- [ ] As a Core member, they do not

### Checking the release gate

The gate is time based, so the honest test is to wait. To check the boundary
before Sunday, set `PREVIEW_WEEK=0` locally: the Start Guide should show the
onboarding marker as current and every chapter locked.
