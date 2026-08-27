# Going live

Week 1 opens **Sunday 30 August at 16:00 UK**. Everything below has to be done
before then. Steps marked **you** need an account Claude cannot reach.

Work top to bottom. Step 2 has a queue on it, so start that first.

---

## 1. Supabase project — **you**

1. Create a project at supabase.com. Region: London.
2. Project settings → API. Copy the project URL, the `anon` key and the
   `service_role` key.
3. SQL editor → run the three migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_storage.sql`
   - `supabase/migrations/0003_journal.sql`
4. Table editor → `cohorts` → insert one row:

   | label | start_date | onboarding_call_at |
   |---|---|---|
   | 4.0 | 2026-08-31 | 2026-08-26 12:00+01 |

The service role key bypasses row level security. It belongs in `.env.local`
and in Vercel's environment variables, never in the browser.

## 2. Magic link email — **you, start this first**

Supabase's built-in SMTP is rate limited and lands in spam. Use Resend.

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

Export the cohort from Kit: tag **Limitless Member 4.0** (21915932), including
the tag column so Pro can be told from Core. Then:

```bash
node scripts/import-members.mjs members.csv           # check the counts
node scripts/import-members.mjs members.csv --commit  # create them
```

Check the Pro and Core split against Kit's tag counts before committing:
**Limitless Pro 4.0** is 22298774 and **Limitless Core 4.0** is 21915934.

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
