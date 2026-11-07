import type { ToolCopy } from './types';

/** Explanatory copy sits beside client-only, deterministic tool islands. */
export const toolPages: ToolCopy[] = [
  {
    slug: 'script-length-checker',
    seo: {
      title: 'Script Length Checker for Reels and Shorts | teleprompter.wtf',
      h1: 'Will your script fit? Script length checker',
      description:
        'Paste a script to see its speaking time at your pace and whether it fits 15, 30, 60 or 90 seconds. It shows exactly where to cut. Free, with no signup.',
    },
    directAnswer:
      'Paste spoken words and choose your speaking pace. The checker estimates the read time and shows how many words fit common short-video targets, so you can revise before filming.',
    howToRead: {
      heading: 'How to read your result',
      paragraphs: [
        'The estimate counts words you intend to say. At 140 words per minute, 70 spoken words take about 30 seconds before pauses, demonstrations or an on-screen action. Your result changes when you change the WPM setting, so use a pace you have measured by reading a sample aloud rather than the fastest pace you can manage.',
        'Compare your estimated read time with a target such as 15, 30, 60 or 90 seconds. A script above the target needs fewer spoken words or a longer video. The cut point is a guide to where the target is crossed in the text; it cannot decide which sentence carries the idea. Keep the useful demonstration and remove repeated setup, disclaimers you do not need, or a second topic.',
        'If you use section headings or cues, read the marked-up script in Studio to check what will actually be spoken. A pause marker creates time even though it adds no spoken words. Record a practice take with the real camera and microphone to measure your own delivery. A person who stops to show an object will need more time than the plain word estimate suggests.',
      ],
    },
    factsIntro:
      'The checker is an estimate based on word count and a chosen WPM, not a platform approval or a promise that the recording will fit.',
    factIds: ['youtube-shorts-length', 'instagram-reels-length'],
    limits: [
      'Punctuation, breaths, pauses and demonstrations take time but do not add spoken words.',
      'Names, numbers and technical terms can take longer to say than common short words.',
      'A platform may change its upload or recording limits. Check the dated facts and your current app before filming a long video.',
      'For the most useful estimate, paste only words you will say aloud and set WPM from a real rehearsal.',
    ],
    faq: [
      {
        question: 'How many words fit a 30-second video?',
        answer:
          'About 70 words at 140 WPM, before pauses or visual demonstrations. Your own speaking pace changes that number.',
      },
      {
        question: 'Does the checker upload my script?',
        answer:
          'No. The calculation runs in your browser. You decide if and when to put the script into Studio.',
      },
      {
        question: 'Why did my recorded take run longer?',
        answer:
          'Breathing, emphasis, showing a step and natural pauses add time beyond the word estimate. Use a practice take to calibrate.',
      },
      {
        question: 'Should I just speak faster to fit?',
        answer:
          'Usually cut a repeated idea first. Speaking too fast makes the useful part harder to follow.',
      },
    ],
    related: [
      { label: 'Write a 30-second script', href: '/guides/how-to-write-a-30-second-video-script' },
      { label: 'Browse timed video templates', href: '/templates' },
      { label: 'Record a YouTube Short', href: '/record/youtube-shorts' },
    ],
    ui: {
      inputLabel: 'Paste your spoken script',
      paceLabel: 'Speaking pace (WPM)',
      resultLabel: 'Estimated speaking time',
      targetLabel: 'Target length',
      cutLabel: 'Suggested cut point',
      empty: 'Paste a script to see its estimated speaking time.',
      over: 'This script runs past your target at this pace.',
      fits: 'This script fits the selected target by word count. Leave room for pauses.',
    },
  },
  {
    slug: 'caption-counter',
    seo: {
      title: 'Instagram Caption and Hashtag Counter | teleprompter.wtf',
      h1: 'Caption, hashtag and title counter',
      description:
        'Count characters for Instagram captions and the 5-hashtag limit, YouTube titles and descriptions, and TikTok captions. See what shows before the more link.',
    },
    directAnswer:
      'Draft a caption or title and see its character count beside the current platform limit. The counter also helps you place your opening message before Instagram hides the rest behind “more”.',
    howToRead: {
      heading: 'How to read the counters',
      paragraphs: [
        'Choose the field you are writing for, then type or paste your draft. The count compares your text with that field’s documented character limit. A count under the limit means the field has room; it does not mean the message is clear or that every device will display the same amount before truncation.',
        'For an Instagram caption, put the point of the post in the opening sentence. About the first 125 characters may show before the “more” link on many devices, but the visible amount varies. Use that line to give context for the video, then add details or a question afterward. The hashtag counter helps you keep within the currently announced cap of five hashtags per post or Reel.',
        'For YouTube, write a specific title that matches what the video actually delivers. The title field allows up to 100 characters and the description up to 5,000, but using all of them rarely helps a viewer decide to watch. Put important context near the start and use the remaining description for sources, chapter timestamps or related links when relevant.',
        'TikTok caption limits need owner verification before publishing a numeric counter. The tool can still count your draft while the current limit is checked. Platform interfaces and rules change, so confirm a near-limit draft in the app before you publish.',
      ],
    },
    factsIntro:
      'These dated limits are editing aids. The posting app is the final check, and visible truncation can vary by device.',
    factIds: [
      'instagram-caption',
      'instagram-hashtags',
      'youtube-title-description',
      'youtube-chapters',
    ],
    limits: [
      'Character counts include spaces and punctuation. A visible preview is approximate.',
      'A hashtag is useful when it describes the post; filling every available slot is not required.',
      'The TikTok caption limit is deliberately withheld until its current value is verified by the owner.',
      'YouTube chapter timestamps have their own structure and minimum length rules beyond the description count.',
    ],
    faq: [
      {
        question: 'How many hashtags can I use on Instagram?',
        answer:
          'Instagram announced a cap of five per post or Reel, with a gradual rollout. Check the current composer on your account.',
      },
      {
        question: 'How much of a caption shows before “more”?',
        answer:
          'About 125 characters on many devices, but it varies. Put your key sentence first and preview it in the app.',
      },
      {
        question: 'Are captions sent to a server?',
        answer: 'No. The counter works in your browser and does not upload the text you enter.',
      },
      {
        question: 'Can I paste a YouTube description?',
        answer:
          'Yes. Select the YouTube description field to count characters, then confirm the final text in YouTube.',
      },
    ],
    related: [
      { label: 'Check your spoken script length', href: '/tools/script-length-checker' },
      { label: 'Record an Instagram Reel', href: '/record/instagram-reels' },
      { label: 'Use a video script template', href: '/templates' },
    ],
    ui: {
      inputLabel: 'Paste your caption, title or description',
      platformLabel: 'Field to check',
      countLabel: 'Characters',
      hashtagLabel: 'Hashtags',
      previewLabel: 'Approximate opening preview',
      under: 'Within the documented limit',
      over: 'Over the documented limit',
      verification: 'Check the current posting app before publishing.',
    },
  },
  {
    slug: 'hook-generator',
    seo: {
      title: 'Hook Generator for Reels and Shorts | teleprompter.wtf',
      h1: 'Hook generator for short videos',
      description:
        'Pick a niche and topic to get fill-in-the-blank hooks for Reels, Shorts and TikTok. Template-based and instant, then record your favorite in one tap.',
    },
    directAnswer:
      'Choose a niche and a topic to browse authored opening lines. Fill the blanks with details from your own work, then copy one into a script or open it in the recorder.',
    howToRead: {
      heading: 'How to choose a hook',
      paragraphs: [
        'The hook list contains written templates, grouped by the job the opening line does. Curiosity opens a question you can answer. Mistake names a habit and shows a correction. Result shows an outcome you can honestly explain. Contrarian challenges advice with a reason. Story starts at a moment that made something change.',
        'Pick your niche first so the nouns sound like the world your viewer knows. Then add a concrete topic, object or situation where the braces appear. “This one setting changed my phone audio” gives the next sentence a direction; a vague promise such as “You need to see this” leaves the audience guessing. Read the filled line aloud. If it feels awkward, simplify it.',
        'A hook is only the first sentence. The video still needs to earn it. If you promise a demonstration, show the action. If you say a common tip is wrong, explain when it fails and offer a better choice. If you name a result, use a true result you can support. A useful opening is specific enough to tell the right viewer why the next seconds matter.',
        'Try two or three lines from different groups for the same idea. You may discover that a story opening is easier to deliver than a forceful claim. Keep the version that matches your voice and the footage you can record. Then pair it with a short template to give the rest of the video a beginning, middle and end.',
      ],
    },
    factsIntro:
      'Hooks are authored writing prompts. They do not predict reach or guarantee performance on any platform.',
    factIds: [],
    limits: [
      'Replace every placeholder before recording so the line names a real subject.',
      'Do not claim a result or personal experience you cannot support.',
      'A strong first line still needs a useful payoff in the rest of the video.',
      'Avoid using the same opening on every video; choose the group that fits the actual idea.',
    ],
    faq: [
      {
        question: 'Are the hooks written for one platform?',
        answer:
          'They work as opening lines for Reels, Shorts and TikTok. Adapt the language to the audience and video you are making.',
      },
      {
        question: 'Will a hook guarantee views?',
        answer:
          'No. It gives the video a clear starting point, but the content and delivery must fulfill the promise.',
      },
      {
        question: 'Can I change the wording?',
        answer:
          'Yes. Replace the placeholders, say it aloud and rewrite any phrase that does not sound like you.',
      },
      {
        question: 'How do I record the rest?',
        answer:
          'Open the filled hook in Studio, add one useful point and a close, then make a short practice take.',
      },
    ],
    related: [
      { label: 'Browse hooks by niche', href: '/hooks' },
      { label: 'Find a matching script structure', href: '/templates' },
      { label: 'Record a Reel', href: '/record/instagram-reels' },
    ],
    ui: {
      nicheLabel: 'Your niche',
      topicLabel: 'Your topic',
      resultLabel: 'Opening lines',
      copyLabel: 'Copy hook',
      recordLabel: 'Record this hook',
      empty: 'Choose a niche to browse hooks.',
      reminder: 'Replace the words in braces with your own details.',
    },
  },
];

export const toolPageBySlug = new Map(toolPages.map((page) => [page.slug, page]));
