# Limitless

The member platform for Limitless, the sixteen week performance psychology
programme from LMNTARY Performance. Built for cohort 4.0, which starts on
Monday 31 August 2026.

## Running it

```bash
npm install
npm run dev
```

With no Supabase credentials the app runs in **preview mode**: no sign-in, a
stub Core member, and progress that is not saved. This exists so the interface
can be reviewed before the Supabase project is created.

Two development-only switches, in `.env.local`:

```
PREVIEW_WEEK=1      # pin the cohort to a week so week pages can be checked
PREVIEW_TIER=pro    # preview as a Pro member
```

`PREVIEW_WEEK` is ignored in production. Without it the current week is derived
from the cohort start date, so before 31 August every week is locked.

## Connecting Supabase

1. Create the project, then copy `.env.example` to `.env.local` and fill it in.
2. Run `supabase/migrations/0001_init.sql` and `0002_storage.sql`.
3. Upload the journal PDF to the `member-files` bucket at
   `journal/LP_Limitless_Journal_Combined_01.pdf`.
4. Authentication → set the refresh token expiry to thirty days, so a magic link
   keeps a member signed in for the period the sign-in page promises.
5. Authentication → Email templates: replace the magic link template with the
   copy in `docs/emails.md`.
6. Authentication → set custom SMTP. Supabase's built-in sender is rate limited
   and not deliverable enough for a cohort send. Resend or Postmark, sending as
   `chris@lmntaryperformance.com`.

Members are created ahead of time. `signInWithOtp` is called with
`shouldCreateUser: false`, so an address that is not already in `profiles`
cannot sign in. Import the 4.0 list from the Kit tags (Core 4.0 `21915934`,
Pro 4.0 `22298774`) into `auth.users` and `profiles`.

## Content

| What | Where |
|---|---|
| Week and module structure, chapter openings | `src/content/programme.ts` |
| Journal entries and prompts | `src/content/journal.ts` (generated) |
| Weekly digest bodies | `src/content/digests.ts` (empty, see below) |
| Start Guide tick list | `src/content/checklist.ts` |
| Recording URLs, PDF path, WhatsApp invite | `src/content/assets.ts` |

Content lives in the repo rather than the database. A week page renders whatever
it has: with no digest it shows the chapter opening from the journal, the
masterclass and the week's journal entries, which is enough to be useful. When
the digest is added the remaining sections appear.

### Seeding the digests

`src/content/digests.ts` is generated from the Notion page "Limitless Digest,
Weeks 1-16 (sequence copy, dates removed)". To regenerate, export that page to
markdown and run:

```bash
python scripts/import-digests.py digests-raw.md
```

Chris's headings differ from week to week, so a digest is stored as an ordered
list of nodes rather than fixed fields, and the week page walks the list. The
importer also:

- strips every mention of the module workshops, which belong on the deload week
  page where the recording lands
- applies house style: em dashes become commas or full stops, semicolons become
  full stops
- lifts the closing quotation of each week into its own field

Week 7 has no page in Notion and exists only in Kit, so it has no digest. Its
week page shows the empty state until the copy is added.

### Regenerating the journal

```bash
python scripts/parse-journal.py path/to/LP_Limitless_Journal_Combined_01.pdf
```

## Design

The interface follows the Visualize Value course layout: a programme rail, a
week list, and a content column, with mono labels and hairline rules. All of it
is tokenised in `src/app/globals.css` so it can be restyled from Figma without
touching a component.

Two things are placeholders and need the real values:

- **Brand green.** `--color-accent` is `#17795e`. Replace it with the LMNTARY
  hex. It is used only for progress ticks, the current week marker and one
  button.
- **Departure Mono.** The label typeface on the reference interface. Put
  `DepartureMono-Regular.woff2` in `public/fonts/`. Until then the stack falls
  through to SF Mono, which is close but not the same.

## Release

The programme is released a week at a time, the same for both tiers. A chapter
opens at **16:00 UK on the day before it begins**, so it is there when the
digest lands rather than at midnight on the Monday. Week 1 opens at 16:00 on
Sunday 30 August.

Weeks ahead of release stay visible in the nav, under a padlock. The clock
change in October falls mid-programme, so release times are worked out in
Europe/London rather than UTC. See `src/lib/cohort.ts`.

## What is missing

Tracked so nothing ships with invented content:

- The Week 7 digest, which exists only in Kit
- Cohort 4.0 onboarding recording, from 26 August
- Cohort 4.0 workshop recordings and workshop dates
- The Pro WhatsApp invite link and the weekly drop-in call time
- The 4.0 member list with tiers
- Brand green, logo files and fonts
