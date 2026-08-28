import { createDwell } from '../src/lib/dwell'

let clock = 0
const now = () => clock
const dwell = createDwell(3, now)
const fail: string[] = []
const is = (what: string, got: number, want: number) => {
  if (got !== want) fail.push(`${what}: got ${got}, wanted ${want}`)
}

// An hour of reading, flushed every twenty seconds, is an hour.
dwell.resume()
let total = 0
for (let i = 0; i < 180; i++) {
  clock += 20_000
  total += dwell.flush(true)
}
is('an hour of reading, flushed every 20s', total, 3600)

// The original bug: the second flush and every one after returned nothing.
const bugged = createDwell(3, now)
bugged.resume()
clock += 20_000
is('first flush', bugged.flush(true), 20)
clock += 20_000
is('second flush still counts', bugged.flush(true), 20)

// Time stops when they leave and starts again when they come back.
const away = createDwell(3, now)
away.resume()
clock += 10_000
is('banked before leaving', away.flush(false), 10)
clock += 600_000 // ten minutes in another window
away.resume()
clock += 5_000
is('nothing counted while away', away.flush(true), 5)

// Short stretches are held back, not thrown away.
const brief = createDwell(3, now)
brief.resume()
clock += 1_000
is('under the minimum sends nothing', brief.flush(true), 0)
clock += 1_000
is('still under', brief.flush(true), 0)
clock += 2_000
is('the remainder is kept and added', brief.flush(true), 4)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('dwell: all checks pass')
