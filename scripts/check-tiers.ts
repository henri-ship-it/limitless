/**
 * Five products, two journals.
 *
 * Worth a check rather than an eyeball because every one of these answers used
 * to be the single test `tier === 'elite'`, and the three products that now
 * share that journal are not launched yet. Nothing in the interface will look
 * wrong when the first Elevate member signs in: they will simply be handed
 * Core's sixteen weeks, or Elite's welcome call with Chris, and neither is
 * theirs. So the mapping is asserted here instead of waited for.
 */
import { TIERS, modeFor, tierInfo, type Tier } from '../src/content/programme'
import { checklistFor } from '../src/content/checklist'

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

const keys = TIERS.map((t) => t.key)

is('five products', keys.length, 5)
is('each one named once', new Set(keys).size, 5)
is('sold in this order', keys, ['core', 'pro', 'elite', 'elevate', 'threesixtyfive'])

// Which journal. The question most of the platform is actually asking.
is('Core reads the sixteen weeks', modeFor('core'), 'limitless')
is('Pro reads the sixteen weeks', modeFor('pro'), 'limitless')
is('Elite reads the year', modeFor('elite'), 'elite')
is('Elevate reads the year', modeFor('elevate'), 'elite')
is('365 reads the year', modeFor('threesixtyfive'), 'elite')

/*
 * The fallback, which is load bearing. A tier column read from a row written
 * by something that has not been taught about a product must not open the year
 * long journal to somebody who did not buy it.
 */
is('an unknown product reads as Core', tierInfo('platinum').key, 'core')
is('and so reads the sixteen weeks', modeFor('platinum'), 'limitless')
is('an empty tier reads as Core', tierInfo('').key, 'core')

// What is wrapped around the journal, which is what separates the three.
is(
  'only Elite buys Chris by the month',
  TIERS.filter((t) => t.oneToOne).map((t) => t.key),
  ['elite'],
)
is(
  'only Pro has the group calls',
  TIERS.filter((t) => t.groupCalls).map((t) => t.key),
  ['pro'],
)
is(
  'only 365 buys coaching a call at a time',
  TIERS.filter((t) => t.coachingOnDemand).map((t) => t.key),
  ['threesixtyfive'],
)
is('every product says what it is', TIERS.every((t) => t.summary.length > 0), true)

// Setting up. The journal picks the list, the product picks what is in it.
const setup = (tier: Tier) => checklistFor(tier).map((i) => i.key)

is('Elite is told to book its welcome call', setup('elite').includes('elite-welcome-call'), true)
is('Elite is told to save Chris', setup('elite').includes('elite-whatsapp'), true)
is('Elevate is not, having bought neither', setup('elevate').includes('elite-welcome-call'), false)
is('nor told to save him', setup('elevate').includes('elite-whatsapp'), false)
is('365 is not either', setup('threesixtyfive').includes('elite-welcome-call'), false)
is('but all three still receive journals', setup('elevate').includes('elite-journal'), true)
is('and all three are assessed', setup('threesixtyfive').includes('elite-assessment'), true)

is('Core is not sent to the drop-in', setup('core').includes('drop-in'), false)
is('Pro is', setup('pro').includes('drop-in'), true)
is('Core is not sent to the WhatsApp group', setup('core').includes('whatsapp'), false)
is('the year long list is never the weekly one', setup('elevate').includes('journal'), false)

console.log(failures ? `\n${failures} failed` : '\ntiers hold')
process.exit(failures ? 1 : 0)
