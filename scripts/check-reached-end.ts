import { createReachedEnd } from '../src/lib/reached-end'

let clock = 0
const now = () => clock
const fail: string[] = []
const is = (what: string, got: boolean, want: boolean) => {
  if (got !== want) fail.push(`${what}: got ${got}, wanted ${want}`)
}
const make = () => createReachedEnd(2500, now)

// The one that matters: a digest shorter than the window is on screen from the
// moment it loads. Sitting there without scrolling is not reading it.
const short = make()
short.sees(true)
clock += 60_000
is('on screen from load, never scrolled', short.reached(), false)

// The ordinary case. They scroll, they arrive, they stay.
const read = make()
read.scrolls()
read.sees(true)
clock += 2_499
is('just short of long enough', read.reached(), false)
clock += 1
is('long enough', read.reached(), true)

// Flicking to the bottom for the link to next week and carrying on.
const flick = make()
flick.scrolls()
flick.sees(true)
clock += 1_000
flick.sees(false)
clock += 60_000
is('passed through the end', flick.reached(), false)

// And doing it repeatedly still is not reading: the clock restarts each time
// rather than banking, which is where this differs from time on page.
const again = make()
again.scrolls()
for (let i = 0; i < 5; i++) {
  again.sees(true)
  clock += 1_000
  again.sees(false)
  clock += 1_000
}
is('five passes do not add up to one read', again.reached(), false)

// A tab left open at the end of the digest behind another window.
const behind = make()
behind.scrolls()
behind.sees(true)
behind.shows(false)
clock += 600_000
is('ten minutes hidden', behind.reached(), false)
behind.shows(true)
clock += 2_500
is('and counted once it is back in front', behind.reached(), true)

// Once true it stays true, so a later scroll away cannot untick the week.
const latched = make()
latched.scrolls()
latched.sees(true)
clock += 2_500
is('reached', latched.reached(), true)
latched.sees(false)
is('stays reached after leaving', latched.reached(), true)

// counting() is what the component hangs its timer on.
const timer = make()
is('not counting before a scroll', timer.counting(), false)
timer.sees(true)
is('still not counting', timer.counting(), false)
timer.scrolls()
is('counting once both are true', timer.counting(), true)
timer.shows(false)
is('not counting behind another window', timer.counting(), false)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('reached-end: all checks pass')
