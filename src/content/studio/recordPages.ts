import { templateById } from './templates';
import type { PageScript, RecordPageCopy } from './types';

function example(templateId: string, index: 0 | 1): PageScript {
  const template = templateById.get(templateId);
  if (!template) throw new Error(`Unknown record-page template: ${templateId}`);
  const filled = template.examples[index];
  return {
    id: `${templateId}-${index + 1}`,
    title: filled.title,
    targetSeconds: template.targetSeconds,
    body: filled.body,
  };
}

/** Copy for the five platform record landing pages. */
export const recordPages: RecordPageCopy[] = [
  {
    slug: 'instagram-reels',
    presetId: 'instagram-reels',
    seo: {
      title: 'Teleprompter for Instagram Reels with Camera | teleprompter.wtf',
      h1: 'Teleprompter for Instagram Reels',
      description:
        'Record 9:16 Reels while your script scrolls under the front camera. WPM speed, pause markers and retakes by section. Free, no watermark, saves to your phone.',
    },
    directAnswer:
      'Write your Reel script, place the words below your phone lens and record in your browser. Save the finished take to your phone, then post it in Instagram.',
    ctaLabel: 'Record a Reel now',
    ctaHref: '/studio?preset=instagram-reels',
    trustChips: ['Free, no signup', 'No watermark', 'Video stays on your device'],
    howItWorks: [
      {
        title: 'Choose a short script',
        text: 'Start with a 30-second template or paste the words you already wrote. Put one idea in each section so a retake is simple.',
      },
      {
        title: 'Set up the frame',
        text: 'Allow camera and mic, choose the front camera and check the 9:16 preview. Move the scrolling words close to the lens.',
      },
      {
        title: 'Record and save',
        text: 'Read at a comfortable WPM pace. Review your take, keep the best one and save it to your phone before opening Instagram.',
      },
    ],
    settingsIntro:
      'Start with portrait video and a short test take. These settings are a recording starting point, not a requirement from Instagram.',
    factIds: [
      'instagram-reels-format',
      'instagram-reels-length',
      'instagram-reels-advice',
      'instagram-hashtags',
    ],
    settingsTips: [
      'Choose 9:16 and 1080p if your camera offers it. Check the framing again after switching cameras.',
      'Use the approximate Instagram safe-zone overlay and leave room for captions and buttons near the edges.',
      'Start at 140 WPM, then read the first line aloud. Change the pace until your eyes can stay near the lens.',
      'Save a test file and play it with sound before recording a full batch.',
    ],
    starterScripts: [
      example('30-second-reel-script', 0),
      example('myth-vs-fact-script', 0),
      example('behind-the-scenes-script', 0),
    ],
    builtInApp: {
      heading: 'When to use the built-in app teleprompter instead',
      paragraphs: [
        'If Instagram offers a script helper in your version and you only need two or three lines, filming inside the app may be quicker. Check the current camera tools on your account, since menus and availability change.',
        'Use a browser teleprompter when you want your script saved outside the posting app, precise WPM control, or separate takes for sections. You still post the saved file through Instagram.',
      ],
    },
    faq: [
      {
        question: 'Can I record a Reel without installing an app?',
        answer:
          'Yes. Open Studio in a supported browser, allow camera and microphone access, and save the finished file to your device.',
      },
      {
        question: 'Will the scrolling words appear in my Reel?',
        answer:
          'No. The words guide your delivery while your camera records the scene. Watch the saved take to confirm the framing.',
      },
      {
        question: 'How long should my script be?',
        answer:
          'At 140 spoken words per minute, roughly 70 words take 30 seconds. Rehearse with pauses and adjust for your own pace.',
      },
      {
        question: 'Can I upload straight to Instagram?',
        answer:
          'Save the video first, then post it from Instagram or choose Instagram in your device share sheet if it is available.',
      },
      {
        question: 'What if I stumble near the end?',
        answer:
          'Put section headings in your script and record the section again. Keep the best take for each section.',
      },
    ],
    related: {
      templates: ['30-second-reel-script', '3-tips-reel-script', 'myth-vs-fact-script'],
      hooksNiche: 'fitness',
      guides: ['instagram-teleprompter', 'how-to-film-talking-head-reels'],
      records: ['youtube-shorts', 'tiktok'],
    },
  },
  {
    slug: 'youtube-shorts',
    presetId: 'youtube-shorts',
    seo: {
      title: 'Teleprompter for YouTube Shorts | teleprompter.wtf',
      h1: 'Teleprompter for YouTube Shorts',
      description:
        'Script, record and save vertical Shorts up to 3 minutes with the words right under your lens. Free in your browser, with no app to install and no watermark.',
    },
    directAnswer:
      'Record a YouTube Short with your script scrolling near the camera lens. Keep the best local take and upload it to YouTube when you are ready.',
    ctaLabel: 'Record a Short now',
    ctaHref: '/studio?preset=youtube-shorts',
    trustChips: ['No signup', 'No watermark', 'Local video files'],
    howItWorks: [
      {
        title: 'Pick one question',
        text: 'A useful Short answers one clear question. Use the one-minute starter or a short tutorial template to plan the opening and payoff.',
      },
      {
        title: 'Keep the lens in view',
        text: 'Choose portrait framing, put the text close to the camera and read one sentence at a time at your natural speed.',
      },
      {
        title: 'Review before upload',
        text: 'Listen for rushed words and check the opening frame. Save the take locally and add the title when you upload to YouTube.',
      },
    ],
    settingsIntro:
      'Shorts can be vertical or square; portrait framing is a simple choice for a phone recording. Check the current YouTube limits before planning an unusually long Short.',
    factIds: ['youtube-shorts-length', 'youtube-title-description'],
    settingsTips: [
      'Choose 9:16 for a phone-first Short and enable the approximate Shorts safe-zone overlay.',
      'Aim for a clean 1080p picture when your device supports it. Light your face before increasing resolution.',
      'Use headings for the hook, explanation and close, then restart only the part that needs another take.',
      'Test your audio before filming; clear speech matters more than an elaborate background.',
    ],
    starterScripts: [
      example('30-second-reel-script', 1),
      example('tutorial-how-to-script', 0),
      example('faq-answer-script', 0),
    ],
    builtInApp: {
      heading: 'When to use the built-in app teleprompter instead',
      paragraphs: [
        'If the YouTube creation flow on your device offers a script aid and you are recording a single memorized line, that built-in route can save an export step. Check the current app, since available tools change.',
        'For a longer explanation with section headings, WPM control and reviewable local takes, write and record in Studio, then upload the finished video to YouTube.',
      ],
    },
    faq: [
      {
        question: 'How long can a YouTube Short be?',
        answer:
          'YouTube Shorts can run up to three minutes. A shorter script may be easier to deliver clearly, but choose the length the idea needs.',
      },
      {
        question: 'Does a Short have to be vertical?',
        answer:
          'YouTube accepts vertical or square Shorts. This recorder preset starts in 9:16 for phone viewing.',
      },
      {
        question: 'Can I add a YouTube title in Studio?',
        answer:
          'You can draft a title alongside your script. Confirm the final title in YouTube when you upload.',
      },
      {
        question: 'How do I avoid reading too fast?',
        answer:
          'Start at 140 WPM, rehearse the opening and slow the scroll until you can speak without chasing the text.',
      },
    ],
    related: {
      templates: ['tutorial-how-to-script', 'faq-answer-script', 'top-5-list-script'],
      hooksNiche: 'education',
      guides: ['how-to-write-a-30-second-video-script', 'best-camera-settings-for-reels'],
      records: ['instagram-reels', 'youtube'],
    },
  },
  {
    slug: 'tiktok',
    presetId: 'tiktok',
    seo: {
      title: 'Teleprompter for TikTok Videos | teleprompter.wtf',
      h1: 'Teleprompter for TikTok',
      description:
        'Read your TikTok script without looking away. Record 9:16 video in the browser, keep your best take and save it to your phone. Free, no signup, no watermark.',
    },
    directAnswer:
      'Plan and record a TikTok in your phone browser while the script sits beside the front camera. Save the video, then add the final edit or sound in TikTok.',
    ctaLabel: 'Record a TikTok now',
    ctaHref: '/studio?preset=tiktok',
    trustChips: ['Free to record', 'No watermark', 'Nothing uploaded'],
    howItWorks: [
      {
        title: 'Write the first line',
        text: 'Lead with the surprise, mistake or result. Use a hook from your niche, then write just enough to pay it off.',
      },
      {
        title: 'Film a clean take',
        text: 'Check the portrait preview, put the script near the lens and record. Pause markers give you a breath without losing your place.',
      },
      {
        title: 'Finish in TikTok',
        text: 'Save the file to your device. Open TikTok to add sound, captions or other edits and publish from there.',
      },
    ],
    settingsIntro:
      'Keep the subject centered and preview the full screen before recording. The overlay is approximate because app controls can move.',
    factIds: ['browser-recording'],
    settingsTips: [
      'Use 9:16 and the approximate TikTok safe-zone overlay to avoid placing key details behind interface controls.',
      'Record a three-second test to check mic level and focus. A clear opening matters more than a perfect set.',
      'Try a 30-second story and remove any sentence that repeats the first line.',
      'Leave small pauses around a cut so you can edit the take more easily.',
    ],
    starterScripts: [
      example('story-time-script', 0),
      example('hot-take-script', 0),
      example('behind-the-scenes-script', 1),
    ],
    builtInApp: {
      heading: 'When to use the built-in app teleprompter instead',
      paragraphs: [
        'For a spontaneous clip that uses an in-app effect or sound while filming, TikTok may be the fastest place to record. Check whether your current version offers a script aid for that workflow.',
        'Use Studio for planned words, a repeatable pace and a local master take. Add TikTok-specific effects after saving the file.',
      ],
    },
    faq: [
      {
        question: 'Can I edit the video in TikTok afterward?',
        answer:
          'Yes. Save the local video file, import it into TikTok and use the editing tools available in your app.',
      },
      {
        question: 'Does Studio add a watermark?',
        answer: 'No. Your saved camera recording has no teleprompter.wtf watermark.',
      },
      {
        question: 'Are my scripts uploaded?',
        answer:
          'No. Scripts and takes stay on this device unless you choose to share or download a file.',
      },
      {
        question: 'What is a good opening?',
        answer:
          'Name a specific problem, reveal a surprising result or start at the turning point of a real story.',
      },
    ],
    related: {
      templates: ['story-time-script', 'hot-take-script', 'behind-the-scenes-script'],
      hooksNiche: 'food',
      guides: ['how-to-film-talking-head-reels', 'how-to-batch-record-videos'],
      records: ['instagram-reels', 'youtube-shorts'],
    },
  },
  {
    slug: 'youtube',
    presetId: 'youtube',
    seo: {
      title: 'YouTube Teleprompter with Camera (16:9) | teleprompter.wtf',
      h1: 'YouTube teleprompter for landscape videos',
      description:
        'Record 16:9 YouTube videos with a teleprompter on your laptop or phone. Sections, clicker control and mirror mode for glass rigs. Free, no watermark, no upload.',
    },
    directAnswer:
      'Use the landscape recorder to speak to the lens while reading a YouTube script. Split longer videos into sections, keep local takes and assemble them in your editor.',
    ctaLabel: 'Record a YouTube video now',
    ctaHref: '/studio?preset=youtube',
    trustChips: ['Landscape recording', 'No watermark', 'Local takes'],
    howItWorks: [
      {
        title: 'Outline the video',
        text: 'Write a clear opening, chapter beats and a close. Put each filming section under its own heading.',
      },
      {
        title: 'Set the landscape frame',
        text: 'Use 16:9 on a laptop or turn your phone sideways. Center the lens and make the text easy to scan.',
      },
      {
        title: 'Record section by section',
        text: 'Keep the best take of each part. Save the files to your device and put them together in your editing app.',
      },
    ],
    settingsIntro:
      'This preset has no duration target because a full YouTube video can vary widely. Rehearse each section rather than trying to read ten minutes without a pause.',
    factIds: ['youtube-title-description', 'youtube-chapters', 'browser-recording'],
    settingsTips: [
      'Choose 16:9 and put the prompter close to the camera on a laptop display.',
      'If you use teleprompter glass, turn on text mirror mode and verify one line before filming.',
      'Use a keyboard or clicker to pause between sections without reaching toward the lens.',
      'Record a sample at the same resolution and mic settings as the real take, then listen back.',
    ],
    starterScripts: [
      example('youtube-intro-script', 0),
      example('tutorial-how-to-script', 1),
      example('product-demo-video-script', 0),
    ],
    builtInApp: {
      heading: 'When to use the built-in app teleprompter instead',
      paragraphs: [
        'A camera app with its own script overlay can be convenient for a short introduction when you already edit in that app. Check its controls for the pace and placement you need.',
        'For a video with multiple sections, a reusable outline and separate takes, Studio keeps the script and recordings together on the device before editing.',
      ],
    },
    faq: [
      {
        question: 'Can I film a full YouTube video in one take?',
        answer:
          'You can, but section recordings make corrections easier. Add headings and save each useful take before editing.',
      },
      {
        question: 'Does mirror mode flip my recorded video?',
        answer:
          'Text mirror mode is for reading through teleprompter glass. Check your camera preview and saved take separately.',
      },
      {
        question: 'What does the landscape preset set?',
        answer:
          'It starts with a 16:9 aspect ratio and no time target. You can change camera and prompter settings for your setup.',
      },
      {
        question: 'How do I create chapters?',
        answer:
          'Add chapter timestamps when publishing. YouTube requires a first timestamp at 00:00, at least three timestamps and chapters of at least ten seconds.',
      },
    ],
    related: {
      templates: ['youtube-video-script-outline', 'youtube-intro-script', 'tutorial-how-to-script'],
      hooksNiche: 'tech',
      guides: ['teleprompter-for-youtube', 'teleprompter-remote-control'],
      records: ['youtube-shorts', 'linkedin-video'],
    },
  },
  {
    slug: 'linkedin-video',
    presetId: 'linkedin-video',
    seo: {
      title: 'Teleprompter for LinkedIn Videos | teleprompter.wtf',
      h1: 'Teleprompter for LinkedIn video',
      description:
        'Record confident vertical or landscape LinkedIn videos from your phone or laptop with the script beside the lens. Free, no signup, no watermark, no upload.',
    },
    directAnswer:
      'Record a clear LinkedIn video with a script placed near the camera. Start with a lesson or a question, then save your finished take and post it from LinkedIn.',
    ctaLabel: 'Record a LinkedIn video now',
    ctaHref: '/studio?preset=linkedin-video',
    trustChips: ['No signup', 'No watermark', 'Saved on your device'],
    howItWorks: [
      {
        title: 'Pick a real lesson',
        text: 'Choose one decision, mistake or result from your work. Write the context before giving advice.',
      },
      {
        title: 'Speak to one colleague',
        text: 'Position the words beside the lens and read at the pace you would use in a conversation.',
      },
      {
        title: 'Review the claim',
        text: 'Check names, figures and permissions before you post. Save the video locally and upload it to LinkedIn.',
      },
    ],
    settingsIntro:
      'The preset starts in portrait, but landscape may suit a desk setup or a demonstration. Choose the frame that shows the person and the work clearly.',
    factIds: ['browser-recording', 'browser-share'],
    settingsTips: [
      'Use a simple background and place a light in front of your face.',
      'Keep the first line direct. A job title alone rarely explains why the viewer should keep watching.',
      'If you mention a client, get permission and avoid details that reveal private work.',
      'Read once as a practice take; remove any sentence that sounds like a written report.',
    ],
    starterScripts: [
      example('self-introduction-video-script', 0),
      example('client-result-case-study-script', 0),
      example('hot-take-script', 1),
    ],
    builtInApp: {
      heading: 'When to use the built-in app teleprompter instead',
      paragraphs: [
        'For a one-line update, recording inside LinkedIn can be quick if its current camera tools meet your needs. Check the app for available prompts and framing controls.',
        'For a planned case study or a reusable introduction, Studio gives you a script you can revise, timed sections and local takes you can review before posting.',
      ],
    },
    faq: [
      {
        question: 'Can I record in landscape?',
        answer:
          'Yes. Change the aspect ratio before recording if a wider frame suits your desk, whiteboard or interview setup.',
      },
      {
        question: 'Should I memorize the script?',
        answer:
          'No. Write short spoken sentences and place the words near the lens so your delivery can stay conversational.',
      },
      {
        question: 'Can I share a client outcome?',
        answer:
          'Only share details you have permission to disclose. Explain the work and result accurately without inventing a number.',
      },
      {
        question: 'Where is the finished video?',
        answer:
          'The take stays on your device until you save or share it. Upload it through LinkedIn when you are ready.',
      },
    ],
    related: {
      templates: [
        'client-result-case-study-script',
        'self-introduction-video-script',
        'hot-take-script',
      ],
      hooksNiche: 'small-business',
      guides: ['how-to-batch-record-videos', 'external-microphone-for-phone-video'],
      records: ['youtube', 'instagram-reels'],
    },
  },
];

export const recordPageBySlug = new Map(recordPages.map((page) => [page.slug, page]));
