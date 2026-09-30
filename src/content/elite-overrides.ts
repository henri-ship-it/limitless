// Corrections on top of the parsed Elite journal.
//
// The parser reads a page by measuring the gap under each block, which
// works until it does not. Two things defeat it. Type converted to
// outlines is invisible to it, and every quotation printed over artwork
// is set that way, so those pages came through with the attribution as
// their only text or with nothing at all. And an instruction followed by
// a diagram leaves a gap the same size as room to write, so the framing
// sentence was handed a box to answer it in.
//
// Anything here wins over the parsed page. Reviewed against the printed
// PDFs entry by entry; the note on each one says what was wrong.

export type EliteOverride = {
  title?: string | null
  intro?: string[]
  prompts?: string[]
  outro?: string[]
  caption?: { lines: string[]; author?: string } | null
}

export const eliteOverrides: Record<number, EliteOverride> = {
  // The QR/plot instruction is treated as a writing prompt, but it is framing text above the behavioural-style radar chart; the only question with ruled space is the second one.
  1: { intro: ['Scan the QR code, digest your results, and plot them below:'], prompts: ['What does this reveal about how you operate?'] },
  // Quotation page: the third line of the quote (“WON’T GET YOU THERE”) was captured as the author; the page has no attribution.
  16: { caption: null },
  // Quotation page whose quote is drawn as outlined artwork, so only the attribution was extracted and it was stored as a caption line with no author.
  22: { caption: { lines: [], author: 'Adam Grant' } },
  // Huddle is a full writing exercise (heading plus three questions, each with ruled space) but was captured as a quotation caption, so the member gets no boxes.
  28: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // “From those selected…” is printed above the two value fields but was put in outro, and the side-by-side field labels VALUE ONE / VALUE TWO were merged into one prompt. The checklist question belongs to the printed value grid, not to a writing box.
  29: { intro: ['Identify the values that are important to you and fill you with a feeling of purpose. Consider the following questions:', 'Does this define me? Is this who I am at my best? Is this a filter that I use to make hard decisions?'], prompts: ['From those selected, condense your values down to the two that resonate most with you:', 'Value one:', 'Value two:'], outro: [] },
  // Quotation page drawn as outlined artwork: only “CARL JUNG” was extracted and stored as the caption text with no author.
  38: { caption: { lines: [], author: 'Carl Jung' } },
  // Heading “PURPOSE ISN’T FOUND, IT’S LIVED.” was not captured as the title; the VALUE THREE and GOAL fields were dropped entirely; and “Set a goal…” was put in outro although it is printed mid-page above the GOAL field.
  41: { title: 'Purpose Isn’t Found, It’s Lived', intro: ['Revisit your list of values from Entry 29 and select a third value that resonates with you:'], prompts: ['Value three:', 'Describe how this value might show up in your future actions?', 'Set a goal that aligns with your newly chosen value:', 'Goal:', 'What does that experience look like? And how might it play out?'], outro: [] },
  // Artwork-plus-aphorism page with nothing to fill in, but it was left completely empty instead of being captured as a caption (the text is outlined, so no blocks were extracted).
  44: { caption: null },
  // Huddle is a full writing exercise (heading plus three questions, each with ruled space) but was captured as a quotation caption, so the member gets no boxes.
  56: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // Artwork-plus-aphorism page left completely empty; the text is outlined so nothing was extracted and no caption was recorded.
  60: { caption: null },
  // Artwork-plus-aphorism page left completely empty; the text is outlined so nothing was extracted and no caption was recorded.
  66: { caption: null },
  // The page heading “REVIEW” was dropped, so the entry has no title.
  84: { title: 'Review' },
  // “Rate yourself on a scale of 1-10…” is printed above the three rated questions but was put in outro (wrong order), and the diagram caption “How to ‘win’ at self-talk:” was given a writing box although it only labels the artwork.
  85: { intro: ['How to ‘win’ at self-talk:', 'Rate yourself on a scale of 1-10 for each question (1 being low, 10 being high):'], prompts: ['1. How open and accepting are you towards your thoughts and emotions?', '2. How much do you try to push away difficult thoughts or avoid unwanted emotions?', '3. How much do you engage in behaviours aligned with your values and goals?'], outro: [] },
  // Quotation page (artwork plus quote, nothing to fill in) was split into an intro paragraph and a prompt, so the member is given a box against the last line of a quote.
  88: { intro: [], prompts: [], outro: [], caption: null },
  // The page heading “GOING FROM AWAY, TOWARDS.” was dropped, so the entry has no title.
  91: { title: 'Going from Away, Towards' },
  // Artwork-plus-aphorism page left completely empty; the text is set on a curve as outlined artwork so nothing was extracted and no caption was recorded.
  94: { caption: null },
  // The artwork label “REACTING” was dropped and its descriptive caption was made a prompt (a statement, not a question, given a writing box); the two side-by-side field labels were merged into one prompt.
  97: { intro: ['Identify a current challenging situation. Reflect on:', 'Reacting: acting ineffectively and unlike the sort of person you want to be.'], prompts: ['When you get hooked by your thoughts or feelings, how does that play out?', 'What might dominate your behaviour in self-defeating ways?', 'What are the long-term costs:', 'What are the short-term benefits:'], outro: [] },
  // Artwork-plus-aphorism page left completely empty; the text is outlined so nothing was extracted and no caption was recorded.
  100: { caption: null },
  // The artwork label “RESPONDING” was dropped and its descriptive caption was made a prompt (a statement, not a question, given a writing box); the two side-by-side field labels were merged into one prompt.
  103: { intro: ['Identify a current challenging situation. Reflect on:', 'Responding: acting effectively and like the sort of person you want to be.'], prompts: ['When you unhook yourself from your thoughts or feelings, how does that play out?', 'How might you focus on values and strengths to support unhooking?', 'What are the long-term benefits:', 'What are the short-term costs:'], outro: [] },
  // All three real questions (each with ruled writing space) were classified as intro, and the artwork circle label “DO WHAT MATTERS” became the only prompt, so the member gets one box against a diagram label and none against the questions.
  106: { intro: [], prompts: ['What am I resisting right now, and how can I make space for it?', 'What is hapenning right here, right now, that I can notice fully?', 'What small step can I take today that aligns with my values?'], outro: [] },
  // Title was title-cased into “C.h.o.i.c.e”; the page prints the acronym C.H.O.I.C.E.
  109: { title: 'C.H.O.I.C.E' },
  // Huddle is a full writing exercise (heading plus three questions, each with ruled space) but was captured as a quotation caption, so the member gets no boxes.
  112: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // The three percentage score fields printed under the QR instruction (CONTROL / COMPETENCE / CONNECTEDNESS) were dropped entirely, so there is nowhere to record the results the intro asks for. [unsure]
  113: { prompts: ['Control:', 'Competence:', 'Connectedness:', 'Does this reflect how you feel on a daily basis?', 'What’s one small way you could boost your lowest-scoring need this month?'] },
  // Artwork-plus-aphorism page left completely empty; the text is outlined so nothing was extracted and no caption was recorded.
  116: { caption: null },
  // Quotation page whose quote is drawn as outlined artwork, so only the attribution was extracted and it was stored as a caption line with no author.
  122: { caption: { lines: [], author: 'Michael Johnson' } },
  // Quotation page whose quote is drawn as outlined artwork, so only the attribution was extracted and it was stored as a caption line with no author. (The page really does print “CONTROL YOUR OWN YOUR DESTINY” — transcribed as set.) [unsure]
  128: { caption: { lines: [], author: 'Jack Welch' } },
  // The third field, “YOUR SENSE OF BELONGING:”, was dropped from prompts even though it has the same ruled writing space as the two above it.
  131: { prompts: ['The quality of the interaction:', 'How it affected your mood:', 'Your sense of belonging:', 'No forced cheer, just honest reflection on human connection. Add any notes below:'] },
  // Artwork-plus-aphorism page left completely empty; the text is outlined so nothing was extracted and no caption was recorded.
  134: { caption: null },
  // The three percentage score fields printed under the QR instruction (CONTROL / COMPETENCE / CONNECTEDNESS) were dropped entirely, so there is nowhere to record the results the intro asks for. [unsure]
  137: { prompts: ['Control:', 'Competence:', 'Connectedness:', 'Have you noticed any changes in your motivation drivers? (Refer back to Entry 113)', 'One key takeaway to remember going forward?'] },
  // Huddle is a full writing exercise (heading plus three questions, each with ruled space) but was captured as a quotation caption, so the member gets no boxes.
  140: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // Title “STAIRWAY TO OPTIMISM” was dropped; the slider label “SCORE” was made a prompt; and the instruction above the slider was put in outro although it is printed before it.
  141: { title: 'Stairway to Optimism', intro: [], prompts: ['Identify an ideal outcome you’re working towards:', 'What’s the best case scenario?', 'What are the potential obstacles?', 'Based on this, score the likelihood of your ideal outcome happening:'], outro: [] },
  // Quotation page whose quote is drawn as outlined artwork, so only the attribution was extracted and it was stored as a caption line with no author.
  144: { caption: { lines: [], author: 'Wayne Dyer' } },
  // Title “STAIRWAY TO OPTIMISM” was dropped; the third field “SUPPORT:” was dropped from prompts; the slider label “SCORE” was made a prompt; and the instruction above the slider was put in outro although it is printed before it.
  147: { title: 'Stairway to Optimism', intro: ['With the challenge from Entry 43 in mind, list your available resources:'], prompts: ['Skills:', 'Time:', 'Support:', 'Based on this, score the likelihood of your ideal outcome happening:'], outro: [] },
  // Title “STAIRWAY TO OPTIMISM” was dropped; the slider label “SCORE” was made a prompt; and the instruction above the slider was put in outro although it is printed before it.
  153: { title: 'Stairway to Optimism', intro: [], prompts: ['Create a detailed action plan for your challenge:', 'For each step, write down how you’ll take full responsibility:', 'Craft a positive, realistic narrative about your approach:', 'Based on this, score the likelihood of your ideal outcome happening:'], outro: [] },
  // Title “STAIRWAY TO OPTIMISM” was dropped; the step marker “4” was merged onto the end of the first prompt; the slider label “SCORE” was made a prompt; and the instruction above the slider was put in outro although it is printed before it.
  159: { title: 'Stairway to Optimism', intro: [], prompts: ['Recall a past success, what lessons can you apply to your challenge:', 'What strengths will you draw on?', 'Based on this, score the likelihood of your ideal outcome happening:'], outro: [] },
  // Quotation page whose quote is drawn as outlined artwork, so only the attribution was extracted and it was stored as a caption line with no author.
  162: { caption: { lines: [], author: 'James Clear' } },
  // The page heading “REVIEW” was dropped, so the entry has no title.
  168: { title: 'Review' },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  169: { intro: ['Today, have an open, vulnerable conversation with someone you trust. Share something that’s been on your mind recently.'], prompts: ['How did it feel to open up?', 'What response did you receive, and how did it impact you?', 'What new insights or perspectives did you gain from the conversation?'], outro: [] },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured).
  172: { caption: null },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  175: { intro: ['Think of a recent task that has been difficult to complete. Consider who or what could provide resources or support to assist you.'], prompts: ['What led you to select this resource or person?', 'What was your experience like when seeking and receiving assistance?', 'How did having this support influence your progress on the task?'], outro: [] },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured).
  178: { caption: null },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  181: { intro: ['Find an expert or experienced individual to advise you on a current challenge.'], prompts: ['What was the most valuable takeaway from their input?', 'How did their perspective shift your understanding of the situation?', 'How can you incorporate this type of support more frequently in the future?'], outro: [] },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Isaac Newton” was stored as the caption text with author null.
  184: { caption: { lines: [], author: 'Isaac Newton' } },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  187: { intro: ['Ask a trusted friend or mentor for honest, constructive feedback on a current goal or project.'], prompts: ['What surprised you about their feedback?', 'How did this input affect your self-awareness?', 'How can you leverage their feedback to strengthen your esteem?'], outro: [] },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured).
  190: { caption: null },
  // Four-weekly Huddle page: the title and its three questions (each with six ruled lines) were captured as a caption, so the member gets a quotation block instead of three answer boxes.
  196: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // Chart headings and axis labels (“IN FLOW:”, “OUT FLOW:”, “HIGH”, “LOW”) were split across intro, prompts and outro — “High” became a prompt and “Low” became the outro.
  221: { intro: ['Think of an experience where you felt completely in flow (engaged, focused) and one where you felt out of flow (disengaged, distracted). Plot your skill and challenge level below:'], prompts: ['In each experience, draw a line between skill and challenge. What do you notice?', 'What insights can you take moving forward?'], outro: [] },
  // Four-weekly Huddle page: the title and its three questions (each with six ruled lines) were captured as a caption, so the member gets a quotation block instead of three answer boxes.
  224: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Carl Jung” was stored as the caption text with author null.
  228: { caption: { lines: [], author: 'Carl Jung' } },
  // The two-column grid labels (“YOUR” / “THEIR”, “INITIAL THOUGHTS AND ACTIONS:”, “ASSUMPTIONS MADE:”) were scattered into intro, prompts and outro; only two of the page's items are real questions. The Your/Their grid cannot be represented by the schema and is dropped.
  231: { intro: ['Refer back to your challenge in Entry 225, analyse the contrast in:'], prompts: ['Based on that information, what conclusions can you make?', 'What future reminder can you give yourself to remain adaptable?'], outro: [] },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Henry David Thoreau” was stored as the caption text with author null.
  234: { caption: { lines: [], author: 'Henry David Thoreau' } },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Socrates” was stored as the caption text with author null.
  246: { caption: { lines: [], author: 'Socrates' } },
  // The printed heading “REVIEW” was dropped, so the module review entry has no title (the same happens on entries 84 and 168). [unsure]
  252: { title: 'Review' },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  253: { intro: ['Consider an event or situation and answer:'], prompts: ['Description: Describe what happened.', 'Feelings: What were you thinking and feeling?'], outro: [] },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  259: { intro: ['Using the same situation or event from Entry 253, answer:'], prompts: ['Evaluation: What was good and bad about the experience?', 'Analysis: Following further reflection and analysis, what else can you make of the situation?'], outro: [] },
  // The opening instruction is framing text — the space beneath it is taken up by a diagram, not ruled lines — but it was classified as a prompt, so the member is given an answer box against a statement that is not a question.
  265: { intro: ['Using the same situation or event from Entry 253, answer:'], prompts: ['Conclusion: What else could you have done?', 'Action plan: If the same situation occurred again, what would you do?'], outro: [] },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Peter Drucker” was stored as the caption text with author null.
  268: { caption: { lines: [], author: 'Peter Drucker' } },
  // The printed heading “MAKING THE SUBCONSCIOUS, CONSCIOUS.” was dropped entirely (title is null and it does not appear in intro), most likely because it ends in a full stop.
  271: { title: 'Making the Subconscious, Conscious' },
  // Four-weekly Huddle page: the title and its three questions (each with six ruled lines) were captured as a caption, so the member gets a quotation block instead of three answer boxes.
  280: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured). [unsure]
  290: { caption: null },
  // The caption text was force-lowercased after the first character, so every sentence after the first in the James Clear quote starts lowercase.
  296: { caption: { lines: ['The purpose of setting goals is to win the game. The purpose of building systems is to continue playing the game. True long-term thinking is goal-less thinking. It’s not about any single accomplishment. It is about the cycle of endless refinement and continuous improvement.', 'Ultimately, it is your commitment to the process that will determine your progress.'], author: 'James Clear' } },
  // Quotation page: the Austin Kleon line is drawn as diagram labels (“FORGET THE NOUN” / “DO THE VERB”) so only the attribution was captured, and it was stored as the caption text with author null. [unsure]
  299: { caption: { lines: [], author: 'Austin Kleon' } },
  // “In order to meet your destination, when do you need to hit your milestones?” is a real question with Milestone 1 / Milestone 2 fill-in fields under it, but it was classified as intro so the member gets no box for it.
  305: { intro: [], prompts: ['In order to meet your destination, when do you need to hit your milestones?', 'Are your daily systems helping you get there? If not, how can you make them? If yes, how can you ensure you stick to them?'], outro: [] },
  // Four-weekly Huddle page: the title and its three questions (each with six ruled lines) were captured as a caption, so the member gets a quotation block instead of three answer boxes.
  308: { title: 'Huddle', intro: [], prompts: ['What have you learnt over the last four weeks?', 'What impact has this had?', 'What do you need to continue to focus on?'], outro: [], caption: null },
  // The instruction is framing text for a 52-week shading grid, not a written answer, but it was classified as the page's only prompt.
  309: { intro: ['Anticipate the ebbs and flows of work and wellbeing over the coming year. Identify when to push forward and when to recharge by shading in the boxes:'], prompts: [], outro: [] },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Owen Eastwood” was stored as the caption text with author null.
  312: { caption: { lines: [], author: 'Owen Eastwood' } },
  // The weekday headers of the five-week calendar grid (“MON TUE WED THU FRI SAT” / “SUN”) were captured as intro paragraphs and one of them as a prompt; the page has no questions, only a grid.
  315: { intro: ['Build restoration into your monthly planning before you need it. Strategic recovery prevents fatigue and amplifies your next sprint.'], prompts: [], outro: [] },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured).
  318: { caption: null },
  // The three-block timeline form was scrambled: field labels landed in intro, prompts and outro out of order, “TIME: TO: MODE:” was merged as “Time: mode: to:” (wrong order), and only “Boundaries & reminders:” got answer boxes. The page has no questions, just three identical sets of form fields. [unsure]
  321: { intro: ['Create intentional transition rituals and outline clear boundaries to fully separate work intensity from personal restoration while maintaining excellence in both.', 'Daily timeline template'], prompts: ['Time: To: Mode:', 'Ritual & cue:', 'Boundaries & reminders:', 'Time: To: Mode:', 'Ritual & cue:', 'Boundaries & reminders:', 'Time: To: Mode:', 'Ritual & cue:', 'Boundaries & reminders:'], outro: [] },
  // Quotation page: the quote itself is set as outlined artwork so the parser never saw it, and the attribution “Jimmy Johnson” was stored as the caption text with author null.
  324: { caption: { lines: [], author: 'Jimmy Johnson' } },
  // All four real questions were mis-filed: each section heading was merged onto its question and dropped into intro or outro, while the paired field labels (“Implementation phases: deadline / event periods:”, “Expansion periods: complex challenges:”) became the only prompts. The four section headings cannot be represented by the schema and are dropped. [unsure]
  327: { intro: ['Different phases require different approaches - expand your range to thrive in any context.'], prompts: ['When might you need to be more forceful and results-oriented?', 'When might you need to be more analytical and systematic?', 'When might you need to focus on helping others and reflection?', 'When might you need to expand connections and seek input?'], outro: [] },
  // Artwork-plus-quote page with nothing to fill in: the caption is set as outlined type, so the entry parsed completely empty (no caption captured).
  330: { caption: null },
  // The printed heading “REVIEW” was dropped, so the module review entry has no title (the same happens on entries 84 and 168). [unsure]
  336: { title: 'Review' },
}

export function eliteOverrideFor(n: number): EliteOverride | undefined {
  return eliteOverrides[n]
}
