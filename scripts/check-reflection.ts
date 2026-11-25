/**
 * The gate on the final week.
 *
 * Worth asserting rather than eyeballing, because the page it governs is the
 * hardest one on the platform to reach: a member only sees it in the sixteenth
 * week of a cohort, and only before they have answered. Getting it wrong in
 * either direction is expensive. Hold a week that should be open and somebody
 * is locked out of the last week of a programme they paid for. Open one that
 * should hold and the reflection goes back to being the thing nobody notices.
 */
import { REFLECTION_WEEK, reflectionGate } from '../src/content/reflection'

let failures = 0

function is(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) {
    failures += 1
    console.error(`✗ ${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
  } else {
    console.log(`✓ ${label}`)
  }
}

is('it closes the sixteen weeks', REFLECTION_WEEK, 16)

// A member in the final week who has not answered. The case this exists for.
is('asked, and the week waits', reflectionGate({ week: 16, done: false, isAdmin: false }), {
  ask: true,
  hold: true,
})

// Answered. The week opens and the ask does not linger.
is('answered, so the week opens', reflectionGate({ week: 16, done: true, isAdmin: false }), {
  ask: false,
  hold: false,
})

/*
 * An admin sees what a member sees but is never held, so the programme can be
 * reviewed without sitting an assessment against a real account.
 */
is('an admin is asked', reflectionGate({ week: 16, done: false, isAdmin: true }), {
  ask: true,
  hold: false,
})

// Every other week is untouched, including the deload weeks that are not last.
for (const week of [1, 4, 8, 12, 15]) {
  is(`week ${week} is untouched`, reflectionGate({ week, done: false, isAdmin: false }), {
    ask: false,
    hold: false,
  })
}

/*
 * A week past the end. `getWeek` already 404s these, but the gate must not be
 * the thing that decides it, and it must not hold a page that does not exist.
 */
is('week 17 is untouched', reflectionGate({ week: 17, done: false, isAdmin: false }), {
  ask: false,
  hold: false,
})

if (failures) {
  console.error(`\n${failures} failed`)
  process.exit(1)
}
console.log('\nreflection gate holds')
