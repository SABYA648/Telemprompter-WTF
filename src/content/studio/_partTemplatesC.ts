import type { StudioTemplate } from './types';

export const templatesC: StudioTemplate[] = [
  {
    id: 'youtube-video-script-outline',
    name: 'YouTube video outline',
    seoTitle: 'YouTube video outline Template | teleprompter.wtf',
    seoDescription:
      'Plan a 10-minute YouTube video with a timed outline: hook, context, three chapters, recap and call to action. Two full examples. Record it now.',
    h1: 'YouTube video script outline',
    summary:
      'A seven-part outline for a 10-minute landscape video, from the first promise to the last call to action.',
    format: 'youtube',
    aspect: '16:9',
    targetSeconds: 600,
    whenToUse: [
      'Use this outline for tutorials, explainers, reviews and walkthroughs that run about ten minutes. It gives every minute a job, so the video moves forward instead of circling the same point.',
      'It is built for reading from a teleprompter. Each section has a word budget at a speaking pace of 140 words per minute, which means you can check the length before you press record.',
      'If your topic does not fill three chapters, shorten it. A tight seven-minute video beats a stretched ten-minute one.',
    ],
    beats: [
      {
        label: 'Hook and promise',
        startSeconds: 0,
        endSeconds: 30,
        instruction:
          'Open on the problem or the payoff, then promise exactly what the viewer will be able to do by the end.',
      },
      {
        label: 'Context',
        startSeconds: 30,
        endSeconds: 90,
        instruction:
          'Say who you are in one sentence, why this matters, and preview the chapters so the viewer knows the map.',
      },
      {
        label: 'Chapter one',
        startSeconds: 90,
        endSeconds: 210,
        instruction: 'Teach the first idea with one concrete example and one thing to try.',
      },
      {
        label: 'Chapter two',
        startSeconds: 210,
        endSeconds: 330,
        instruction: 'Teach the second idea. Start with a one-line bridge from chapter one.',
      },
      {
        label: 'Chapter three',
        startSeconds: 330,
        endSeconds: 450,
        instruction: 'Teach the third idea, then name the most common mistake in this area.',
      },
      {
        label: 'Recap',
        startSeconds: 450,
        endSeconds: 540,
        instruction:
          'Repeat the three ideas in one line each and give a first action for this week.',
      },
      {
        label: 'Call to action',
        startSeconds: 540,
        endSeconds: 600,
        instruction: 'Ask for one thing, comment or subscribe, and point to the next video.',
      },
    ],
    body: `# Hook and promise
// About 70 words. Lead with the problem or the surprising result.
{The problem or the surprising result}. [pause]
In this video, I will show you {number} ways to {promise}, and by the end you will {outcome}.
# Context
// About 140 words. Who you are, why it matters, and a map of what is coming.
Quick background: {who you are and why you can speak on this}. [pause]
Here is the idea in one line: {core idea}.
We will cover {chapter one topic}, {chapter two topic}, and {chapter three topic}. [breathe]
# Chapter one
// About 280 words. One idea, one example, one thing to try.
Let us start with **{chapter one topic}**. [pause]
{Explain the idea in plain words}.
Here is an example: {concrete example}.
Try this today: {one small action}. [smile]
# Chapter two
// About 280 words. Start with a bridge from chapter one.
That brings us to {chapter two topic}.
{Explain the idea in plain words}.
Here is an example: {concrete example}. [breathe]
The mistake I see most often is {common mistake}, so {how to avoid it}.
# Chapter three
// About 280 words. Finish the teaching and name the biggest trap.
The last piece is **{chapter three topic}**. [pause]
{Explain the idea in plain words}.
Here is an example: {concrete example}.
Watch out for {biggest trap}, because {reason}. [smile]
# Recap
// About 200 words. One line per idea, then a first action.
Let us put it together. [pause]
One, {idea one}. Two, {idea two}. Three, {idea three}.
If you do one thing this week, {first action}. [breathe]
# Call to action
// About 140 words. Ask for one thing and point to the next video.
If this helped, {one ask, like subscribe or comment}. Tell me {question for the comments}.
Next, watch {next video title}. It is on the screen now. [smile]`,
    examples: [
      {
        title: 'Better coffee at home, no new gear',
        niche: 'food',
        body: `# Hook and promise
Your coffee at home does not taste like the coffee at your favorite cafe, and you probably think the fix is an expensive machine. It is not. [pause]
In this video, I will show you the four small changes that fixed my home coffee, and none of them need new gear. By the end, you will brew a cup you actually look forward to. [smile]
# Context
Quick background. I have been making coffee at home for about six years, and for the first four of them, I made it badly. I used old beans from the back of the cupboard, I guessed the water, and I wondered why every cup tasted either bitter or sour. [pause]
Then I started changing one thing at a time and tasting the difference. That is the whole method. One change, one cup, one note.
Here is the setup I used. A simple pour over cone, a kettle, a cheap scale, and a grinder. If you only have a French press or a drip machine, stay with me, because every step works for those too. [breathe]
Here are the four changes, in the order that made the biggest difference: fresh beans, the right grind, the right ratio, and the water temperature.
# Chapter one
Let us start with the beans, because nothing else you do can rescue stale coffee. [pause]
Look at the bag. Good roasters print a roast date, not just a best before date. Try to buy beans within a few weeks of that date, and use them within about a month after opening. If a bag has no roast date at all, that tells you something already.
Next, how you store them. Keep the beans in an airtight container, away from the stove, the window, and the fridge. Heat, light, and moisture all dull the flavor. I use a plain jar with a lid, kept in a dark cupboard, and it works just as well as the fancy canisters.
Third, buy whole beans if you can. Ground coffee loses its aroma quickly, because so much more surface is exposed to air. Whole beans protect the flavor until the moment you grind them. [breathe]
A small practical tip: buy smaller bags more often. A bag you finish in two weeks will taste better than a huge bag you are still fighting through in month two. [pause]
Here is a test you can try today. Make one cup with your old beans, then one cup with fresh ones, using exactly the same method. Taste them side by side. Most people can tell the difference on the first sip, and that is the moment this hobby gets fun. [smile]
# Chapter two
Change number two is the grind. This is where most home coffee goes wrong, and it is easy to fix once you know what to look for. [pause]
The rule is simple. The longer the water touches the coffee, the coarser the grind should be. A French press steeps for several minutes, so it wants a coarse grind, like rough sea salt. A pour over takes about three minutes, so go medium, closer to table salt. Espresso is fast and pressurized, so it wants a very fine grind.
Now here is how to use that rule. If your coffee tastes sour, thin, or sharp, the water ran through too fast, so grind finer. If it tastes bitter, dry, or harsh, the water sat too long, so grind coarser. [breathe]
Change the grind setting by one step at a time and make a note of it. I keep a small card next to my grinder, and I write the setting and one word about the cup. After a week, the card shows the sweet spot for that bag of beans.
A word about the grinder itself. If you are using pre-ground coffee, you cannot do this step, and that is the best reason to upgrade. A basic hand grinder with burrs gives a much more even grind than a blade grinder, because burrs crush the beans to a consistent size while blades chop them into dust and boulders. Uneven pieces extract unevenly, and that is where bitter and sour show up in the same cup. [pause]
You do not need to spend a lot. You just need burrs. [smile]
# Chapter three
Changes three and four go together, because both are about the water. [pause]
First, the ratio. Guessing is the second most common mistake I see. A good starting point is one part coffee to sixteen parts water by weight. So for a mug of about three hundred milliliters, use around nineteen grams of coffee. If you do not own a scale, a basic kitchen scale works fine, and it will pay for itself in wasted coffee within a month.
If the cup is too strong for you, add more water or use less coffee. If it is weak, do the opposite. Change the ratio in small steps, and keep the grind the same while you do it. One change at a time, remember. [breathe]
Now the temperature. Boiling water can scorch coffee, especially lighter roasts. After the kettle clicks off, wait about thirty seconds before you pour. That alone takes the edge off. For darker roasts, you can pour a little sooner, because they extract more easily.
Wet the filter first with hot water, then dump that water out. This removes the papery taste and warms your brewer, so the temperature stays steady. [pause]
Then pour in slow circles. Start with a small amount of water to wet all the grounds, let it sit for thirty seconds, and then continue in gentle circles until you reach your target weight. Try to finish in about three minutes. If it finishes much faster or slower, go back to the grind. [smile]
# Recap
Let us put it all together. [pause]
First, fresh beans. Check the roast date, store them airtight and dark, and buy smaller bags more often.
Second, the grind. Coarser for long contact, finer for short contact. If it tastes sour, grind finer. If it tastes bitter, grind coarser.
Third, the ratio. Start with one to sixteen by weight, and adjust in small steps.
Fourth, the water. Let the kettle rest for half a minute, rinse your filter, and pour in slow circles for around three minutes. [breathe]
Here is how I would do it this week. On day one, just fix the beans. On day two, play with the grind. On day three, weigh your coffee. On day four, work on your pour. By the weekend, you will have changed all four, and you will know exactly what each one does.
The real secret is that you are not chasing a perfect recipe. You are learning to taste what is wrong and to know which dial to turn. That skill stays with you with any beans, any brewer, and any kitchen. [smile]
# Call to action
If this helped you, there are two things you can do. First, press the like button, because it tells me which videos to make more of. Second, tell me in the comments which of the four changes you are going to try first. I read every one, and I answer as many as I can. [pause]
If you want to go deeper, the next video is about choosing between a French press, a pour over, and an espresso machine for your kitchen and your budget. It is on the screen now, so take a look when you are ready.
Thanks for watching, and I will see you in the next one. [smile]`,
      },
      {
        title: 'Build your first budget in 30 minutes',
        niche: 'personal-finance',
        body: `# Hook and promise
Most people think a budget means giving up everything fun. I used to think that too, until I spent one evening building a budget that actually let me spend money on the things I like. [pause]
In this video, I will walk you through the exact thirty minute process, step by step. You do not need a finance degree, and you do not need to pay for an app. A free spreadsheet is plenty. [smile]
# Context
Before we start, a quick disclaimer. I am not a financial advisor, and this is general education, not personal advice. What I can share is what worked for me when I got started. [pause]
Here is the idea. A budget is not a punishment. It is a plan for your money, written before the month starts instead of explained after it ends. When you decide in advance, you stop feeling guilty about every coffee, because the coffee is already in the plan. [breathe]
You will need three things: your last two months of bank statements, a spreadsheet or a piece of paper, and thirty minutes with your phone on silent. Pour yourself something to drink.
We will do three steps. First, find your real numbers. Second, sort every expense into three buckets. Third, give every dollar a job and check in once a week. Let us go.
# Chapter one
Step one is to find out what is really happening with your money. This step can be uncomfortable, so remember that you are only collecting information. You are not judging yourself. [pause]
Open your last two months of statements. Write down your monthly take-home income, meaning the money that actually lands in your account after tax. If your income varies, use your lowest month from the last six, so the plan is safe in a slow month.
Now go through the statements line by line and list everything you spent. Group the lines as you go: rent or mortgage, food, transport, bills, subscriptions, fun, and everything else. Do not round. Use the actual figures. [breathe]
Here is the part that surprises people. Look for the small recurring charges. Subscriptions you forgot about, a gym membership you never use, a streaming service you open once a month. Add them up. Seeing that one total in a single place is often the motivation people need. I found a few small subscriptions I had no memory of signing up for, and canceling them took ten minutes. [pause]
At the end of step one, you should have two numbers: what comes in each month, and what goes out each month. Subtract the second from the first. If the answer is positive, great, we will give that money a job. If it is negative, do not panic. It just means step two is going to be very useful for you. [smile]
# Chapter two
Step two is to sort everything into three buckets. Needs, wants, and future. [pause]
Needs are the things you must pay to live your life: housing, groceries, utilities, transport to work, insurance, and minimum debt payments. If you stopped paying for it, there would be real consequences.
Wants are the things that make life enjoyable but could be reduced: eating out, subscriptions, hobbies, trips, new clothes. Wants are not bad. A budget with no wants does not last a month. [breathe]
Future is everything that protects or grows your later self: an emergency fund, extra debt payments, retirement savings, and any goal you are saving toward.
Many people use a starting split of fifty percent needs, thirty percent wants, and twenty percent future. It is a rule of thumb, not a law. If you live somewhere expensive, your needs may take much more, and that is okay. Start with your real numbers and shift one category at a time. [pause]
Here is a trick: pick one want you love the most and protect it on purpose. For me, it is travel. Because I protect it, I never feel like I am being deprived, and the rest of the budget is easier to follow.
Go through your list and label every line with N, W, or F. Add up each bucket and compare it with your take-home pay. You now have a picture of where your money really goes. [smile]
# Chapter three
Step three is where the budget becomes a habit. Give every dollar a job, and check in once a week. [pause]
Start with the future bucket, and pay it first. The simplest way is to set up an automatic transfer on payday, so the money leaves before you can spend it. Even a small amount counts. Starting small and staying consistent beats starting big and quitting.
If you have no emergency fund yet, make that your first job: one small cushion, say the cost of a single month of essentials. Then you can move on to bigger goals. [breathe]
Next, set a spending limit for each category in the needs and wants buckets. Write the number next to it. For flexible things like groceries and fun, many people find it easier to move that amount into a separate account or card, so they can watch it shrink.
Now the weekly check in. Pick one day, set ten minutes on your calendar, and look at three things: how much is left in each category, whether anything surprising happened, and whether any number needs to change. If you overspent on food this week, shift the money from another want, rather than abandoning the plan. [pause]
A budget is a living document. It will be wrong in the first month. That is normal, and it is exactly why you check in. After a few months, your numbers will feel natural, and you will spend less time on it, not more. [smile]
# Recap
Let us recap the three steps. [pause]
Step one: find your real numbers. Take-home income in, every expense out, and hunt down those quiet recurring charges.
Step two: sort everything into needs, wants, and future. Use a starting split if it helps, but let your real life set the final numbers. And protect one want on purpose.
Step three: give every dollar a job. Pay your future bucket first with an automatic transfer, set a limit for each category, and check in for ten minutes every week. [breathe]
If you only do one thing after this video, do step one tonight. Open your statements, write the two numbers, and stop there. Knowing the numbers already puts you ahead of where you were an hour ago.
And remember what we said at the start: a budget is a plan, not a punishment. It exists to make room for the things you care about. If it feels like a punishment, loosen it and try again. [smile]
# Call to action
If you found this useful, please like the video and subscribe, so you do not miss the next one. I make money basics videos for people who are just getting started. [pause]
Tell me in the comments which bucket is the hardest for you right now: needs, wants, or future. I read them all, and your questions often turn into my next videos.
If you want to go further, the next video shows you how to build that emergency fund step by step, and it is on the screen now. Thanks for watching, and I will see you next time. [smile]`,
      },
    ],
    tips: [
      'Write the hook last. Once the three chapters exist, you know exactly what the video promises.',
      'Say each chapter name out loud in the context section. A viewer who knows the map stays longer.',
      'Keep one idea per chapter. If a chapter needs two, split it or cut the weaker one.',
      'Read the full script at 140 words per minute with a timer before recording, then trim chapters rather than rushing.',
      'Record one chapter at a time. Section takes make retakes cheap and keep your energy steady.',
    ],
    faq: [
      {
        question: 'How many words is a 10-minute YouTube script?',
        answer:
          'About 1,400 words at a conversational 140 words per minute. Use 1,250 to 1,500 words as a working range, and expect cues, pauses and b-roll moments to stretch it slightly.',
      },
      {
        question: 'Does the video have to have three chapters?',
        answer:
          'No. Three is a good default for ten minutes. Two chapters with deeper examples work too, and four short chapters suit a list-style video. Keep the total near your target length.',
      },
      {
        question: 'Can I record a landscape video with this on my phone?',
        answer:
          'Yes. Turn the phone sideways, choose 16:9 in the recorder, and read the script from the screen right under the lens. A laptop camera works as well.',
      },
    ],
    related: {
      templates: ['tutorial-how-to-script', 'youtube-intro-script'],
      hooksNiche: 'education',
      recordPreset: 'youtube',
    },
  },
  {
    id: 'faq-answer-script',
    name: 'Answer a common question',
    seoTitle: 'Answer a common question Template | teleprompter.wtf',
    seoDescription:
      'Turn a question you keep getting into a 30-second video. Free FAQ answer script template with timed beats, two examples and tips. Record it now.',
    h1: 'Answer a common question script template',
    summary:
      'Answer one question you hear all the time in 30 seconds, with the short answer first.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this when the same question lands in your comments, messages or inbox again and again. One clear answer on video saves you typing it out each time, and it helps everyone who was too shy to ask.',
      'It works in any niche, because it starts with the answer instead of a long warm-up. Viewers get what they came for in the first ten seconds, which is why they keep watching.',
    ],
    beats: [
      {
        label: 'Question',
        startSeconds: 0,
        endSeconds: 4,
        instruction: 'Say the question out loud, in the words people actually use.',
      },
      {
        label: 'Short answer',
        startSeconds: 4,
        endSeconds: 12,
        instruction: 'Give the answer in one sentence before any explanation.',
      },
      {
        label: 'Detail',
        startSeconds: 12,
        endSeconds: 24,
        instruction: 'Give two reasons and the one exception that matters.',
      },
      {
        label: 'Close',
        startSeconds: 24,
        endSeconds: 30,
        instruction: 'Tell the viewer what to do next and invite the next question.',
      },
    ],
    body: `# Question
People keep asking me, "{the question}"
# Short answer
The short answer is {one-line answer}. [pause]
# Detail
Here is why. {Reason one}, and {reason two}.
The one exception is {exception}, so {what to do then}. [smile]
# Close
{Next step for the viewer}. Ask me your question in the comments.`,
    examples: [
      {
        title: 'Debt or savings first',
        niche: 'personal-finance',
        body: `# Question
"Should I pay off debt or start saving first?" I get asked this every week.
# Short answer
Short answer: do both, in this order. [pause] Save one small emergency cushion first, then attack the debt.
# Detail
Here is why. Without a cushion, one surprise bill goes straight back on a credit card, and you are right where you started. The exception is a very low interest loan. Pay that one slowly and put the extra toward savings. [smile]
# Close
Not sure where you stand? Ask me in the comments.`,
      },
      {
        title: 'Stretching before lifting',
        niche: 'fitness',
        body: `# Question
"Do I need to stretch before I lift?" Everybody asks me this.
# Short answer
Short answer: not for long. [pause] Do a light warm-up first, and stretch after.
# Detail
Here is why. Your muscles move better after five minutes of easy cardio and a few light sets of your first lift. Save the long stretches for after your workout. The exception is a stiff joint, so spend a minute on that one. [smile]
# Close
Not sure what to do first? Ask me in the comments.`,
      },
    ],
    tips: [
      'Use a real question from your comments or messages. Real wording hooks the people who asked it.',
      'Answer first and explain second. If the answer needs a long setup, it belongs in a longer video.',
      'Keep one exception at most. Two or three turn a 30-second answer into a lecture.',
      'Reply to the original comment with the video, so the person who asked sees it.',
      'Film a batch: five questions, five videos, one session.',
    ],
    faq: [
      {
        question: 'How many questions can one video answer?',
        answer:
          'One. A single clear answer beats three rushed ones. If you have several questions, record a separate 30-second video for each.',
      },
      {
        question: 'What if the honest answer is "it depends"?',
        answer:
          'Say it depends in the short answer, then name the one thing it depends on. Viewers trust a direct "it depends on this" more than a vague reply.',
      },
      {
        question: 'Can I use this for questions from customers?',
        answer:
          'Yes. It suits how-it-works, delivery and getting-started questions, and you can save each video to send in a reply.',
      },
    ],
    related: {
      templates: ['myth-vs-fact-script', 'tutorial-how-to-script'],
      hooksNiche: 'education',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'client-result-case-study-script',
    name: 'Client result case study',
    seoTitle: 'Client result case study Template | teleprompter.wtf',
    seoDescription:
      'Show how you solve a problem in 45 seconds. A free client result case study script template with timed beats, two examples and tips. Record it now.',
    h1: 'Client result case study script template',
    summary:
      'Tell a before, during and after story about a client in 45 seconds, without hype or invented numbers.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 45,
    whenToUse: [
      'Use this when you want to show how you work through a real problem. A short story about a result is more convincing than a list of services, because the viewer can picture themselves in it.',
      'Only share what your client has agreed to, and use numbers you can stand behind. If you cannot share details, tell a typical case and say so.',
    ],
    beats: [
      {
        label: 'Setup',
        startSeconds: 0,
        endSeconds: 8,
        instruction: 'Introduce the type of client and what they wanted.',
      },
      {
        label: 'Problem',
        startSeconds: 8,
        endSeconds: 18,
        instruction: 'Name the obstacle and what it was costing them.',
      },
      {
        label: 'Action',
        startSeconds: 18,
        endSeconds: 34,
        instruction: 'Walk through three things you did, in order.',
      },
      {
        label: 'Result',
        startSeconds: 34,
        endSeconds: 40,
        instruction: 'Share one concrete outcome and how long it took.',
      },
      {
        label: 'Close',
        startSeconds: 40,
        endSeconds: 45,
        instruction: 'Invite viewers with the same problem to take the next step.',
      },
    ],
    body: `# Setup
Meet {client type}. They came to me wanting {goal}.
# Problem
The problem was {obstacle}. They had already tried {failed attempt}, and it was costing them {cost}. [pause]
# Action
So we did three things. First, {step one}. Then, {step two}. Last, {step three}. [breathe]
# Result
Within {time}, {specific result}. [smile]
# Close
Want the same for {your audience}? {Call to action}.`,
    examples: [
      {
        title: 'A freelance photographer',
        niche: 'small-business',
        body: `# Setup
Imagine a freelance photographer who wants steady weekend bookings. Here is an illustrative plan, not a client claim.
# Problem
Her problem was visibility. Her best work lived in a folder on her laptop, and her website had one page. She was relying on word of mouth alone. [pause]
# Action
So we did three things. First, we picked her twelve strongest photos. Then we built a simple portfolio page with a booking button. Last, she posted one short behind-the-scenes video every week. [breathe]
# Result
In this example, her weekends go from mostly empty to nearly full after two months. [smile]
# Close
Want a plan like that for your business? Send me a message that says plan.`,
      },
      {
        title: 'A first 5K',
        niche: 'fitness',
        body: `# Setup
Imagine a busy parent who wants to run a first 5K. This is an illustrative plan, not a client result.
# Problem
They kept quitting by week two. Every run was too fast, too long, and squeezed in whenever there was time, which meant never. [pause]
# Action
We changed three things. First, a walk and jog mix, with one minute running at a time. Then three fixed run days, put in the calendar like meetings. Last, a slow pace where you can still talk. [breathe]
# Result
In this example, they run the whole distance after eight weeks and still enjoy it. [smile]
# Close
Want a plan that fits your week? Follow me, and send me the word start.`,
      },
    ],
    tips: [
      'Get your client’s permission before you share their story, or describe a typical case without identifying anyone.',
      'Use one result only. A single believable outcome lands harder than a list of five.',
      'Say the numbers in plain words and only use ones you can prove from your own records.',
      'Name the problem in your viewer’s language, so people with the same problem recognize themselves.',
      'Put the call to action in the last five seconds, and make it one small step.',
    ],
    faq: [
      {
        question: 'What if I do not have a client result yet?',
        answer:
          'Tell a typical case instead and call it one. You can also use your own result as the case, as long as the story and numbers are true.',
      },
      {
        question: 'Do I need before and after numbers?',
        answer:
          'No. A clear change someone can picture works as well as a metric. If you use a number, make sure you can show where it came from.',
      },
      {
        question: 'Should I name the client?',
        answer:
          'Only with written permission. Many creators describe the client type instead, such as a freelance photographer or a busy parent.',
      },
    ],
    related: {
      templates: ['before-and-after-script', 'product-demo-video-script'],
      hooksNiche: 'small-business',
      recordPreset: 'linkedin-video',
    },
  },
  {
    id: 'real-estate-listing-video-script',
    name: 'Real estate listing tour',
    seoTitle: 'Real estate listing tour Template | teleprompter.wtf',
    seoDescription:
      'Script a 60-second listing walkthrough for Reels and TikTok, from first look to viewing request. Two examples and timed beats. Record it now.',
    h1: 'Real estate listing tour script template',
    summary:
      'Walk a buyer through a listing in 60 seconds, ending on the one feature that sells it.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 60,
    whenToUse: [
      'Use this for a quick tour of a home or apartment. It moves room by room and saves the best feature for the middle, when viewers are still watching.',
      'Film the rooms first, then record the voiceover from the script.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 6,
        instruction: 'Lead with the bedrooms, the standout feature and the place.',
      },
      {
        label: 'Arrival',
        startSeconds: 6,
        endSeconds: 16,
        instruction: 'Describe the street and the first room you step into.',
      },
      {
        label: 'Living spaces',
        startSeconds: 16,
        endSeconds: 32,
        instruction: 'Cover the main living area, kitchen and bedrooms.',
      },
      {
        label: 'Standout',
        startSeconds: 32,
        endSeconds: 44,
        instruction: 'Show the feature people will remember and paint a moment.',
      },
      {
        label: 'Details',
        startSeconds: 44,
        endSeconds: 54,
        instruction: 'State the practical facts a buyer needs.',
      },
      {
        label: 'Close',
        startSeconds: 54,
        endSeconds: 60,
        instruction: 'Give one way to book a viewing.',
      },
    ],
    body: `# Hook
{Number} bedrooms, {standout feature}, and {neighborhood or price angle}. Let me show you around.
# Arrival
We are on {street or neighborhood}, about {distance} from {landmark}. [pause] Step inside and you land in {first room}, with {first detail}.
# Living spaces
The main living area is {size and feel}, with {light or layout detail}. The kitchen has {kitchen detail}, and the {bedroom} is {bedroom detail}. [breathe]
# Standout
But the reason people fall for this one is {standout feature}. [pause] Picture {lifestyle moment}.
# Details
The practical side: {size}, {parking or storage}, and {costs or terms to mention}. [look up]
# Close
Asking {price}. Book a viewing with {contact}, or message me for the floor plan.`,
    examples: [
      {
        title: 'A city apartment',
        niche: 'real-estate',
        body: `# Hook
Two bedrooms, a south-facing balcony, and a five-minute walk to the train. Let me show you around.
# Arrival
We are on a quiet tree-lined street, right above a small bakery. [pause] Step inside and the entry opens straight into the living room, with tall windows on the far wall.
# Living spaces
The living area has room for a full sofa and a dining table. The kitchen has a gas hob, plenty of counter space, and a window over the sink. [breathe] Both bedrooms fit a double bed, and the second works well as a home office.
# Standout
But the balcony is what sells it. [pause] Picture coffee out here in the morning sun, before the street wakes up.
# Details
Practically, you get one parking space, a storage cage in the basement, and a building with a lift. [look up]
# Close
Book a viewing through the link in my bio, or message me for the floor plan.`,
      },
      {
        title: 'A family house',
        niche: 'real-estate',
        body: `# Hook
Four bedrooms, a big backyard, and a kitchen made for hosting. Come inside.
# Arrival
This is a quiet cul-de-sac, ten minutes from the school and the park. [pause] The front door opens into a wide hallway with space for coats, bags, and a lot of shoes.
# Living spaces
Straight ahead is the open kitchen and dining area, with an island that seats four. The living room has a fireplace and doors to the garden. [breathe] Upstairs, all four bedrooms are good sized, and the main bedroom has its own bathroom.
# Standout
Now look at this backyard. [pause] Imagine summer evenings out here, with the grill going and the kids on the lawn.
# Details
You also get a double garage, a new roof, and a home office in the converted loft. [look up]
# Close
Message me today to book a private tour this weekend.`,
      },
    ],
    tips: [
      'Film in daylight with every light on, and shoot each room from the doorway.',
      'Mention only what is true and visible. Check each claim against the listing.',
      'Keep the standout feature for the middle, not the end.',
      'Name the price, or say how to ask for it, so serious buyers know the next step.',
    ],
    faq: [
      {
        question: 'Should I say the price in the video?',
        answer:
          'That depends on your market and your listing agreement. If you leave it out, say how viewers can ask.',
      },
      {
        question: 'Can I read the script while walking through the home?',
        answer:
          'It is easier to record the voiceover separately, then lay it over your footage. For a standing tour, use a phone on a gimbal and read short sections.',
      },
      {
        question: 'How long should a listing video be?',
        answer:
          'Sixty seconds covers the highlights. Make a longer walkthrough for serious buyers.',
      },
    ],
    related: {
      templates: ['product-demo-video-script', 'before-and-after-script'],
      hooksNiche: 'real-estate',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'course-launch-promo-script',
    name: 'Course or offer launch',
    seoTitle: 'Course or offer launch Template | teleprompter.wtf',
    seoDescription:
      'Announce a course, workshop or offer in 45 seconds with a clear problem, promise and deadline. Two examples and timed beats. Record it now.',
    h1: 'Course or offer launch script template',
    summary:
      'Announce a course, workshop or offer in 45 seconds, from the problem to a clear deadline.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 45,
    whenToUse: [
      'Use this when you open enrollment for a course, a workshop, a coaching spot or any offer with a start and an end. It sells the outcome first and the details second.',
      'Post it more than once during a launch. Change the opening line each time, and keep the offer and deadline the same.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 5,
        instruction: 'Open on the frustration your audience feels.',
      },
      {
        label: 'Problem',
        startSeconds: 5,
        endSeconds: 14,
        instruction: 'Explain why the usual approach does not work.',
      },
      {
        label: 'Offer',
        startSeconds: 14,
        endSeconds: 28,
        instruction: 'Name the offer, what is inside, and the outcome.',
      },
      {
        label: 'Fit',
        startSeconds: 28,
        endSeconds: 36,
        instruction: 'Say exactly who it is for.',
      },
      {
        label: 'Call to action',
        startSeconds: 36,
        endSeconds: 45,
        instruction: 'Give the deadline and one way to join.',
      },
    ],
    body: `# Hook
{A frustration your audience feels}.
# Problem
Most people {usual approach}, and it fails because {reason}. [pause]
# Offer
That is why I made **{offer name}**. It is {format}, with {what is inside}. By {finish point}, you will have {outcome}. [breathe]
# Fit
It is for {who it is for}, who want {their goal}.
# Call to action
{Deadline or limit}. Join using {how to join}. [smile]`,
    examples: [
      {
        title: 'A budgeting workshop',
        niche: 'personal-finance',
        body: `# Hook
Your money already has a plan. The problem is that you have not written it down.
# Problem
Most people track their spending after the month is over, which is like checking the map after you got lost. [pause] You need a system you can run in twenty minutes a week.
# Offer
That is what Budget in a Weekend is. A short video course, a spreadsheet, and a checklist. By Sunday night, you have a working budget and a plan for your next paycheck. [breathe]
# Fit
It is for beginners who feel behind on money and want a calm place to start.
# Call to action
Doors are open until Friday. Tap the link in my bio to join. [smile]`,
      },
      {
        title: 'A baking course',
        niche: 'food',
        body: `# Hook
Your first sourdough loaf should not feel like a science fair project.
# Problem
Most beginners quit after one flat loaf, because nobody explained what the dough should feel like at each stage. They follow a recipe, but the dough never looks like the photo. [pause]
# Offer
My Weekend Sourdough course walks you through every stage on video, from starter to slicing. You get a baking schedule, a troubleshooting guide, and a live question and answer session each Sunday. [breathe]
# Fit
It is for home bakers who want a reliable loaf without special equipment.
# Call to action
Enrollment closes on Friday. Join using the link in my bio. [smile]`,
      },
    ],
    tips: [
      'Sell one outcome. Everything else inside the course supports it.',
      'State the deadline in words, such as "until Friday". Never invent urgency you do not have.',
      'Keep the offer description concrete: name the format, and say what is in it.',
      'Do not promise results you cannot control. Describe what the viewer will have, not what will happen to their life.',
      'Record two or three versions with different hooks and post them across the launch week.',
    ],
    faq: [
      {
        question: 'Should I say the price?',
        answer:
          'It depends on your audience. Many creators leave the price for the sales page and put the outcome and deadline in the video.',
      },
      {
        question: 'How often should I post launch videos?',
        answer:
          'Post at the start, in the middle and on the last day. Change the hook each time and keep the offer the same.',
      },
      {
        question: 'Can I use this for a free workshop?',
        answer:
          'Yes. Replace the offer with the topic and what attendees leave with, and make the deadline the registration cutoff.',
      },
    ],
    related: {
      templates: ['event-announcement-script', 'product-demo-video-script'],
      hooksNiche: 'education',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'event-announcement-script',
    name: 'Event announcement',
    seoTitle: 'Event announcement Template | teleprompter.wtf',
    seoDescription:
      'Announce an event in 20 seconds with the date, place and one reason to come. A free script template with two examples. Record it now in your browser.',
    h1: 'Event announcement script template',
    summary: 'Announce an event in 20 seconds with the date, the place and one reason to come.',
    format: 'business',
    aspect: '9:16',
    targetSeconds: 20,
    whenToUse: [
      'Use this for a workshop, a meetup, a livestream, a sale or any date you want people to remember. At 20 seconds, it is easy to post as a Story or a Reel.',
      'Say the date out loud in plain words, and repeat it in your caption so nobody has to scroll.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 4,
        instruction: 'Name the event and say it is coming.',
      },
      {
        label: 'Details',
        startSeconds: 4,
        endSeconds: 14,
        instruction: 'Say the date, time, place, and what attendees get.',
      },
      {
        label: 'Call to action',
        startSeconds: 14,
        endSeconds: 20,
        instruction: 'Give the limit and one way to sign up.',
      },
    ],
    body: `# Hook
Mark your calendar. {Event name} is happening.
# Details
It is on {date} at {time}, at {place or link}. You will {what attendees get}. [pause]
# Call to action
{Spots or limit}. Sign up using {how}.`,
    examples: [
      {
        title: 'A free business workshop',
        niche: 'small-business',
        body: `# Hook
Mark your calendar. Our free small business workshop is back.
# Details
It is on Thursday the twelfth at six in the evening, online. You will leave with a one-page marketing plan for your next quarter. [pause]
# Call to action
Seats are limited. Register through the link in my bio.`,
      },
      {
        title: 'A community 5K',
        niche: 'fitness',
        body: `# Hook
Calling every runner in town. Our community 5K is almost here.
# Details
Join us Saturday the third at eight in the morning at the riverside park. All paces are welcome, and there is coffee at the finish line. [pause]
# Call to action
Sign up using the link in my bio, and bring a friend.`,
      },
    ],
    tips: [
      'Put the date and time in your caption and on screen as text, not only in speech.',
      'Pick one reason to come. Two reasons dilute each other.',
      'Say the date as a weekday and a day number so it is easy to remember.',
      'Post it again the day before, with the same script and a new hook line.',
    ],
    faq: [
      {
        question: 'Is 20 seconds too short for an event?',
        answer:
          'No. People need the what, when, where and how to sign up. Anything beyond that belongs on the event page.',
      },
      {
        question: 'Where should I post an event video?',
        answer:
          'Post it wherever your audience already pays attention, and pin it to your profile until the event is over.',
      },
      {
        question: 'What if the event is online?',
        answer:
          'Replace the place with the platform name, and tell viewers whether a replay will be available.',
      },
    ],
    related: {
      templates: ['course-launch-promo-script', 'behind-the-scenes-script'],
      hooksNiche: 'small-business',
      recordPreset: 'instagram-reels',
    },
  },
  {
    id: 'behind-the-scenes-script',
    name: 'Behind the scenes',
    seoTitle: 'Behind the scenes Template | teleprompter.wtf',
    seoDescription:
      'Show the work nobody sees in 30 seconds. A free behind the scenes script template with timed beats, two examples and tips. Record it now.',
    h1: 'Behind the scenes script template',
    summary: 'Show the unseen work behind something your audience already knows in 30 seconds.',
    format: 'short-form',
    aspect: '9:16',
    targetSeconds: 30,
    whenToUse: [
      'Use this to explain why your work takes the time it does, or costs what it costs. Seeing the hidden effort builds trust faster than telling people you care about quality.',
      'It pairs well with footage of the process. Film the footage first and read the script as a voiceover or to camera.',
    ],
    beats: [
      {
        label: 'Hook',
        startSeconds: 0,
        endSeconds: 3,
        instruction: 'Name the finished thing your audience knows.',
      },
      {
        label: 'What you see',
        startSeconds: 3,
        endSeconds: 12,
        instruction: 'Describe what you are doing right now and how long it takes.',
      },
      {
        label: 'Behind it',
        startSeconds: 12,
        endSeconds: 24,
        instruction: 'Reveal the hidden effort with one specific detail.',
      },
      {
        label: 'Close',
        startSeconds: 24,
        endSeconds: 30,
        instruction: 'Connect it to why it matters and invite them to follow.',
      },
    ],
    body: `# Hook
This is what {finished thing} looks like before anyone sees it.
# What you see
Right now I am {current activity} for {project}. [pause] It takes {time}, and most of it is {unglamorous part}.
# Behind it
The part nobody sees is {hidden effort}. I {specific detail}, and I redo it when {standard}. [smile]
# Close
That is why {why it matters}. Want to see {next step}? Follow along.`,
    examples: [
      {
        title: 'A home bakery',
        niche: 'food',
        body: `# Hook
This is what a Saturday pastry box looks like before anyone sees it.
# What you see
Right now I am folding dough for tomorrow's croissants. [pause] It takes three days, and most of it is waiting.
# Behind it
The part nobody sees is the chilling. I wrap the dough, set a timer, and redo the whole batch if the butter melts. [smile]
# Close
That is why they cost a little more. Want to see the baking? Follow along.`,
      },
      {
        title: 'An app update',
        niche: 'tech',
        body: `# Hook
This is what a new app update looks like before anyone sees it.
# What you see
Right now I am testing a new login screen on three old phones. [pause] It takes an afternoon, and most of it is tapping the same button.
# Behind it
The part nobody sees is the bugs. I write down every glitch, and I redo the test whenever a fix breaks something else. [smile]
# Close
That is why updates take a week. Want to see the finished screen? Follow along.`,
      },
    ],
    tips: [
      'Choose a process people see only the end of, such as packaging, editing, testing or prep.',
      'Use one specific detail, like three phones or a three-day dough, instead of a general statement.',
      'Film a few seconds of the real process. Real footage is the whole point of this format.',
      'Do not reveal anything private, a client, or a trade secret. Show the craft, not the confidential parts.',
    ],
    faq: [
      {
        question: 'What counts as behind the scenes?',
        answer:
          'Any step your audience does not normally see: preparation, testing, packing, planning or fixing mistakes.',
      },
      {
        question: 'Do I have to show my face?',
        answer:
          'No. You can read the script as a voiceover over footage of your hands, your screen or your workspace.',
      },
      {
        question: 'How often should I post this format?',
        answer:
          'Whenever you have a process worth showing. Once a week keeps it fresh without running out of material.',
      },
    ],
    related: {
      templates: ['day-in-the-life-voiceover-script', 'before-and-after-script'],
      hooksNiche: 'small-business',
      recordPreset: 'tiktok',
    },
  },
];
