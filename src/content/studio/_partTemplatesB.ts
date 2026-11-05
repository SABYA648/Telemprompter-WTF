import type { StudioTemplate } from './types';

export const templatesB: StudioTemplate[] = [
  {
    id: 'ugc-ad-script',
    name: 'UGC ad with 3 hook variants',
    seoTitle: 'UGC ad with 3 hook variants Template | teleprompter.wtf',
    seoDescription:
      'A 30-second UGC ad script with three hook variants to test: problem, proof and curiosity. Fill in the blanks, open it in the teleprompter and record it.',
    h1: 'UGC ad script template with 3 hook variants',
    summary:
      'A 30-second product ad in the voice of a real customer, with three different openings to test.',
    format: 'ad',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this when a brand or your own shop needs a short ad that sounds like a person, not a catalog. It works for physical products, apps and services that you can show in under ten seconds.',
      'The three hook variants are the point. Record the same ad three times with a different first line, then see which opening holds attention before you spend anything on the rest of the video.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 3,
        instruction:
          'Pick one of three openings: the problem, the proof or the curiosity gap. Delete the other two.',
      },
      {
        label: 'Problem',
        startSeconds: 3,
        endSeconds: 9,
        instruction: 'Say what was annoying before, in your own words and in one or two lines.',
      },
      {
        label: 'Product',
        startSeconds: 9,
        endSeconds: 21,
        instruction:
          'Show and name the product. One feature that solves the problem, one detail that makes it believable.',
      },
      {
        label: 'Close',
        startSeconds: 21,
        endSeconds: 30,
        instruction: 'Give the next step and one reason to take it today.',
      },
    ],
    body: `# Hook
// Variant A, problem: Still dealing with {annoying problem}?
// Variant B, proof: I used {product} for {time}, and {honest result}.
// Variant C, curiosity: Nobody told me {product} could do this.
// Keep one variant, delete the others, and say it below.
{your chosen hook} [pause]
# Problem
I used to {old workaround}, and it always {what went wrong}.
# Product
Then I tried **{product}**. It {main benefit} in {time or effort}. [smile]
What I like most is {specific detail}, so {why that matters}.
# Close
{Next step} with the link below. {Reason to do it now}.`,
    examples: [
      {
        title: 'Sunscreen stick, proof hook',
        niche: 'beauty',
        body: `# Hook
I used to skip sunscreen because it left my face grey. [pause]
# Problem
Every stick I tried was either greasy or chalky.
# Product
Then I found this clear sunscreen stick. **One swipe** across the cheeks and nose, rub it in with your fingers, done. [smile] It sits under makeup, and it fits in a pocket, so I actually reapply at lunch.
# Close
The link is in my bio. Try it for a week and tell me what you think.`,
      },
      {
        title: 'Resistance bands, problem hook',
        niche: 'fitness',
        body: `# Hook
Still waking up with a stiff neck from your laptop? [pause]
# Problem
I work at a screen all day, and by Thursday my shoulders feel like rocks.
# Product
These bands live in my desk drawer. **Ten slow pulls** between meetings, elbows back, nothing to set up. [smile] The handles are soft, and the tension levels are labeled, so I could start light.
# Close
They are linked below. Start with the lightest band and see how your shoulders feel by Friday.`,
      },
    ],
    tips: [
      'Record all three hooks back to back with the rest of the script unchanged, so the opening is the only difference between versions.',
      'Say the product name once, clearly, and show it in your hand while you say it.',
      'Keep claims to what you actually experienced. "It worked for me" is more believable than a promise.',
      'Film the hook last if you can. Your energy is usually best after you have already said the rest once.',
      'Cut every pause longer than a breath. Ads that sound like a friend still move quickly.',
    ],
    faq: [
      {
        question: 'How do I use the three hook variants?',
        answer:
          'Keep one variant per version. Record the full ad once for each hook, label the files clearly and post or send them to the brand so the opening can be compared.',
      },
      {
        question: 'Do I need to show my face?',
        answer:
          'No. You can read the script while holding the product, filming your hands or showing the screen. The words still sit right under the lens when you use the front camera.',
      },
      {
        question: 'How long should a UGC ad be?',
        answer:
          'This template targets 30 seconds, which is about 70 words at a relaxed pace. Check the brief from the brand first, because some ask for 15 or 45 seconds.',
      },
    ],
    related: {
      templates: ['product-demo-video-script', 'before-and-after-script'],
      hooksNiche: 'beauty',
      recordPreset: 'tiktok',
    },
  },
  {
    id: 'self-introduction-video-script',
    name: 'Self-introduction',
    seoTitle: 'Self-introduction Template | teleprompter.wtf',
    seoDescription:
      'A 45-second self-introduction video script: your name, who you help, why you care and what to expect. Fill it in and record it with the teleprompter.',
    h1: 'Self-introduction video script template',
    summary: 'A 45-second introduction that tells new viewers who you are and why to stay.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 45,
    whenToUse: [
      'Use it for a pinned video on a new profile, a welcome clip on a portfolio or a short hello to a client or a new team. It answers the three questions every viewer has: who is this, is it for me, and what happens next.',
      'It also makes a good first recording. The script is short, personal and easy to redo until it feels like you.',
    ],
    beats: [
      {
        label: 'Hello',
        startSeconds: 0,
        endSeconds: 5,
        instruction: 'Your name, what you do and a friendly opener in one line.',
      },
      {
        label: 'Work',
        startSeconds: 5,
        endSeconds: 17,
        instruction: 'Who you help and the main thing you help them do. Be specific.',
      },
      {
        label: 'Why',
        startSeconds: 17,
        endSeconds: 32,
        instruction: 'The short reason you care. One moment or lesson, not a life story.',
      },
      {
        label: 'Expect',
        startSeconds: 32,
        endSeconds: 41,
        instruction: 'Tell viewers what you will post or do, and how often.',
      },
      {
        label: 'Close',
        startSeconds: 41,
        endSeconds: 45,
        instruction: 'One call to action, such as follow, reply or book a call.',
      },
    ],
    body: `# Hello
Hi, I am {name}, and I {what you do}. [smile]
# Work
I help {who you help} {main outcome}, without {thing they dread}.
# Why
I started because {short reason}. [pause]
What I learned is **{one lesson}**, and it changed {what it changed}.
# Expect
Here you will get {what to expect}, every {schedule}.
# Close
If that sounds useful, {call to action}.`,
    examples: [
      {
        title: 'Personal trainer',
        niche: 'fitness',
        body: `# Hello
Hi, I am Maya, and I coach beginners in strength training. [smile]
# Work
I help busy people build a simple routine they can finish in thirty minutes, without needing a gym full of equipment or a perfect schedule.
# Why
I started because I quit three different programs in my twenties, and I thought I was the problem. [pause] What I learned is **the plan has to fit your week**, and once I fixed that, I stopped skipping workouts.
# Expect
Here you will get short routines, form tips and honest answers, every Monday and Thursday.
# Close
If that sounds useful, follow along and tell me what you want to learn first.`,
      },
      {
        title: 'Freelance designer',
        niche: 'small-business',
        body: `# Hello
Hi, I am Tom, a brand designer for small shops. [smile]
# Work
I help bakeries, florists and local studios get a logo and a look that customers remember, without a huge agency bill or a three month wait.
# Why
I started after my cousin spent a year on a menu nobody could read. [pause] What I learned is **clear beats clever**, and a simple brand wins more regulars than a fancy one.
# Expect
You will see before and after projects, quick design fixes and the occasional mistake of mine, every week.
# Close
If you run a small shop, send me a message and I will take a look.`,
      },
    ],
    tips: [
      'Write the name line last and say it slowly. Viewers remember the first thing they hear and rarely rewind.',
      'Replace any job title with what you actually do for someone. "I help parents plan school lunches" beats "content strategist".',
      'Keep the Why section to one moment. If it needs a second story, save it for another video.',
      'Look at the lens on the first and last lines. You can glance down in the middle.',
      'Pin the video and re-record it every few months as your focus changes.',
    ],
    faq: [
      {
        question: 'How long should a self-introduction video be?',
        answer:
          'This template targets 45 seconds, roughly 105 words at a conversational pace. That is long enough to say something real and short enough to watch to the end.',
      },
      {
        question: 'Should I talk about my credentials?',
        answer:
          'Mention one that matters to your viewer, usually inside the Work or Why section. A long list slows the video and makes it sound like a resume.',
      },
      {
        question: 'Can I use it for LinkedIn?',
        answer:
          'Yes. Swap the casual lines for your own voice, keep the structure and record it in the 9:16 or 16:9 format that you prefer.',
      },
    ],
    related: {
      templates: ['30-second-reel-script', 'behind-the-scenes-script'],
      hooksNiche: 'small-business',
      recordPreset: 'linkedin-video',
    },
  },
  {
    id: 'youtube-intro-script',
    name: 'YouTube intro (first 30 seconds)',
    seoTitle: 'YouTube intro (first 30 seconds) Template | teleprompter.wtf',
    seoDescription:
      'A script for the first 30 seconds of a YouTube video: hook, promise, proof and roadmap. Fill in the blanks and record it in 16:9 with the teleprompter.',
    h1: 'YouTube intro script template for the first 30 seconds',
    summary: 'A tight 30-second opening that earns the next five minutes of watch time.',
    format: 'youtube',
    aspect: '16:9',
    targetSeconds: 30,
    whenToUse: [
      'Use it at the start of any tutorial, review or explainer where viewers need a reason to stay. The opening moments decide whether someone keeps watching, so every line has a job.',
      'It is built for landscape video, where you can speak at a calm pace and leave room for a title card or a b-roll shot after the last line.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 5,
        instruction: 'Open with the problem or the payoff. No greeting, no channel name yet.',
      },
      {
        label: 'Promise',
        startSeconds: 5,
        endSeconds: 12,
        instruction: 'Say exactly what the viewer will be able to do by the end.',
      },
      {
        label: 'Proof',
        startSeconds: 12,
        endSeconds: 20,
        instruction: 'One honest reason to trust you: what you tested, built or did.',
      },
      {
        label: 'Roadmap',
        startSeconds: 20,
        endSeconds: 27,
        instruction: 'Name the steps in order so the viewer knows where this is going.',
      },
      {
        label: 'Bridge',
        startSeconds: 27,
        endSeconds: 30,
        instruction: 'A short line that moves into the first section.',
      },
    ],
    body: `# Hook
{Problem or payoff in one line}. [pause]
# Promise
By the end of this video, you will know how to {specific outcome}.
# Proof
I {what you tested or built}, so I can show you what worked and what did not.
# Roadmap
First, {step one}. Then {step two}, and finally {step three}. [smile]
# Bridge
Let us start with {first topic}.`,
    examples: [
      {
        title: 'Budget microphone test',
        niche: 'tech',
        body: `# Hook
Your phone mic is not the reason your audio sounds bad. [pause]
# Promise
By the end of this video, you will know how to get clear voice recordings with a mic that costs less than lunch.
# Proof
I tested six small microphones in the same room, so I can show you what worked and what did not.
# Roadmap
First, the placement trick. Then the settings to change, and finally which mic is worth buying. [smile]
# Bridge
Let us start with placement.`,
      },
      {
        title: 'Sourdough for beginners',
        niche: 'food',
        body: `# Hook
Your sourdough is flat because of one thing, and it is not the flour. [pause]
# Promise
By the end of this video, you will know how to read your starter and bake a loaf that actually rises.
# Proof
I baked forty loaves in my small kitchen, so I can show you what worked and what did not.
# Roadmap
First, the starter test. Then the folding schedule, and finally how to tell when the loaf is done. [smile]
# Bridge
Let us start with the starter.`,
      },
    ],
    tips: [
      'Cut your channel intro animation or move it after this script. Viewers should hear a reason to stay before they see a logo.',
      'Say the promise as an action the viewer can take, not as a topic.',
      'Rehearse once and trim any word that does not move the video forward.',
      'Look at the lens for the Hook and the Promise. A steady gaze here builds trust quickly.',
      'If you have a number, such as how many items you tested, say it plainly and only if it is true.',
    ],
    faq: [
      {
        question: 'How long should a YouTube intro be?',
        answer:
          'Thirty seconds is a good ceiling for most videos. This template runs about 70 words at a conversational pace, so you can read it once and move on to the content.',
      },
      {
        question: 'Should I say my name in the intro?',
        answer:
          'Usually not in the first lines. Put your name later in the video or in the end screen, so the first seconds go to the viewer problem.',
      },
      {
        question: 'Can I use it for Shorts?',
        answer:
          'The structure works, but a Short needs a shorter version. Keep the Hook and the Promise and drop the Roadmap.',
      },
    ],
    related: {
      templates: ['youtube-video-script-outline', 'tutorial-how-to-script'],
      hooksNiche: 'tech',
      recordPreset: 'youtube',
    },
  },
  {
    id: 'tutorial-how-to-script',
    name: 'Tutorial',
    seoTitle: 'Tutorial Template | teleprompter.wtf',
    seoDescription:
      'A 60-second how-to video script with the result up front, setup, three clear steps and a quick check. Fill it in and record it with the teleprompter.',
    h1: 'Tutorial video script template',
    summary: 'A 60-second how-to that shows the result first, then walks through three steps.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 60,
    whenToUse: [
      'Use it when you can teach one thing in a minute: a recipe tweak, a spreadsheet trick, a phone setting, a stretch, a design shortcut. If it needs more than three steps, split it into a series.',
      'It works well with screen recordings or hands-on footage, because the spoken lines stay short and let the picture carry the detail.',
    ],
    beats: [
      {
        label: 'Result',
        startSeconds: 0,
        endSeconds: 6,
        instruction: 'Show or describe the finished result, and say how long this takes.',
      },
      {
        label: 'Setup',
        startSeconds: 6,
        endSeconds: 15,
        instruction: 'What the viewer needs before starting. Keep it to one breath.',
      },
      {
        label: 'Steps',
        startSeconds: 15,
        endSeconds: 45,
        instruction: 'Three steps in order, each one action and one reason.',
      },
      {
        label: 'Check',
        startSeconds: 45,
        endSeconds: 54,
        instruction: 'How to tell it worked, plus the most common mistake.',
      },
      {
        label: 'Close',
        startSeconds: 54,
        endSeconds: 60,
        instruction: 'Invite them to save it or ask a question.',
      },
    ],
    body: `# Result
Here is how to {result} in {time}. [pause]
# Setup
You only need {thing one} and {thing two}. Open {where to start}.
# Steps
Step one, **{action one}**, so that {reason one}.
Step two, {action two}. This is where most people {common slip}. [pause]
Step three, {action three}, and {what happens next}.
# Check
You will know it worked when {sign of success}. [smile]
If it does not, check that {most common mistake}.
# Close
Save this for later, and tell me what you want to learn next.`,
    examples: [
      {
        title: 'Quick phone microphone setup',
        niche: 'tech',
        body: `# Result
Here is how to record clear voice notes on your phone in two minutes. [pause]
# Setup
You only need your phone and a quiet corner. Open the camera app and switch to the front lens.
# Steps
Step one, **hold the phone a hand's width from your mouth**, so your voice stays steady and louder than the room.
Step two, turn off the fan or close the window. This is where most people lose clarity, because the phone hears the noise as much as your voice. [pause]
Step three, say a test line, play it back with headphones, and move the phone if your voice sounds thin.
# Check
You will know it worked when you can hear every word without turning the volume up. [smile]
If it does not, check that nothing is covering the bottom of the phone, where the microphone sits.
# Close
Save this for your next recording, and tell me what you want to learn next.`,
      },
      {
        title: 'Spreadsheet total in three steps',
        niche: 'education',
        body: `# Result
Here is how to total a column in a spreadsheet in under a minute. [pause]
# Setup
You only need a column of numbers and a blank cell below it. Open your sheet and click that empty cell.
# Steps
Step one, **type an equals sign, then the word sum, then an open bracket**, so the sheet knows you want a total.
Step two, drag across the numbers you want to add. This is where most people miss a row, so check that the highlight starts at the top. [pause]
Step three, close the bracket, press enter, and the total appears.
# Check
You will know it worked when the number matches a quick count on your phone calculator. [smile]
If it does not, check that no number is stored as text. Those usually sit on the left side of the cell.
# Close
Save this for later, and tell me what you want to learn next.`,
      },
    ],
    tips: [
      'Teach one outcome. If you catch yourself saying "also", move that part into a second video.',
      'Say the action first and the reason second. Viewers can act on the action even if they miss the reason.',
      'Put the biggest mistake in the Steps section where it happens, and the most common check in the Check section.',
      'Use [pause] before step two or three so your on-screen action has time to finish.',
      'Do a dry run with the exact tools on screen. Any step that surprises you will surprise viewers too.',
    ],
    faq: [
      {
        question: 'How many steps should a one-minute tutorial have?',
        answer:
          'Three is a good number. Each step gets about ten seconds, which leaves room for the picture to show what you say.',
      },
      {
        question: 'Do I read the script or ad-lib the steps?',
        answer:
          'Read the structure and ad-lib the small details. The script keeps the order and timing steady, and your own words keep it natural.',
      },
      {
        question: 'Can I use this for a screen recording?',
        answer:
          'Yes. Record the voiceover with the teleprompter and film the screen separately, or read the script while you operate the screen.',
      },
    ],
    related: {
      templates: ['3-tips-reel-script', 'faq-answer-script'],
      hooksNiche: 'tech',
      recordPreset: 'youtube-shorts',
    },
  },
  {
    id: 'top-5-list-script',
    name: 'Top 5 list',
    seoTitle: 'Top 5 list Template | teleprompter.wtf',
    seoDescription:
      'A 45-second top 5 list video script that counts down from five to one with a short reason for each pick. Fill in the blanks and record it with the teleprompter.',
    h1: 'Top 5 list video script template',
    summary:
      'A 45-second countdown with a quick reason for each pick and the best one saved for last.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 45,
    whenToUse: [
      'Use it for recommendations, favorites and ranked advice: tools, books, snacks, exercises, places to visit. A countdown gives viewers a reason to stay until the final item.',
      'It suits a quick visual per item, such as a product shot, a screenshot or a text overlay with the number, so the spoken line only has to give the reason.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 5,
        instruction: 'Say what the list is for and tease the last item.',
      },
      {
        label: 'Five',
        startSeconds: 5,
        endSeconds: 13,
        instruction: 'Item five: its name and one reason it made the list.',
      },
      {
        label: 'Four',
        startSeconds: 13,
        endSeconds: 21,
        instruction: 'Item four: its name and one reason.',
      },
      {
        label: 'Three',
        startSeconds: 21,
        endSeconds: 29,
        instruction: 'Item three: its name and one reason.',
      },
      {
        label: 'Two',
        startSeconds: 29,
        endSeconds: 37,
        instruction: 'Item two: its name and one reason.',
      },
      {
        label: 'One',
        startSeconds: 37,
        endSeconds: 42,
        instruction: 'Item one: the best pick and why it wins.',
      },
      {
        label: 'Close',
        startSeconds: 42,
        endSeconds: 45,
        instruction: 'Ask which item they would pick or what is missing.',
      },
    ],
    body: `# Hook
My top five {things} for {goal}, and number one surprised me. [pause]
# Five
Number five, **{item five}**, because {reason}.
# Four
Number four, {item four}. {Reason}.
# Three
Number three, {item three}, which {reason}.
# Two
Number two, {item two}. {Reason}. [smile]
# One
And number one, **{item one}**. {Why it wins}.
# Close
What would you add? Tell me in the comments.`,
    examples: [
      {
        title: 'Desk snacks',
        niche: 'food',
        body: `# Hook
My top five desk snacks for a long afternoon, and number one is not what you think. [pause]
# Five
Number five, **roasted chickpeas**, because they crunch like chips and keep your hands busy.
# Four
Number four, apple slices with peanut butter. It is sweet, salty and takes two minutes to make.
# Three
Number three, plain yogurt with fruit, which keeps well in a small fridge at the office.
# Two
Number two, a handful of almonds. Easy to carry, and they do not melt in a bag. [smile]
# One
And number one, **a boiled egg with salt**. It is filling, cheap and made the night before.
# Close
What would you add? Tell me in the comments.`,
      },
      {
        title: 'Free study tools',
        niche: 'education',
        body: `# Hook
My top five free tools for studying, and number one costs nothing but ten minutes. [pause]
# Five
Number five, **a timer**, because short focused sessions beat long distracted ones.
# Four
Number four, a shared notes document. Group projects stop being a guessing game.
# Three
Number three, flashcards on your phone, which turn waiting in line into practice.
# Two
Number two, the library website. It gives you articles and books with no cost to you. [smile]
# One
And number one, **explaining it out loud**. If you cannot teach it, you do not know it yet.
# Close
What would you add? Tell me in the comments.`,
      },
    ],
    tips: [
      'Rank by your real opinion. Viewers can tell when the order is arbitrary.',
      'Keep every item to a name and one reason. Add the detail in the caption or a pinned comment.',
      'Save the best pick for last and tease it in the Hook so there is something to wait for.',
      'Put the number on screen as text while you say it, so scrolling viewers can follow without sound.',
      'Five items in forty-five seconds is quick. If you run long, cut the weakest item and make it a top four.',
    ],
    faq: [
      {
        question: 'Should I count down or count up?',
        answer:
          'Count down. The best item arrives last, which gives people a reason to watch to the end.',
      },
      {
        question: 'How long should each item be?',
        answer:
          'About eight seconds, which is a name plus one reason. This template targets 45 seconds, roughly 105 words in total.',
      },
      {
        question: 'Can I make it a top 3 or a top 10?',
        answer:
          'Yes. A top 3 can run 30 seconds, and a top 10 works better as a longer YouTube video with a short summary on the Short.',
      },
    ],
    related: {
      templates: ['3-tips-reel-script', 'hot-take-script'],
      hooksNiche: 'food',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'hot-take-script',
    name: 'Hot take',
    seoTitle: 'Hot take Template | teleprompter.wtf',
    seoDescription:
      'A 30-second hot take video script: a bold claim, one clear reason, a fair concession and a question to start the debate. Fill it in and record it now.',
    h1: 'Hot take video script template',
    summary:
      'A 30-second opinion video with a bold claim, one reason and a fair nod to the other side.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use it when you hold a clear opinion that goes against common advice in your field. A short, confident take earns replies, and replies are how short videos travel.',
      'It works best when the claim is about a practice or a belief, not about a person. Argue with the idea and be generous to the people who hold it.',
    ],
    beats: [
      {
        label: 'Take',
        startSeconds: 0,
        endSeconds: 4,
        instruction: 'State the opinion in one direct sentence. No warm-up.',
      },
      {
        label: 'Reason',
        startSeconds: 4,
        endSeconds: 14,
        instruction: 'Your single best reason, with one concrete example.',
      },
      {
        label: 'Concession',
        startSeconds: 14,
        endSeconds: 22,
        instruction: 'Say when the opposite view is right. It makes you credible.',
      },
      {
        label: 'Close',
        startSeconds: 22,
        endSeconds: 30,
        instruction: 'Restate the take in new words and ask for a reply.',
      },
    ],
    body: `# Take
{Common belief} is overrated, and here is why. [pause]
# Reason
The problem is that {core reason}. I saw it when {specific example}.
# Concession
To be fair, **{when the other side is right}**. [breathe]
# Close
But for most {audience}, {restated take}. Do you agree? Tell me below.`,
    examples: [
      {
        title: 'Budgeting apps',
        niche: 'personal-finance',
        body: `# Take
Tracking every coin in a budgeting app is overrated, and here is why. [pause]
# Reason
The problem is that it turns money into homework, and people quit by February. I saw it when three friends stopped logging after two weeks and went back to guessing.
# Concession
To be fair, **tracking helps when you are paying off a debt on a tight timeline**. [breathe]
# Close
But for most people, one weekly check of your balance beats a daily log. Do you agree? Tell me below.`,
      },
      {
        title: 'Cardio first',
        niche: 'fitness',
        body: `# Take
Doing cardio before lifting is overrated, and here is why. [pause]
# Reason
The problem is that you start your heavy sets already tired, so your form slips. I saw it when my squats got sloppy on days I ran first.
# Concession
To be fair, **a short warm up on the bike is a smart start**. [breathe]
# Close
But for most lifters, strength work first and cardio after gives the better session. Do you agree? Tell me below.`,
      },
    ],
    tips: [
      'Argue with an idea, not a person or a brand. Disagreement stays friendly and replies stay useful.',
      'Give one reason. Three weak reasons sound defensive, and one strong reason sounds sure.',
      'Do not skip the Concession. It is what separates a take from a rant.',
      'Say the claim at a normal pace and drop your voice slightly on the last word. It sounds more certain.',
      'Reply to early comments with a real answer. The first hour of replies shapes the thread.',
    ],
    faq: [
      {
        question: 'Does a hot take have to be extreme?',
        answer:
          'No. It only has to be a clear position that some people would disagree with. A calm take with a good reason often performs better than a loud one.',
      },
      {
        question: 'How do I pick a topic?',
        answer:
          'Think about advice you give a client or friend that goes against what most articles say. That gap is usually your best hot take.',
      },
      {
        question: 'How long is the script?',
        answer:
          'It targets 30 seconds, about 70 words at a conversational pace, so it fits Reels, Shorts and TikTok without trimming.',
      },
    ],
    related: {
      templates: ['myth-vs-fact-script', 'top-5-list-script'],
      hooksNiche: 'personal-finance',
      recordPreset: 'tiktok',
    },
  },
];
