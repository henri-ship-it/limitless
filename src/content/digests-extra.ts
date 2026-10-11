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
 * This is Chris's own copy, from the Kit broadcast, transcribed verbatim except
 * for three things. The line pointing at the entries and worksheet "below" is
 * dropped, because on the platform they are listed on the page rather than
 * under the digest. The Video Masterclass heading is dropped for the same
 * reason: the embed sits directly above this, so a second reference to it with
 * no video under it reads as something failing to load. And the sign off goes,
 * because the page already prints his name after the digest.
 *
 * It is here rather than in digests.ts because that file is generated and the
 * next import would throw a hand edit away. If the week stops being marked
 * MISSING on the Notion page, the importer wins and this entry can go.
 */
export const extraDigests: Digest[] = [
  {
    week: 7,
    nodes: [
      { type: 'p', text: 'Your mind can be your greatest ally or your worst enemy.' },
      {
        type: 'p',
        text: 'This week, we’re tackling a skill that separates elite performers from the rest: the ability to see possibilities where others see only problems.',
      },
      { type: 'p', text: 'Not sunshine-and-rainbows optimism. Not naive positivity.' },
      {
        type: 'p',
        text: 'Realistic optimism. A balanced perspective that acknowledges reality while actively seeking opportunity.',
      },
      {
        type: 'p',
        text: 'It’s the final piece of your mental mastery toolkit, and possibly the most powerful.',
      },
      { type: 'h', text: 'This Week’s Focus' },
      {
        type: 'p',
        text: 'We’re exploring “The Stairway to Optimism” framework. This approach to realistic optimism will help you:',
      },
      {
        type: 'ul',
        items: [
          'Overcome negative bias and thought patterns',
          'Build solution-focused habits',
          'Develop resilience in the face of setbacks',
          'Maintain forward momentum during challenges',
          'Strike the crucial balance between hope and reality',
        ],
      },
      { type: 'h', text: 'Key Concepts' },
      { type: 'sub', text: 'The Optimism Edge' },
      {
        type: 'p',
        text: 'Research consistently shows that realistic optimists outperform both pessimists and blind optimists. They recover faster from setbacks, identify more creative solutions, and maintain higher performance during prolonged challenges.',
      },
      { type: 'sub', text: 'Explanatory Style' },
      {
        type: 'p',
        text: 'How you explain events to yourself shapes your future actions. Pessimists tend to view negative events as permanent, pervasive, and personal. Optimists see them as temporary, specific, and not entirely personal. This simple shift in explanatory style creates profound differences in resilience and action.',
      },
      { type: 'sub', text: 'Possibility Thinking' },
      {
        type: 'p',
        text: 'Where pessimists ask “What could go wrong?” and blind optimists ask “What will go right?”, realistic optimists ask “What could be possible?” This subtle distinction opens up a world of creative problem-solving and opportunity-spotting that others miss.',
      },
      { type: 'h', text: 'Implementation Guide' },
      {
        type: 'p',
        text: 'This week, you’ll practice moving from challenge to possibility using a simple, framing process:',
      },
      {
        type: 'ul',
        items: [
          'Define the Ideal: What’s the best realistic outcome? Be clear and specific.',
          'Identify the Obstacles: What could get in the way, internally or externally?',
          'Gather Resources: What skills, time, or support do you already have?',
          'Reframe the Story: Shift from “why this won’t work” to “how this could work”.',
          'Take Ownership: Pick one action you’ll take this week to move forward.',
        ],
      },
      { type: 'sub', text: 'Weekly Challenge' },
      {
        type: 'p',
        text: 'Choose a current challenge. Apply the five steps above and track your mindset shift.',
      },
      { type: 'sub', text: 'Reflection Questions' },
      {
        type: 'ul',
        items: [
          'What changed when you reframed the story?',
          'Which step felt most energising?',
          'How has your belief in the outcome shifted?',
        ],
      },
      { type: 'h', text: 'The Psychology in Practice' },
      {
        type: 'p',
        text: 'Our brains evolved with a negativity bias. We’re wired to spot threats and problems more readily than opportunities. This made perfect sense for survival but creates limitations in modern contexts.',
      },
      {
        type: 'p',
        text: 'Research in cognitive psychology reveals that our perception of possibilities quite literally shapes what we can see. In one study, participants were shown the same ambiguous images but given different priming beforehand. Those primed with possibility-focused language identified significantly more potential interpretations and solutions.',
      },
      {
        type: 'p',
        text: 'The good news? This balanced perspective can be trained. Through consistent practice in reframing situations and expanding your perception of what’s possible, you can rewire your default response patterns. It’s not about ignoring reality, but about seeing it more completely.',
      },
      { type: 'h', text: 'Connecting the Dots' },
      { type: 'p', text: 'This framework completes our mental mastery toolkit:' },
      {
        type: 'ul',
        items: [
          'Psychological flexibility gives you the ability to unhook from unhelpful thoughts',
          'Motivational awareness helps you create conditions for sustainable drive',
          'Realistic optimism provides the balanced perspective to see possibilities others miss',
        ],
      },
      {
        type: 'p',
        text: 'Together, these three elements form a powerful system for managing your inner world in service of your performance and wellbeing.',
      },
      { type: 'h', text: 'Looking Ahead' },
      {
        type: 'p',
        text: 'Next week marks the deload of Module 2 and our transition to Module 3: Nurture. We’ll consolidate your key takeaways on managing your inner world, and then turn the focus outward to optimise your environment for performance.',
      },
      { type: 'h', text: 'Remember' },
      {
        type: 'p',
        text: 'Optimism isn’t about positive thinking. It’s about complete thinking. It’s seeing not just what is and what could go wrong, but also what could be possible. In that broader perspective lies your edge.',
      },
      { type: 'p', text: 'Time to expand your view.' },
    ],
    quote: {
      lines: [
        'Pessimists may be right more often, but optimists succeed more often.',
        'The key is to see reality clearly while maintaining a firm belief in your capacity to influence it.',
      ],
    },
  },
]
