import type { PresenterPreferences } from '../domain/types';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export type GuideCluster =
  | 'getting_started'
  | 'youtube'
  | 'recording'
  | 'presentation'
  | 'zoom'
  | 'speed'
  | 'voice_tracking'
  | 'mobile';

export interface GuideIllustration {
  src: string;
  alt: string;
}

export interface GuideEmbed {
  intro: string;
  sampleScript: string;
  preset?: Partial<PresenterPreferences>;
}

export interface Guide {
  slug: string;
  cluster: GuideCluster;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  updated: string;
  sections: GuideSection[];
  related: string[];
  illustration?: GuideIllustration;
  embed?: GuideEmbed;
}

export const guides: Guide[] = [
  {
    slug: 'how-to-use-a-teleprompter',
    cluster: 'getting_started',
    updated: '2026-08-23',
    title: 'How to use a teleprompter without sounding scripted',
    description:
      'A practical teleprompter workflow: prepare readable copy, set the right pace, position your screen, rehearse, and deliver naturally.',
    eyebrow: 'Getting started',
    intro:
      'A teleprompter should remove the effort of remembering words, not remove the life from your delivery. The best results come from a readable script, a comfortable setup, and one short rehearsal.',
    sections: [
      {
        heading: 'Write for a voice, not a page',
        paragraphs: [
          'Read the script aloud while editing it. Short sentences are easier to scan, and paragraph breaks create visible moments to breathe. Contractions such as "you\'re" usually sound more natural than formal written phrasing.',
          'If a name, number, or technical term needs special emphasis, put it on its own line. Plain text is enough; clear spacing is more useful in motion than elaborate formatting.',
        ],
      },
      {
        heading: 'Set up the reading position',
        paragraphs: [
          'Place the words as close to the camera lens as your setup allows. On a laptop, move the window toward the top of the display. With teleprompter glass, turn on horizontal mirror mode so the reflection reads correctly.',
          'Choose a text width that lets your eyes take in a line without obvious side-to-side movement. A narrower column is usually better when the camera is close.',
        ],
      },
      {
        heading: 'Find a pace you can lead',
        paragraphs: [
          'Start slower than you think you need. The scroll should follow your voice, not force you to chase it. A conversational delivery often lands around 120-150 words per minute, but clarity matters more than the number.',
        ],
        bullets: [
          'Pause the scroll at a section break if you need to reset.',
          'Reduce speed before a list, quotation, or unfamiliar name.',
          'Leave room to look away from the words and reconnect with the audience.',
        ],
      },
      {
        heading: 'Rehearse once with the real setup',
        paragraphs: [
          'A single full run reveals awkward lines, incorrect timing, screen glare, and camera-placement problems. Edit anything that makes you stumble. During the final take, treat the focus line as a guide rather than a target you must stare at.',
        ],
      },
      {
        heading: 'A simple pre-flight check',
        paragraphs: ['Before you begin, confirm the following:'],
        bullets: [
          'Notifications are silenced and power is connected.',
          'The font is readable from your actual speaking position.',
          'The first few lines sit at a comfortable eye level.',
          'Your pace leaves space for breathing and emphasis.',
          'You know the keyboard or touch control for pause.',
        ],
      },
    ],
    related: [
      'teleprompter-speed',
      'teleprompter-for-video-recording',
      'teleprompter-keyboard-shortcuts',
      'manual-vs-voice-activated-teleprompter',
    ],
    embed: {
      intro:
        'Run this short welcome script to feel the scroll, focus line, and pause control working together.',
      sampleScript:
        'Welcome, and thanks for being here.\nIn the next minute, one practical idea.\nRead this line, then look up and deliver it.\nPause the scroll whenever you need a breath.\nThat rhythm is the whole skill.',
      preset: { speakingWpm: 130 },
    },
  },
  {
    slug: 'teleprompter-for-youtube',
    cluster: 'youtube',
    updated: '2026-08-23',
    title: 'How to use a teleprompter for YouTube videos',
    description:
      'Make YouTube scripts easier to deliver on camera with better hooks, natural phrasing, camera placement, and section-by-section recording.',
    eyebrow: 'YouTube workflow',
    intro:
      'A teleprompter can make YouTube production faster, especially for tutorials, explainers, and sponsor reads. The trick is preserving the energy and directness viewers expect.',
    sections: [
      {
        heading: 'Script the opening tightly',
        paragraphs: [
          'The first thirty seconds carry the most pressure, so write the hook word for word. Say what the viewer will learn, show the outcome early, and remove greetings that delay the useful part. Later sections can be looser if you speak naturally from bullet points.',
        ],
      },
      {
        heading: 'Format for recording, not publishing',
        paragraphs: [
          'Break long explanations into short paragraphs. Put production cues such as "show chart" on separate lines so they are impossible to miss, but avoid reading those cues aloud. Spell difficult names phonetically if that helps you keep momentum.',
          'Use a large enough font that you can scan the next phrase without squinting. A narrow text column near the lens reduces visible eye movement on close shots.',
        ],
      },
      {
        heading: 'Record in sections',
        paragraphs: [
          'You do not need one flawless take. Record the hook, each main section, and the close separately. Restart the prompter at a paragraph boundary and leave a short silence before speaking; the edit will be cleaner.',
        ],
        bullets: [
          'Keep the camera and chair position consistent between takes.',
          'Repeat the final sentence after a stumble instead of restarting everything.',
          'Use B-roll to cover necessary edits or moments when you check notes.',
        ],
      },
      {
        heading: 'Keep delivery conversational',
        paragraphs: [
          'Imagine one specific viewer behind the lens. Vary your pace, let important lines breathe, and use the pause button when you want an unscripted aside. If every sentence has the same length and rhythm, revise the writing before changing the scroll speed.',
        ],
      },
      {
        heading: 'Check your final runtime',
        paragraphs: [
          'Estimate speaking time before recording, then add room for demonstrations, cuts, and visual examples. A 1,300-word script is roughly ten minutes at 130 words per minute before those additions.',
        ],
      },
    ],
    related: [
      'teleprompter-for-video-recording',
      'teleprompter-for-short-form-video',
      'teleprompter-speed',
      'teleprompter-camera-distance-and-font-size',
    ],
    illustration: {
      src: '/illustrations/guides/video-creator.webp',
      alt: 'A creator presenting naturally through a camera-mounted teleprompter',
    },
    embed: {
      intro: 'Practice a tight YouTube opening, with production cues kept on their own lines.',
      sampleScript:
        'Five mistakes ruin small-room audio. Here is the fix.\n[SHOW mic comparison]\nFirst, stop pointing the microphone at the ceiling.\nSecond, move the blanket off the desk.\n[PAUSE for demo]\nBy the end, your voice will sound closer and cleaner.',
      preset: { textWidth: 60, speakingWpm: 150 },
    },
  },
  {
    slug: 'teleprompter-for-video-recording',
    cluster: 'recording',
    updated: '2026-08-23',
    title: 'A practical teleprompter setup for video recording',
    description:
      'Choose a screen position, lens distance, text size, pace, and recording workflow that keeps eye contact natural on camera.',
    eyebrow: 'Camera setup',
    intro:
      'Good prompting is mostly geometry: the words, lens, and speaker need to line up. You can get a convincing result with a laptop, tablet, or phone before investing in dedicated glass.',
    sections: [
      {
        heading: 'Choose the simplest workable rig',
        paragraphs: [
          'For a webcam, place a small browser window directly below the lens. For a camera several feet away, a tablet near the lens can work. Beam-splitter glass is useful when direct eye contact is critical; horizontal mirroring makes the reflected text readable.',
        ],
      },
      {
        heading: 'Match text size to distance',
        paragraphs: [
          'Set your camera first, sit or stand in the final position, and increase the font until reading is effortless. Do not compensate for small text by leaning toward the screen. Narrow the text column if your eyes visibly travel across each line.',
          'The focus guide should sit close to lens height. It keeps the current phrase in a predictable place and reduces vertical eye movement.',
        ],
      },
      {
        heading: 'Protect the recording',
        paragraphs: [
          'A browser teleprompter is intentionally simple, but the rest of the device can still interrupt a take.',
        ],
        bullets: [
          'Turn on Do Not Disturb and close messaging apps.',
          'Connect power and prevent automatic sleep.',
          'Use fullscreen to remove browser chrome once the script is ready.',
          'Keep a local backup of the script in your writing app for long productions.',
        ],
      },
      {
        heading: 'Balance reading and performance',
        paragraphs: [
          'Keep your head movement natural, blink normally, and look away when the moment calls for it. If the scroll runs ahead while you gesture or demonstrate something, pause it. The audience notices rushed delivery more than a clean edit.',
        ],
      },
      {
        heading: 'Run a short camera test',
        paragraphs: [
          'Record thirty seconds and watch only the eyes. If they sweep left to right, narrow the text. If they drift downward, move the focus position up. If the voice becomes flat, slow the scroll and rewrite long sentences.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'teleprompter-for-youtube',
      'teleprompter-for-phone-and-tablet',
      'teleprompter-camera-distance-and-font-size',
    ],
    illustration: {
      src: '/illustrations/guides/video-creator.webp',
      alt: 'A creator presenting naturally through a camera-mounted teleprompter',
    },
    embed: {
      intro: 'Load this thirty-second camera test and watch only your eye line on playback.',
      sampleScript:
        'Testing, one, two.\nI am looking straight into the lens.\nThe words sit just below the camera.\nIf my eyes sweep sideways, the column is too wide.\nIf my eyes drop, the window needs to move up.',
      preset: { textWidth: 55, focusPosition: 30 },
    },
  },
  {
    slug: 'teleprompter-camera-distance-and-font-size',
    cluster: 'recording',
    updated: '2026-08-23',
    title: 'Teleprompter camera distance, font size, and line width guide',
    description:
      'Calculate ideal teleprompter font size, viewing distance, line length, and camera placement to minimize visible eye movement on video.',
    eyebrow: 'Optical geometry',
    intro:
      'Visible teleprompter reading happens when the visual angle between your screen and the camera lens is too wide, or when lines are too long. Simple geometry fixes both before you record a single line.',
    sections: [
      {
        heading: 'The optical geometry of eye contact',
        paragraphs: [
          'When looking directly into a camera lens, your line of sight forms a reference axis. If your teleprompter sits 4 inches below the lens at a distance of 2 feet (a typical laptop webcam distance), your visual angle is about 9.5 degrees. That downward gaze is noticeable to viewers.',
          'Pushing the camera and screen back to 5 or 6 feet drops that visual angle to under 3.5 degrees, making eye gaze appear directly aligned with the lens even without expensive beam-splitter glass.',
        ],
      },
      {
        heading: 'The font size distance rule',
        paragraphs: [
          'A reliable starting formula for teleprompter typography is:',
          'Font Size in Pixels ≈ Distance in Feet × 12px (or Distance in Meters × 40px).',
          'At 2 feet (desktop/webcam), 24px to 32px is crisp and legible. At 5 feet (stand mounted tablet), 60px to 72px allows effortless scanning without squinting or leaning forward.',
        ],
        bullets: [
          '1.5 to 2.5 feet (Webcam/Laptop): 24px - 36px font, 40% - 55% column width.',
          '3.0 to 5.0 feet (Desktop / Desk Rig): 40px - 58px font, 50% - 65% column width.',
          '6.0 to 10.0 feet (Studio Stand / Beam Splitter): 70px - 110px font, 65% - 80% column width.',
        ],
      },
      {
        heading: 'Line width and horizontal tracking',
        paragraphs: [
          'Horizontal eye scanning ("tennis match eyes") occurs when a line contains more than 6 to 8 words across. Viewers quickly detect rapid side-to-side saccades.',
          'Keep your text width narrow (between 30 and 45 characters per line). A narrow column allows your eyes to take in entire phrase clusters in single fixations without sweeping across the display.',
        ],
      },
      {
        heading: 'Focus line placement',
        paragraphs: [
          'Always position the focus guide line in the upper third of the screen (between 25% and 35% from the top). This keeps the active line closest to the top of your monitor or webcam, minimizing the distance your gaze drifts downward.',
        ],
      },
      {
        heading: 'The 5-second test video',
        paragraphs: [
          'Before filming your complete take, record 5 seconds reading the first two sentences. Play it back on full screen and watch exclusively for:',
        ],
        bullets: [
          'Horizontal eye darting: if present, reduce Text Width slider by 10%.',
          'Squinting or head tilting: if present, increase Font Size by 4px.',
          'Downward gaze: if present, move the window higher or push the entire setup farther back.',
        ],
      },
    ],
    related: [
      'teleprompter-for-video-recording',
      'how-to-maintain-eye-contact',
      'how-to-use-a-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/mirrored-glass.webp',
      alt: 'Script light reflecting from a tablet through teleprompter glass toward a speaker',
    },
    embed: {
      intro: 'Step back from your screen and find the smallest font that still reads effortlessly.',
      sampleScript:
        'The font is large enough to read without leaning.\nEach line holds only a few words.\nMy eyes stay near the top of the screen.\nIf this feels cramped, narrow the column.\nIf I squint, the font goes up four pixels.',
      preset: { fontSize: 64, textWidth: 50, focusPosition: 30 },
    },
  },
  {
    slug: 'teleprompter-for-presentations',
    cluster: 'presentation',
    updated: '2026-08-23',
    title: 'Using a teleprompter for talks and presentations',
    description:
      'Use a teleprompter as a safety net for speeches and presentations without losing audience connection or slide awareness.',
    eyebrow: 'Live presentations',
    intro:
      'For a live talk, a teleprompter works best as a confidence layer, not a wall of prose. The audience still needs your attention, and slides or demonstrations need room to breathe.',
    sections: [
      {
        heading: 'Decide what must be exact',
        paragraphs: [
          'Script high-stakes wording: the opening, key claims, transitions, quotations, legal language, and the close. For familiar examples, concise prompts may feel more natural than complete paragraphs.',
        ],
      },
      {
        heading: 'Build visible landmarks',
        paragraphs: [
          'Start each major section with a short heading on its own line. Add blank lines before slide changes or demonstrations. These landmarks help you recover quickly after taking a question or looking away from the screen.',
        ],
      },
      {
        heading: 'Plan for the room',
        paragraphs: [
          'Test from the exact standing position and account for the venue display, lighting, and Wi-Fi restrictions. Because the core teleprompter runs locally after the page loads, your script does not depend on a server connection during delivery. Still, open the page and paste the final script before going on stage.',
        ],
        bullets: [
          'Use a large font and high contrast.',
          'Keep controls within easy reach of you or an operator.',
          'Rehearse slide changes with the prompter pace.',
          'Know how to pause immediately if the audience reacts.',
        ],
      },
      {
        heading: 'Look up on complete thoughts',
        paragraphs: [
          'Read a phrase, then deliver it to the room. This creates natural eye contact and prevents the constant tracking motion associated with obvious reading. Slower scrolling makes that rhythm possible.',
        ],
      },
      {
        heading: 'Prepare a failure-safe version',
        paragraphs: [
          'Keep a one-page outline with the opening, section order, and closing line. Technology can fail; a compact outline lets you continue without trying to recreate the full script from memory.',
        ],
      },
    ],
    related: [
      'teleprompter-for-webinars',
      'how-to-use-a-teleprompter',
      'teleprompter-speed',
      'manual-vs-voice-activated-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/speech-stage.webp',
      alt: 'A speaker at a lectern using two discreet teleprompter glass panels',
    },
    embed: {
      intro: 'Rehearse a talk opening with a large, centered column at a deliberate pace.',
      sampleScript:
        'Good morning, and thank you for being here.\nIn the next ten minutes, one idea.\n[ADVANCE SLIDE]\nHere is the problem we set out to solve.\nAnd here is what changed when we solved it.',
      preset: { fontSize: 72, baseScrollSpeed: 3, speakingWpm: 120, alignment: 'center' },
    },
  },
  {
    slug: 'teleprompter-for-zoom',
    cluster: 'zoom',
    updated: '2026-08-23',
    title: 'How to use a teleprompter on Zoom and video calls',
    description:
      'Place notes close to the webcam, stay present in the conversation, and use a teleprompter effectively for Zoom meetings and webinars.',
    eyebrow: 'Video calls',
    intro:
      'On a call, the goal is not a flawless monologue. A teleprompter is most useful for openings, demos, difficult explanations, and closing summaries while leaving space to listen.',
    sections: [
      {
        heading: 'Keep the text near the webcam',
        paragraphs: [
          'Resize the prompter window into a narrow column and position it directly below the camera. Keep the meeting participants close by so shifting between people and notes requires only a small eye movement.',
        ],
      },
      {
        heading: 'Prompt the parts you control',
        paragraphs: [
          'Write the opening, agenda, key messages, questions, and close. Do not create a continuously scrolling answer for an unpredictable discussion. Pause while someone else speaks, then restart at the next prepared section.',
        ],
      },
      {
        heading: 'Avoid competing shortcuts',
        paragraphs: [
          'Meeting apps and browsers both use keyboard shortcuts. Click the presenter before using its keys, and learn the pause control before the call. If you share your screen, share only the intended window, not the display containing private notes.',
        ],
      },
      {
        heading: 'Use concise, scannable notes',
        paragraphs: [
          'Calls require active listening. Short prompts let you find the next point without mentally leaving the conversation. Put names, numbers, and questions on separate lines, and leave generous blank space between agenda items.',
        ],
        bullets: [
          'Use full sentences for exact claims or formal introductions.',
          'Use short prompts for discussion points you already understand.',
          'Pause the scroll whenever the conversation changes direction.',
        ],
      },
      {
        heading: 'Practice window placement',
        paragraphs: [
          'Run a private test meeting and record thirty seconds. Check whether your eyes look close enough to the lens, whether notifications overlap the script, and whether the text remains reachable when the meeting controls appear.',
        ],
      },
    ],
    related: [
      'teleprompter-for-interviews',
      'teleprompter-for-presentations',
      'how-to-maintain-eye-contact',
    ],
    illustration: {
      src: '/illustrations/guides/remote-meeting.webp',
      alt: 'A speaker reading near a laptop camera during a remote meeting',
    },
    embed: {
      intro: 'Keep a narrow column of agenda prompts just under your webcam.',
      sampleScript:
        'Welcome, everyone.\nToday: budget, timeline, next steps.\nQ3 spend came in under plan.\nQuestion for Sam: launch date?\nClose with decisions and owners.',
      preset: { textWidth: 45, focusPosition: 30, fontSize: 40 },
    },
  },
  {
    slug: 'teleprompter-speed',
    cluster: 'speed',
    updated: '2026-08-23',
    title: 'How to choose the right teleprompter speed',
    description:
      'Understand words per minute, calculate script timing, and adjust teleprompter scroll speed for a clear and natural delivery.',
    eyebrow: 'Pace and timing',
    intro:
      'There is no universal teleprompter speed. The right pace is the one that leaves enough attention for meaning, eye contact, and breath. Words per minute gives you a useful starting point.',
    sections: [
      {
        heading: 'Start around 120-150 words per minute',
        paragraphs: [
          'Many conversational presentations fit in this range. A deliberate explanation may sit near 100-120 WPM, while an energetic short video can reach 150-180 WPM. Dense or emotional material usually benefits from a slower pace.',
        ],
      },
      {
        heading: 'Calculate the required pace',
        paragraphs: [
          'Divide the number of words by the available minutes. A 650-word script delivered in five minutes requires 130 WPM. If the result is uncomfortable, shorten the script rather than forcing the scroll higher.',
        ],
      },
      {
        heading: 'Tune the screen, not only the number',
        paragraphs: [
          'Scroll speed is measured in screen movement, while speaking pace is measured in words. Font size, line height, text width, and paragraph spacing all change how quickly the text must move. Set appearance first, then tune speed during a rehearsal.',
        ],
      },
      {
        heading: 'Watch for signs of the wrong pace',
        paragraphs: ['Your delivery tells you more than the slider value.'],
        bullets: [
          'Too fast: clipped endings, shallow breaths, little eye contact, and a rising voice.',
          'Too slow: waiting for the next line, unnatural pauses, and reading ahead repeatedly.',
          'About right: you can glance away, emphasize a phrase, and return without losing your place.',
        ],
      },
      {
        heading: 'Rehearse the difficult section',
        paragraphs: [
          'Instead of testing only the easy opening, rehearse the densest paragraph or list. Set a speed that works there. Small adjustments during the final delivery are normal, especially after pauses or demonstrations.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'teleprompter-for-youtube',
      'manual-vs-voice-activated-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/script-pacing.webp',
      alt: 'Short and long script cards following a calm visual rhythm into a teleprompter',
    },
    embed: {
      intro: 'Feel how 130 words per minute actually moves before you commit to a number.',
      sampleScript:
        'This sentence moves at a steady conversational pace.\nSlow down before the important number: 142.\nLet the short lines breathe.\nSpeed up only when the words feel easy.\nIf you are chasing the scroll, it is too fast.',
      preset: { speakingWpm: 130 },
    },
  },
  {
    slug: 'what-is-a-teleprompter',
    cluster: 'getting_started',
    updated: '2026-08-23',
    title: 'What is a teleprompter and how does it work?',
    description:
      'A clear explanation of teleprompter screens, beam-splitter glass, software scrolling, speaker control, and when a prompt is useful.',
    eyebrow: 'Essential concepts',
    intro:
      "A teleprompter puts prepared words close to the speaker's line of sight. The audience sees steady eye contact while the speaker sees a readable script. The basic idea is simple, but the setup changes between a webcam, a stage, and a camera rig.",
    sections: [
      {
        heading: 'The screen-only setup',
        paragraphs: [
          'The simplest teleprompter is software on a laptop, tablet, or phone. The script scrolls while you speak. Placing the window near a webcam reduces visible eye movement and works well for calls, presentations, and quick recordings.',
          'A browser teleprompter needs no dedicated hardware. It is also useful for rehearsal because you can test timing, line breaks, and font size before committing to a camera setup.',
        ],
      },
      {
        heading: 'How beam-splitter glass works',
        paragraphs: [
          'A camera teleprompter places partially reflective glass in front of the lens. A screen below or above the glass shows horizontally mirrored words. The presenter sees the reflection while the camera records through the glass.',
          'Mirror mode reverses the software image so the reflected text reads normally. Camera alignment, glass quality, screen brightness, and the distance to the presenter determine how convincing the eye contact looks.',
        ],
      },
      {
        heading: 'Who controls the scroll',
        paragraphs: [
          'Traditional prompting uses a fixed speed, keyboard, remote, pedal, or a separate operator. Voice-assisted software can respond to speaking rhythm or recognize words and locate the presenter in a known script.',
          'No method removes the need for a pause control. Audience reactions, demonstrations, and ad-libs change timing, so the presenter should always have an immediate manual fallback.',
        ],
      },
      {
        heading: 'When a teleprompter helps',
        paragraphs: [
          'A prompt is useful when wording, timing, or confidence matters. Common examples include video introductions, product demonstrations, training, speeches, webinars, and difficult statements that must be delivered accurately.',
        ],
        bullets: [
          'Use full scripts for precise or regulated wording.',
          'Use short prompts when you know the subject but need structure.',
          'Use an outline when interaction matters more than exact phrasing.',
        ],
      },
      {
        heading: 'What a teleprompter cannot fix',
        paragraphs: [
          'A prompt cannot make dense writing conversational. It also cannot choose your emphasis, breathing, or eye contact. Good results begin with spoken-language writing and one rehearsal using the real screen position.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'how-to-read-a-teleprompter-naturally',
      'teleprompter-mirror-mode-glass',
    ],
    illustration: {
      src: '/illustrations/guides/mirrored-glass.webp',
      alt: 'Script light reflecting from a tablet through teleprompter glass toward a speaker',
    },
    embed: {
      intro: 'See the basic idea working: words near the lens, scrolling at your pace.',
      sampleScript:
        'A teleprompter shows your words near the lens.\nThe audience sees steady eye contact.\nYou see a calm, readable script.\nThe scroll follows your delivery.\nNothing else is required.',
      preset: { fontSize: 56 },
    },
  },
  {
    slug: 'how-to-read-a-teleprompter-naturally',
    cluster: 'presentation',
    updated: '2026-08-23',
    title: 'How to read a teleprompter naturally',
    description:
      'Practical delivery techniques for natural pacing, emphasis, breathing, eye contact, and recovery when reading a teleprompter.',
    eyebrow: 'Delivery technique',
    intro:
      'Natural delivery comes from leading the words instead of chasing them. Set the screen so you can see a complete thought, rehearse the difficult lines, and give yourself permission to pause.',
    sections: [
      {
        heading: 'Understand the thought before reading it',
        paragraphs: [
          'Read far enough ahead to understand the next phrase, then speak it to the audience. If you discover the meaning one word at a time, your voice will sound flat and your eyes will visibly track the line.',
        ],
      },
      {
        heading: 'Write visible breathing room',
        paragraphs: [
          'Use paragraph breaks at changes of idea. Put a difficult number, name, or instruction on its own line. The screen should show the rhythm of the delivery instead of looking like a dense page from a report.',
        ],
      },
      {
        heading: 'Vary pace on purpose',
        paragraphs: [
          'Slow down before an important claim and allow a beat after it. Move more quickly through a familiar transition. A fixed scroll can still work if its baseline is slightly slower than your average voice and you pause at section boundaries.',
        ],
      },
      {
        heading: 'Look away at safe moments',
        paragraphs: [
          'At the end of a complete thought, glance toward a person, slide, or product. Return to the focus region before starting the next sentence. Short intentional movement looks natural; constant side-to-side reading does not.',
        ],
      },
      {
        heading: 'Recover without apologizing',
        paragraphs: [
          'If you stumble, stop, breathe, return to the start of the thought, and continue. For recorded video, leave a clean pause that makes the edit simple. For live delivery, the audience usually notices less than you think.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'how-to-maintain-eye-contact',
      'manual-vs-voice-activated-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/speech-stage.webp',
      alt: 'A speaker at a lectern using two discreet teleprompter glass panels',
    },
    embed: {
      intro: 'Practice reading a thought, looking up, and delivering it as your own.',
      sampleScript:
        'Read this thought, then look up.\nDeliver it like you just thought of it.\nBreathe at the end of the line.\nGlance away after a complete sentence.\nReturn before the next one begins.',
      preset: { speakingWpm: 120, baseScrollSpeed: 2 },
    },
  },
  {
    slug: 'how-to-maintain-eye-contact',
    cluster: 'presentation',
    updated: '2026-08-23',
    title: 'How to maintain eye contact with a teleprompter',
    description:
      'Reduce visible reading with better camera placement, narrower lines, a stable focus region, and deliberate moments away from the script.',
    eyebrow: 'Eye contact',
    intro:
      'Good teleprompter eye contact is mostly geometry. Put the words close to the lens, reduce the distance your eyes travel, and stop treating every line as something you must stare at.',
    sections: [
      {
        heading: 'Move the text toward the lens',
        paragraphs: [
          'For a webcam, use a narrow window directly below or beside the camera. For a physical prompter, center the lens behind the glass and keep the script column aligned with it. The farther your eyes move from the lens, the more obvious the read becomes.',
        ],
      },
      {
        heading: 'Narrow the line length',
        paragraphs: [
          'A wide paragraph forces horizontal eye movement. Reduce the text width until a line can be scanned without moving your gaze across the whole display. Increase font size to match the real reading distance rather than the size that looks tidy on a desk.',
        ],
      },
      {
        heading: 'Keep a stable focus region',
        paragraphs: [
          'A focus guide helps the active sentence stay near the same height. Place it close to the lens and let incoming text remain visible below it. Avoid reading at the very top or bottom of the screen, where your eyelids and head position change.',
        ],
      },
      {
        heading: 'Break eye contact like a speaker',
        paragraphs: [
          'Real conversation includes small shifts. Look away after a complete sentence, when pointing to a visual, or while taking a breath. Return before the next thought begins. The goal is convincing attention, not an unbroken stare.',
        ],
      },
      {
        heading: 'Check a recording from the audience view',
        paragraphs: [
          'Record thirty seconds with your final camera distance. Watch once with sound off. Eye movement, head tilt, glare, and poor lens alignment become much easier to see. Fix the physical position before rewriting a good script.',
        ],
      },
    ],
    related: [
      'how-to-read-a-teleprompter-naturally',
      'teleprompter-for-video-recording',
      'teleprompter-camera-distance-and-font-size',
    ],
    illustration: {
      src: '/illustrations/guides/speech-stage.webp',
      alt: 'A speaker at a lectern using two discreet teleprompter glass panels',
    },
    embed: {
      intro: 'Set a narrow column and a high focus line, then record thirty seconds of yourself.',
      sampleScript:
        'My eyes stay close to the lens here.\nShort lines mean small movements.\nA complete thought, then a glance away.\nBack in time for the next sentence.\nThe viewer sees attention, not reading.',
      preset: { textWidth: 50, focusPosition: 30 },
    },
  },
  {
    slug: 'how-to-format-a-teleprompter-script',
    cluster: 'getting_started',
    updated: '2026-08-23',
    title: 'How to format a teleprompter script for easy reading',
    description:
      'Format spoken copy with short paragraphs, useful line breaks, visible emphasis, pronunciation help, and clean transitions.',
    eyebrow: 'Script formatting',
    intro:
      'A teleprompter script is a performance document. It should make the next thought obvious at a glance and remove visual decisions while you are speaking.',
    sections: [
      {
        heading: 'Use short spoken sentences',
        paragraphs: [
          'Replace nested clauses with two clear sentences. Use contractions when you would use them in conversation. Read every paragraph aloud, because a sentence that scans well on paper can still be awkward to say.',
        ],
      },
      {
        heading: 'Give each idea its own paragraph',
        paragraphs: [
          'Paragraph breaks are navigation landmarks. Start a new block when the topic changes, when a visual appears, or when you want a deliberate pause. Avoid breaking every sentence, which can remove useful context.',
        ],
      },
      {
        heading: 'Make difficult details visible',
        paragraphs: [
          'Place a critical number, unfamiliar name, URL, or quotation on a separate line. Spell out a pronunciation in the way you need to say it. For live work, mark stage directions with a consistent plain-text convention that cannot be mistaken for spoken copy.',
        ],
      },
      {
        heading: 'Cut anything you would skip',
        paragraphs: [
          'If you repeatedly paraphrase a line in rehearsal, rewrite it in that natural wording. If you repeatedly skip a sentence, it probably does not earn its place. A shorter script at a comfortable pace is better than a complete script delivered too quickly.',
        ],
      },
      {
        heading: 'Test the final display settings',
        paragraphs: [
          'Formatting and display settings interact. Choose font size, line height, text width, and focus position on the real device. Then rehearse the densest section and adjust paragraph spacing or pace before the take.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'teleprompter-speed',
      'teleprompter-for-short-form-video',
    ],
    illustration: {
      src: '/illustrations/guides/script-pacing.webp',
      alt: 'Short and long script cards following a calm visual rhythm into a teleprompter',
    },
    embed: {
      intro: 'See how short lines and isolated numbers read once the text starts moving.',
      sampleScript:
        'Short sentences read best.\nPut a hard number on its own line.\n1,400 registrations.\nBreak here before the next idea.\nThen continue with something easy to say.',
      preset: { lineHeight: 1.6, textWidth: 55 },
    },
  },
  {
    slug: 'voice-activated-teleprompters',
    cluster: 'voice_tracking',
    updated: '2026-08-23',
    title: 'How voice-activated teleprompters follow your speech',
    description:
      'Compare volume detection, browser speech recognition, and local speech models for teleprompter voice tracking, privacy, and reliability.',
    eyebrow: 'Voice tracking',
    intro:
      'Voice-controlled scrolling can mean three very different things. Some tools react to sound, some use a browser speech service, and some run a speech model on the device. The difference matters for both accuracy and privacy.',
    sections: [
      {
        heading: 'Rhythm tracking reacts to speech activity',
        paragraphs: [
          'A lightweight system measures microphone energy, estimates when speech is active, and adjusts a base speed. It can pause during silence and resume smoothly without knowing what was said. This approach is fast, small, and language independent.',
          'Its limitation is position. If you skip a paragraph, a rhythm tracker knows that you are speaking but not where you landed in the script.',
        ],
      },
      {
        heading: 'Speech recognition can locate words',
        paragraphs: [
          'A recognition system turns recent audio into a temporary text fragment and compares that fragment with the known script. Continuity helps distinguish repeated phrases. Strong matches can correct the scroll after a skipped paragraph or a change in pace.',
          'Recognition does not need to produce a publishable transcript. For prompting, approximate words and a robust alignment engine are enough to estimate position.',
        ],
      },
      {
        heading: 'Browser speech APIs may use a service',
        paragraphs: [
          'A built-in browser speech-recognition interface does not automatically guarantee local processing. The implementation and network behavior can depend on the browser. If privacy is central, ask whether audio is processed on the device and verify actual network requests.',
        ],
      },
      {
        heading: 'Local models trade bandwidth for privacy',
        paragraphs: [
          'An on-device model requires a deliberate download, storage, memory, and processing time. In exchange, the application can keep microphone audio and recognition text local. Small models are usually sufficient because the script is already known.',
        ],
      },
      {
        heading: 'A hybrid controller is safer',
        paragraphs: [
          'Recognition confidence changes during pauses, ad-libs, noise, and repeated lines. A good controller does not jump on one uncertain result. It uses rhythm when confidence is low, gentle corrections when confidence is medium, and stronger evidence before a larger position change.',
          'teleprompter.wtf calls these two local paths Smart Pace and Private Precision. Its private voice tracking page documents the complete implementation boundary.',
        ],
      },
    ],
    related: [
      'teleprompter-speed',
      'how-to-use-a-teleprompter',
      'manual-vs-voice-activated-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/script-pacing.webp',
      alt: 'Short and long script cards following a calm visual rhythm into a teleprompter',
    },
    embed: {
      intro:
        'This practice prompter starts in manual mode; try the same script with voice follow in the full app.',
      sampleScript:
        'Speak, and the page should keep up.\nPause here, and notice the scroll waiting.\nSkip ahead a line, then find your place again.\nRhythm matters more than raw speed.\nA good prompter forgives an ad-lib.',
      preset: { speakingWpm: 130 },
    },
  },
  {
    slug: 'manual-vs-voice-activated-teleprompter',
    cluster: 'voice_tracking',
    updated: '2026-08-23',
    title: 'Manual vs. voice-activated teleprompter: which should you choose?',
    description:
      'Compare fixed-speed manual scrolling, cadence-based Smart Pace, and recognition-based Private Precision across speeches, courses, and calls.',
    eyebrow: 'Mode selection',
    intro:
      'Neither manual scrolling nor voice tracking is universally superior. The right choice depends on whether your priority is strict timing, conversational freedom, or offline resilience.',
    sections: [
      {
        heading: 'When Manual fixed-speed scrolling wins',
        paragraphs: [
          'Manual mode maintains a constant elapsed-time speed regardless of room noise or acoustic interruptions. It is the best choice for:',
        ],
        bullets: [
          'Time-critical keynote speeches where you have a hard stop (e.g., exactly 10 minutes).',
          'Live stages with heavy acoustic feedback, loud PA systems, or audience applause.',
          'Offline presentations in venues with zero internet or strict browser permissions.',
          'Presenters who prefer pacing their delivery against a metronomic visual guide.',
        ],
      },
      {
        heading: 'When Smart Pace rhythm following wins',
        paragraphs: [
          'Smart Pace listens to speech presence without speech-to-text. It adjusts scroll rate dynamically and pauses automatically when you stop to take a breath, answer a quick question, or show a prop.',
          'Because it requires zero download and zero model initialization, Smart Pace is the recommended default for YouTube creators, online teachers, and casual video calls.',
        ],
      },
      {
        heading: 'When Private Precision word alignment wins',
        paragraphs: [
          'Private Precision Beta downloads an on-device Whisper model to match spoken words against script tokens. It is ideal when you need the prompter to track your exact location through longer takes where you might ad-lib, repeat a line, or skip a sentence.',
          'Because the model runs locally, your script and voice never touch a cloud server, but it does require a modern laptop or desktop with sufficient memory.',
        ],
      },
      {
        heading: 'Summary comparison table',
        paragraphs: ['Here is how the three modes compare on key production criteria:'],
        bullets: [
          'Manual: 0 MB download, 0% CPU overhead, no mic required, fixed pacing.',
          'Smart Pace: 0 MB download, <1% CPU overhead, microphone required, rhythm following.',
          'Private Precision: ~67 MB one-time download, moderate CPU overhead, microphone required, verbatim script tracking with Smart Pace fallback.',
        ],
      },
      {
        heading: 'The hybrid recommendation',
        paragraphs: [
          'For most creators, start with Smart Pace. If you find yourself frequently pausing or improvising and want position recovery, enable Private Precision Beta. If you are speaking in an auditorium or on a stage, switch to Manual.',
        ],
      },
    ],
    related: ['voice-activated-teleprompters', 'teleprompter-speed', 'how-to-use-a-teleprompter'],
    embed: {
      intro: 'Feel the manual baseline: a fixed scroll that never waits for you.',
      sampleScript:
        'Manual mode: the scroll never waits.\nCount out a deliberate pause.\nOne.\nTwo.\nResume on your own timing.\nThat control is the point.',
      preset: { baseScrollSpeed: 3 },
    },
  },
  {
    slug: 'teleprompter-for-phone-and-tablet',
    cluster: 'mobile',
    updated: '2026-08-23',
    title: 'Using a teleprompter on phones and tablets',
    description:
      'Run a browser teleprompter on iPhone, iPad, or Android: orientation, fullscreen, touch control, and keeping the small screen near the camera lens.',
    eyebrow: 'Phones and tablets',
    intro:
      "A phone or tablet is often the most practical prompter you own: small enough to sit beside a lens and bright enough to read at arm's length. The same browser page works on iPhone, iPad, and Android with nothing to install.",
    sections: [
      {
        heading: 'One browser page, no app required',
        paragraphs: [
          'Open the teleprompter in Safari on iPhone or iPad, or in Chrome on Android, and paste your script. Once the page has loaded, the scrolling itself does not depend on the network, so a weak connection mid-recording will not freeze your words.',
          'Because nothing installs, the same script and settings move with you: rehearse on a laptop, then open the page on the phone that will sit beside the camera.',
        ],
      },
      {
        heading: 'Choose orientation and go fullscreen',
        paragraphs: [
          'Portrait suits a phone mounted directly under or beside the lens, because the narrow column matches the shape of the screen. Landscape gives a tablet a wider, calmer column for a desk rig or a beam-splitter mount.',
          'Hide the browser chrome once the script is ready. On iOS, adding the page to your Home Screen opens it without the address bar; on Android, the fullscreen control or an installed shortcut does the same job.',
        ],
      },
      {
        heading: 'Prepare the device itself',
        paragraphs: [
          'Small devices interrupt recordings in ways laptops do not, so prepare them like camera gear.',
        ],
        bullets: [
          'Silence notifications and calls before the take.',
          'Disable auto-lock so the screen cannot sleep mid-sentence.',
          'Connect power for anything longer than a few minutes.',
          'Turn the brightness up enough to read without leaning in.',
        ],
      },
      {
        heading: 'Keep the device near the lens',
        paragraphs: [
          "The small screen is the advantage: a phone can sit immediately below a camera lens where a laptop never fits. At arm's length, the downward glance nearly disappears for the viewer. If you mount the phone beside the lens instead, keep the column narrow so your eyes travel less than an inch from the camera.",
          'A tablet works the same way one step farther back. Increase the font size rather than pulling the device closer than your focus distance.',
        ],
      },
      {
        heading: 'Write for a small display',
        paragraphs: [
          'Small screens reward generous formatting. Keep sentences short, give every cue its own line, and use blank lines between ideas so a quick glance always finds the next thought. Rehearse once on the actual device, because a column width that felt right on a laptop often needs adjusting on a phone.',
        ],
      },
    ],
    related: [
      'how-to-use-a-teleprompter',
      'teleprompter-for-video-recording',
      'teleprompter-camera-distance-and-font-size',
    ],
    illustration: {
      src: '/illustrations/guides/mobile-teleprompter.webp',
      alt: 'A phone teleprompter mounted beside a camera for natural eye contact',
    },
    embed: {
      intro: 'This practice prompter is sized the way a phone beside a lens should feel.',
      sampleScript:
        'This screen is small, and that is fine.\nThe words sit right next to the lens.\nShort lines keep my eyes still.\nOne tap pauses when I need a breath.\nThe viewer sees me, not the script.',
      preset: { fontSize: 48, textWidth: 85, baseScrollSpeed: 3 },
    },
  },
  {
    slug: 'teleprompter-for-online-courses',
    cluster: 'youtube',
    updated: '2026-08-23',
    title: 'Teleprompter workflow for recording online courses',
    description:
      'Script lessons that sound like teaching, keep module structure consistent, and record course videos in clean segments with a teleprompter.',
    eyebrow: 'Online courses',
    intro:
      'Course recording rewards consistency: the same framing, the same lesson rhythm, and wording that explains instead of performs. A teleprompter keeps all three stable across dozens of lessons recorded weeks apart.',
    sections: [
      {
        heading: 'Script lessons as spoken teaching',
        paragraphs: [
          'Write the way you explain things to one person sitting nearby. Define each term the first time it appears, and put worked examples in the script word for word, because improvising an example on camera rarely survives the edit.',
          'Read each lesson aloud before recording. If a sentence needs a diagram to make sense, move the sentence after the diagram appears and note the cue on its own line.',
        ],
      },
      {
        heading: 'Give every module the same skeleton',
        paragraphs: [
          'Students relax when the structure is predictable. Repeating a simple skeleton across lessons also speeds up your scripting, because you are filling sections instead of inventing a form each time.',
        ],
        bullets: [
          'State the outcome of the lesson in the first two lines.',
          'Teach one concept, then show one example.',
          'Recap the single point worth remembering.',
          'Name what the next lesson covers.',
        ],
      },
      {
        heading: 'Record in segments, not whole lessons',
        paragraphs: [
          'A ten-minute lesson is easier as four clean segments than one perfect take. Restart the prompter at a section boundary, hold a beat of silence, and begin again. Consistent framing makes the cuts invisible, and short segments keep a bad take from costing you the whole lesson.',
        ],
      },
      {
        heading: 'Keep names and numbers exact',
        paragraphs: [
          'Courses are full of details that must be right: version numbers, commands, formulas, deadlines. Put each one on its own line in the script so your eyes catch it early, and slow the scroll before you reach it. A verbal slip in a lesson gets replayed by every student who follows it.',
        ],
      },
      {
        heading: 'Check pacing across the whole course',
        paragraphs: [
          "Teaching pace is usually steadier than promotional video: around 130-140 words per minute leaves room to think along with the material. Estimate each lesson's runtime from its word count before recording, and trim scripts that run long rather than speeding up your voice.",
        ],
      },
    ],
    related: [
      'teleprompter-for-youtube',
      'how-to-format-a-teleprompter-script',
      'teleprompter-speed',
    ],
    illustration: {
      src: '/illustrations/guides/video-creator.webp',
      alt: 'A creator presenting naturally through a camera-mounted teleprompter',
    },
    embed: {
      intro: 'Rehearse a lesson opening with the structure your students will learn to expect.',
      sampleScript:
        'In this lesson, you will wire up the final circuit.\nBy the end, the LED should respond to the sensor.\nFirst, gather the three parts from module two.\n[SHOW parts on desk]\nWatch the polarity here; it is the common mistake.',
      preset: { textWidth: 60, speakingWpm: 140 },
    },
  },
  {
    slug: 'teleprompter-for-podcasts',
    cluster: 'recording',
    updated: '2026-08-23',
    title: 'Using a teleprompter for podcast intros, outros, and ad reads',
    description:
      'Script podcast intros and sponsor reads word for word while keeping the conversation itself unscripted and natural.',
    eyebrow: 'Podcasting',
    intro:
      'Most of a good episode is unscripted, and it should stay that way. A teleprompter earns its place at the edges: the cold open, the intro, sponsor reads with required wording, and the outro.',
    sections: [
      {
        heading: 'Script only the edges',
        paragraphs: [
          'The first sixty seconds decide whether a listener stays. Write the cold open and the episode intro exactly, including the show name, the guest name, and the one-sentence promise of the episode. Do the same for the outro: the thank-you, the call to subscribe, and where to find more. Everything between those edges usually works better as conversation.',
        ],
      },
      {
        heading: 'Get sponsor wording exactly right',
        paragraphs: [
          'Ad reads often come with approved phrases, a required disclosure, or a specific offer code. Put each required element on its own line so nothing gets paraphrased by accident, and slow down for the code and the URL, which are the parts listeners must catch.',
          'Read the copy in your own cadence around the fixed lines. Listeners accept an ad; they skip a robot.',
        ],
      },
      {
        heading: 'Use prompts, not paragraphs, mid-show',
        paragraphs: [
          'Keep the interview or co-host chat on screen as short prompts: the next question, a name you must pronounce correctly, a fact you want to cite. Full sentences invite reading, and listeners can hear the difference between a question asked and a question recited.',
        ],
        bullets: [
          'One question per line, in the order you plan to ask.',
          'Pronunciations spelled the way you need to say them.',
          'A blank line between segments so you can reset at a glance.',
        ],
      },
      {
        heading: 'Mark the landmarks of the episode',
        paragraphs: [
          'Drop plain-text markers into the script where segments change: the mid-roll break, the listener question, the closing segment. When the conversation runs long, these markers let you jump the scroll to the right place without hunting through a wall of text.',
        ],
      },
      {
        heading: 'Keep the read out of your voice',
        paragraphs: [
          'Record the intro and one ad read, then listen back with your eyes closed. If the scripted parts sound flatter than the conversation, slow the scroll and shorten the sentences until the read matches how you actually talk.',
        ],
      },
    ],
    related: ['teleprompter-for-interviews', 'teleprompter-for-youtube', 'teleprompter-speed'],
    illustration: {
      src: '/illustrations/guides/video-creator.webp',
      alt: 'A creator presenting naturally through a camera-mounted teleprompter',
    },
    embed: {
      intro:
        'Practice a sponsor read at a measured pace, with the required wording on its own lines.',
      sampleScript:
        'This episode is supported by Northwind Audio.\nUse code FIELDNOTES for ten percent off.\nThat is FIELDNOTES at checkout.\nI record every remote interview on their portable recorder.\nNow, back to the conversation.',
      preset: { speakingWpm: 150 },
    },
  },
  {
    slug: 'teleprompter-for-short-form-video',
    cluster: 'youtube',
    updated: '2026-08-23',
    title: 'Teleprompter techniques for short-form video',
    description:
      'Write 30 to 60 second scripts with tight hooks, deliver at a higher WPM without rushing, and plan for captions.',
    eyebrow: 'Short-form video',
    intro:
      'Short-form video leaves no room for a slow start. The script is small enough to perfect word by word, and a teleprompter lets you deliver it at speed without sounding hurried.',
    sections: [
      {
        heading: 'Budget words against seconds',
        paragraphs: [
          'At 150 words per minute, a 60-second script is about 150 words and a 30-second script about 75. Write to the budget before you record, because trimming on camera wastes takes. If the message does not fit the budget, split it into two videos rather than speeding up.',
        ],
      },
      {
        heading: 'Make the hook the first line',
        paragraphs: [
          'The opening line carries the whole video: name the outcome, the mistake, or the question immediately. Skip greetings, channel introductions, and throat-clearing. Put the hook on its own line at the top of the script and rehearse it more than any other part.',
        ],
      },
      {
        heading: 'Faster is not the same as rushed',
        paragraphs: [
          'Short-form delivery often sits between 150 and 180 words per minute, but the pace only works when the words are easy to say. Cut long words, keep sentences under ten words where you can, and set the scroll slightly below your maximum comfortable speed so you stay in front of the text.',
        ],
        bullets: [
          'Breathe at line breaks instead of mid-sentence.',
          'Slow down for the one line the viewer must remember.',
          'If you stumble twice on the same phrase, rewrite it.',
        ],
      },
      {
        heading: 'Write with captions in mind',
        paragraphs: [
          'Many viewers watch with the sound off, and your script becomes the caption track. Short lines turn into clean caption breaks, so keep one idea per line and put the important word early in the line where captions are easier to time. Say the key terms clearly; automatic captions copy your pronunciation.',
        ],
      },
      {
        heading: 'End with one clear next step',
        paragraphs: [
          'Pick a single ending: a question that pulls comments, a loop line that leads back to the hook, or one action to take. Two calls to action split the response, and three get ignored. Give the last line its own paragraph so you land it instead of trailing off.',
        ],
      },
    ],
    related: [
      'teleprompter-for-youtube',
      'teleprompter-speed',
      'how-to-format-a-teleprompter-script',
    ],
    illustration: {
      src: '/illustrations/guides/video-creator.webp',
      alt: 'A creator presenting naturally through a camera-mounted teleprompter',
    },
    embed: {
      intro: 'Deliver this fifteen-second hook block at short-form pace.',
      sampleScript:
        'Your audio sounds thin for one reason.\nThe mic is too far away.\nHalve the distance, and the room disappears.\nThat is the whole trick.\nFollow for the next one.',
      preset: { speakingWpm: 160, baseScrollSpeed: 5, textWidth: 60 },
    },
  },
  {
    slug: 'teleprompter-for-webinars',
    cluster: 'presentation',
    updated: '2026-08-23',
    title: 'Running a webinar with a teleprompter',
    description:
      'Structure a live webinar, recover cleanly from Q&A, and decide between solo keyboard control and a separate operator.',
    eyebrow: 'Webinars',
    intro:
      'A webinar sits between a talk and a meeting: scripted enough that timing matters, live enough that the audience can derail it. Your teleprompter plan needs to handle both halves.',
    sections: [
      {
        heading: 'Script the spine, not every minute',
        paragraphs: [
          'Write word for word the parts where exact language matters: the welcome and housekeeping, the framing of the problem, transitions between speakers, and the closing call to action. For demos and discussion, use short prompts on their own lines. A fully scripted hour sounds like one, and leaves no room for the audience that showed up live.',
        ],
      },
      {
        heading: 'Decide who drives the scroll',
        paragraphs: [
          'Solo presenters should keep the keyboard within reach and rehearse pausing until it is automatic; a mouse click or a key press mid-sentence should not cost you your place. If someone else operates the prompter, agree on signals in advance: what "slow down" and "jump to the next section" look like, and who owns the scroll during Q&A.',
        ],
        bullets: [
          'Solo: rehearse pause, resume, and restart until they are reflexes.',
          'With an operator: do one full rehearsal with the real script.',
          'Either way: know how to get back to the top of a section fast.',
        ],
      },
      {
        heading: 'Recover from Q&A without scrolling panic',
        paragraphs: [
          'Questions will arrive out of order and mid-sentence. Pause the scroll while you answer, then resume at the next section landmark instead of hunting for the exact line you left. Heading lines and blank space between sections exist for exactly this moment.',
        ],
      },
      {
        heading: 'Leave room for demos and polls',
        paragraphs: [
          'Mark every screen share, demo, and poll in the script with a cue on its own line, plus one sentence to say while the audience waits for the screen to change. Dead air during a screen switch reads as technical trouble; a prepared sentence reads as confidence.',
        ],
      },
      {
        heading: 'Rehearse the whole hour once',
        paragraphs: [
          'Run the full session end to end at real pace, including the fake question you plant for yourself. Note where the script runs long, where the scroll fights you, and which transitions need a written bridge. Fix those before the invite goes out, not during the live event.',
        ],
      },
    ],
    related: ['teleprompter-for-presentations', 'teleprompter-for-zoom', 'teleprompter-speed'],
    illustration: {
      src: '/illustrations/guides/speech-stage.webp',
      alt: 'A speaker at a lectern using two discreet teleprompter glass panels',
    },
    embed: {
      intro: 'Run a webinar opening with the handoff cues on their own lines.',
      sampleScript:
        'Welcome in. We will start in one minute.\nToday: three workflows and your questions.\n[START POLL]\nFirst, the problem everyone wrote in about.\n[SHARE SCREEN: demo file]',
      preset: { textWidth: 55, speakingWpm: 130 },
    },
  },
  {
    slug: 'teleprompter-for-interviews',
    cluster: 'zoom',
    updated: '2026-08-23',
    title: 'Teleprompter setup for remote interviews',
    description:
      'Keep interview questions, guest intros, and research notes near the camera while staying present in the conversation.',
    eyebrow: 'Remote interviews',
    intro:
      'Interviewing on video asks you to listen closely and look prepared at the same time. A narrow prompt column beside the webcam holds your questions and introductions without pulling you out of the conversation.',
    sections: [
      {
        heading: 'Put the question list beside the lens',
        paragraphs: [
          'Keep the prompter window in a narrow column directly under or beside the camera, with one question per line in the order you plan to ask. When you glance down to find the next question, the movement should read as a moment of thought, not a visit to another screen.',
        ],
      },
      {
        heading: 'Script the guest introduction word for word',
        paragraphs: [
          'Names, titles, and affiliations are the details guests notice when you get wrong. Write the introduction exactly, spell pronunciations the way you need to say them, and put each fact on its own line. Deliver it looking at the lens, then let the rest of the conversation breathe.',
        ],
      },
      {
        heading: 'Stay present while prompted',
        paragraphs: [
          'The prompter holds the plan; it does not run the interview. Pause the scroll the moment the guest starts talking, and let answers reorder your question list. A follow-up that responds to what was just said is worth more than the next prepared question.',
        ],
        bullets: [
          'Treat the question list as a menu, not a queue.',
          'Pause the scroll while anyone else is speaking.',
          'Skip ahead freely; the unused questions stay private.',
        ],
      },
      {
        heading: 'Keep research notes scannable',
        paragraphs: [
          'One fact per line: the project you want to ask about, the date of the event, the quote you want a reaction to. If you cannot find a note in one glance, it is too long for a live interview and belongs in a document you read before the call.',
        ],
      },
      {
        heading: 'Close cleanly',
        paragraphs: [
          'Script the last minute: the thank-you, where listeners or viewers can find the guest, and what happens next. Endings drift when improvised, and the final thirty seconds are what the guest remembers about the whole exchange.',
        ],
      },
    ],
    related: ['teleprompter-for-zoom', 'teleprompter-for-podcasts', 'how-to-maintain-eye-contact'],
    illustration: {
      src: '/illustrations/guides/remote-meeting.webp',
      alt: 'A speaker reading near a laptop camera during a remote meeting',
    },
    embed: {
      intro: 'Practice a guest introduction with the name and details isolated on their own lines.',
      sampleScript:
        'My guest today designs sound for documentary films.\nMaya Okafor. Pronounced oh-KAH-for-ay.\nHer latest project follows one city through a single night.\nMaya, welcome.\nFirst question: where does a film begin to sound?',
      preset: { textWidth: 45, focusPosition: 30 },
    },
  },
  {
    slug: 'teleprompter-mirror-mode-glass',
    cluster: 'recording',
    updated: '2026-08-23',
    title: 'Mirror mode and beam-splitter glass, explained',
    description:
      'How teleprompter glass works, when to mirror text horizontally, when to use vertical flip, and how to check alignment before recording.',
    eyebrow: 'Mirror mode and glass',
    intro:
      'Beam-splitter glass puts the script directly in front of the lens, which is why professional eye contact looks effortless. The trade is one extra step: the text must be flipped so the reflection reads correctly.',
    sections: [
      {
        heading: 'What the glass actually does',
        paragraphs: [
          'A teleprompter rig holds a piece of partially reflective glass at 45 degrees in front of the lens. A screen below or above the glass displays the script, and the speaker reads the reflection while the camera records straight through the glass. Because the words sit on the same axis as the lens, the speaker appears to look directly at the viewer.',
        ],
      },
      {
        heading: 'When to mirror horizontally',
        paragraphs: [
          'A single reflection reverses text left to right, the same way a bathroom mirror does. Horizontal mirror mode flips the image in software so the reflected version reads normally. If your screen sits below or above the glass and you read its reflection, mirror mode should be on; if you read the screen directly with no glass, it should be off.',
          'Test it the easy way: put a word with clear direction, such as "STOP," on screen and look at the glass. If it reads backwards, toggle mirror mode.',
        ],
      },
      {
        heading: 'When vertical flip is the right switch',
        paragraphs: [
          "Some setups need a second flip. A screen mounted face-down above the glass reflects text that is also upside down from the speaker's view, and some external displays apply their own rotation. Vertical flip handles that axis. Change one setting at a time and check the glass after each change, because stacking both flips accidentally produces text that only reads correctly from inside the rig.",
        ],
      },
      {
        heading: 'Check alignment before the take',
        paragraphs: ['A few minutes of geometry saves a reshoot.'],
        bullets: [
          'Center the lens behind the glass, not peeking over its edge.',
          'Align the script column with the lens so your eyes sit on axis.',
          'Use the lowest screen brightness that still reads clearly.',
          'Kill reflections behind you with a dark hood or cloth over the camera.',
        ],
      },
      {
        heading: 'A test rig is enough to learn on',
        paragraphs: [
          'A tablet and an inexpensive beam-splitter mount will teach you everything about mirror mode before you commit to studio glass. Record thirty seconds through the rig, watch the playback for eye line and glare, and adjust the font size and column width until reading disappears from your face.',
        ],
      },
    ],
    related: [
      'teleprompter-camera-distance-and-font-size',
      'teleprompter-for-video-recording',
      'what-is-a-teleprompter',
    ],
    illustration: {
      src: '/illustrations/guides/mirrored-glass.webp',
      alt: 'Script light reflecting from a tablet through teleprompter glass toward a speaker',
    },
    embed: {
      intro: 'Mirror mode is already on below, exactly as the glass will show it.',
      sampleScript:
        'This text is mirrored right now.\nHold it up to a mirror and it reads perfectly.\nThat is what beam-splitter glass sees.\nThe camera behind the glass sees only you.\nToggle mirror off, and the screen reads normally.',
      preset: { mirror: true },
    },
  },
  {
    slug: 'teleprompter-keyboard-shortcuts',
    cluster: 'getting_started',
    updated: '2026-08-23',
    title: 'Teleprompter keyboard shortcuts: the complete reference',
    description:
      'Every keyboard control in the teleprompter: play and pause, scroll speed, font size, mirror, fullscreen, restart, and exit.',
    eyebrow: 'Keyboard control',
    intro:
      'Once the script is loaded, the keyboard is the fastest way to run the prompter. The full set fits under one hand, and the same keys work whether the screen is on your desk or across the room.',
    sections: [
      {
        heading: 'The core keys',
        paragraphs: ['With the presenter open, these keys control the scroll and the display:'],
        bullets: [
          'Space: play or pause the scroll.',
          'Arrow Up and Arrow Down: increase or decrease the scroll speed.',
          '[ and ]: decrease or increase the font size.',
          'M: toggle horizontal mirror mode.',
          'F: toggle fullscreen.',
          'Home: return to the beginning of the script.',
          'Escape: close an open settings or shortcuts panel, or exit the presenter.',
          'Tab: move focus between the on-screen controls.',
        ],
      },
      {
        heading: 'Build the muscle memory',
        paragraphs: [
          'Run one rehearsal where your only job is the keys: pause at every paragraph break, restart with Home, and adjust the speed once up and once down. The goal is for your hand to find Space without your eyes leaving the focus line.',
        ],
      },
      {
        heading: 'When the keys do nothing',
        paragraphs: [
          'The prompter ignores keystrokes while you are typing in the script editor or while a button has focus, so a tap that seems dead usually means the focus is somewhere else. Click the reading area once, then use the keys again. Fullscreen mode also keeps stray clicks from stealing focus mid-take.',
        ],
      },
      {
        heading: 'Avoid shortcut conflicts',
        paragraphs: [
          'Meeting apps and browser extensions claim their own keys. Before a call, click the prompter window so your keystrokes go to it, and close extensions that intercept Space or the arrow keys. If you share your screen, share only the window you intend to show.',
        ],
      },
      {
        heading: 'Keyboards beyond the laptop',
        paragraphs: [
          'A small Bluetooth keyboard pairs with a phone or tablet when the prompter screen is mounted out of reach, and the same keys apply. Test the pairing with the full setup before the take, including Home, so restarting the script never requires walking back to the device.',
        ],
      },
    ],
    related: ['how-to-use-a-teleprompter', 'teleprompter-mirror-mode-glass', 'teleprompter-speed'],
    embed: {
      intro: 'Open this script and run it with Space, the arrow keys, and Home.',
      sampleScript:
        'Press Space to start the scroll.\nPress Arrow Up once and feel the pace change.\nPress the left bracket to shrink the text.\nPress Home to return to this line.\nPress Space again to pause. That is the whole set.',
      preset: {},
    },
  },
];

export const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
