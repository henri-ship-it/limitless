/**
 * What members have said, for showing to somebody about to start.
 *
 * Taken from the Testimonial Bank in Notion on 25 November 2026. That page is
 * the source of truth and this file is a copy of the part of it that is safe
 * to show inside the platform. When the bank changes, this changes; nothing is
 * added here that is not in it.
 *
 * **What is deliberately not here, and why.** The bank records that screenshot
 * permissions were granted in August 2026 for the material that existed then,
 * and that everything added since from the Pro groups has not been cleared. It
 * also names four quotes that need their author's explicit sign off before
 * publication: Adele on ADHD, which names a diagnosis; Adele on family and
 * values, which is about her relatives; Simon's eight week arc, which names his
 * employer and his job move; and Steve's material about his daughter. None of
 * those are in this file, and none of the Best short lines are either. If any
 * of them get signed off, they can be added with a note saying by whom and
 * when.
 *
 * Everything below is attributed by first name only, which is the rule the
 * bank sets. No surnames, ever, in anything a member or the public sees.
 *
 * One further caution worth keeping in mind when these are shown beside
 * somebody's own result: all of it was written in a private group, to Chris or
 * to each other, not to an audience. Showing it to a member who is themselves
 * inside the programme is within what people expected. Putting it on the
 * public site is a separate decision and a separate permission.
 */

export type Testimonial = {
  /**
   * Which problem this answers. Matched to the obstacle a member has just
   * named, so nobody is shown a quote about focus when they said they cannot
   * ask for help.
   */
  pain: 'doubt' | 'overthinking' | 'clarity' | 'systems' | 'focus' | 'alone' | 'pressure'
  /** First name only, or the source when there is no name. */
  who: string
  /** Where they said it, so nothing is passed off as a formal review. */
  where: string
  quote: string
  /** Anything that has to be true before this is used outside the platform. */
  caution?: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    pain: 'doubt',
    who: 'A member',
    where: 'cohort WhatsApp, at the end',
    quote:
      'I was in a bad place before I started. I felt lost and did not know who I was as a person. You have helped guide me to find my purpose and what I stand for. It has given me structure in my life that I did not think I was capable of.',
  },
  {
    pain: 'doubt',
    who: 'Tim',
    where: 'end of programme feedback',
    quote:
      'I talked to myself negatively and got stuck in cycles. The biggest change has been self acceptance.',
  },
  {
    pain: 'overthinking',
    who: 'Adele',
    where: 'cohort WhatsApp, week one',
    quote:
      'I spend a lot of time, energy and mental fatigue worrying about the minor details of what could go wrong. My cautiousness often holds me back from making important decisions. So this week I decided to change that. Bit the bullet and challenged myself with what if. Booked onto my first half ironman.',
  },
  {
    pain: 'overthinking',
    who: 'Duncan',
    where: 'Elevate, month one',
    quote: 'I am catching harmful behaviours sooner, sometimes before they have happened.',
  },
  {
    pain: 'overthinking',
    who: 'Natalie',
    where: 'Elevate, month one',
    quote:
      'Not overthinking my natural style in the moment, but backing myself more to follow my gut instinct.',
  },
  {
    pain: 'clarity',
    who: 'A member',
    where: 'cohort WhatsApp',
    quote:
      'I came on this course to find constant peak performance. I thought that was the goal. Instead it is showing me the patterns of thought I did not even know I was trapped in, and giving me new ways of thinking.',
  },
  {
    pain: 'clarity',
    who: 'A member',
    where: 'cohort WhatsApp',
    quote:
      'The value alignment piece has brought a lot of clarity towards what I want to do. I will be moving on from my role at the end of the year to rebuild my own business.',
  },
  {
    pain: 'clarity',
    who: 'Tom',
    where: 'end of programme feedback',
    quote: 'You do not know what you do not know.',
  },
  {
    pain: 'systems',
    who: 'Iain',
    where: 'cohort WhatsApp',
    quote:
      'The breakthrough was around intentions and actions. It is not a failure of a day if I did not tick off my to-do list, but rather were my intentions met that day, even if the action was not quite finished.',
  },
  {
    pain: 'systems',
    who: 'An Instagram comment',
    where: 'on the journal',
    quote:
      'The journal has been a god send. I used to buy a new journal at least once a month and never got round to doing it. I have stuck to this one daily all year.',
  },
  {
    pain: 'systems',
    who: 'Tom S',
    where: 'Elevate, month one',
    quote:
      'The discipline of journalling. When I did not do it, it tended to lead to worse outcomes.',
  },
  {
    pain: 'focus',
    who: 'Chris B',
    where: 'Instagram, a day after one talk',
    quote:
      'The action I have taken in the last 24 hours to improve my focus and recovery has given me a complete mindset shift towards how I structure my week and my day to day.',
  },
  {
    pain: 'focus',
    who: 'Steve',
    where: 'cohort WhatsApp',
    quote:
      'Using the journal on Sunday really set the tone for the week ahead. I felt a million times more relaxed and focused.',
  },
  {
    pain: 'focus',
    who: 'Natalie',
    where: 'Elevate, month one',
    quote:
      'A new rhythm to my work days. Stacking regular meetings in the morning and using afternoons for focused work and reflection, with fewer meetings.',
  },
  {
    pain: 'alone',
    who: 'Alex',
    where: 'cohort WhatsApp',
    quote:
      'Biggest win. Reaching out for the tangible support I have been putting off for too long. I hope it will help me feel more balanced in myself and be less of a bottleneck at work.',
  },
  {
    pain: 'alone',
    who: 'A member',
    where: 'cohort WhatsApp, halfway',
    quote:
      'The pace and information has not come on too quick. I like that the journalling prompts are spaced apart, it gives time for reflection. The group calls have given that extra bit of sauce. Really enjoying it and glad I invested in the course.',
  },
  {
    pain: 'alone',
    who: 'Simon',
    where: 'cohort WhatsApp, mid programme',
    quote:
      'Leaning into the rhythm of seeking connection early on ideas, and bringing insights in to elevate my thinking instead of forging ahead alone.',
  },
  {
    pain: 'pressure',
    who: 'Nathan',
    where: 'Elite, month one review',
    quote:
      'As the pressure built, I became more fixed in one mode at the very moment I needed the others. I did not lose capability, I lost flexibility.',
    caution:
      'From a private email to Chris rather than a group screenshot. Fine inside the platform; get Nathan to sign it off before it goes on the site.',
  },
  {
    pain: 'pressure',
    who: 'Ajdin',
    where: 'cohort WhatsApp, halfway',
    quote:
      'My biggest win is equanimity. Obstacles throw us off balance and the idea is to recover quickly. In the past it could take a few days to a week. Now I get back to that spot in one to three days, and sometimes hours.',
  },
]

/**
 * Which pain a member's chosen obstacles point at.
 *
 * The obstacle list in journey.ts is written in members' own words, so this
 * maps those lines onto the bank's categories rather than making the member
 * pick a category. First match wins, taking their answers in the order they
 * picked them, so somebody's first choice decides what they are shown.
 */
const OBSTACLE_PAIN: { match: string; pain: Testimonial['pain'] }[] = [
  { match: 'doubting myself', pain: 'doubt' },
  { match: 'overthink', pain: 'overthinking' },
  { match: 'hold focus', pain: 'focus' },
  { match: 'do not stick', pain: 'systems' },
  { match: 'easy work', pain: 'clarity' },
  { match: 'react first', pain: 'pressure' },
  { match: 'ask for help', pain: 'alone' },
  { match: 'recover from', pain: 'pressure' },
  { match: 'work on next', pain: 'clarity' },
  { match: 'say yes', pain: 'alone' },
]

export function painFor(obstacles: string[]): Testimonial['pain'] | undefined {
  for (const obstacle of obstacles) {
    const hit = OBSTACLE_PAIN.find((row) => obstacle.toLowerCase().includes(row.match))
    if (hit) return hit.pain
  }
  return undefined
}

/**
 * Quotes for a pain, most useful first.
 *
 * Falls back to the whole set rather than to nothing, because an unmatched
 * member should still see that other people have been here.
 */
export function testimonialsFor(pain: Testimonial['pain'] | undefined, limit = 2): Testimonial[] {
  const matching = pain ? TESTIMONIALS.filter((t) => t.pain === pain) : []
  const pool = matching.length ? matching : TESTIMONIALS
  return pool.slice(0, limit)
}
