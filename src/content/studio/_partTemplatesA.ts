import type { StudioTemplate } from './types';

export const templatesA: StudioTemplate[] = [
  {
    id: '30-second-reel-script',
    name: '30-second Reel script',
    seoTitle: '30-second Reel script Template | teleprompter.wtf',
    seoDescription:
      'Fill in a timed 30-second Reel script with a hook, context, two steps and a close. See two finished examples, then open it in the teleprompter and record it.',
    h1: '30-second Reel script template',
    summary: 'One idea, two steps and a call to action, timed to fit a 30-second Reel.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this template when you have one useful idea and want to deliver it cleanly in a single take. It suits advice, quick how-tos and answers to questions you hear often.',
      'Thirty seconds is about 70 spoken words at a relaxed 140 words per minute. That is short enough to hold attention and long enough to give one step-by-step payoff, so resist adding a second topic.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 3,
        instruction: "name the viewer's problem or promise the payoff in one line.",
      },
      {
        label: 'Context',
        startSeconds: 3,
        endSeconds: 8,
        instruction: 'why it matters, in one sentence.',
      },
      {
        label: 'Value',
        startSeconds: 8,
        endSeconds: 24,
        instruction: 'one idea, two concrete steps.',
      },
      {
        label: 'Close',
        startSeconds: 24,
        endSeconds: 30,
        instruction: 'the result plus one call to action.',
      },
    ],
    body: `# Hook
If {your audience} keeps {common frustration}, try this.
# Context
Most people {common mistake}, and it costs them {cost}. [pause]
# Value
First, **{step one}**. It takes {time}.
Second, {step two}, so {benefit}. [smile]
# Close
Do this for a week and {result}. Follow for part two.`,
    examples: [
      {
        title: 'Desk-day shoulder relief',
        niche: 'fitness',
        body: `# Hook
If your shoulders ache after desk days, try this.
# Context
Most people stretch their chest and ignore their upper back, and it keeps the slouch coming back. [pause]
# Value
First, **squeeze your shoulder blades** together for five seconds. It takes thirty seconds in total.
Second, repeat it once every hour, so your back muscles learn to hold you up. [smile]
# Close
Do this for a week and your desk day feels lighter. Follow for part two.`,
      },
      {
        title: 'Faster dinner prep',
        niche: 'food',
        body: `# Hook
If dinner always takes longer than you planned, try this.
# Context
Most people start every recipe from zero, and it costs them an hour on a tired evening. [pause]
# Value
First, **cook a big pot of grains** on Sunday. It takes fifteen minutes and keeps all week.
Second, chop two onions at once and store them, so every meal starts half finished. [smile]
# Close
Do this for a week and weeknight cooking stops feeling like a chore. Follow for part two.`,
      },
    ],
    tips: [
      'Write the hook last. Once the value section is solid, you will know the sharpest promise to open with.',
      'Keep each step to one sentence. If a step needs two, it is probably two steps and the video is a different one.',
      'Say the numbers out loud in your rehearsal. If a line is hard to say, rewrite it so it is easy.',
      'Use [pause] before the value section so you land on the first step without rushing.',
      'End on one action only. Follow, save or comment, never all three.',
    ],
    faq: [
      {
        question: 'How many words is a 30-second Reel script?',
        answer:
          'About 70 spoken words at 140 words per minute. Anything from roughly 56 to 84 words fits comfortably, depending on how many pauses you take.',
      },
      {
        question: 'Can I change the beats?',
        answer:
          'Yes. The timings are a guide. If your hook takes four seconds, take the extra second from the context beat rather than the value.',
      },
      {
        question: 'What if my idea needs more than two steps?',
        answer:
          'Split it. Record the first two steps now and promise the rest in a part two. A tight short video usually beats a crowded one.',
      },
    ],
    related: {
      templates: ['3-tips-reel-script', 'myth-vs-fact-script'],
      hooksNiche: 'fitness',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: '3-tips-reel-script',
    name: '3 tips Reel',
    seoTitle: '3 tips Reel Template | teleprompter.wtf',
    seoDescription:
      'A 40-second script template for a 3 tips Reel: a hook, three one-line tips and a close. Copy the structure, see two filled examples and record it now.',
    h1: '3 tips Reel script template',
    summary: 'Three quick tips with a hook and a close, timed for a 40-second Reel.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 40,
    whenToUse: [
      'Use this when your topic naturally breaks into three separate, practical ideas. Lists are easy to follow, easy to save and easy to rehearse.',
      'Each tip gets about ten seconds, which is room for the tip itself and one reason it works. If a tip needs a longer explanation, give it its own video.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 4,
        instruction: 'promise the result of the three tips in one line.',
      },
      {
        label: 'Tip one',
        startSeconds: 4,
        endSeconds: 14,
        instruction: 'the easiest tip, stated first and backed by one detail.',
      },
      {
        label: 'Tip two',
        startSeconds: 14,
        endSeconds: 24,
        instruction: 'the tip that needs a short reason why it works.',
      },
      {
        label: 'Tip three',
        startSeconds: 24,
        endSeconds: 34,
        instruction: 'the strongest tip, with the fastest way to try it.',
      },
      {
        label: 'Close',
        startSeconds: 34,
        endSeconds: 40,
        instruction: 'ask viewers to save the video and pick one tip.',
      },
    ],
    body: `# Hook
Three ways to {result} without {pain}. [pause]
# Tip one
**{Tip one}.** {One line on how to do it.}
# Tip two
**{Tip two}.** {One line on why it works.}
# Tip three
**{Tip three}.** {The fastest way to try it.} [smile]
# Close
Save this for later, and tell me which tip you will try first.`,
    examples: [
      {
        title: 'Faster weekday dinners',
        niche: 'food',
        body: `# Hook
Three ways to make weekday dinners faster without buying anything new. [pause]
# Tip one
**Cook the grain on Sunday.** Rice or quinoa keeps for days in the fridge, so every dinner starts half done and you only need to heat it.
# Tip two
**Chop onions in bulk.** One cutting board session now saves ten minutes every night that week, and nobody cries twice.
# Tip three
**Keep one sauce ready.** A jar of peanut sauce or pesto turns plain vegetables into a real meal in minutes. [smile]
# Close
Save this for your next grocery run, and tell me which tip you will try first.`,
      },
      {
        title: 'Calmer video calls',
        niche: 'education',
        body: `# Hook
Three ways to sound calmer on a video call without any special gear. [pause]
# Tip one
**Slow down your first sentence.** Everything after it settles once your opening line comes out steady, so practice just that one.
# Tip two
**Look at the camera when you finish a point.** Glancing at the lens at the end of a thought feels like eye contact to everyone watching.
# Tip three
**Put a sticky note beside the lens.** One reminder word, like breathe, is enough to bring you back. [smile]
# Close
Save this before your next meeting, and tell me which tip you will try first.`,
      },
    ],
    tips: [
      'Order the tips from easiest to strongest. People stay for the last one if the first two were useful.',
      'Open each tip with a bold verb phrase you can say in three or four words, then support it with one detail.',
      'Keep the three tips parallel. If the first is an action, make the others actions too.',
      'Use the Close to ask for one thing. Saving the video fits a list best.',
      'Add [breathe] between tips if you tend to rush when you read numbers or lists.',
    ],
    faq: [
      {
        question: 'How long should a 3 tips Reel be?',
        answer:
          'Forty seconds works well. That is about 93 spoken words at 140 words per minute, which leaves around ten seconds for each tip plus a hook and close.',
      },
      {
        question: 'Do I have to say "tip one", "tip two" and "tip three"?',
        answer:
          'No. The labels are for your script sections. Out loud you can say "first", "next" and "last", or simply start each tip with a strong verb.',
      },
      {
        question: 'Should I put the best tip first?',
        answer:
          'Usually no. Start with an easy win to build trust, then give the strongest tip last so viewers have a reason to watch to the end.',
      },
    ],
    related: {
      templates: ['30-second-reel-script', 'top-5-list-script'],
      hooksNiche: 'food',
      recordPreset: 'tiktok',
    },
  },
  {
    id: 'myth-vs-fact-script',
    name: 'Myth vs fact',
    seoTitle: 'Myth vs fact Template | teleprompter.wtf',
    seoDescription:
      'Correct a common belief in 30 seconds with this myth vs fact video script template. Fill in the beats, read two examples and record it with your script.',
    h1: 'Myth vs fact video script template',
    summary: 'State a common myth, correct it clearly and give viewers one thing to try.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this when your audience believes something that is slightly wrong and you can correct it kindly. Myths work because they start from something viewers already think.',
      'Pick a myth you hear often in your own work, and make the fact specific. A vague correction sounds like an opinion, while a clear example sounds like help.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 3,
        instruction: 'tell viewers to stop believing one specific thing.',
      },
      {
        label: 'Myth',
        startSeconds: 3,
        endSeconds: 9,
        instruction: 'state the myth fairly and say why it sounds right.',
      },
      {
        label: 'Fact',
        startSeconds: 9,
        endSeconds: 20,
        instruction: 'give the correction in one bold line plus one example.',
      },
      {
        label: 'Try this',
        startSeconds: 20,
        endSeconds: 30,
        instruction: 'one small action, then a follow prompt.',
      },
    ],
    body: `# Hook
Stop believing this {myth topic} myth if you want {result}.
# Myth
Everyone says {popular claim}. It sounds right, but {why it falls short}. [pause]
# Fact
Here is what actually happens: **{the fact}**. {One concrete example.}
# Try this
Next time, {simple action}, and notice {what changes}. [smile] Follow for more {topic} myths.`,
    examples: [
      {
        title: 'The big raise money myth',
        niche: 'personal-finance',
        body: `# Hook
Stop believing this one money myth if you want to save more.
# Myth
Everyone says you need a big raise before you can start saving. It sounds logical, but it keeps you waiting. [pause]
# Fact
Here is what actually happens: **small amounts, started early, beat big amounts started late**. Ten dollars a week becomes a habit you barely notice.
# Try this
This week, move ten dollars the moment you get paid, and watch how normal it feels. [smile] Follow for more money myths.`,
      },
      {
        title: 'The close every app myth',
        niche: 'tech',
        body: `# Hook
Stop believing this phone battery myth if you want it to last.
# Myth
People say closing every app saves battery. It feels responsible, but your phone then has to load each one again. [pause]
# Fact
Here is what actually happens: **a paused app uses very little power**. Reopening a closed one often costs more than leaving it alone.
# Try this
Instead, lower your screen brightness and switch off background refresh for apps you rarely use. [smile] Follow for more phone myths.`,
      },
    ],
    tips: [
      'State the myth in the words your audience would use, not in the words of an expert.',
      'Keep the fact to one bold sentence. Add the example after it, never before.',
      'Be kind to the believer. "It sounds right, but" works better than "people are wrong".',
      'Check the fact before you record. A myth video with a mistake in it spreads the wrong thing twice.',
      'Pause after the myth. That quiet beat makes the correction land.',
    ],
    faq: [
      {
        question: 'Where do I find good myths?',
        answer:
          'Check your own comments, direct messages and customer questions. Any belief you have corrected more than twice is a ready-made myth video.',
      },
      {
        question: 'How many words should a 30-second myth vs fact script have?',
        answer:
          'Around 70 spoken words at 140 words per minute. The Fact beat is the longest, so keep the myth itself short.',
      },
      {
        question: 'Can I do a series from this template?',
        answer:
          'Yes. End each video with "Follow for more {topic} myths" and reuse the same sections. A repeated structure helps regular viewers follow along quickly.',
      },
    ],
    related: {
      templates: ['hot-take-script', 'faq-answer-script'],
      hooksNiche: 'personal-finance',
      recordPreset: 'youtube-shorts',
    },
  },
  {
    id: 'story-time-script',
    name: 'Story time',
    seoTitle: 'Story time Template | teleprompter.wtf',
    seoDescription:
      'Tell a personal story on camera in 60 seconds with this story time script template: hook, setup, turn, lesson and close. Two examples, ready to record.',
    h1: 'Story time script template',
    summary: 'A short personal story with a turning point and a lesson, timed for one minute.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 60,
    whenToUse: [
      'Use this when you want viewers to know you, not only your advice. A small honest story builds trust faster than a list of tips.',
      'It fits a mistake, a surprise or a moment that changed how you work. Choose something you can tell in one scene, and leave out the backstory.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 5,
        instruction: 'drop the viewer into the moment with one surprising line.',
      },
      {
        label: 'Setup',
        startSeconds: 5,
        endSeconds: 17,
        instruction: 'when, where and what you wanted, in three short sentences.',
      },
      {
        label: 'Turn',
        startSeconds: 17,
        endSeconds: 35,
        instruction: 'what went wrong or surprised you, and what you did next.',
      },
      {
        label: 'Lesson',
        startSeconds: 35,
        endSeconds: 52,
        instruction: 'the lesson in one bold sentence, then why it matters to the viewer.',
      },
      {
        label: 'Close',
        startSeconds: 52,
        endSeconds: 60,
        instruction: 'speak to the viewer in the same situation and invite their story.',
      },
    ],
    body: `# Hook
{Surprising first line that drops the viewer into the moment.}
# Setup
It was {when}, and I was {situation}. I wanted {goal}, so I {action}. [pause]
# Turn
Then {what went wrong or surprised you}. I {what you did next}, and {what happened}.
# Lesson
What I learned: **{lesson in one sentence}**. {Why it matters to the viewer.} [breathe]
# Close
If you have been {viewer's situation}, {one small action}. Tell me your story in the comments.`,
    examples: [
      {
        title: 'The bakery nobody knew about',
        niche: 'small-business',
        body: `# Hook
I almost closed my bakery six months after opening it.
# Setup
It was a rainy March, and I was staring at an empty display case at noon. I had borrowed money, quit my job, and baked every night. I told myself that good bread would sell itself. [pause]
# Turn
Then a neighbor walked in, bought one loaf, and asked why nobody knew we were there. I had no sign, no photos, and no website. That week I wrote our hours on the window and posted one video of the oven opening. Twelve people came the next morning.
# Lesson
What I learned: **great work still needs to be seen**. Quality gets you a second visit, but only visibility gets you the first. [breathe]
# Close
If you have been waiting for your work to speak for itself, show one small piece of it today. Tell me your story in the comments.`,
      },
      {
        title: 'Freezing in front of the class',
        niche: 'education',
        body: `# Hook
I once froze for ten full seconds in front of a classroom of strangers.
# Setup
It was my first week teaching evening classes, and I had a perfect lesson plan printed in a folder. I had practiced for days. I walked in, opened my mouth, and every word I had rehearsed disappeared. [pause]
# Turn
So I did the only thing I could think of. I laughed and said I had forgotten how to start. A student in the back answered, then just start with your name. Everyone relaxed, including me, and that class went better than any plan could have.
# Lesson
What I learned: **people want you to be real more than perfect**. The mistake you fear is often the moment they start to trust you. [breathe]
# Close
If a first time is making you nervous, say the honest thing out loud. Tell me your story in the comments.`,
      },
    ],
    tips: [
      'Tell one scene, not a biography. If you need more than three sentences of setup, cut the oldest detail.',
      'Put a real detail in the setup, like the weather, a sound or an object. Specifics make a story believable.',
      'Say the lesson plainly and only once. Do not repeat it in the close.',
      'Slow down at the turn. Add [pause] before the moment that changes everything.',
      'Read the story aloud once without the camera. Where you stumble, the sentence is too long.',
    ],
    faq: [
      {
        question: 'How long should a story time video be?',
        answer:
          'One minute is a good fit. At 140 words per minute that is about 140 spoken words, enough for a clear beginning, a turning point and a lesson.',
      },
      {
        question: 'Does the story have to be dramatic?',
        answer:
          'No. A small, honest moment works best, such as a mistake, an awkward day or a conversation that changed your mind.',
      },
      {
        question: 'What if I do not want to share something personal?',
        answer:
          'Keep the story about your work. Choose a moment with a customer, a project or a decision, and leave out anything you would not say to a stranger.',
      },
    ],
    related: {
      templates: ['behind-the-scenes-script', 'self-introduction-video-script'],
      hooksNiche: 'small-business',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'before-and-after-script',
    name: 'Before and after',
    seoTitle: 'Before and after Template | teleprompter.wtf',
    seoDescription:
      'Show a change in 30 seconds with this before and after video script template. Name the problem, the one change and the result, then record it in the app.',
    h1: 'Before and after script template',
    summary: 'Show where you started, the one thing that changed and how it looks now.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this when you have a visible transformation: a room, a routine, a result or a process that got simpler. The video works because viewers can compare the two states.',
      'Pair the script with footage of the before and the after. The voiceover only needs to name the problem, the single change and what is different now.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 3,
        instruction: 'name what you are about to show, before and after.',
      },
      {
        label: 'Before',
        startSeconds: 3,
        endSeconds: 10,
        instruction: 'describe the problem in concrete, visual terms.',
      },
      {
        label: 'Change',
        startSeconds: 10,
        endSeconds: 20,
        instruction: 'one change, with how long it took and what it cost in effort.',
      },
      {
        label: 'After',
        startSeconds: 20,
        endSeconds: 27,
        instruction: 'the result viewers can see or feel.',
      },
      {
        label: 'Close',
        startSeconds: 27,
        endSeconds: 30,
        instruction: 'offer the steps and ask for one action.',
      },
    ],
    body: `# Hook
Here is {thing} before and after {change}.
# Before
This is where I started: {the problem in concrete terms}. It {cost or feeling}. [pause]
# Change
Then I did one thing. **{The change}**. It took {time} and {cost or effort}.
# After
Now {the result you can see}. [smile]
# Close
Want the steps? {Call to action}.`,
    examples: [
      {
        title: 'A rental living room refresh',
        niche: 'real-estate',
        body: `# Hook
Here is a dark rental living room before and after one weekend.
# Before
This is where I started: gray walls, one bare bulb, and a sofa pushed against the window. It felt like a waiting room. [pause]
# Change
Then I did one thing. **I moved the sofa, added two lamps, and raised the curtains**. It took one Saturday.
# After
Now the room feels twice as tall, and friends stay for hours. [smile]
# Close
Want the shopping list? Follow for part two.`,
      },
      {
        title: 'A simpler morning skin routine',
        niche: 'beauty',
        body: `# Hook
Here is my morning routine before and after I simplified it.
# Before
This is where I started: eight products and twenty minutes, and my skin still felt irritated by lunch. [pause]
# Change
Then I did one thing. **I cut it down to a cleanser, a moisturizer and sunscreen**. It took one week to trust it.
# After
Now I am out the door in five minutes, and my skin feels calm all day. [smile]
# Close
Want my exact three? Follow for part two.`,
      },
    ],
    tips: [
      'Choose one change, not five. The format only works when the cause is easy to name.',
      'Describe the before with things the camera can show, like colors, clutter or a clock, not with feelings alone.',
      'Match your voiceover to your footage. Say "gray walls" while the gray walls are on screen.',
      'Keep your claims honest. Say what changed for you, not what will happen for everyone.',
      'Leave the steps for a follow-up video and use the Close to promise them.',
    ],
    faq: [
      {
        question: 'Do I need real before and after footage?',
        answer:
          'It helps a lot, but you can also tell it as a spoken contrast with a single shot of the result. Do not show footage you cannot honestly claim is yours.',
      },
      {
        question: 'How long should this video be?',
        answer:
          'Thirty seconds, or about 70 spoken words at 140 words per minute. The Change beat gets the most time because it holds the useful part.',
      },
      {
        question: 'Can I use it for services and not only objects?',
        answer:
          'Yes. A messy process turned into a simple one works as well as a room or a recipe. Keep the before concrete and the after measurable in time or steps.',
      },
    ],
    related: {
      templates: ['client-result-case-study-script', 'day-in-the-life-voiceover-script'],
      hooksNiche: 'beauty',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'day-in-the-life-voiceover-script',
    name: 'Day in the life voiceover',
    seoTitle: 'Day in the life voiceover Template | teleprompter.wtf',
    seoDescription:
      'Write a 45-second day in the life voiceover with a hook, morning, midday, evening and close. Includes b-roll notes and two examples to record from.',
    h1: 'Day in the life voiceover script template',
    summary: 'A three-scene voiceover for a day in your work, with b-roll notes built in.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 45,
    whenToUse: [
      'Use this when you film your day first and add the voiceover afterward. The script tells you what each stretch of footage should show and what to say over it.',
      'It is a good fit for work people are curious about: a trade, a studio, a classroom or a small shop. The goal is to show the real job, including the unglamorous parts.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 4,
        instruction: 'say who you are and what the video shows.',
      },
      {
        label: 'Morning',
        startSeconds: 4,
        endSeconds: 15,
        instruction: 'how the day starts, with one detail that shows your world.',
      },
      {
        label: 'Midday',
        startSeconds: 15,
        endSeconds: 27,
        instruction: 'the main work, plus the part nobody sees.',
      },
      {
        label: 'Evening',
        startSeconds: 27,
        endSeconds: 38,
        instruction: 'how the day ends and how you recharge.',
      },
      {
        label: 'Close',
        startSeconds: 38,
        endSeconds: 45,
        instruction: 'a real-day note and one prompt to follow or reply.',
      },
    ],
    body: `# Hook
A day in my life as {role}, in three quick scenes.
# Morning
[b-roll: {morning routine shot}]
I start at {time} with {ritual}. {One detail that shows your world.} [pause]
# Midday
[b-roll: {work shot}]
By midday I am {main task}. The part nobody sees is {hidden detail}.
# Evening
[b-roll: {wind down shot}]
I finish by {closing task}, then {how you recharge}. [breathe]
# Close
That is a real day, not a perfect one. Follow for the next one, or tell me what you do.`,
    examples: [
      {
        title: 'A flower shop owner',
        niche: 'small-business',
        body: `# Hook
A day in my life as a flower shop owner, in three quick scenes.
# Morning
[b-roll: buckets of stems at the market]
I start at five in the morning at the wholesale market, picking stems by smell and color. Everything I choose has to survive a week of customers. [pause]
# Midday
[b-roll: arranging a bouquet on the counter]
By noon I am building bouquets and answering messages at the same time. The part nobody sees is trimming a hundred stems so each one drinks properly.
# Evening
[b-roll: sweeping the shop floor]
I finish by sweeping up petals and writing tomorrow's list, then I walk home with whatever flowers did not sell. [breathe]
# Close
That is a real day, not a perfect one. Follow for the next one, or tell me what you do.`,
      },
      {
        title: 'A high school science teacher',
        niche: 'education',
        body: `# Hook
A day in my life as a high school science teacher, in three quick scenes.
# Morning
[b-roll: setting up a lab bench]
I arrive at seven to set up the lab before anyone walks in. If the equipment is ready, the first ten minutes belong to the students. [pause]
# Midday
[b-roll: students gathered around a table]
By lunch I have taught four classes and answered more questions than I can count. The part nobody sees is the marking I carry home in my bag.
# Evening
[b-roll: laptop at the kitchen table]
I finish by planning tomorrow's lesson at the kitchen table, then I take a walk to clear my head. [breathe]
# Close
That is a real day, not a perfect one. Follow for the next one, or tell me what you do.`,
      },
    ],
    tips: [
      'Film the scenes first, then write the voiceover to match. The footage tells you which details are worth saying.',
      'Use the [b-roll: ...] notes as a shot list. They are hidden on the prompter and do not count as spoken words.',
      'Include one unglamorous detail. It makes the rest of the day more believable.',
      'Speak in the present tense so the video feels like it is happening now.',
      'Record the voiceover in a quiet room, close to the microphone, and read at a steady pace.',
    ],
    faq: [
      {
        question: 'Do I speak to the camera or record a voiceover?',
        answer:
          'This script is written as a voiceover, so you can record the audio separately or read it live over your footage. Both work with the teleprompter.',
      },
      {
        question: 'How many words is a 45-second voiceover?',
        answer:
          'About 105 spoken words at 140 words per minute. Aim for roughly 85 to 125 and let the footage carry the rest.',
      },
      {
        question: 'Should I show a normal day or the best day?',
        answer:
          'Show a typical day. Viewers connect with honest routines, and a believable day is easier to repeat as a series.',
      },
    ],
    related: {
      templates: ['behind-the-scenes-script', 'story-time-script'],
      hooksNiche: 'education',
      recordPreset: 'tiktok',
    },
  },
  {
    id: 'product-demo-video-script',
    name: 'Product demo',
    seoTitle: 'Product demo Template | teleprompter.wtf',
    seoDescription:
      'Script a 60-second product demo video with a problem, three demo steps, proof and a call to action. Two filled examples, then record it with the prompter.',
    h1: 'Product demo video script template',
    summary:
      'A one-minute demo that opens on the problem, shows three steps and closes with proof.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 60,
    whenToUse: [
      'Use this when you sell or recommend something and want to show it in use. A short demo answers the question every viewer has: what does it actually do for me?',
      'It works for products, apps and services you can point to on screen. Keep the demo to three steps so viewers can repeat them from memory.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 6,
        instruction: 'name the problem the product solves and what it costs the viewer.',
      },
      {
        label: 'Problem',
        startSeconds: 6,
        endSeconds: 18,
        instruction: 'how most people handle it today, and why that fails.',
      },
      {
        label: 'Demo',
        startSeconds: 18,
        endSeconds: 46,
        instruction: 'three steps, each with the result the viewer sees right away.',
      },
      {
        label: 'Proof',
        startSeconds: 46,
        endSeconds: 54,
        instruction: 'one specific result you actually saw, stated honestly.',
      },
      {
        label: 'Close',
        startSeconds: 54,
        endSeconds: 60,
        instruction: 'who it fits, and one clear next step.',
      },
    ],
    body: `# Hook
If {problem} is eating your {time or money}, watch this.
# Problem
Most {audience} still {old way}, and it means {pain}. I used to do the same. [pause]
# Demo
[note: show the screen or product here]
Here is {product}. Step one: **{first action}**. You get {immediate result}.
Step two: {second action}. This is the part that saves {time or cost}.
Step three: {third action}, and you are done. [smile]
# Proof
Since I started using it, {specific result you actually saw}. [pause]
# Close
If this fits your {situation}, {call to action}. The link is in my bio.`,
    examples: [
      {
        title: 'A pocket battery pack',
        niche: 'tech',
        body: `# Hook
If a tangled bag of cables is costing you time every morning, watch this.
# Problem
Most people still carry a charger, a cable, and a battery pack separately, and something is always missing when the phone hits ten percent. I used to do the same. [pause]
# Demo
[note: hold the battery pack up to the lens]
Here is a pocket battery pack with the cable built into the side. Step one: **pull the cable out of its slot**. No hunting required.
Step two: plug in and press the small button. This is the part that saves the morning panic.
Step three: tuck the cable back in, and the whole thing slides into your pocket. [smile]
# Proof
For the last month it has lived in my jacket, and I have not once searched my bag for a cable. [pause]
# Close
If you are tired of carrying three things, try one that holds all of it. The link is in my bio.`,
      },
      {
        title: 'An online booking page',
        niche: 'small-business',
        body: `# Hook
If answering booking messages is eating your evenings, watch this.
# Problem
Most salon owners still book clients by text, and it means replying at ten at night while trying to rest. I used to do the same. [pause]
# Demo
[note: show the booking page on your phone]
Here is my online booking page. Step one: **open the link and pick a service**. Clients see only the times I have left open.
Step two: they choose a slot and add their name. This is the part that saves my evenings, because nobody has to ask me what is free.
Step three: I get a note on my phone, and that slot disappears for everyone else. [smile]
# Proof
Since I switched, my phone is quiet after dinner, and I have stopped double booking. [pause]
# Close
If this fits your business, set up a page this weekend. The link is in my bio.`,
      },
    ],
    tips: [
      'Lead with the problem, not the product. Viewers decide in seconds whether the problem is theirs.',
      'Show every step on screen while you say it. The demo should still make sense with the sound off.',
      'Use only results you have really seen yourself. Do not promise outcomes for other people.',
      'Say the name of the product once, in the Demo, and keep the rest of the script about the viewer.',
      'Add the link or the next step in the on-screen text as well as in the Close.',
    ],
    faq: [
      {
        question: 'How long should a product demo video be?',
        answer:
          'A minute is a good target for social video. That is about 140 spoken words at 140 words per minute, with most of the time spent on the demo.',
      },
      {
        question: 'Can I use this for a service instead of a product?',
        answer:
          'Yes. Show the service in use, such as a booking flow or a finished result, and keep the three steps to what the customer does.',
      },
      {
        question: 'Do I need to say the price?',
        answer:
          'Only if you are the seller and the price is current. If you are recommending something, point to the link so the price shown there is always right.',
      },
    ],
    related: {
      templates: ['ugc-ad-script', 'tutorial-how-to-script'],
      hooksNiche: 'tech',
      recordPreset: 'youtube-shorts',
    },
  },
];
