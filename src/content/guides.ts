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
  | 'voice_tracking';

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
      'manual-vs-voice-activated-teleprompter',
    ],
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
      'teleprompter-speed',
      'teleprompter-camera-distance-and-font-size',
    ],
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
      'teleprompter-camera-distance-and-font-size',
    ],
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
      'how-to-use-a-teleprompter',
      'teleprompter-speed',
      'manual-vs-voice-activated-teleprompter',
    ],
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
      'teleprompter-for-presentations',
      'how-to-use-a-teleprompter',
      'how-to-maintain-eye-contact',
    ],
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
    related: ['how-to-use-a-teleprompter', 'how-to-read-a-teleprompter-naturally'],
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
    related: ['how-to-use-a-teleprompter', 'teleprompter-speed'],
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
  },
];

export const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));
