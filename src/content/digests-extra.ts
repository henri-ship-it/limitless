import type { Digest } from './digests'

/**
 * Digests written here rather than imported from Notion.
 *
 * The importer reads one page holding all sixteen weeks, and week 7 is marked
 * MISSING on it: no content calendar page was ever written for the realistic
 * optimism chapter, and the note says the email lives only in Kit. So the
 * importer skipped it, and the week page told members their digest had not
 * arrived yet, which it never would.
 *
 * This one is built from Chris's own Chapter 6 masterclass script, which is the
 * video that runs against this same week, so the digest and the masterclass say
 * the same thing. The studies, the Stockdale paradox, the matrix and the three
 * part lens are all his, in his order.
 *
 * It is here rather than in digests.ts because that file is generated and the
 * next import would throw a hand edit away. If the Kit broadcast turns up, or
 * Chris writes the page, put it in Notion and delete the entry here: the
 * importer wins once the week stops being marked MISSING.
 */
export const extraDigests: Digest[] = [
  {
    week: 7,
    nodes: [
      {
        type: 'p',
        text: 'Two athletes. Same injury, same diagnosis, same rehab timeline, same brutal odds.',
      },
      {
        type: 'p',
        text: 'Months later one has quietly stepped away from the sport. The other is on the verge of a comeback. Not ability. Not fortune. Something else entirely.',
      },
      {
        type: 'p',
        text: 'Psychologists call it realistic optimism, and it is one of the most consistent traits found in top athletes, resilient teams and the underdog stories you remember. Unlike talent, it is trainable.',
      },
      { type: 'h', text: 'This Week’s Focus' },
      {
        type: 'p',
        text: 'Optimism gets a bad reputation. People hear the word and think delusional, out of touch, head in the clouds. But optimism is not ignoring reality. It is choosing a more useful one.',
      },
      { type: 'sub', text: 'Blind Optimism and Realistic Optimism' },
      {
        type: 'p',
        text: 'This is where most people get it wrong. Blind optimism says it will all work out. Realistic optimism says it might be difficult, but I have tools and I will find a way. One is a wish. The other is a plan.',
      },
      { type: 'sub', text: 'The Stockdale Paradox' },
      {
        type: 'p',
        text: 'Jim Stockdale spent eight years as a prisoner of war. Asked later who did not make it out, his answer was not the pessimists. It was the optimists, the ones who kept saying they would be out by Christmas. Christmas passed. Easter, then. Easter came and went. Each time hope was pinned to a deadline and broken, a little more of their spirit collapsed.',
      },
      {
        type: 'p',
        text: 'Stockdale never lost faith that he would get out, and he never lied to himself about how bad things were. He accepted the brutal facts and held on to belief in the outcome. That combination of grounded realism and unwavering hope is the whole of it.',
      },
      { type: 'h', text: 'Key Insights' },
      { type: 'sub', text: 'Explanatory Style' },
      {
        type: 'p',
        text: 'Take two people rejected from a job. One says I am not good enough, I will never catch a break. The other says this was not the one, I will learn and go again. Same event, two interpretations. One spirals, the other adapts. How you explain events, especially setbacks, predicts your bounce back speed and your long term progress.',
      },
      { type: 'sub', text: 'The Optimism Matrix' },
      {
        type: 'p',
        text: 'Picture a quadrant. One axis is how grounded you are in reality. The other is how much hope you hold for the future. Our injured athlete sits somewhere on it:',
      },
      {
        type: 'ul',
        items: [
          'Low reality, low hope is helplessness. They ignore the rehab plan, stop showing up, and quietly quit.',
          'High hope, low reality is fantasy. Convinced they will recover in half the time, they skip the basics, push too hard and are re-injured within weeks.',
          'High reality, low hope is cynicism. They follow the protocol and know the statistics, but they have already retired in their mind.',
          'High reality, high hope is realistic optimism. They know the injury is serious and the recovery long, and they still believe they can come back stronger.',
        ],
      },
      {
        type: 'p',
        text: 'That last one is the space I call the power of possible. They focus on what they can control today, they show up with purpose, they track progress, and they do not fake positivity. They choose it.',
      },
      { type: 'h', text: 'Implementation Guide' },
      { type: 'sub', text: 'Daily Journal Practice' },
      {
        type: 'ul',
        items: [
          'Identify an ideal outcome you are working towards, with its best case and its obstacles',
          'List the resources you already hold against it: skills, time, support',
          'Build the action plan, and write down how you will take responsibility for each step',
          'Recall a past success and name the lessons and strengths you can carry across',
          'Score the likelihood of your outcome at each step, and watch what the scoring does',
        ],
      },
      { type: 'sub', text: 'Weekly Challenge' },
      {
        type: 'p',
        text: 'Reframe one setback, just one, through the three part lens. Time: will this still matter in a year? Scope: is this about everything, or just this? Control: what is one thing I can do next? That is where optimism becomes action.',
      },
      { type: 'sub', text: 'Reflection Questions' },
      {
        type: 'ul',
        items: [
          'Where do you sit on the matrix when you are under pressure?',
          'When you face a challenge, do you spiral, gloss over the facts, or face them and still move forward?',
          'What is the most constructive story you can tell yourself about your current challenge?',
          'What can you still influence, and what opportunity could this lead to?',
        ],
      },
      { type: 'h', text: 'The Science in Action' },
      {
        type: 'p',
        text: 'Martin Seligman tested the optimism levels of insurance sales teams, then tracked their performance over two years. Salespeople with optimistic explanatory styles, who saw setbacks as temporary, specific and within their control, sold 37% more than their peers. Those in the top tenth for optimism sold 88% more than those in the bottom tenth. They did not avoid rejection. They just did not dwell in it.',
      },
      {
        type: 'p',
        text: 'The physiology follows. Optimists show lower cortisol, stronger cardiovascular health, greater persistence and better long term wellbeing. The mechanism is not mysterious: they keep moving, and continued action is what tilts the odds in your favour.',
      },
      { type: 'h', text: 'Connecting the Dots' },
      { type: 'p', text: 'This chapter builds directly on the work behind it:' },
      {
        type: 'ul',
        items: [
          'Psychological flexibility gave you the space between the thought and the response. Realistic optimism decides what you do with that space.',
          'Your motivation drivers tell you what keeps you going. Optimism determines whether you are still there to be driven after a setback.',
          'Your values are what the hope is for. Grounded belief without direction is just restlessness.',
        ],
      },
      { type: 'h', text: 'Looking Ahead' },
      {
        type: 'p',
        text: 'Next week is a deload. No new frameworks, just the space to connect psychological flexibility, motivation and realistic optimism into one mental operating system.',
      },
      { type: 'h', text: 'This Week’s Focus Areas' },
      { type: 'p', text: '1. Place yourself honestly on the optimism matrix' },
      { type: 'p', text: '2. Work the stairway against one real challenge' },
      { type: 'p', text: '3. Reframe a setback through time, scope and control' },
      { type: 'p', text: '4. Notice where you default to fantasy or to cynicism' },
      { type: 'p', text: '5. Track what the scoring does to your sense of what is possible' },
      { type: 'h', text: 'Remember' },
      {
        type: 'p',
        text: 'Realistic optimism is not pretending everything is fine. It is believing things can improve because you are willing to act. It is facing the facts and still choosing hope.',
      },
      {
        type: 'p',
        text: 'Choose the lens that fuels you, not the one that fools you.',
      },
    ],
    quote: {
      lines: [
        'You don’t need a perfect future to be hopeful.',
        'You just need a perspective that helps you keep moving.',
      ],
    },
  },
]
