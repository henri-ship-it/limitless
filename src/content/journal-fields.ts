/**
 * The shape of one journal entry, matching the printed spread.
 *
 * Preview the day on the left, review it on the right, and work the exercise
 * in between. The exercise prompts come from the entry itself, so they are not
 * listed here.
 */
export const SCHEDULE_HOURS = [
  '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm',
  '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm',
] as const

export const REVIEW_FIELDS = [
  { key: 'win', label: 'One win of your day' },
  { key: 'mind', label: 'One thing on your mind' },
  { key: 'grateful', label: 'One thing you are grateful for' },
] as const

export type EntryData = {
  intentions?: string[]
  achievements?: string[]
  schedule?: Record<string, string>
  win?: string
  mind?: string
  grateful?: string
  prompts?: string[]
}

export const EMPTY_ENTRY: EntryData = {}
