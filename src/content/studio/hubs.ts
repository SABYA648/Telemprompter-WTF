import type { HubCopy, RecordHubCopy } from './types';

export const recordHub: RecordHubCopy = {
  seo: {
    title: 'Teleprompter Video Recorder Online | teleprompter.wtf',
    h1: 'Record video with a teleprompter in your browser',
    description:
      'Read your script beside the lens and record vertical or landscape video on your phone or laptop. Free, no signup, no watermark, saved to your device.',
  },
  intro: [
    'Keep your words where your eyes already need to be: near the camera. Write or paste a script, choose a frame and record with the text scrolling at your speaking pace. The camera records your video, while the script stays a reading aid. Review each take on this device, save the one you want and post it wherever you work.',
    'Choose a platform below to start with a useful aspect ratio, duration target and approximate safe-zone overlay. Each preset is only a starting point. You can change the settings before recording, and a longer YouTube video does not need a fixed duration target.',
    'For a quick first take, open a starter script and replace the words in braces with your own. A good script sounds like something you would say to one person. Put the promise in the first line, keep each section short and leave a pause where you need to breathe. If you stumble, restart a section instead of throwing away every useful line.',
    'Video files stay on your device until you save or share them. Nothing is uploaded to this site. Before a longer session, record a short test and listen to it. Check the camera framing, microphone and light while a change is still easy to make.',
  ],
  howToChoose: {
    heading: 'Choose a recording preset',
    paragraphs: [
      'Pick Instagram Reels, YouTube Shorts or TikTok if you want a portrait starting frame. The presets differ in target length and approximate areas to keep clear for each app interface. These guides describe the current platform facts and show the date those facts were checked.',
      'Choose YouTube for a landscape 16:9 setup and a script with sections. Choose LinkedIn video for a work story, introduction or case study. You can also open Studio without a preset and bring your own script. The best choice is the one that matches the video you are actually making, not the account you happen to be logged into.',
    ],
  },
  ctaLabel: 'Record a video',
  ctaHref: '/studio',
  cards: [
    {
      presetId: 'instagram-reels',
      slug: 'instagram-reels',
      summary: 'A portrait Reel with the script close to your front camera.',
    },
    {
      presetId: 'youtube-shorts',
      slug: 'youtube-shorts',
      summary: 'A vertical Short that starts with one clear question or result.',
    },
    {
      presetId: 'tiktok',
      slug: 'tiktok',
      summary: 'A quick story or demonstration to finish in TikTok.',
    },
    {
      presetId: 'youtube',
      slug: 'youtube',
      summary: 'A landscape video you can record a section at a time.',
    },
    {
      presetId: 'linkedin-video',
      slug: 'linkedin-video',
      summary: 'A practical work lesson, case study or introduction.',
    },
  ],
};

export const templatesHub: HubCopy = {
  seo: {
    title: 'Video Script Templates for Reels and YouTube | teleprompter.wtf',
    h1: 'Video script templates',
    description:
      'Twenty fill-in-the-blank script templates for Reels, Shorts, TikTok and YouTube, each timed beat by beat. Open a template in the teleprompter and record it now.',
  },
  intro: [
    'A template gives your idea a shape before you spend time polishing sentences. These twenty scripts cover short tips, stories, demos, announcements, case studies and longer YouTube outlines. Each one has timed beats, two filled examples and a blank version you can open in the teleprompter.',
    'Start by choosing the job of the video. If the viewer needs one fast answer, use a 30-second Reel or FAQ answer. If you need to show a process, choose a tutorial or product demo. If the story depends on a change over time, choose before and after or story time. A ten-minute YouTube outline is for a topic that needs room for chapters, examples and a clear ending.',
    'Replace every phrase in braces with details from your real experience. Then read the script aloud. A 30-second target is about 70 spoken words at 140 words per minute, though your own delivery may be faster or slower. Cut repeated setup before you cut the useful step. Leave a beat for the viewer to see what you are describing.',
    'The examples show how the same structure can work across different niches. They are demonstrations, not claims about your results. Keep your own numbers and outcomes accurate, especially in finance, health, customer stories and product promises.',
  ],
  howToChoose: {
    heading: 'Choose by the result you want',
    paragraphs: [
      'Use a hook first when the audience does not know why the topic matters. Use a three-tip or top-five structure when the items belong together and you can explain each in a sentence. Use a case study when you have permission to share the real starting point, action and outcome. For a launch, say who an offer is for and what is included before asking for a response.',
      'After you choose, open the template in Studio and replace the placeholders. The beat timings are guides. Rehearse once at your normal speaking pace, adjust the text or target and record a short test before you make the final take.',
    ],
  },
};

export const hooksHub: HubCopy = {
  seo: {
    title: 'Hooks for Reels, Shorts and TikTok by Niche | teleprompter.wtf',
    h1: 'Hooks for short videos',
    description:
      'Copy fill-in-the-blank hooks for fitness, finance, food, beauty, real estate, tech, education and small business, then record one in a single tap.',
  },
  intro: [
    'The opening line tells a viewer whether the rest of your video is for them. A useful hook names a concrete problem, result, decision or moment. It gives the video a direction that the next sentence must fulfill. A line that attracts attention but has no payoff makes the rest of the script harder to trust.',
    'Browse hooks for fitness, personal finance, food, beauty, real estate, tech, education and small business. Each niche has twenty-five openings in five groups: curiosity, mistake, result, contrarian and story. Choose the group that matches the idea you actually have, then replace the words in braces with details you can show or explain.',
    'Curiosity works when you can reveal a specific answer. A mistake hook works when you can explain the fix without blaming the viewer. A result hook needs an honest outcome. Contrarian lines need a fair reason, not an argument for its own sake. Story hooks should lead to a real event with a turning point.',
    'Try three versions aloud before recording. Keep the one that sounds like you and that points naturally to the next sentence. If the hook promises a test, show the test. If it promises a lesson, teach it. Make sure a viewer can understand the line without reading the caption.',
  ],
  howToChoose: {
    heading: 'Pair the hook with a script',
    paragraphs: [
      'For one quick answer, pair a hook with the 30-second Reel template. A mistake hook can lead into myth versus fact, while a story opening fits story time or behind the scenes. A result hook can lead to a case study only when you can state the outcome accurately and have permission to share it.',
      'Copy the line into your script or open it in Studio to record. Leave the placeholders until you have chosen the exact person, product or situation. A specific opening usually feels stronger than a broad promise because the viewer can recognize the problem immediately.',
    ],
  },
};
