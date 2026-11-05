import type { Hook, HookGroup, HookGroupId, HookNiche, Niche } from './types';

const GROUP_NAMES: Record<HookGroupId, string> = {
  curiosity: 'Curiosity',
  mistake: 'Mistake',
  result: 'Result',
  contrarian: 'Contrarian',
  story: 'Story',
};

function group(
  niche: Niche,
  id: HookGroupId,
  why: string,
  texts: [string, string, string, string, string],
): HookGroup {
  const hooks: Hook[] = texts.map((text, index) => ({ id: `${niche}-${id}-${index + 1}`, text }));
  return { id, name: GROUP_NAMES[id], why, hooks };
}

/** 8 niches x 5 groups x 5 hooks (14.2). Slots in {braces} are filled by the creator. */
export const hookNiches: HookNiche[] = [
  {
    id: 'fitness',
    name: 'Fitness',
    seoTitle: 'Fitness Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank fitness hooks for Reels, Shorts and TikTok, grouped by curiosity, mistake, result, contrarian and story. Copy or record one now.',
    h1: 'Fitness hooks for Reels, Shorts and TikTok',
    intro: [
      'A fitness video has about one breath to prove it is worth watching. The viewer is usually mid-scroll, half interested in a workout and half interested in whatever comes next, so your first line has to name a body part, a problem or a payoff right away.',
      'These twenty-five hooks are templates. Swap the slots in braces for your own exercise, routine or goal, read the line out loud once, and keep the version that sounds like you at the gym rather than like an ad.',
    ],
    groups: [
      group(
        'fitness',
        'curiosity',
        'Training advice is full of half-truths, so a line that promises the missing piece makes people stay to find out what they have not been told about their own body.',
        [
          'Nobody tells you this about your first month of {training style}.',
          'The {number}-minute {warm-up} that fixed my {sore spot}.',
          'Here is what your {muscle group} is trying to tell you.',
          'I watched {number} people do {exercise} the same wrong way.',
          'Why does {exercise} feel easy for some people and impossible for you?',
        ],
      ),
      group(
        'fitness',
        'mistake',
        'Nobody wants to waste a month on a plan that does not work, so naming a common form or programming error makes viewers check their own habits immediately.',
        [
          'Stop doing {habit} if you want {result}.',
          'You are not bad at {pull-ups}. You were taught {the wrong progression}.',
          '{Number} signs your {workout plan} is holding you back.',
          'The {exercise} mistake that is quietly wearing out your {joint}.',
          'Watch this before you sign a gym contract.',
        ],
      ),
      group(
        'fitness',
        'result',
        'Fitness is visual and personal, so a stated result with a time frame lets the viewer picture the same change in their own routine.',
        [
          'I tried {routine} for {time}. Here is what happened to my {measure}.',
          'The {number}-minute {routine} I do every morning for my {goal}.',
          'How I went from {starting point} to {goal} without {thing you hated}.',
          'The cheapest way to train {muscle group} at home.',
          '{Number} exercises, no equipment, and a stronger {body part} in {time}.',
        ],
      ),
      group(
        'fitness',
        'contrarian',
        'The fitness feed repeats the same rules, so respectfully disagreeing with one of them gives people a reason to stop and hear your reasoning.',
        [
          'Here is why {popular fitness advice} is wrong for {audience}.',
          'You do not need a gym membership to build {goal}.',
          'Cardio is not the problem. {The real problem} is.',
          'Rest days are not lazy. They are part of the plan.',
          'The workout everyone loves is the one I would never give a {beginner type}.',
        ],
      ),
      group(
        'fitness',
        'story',
        'A short personal story about money, injury or quitting makes training advice feel earned, and viewers stay to see how it ends.',
        [
          'I wasted {amount} on {supplement or gadget} so you do not have to.',
          'I quit {training style} after {time}, and this is why I came back.',
          'My coach said one sentence that changed how I {lift or run}.',
          'A year ago I could not do a single {exercise}.',
          'The day I stopped {chasing the scale} was the day I started {progress}.',
        ],
      ),
    ],
    howToAdapt: [
      'Pick the group that matches the video you already planned. A form check suits a mistake hook, a transformation suits a result hook, and a hot opinion about programming suits a contrarian hook.',
      'Replace each slot with something concrete you can show in the first second, such as a named exercise, a real body part or a number of minutes. Then say the line in the same breath you use at the gym, not in an announcer voice.',
    ],
    faq: [
      {
        question: 'Should I be doing the exercise while I say the hook?',
        answer:
          'Yes if it is safe and you can still be heard. Starting mid-movement gives the eye something to follow while the line lands, but a steady talking frame also works when the hook carries the idea.',
      },
      {
        question: 'Can I use a hook for a workout that is not mine?',
        answer:
          'Use hooks for your own coaching and experience. Say plainly when you are describing a method you learned from someone else, and avoid promising medical results.',
      },
      {
        question: 'How long should a fitness hook be?',
        answer:
          'Aim for one breath, about two to three seconds of speech. If you stumble on a slot, shorten it until the line reads in one go.',
      },
    ],
    relatedNiches: ['food', 'education', 'beauty'],
    suggestedTemplateId: '3-tips-reel-script',
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance',
    seoTitle: 'Personal Finance Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank personal finance hooks for Reels, Shorts and TikTok, in five groups. Copy a hook, fill your numbers and record it in one tap.',
    h1: 'Personal finance hooks for Reels, Shorts and TikTok',
    intro: [
      'Money content wins attention by naming a worry viewers already carry: a bill, a goal, a decision they are about to make. The first line should sound like a friend who has checked the numbers, not like a salesperson.',
      'These hooks leave the numbers to you. Fill each slot with a figure you can stand behind, keep the claims general enough to be true for your viewers, and say clearly that you share education and not personal advice.',
    ],
    groups: [
      group(
        'personal-finance',
        'curiosity',
        'Money rules feel secret even when they are not, so promising the one detail people were never taught makes the viewer lean in.',
        [
          'Nobody tells you this about your first {account type}.',
          'The {number}-minute money check I do on the first of every month.',
          'Where does your {monthly amount} actually go?',
          'What I wish someone had shown me before my first {financial milestone}.',
          'There is a boring setting in your {account or app} that matters more than {popular tip}.',
        ],
      ),
      group(
        'personal-finance',
        'mistake',
        'Financial mistakes are quiet and expensive, so a hook that names one sends viewers straight to their own statements to check.',
        [
          '{Number} signs your {subscription or fee} is costing you money.',
          'Stop keeping all your savings in {account type} if you want {goal}.',
          'You are not bad with money. You were taught {the wrong method}.',
          'Check this before you {decision}.',
          'The {number} word on your {statement or contract} that most people skip.',
        ],
      ),
      group(
        'personal-finance',
        'result',
        'A result with a time frame makes a boring habit feel achievable, especially when the starting point sounds as ordinary as the viewer.',
        [
          'I tracked every {category} for {time}. Here is what I found.',
          'How I paid off {amount} of {debt type} in {time}.',
          'The cheapest way to start {saving or investing} in {country or situation}.',
          'The {amount}-a-week habit that built my {fund}.',
          'I cut my {bill} by changing one thing.',
        ],
      ),
      group(
        'personal-finance',
        'contrarian',
        'Popular money advice is repeated until nobody questions it, so a respectful objection invites people to compare it with their own life.',
        [
          'Here is why {popular advice} is wrong for {audience}.',
          'You do not need a big salary to {goal}.',
          '{Common frugal habit} is not saving you what you think.',
          'Budgeting apps are fine, but this is what actually works for me.',
          'The mistake in "{popular money rule}" is the part nobody repeats.',
        ],
      ),
      group(
        'personal-finance',
        'story',
        'A story about a real mistake makes financial advice feel safe to follow, because the viewer sees that you paid for the lesson first.',
        [
          'I wasted {amount} on {purchase} so you do not have to.',
          'The money conversation I avoided for {time}.',
          'My first {financial milestone} went badly, and this is the fix.',
          'I thought I was good with money until {event}.',
          'The day I opened my {statement} and finally looked.',
        ],
      ),
    ],
    howToAdapt: [
      'Use real figures from your own situation and label them as examples. A slot like {amount} works best when you replace it with a number viewers can sanity check.',
      'Keep the promise modest. A hook about checking one fee or one habit is more believable than one that promises to fix a whole budget, and it leaves room for a calm, useful body.',
    ],
    faq: [
      {
        question: 'Do I need a disclaimer in a finance video?',
        answer:
          'Rules differ by country and by your role, so check what applies to you. At minimum, say that you share general education and not advice about someone else’s situation.',
      },
      {
        question: 'Which numbers should I put in the slots?',
        answer:
          'Use amounts from your own experience or round example figures that you label as examples. Avoid presenting a single result as what every viewer can expect.',
      },
      {
        question: 'Do finance hooks work better as a question or a statement?',
        answer:
          'Test both. Questions suit curiosity hooks about where money goes, while firm statements suit mistake hooks. Your own analytics will tell you more than any rule.',
      },
    ],
    relatedNiches: ['small-business', 'real-estate', 'education'],
    suggestedTemplateId: 'myth-vs-fact-script',
  },
  {
    id: 'food',
    name: 'Food',
    seoTitle: 'Food Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank food and cooking hooks for Reels, Shorts and TikTok, grouped by curiosity, mistake, result, contrarian and story. Record one now.',
    h1: 'Food and cooking hooks for Reels, Shorts and TikTok',
    intro: [
      'Food videos live on sight, sound and a clear promise. A good first line names the dish or the kitchen problem while the pan is already on screen, so viewers know within a second what they are about to learn to make.',
      'Use these hooks as starting points for recipes, kitchen tips and restaurant stories. Swap in your dish, your tool and your time, and read the line over the finished food so the words and the picture land together.',
    ],
    groups: [
      group(
        'food',
        'curiosity',
        'Cooking is full of small secrets, so a line about a hidden step or an odd ingredient makes viewers wait for the reveal.',
        [
          'Nobody tells you this about cooking {ingredient}.',
          'The {number}-minute {dish} that tastes like it took all night.',
          'Here is why your {dish} never tastes like the restaurant version.',
          'What happens when you add {ingredient} to {dish}?',
          'The one thing {cuisine} cooks do before they {cooking step}.',
        ],
      ),
      group(
        'food',
        'mistake',
        'A kitchen mistake is easy to picture, so naming one lets viewers recognize their own habit and want the fix.',
        [
          'Stop doing {habit} if you want a better {dish}.',
          'You are not a bad cook. You were taught {the wrong method} for {ingredient}.',
          '{Number} signs you are overcooking your {ingredient}.',
          'The {tool} mistake that ruins {dish} every time.',
          'Watch this before you buy another {kitchen gadget}.',
        ],
      ),
      group(
        'food',
        'result',
        'The finished plate is the proof, so a hook that promises that plate with a time and a budget feels almost tasted already.',
        [
          'I made {dish} every day for {time}. Here is what I learned.',
          'The {number}-ingredient {dish} that feeds {number of people} for under {amount}.',
          'How I get {result} from a {cheap ingredient}.',
          'The cheapest way to eat {goal} in {city or situation}.',
          'The {number}-minute {meal} I make when I have no energy.',
        ],
      ),
      group(
        'food',
        'contrarian',
        'Recipe rules are strong opinions, so a polite disagreement about technique starts a conversation and keeps people watching your proof.',
        [
          'Here is why {popular cooking rule} is wrong for {dish}.',
          'You do not need {expensive tool} to make good {dish}.',
          'Fresh is not always better for {ingredient}.',
          'Following the recipe exactly is why your {dish} is bland.',
          '{Famous technique} is overrated. This is what I do instead.',
        ],
      ),
      group(
        'food',
        'story',
        'A kitchen disaster or a family recipe adds heart to a how-to, and viewers stay to hear how it turned out.',
        [
          'I wasted {amount} on {ingredient or gadget} so you do not have to.',
          'The first time I made {dish}, it was a disaster.',
          'My grandmother never wrote down her {dish}, so I tried to rebuild it.',
          'I worked in a kitchen for {time}, and this is what they never tell diners.',
          'The {dish} that finally made my family ask for seconds.',
        ],
      ),
    ],
    howToAdapt: [
      'Match the hook to your shot. If the first frame is a sizzling pan, start with a result or curiosity line, and if it is a burnt tray, a story or mistake hook makes the picture do half the work.',
      'Name the dish, not just the category. A line about {dish} becomes much stronger when it says garlic noodles or lemon rice, because specific food is easier to imagine and easier to search for.',
    ],
    faq: [
      {
        question: 'Should the food be on screen while I say the hook?',
        answer:
          'Yes when you can. Recording the hook over the plate or the pan lets the picture prove the promise, and the voice only has to confirm it.',
      },
      {
        question: 'How do I mention allergies or safety?',
        answer:
          'Add a short note in the body or caption when an ingredient or cooking step matters for safety. Keep the hook itself light and put the detail where there is room to explain.',
      },
      {
        question: 'Can I use these hooks for restaurant or café content?',
        answer:
          'Yes. Swap {dish} for a menu item and use the story group for behind-the-counter moments. Make sure any claim about your own food is something you can stand behind.',
      },
    ],
    relatedNiches: ['fitness', 'small-business', 'beauty'],
    suggestedTemplateId: 'tutorial-how-to-script',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    seoTitle: 'Beauty Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank beauty hooks for Reels, Shorts and TikTok, grouped by curiosity, mistake, result, contrarian and story. Copy one or record it now.',
    h1: 'Beauty hooks for Reels, Shorts and TikTok',
    intro: [
      'Beauty content is personal and visual, so the best hooks mention a face, a product or a routine that the viewer can compare to their own mirror. The line should make them glance at their own shelf before you finish the sentence.',
      'These hooks work for skincare, makeup, hair and nails. Replace the slots with your product, skin or hair type and a real time frame, and keep promises to what you can show in your own results.',
    ],
    groups: [
      group(
        'beauty',
        'curiosity',
        'Beauty routines hide small details, so a hook about the step people skip or the order they use makes viewers want the missing piece.',
        [
          'Nobody tells you this about applying {product type}.',
          'The {number}-minute {routine} that fixed my {skin or hair concern}.',
          'Here is why your {product} never looks like the tutorial.',
          'What happens when you switch the order of your {routine}?',
          'The one step makeup artists do before {technique}.',
        ],
      ),
      group(
        'beauty',
        'mistake',
        'People spend real money on products, so naming a mistake that wastes it gets attention from anyone who owns the same bottle.',
        [
          'Stop using {product} like this if you want {result}.',
          'You are not bad at {technique}. You were shown {the wrong method}.',
          '{Number} signs your {product} is not right for your {skin or hair type}.',
          'The {tool} mistake that is making your {concern} worse.',
          'Watch this before you buy another {product category}.',
        ],
      ),
      group(
        'beauty',
        'result',
        'A before-and-after feeling sells itself, so a line that names the concern, the time and the effort sets up a result viewers want to test.',
        [
          'I tried {product or routine} for {time}. Here is what happened.',
          'The {number}-step {routine} that cleared up my {concern}.',
          'How I get {look} in {number} minutes.',
          'The cheapest way to get {result} at home.',
          'My {product type} routine, simplified from {number} steps to {number}.',
        ],
      ),
      group(
        'beauty',
        'contrarian',
        'Beauty trends move fast, so a thoughtful objection to a popular product or rule makes people stay and see if your reasons hold up.',
        [
          'Here is why {popular trend} is wrong for {skin or hair type}.',
          'You do not need {expensive product} to get {result}.',
          'More products will not fix {concern}. This will.',
          '{Famous tip} is overrated, and this is what I do instead.',
          'The "{viral hack}" trend is not for everyone, and here is who should skip it.',
        ],
      ),
      group(
        'beauty',
        'story',
        'A personal story about a bad purchase or a rough patch of skin makes advice feel kind, and viewers stay for the turning point.',
        [
          'I wasted {amount} on {product} so you do not have to.',
          'The day my {concern} finally made me change my routine.',
          'My first attempt at {technique} was a disaster.',
          'I trusted one {influencer or ad claim}, and my {skin or hair} paid for it.',
          'The {product} I almost threw away turned out to be my favorite.',
        ],
      ),
    ],
    howToAdapt: [
      'Match the hook to what the camera can show. A result line works when you can hold up the finished look, and a mistake line works when you can demonstrate the wrong way first.',
      'Be careful with promises about skin and health. Describe what you tried and what you saw on your own face, and leave out guarantees or claims that a product treats a medical condition.',
    ],
    faq: [
      {
        question: 'Should I show my face in the first second?',
        answer:
          'For most beauty videos, yes. A clear face in good light is the proof, so frame yourself close, look at the lens and say the line while the first look is still visible.',
      },
      {
        question: 'Can I name a brand in the hook?',
        answer:
          'You can, as long as the claim is your honest experience. If the product was a gift or an ad, disclose that the way your platform and local rules require.',
      },
      {
        question: 'How do I keep a routine hook from sounding like an ad?',
        answer:
          'Lead with the concern and the time you spent, not the product name. A specific story about what changed is more convincing than a list of benefits.',
      },
    ],
    relatedNiches: ['fitness', 'food', 'small-business'],
    suggestedTemplateId: 'before-and-after-script',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    seoTitle: 'Real Estate Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank real estate hooks for Reels, Shorts and TikTok for agents and buyers. Copy a hook, add your listing details and record it now.',
    h1: 'Real estate hooks for Reels, Shorts and TikTok',
    intro: [
      'Property videos compete with a very personal question: could I live here, and could I afford it? A strong hook answers one half of that question in a single line, usually with a price band, a neighborhood or a mistake buyers make.',
      'These hooks fit agents, buyers, landlords and investors. Replace the slots with your market, your property and your honest take, and follow local advertising rules for any figure or promise you state.',
    ],
    groups: [
      group(
        'real-estate',
        'curiosity',
        'Housing decisions feel opaque, so a line that promises to explain what happens behind the door makes buyers and sellers stay.',
        [
          'Nobody tells you this about buying a home in {neighborhood or city}.',
          'Here is what a {price band} home looks like in {city}.',
          'The {number}-minute check I do before every showing.',
          'What actually happens between an offer and the keys?',
          'The one room I look at first in a {property type}.',
        ],
      ),
      group(
        'real-estate',
        'mistake',
        'A wrong move can cost a buyer or seller real money, so naming it makes anyone in the process stop and check their own plan.',
        [
          'Stop doing {habit} if you want a faster sale.',
          'You are not a bad negotiator. You were told {the wrong tactic}.',
          '{Number} signs a listing in {area} is overpriced.',
          'The mistake first-time buyers make on {step of the process}.',
          'Watch this before you sign a {contract type}.',
        ],
      ),
      group(
        'real-estate',
        'result',
        'A closed deal or a clear walk-through gives proof, so a hook that states the outcome and the effort makes the process look possible.',
        [
          'How my client got {result} in {time}.',
          'I toured {number} homes in {area}. Here is what I would buy.',
          'The cheapest way to boost the value of a {property type}.',
          'The {number}-step prep that helped this {property type} sell in {time}.',
          'Here is how we saved {amount} on {cost}.',
        ],
      ),
      group(
        'real-estate',
        'contrarian',
        'Housing advice is full of rules of thumb, so a careful disagreement about one of them stops buyers who have heard it a hundred times.',
        [
          'Here is why {popular advice} is wrong for {buyer type}.',
          'You do not need {down payment or credit target} to start looking.',
          'Renting is not always throwing money away, and here is when.',
          'The best listing photo is not the one you think.',
          'A bigger house is not what {buyer type} should shop for.',
        ],
      ),
      group(
        'real-estate',
        'story',
        'Deals have turning points, so a short story about a fall-through or a surprise inspection makes advice feel earned.',
        [
          'I wasted {amount} on {renovation or fee} so you do not have to.',
          'The offer I lost, and what it taught me about {topic}.',
          'My first {property type} had one problem nobody mentioned.',
          'The day a buyer walked away from {property detail}.',
          'The house I almost passed on turned out to be the best one.',
        ],
      ),
    ],
    howToAdapt: [
      'Add your market to the first line. A city, a neighborhood or a price band tells the right viewer that the video is for them and tells everyone else to scroll without wasting the algorithm’s time.',
      'Keep every figure verifiable and local. Use prices or timelines you can document, say when something is an example, and follow the advertising and fair housing rules that apply where you work.',
    ],
    faq: [
      {
        question: 'Do I need to show the property in the hook?',
        answer:
          'It helps. A front-door or doorway shot while you speak the first line gives viewers a place to look, and the hook then explains why they should care about it.',
      },
      {
        question: 'Can I mention prices in a real estate video?',
        answer:
          'Yes, when the price is accurate and current. Check the advertising rules in your area, and avoid promising that a market will rise or that a buyer will qualify.',
      },
      {
        question: 'Which hook group is best for a listing tour?',
        answer:
          'Curiosity and result hooks fit tours best, because they set up a reveal as you walk through. Mistake hooks suit educational videos for buyers and sellers.',
      },
    ],
    relatedNiches: ['personal-finance', 'small-business', 'tech'],
    suggestedTemplateId: 'real-estate-listing-video-script',
  },
  {
    id: 'tech',
    name: 'Tech',
    seoTitle: 'Tech Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank tech hooks for Reels, Shorts and TikTok, covering apps, gadgets and setups. Copy a hook, add your details and record it now.',
    h1: 'Tech hooks for Reels, Shorts and TikTok',
    intro: [
      'Tech viewers want a shortcut. They are looking for the setting, the app or the habit that saves them time, so a tech hook should name the device or task and promise the fix in plain words.',
      'These hooks suit app tips, gadget reviews, setup tours and explainers. Swap the slots for your device, your software and your honest verdict, and keep the first line free of jargon the viewer has not met yet.',
    ],
    groups: [
      group(
        'tech',
        'curiosity',
        'Devices hide useful features, so a line about the setting nobody opens makes viewers check their own phone while you talk.',
        [
          'Nobody tells you this about your {device}.',
          'The {number}-second {setting change} that fixed my {problem}.',
          'There is a hidden {feature} in {app} that I use every day.',
          'What happens when you turn off {setting} on your {device}?',
          'Here is what {app} is doing in the background.',
        ],
      ),
      group(
        'tech',
        'mistake',
        'Tech mistakes cost time, battery and sometimes security, so naming one makes owners check their own setup right away.',
        [
          'Stop doing {habit} if you want your {device} to last.',
          'You are not bad at {software}. You were shown {the wrong workflow}.',
          '{Number} signs your {device} needs {fix}.',
          'The {setting} mistake that is slowing down your {device}.',
          'Watch this before you buy another {gadget type}.',
        ],
      ),
      group(
        'tech',
        'result',
        'A tech result is easy to measure, so a hook with a time saved or a problem solved lets viewers imagine the same win.',
        [
          'I used {tool} for {time}. Here is what changed.',
          'The {number}-minute setup that fixed my {problem}.',
          'How I {result} with only {tool}.',
          'The cheapest way to {goal} on your {device}.',
          'I replaced {number} apps with one, and here is how.',
        ],
      ),
      group(
        'tech',
        'contrarian',
        'Tech opinions get loud, so a calm and specific counterpoint to a popular recommendation holds attention because viewers want to hear the reasons.',
        [
          'Here is why {popular recommendation} is wrong for {user type}.',
          'You do not need {expensive upgrade} to {goal}.',
          '{Popular app} is overrated, and this is what I use instead.',
          'The newest {device} is not the one I would buy.',
          'Faster is not always better when it comes to {technology}.',
        ],
      ),
      group(
        'tech',
        'story',
        'A story about a lost file or a bad purchase turns a settings tip into a lesson, and viewers stay to hear the damage.',
        [
          'I wasted {amount} on {gadget} so you do not have to.',
          'The day I lost {file or account}, I learned this the hard way.',
          'My {device} died {time} after I ignored one warning.',
          'I switched from {old tool} to {new tool}, and this is what broke.',
          'The setup mistake I made on day one of {project}.',
        ],
      ),
    ],
    howToAdapt: [
      'Show the screen or the device in the first frame, then say the line. A tech hook is strongest when the viewer can see the exact setting, app or error you are talking about.',
      'Cut jargon from the hook and keep it for the body. Say fast phone, not refresh rate, in the first line, and explain the term once the viewer has decided to stay.',
    ],
    faq: [
      {
        question: 'Should I record my screen or my face?',
        answer:
          'Use your face for the hook and cut to the screen for proof. The opening line is about trust, and the screen is about showing the exact steps.',
      },
      {
        question: 'How do I avoid out-of-date tips?',
        answer:
          'Name the device or version in the video and note when you recorded it. Settings move between updates, so a dated tip is more honest and more useful.',
      },
      {
        question: 'Can I review a product I was given?',
        answer:
          'Yes, but say that it was provided to you in the video, using the wording your platform and local rules require, and share your honest experience.',
      },
    ],
    relatedNiches: ['education', 'small-business', 'personal-finance'],
    suggestedTemplateId: 'product-demo-video-script',
  },
  {
    id: 'education',
    name: 'Education',
    seoTitle: 'Education Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank education hooks for Reels, Shorts and TikTok for teachers, tutors and course creators. Copy a hook and record it in one tap.',
    h1: 'Education hooks for Reels, Shorts and TikTok',
    intro: [
      'Learning content competes with entertainment, so the first line has to make the idea feel like a small puzzle rather than a lecture. A good education hook promises a clearer way to understand something the viewer has found hard.',
      'These hooks suit teachers, tutors, coaches and course creators. Fill the slots with your subject, your learner and the misconception you hear most often, and keep the promise to what one short video can really deliver.',
    ],
    groups: [
      group(
        'education',
        'curiosity',
        'A good question lights up the part of the brain that wants to finish the puzzle, so hooks that pose one make viewers stay for the answer.',
        [
          'Nobody tells you this about learning {subject}.',
          'The {number}-minute method that makes {concept} finally click.',
          'Why does {concept} confuse almost everyone at first?',
          'Here is what your brain does when you study {subject}.',
          'What would you do if I asked you to explain {concept} in one sentence?',
        ],
      ),
      group(
        'education',
        'mistake',
        'Learners rarely know they are studying the wrong way, so naming a common study mistake lets them recognize themselves and keep listening.',
        [
          'Stop doing {study habit} if you want to remember {subject}.',
          'You are not bad at {subject}. You were taught {the wrong method}.',
          '{Number} signs you are studying {subject} the hard way.',
          'The {concept} mistake that costs students marks on {exam or task}.',
          'Watch this before you start learning {skill}.',
        ],
      ),
      group(
        'education',
        'result',
        'A learning result with a time frame makes progress feel real, especially when it comes from a method the viewer can try tonight.',
        [
          'I studied with {method} for {time}. Here is what happened.',
          'The {number}-minute routine my students use to learn {skill}.',
          'How I went from {starting point} to {goal} in {subject}.',
          'The cheapest way to practice {skill} at home.',
          'Here is how to explain {concept} to a {age or level} in {number} steps.',
        ],
      ),
      group(
        'education',
        'contrarian',
        'Study advice is full of folk rules, so a careful challenge to one of them keeps people watching while they test it against their own habits.',
        [
          'Here is why {popular study tip} is wrong for {learner type}.',
          'You do not need {tool or course} to learn {skill}.',
          'Rereading your notes is not studying, and here is what is.',
          '{Famous method} is overrated. This is what I teach instead.',
          'Talent is not the reason {students} struggle with {subject}.',
        ],
      ),
      group(
        'education',
        'story',
        'A teacher’s or student’s story shows the stakes of learning, and viewers stay to see how the struggle turned into understanding.',
        [
          'I wasted {time} on {method} so you do not have to.',
          'The student who taught me how to explain {concept}.',
          'I failed {exam or task} once, and this is what I changed.',
          'The day {concept} finally made sense to me.',
          'My worst lesson ever taught me how to teach {subject}.',
        ],
      ),
    ],
    howToAdapt: [
      'Name the learner and the level. A line aimed at a student starting {subject} lands far better than one aimed at everyone, and it tells the right audience to stay.',
      'Make the promise something you can deliver in the video. If the hook says one method will help someone remember a formula, spend the next thirty seconds teaching that method and nothing else.',
    ],
    faq: [
      {
        question: 'How do I teach something complex in a short video?',
        answer:
          'Teach one idea, use one example and leave out the history. Use the hook to name the single question the video will answer, and link to a longer lesson for the rest.',
      },
      {
        question: 'Can these hooks work for adult learners and professionals?',
        answer:
          'Yes. Replace the school subject with a workplace skill, name the real situation where it matters and keep the same structure of question, mistake, result, objection or story.',
      },
      {
        question: 'Should I use an on-screen whiteboard?',
        answer:
          'If it helps the idea, yes. Say the hook to the lens first, then cut to the board so the viewer has a face and a reason to trust the explanation.',
      },
    ],
    relatedNiches: ['tech', 'personal-finance', 'fitness'],
    suggestedTemplateId: 'tutorial-how-to-script',
  },
  {
    id: 'small-business',
    name: 'Small Business',
    seoTitle: 'Small Business Hooks for Reels and Shorts | teleprompter.wtf',
    seoDescription:
      'Twenty-five fill-in-the-blank small business hooks for Reels, Shorts and TikTok. Copy a hook, add your customer and offer, and record it now for free.',
    h1: 'Small business hooks for Reels, Shorts and TikTok',
    intro: [
      'A small business video does two jobs at once: it earns attention from strangers and gives existing customers a reason to trust you. The first line should name the customer’s problem before it mentions your product.',
      'These hooks work for shops, studios, trades, freelancers and service businesses. Fill the slots with your customer, your offer and your proof, and keep every promise something you can honestly deliver.',
    ],
    groups: [
      group(
        'small-business',
        'curiosity',
        'Customers rarely see how a business works, so a hook that offers a look behind the counter or into the process gives them a reason to stay.',
        [
          'Nobody tells you this about hiring a {service provider}.',
          'The {number}-minute step we do before every {job or order}.',
          'Here is what actually goes into a {product or service}.',
          'Why does a {product} cost what it does?',
          'What happens in our shop after you place an order?',
        ],
      ),
      group(
        'small-business',
        'mistake',
        'Customers fear paying for the wrong thing, so naming a common buying mistake helps them trust the business that points it out.',
        [
          'Stop doing {habit} if you want {result} from your {service}.',
          'You are not a difficult customer. You were sold {the wrong option}.',
          '{Number} signs your {provider or product} is costing you more than it should.',
          'The mistake most people make when they hire a {service provider}.',
          'Watch this before you order your next {product}.',
        ],
      ),
      group(
        'small-business',
        'result',
        'Proof from a real customer or job turns an ad into a story, so a result hook with a time and a problem builds trust fast.',
        [
          'How we helped a {customer type} get {result} in {time}.',
          'I tried {marketing method} for {time}. Here is what happened.',
          'The {number}-step system that keeps my {business type} organized.',
          'The cheapest way to {goal} for a {business type}.',
          'We cut {task} from {time} to {shorter time}, and here is how.',
        ],
      ),
      group(
        'small-business',
        'contrarian',
        'Business advice is full of hustle slogans, so a calm and honest objection stands out and gives your brand a clear voice.',
        [
          'Here is why {popular business advice} is wrong for a {business type}.',
          'You do not need {expensive tool} to run a {business type}.',
          'More followers will not fix {problem}. This will.',
          'Discounting is not the answer to {problem}.',
          'The busiest {business type} is not always the most profitable one.',
        ],
      ),
      group(
        'small-business',
        'story',
        'Small business stories are about people, so a short account of a mistake, a first customer or a hard week makes the brand feel human.',
        [
          'I wasted {amount} on {tool or ad} so you do not have to.',
          'Our first {customer or order} nearly went wrong.',
          'The day I decided to {big decision} for my {business type}.',
          'A customer asked one question that changed our {product or process}.',
          'We almost closed in {month or year}, and this is what changed.',
        ],
      ),
    ],
    howToAdapt: [
      'Lead with the customer, not the company. Replace the slots with the problem your customer actually says out loud, in the same words, and let the product appear a few seconds later.',
      'Use real jobs, real orders and real customers where they have agreed. If you cannot share a name or number, describe the situation plainly and avoid inventing proof you do not have.',
    ],
    faq: [
      {
        question: 'How often should a small business post a hook video?',
        answer:
          'Post at a pace you can keep. A steady short video each week usually beats a burst of ten followed by silence, and a good hook is easier to repeat once you have a template.',
      },
      {
        question: 'Do I have to be on camera myself?',
        answer:
          'Not always. You can record the hook yourself and cut to the shop floor or the product, or ask a team member to say it. People tend to trust a human voice.',
      },
      {
        question: 'How do I mention a price or an offer?',
        answer:
          'Keep the offer out of the hook and put it in the body or the close. The first line earns attention, and the price lands better after the viewer knows the problem you solve.',
      },
    ],
    relatedNiches: ['personal-finance', 'real-estate', 'food'],
    suggestedTemplateId: 'client-result-case-study-script',
  },
];

export const hookNicheById = new Map(hookNiches.map((n) => [n.id, n]));
export const allHooks: Hook[] = hookNiches.flatMap((n) => n.groups.flatMap((g) => g.hooks));
