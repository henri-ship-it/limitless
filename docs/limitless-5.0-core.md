# Limitless 5.0: Core as a standalone product

Two things are tangled together here and they are worth separating, because one
is a small fix to what is already live and the other is a new product.

1. **Week completion is in the wrong place.** Live now on 4.0, worth fixing on
   its own. Covered first.
2. **Core sold on its own, any day of the year**, as part of 5.0 and beyond.
   A new programme tab with its own clock, its own tags and its own sends.

---

## 1. Week completion

### What happens today

Two separate things both write the same tick, and neither of them is the week
being finished.

- `DigestEnd` marks the week complete automatically once somebody has been at
  the bottom of the digest for two and a half seconds. The digest lands at the
  **start** of the week, so this fires on the Sunday, before a single entry has
  been written.
- `MarkWeekDone` sits at the very foot of the week page as a button. Same tick,
  pressed by hand, and mostly not pressed at all.

So the tick means "read the digest" when it fires by itself and "I am done"
when it is pressed, and the sidebar shows a mix of the two. That is why it
feels all over the place, and why the record is not worth much.

### The thing that was already there

Every week runs seven journal entries, and **the seventh entry closes the
week**. `isHuddle(n)` already knows this: entries 7, 14, 21 and so on carry no
artwork because they are the week's close rather than a new exercise.

The week already has a completion act. It is writing entry 7n. Asking somebody
to tick a box as well is asking them to do the same thing twice, once for real
and once for the record, which is exactly the kind of admin people skip.

### What to build

**Derive it. Delete the ask.**

- A week is complete when its closing entry has been written. Nothing to tick.
  `member_progress` still gets a row, written when that entry saves, so the
  sidebar, the admin views and the cohort table all keep working unchanged.
- **Bottom of the digest**: drop the button, show the week's seven entries, as
  Henri suggested. Which are written, which are not, today's one highlighted,
  and the seventh marked as the one that closes the week. At the start of the
  week the right next action is the first entry, not a verdict on work that has
  not happened.
- **Top of the next digest**: a short band about the week just gone. Entries
  written out of seven, and if the closing entry is still blank, one link
  straight to it: "Close out week 4". Not a tick. The actual thing, in the one
  moment where the question can honestly be answered.
- Once all seven are written, that band says so and asks for nothing.
- `DigestEnd` stops writing completion. Reading the digest is still worth
  recording, and the dwell tracking already does it, but it is a fact about the
  digest and it should stop pretending to be a fact about the week.

That band at the top of the digest is the same slot the gamified lines belong
in: entry number, entries last week, streak, and the breakthrough pulled from
their own writing. One band, read at the top, about where they actually are.

---

## 2. Core as a standalone product

### Where it goes

A programme tab of its own. `programme-mode.ts` already switches the whole
platform between the sixteen week programme and Elite on a cookie, and Elite
already proves the pattern that matters most here: `elite_start_date` on the
profile, chapters opening a fixed number of days after that member's own start
rather than on a date the cohort shares.

Core evergreen is the same shape. Sixteen weeks instead of twelve chapters.

The 4.0 clock stays exactly as it is. Nothing about a live cohort moves.

### Tagging

Members need to be separable three ways, and today only two of them exist.

- `cohort`: add `5.0`. Already a foreign key to `cohorts`, so this is a row.
- `tier`: `core` already exists. No change.
- **Enrolment**: new. A cohort member starts when the cohort starts. An
  evergreen member starts when they say. Both are `core` on `5.0`, so the tier
  cannot carry it.

Add `programme_start_date` to profiles, the same way Elite has one. Null means
they run on their cohort's date, which is every 4.0 member untouched. A date
means they run on their own, and everything downstream counts whole days from
there. Plus a Kit tag per route, `limitless-5.0-core-evergreen`, so the sends
can be aimed.

### Built so far

Steps 1 and 2 below, as uncommitted changes. Nothing is applied and nothing is
deployed.

- `supabase/migrations/0016_limitless_5_0.sql`. Cohort `5.0` with a null start
  date, an `enrolment` enum of `cohort` and `evergreen`, and on profiles
  `programme_start_date`, `digest_send_hour`, `journal_ordered`, `onboarding`
  and `onboarded_at`. Two functions for the member writes, `start_programme`
  and `save_onboarding`, since the only way a member writes to `profiles`
  elsewhere is through one.
- `lib/cohort.ts` now runs on a `Clock` rather than the cohort constant, and
  `clockFor(member)` hands a member their own date or the cohort's. A null
  start is a state of its own: nothing opens, not even week one, because the
  alternative is a programme running on a date nobody chose.
- Week 1 is counted straight from the start date rather than snapped to the
  Monday of the week containing it. The cohort starts on a Monday so the two
  agree, but a member choosing a Wednesday gets a week that runs Wednesday to
  Tuesday.
- `scripts/check-clock.ts` holds the above down, including the October clock
  change and an hour of the member's choosing.

**Applied to the live database on 5 November 2026**, recorded as
`limitless_5_0` on project `cntiexipbbolysoztkdz`. Verified afterwards: all 19
members on 4.0 read `enrolment` as `cohort` with no start date and no send hour
of their own, so they stay on the cohort clock and none of their dates move. The
order mattered, because `getMember` selects the new columns and against a
database without them it would have read every member as having no profile.

### The pieces, in order

1. ~~**Schema.**~~ Done, see above.
2. ~~**A per-member clock.**~~ Done, see above.
3. **Stripe.** Checkout with the journal as an optional line item, webhook on
   `checkout.session.completed`, profile created against the checkout email,
   magic link sent. Guest checkout is the normal case here, so the webhook has
   to read the email off the session rather than off a customer record.
4. **Onboarding.** Pre-assessment questions, then pick a start date, then pick
   the day and time the digest lands. Journal buyers get a start date far
   enough out that the book arrives first.
5. **Sends.** Triggered from their start date, not from purchase.
6. **The digest band.** The gamified lines from part 1, which by then have a
   per-member clock to count against.

### The one that needs deciding

Everything today goes out of Kit, as sequences. Kit can trigger a sequence on a
tag, so "starts when they start" is handled. What it cannot do is let each
subscriber pick their own send time: that setting belongs to the sequence, not
the subscriber. So a member choosing when their digest lands means either

- **a sequence per time slot** in Kit, which is sixteen emails times however
  many slots are offered, kept in step by hand forever, or
- **sending from the platform**, a cron that walks the members whose next week
  is due at this hour and sends. The digest content already lives in the repo,
  so the email is a render of what is on the week page. Kit keeps the list and
  the broadcasts, the platform owns the per-member sequence.

The second is more to build and the only one that holds up past a handful of
slots. It is also the one that makes the personalised top band possible, since
those lines have to be computed per member at send time.
