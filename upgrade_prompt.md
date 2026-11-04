# teleprompter.wtf Studio: product plan and build brief

- Product: teleprompter.wtf Studio, a mobile-first PWA that combines a pro teleprompter with a camera recorder for Instagram Reels, YouTube Shorts, TikTok and landscape YouTube.
- Host: `https://www.teleprompter.wtf` (apex `teleprompter.wtf` permanently redirects to `www`). Studio lives at `https://www.teleprompter.wtf/studio` on the same origin. No subdomain.
- Repository: `SABYA648/Telemprompter-WTF` (Astro 7 static output, Preact islands, Nginx in Docker, deployed by the owner).
- Date: 2026-11-04.
- Audience: the coding agent that implements this plan (Codex, medium reasoning) and the owner who reviews it.
- Status: approved direction. Execute the milestones in section 16 in order.

How to read this document:

- Sections 1 to 8 explain the why and the what. Read them once so you do not undo a decision by accident.
- Sections 9 to 15 are binding contracts: UX, settings, architecture, analytics, SEO, content, quality.
- Section 16 is the execution plan: one milestone at a time, each with scope, acceptance criteria, tests, gates and a commit message.
- Appendices hold the copy deck, TypeScript contracts, dated platform facts, the paid-feature matrix and the kickoff prompts.

---

## 0. Operating rules for the agent

### 0.1 Workflow

1. Read this whole file before changing code.
2. Work on the integration branch `codex/creator-studio`.
   - First time: `git fetch origin && git checkout -b codex/creator-studio origin/main`.
   - Every later milestone: `git fetch origin && git checkout codex/creator-studio && git merge origin/main`. Never rebase pushed history. Never force push.
3. Do one milestone at a time, in the order of section 16. Commit in small steps inside a milestone. The last commit of each milestone uses the commit message given for it.
4. Before every push, run that milestone's gate commands. Fix failures before you push. The only allowed red is a failure recorded as pre-existing in the M0 baseline.
5. After each milestone, append an entry to `docs/studio/PROGRESS.md` (format in 16.13) and add any new decision to `docs/studio/DECISIONS.md`.
6. Push with `git push -u origin codex/creator-studio`. Never push to `main`. Never deploy. Never touch DNS, Coolify, TLS or the Umami server.
7. Launch is a pull request from `codex/creator-studio` into `main`, opened at the end of M7. The owner merges it after device QA. The agent never merges it.

### 0.2 Hard rules

- **No AI.** No LLM APIs, no speech recognition, no ML models, no remote inference, no "AI" wording in the product. Deterministic heuristics and signal processing (brightness, loudness, silence detection) are allowed.
- **No voice auto-follow.** M1 removes it from the product. It stays out.
- **No new servers and no infra spend.** No uploads, no streaming, no cloud storage, no relay, no push server, no database. The site stays a static build served by the existing Nginx container. The only runtime network traffic is same-origin static assets and Umami analytics.
- **Recordings are local.** Takes live in IndexedDB on the device until the user saves them to Photos or Files (share sheet) or downloads them.
- **Analytics are Umami only**, always on (section 12). No GA4, no pixels, no other trackers. Product analytics are required, not optional.
- **Stack:** Astro 7 static output, Preact islands, strictest TypeScript, local CSS. No React, no Tailwind, no UI kit, no state library, no CSS-in-JS, no SSR adapter.
- **Mobile web first.** Design and test at 390x844 first, then 360x740, 768x1024, 1440x900. Desktop is the secondary surface, but fully supported.
- **Keep every indexable URL working.** A removed page gets a 301 to the closest equivalent.
- **Public copy rules:** no em dash character anywhere in `src/pages`, `src/content`, `docs`, `README.md`, `CONTRIBUTING.md` or `public/llms.txt` (content-lint fails on it). No fabricated statistics, ratings, testimonials, user counts, search volumes or competitor prices. Claim only shipped features.
- Never render user script text with `innerHTML` or `dangerouslySetInnerHTML`.
- Never send script text, titles, idea text or file names to analytics, and never put them in tracked URLs. This is a data-quality rule: free text explodes cardinality and makes Umami reports useless.

### 0.3 When something is unclear

Pick the simplest option that fits the principles in 5.1 and the decision log in 5.3. Record it as a new `D-0xx` entry in `docs/studio/DECISIONS.md` with a one-paragraph rationale. Stop and ask the owner only when you are truly blocked (missing credentials, missing network, a hard rule conflict).

### 0.4 Allowed new dependencies

| Package            | Kind    | Use                                                    | Loading                               |
| ------------------ | ------- | ------------------------------------------------------ | ------------------------------------- |
| `idb`              | runtime | IndexedDB promise wrapper                              | Studio entry                          |
| `qrcode-generator` | runtime | QR codes for Send to phone (M8)                        | Lazy, only on the send sheet          |
| `mediabunny`       | runtime | WebM to MP4 conversion and trim (M11)                  | Lazy, own chunk, only on convert/trim |
| `fflate`           | runtime | `.docx` import (M11)                                   | Lazy, only on import                  |
| `fake-indexeddb`   | dev     | Unit tests for the data layer                          | Tests only                            |
| `sharp`            | dev     | Icon generation script (M6), if not already resolvable | Script only                           |

Anything else needs a decision entry and must be under 10 KB gzip on the client.

### 0.5 Definition of done (every milestone)

- Everything in scope is built, and you verified each acceptance criterion. Say how in PROGRESS.md.
- The gate commands are green.
- No new console errors on `/`, `/studio`, one guide and one tool page. A Playwright test enforces this from M3 onward.
- PROGRESS.md is updated, and DECISIONS.md too if a decision was made.
- The milestone is committed with its commit message and pushed to `codex/creator-studio`.

---

## 1. The bet

### 1.1 The real problem

Creators do not fail for lack of a teleprompter. They fail on two things:

1. **Delivery.** Their eyes drift off the lens, the scroll speed is wrong, one flub at second 25 ruins the take, and they sound like they are reading.
2. **Consistency.** Scripts live in five apps, blank-page days kill the streak, and recording takes too long, so posting stops.

The product wins if it cuts the time from idea to posted video and makes showing up every day easy and rewarding.

### 1.2 What changed, and why "free teleprompter" is no longer a strategy

- Instagram shipped a free teleprompter in its Edits app (June 2025) and later added it to the main Instagram camera: the script scrolls in front of the camera, with adjustable speed and text size. CapCut mobile has a free teleprompter while recording. A basic free teleprompter is now table stakes inside the platforms themselves.
- Paid apps (BIGVU, Teleprompter.com, PromptSmart, Teleprompter Pro, Teleprompter for Video) put pro controls, 1080p/4K, watermark removal, remote control and rich formatting behind subscriptions.
- The platform teleprompters are app-only and single-platform. They have no script library worth the name, no remote-key control, no section retakes, no landscape YouTube workflow, and no desktop writing surface.

So the wedge is not price. It is **the full creator loop with pro control, on any platform, with no install, no watermark and no upload**.

### 1.3 Positioning

> teleprompter.wtf is the free pro teleprompter camera for Reels, Shorts and YouTube. Write anywhere, read right under your lens, redo any line, and save straight to your phone. No signup. No watermark. No upload.

Short tagline: **Read under the lens. Redo any line. Post today.**

### 1.4 North Star metric and targets

- **North Star:** Weekly Recording Creators (WRC), the distinct devices with at least one kept take in the trailing 7 days.
- **Core action** (counts as "active" for DAU/MAU): `kept_take`, `completed_practice` or `finished_teleprompter`.

Targets for the first 90 days after launch. These are assumptions; recalibrate them after 4 weeks of data.

| Metric                                                                | Target   | Stretch  |
| --------------------------------------------------------------------- | -------- | -------- |
| Activation: first-session `kept_take` / first-session `opened_studio` | 35%      | 50%      |
| D1 retention of activated devices                                     | 25%      | 35%      |
| D7 retention of activated devices                                     | 12%      | 20%      |
| D30 retention of activated devices                                    | 6%       | 10%      |
| DAU/MAU on the core action                                            | 20%      | 30%      |
| Kept takes per active day                                             | 1.8      | 2.5      |
| Export rate: `exported_take` / `kept_take`                            | 70%      | 85%      |
| Camera failure rate: `camera_failed` / camera attempts                | under 8% | under 4% |
| Median landing-to-first-kept-take time on phones                      | 90 s     | 60 s     |

The honest ceiling: posting frequency caps DAU/MAU for a creation tool. Most active creators post 3 to 5 times a week, so 20% is strong. Social-app levels (50%+) need daily value that does not require recording. That is why this plan adds a daily prompt, idea capture and streaks.

### 1.5 What we will not do (now)

AI features of any kind, voice follow, accounts, cloud sync, servers, direct publishing APIs, live streaming, native apps, or any monetization. Instagram's publishing API needs business accounts and a public video URL. YouTube's API upload quota allows only a handful of uploads per day per project. The share sheet beats both.

---

## 2. Market and SEO analysis

### 2.1 Competitive map (non-AI features only)

Prices below come from third-party listings checked on 2026-11-04 and they conflict with each other. **Never publish a competitor price or plan detail unless the owner has verified it on the vendor's own page.**

| Product                                                      | Model (reported)                                                        | Gated or missing                                                                     | Our angle                                                                                      |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Instagram camera and Edits                                   | Free, in-app                                                            | Instagram-only, no remote keys, no section retakes, no 16:9 YouTube flow, no desktop | Library, WPM speed, pause markers, remote keys, section retakes, any platform, desktop writing |
| CapCut                                                       | Free in the mobile app (tiers shift)                                    | Mobile only; CapCut's help center says desktop and web have no teleprompter overlay  | Works on phone and desktop in a browser                                                        |
| BIGVU                                                        | Free plan with watermark at 720p; paid tiers roughly $12 to $49 a month | Watermark and 1080p gated; AI-centric product                                        | Never a watermark; 1080p and 4K free                                                           |
| Teleprompter.com                                             | Free starter; Pro from about $7.50 a month billed yearly                | 4K, no-watermark and mirroring reported as Pro                                       | All free                                                                                       |
| PromptSmart Pro                                              | Paid                                                                    | Voice tracking focus                                                                 | Pro manual control, no voice dependency                                                        |
| Teleprompter Pro (formerly Teleprompter Premium)             | One-time or subscription                                                | Remote via browser, Apple Watch, game controllers; rich text                         | Keyboard and clicker remote, emphasis markup, free                                             |
| Teleprompter for Video                                       | About $8.99 a month or $34.99 a year                                    | Bluetooth remote, foot pedal, rich text, countdown; logo is an in-app purchase       | All free (logo overlay is Phase 3)                                                             |
| Browser tools (CuePrompter, MiniWebtool, ScreenApp, Telepro) | Free, basic                                                             | Usage caps (MiniWebtool lists 3 free uses a day), no library, weak mobile camera UX  | Best mobile camera UX on the web                                                               |

### 2.2 Paid features worth matching (all non-AI)

These are the features people actually pay for, mapped to milestones. Appendix D has the full matrix.

- **Recording:** no watermark (M4), 1080p and 4K where the device supports it (M5), external microphone selection (M5), multiple takes with best-take starring (M4), section and scene recording (M8), pause and resume (M4), countdown (M4).
- **Prompter:** speed you can reason about (WPM, M4), fit to a target duration (M4), cue marker (M4), mirror horizontal and vertical for glass rigs (M5), emphasis formatting (M3), pause markers that stop the scroll (M4), readable font option (M5).
- **Control:** Bluetooth clickers, keyboards and foot pedals (M5), key remapping and game controllers (M11), an operator window for a second screen (M11).
- **Workflow:** script library (M3), import from documents (M11), timed sections (M3), captions and chapters export (M11; script-timed, not speech recognition).

### 2.3 SEO diagnosis of teleprompter.wtf today

Strengths to keep: static Astro HTML, clean canonicals and 308 slash redirects, page and image sitemaps, guides RSS, `llms.txt`, Article and Breadcrumb schema, content-lint, an SEO crawl script, a Lighthouse script, 21 guides that each embed a working teleprompter, two calculators and a useful 404.

Problems to fix:

1. **Positioning mismatch.** The homepage title and H1 sell voice follow ("Follows Your Pace"), while creator demand is "teleprompter with camera", "for Reels" and "for YouTube". After M1 the voice claims are also false.
2. **Missing long-tail clusters** where a new domain can win: creator recording landing pages, script templates, hook libraries, caption and length tools, and how-tos for Instagram's own teleprompter.
3. **Young domain** (launched August 2026). App-store listings, big brands and listicles dominate the head terms ("teleprompter", "teleprompter app"). Win long-tail and utility queries first, and let authority compound.
4. **A voice-tracking cluster** (`/private-voice-tracking` and the Smart Pace and Private Precision claims) that becomes inaccurate. Redirect it or rewrite it as neutral education.
5. **A thin conversion path.** Every CTA opens the classic presenter. None opens a recorder.

### 2.4 SERP patterns observed (November 2026) and where we can win

- **"teleprompter for instagram reels"** is fragmented: coverage of Instagram's own feature, free browser tools, Product Hunt launches and app listings. A tool-first landing page that records in one tap can win.
- **"reel script template"** is dominated by AI generators and blogs. Human-written templates that open straight into a recorder are a better answer.
- **"instagram teleprompter"** (how to use it, why it is not showing) is fresh informational demand created by Instagram's feature launch. An accurate how-to with troubleshooting ranks and converts the people who outgrow it.
- **"online teleprompter"** is crowded with free tools. The homepage keeps it through relevance and a real tool above the fold.
- **"hooks for reels"** is dominated by marketing blogs. A copyable, niche-specific hook library with "record this hook" can compete.

Search volumes are deliberately not stated. Nothing here is fabricated. After launch, rank the clusters by Google Search Console impressions and re-prioritize at weeks 4, 8 and 12.

### 2.5 Query clusters and page ownership

One URL owns each intent. Never create a second page aimed at the same intent.

| #   | Cluster                      | Representative queries                                                                     | Owner URL                                | Type         | Priority                 |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------- | ------------ | ------------------------ |
| 1   | Generic online teleprompter  | online teleprompter, free teleprompter, teleprompter online free                           | `/`                                      | Tool home    | P0, protect              |
| 2   | Teleprompter with camera     | teleprompter with camera, teleprompter video recorder, record video with teleprompter      | `/record`                                | Tool landing | P0                       |
| 3   | Reels                        | teleprompter for instagram reels, teleprompter app for reels                               | `/record/instagram-reels`                | Tool landing | P0                       |
| 4   | Shorts                       | teleprompter for youtube shorts                                                            | `/record/youtube-shorts`                 | Tool landing | P1                       |
| 5   | TikTok                       | teleprompter for tiktok                                                                    | `/record/tiktok`                         | Tool landing | P1                       |
| 6   | YouTube landscape tool       | youtube teleprompter, teleprompter for youtube videos app                                  | `/record/youtube`                        | Tool landing | P1                       |
| 6b  | YouTube how-to (existing)    | how to use a teleprompter for youtube                                                      | `/guides/teleprompter-for-youtube`       | Guide        | protect                  |
| 7   | LinkedIn                     | teleprompter for linkedin video                                                            | `/record/linkedin-video`                 | Tool landing | P2                       |
| 8   | Instagram's own teleprompter | instagram teleprompter, how to use teleprompter on instagram, edits teleprompter           | `/guides/instagram-teleprompter`         | Guide        | P0                       |
| 9   | CapCut teleprompter          | capcut teleprompter, capcut teleprompter pc                                                | `/guides/capcut-teleprompter`            | Guide        | P1                       |
| 10  | Script templates             | reel script template, 30 second video script, youtube script template, ugc script          | `/templates`, `/templates/[slug]`        | Templates    | P0                       |
| 11  | Hooks                        | hooks for reels, instagram reel hooks, youtube hooks, fitness hooks                        | `/hooks`, `/hooks/[niche]`               | Library      | P0                       |
| 12  | Script length                | how many words in a 30 second script, will my script fit                                   | `/tools/script-length-checker`           | Tool         | P1                       |
| 13  | Caption and hashtag limits   | instagram caption character limit, instagram hashtag limit, youtube title limit            | `/tools/caption-counter`                 | Tool         | P1                       |
| 14  | Hook generator               | hook generator, reel hook generator                                                        | `/tools/hook-generator`                  | Tool         | P1                       |
| 15  | Creator technique            | how to film talking head videos, batch record content, read script while looking at camera | new guides (13.2)                        | Guides       | P1                       |
| 16  | Remote control               | teleprompter remote, bluetooth teleprompter remote                                         | `/guides/teleprompter-remote-control`    | Guide        | P2                       |
| 17  | Camera settings              | best camera settings for reels, 30 vs 60 fps                                               | `/guides/best-camera-settings-for-reels` | Guide        | P2                       |
| 18  | Voice-activated (existing)   | voice activated teleprompter                                                               | `/guides/voice-activated-teleprompters`  | Guide        | protect, neutral rewrite |
| 19  | Alternatives (later)         | bigvu alternative, teleprompter.com alternative                                            | `/alternatives/[slug]`                   | Phase 3      | Owner-verified only      |

Cannibalization rules:

- `/guides/teleprompter-for-short-form-video` stays the short-form technique hub. It links to the three short-form `/record/*` pages. `/record/*` titles never use "How to" phrasing.
- `/tools/words-to-minutes` keeps "compare durations across WPM rates". `/tools/script-length-checker` owns "does my script fit 15, 30, 60 or 90 seconds, and where do I cut".

---

## 3. Personas

All personas are composites. Use "they" for each.

### P1. Daily Reels creator ("Riya"), the primary persona

- **Who:** 19 to 28, building a personal brand in lifestyle, fashion, fitness, food or education. 2k to 50k followers. Posts 3 to 7 Reels a week. Large clusters in India, Indonesia, Brazil and the US.
- **Setup:** a mid-range Android (4 to 8 GB RAM) or a 2 to 4 year old iPhone, phone storage nearly full, mobile data, a ring light, and the phone on a tripod 50 to 70 cm away at eye level, front camera. Records in the evening, often in a bedroom.
- **Today:** writes hooks in Notes or a WhatsApp chat to self, uses Instagram's in-camera teleprompter or memorizes lines, edits in Edits or CapCut. Scripts run 60 to 150 words, often mixing languages (for example Hinglish).
- **Jobs:** "Help me say it right in fewer takes." "Give me something to post when I am blank." "Keep me posting."
- **Pains:** eyes visibly reading, one speed that never matches them, a flub near the end means starting over, lost scripts, blank days, running out of storage mid-take, and links from Instagram opening in a browser that cannot record.
- **Great looks like:** tap once, the words sit right under the lens at their pace, nail it in two takes, save to Photos, post.
- **Quits when:** permission confusion, a laggy preview, a file format Instagram rejects, a lost take, or settings thrown at them on first run.
- **Design implications:** one-tap start with a starter script, front camera at 9:16 1080p30 by default, the prompter docked at the lens, WPM speed with big plus and minus controls, section retakes, a daily prompt, a tiny install, "Save video" as a first-class action, and a hard guarantee against losing a take.

### P2. Expert or business creator ("Dev"), including UGC creators

- **Who:** 28 to 50. Coaches, consultants, realtors, founders, educators, and UGC creators making ads for brands. Posts 2 to 4 times a week across Instagram, LinkedIn and YouTube Shorts. The content supports a business, so time matters more than money.
- **Setup:** a recent iPhone, a laptop for writing (Google Docs or Notion), a wireless or wired lav mic, sometimes 4K.
- **Today:** pays for or trials BIGVU, Teleprompter.com, PromptSmart or a phone app, and batch-records one day a week.
- **Jobs:** "Turn my outline into a tight 45-second script." "Record five scripts in one sitting." "Give a client three hook options."
- **Pains:** subscriptions and watermarks, cloud uploads and waiting, writing on a laptop but recording on a phone, an external mic that is not picked up, and inconsistent timing.
- **Great looks like:** write on the laptop, scan a QR code, record all five with the lav mic, star the best takes, save them to Photos or Drive.
- **Design implications:** a desktop editor, Send to phone, batch mode, a mic picker with a level meter, 4K, sections for hook variants, and exact fit-to-duration.

### P3. Landscape YouTuber or educator ("Sam")

- **Who:** long-form 16:9 creators, course makers and explainers. 1 to 4 uploads a month of 8 to 20 minutes each. Scripts of 1,200 to 3,000 words with sections.
- **Setup:** a desktop or laptop with a webcam, or a mirrorless camera through a capture device that shows up as a webcam, or a phone in landscape on a tripod. Sometimes a beam-splitter prompter rig on an external monitor, plus a Bluetooth clicker or foot pedal.
- **Jobs:** "Keep my place in a long script." "Let me pause, breathe and continue without losing the take." "Give me chapter timestamps."
- **Pains:** losing their place, reading in a monotone, re-recording whole sections, no remote, text unreadable at 1 to 2 meters.
- **Great looks like:** sections with a jump list, a large readable font, clicker control, pause and resume recording, a mirrored prompter window on the glass monitor, and chapters copied into YouTube.
- **Design implications:** 16:9 by default on desktop, a device picker that lists capture devices, a prompter docked to the lens side, key mapping, pause and resume, then an operator window and chapters in M11.

### P4. Speaker or presenter (existing traffic, guardrail persona)

Speeches, Zoom calls, sermons and toasts, using the classic presenter from guides and the homepage, infrequently. Never break: paste, start, scroll, speed, mirror, fullscreen, Picture in Picture, shortcuts, the guide embeds and the working 404.

### Anti-personas (do not design for these)

Broadcast studios that need hardware prompter integration, multi-operator newsrooms, and live streamers.

---

## 4. User journeys

### 4.1 Moments of truth

1. **First 5 seconds on a landing page:** "Is this the tool I need, and can I start now?"
2. **Camera goes live with readable words right under the lens.** This is the aha moment.
3. **First playback:** "I look at the lens and I do not sound like I am reading."
4. **The take is saved to the phone and posted.**
5. **The next-day return,** triggered by a calendar alert, the home screen icon, the daily prompt or the streak.

Design and test effort goes to these five moments first.

### 4.2 Journey maps

Each step lists what the user wants, what they see, the risk, our answer, and the analytics signal.

**J1. First visit from Google on a phone (P1).** Query: "teleprompter for instagram reels".

| Step                              | User wants                   | They see                                                                                 | Risk                              | Our answer                                                                                        | Signal                        |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| Land on `/record/instagram-reels` | "Is this it?"                | H1, one-line promise, a "Record a Reel now" button above the fold, 3 trust chips         | Looks like a blog, so they bounce | Tool-first hero; no long intro before the CTA                                                     | `clicked_open_studio`         |
| Tap the CTA                       | Start fast                   | `/studio?preset=instagram-reels` opens the Record screen with an editable starter script | Blank-page paralysis              | Starter script "Introduce yourself in 30 seconds" with `{placeholders}`, plus "Use my own script" | `opened_studio`               |
| Camera priming                    | Understand the ask           | Sheet: why camera and mic, "Your video is saved on this phone. Nothing is uploaded."     | Denies the OS prompt              | Prime before the OS prompt; one clear button                                                      | `viewed_camera_priming`       |
| OS prompt, then live              | See themselves and the words | Live preview, prompter under the lens, 140 WPM                                           | Lag, wrong orientation            | 1080p30 default, `object-fit: contain`, prompter rendered before the camera resolves              | `granted_camera` (ready time) |
| Countdown, record                 | Read naturally               | 3-2-1, then auto-scroll                                                                  | Too fast                          | Big WPM plus and minus; tap the prompter to pause                                                 | `started_take`                |
| Stop, review                      | "Do I look okay?"            | The take autoplays                                                                       | Disappointment                    | Keep and Retake are one tap each; a tip when the prompter sits far from the lens                  | `stopped_take`, `kept_take`   |
| Save                              | Get it into Instagram        | A "Save video" button opens the share sheet                                              | Does not know they must save      | Primary button plus one line: "Save it to Photos now. Browser storage can be cleared."            | `exported_take`               |
| After saving                      | What next                    | Install sheet (Android prompt or iOS steps)                                              | Too many asks                     | Exactly one ask; a dismissal means a 7-day cooldown                                               | `shown_install_prompt`        |

Target: 90 seconds or less from landing to kept take (median).

**J2. From Instagram, TikTok or Facebook (bio link, story link sticker, DM).** Insight: camera capture, downloads and the share sheet are often blocked or unreliable inside in-app browsers.

- On load, detect the in-app user agent. Show a top banner on every Studio screen: "Instagram's browser can't record video. Open this page in Safari." (or Chrome on Android).
- iOS: step-by-step text ("Tap the three dots, then Open in browser") plus a "Copy link" button. The copied link carries the current script in the URL fragment, so no work is lost.
- Android: an "Open in Chrome" button using an `intent://` URL.
- Script writing keeps working inside the in-app browser. Only the Record button is replaced by the banner action.
- Signals: `camera_failed` with reason `in_app_browser` (pre-emptive), then `opened_studio` with entry `link`.

**J3. Write on desktop, record on phone (P2).**

1. They write in `/studio` on the laptop (two-pane editor).
2. They click "Send to phone". If the URL is 1,500 characters or less, a QR code appears; otherwise "Share link" and "Copy link" appear.
3. They scan with the phone camera, which opens `/studio#/receive/<payload>` and shows the title, word count and duration.
4. "Save and record" creates the script and opens Record.

- Insight: on iOS, a scanned QR code opens Safari, not the Home Screen app, and the two have separate storage. The receive screen therefore also offers "Using the Home Screen app? Copy transfer code", then paste it in the app.
- Signals: `sent_to_phone`, `received_script`.

**J4. Daily return through a calendar reminder (P1).**

- They added a daily `.ics` reminder (Settings > Reminders, or through the ask ladder).
- If they are not installed: the event URL `/studio?utm_source=calendar&utm_medium=reminder` opens the Today card.
- If they are installed on iOS: the `.ics` carries no URL and says "Open teleprompter.wtf from your Home Screen", because a link would open Safari's separate, empty storage.
- If they created the reminder in Safari and installed later, the app's first standalone launch offers "Update your reminder for the app", which replaces it with the URL-free version.
- Signals: `opened_studio` (entry `calendar`), `viewed_today_prompt`, `kept_take`, `extended_streak`.

**J5. Daily return from the home screen icon (installed).** Tap the icon, see Studio Home (streak, Today prompt, Up next), tap "Record next", record. Signal: `opened_studio` with display `standalone`.

**J6. Batch day (P2).** Up next holds N scripts. They tap "Start batch", record, Keep, see a 5-second "Next up" card, record the next, and repeat. A summary follows, then "Save all" (one multi-file share), then the `batch_day` badge. Signals: `started_take` with mode `batch`, `kept_take`, `unlocked_badge`.

**J7. Landscape YouTube session (P3).**

- Desktop: a sectioned script in the editor, then Record at 16:9 with the webcam or capture device. The clicker controls the scroll. They pause and resume recording at section ends, stop, Keep, Download MP4. Chapters arrive in M11.
- Phone in landscape: rotate, and the prompter docks to the camera side with controls on the thumb side.
- Glass rig: a prompter-only operator window, mirrored, on the monitor under the glass (M11).
- Signals: `started_take` with aspect `16_9`, `used_remote_key`, `exported_take` with method `download`.

**J8. Interrupted recording.** Triggers: a phone call, an app switch, the screen locking, a killed tab, or low storage. Stop and save whatever was captured. On return, show "Recording stopped when the app went to the background. Your take is saved." If the page was killed, recover the take from stored chunks on the next boot. Never lose a take silently. Signals: `stopped_take` (ended by `interruption`), `recovered_take`, `recording_failed`.

**J9. Permission denied or camera busy.**

- Denied: show short platform-specific re-enable steps, a "Try again" button, and "Use the teleprompter without camera" (classic presenter).
- Busy (`NotReadableError`): "Your camera is busy. Close other apps or tabs using it, then try again."
- Signals: `camera_failed` with its reason.

**J10. Storage nearly full, or Safari eviction.**

- Always show minutes of recording left at the current quality. Warn below 10 minutes. Below 3 minutes, block Record behind a "Save and delete takes" flow (override allowed).
- Nudge users to save takes to Photos. Safari deletes site data for sites the user has not opened in 7 days of Safari use (Home Screen apps are exempt), so unsaved takes are at risk.
- Signals: `storage_warning`, `exported_take`.

**J11. Lapsed creator returns after 7+ days.** Show a "Welcome back" card that frames a fresh streak (with the best streak shown), the Today prompt, and one-tap record. No guilt copy. Signals: `lost_streak`, then `kept_take` in the same session.

**J12. Speaker from a guide (P4) converting to creator.** The guide embed works exactly as today. A secondary "Record with camera" CTA sits in the embed and at the end of the guide. No forced detours. Signal: `clicked_open_studio` with page type `guide`.

**J13. iOS install and storage transfer.**

1. After the first exported take, the iOS install sheet appears.
2. The tap on "Show me how" also copies a transfer code with their scripts to the clipboard. The sheet says: "We copied your scripts. In the app, tap Paste scripts."
3. They add the site to the Home Screen and open the app. Its storage is empty, so the Home screen shows a "Bring your scripts from Safari" card.
4. "Paste scripts" imports everything, including the device id for analytics continuity.

- Signals: `shown_install_prompt` (platform `ios`), `transferred_scripts` (direction `import`).

### 4.3 The ask ladder

Ask for one thing at a time, at the moment it has earned the right. Never show more than one sheet per session, and never during recording.

1. **Camera and mic:** on the first Record. Required.
2. **Save the take:** on the review sheet, always visible as text, never a modal.
3. **Install:** after the first exported take (or the second Studio session). At most 3 times in total, with a 7-day cooldown after a dismissal.
4. **Daily reminder (`.ics`):** after the second distinct active day, or right after installing.
5. **Share card:** at streak 3, 7 and 30, at a weekly goal and at challenge completion. Shown as an inline card, never a modal.
6. **Storage cleanup:** when usage passes 80% of quota or more than 20 takes are unexported.
7. **Quick rating:** after the third kept take, once. One tap, 1 to 5.

---

## 5. Product principles and decision log

### 5.1 Principles

1. **Time to first take beats everything.** Every screen asks: can a first-time phone user record within 60 to 90 seconds?
2. **The lens is sacred.** The prompter sits as close to the camera as the hardware allows, in a narrow column, so the eyes barely move.
3. **Never lose a take.** Chunked persistence, crash recovery, and save nudges.
4. **Progressive disclosure.** Defaults that work out of the box. Pro controls live one level down and appear only when the device supports them.
5. **Zero marginal cost.** Everything runs on the device. The server only serves static files.
6. **Platform-neutral output.** MP4 that plays in Photos and uploads to Instagram, YouTube, TikTok and LinkedIn.
7. **Habit through value, not manipulation.** Streaks, prompts and goals that help people post. No fake urgency, no guilt copy, no notification spam. Manipulative loops raise churn.
8. **Measure what decides.** Every analytics event answers a product question (section 12).

### 5.2 Focus, ignore, cut

- **Focus:** Studio recording quality on iPhone Safari and Android Chrome; the idea-to-saved-take loop; the habit kernel; creator SEO clusters.
- **Ignore for now:** AI, voice follow, accounts, cloud sync, push notifications (they need a server), phone-as-remote over the network (needs a relay), canvas compositing (burned captions, crops), Hindi UI, comparison pages and monetization.
- **Cut:** Smart Pace, Private Precision and the Whisper model, the consent banner and its gating, GA4, the "Three ways to present" homepage section, and privacy-first marketing as the lead message. "Nothing is uploaded" stays as a speed and ownership benefit.

### 5.3 Decision log seed

Copy these into `docs/studio/DECISIONS.md` in M0.

- **D-001** Keep Astro 7 static output and Preact islands. Studio is one client-only island at `/studio`, using hash routing.
- **D-002** Voice follow is removed (M1). The pre-removal state is tagged `archive/voice-follow-v1` for possible revival.
- **D-003** Local-first data: IndexedDB for scripts, ideas, takes and settings. No accounts.
- **D-004** Record the camera `MediaStream` directly with `MediaRecorder`. Prefer MP4 (H.264/AAC). No canvas compositing in v1.
- **D-005** Export through the Web Share API with files, falling back to download. No platform publishing APIs.
- **D-006** PWA with a hand-written service worker: network-first HTML, cache-first hashed assets, Studio works offline.
- **D-007** No servers or new infra. Desktop-to-phone handoff uses URL fragments (QR or link). Reminders use `.ics` files. Remote control uses keyboard and Bluetooth keys.
- **D-008** Umami-only product analytics, always on, with a random device id passed to `umami.identify()`. Typed event taxonomy, enum properties only.
- **D-009** SEO is tool-first: landing pages carry a working entry point above the fold. No fabricated volumes. No named comparison pages until the owner verifies them.
- **D-010** Integration branch `codex/creator-studio`. Launch happens via a PR into `main` after M7 and owner device QA.
- **D-011** Studio speed is expressed in WPM. Pixels per second are derived from measured pixels per word.
- **D-012** No new UI frameworks. Dependencies are limited to the list in 0.4.
- **D-013** Same origin `www.teleprompter.wtf` for the site and Studio, so homepage-to-Studio handoff can use shared storage and SEO authority stays in one place.
- **D-014** The classic presenter stays for speakers (P4). Studio reuses its scroll engine.

---

## 6. The deal and growth loops

### 6.1 The deal

> Every pro teleprompter and camera control, free. No account. No watermark. No upload. No 200 MB app download.

Everything paid apps gate is free here: 1080p and 4K (when the device supports it), no watermark ever, unlimited scripts and takes, WPM speed, fit-to-duration, pause markers, emphasis, mirror modes, section retakes, batch recording, external mics, pro camera controls, Bluetooth and keyboard remotes, chapters and captions export (M11), and offline use.

Why it is believable: it runs in the browser, files go straight to the phone, the code is open source, and there is no paywall anywhere to discover later.

On the site, anchor value with a "What other apps charge for, free here" section. It lists features only. It names no competitor and quotes no price until the owner verifies them.

Avoid "free forever". The business may monetize later. Say "Free. No trial, no paywall, no watermark."

### 6.2 Growth loops (zero infra)

1. **SEO utility loop:** template, hook, tool and landing pages bring searchers, who open Studio in one tap.
2. **Share-card loop:** streak, weekly and challenge cards (1080x1920 PNG) go to Instagram Stories with "teleprompter.wtf" printed on the card. This is why in-app browser handling (J2) is a P0.
3. **Script-link loop:** templates and scripts shared as links (fragment payload) to friends, clients or teams.
4. **Word of mouth:** creators get asked "what teleprompter do you use?", and the domain is memorable.
5. **Backlog:** an Android Play Store listing via a Trusted Web Activity (one-time developer fee, no servers) once retention is proven.

No watermark means no in-video loop. That is a deliberate trade for the deal.

---

## 7. Habit and retention system

### 7.1 The loop

| Hooked stage       | Ours                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Trigger (external) | Calendar alert, home screen icon, a share card from a friend, Today prompt                |
| Trigger (internal) | "I need to post today", "I'm blank"                                                       |
| Action             | One tap: "Record today's video" or "Record next"                                          |
| Variable reward    | A new daily prompt, hook shuffle, streak milestones, badges, personal bests, weekly recap |
| Investment         | Script library, idea inbox, Up next queue, streak, tuned prompter settings, takes         |

### 7.2 Features (milestone in brackets)

- **H1 Streak [kernel M7, freezes M9].** A streak day is a local calendar day with at least one kept take, or a practice run that reached at least 80% of the script. Freezes: earn 1 for every 7 streak days, hold at most 2, and they apply automatically on missed days.
- **H2 Calendar reminder [M7].** A `.ics` daily event with an alarm, generated on the device. No server.
- **H3 Today prompt [M9].** A date-seeded prompt from a curated library (120 to start), the same for everyone on a given local date. Buttons: "Write it", "Another hook" (shuffle) and "Record".
- **H4 Weekly goal [M9].** 3, 5 or 7 videos per ISO week (Monday start). A video is a distinct script with at least one kept take that week, so extra takes cannot game it.
- **H5 Idea inbox [M8].** Quick capture from Studio, the manifest shortcut, and the Android share target. Convert an idea into a script with a template.
- **H6 Up next [M8].** An ordered queue that powers "Record next" and batch mode.
- **H7 Badges [M9].** `first_take`, `first_save`, `takes_10`, `takes_50`, `takes_100`, `streak_3`, `streak_7`, `streak_30`, `streak_100`, `batch_day` (5 scripts kept in one day), `challenge_30`.
- **H8 Share cards [M9].** Canvas-generated 1080x1920 PNGs: streak, weekly recap, challenge and badge. Never any script text.
- **H9 30-day challenge [M9].** "30 videos in 30 days": a prompt for each day. It completes after kept takes on 30 different days since joining, with no deadline (forgiving by design).
- **H10 Weekly recap [M9].** A Monday card showing last week's videos, minutes recorded, best take streak and goal status.
- **H11 Quick rating [M9].** After the third kept take: "How did recording feel today?" on a 1 to 5 scale, once.

### 7.3 Guardrails

- At most one sheet per session (the ask ladder in 4.3).
- Streak-loss copy is supportive and always shows the best streak.
- Every habit feature can be turned off in Settings.
- Celebrations respect `prefers-reduced-motion`.

---

## 8. Information architecture

### 8.1 Routes (final state)

| Route                                                                             | Indexable                                      | Milestone | Purpose                                                                                   |
| --------------------------------------------------------------------------------- | ---------------------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `/`                                                                               | yes                                            | M7 copy   | Home: creator hero, classic editor, "Record a video" CTA                                  |
| `/studio`                                                                         | no (noindex, not in sitemap)                   | M3        | The app (hash-routed)                                                                     |
| `/offline`                                                                        | no                                             | M6        | Service worker offline fallback                                                           |
| `/record`, `/record/[preset]`                                                     | yes                                            | M10       | Tool landings: `instagram-reels`, `youtube-shorts`, `tiktok`, `youtube`, `linkedin-video` |
| `/templates`, `/templates/[slug]`                                                 | yes                                            | M8        | 20 script templates                                                                       |
| `/hooks`, `/hooks/[niche]`                                                        | yes                                            | M8        | 8 hook libraries                                                                          |
| `/tools/script-length-checker`, `/tools/caption-counter`, `/tools/hook-generator` | yes                                            | M10       | New creator tools                                                                         |
| `/guides/*` (8 new)                                                               | yes                                            | M10       | Creator guides (13.2)                                                                     |
| `/private-voice-tracking`                                                         | 301 to `/guides/voice-activated-teleprompters` | M1        | Removed feature page                                                                      |
| All other existing routes                                                         | unchanged                                      | -         | Keep, update copy where it is now inaccurate                                              |

`src/content/noindexRoutes.json` lists `["/studio", "/offline"]`. The sitemap filter, content-lint and the SEO crawl check all read it.

### 8.2 Navigation

- Header: wordmark, then "Studio" (a button, primary), Templates (from M8), Guides, Tools, Features. Mobile: wordmark plus a compact "Open Studio" button; the remaining links move into the footer.
- Footer: Studio, Templates, Hooks, Guides, Tools, Features, Compatibility, Privacy, About, GitHub.
- Returning visitors (any Studio data on this device): a sticky bottom bar on content pages on mobile, "Continue in Studio", set by a tiny inline script with no framework.

### 8.3 Studio internal routes (hash router)

`#/` Home · `#/scripts` · `#/scripts/new?template=<id>` · `#/scripts/:id` (editor) · `#/record/:id` (`quick`, `next`, or a script id) · `#/practice/:id` · `#/takes` · `#/takes/:id` · `#/settings` · `#/settings/:section` · `#/inbox` (M8) · `#/receive/:payload` (M8) · `#/challenge` (M9) · `#/prompter-window` (M11). An unknown hash goes to `#/`.

Boot query parameters (from manifest shortcuts and landing CTAs) are never user content: `?go=record|idea|scripts` and `?preset=<presetId>`. Never strip `utm_*` parameters; Umami reads them.

---

## 9. Studio UX specification

### 9.1 Shell

- Mobile: a bottom tab bar with Home, Scripts, Record (center, larger), Takes and Settings, 56 px plus `env(safe-area-inset-bottom)`. Hide the tab bar on Record and Practice.
- Desktop (1024 px and wider): a left rail with the same items. The editor and Record can run side by side (9.6).
- Dark UI tokens: background `#090a09`, text `#f6f0e4`, muted `#aaa89f`, accent `#e4492e`. Define them in `src/styles/studio.css` as `--studio-*` variables. Do not import `global.css` into Studio.
- Touch targets are at least 48 px. Use `100dvh`, and respect `env(safe-area-inset-*)` everywhere.

### 9.2 Home (`#/`)

- **First run (empty library):** a card "Record your first video in 60 seconds" with the starter script preloaded and the buttons "Record now" and "Write my own". Nothing else competes with it.
- **Returning:** a top row with the streak badge and the weekly ring (M9). Below it the Today card (M9), Up next (the first 3 scripts, each with Record), quick actions (+ Script, + Idea, Templates, Practice), recent takes (thumbnails taken from the first frame), and the install card when the ask ladder allows it.
- In standalone mode with empty storage on iOS: the "Bring your scripts from Safari" card (J13).

### 9.3 Scripts (`#/scripts`) and Editor (`#/scripts/:id`)

- **List:** title, words, estimated duration, status chip, and last updated. Search matches title or body. Filter by status. Actions: new, duplicate, delete. Delete is soft and goes to a "Recently deleted" section; purge after 30 days on boot.
- **Editor:**
  - A title field and a body `<textarea>`; markup syntax is defined in 11.6.
  - A toolbar that inserts at the cursor: Section (`# `), Pause (`[pause]`), Emphasis (`**...**`), Highlight (`==...==`), Note (`// `), and a Cue menu (`[breathe]`, `[smile]`, `[look up]`, `[slow]`, `[cut]`).
  - A live stats bar: spoken words, duration at the current WPM, fit badges for 15, 30, 60, 90 and 180 seconds, and the duration of each section.
  - A readability hint when any sentence runs past 25 words.
  - A placeholder warning: "2 placeholders left" when `{...}` remains.
  - Fields: target length, aspect (9:16 or 16:9) and status. Captions fields arrive in M8.
  - Autosave 400 ms after the last edit, with a "Saved" indicator.
  - Actions: Record, Practice, Present (the classic presenter with this text), Send to phone (M8) and Delete.

### 9.4 Record (`#/record/:id`), portrait phone

From top to bottom:

1. **Prompter window,** directly below the notch or Dynamic Island (`env(safe-area-inset-top)` plus 4 px). Width 92%. Height = `windowLines` x line height. A scrim at `rgba(0,0,0,scrimOpacity)`. The cue band sits at `cuePosition` of the window height. A small timer pill (elapsed, or elapsed out of target) sits at the top-right inside the scrim.
2. **Camera preview** filling the screen behind everything: `<video playsinline muted autoplay>`, `object-fit: contain`, black background, mirrored with CSS for the front camera only. The recording itself is never mirrored.
3. **Optional overlays:** safe zone, thirds grid, level line, and the screen-light border.
4. **Bottom controls** in the thumb zone. One strip holds WPM minus, WPM value, WPM plus, A minus and A plus, and the section picker. The bottom row holds Close (left), the Record button (center, 72 px), Flip camera and the Quick settings gear (right). A readiness chip row sits above the strip (M5).

Gestures and behavior:

- A tap on the prompter toggles scrolling. A vertical drag scrubs: pointer-down pauses, and the scroll stays paused after release.
- Record runs the countdown (default 3 s, large numbers, a haptic tick on Android via `navigator.vibrate(10)`), then starts recording and, if `autoStartScroll` is on, the scroll.
- While recording, controls dim to 30% opacity after 2 s. Stop is always visible and full opacity. Touch lock (optional) requires a long-press to unlock.
- Stop pauses the scroll and opens the review sheet.
- Free record: with no script, the prompter is hidden and everything else works.
- With no target set, the target bar is hidden. With a target, a thin progress bar sits under the prompter, and overruns turn it amber.

### 9.5 Review sheet and Takes

- **Review sheet** (bottom sheet, 75% of the height): autoplaying, muted-by-default playback with an unmute button. Shows "Take N", duration, format (MP4 or WebM, resolution, fps) and size.
  - Buttons: **Keep** (primary), **Retake** (rewinds the prompter to the start of the script or section) and **Discard**.
  - After Keep: **Save video** (mobile, opens the share sheet) or **Download MP4** (desktop), **Star**, and **Done**. Helper text: "Save it to Photos now. Browser storage can be cleared."
- **Takes** (`#/takes`): grouped by script, newest first. Badges: Unsaved, Starred, Recovered. A storage meter ("Using 1.2 GB. About 38 min left at 1080p High."). Bulk action: "Delete saved takes".
- **Take detail** (`#/takes/:id`): the player, metadata, Save or Download, Star, Delete, and in M11 Chapters, Captions, Convert and Trim.

### 9.6 Landscape and desktop

- **Phone in landscape** (or aspect 16:9 on a phone): the prompter docks beside the camera as a vertical column 40% wide at full height, and the controls move to the opposite side. Camera side comes from `screen.orientation.angle`: 90 means the camera is on the left, 270 means it is on the right. Verify this on devices, and keep the manual override (Prompter dock: auto, left, right, top).
- **Desktop:** 16:9 by default. The prompter docks top-center over the preview at 46% width (a webcam lens sits top-center). At 1280 px and wider, opening Record from the editor shows the editor (40%) beside the preview (60%). Distance presets in Prompter settings: Laptop (about 50 cm, 28 px), Desk monitor (about 80 cm, 40 px) and Across the room (2 m, 72 px).

### 9.7 Practice (`#/practice/:id`)

The same layout as Record, with the camera preview optional (off by default, toggle on) and no recording. It ends with a summary: duration, average WPM (spoken words passed divided by active scroll time, excluding pauses), the number of pauses, and fit against the target. A run that reaches at least 80% of the script counts toward the streak.

### 9.8 States every screen must handle

Loading, empty, error, offline (the Studio shell works offline), storage unavailable (an in-memory fallback with a "Private browsing: takes are lost when you close this tab" banner), and in-app browser (J2).

---

## 10. Settings specification

Persist one settings object in IndexedDB `kv` under key `settings`. It is versioned, and sanitized on load: clamp numbers, replace unknown values with defaults. The full types are in Appendix B. Every setting below appears in `#/settings/:section`. The most-used settings also appear in the in-record Quick settings sheet (marked Q).

### 10.1 Camera

| Setting          | Values                                                                                                                                                                                                       | Default                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Camera (Q)       | Any `videoinput` device, or Auto by facing                                                                                                                                                                   | Auto, front                     | Labels appear after permission. Refresh on `devicechange`. Lists capture cards and virtual cameras. On iOS, back lenses appear as separate devices ("Back Ultra Wide Camera" and so on).                                                                                                                                                                                                                   |
| Facing (Q)       | Front, Back                                                                                                                                                                                                  | Front                           | Flip stops all tracks before requesting the new camera (required on iOS). Flipping is disabled while recording.                                                                                                                                                                                                                                                                                            |
| Aspect (Q)       | 9:16, 16:9                                                                                                                                                                                                   | 9:16 on phones, 16:9 on desktop | Records the native stream. If the actual stream aspect differs by more than 2%, show "Instagram will crop this video" plus a crop guide. True cropping is Phase 3.                                                                                                                                                                                                                                         |
| Resolution (Q)   | 720p, 1080p, 4K                                                                                                                                                                                              | 1080p                           | Show only what `getCapabilities()` allows. 4K shows "uses more battery and storage".                                                                                                                                                                                                                                                                                                                       |
| Frame rate (Q)   | 24, 25, 30, 50, 60                                                                                                                                                                                           | 30                              | Show only what is supported. Hint: "If lights flicker in your video, switch between 25/50 and 30/60 fps."                                                                                                                                                                                                                                                                                                  |
| Mirror preview   | on, off                                                                                                                                                                                                      | on for front, off for back      | Preview only. The recording is never mirrored.                                                                                                                                                                                                                                                                                                                                                             |
| Grid (Q)         | Off, Thirds                                                                                                                                                                                                  | Off                             |                                                                                                                                                                                                                                                                                                                                                                                                            |
| Safe zones (Q)   | Off, Instagram, YouTube Shorts, TikTok                                                                                                                                                                       | Instagram when 9:16             | Approximate overlays from `platformFacts.ts`, labeled "approximate".                                                                                                                                                                                                                                                                                                                                       |
| Level            | on, off                                                                                                                                                                                                      | off                             | DeviceOrientation. On iOS, call `DeviceOrientationEvent.requestPermission()` from a tap.                                                                                                                                                                                                                                                                                                                   |
| Screen light (Q) | Off, Soft, Bright                                                                                                                                                                                            | Off                             | Front camera only. A warm-white (`#fff4e5`) border glow, 6% or 12% of the short edge, as a fill light.                                                                                                                                                                                                                                                                                                     |
| Pro controls     | Zoom, torch, focus mode and distance, tap to focus (`pointsOfInterest`), exposure mode and compensation, exposure time, ISO, white balance mode and temperature, brightness, contrast, saturation, sharpness | Device defaults                 | Render a control only if `track.getCapabilities()` exposes it. Apply with `applyConstraints({ advanced: [{ ... }] })`. On rejection, revert and toast "Your camera ignored that setting." Store values per device id. iOS exposes fewer controls; lens choice happens through the device picker. "Lock exposure and focus" switches the continuous modes to manual or single-shot at their current values. |

### 10.2 Microphone

| Setting              | Values                       | Default  | Notes                                                                                                                                                     |
| -------------------- | ---------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Microphone (Q)       | Any `audioinput`, or Default | Default  | If the label matches `/bluetooth\|airpods\|buds\|headset\|hands-free/i`, show "Bluetooth mics lower quality and add delay. A wired or USB mic is better." |
| Voice processing (Q) | Standard, Raw, Custom        | Standard | Standard: echo cancellation, noise suppression and auto gain on. Raw: all off, "for external mics in a quiet room". Custom: three separate toggles.       |
| Channels             | Mono, Stereo                 | Mono     | Only when the capability allows it.                                                                                                                       |
| Audio quality        | 128, 192 or 256 kbps         | 128      | `audioBitsPerSecond`.                                                                                                                                     |
| Level meter          | always on in Record          | -        | Web Audio `AnalyserNode`: RMS bar, peak hold, a clip indicator at or above -1 dBFS.                                                                       |
| Mic check            | button                       | -        | Records 5 s with a separate audio-only `MediaRecorder`, then plays it back.                                                                               |

### 10.3 Recording

| Setting                     | Values              | Default            | Notes                                                                                   |
| --------------------------- | ------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| Format                      | Auto, MP4, WebM     | Auto               | Auto prefers MP4 (11.4). Hide any option `isTypeSupported` rejects.                     |
| Quality                     | Standard, High, Max | High               | The bitrate table is in 11.4.                                                           |
| Countdown (Q)               | 0, 3, 5, 10 s       | 3                  |                                                                                         |
| Auto-stop at target         | on, off             | off                | Stops at target plus 3 s. Otherwise the target bar turns amber.                         |
| Start scroll with recording | on, off             | on                 |                                                                                         |
| Stop at section end         | on, off             | on in section mode | Stops 0.8 s after the cue line passes the end of the section.                           |
| Pause button                | on, off             | on                 | Shown only when `MediaRecorder.prototype.pause` exists. Pausing also pauses the scroll. |
| Keep screen awake           | on, off             | on                 | Screen Wake Lock, re-acquired on `visibilitychange`.                                    |
| Touch lock                  | on, off             | off                |                                                                                         |

### 10.4 Prompter

| Setting                    | Range                                                                                                        | Default (phone / desktop)                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Speed (Q)                  | 80 to 240 WPM, step 5                                                                                        | 140 / 140                                                                     |
| Fit to target              | on, off                                                                                                      | on when the script has a target (sets WPM to words / target minutes, clamped) |
| Font size (Q)              | 16 to 96 px                                                                                                  | 30 / 40                                                                       |
| Line height                | 1.1 to 1.8                                                                                                   | 1.35                                                                          |
| Width                      | 30% to 100%                                                                                                  | 92% / 46%                                                                     |
| Alignment                  | left, center                                                                                                 | left                                                                          |
| Font                       | System, Readable (Atkinson Hyperlegible, self-hosted woff2 loaded on demand, include its OFL license), Serif | System                                                                        |
| Text color                 | white, cream `#f6f0e4`, yellow `#ffe066`                                                                     | white                                                                         |
| Scrim opacity              | 0% to 90%                                                                                                    | 55%                                                                           |
| Window lines               | 2 to 12                                                                                                      | 4 / 6                                                                         |
| Dock                       | auto, top, left, right, center                                                                               | auto                                                                          |
| Cue position               | 15% to 60% of the window                                                                                     | 30%                                                                           |
| Cue style                  | band, arrow, line, off                                                                                       | band                                                                          |
| Auto-pause at `[pause]`    | on, off                                                                                                      | on                                                                            |
| Show cue chips             | on, off                                                                                                      | on                                                                            |
| Mirror text                | off, horizontal, vertical, both                                                                              | off (for glass rigs)                                                          |
| Show elapsed and remaining | on, off                                                                                                      | on                                                                            |

### 10.5 Remote and keys

These defaults are active on Record and Practice. When focus is inside a text field, ignore them. Call `preventDefault` for every mapped key (F5 must not reload the page while recording).

| Action                   | Default keys                             |
| ------------------------ | ---------------------------------------- |
| Toggle scroll            | Space, Enter, `b`, `.`, MediaPlayPause   |
| Faster or slower (5 WPM) | ArrowUp, ArrowDown                       |
| Next or previous line    | PageDown, ArrowRight / PageUp, ArrowLeft |
| Next or previous section | `n` / `p`                                |
| Start or stop recording  | `r`, F5                                  |
| Back to start            | Home                                     |

Presentation clickers usually send PageUp/PageDown, arrows, `b`, `.`, F5 or Escape. "Assign key" (Settings > Remote and keys) captures the next `keydown` and binds it. Escape only closes sheets. It never stops a recording. Game controllers come in M11.

### 10.6 Readiness checks (deterministic heuristics, M5)

Run these while the camera is live and not recording. During recording, only the clip and too-quiet checks surface, as small chips.

| Check       | Method                                                                           | Threshold                                    | Message                                       |
| ----------- | -------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| Too dark    | Draw the frame to a 32x18 canvas every 1 s; mean luma (0.299R + 0.587G + 0.114B) | under 55 for 2 samples                       | "Add light in front of you"                   |
| Backlit     | Center region mean against edge mean                                             | center under 0.6 x edge and edge over 150    | "Bright light behind you"                     |
| Noisy room  | RMS noise floor in the first 3 s after the camera starts                         | over -45 dBFS in 3 of 3 samples              | "Room sounds noisy"                           |
| Clipping    | Peak level                                                                       | at or above -1 dBFS more than 3 times in 2 s | "Too loud: move the mic back"                 |
| Too quiet   | RMS while recording and scrolling                                                | under -50 dBFS for 4 s                       | "Mic is very quiet"                           |
| Storage     | `navigator.storage.estimate()` against the bitrate                               | under 10 min left warns; under 3 min blocks  | See J10                                       |
| Battery     | `navigator.getBattery?.()` (Chromium only)                                       | under 15% and not charging                   | "Battery low"                                 |
| Orientation | Aspect against the window orientation                                            | mismatch                                     | "Rotate to portrait" or "Rotate to landscape" |

---

## 11. Technical architecture

### 11.1 Directory layout (new and changed)

```text
src/
  layouts/StudioLayout.astro        Studio shell: noindex, manifest, icons, Umami, no site chrome
  components/UmamiScript.astro      Single Umami tag, used by both layouts
  pages/studio.astro                StudioLayout + <StudioApp client:only="preact" />
  pages/offline.astro               (M6) noindex fallback
  pages/record/...                  (M10)
  pages/templates/..., hooks/...    (M8)
  pages/tools/script-length-checker.astro, caption-counter.astro, hook-generator.astro   (M10)
  studio/                           Preact UI, client only
    StudioApp.tsx router.ts
    screens/   HomeScreen EditorScreen ScriptsScreen RecordScreen PracticeScreen TakesScreen
               TakeScreen SettingsScreen InboxScreen(M8) ReceiveScreen(M8) ChallengeScreen(M9)
               PrompterWindowScreen(M11)
    components/ PrompterOverlay CameraPreview RecordButton Countdown LevelMeter SafeZoneOverlay
               GridOverlay LevelOverlay ScreenLight ReadinessChips BottomSheet TabBar Toast
               StorageMeter PermissionPriming InAppBrowserNotice InstallSheet ReviewSheet ...
  domain/studio/                    Framework-free logic, unit tested
    types.ts db.ts ids.ts kv.ts scriptsRepo.ts takesRepo.ts ideasRepo.ts
    markup.ts words.ts timing.ts prompterScroll.ts
    mediaSupport.ts mime.ts camera.ts cameraControls.ts recorder.ts audioMeter.ts readiness.ts
    exportTake.ts storage.ts inAppBrowser.ts install.ts handoff.ts keymap.ts
    streaks.ts goals.ts badges.ts dailyPrompt.ts challenge.ts asks.ts ics.ts shareCard.ts
    experiments.ts timeline.ts(M11) convert.ts(M11)
  content/studio/
    templates.ts hooks.ts dailyPrompts.ts challenge30.ts presets.ts platformFacts.ts starterScripts.ts
  content/noindexRoutes.json
  sw/sw-template.js                 (M6) service worker source
  styles/studio.css
scripts/
  bundle-budget.mjs (M3)  generate-icons.mjs (M6)  build-sw.mjs (M6)
public/
  icons/ (M6)  fonts/atkinson-hyperlegible/ (M5)
```

The classic presenter (`src/components/Presenter.tsx`, `TeleprompterApp.tsx`) stays. Studio imports `TimeBasedScrollController` from `src/domain/scrollController.ts`, and lazily imports `Presenter` for "Present".

### 11.2 Data layer (IndexedDB)

Database `teleprompter-wtf`, version 1. Create every store in version 1, so later milestones need no schema upgrade.

| Store     | Key             | Indexes                           | Holds                                                    |
| --------- | --------------- | --------------------------------- | -------------------------------------------------------- |
| `scripts` | `id`            | `updatedAt`, `status`, `order`    | `StudioScript`                                           |
| `takes`   | `id`            | `scriptId`, `createdAt`, `status` | `StudioTake` metadata                                    |
| `chunks`  | `[takeId, seq]` | `takeId`                          | `TakeChunk` (Blob per second)                            |
| `ideas`   | `id`            | `createdAt`                       | `StudioIdea`                                             |
| `kv`      | `key`           | -                                 | settings, streak, stats, badges, flags, device id mirror |

- Use `idb`. Wrap every call so a failed `open` falls back to an in-memory implementation with the same interface, and the Studio shows the private-browsing banner.
- **Migrations:** on first Studio boot, if `localStorage['teleprompter-wtf.state']` holds a non-empty script, import it once as the script with id `quick`, titled "Quick script". Record the flag `migrations.quickImported` in `kv`.
- Call `navigator.storage.persist()` after the first kept take, and again on first standalone launch.

### 11.3 Homepage-to-Studio handoff

`handoff.ts` exports `openInStudio(text, opts)`. It dynamically imports the data layer, upserts the script with id `quick` (or `guide-<embedId>` from a guide embed), then sets `location.href = '/studio#/record/quick'`. With empty text it goes to `/studio#/` instead. The homepage bundle must not grow by more than 2 KB gzip; everything else loads on click.

### 11.4 Camera and recording pipeline

1. **Constraints.** Build them from settings:
   - Video: `{ deviceId: { exact } | facingMode: { ideal }, width: { ideal }, height: { ideal }, frameRate: { ideal }, aspectRatio: { ideal } }`. On phones in portrait, request a portrait size (for example 1080x1920) and read back the actual `track.getSettings()`. Never assume orientation.
   - Audio: `{ deviceId, echoCancellation, noiseSuppression, autoGainControl, channelCount }`.
   - Use one `getUserMedia` call for both, so the user sees one prompt.
2. **Fallback ladder** on `OverconstrainedError` or `NotReadableError`: drop the frame rate, then drop the resolution, then drop the device id or facing, then try video-only plus a separate audio request. Stop all tracks before every retry.
3. **Error mapping** to `camera_failed.reason`:

| Error                                   | Reason               |
| --------------------------------------- | -------------------- |
| `NotAllowedError`, `SecurityError`      | `permission_blocked` |
| `NotFoundError`                         | `not_found`          |
| `NotReadableError`, `AbortError`        | `in_use`             |
| `OverconstrainedError` after the ladder | `overconstrained`    |
| No `mediaDevices` (insecure context)    | `insecure_context`   |
| In-app user agent detected              | `in_app_browser`     |
| No `MediaRecorder`                      | `unsupported`        |
| Anything else                           | `unknown`            |

4. **MIME preference.** Check with `MediaRecorder.isTypeSupported` in this order:
   `video/mp4;codecs=avc1,mp4a.40.2`, `video/mp4;codecs=avc1`, `video/mp4`, `video/webm;codecs=vp9,opus`, `video/webm;codecs=vp8,opus`, `video/webm`.
   Derive the container from the actual `recorder.mimeType` after start. Safari and recent Chrome and Edge record MP4. Firefox records WebM, so label it, and from M11 offer "Convert to MP4".
5. **Bitrates** (`videoBitsPerSecond`, in Mbps). 24 and 25 fps use the 30 row; 50 fps uses the 60 row.

| Resolution and fps | Standard | High | Max |
| ------------------ | -------- | ---- | --- |
| 720p30             | 3.5      | 5    | 8   |
| 720p60             | 5        | 7.5  | 10  |
| 1080p30            | 8        | 12   | 16  |
| 1080p60            | 12       | 18   | 24  |
| 2160p30            | 25       | 40   | 50  |
| 2160p60            | 40       | 60   | 75  |

6. **Recorder.**
   - `recorder.start(1000)`. On each `dataavailable` with size > 0, write `{ takeId, seq, blob }` to `chunks` and push to an in-memory array for instant review.
   - Create the take record with status `recording` before `start()`.
   - On stop: set status `ready`, measured `durationMs` (from `performance.now()`, excluding paused time), `sizeBytes`, `chunkCount`, `width`, `height` and `frameRate` (from track settings), and the timeline.
   - Interruptions: on phones and tablets, `visibilitychange` to hidden (mobile browsers suspend capture). On every device: a video track `ended` or `mute`, a `pagehide` while recording, a recorder `error`. Each one stops gracefully, saves, and shows the J8 message. On desktop, switching tabs keeps recording (desktop browsers keep capturing).
   - Recovery on boot: any take still `recording` with chunks becomes `recovered`. Its duration is estimated as `chunkCount x 1000 ms`. Show the recovery toast. Takes with no chunks become `failed` and get deleted.
   - Assemble the Blob from `chunks` in `seq` order, with the recorder's `mimeType`.
   - Known limit: Safari versions that ignore `timeslice` deliver data only on stop. Recovery then cannot work, so document it in compatibility.
7. **Export.** `exportTake.ts`:
   - Build a `File`. The name is the slugified script title (40 characters at most), plus `-take<n>-<yyyymmdd>.<ext>`, or `take<n>` for free records.
   - If `navigator.canShare?.({ files: [file] })`, call `navigator.share({ files: [file] })`. Otherwise download through an `<a download>` with an object URL, revoked after 60 s.
   - Treat `AbortError` from share as cancel, not failure. Set `exportedAt` on success.
8. **Wake lock.** Request it on entering Record or Practice. Release on exit. Re-request on `visibilitychange`.
9. **The script never appears in the video.** We record the camera stream, not the screen.

### 11.5 Prompter scroll engine (Studio)

- Render the spoken text as paragraphs of text nodes plus cue chips. Do not create per-word spans; the cue band is a static overlay, which keeps long scripts cheap.
- `pxPerWord = contentHeight / max(1, spokenWordCount)`. Measure it after layout and on `ResizeObserver` (font size, width, orientation). Speed is `pxPerSecond = (wpm / 60) * pxPerWord`, passed to `TimeBasedScrollController.setSpeed`.
- Top padding = the cue offset, so the first line starts at the cue band. Bottom padding = window height minus the cue offset, so the last line can reach the band.
- Pause markers: after layout, collect each marker's `offsetTop`. In the controller's `onUpdate` (about every 120 ms), when `scrollTop + cueOffset >= markerTop`, pause, mark the marker consumed, and show "Paused at marker. Tap to continue." Restart clears the consumed markers.
- **Timeline capture** (feeds chapters and SRT in M11): while recording, compute the line index at the cue band (`floor((scrollTop) / linePx)`) and the section index from the heading offsets. Push `{ t, line, section }` on every change. Store the result on the take.

### 11.6 Script markup (`markup.ts`)

| Syntax                                                           | Meaning          | On the prompter                                    | Spoken words |
| ---------------------------------------------------------------- | ---------------- | -------------------------------------------------- | ------------ |
| `# Title` at line start                                          | Section start    | A section chip line                                | no           |
| `[pause]`                                                        | Auto-pause point | A "pause" chip; auto-pauses when the setting is on | no           |
| `[breathe]`, `[smile]`, `[look up]`, `[slow]`, `[fast]`, `[cut]` | Delivery cues    | A muted chip                                       | no           |
| `[b-roll: ...]`, `[note: ...]`                                   | Production note  | Hidden                                             | no           |
| `// text` at line start                                          | Private note     | Hidden (visible in the editor)                     | no           |
| `**text**`                                                       | Emphasis         | Bold                                               | yes          |
| `==text==`                                                       | Highlight        | Highlight background                               | yes          |
| `{placeholder}`                                                  | Template slot    | Dashed underline; warns before recording           | yes          |

- Cue names are case-insensitive. Unknown `[...]` stays as visible text. Never swallow user content.
- Output a token list (`section`, `text`, `emphasis`, `highlight`, `cue`, `pause`, `note`, `placeholder`, `paragraphBreak`), plus `spokenText`, `spokenWordCount` and `sections[]` with spoken offsets.
- If `compileScriptGuide` (`src/domain/scriptGuide.ts`) classifies a script as `guided`, use its `spokenText` as the markup input.
- **Word count** (`words.ts`): use `Intl.Segmenter(undefined, { granularity: 'word' })` and count `isWordLike` segments. Fall back to whitespace splitting. Test with English, Hindi and Japanese samples.

### 11.7 Desktop-to-phone and transfer codec (`handoff.ts`, M8 and M6)

- **Payload:** JSON, then UTF-8, then `CompressionStream('deflate-raw')` (raw bytes when unsupported, flag byte `0x00` for raw and `0x01` for deflate), then base64url.
- **Prefixes:** `S1.` for a single script (Send to phone) and `T1.` for a full transfer (scripts, ideas, settings, streak, device id).
- **Send to phone URL:** `https://www.teleprompter.wtf/studio#/receive/S1.<payload>`. The fragment never reaches the server. Show a QR code when the URL is 1,500 characters or less (`qrcode-generator`, error correction `L`, SVG, 280 px). Otherwise show "Too long for a QR code. Share or copy the link instead."
- **Transfer code** (iOS, J13): the `T1.` string is written to the clipboard on a user tap and read back with `navigator.clipboard.readText()` on a tap of "Paste scripts". Imports merge by id, newest `updatedAt` wins. Takes are never included.
- Size limits: refuse payloads over 1 MB decoded, and validate every field with the same sanitizers the repos use.

### 11.8 PWA (M6)

`public/site.webmanifest`:

```json
{
  "id": "/studio",
  "name": "teleprompter.wtf Studio",
  "short_name": "Teleprompter",
  "description": "Teleprompter camera for Reels, Shorts and YouTube.",
  "start_url": "/studio?utm_source=pwa&utm_medium=homescreen",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#090a09",
  "theme_color": "#090a09",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml" }
  ],
  "shortcuts": [
    { "name": "Record", "url": "/studio?go=record&utm_source=pwa&utm_medium=shortcut" },
    { "name": "New idea", "url": "/studio?go=idea&utm_source=pwa&utm_medium=shortcut" },
    { "name": "Scripts", "url": "/studio?go=scripts&utm_source=pwa&utm_medium=shortcut" }
  ],
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": { "title": "title", "text": "text", "url": "url" }
  }
}
```

- **Icons:** `scripts/generate-icons.mjs` rasterizes `public/favicon.svg` with `sharp` into 192, 512, maskable 512 (20% safe padding on `#090a09`) and `apple-touch-icon.png` (180, opaque). Commit the PNGs, so builds never need `sharp`.
- **Head tags:** both layouts get `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` and `<meta name="apple-mobile-web-app-title" content="Teleprompter">`. StudioLayout also gets `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` and `theme-color #090a09`.
- **Service worker:** `scripts/build-sw.mjs` runs after `astro build`. It parses `dist/studio.html` and `dist/offline.html` for every `script src`, `link rel=modulepreload|stylesheet` and the font URLs. It adds `/studio`, `/offline`, the manifest and the icons, then writes `dist/sw.js` from `src/sw/sw-template.js`, injecting `PRECACHE` and `VERSION` (sha256 of the list, first 12 characters).
  - `install`: precache.
  - `activate`: delete old `tw-*` caches, `clients.claim()`.
  - `fetch`:
    - Same-origin `GET` navigations go network-first with a 3 s timeout, then the cached page, then `/offline`.
    - `/_astro/*` and `/icons/*` go cache-first and populate the cache.
    - Everything cross-origin (Umami) and every non-GET passes through.
    - Exception: `POST /share-target` is handled by reading the `formData()`, storing an idea in IndexedDB (same schema), and responding `Response.redirect('/studio#/inbox?shared=1', 303)`.
  - `message` `SKIP_WAITING`: call `skipWaiting()`.
- **Registration:** only from StudioApp, only in production builds: `navigator.serviceWorker.register('/sw.js', { scope: '/' })`. When an update is waiting, show the toast "Update ready" with a Reload button.
- **Nginx:**
  - `location = /sw.js { add_header Cache-Control "no-cache" always; include security headers; }`
  - The manifest is served as `application/manifest+json` with a 1 h cache.
  - `location = /share-target { return 303 /studio#/inbox; }` is the fallback when no service worker is installed.
- **Install state machine** (`install.ts`): `in_app_browser` | `installed` (`display-mode: standalone` or `navigator.standalone`) | `promptable` (captured `beforeinstallprompt`) | `ios_manual` (iOS Safari, not standalone) | `unsupported`. Show sheets only when the ask ladder allows it. Track `appinstalled`.

### 11.9 Security headers and CSP (update both `nginx-security-headers.conf` and `public/_headers`)

- **CSP:**
  - `script-src 'self' 'unsafe-inline' https://analytics.sabya.pm`. Remove Google domains and `'wasm-unsafe-eval'` (no WASM left after M1).
  - `connect-src 'self' https://analytics.sabya.pm`.
  - Keep `media-src 'self' blob:`, `img-src 'self' data: blob: https://sabya.pm`, `worker-src 'self' blob:`.
  - Add `manifest-src 'self'`.
- **Permissions-Policy:** add `screen-wake-lock=(self), accelerometer=(self), gyroscope=(self)`. Keep camera and microphone as `(self)`.
- If the owner enables the first-party Umami proxy (12.3), drop `analytics.sabya.pm` from the CSP, since everything becomes same-origin.

### 11.10 Build and scripts

- `npm run build` becomes `astro build && node scripts/build-sw.mjs`. Before M6 it is just `astro build`.
- `npm run budget` (M3) runs `scripts/bundle-budget.mjs`. For every HTML file in `dist`, it gzip-sums the eagerly referenced JS (`script src` and `modulepreload`) and fails if a content page exceeds 60 KB or `/studio` exceeds its milestone budget (M3: 90 KB, M4 onward: 130 KB, final: 150 KB). Add `budget` to `npm run check`.

---

## 12. Product analytics (Umami only)

### 12.1 Principles

- Umami only, always on, on every page and every Studio screen. No consent banner. The privacy page states what is collected.
- Every event answers a question listed here. Do not add events outside this list without a decision entry.
- Properties are enums, booleans or small numbers. Strings are at most 40 characters. Never free text.
- Use at most 8 properties per event.

### 12.2 Identity

- **Device id:** on first visit, create `localStorage['tw.did']`, 22 base64url characters from `crypto.getRandomValues` (16 bytes). It carries no personal data.
- **On every page load and Studio boot**, call `umami.identify(did, sessionData)`. If `window.umami.identify` is not a function, skip the call. Umami distinct ids need Umami 2.18.0 or later, so the owner must verify the server version (section 18). Older servers do not link sessions by this id.
- **sessionData:** `display` (`browser` or `standalone`), `device_class` (`phone`, `tablet`, `desktop`), `cohort_week` (the ISO week of the first visit, for example `2026-W45`), `takes_bucket` (`0`, `1`, `2_5`, `6_20`, `21_plus`), `streak_bucket`, `app_version`, and any active experiment arms (`exp_<name>`).
- iOS Home Screen apps have separate storage. The transfer code (11.7) carries `did`, so an installed user keeps the same identity.

### 12.3 Implementation

- `src/components/UmamiScript.astro` renders the one tag used by both layouts:
  `<script defer src={PUBLIC_UMAMI_SCRIPT_URL} data-website-id={PUBLIC_UMAMI_WEBSITE_ID} data-domains={PUBLIC_UMAMI_DOMAINS} data-exclude-hash="true"></script>`.
  Defaults: the existing website id and script URL, and `PUBLIC_UMAMI_DOMAINS=www.teleprompter.wtf`, so local and CI builds send nothing.
- `src/domain/analytics.ts` keeps the typed `Analytics` facade:
  - `track(event, props)`: validates against the schema, queues until `window.umami` exists (at most 50 queued), and flushes when it loads.
  - `identify()`.
  - `page(path, title)`: a Studio virtual pageview, `umami.track(p => ({ ...p, url: path, title }))`.
  - `error(area, name)`: throttled to 5 per page load.
  - No direct `umami.*` calls anywhere else.
- Studio virtual pageview paths are normalized and never include ids: `/studio/home`, `/studio/scripts`, `/studio/editor`, `/studio/record`, `/studio/practice`, `/studio/takes`, `/studio/take`, `/studio/settings/<section>`, `/studio/inbox`, `/studio/receive`, `/studio/challenge`.
- Global error capture: `window.addEventListener('error' | 'unhandledrejection')` calls `analytics.error(area, name)`. `name` is `Error.name` mapped to the enum, otherwise `other`.
- **Optional first-party proxy** (owner decision, off by default, `PUBLIC_UMAMI_PROXY=true`). Nginx proxies `location /stats/` to `https://analytics.sabya.pm/` (`resolver`, `proxy_ssl_server_name on`, `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`). The script becomes `/stats/script.js` with `data-host-url="https://www.teleprompter.wtf/stats"`. This reduces ad-block loss at zero cost. The owner may need to set Umami's client IP header option so geolocation keeps working.

### 12.4 Event taxonomy v2 (the complete allowlist)

Classic presenter events stay (with voice properties removed): `started_teleprompter` {`script_size_bucket`, `entry_context`, `script_kind`}, `paused_teleprompter`, `resumed_teleprompter`, `restarted_teleprompter` {`control_source`}, `finished_teleprompter`, `left_teleprompter_early` {`progress_bucket`, `duration_bucket`}, `opened_appearance_panel`, `opened_shortcuts_panel`, `entered_fullscreen`, `exited_fullscreen`, `started_recording`, `finished_recording`, `saved_recording`, `discarded_recording`, `recording_start_failed`, `opened_recording_panel`, `opened_picture_in_picture`, `imported_plain_text_script`, `cleared_script`, `cleared_local_data`, `changed_presenter_setting`, `pace_cue_shown`, `shared_teleprompter_link`, `clicked_open_teleprompter`, `used_speed_calculator`, `used_speaking_time_tool`.

Removed events: every voice, model, consent and GA event.

New events:

| Event                                                                                                           | Properties                                                                 | Question it answers                       |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------- |
| `clicked_open_studio`                                                                                           | `page_type`, `content_cluster?`, `cta_location`                            | Which pages convert to Studio?            |
| `opened_studio`                                                                                                 | `entry`, `display`, `device_class`                                         | Where do creators come from?              |
| `viewed_camera_priming`                                                                                         | -                                                                          | Does priming come before most denials?    |
| `granted_camera`                                                                                                | `ready_bucket`                                                             | Is camera start fast enough?              |
| `camera_failed`                                                                                                 | `reason`                                                                   | What blocks recording, on which devices?  |
| `started_take`                                                                                                  | `aspect`, `resolution`, `fps`, `facing`, `mode`, `countdown`, `has_target` | What setups do creators use?              |
| `stopped_take`                                                                                                  | `take_length_bucket`, `ended_by`, `progress_bucket`                        | Do takes finish the script?               |
| `kept_take`                                                                                                     | `take_number_bucket`, `take_length_bucket`, `fit`                          | Core action; how many tries to a keeper?  |
| `discarded_take`                                                                                                | `take_length_bucket`                                                       | Where do takes fail?                      |
| `exported_take`                                                                                                 | `method`, `container`, `size_bucket`                                       | Do keepers leave the app as usable files? |
| `recording_failed`                                                                                              | `reason`                                                                   | Guardrail                                 |
| `recovered_take`                                                                                                | -                                                                          | Guardrail: how often do crashes happen?   |
| `created_script`                                                                                                | `source`                                                                   | Which creation paths work?                |
| `edited_script`                                                                                                 | `words_bucket` (once per script per session)                               | Script sizes in practice                  |
| `used_template`                                                                                                 | `template_id`                                                              | Which templates drive recording?          |
| `inserted_hook`                                                                                                 | `niche`                                                                    | Hook library value                        |
| `shuffled_hooks`                                                                                                | `niche`                                                                    | Variable-reward engagement                |
| `copied_hook`                                                                                                   | `niche`, `surface`                                                         | SEO hook page value                       |
| `captured_idea`                                                                                                 | `source`                                                                   | Inbox adoption                            |
| `converted_idea`                                                                                                | -                                                                          | Ideas becoming scripts                    |
| `sent_to_phone`                                                                                                 | `method`                                                                   | Desktop-to-phone flow usage               |
| `received_script`                                                                                               | `method`                                                                   | Handoff completion                        |
| `transferred_scripts`                                                                                           | `direction`                                                                | iOS install continuity                    |
| `completed_practice`                                                                                            | `progress_bucket`, `pace_bucket`                                           | Does rehearsal lead to recording?         |
| `changed_studio_setting`                                                                                        | `setting`, `group`                                                         | Which pro settings matter                 |
| `used_remote_key`                                                                                               | `device` (once per session)                                                | Remote adoption (P3)                      |
| `viewed_today_prompt`                                                                                           | -                                                                          | Daily prompt reach                        |
| `started_today_prompt`                                                                                          | -                                                                          | Daily prompt pull                         |
| `extended_streak`                                                                                               | `streak_bucket`                                                            | Habit strength                            |
| `lost_streak`                                                                                                   | `previous_bucket`                                                          | Churn signal                              |
| `used_streak_freeze`                                                                                            | -                                                                          | Freeze value                              |
| `set_weekly_goal`                                                                                               | `goal`                                                                     | Goal adoption                             |
| `reached_weekly_goal`                                                                                           | `goal`                                                                     | Goal completion                           |
| `unlocked_badge`                                                                                                | `badge_id`                                                                 | Milestone pacing                          |
| `shared_progress_card`                                                                                          | `card`                                                                     | Viral loop volume                         |
| `joined_challenge`                                                                                              | -                                                                          | Challenge adoption                        |
| `completed_challenge`                                                                                           | -                                                                          | Challenge completion                      |
| `added_calendar_reminder`                                                                                       | -                                                                          | Reminder adoption                         |
| `shown_install_prompt`                                                                                          | `platform`                                                                 | Install funnel step 1                     |
| `dismissed_install_prompt`                                                                                      | `platform`                                                                 | Install friction                          |
| `installed_app`                                                                                                 | `platform`                                                                 | Install funnel step 2                     |
| `rated_recording`                                                                                               | `score`                                                                    | Qualitative health                        |
| `storage_warning`                                                                                               | `level`                                                                    | Guardrail                                 |
| `js_error`                                                                                                      | `area`, `name`                                                             | Guardrail                                 |
| `used_script_length_checker`, `used_caption_counter`, `used_hook_generator`                                     | - (once per page load)                                                     | Tool page engagement                      |
| `exported_chapters`, `exported_captions`, `converted_take` {`result`}, `trimmed_take`, `opened_operator_window` | as listed                                                                  | M11 adoption                              |

Enum values (define them as `as const` arrays in `analytics.ts`):

- `entry`: home, landing, guide, template, hooks, tool, pwa, calendar, share_card, link, direct. Derive from `utm_source` first (pwa, calendar, share_card), then `#/receive` (link), then a same-origin `document.referrer` path prefix, else direct.
- `display`: browser, standalone. `device_class`: phone, tablet, desktop (coarse pointer and short screen edge under 600 means phone; coarse and 600 or more means tablet; otherwise desktop).
- `ready_bucket`: under_1s, 1_3s, 3s_plus.
- `reason` (camera): permission_blocked, not_found, in_use, overconstrained, insecure_context, in_app_browser, unsupported, unknown.
- `reason` (recording): mime_unsupported, recorder_error, storage_full, interrupted, unknown.
- `aspect`: 9_16, 16_9. `resolution`: 720p, 1080p, 2160p, other. `fps`: 24, 25, 30, 50, 60, other. `facing`: front, back, external.
- `mode`: full, section, batch, free. `countdown`: 0, 3, 5, 10. `has_target`: boolean.
- `take_length_bucket`: under_15s, 15_30s, 30_60s, 60_90s, 90_180s, 3_10m, 10m_plus.
- `ended_by`: user, target, section_end, interruption, error, remote.
- `take_number_bucket`: 1, 2, 3_5, 6_plus. `fit`: under, on_target, over, no_target (on target means within 10%).
- `method` (export): share, download. `method` (send and receive): qr, link. `container`: mp4, webm. `size_bucket`: under_10mb, 10_50mb, 50_200mb, 200mb_plus.
- `source` (script): blank, template, daily_prompt, idea, quick, import, received, challenge, duplicate. `source` (idea): inbox, share_target.
- `direction`: export, import. `pace_bucket`: under_120, 120_150, 150_180, 180_plus.
- `setting`: flattened settings keys such as `camera_resolution` or `prompter_wpm`, generated from the settings schema. `group`: camera, mic, recording, prompter, keys, reminders, data.
- `device` (remote): keyboard, clicker, gamepad. `streak_bucket` and `previous_bucket`: 1, 2_6, 7_29, 30_99, 100_plus. `goal`: 3, 5, 7.
- `badge_id`: the badge list in 7.2. `card`: streak, weekly, challenge, badge. `platform`: android, ios, desktop. `score`: 1 to 5. `level`: 80, 95.
- `area`: site, studio, presenter. `name`: Error, TypeError, RangeError, DOMException, NotAllowedError, QuotaExceededError, other.
- `surface`: page, studio. `result`: success, unsupported, failed.
- `page_type`: add record_preset, template, hooks and studio to the existing list. `content_cluster`: add reels, shorts, tiktok, youtube_landscape, linkedin, templates, hooks, captions and creator.
- `template_id` and `niche`: generated from the content ids at build time; validated at runtime against those lists.

### 12.5 Umami setup and the KPIs (owner, in the Umami UI)

- **Goals:** `kept_take` (core), `exported_take`, `installed_app`, `completed_practice`.
- **Funnels:**
  - F1 Activation: pageview `/studio/record`, then `granted_camera`, `started_take`, `kept_take`, `exported_take`.
  - F2 SEO to creator: a landing pageview (path starts with `/record`, `/templates`, `/hooks`, `/guides` or `/tools`), then `clicked_open_studio`, `opened_studio`, `kept_take`.
  - F3 Install: `shown_install_prompt`, then `installed_app`.
  - F4 Handoff: `sent_to_phone`, then `received_script`, then `kept_take`.
- **Retention report:** weekly cohorts. Filter by session data `device_class` and `display`.
- **Journeys:** starting at `/studio/home`, to find the dominant paths and dead ends.
- **UTM report:** `pwa`, `calendar` and `share_card` sources.

KPI definitions:

- **DAU** = unique visitors that completed the core goal on a day. **MAU** = the same over the trailing 30 days. **DAU/MAU** = the average DAU in the month divided by MAU.
- **Activation** = F1 conversion for first-week cohorts.
- **Guardrails:** `camera_failed` / (`granted_camera` + `camera_failed`); `recording_failed` / `started_take`; `recovered_take` / `started_take`; `js_error` per 100 sessions.

### 12.6 Weekly review ritual (30 minutes, owner)

1. WRC and DAU/MAU trend.
2. F1 drop-off step with the largest loss, broken down by device class and browser.
3. Top `camera_failed` reasons.
4. Retention of last month's cohorts.
5. The best and worst converting landing pages (F2).
6. One decision to make this week, logged in `docs/studio/DECISIONS.md`.

---

## 13. SEO build specification

### 13.1 Page types and required blocks

| Type                                     | Required blocks, in order                                                                                                                                                                                                                                                                                                                                                        | Unique words            | Schema                                       |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| Tool landing (`/record/*`)               | H1; a 1 to 2 sentence direct answer; the primary CTA "Record ... now" opening `/studio?preset=<id>` (above the fold at 390x844); 3 trust chips; "How it works" (3 steps); best settings for the platform (dated facts); 3 starter scripts with "Use this script"; "When to use the built-in app teleprompter instead" (honest); visible FAQ (4 to 6 Q&A); related links (3 to 6) | 600 to 1,000            | WebApplication, BreadcrumbList               |
| Template (`/templates/[slug]`)           | H1; when to use it; the template with timed beats; 2 filled examples; "Use this template" (opens Studio with it); tips; FAQ (3); related                                                                                                                                                                                                                                         | 400 to 800              | Article, BreadcrumbList                      |
| Hooks (`/hooks/[niche]`)                 | H1; intro; 25 hooks in groups, each with Copy and "Record this hook"; why each group works; how to adapt; FAQ (3); related niches                                                                                                                                                                                                                                                | 25 hooks plus 300 words | Article, BreadcrumbList                      |
| Hubs (`/record`, `/templates`, `/hooks`) | H1; intro; a card grid; how to choose                                                                                                                                                                                                                                                                                                                                            | 300 to 600              | CollectionPage plus ItemList, BreadcrumbList |
| Tool (`/tools/*`)                        | H1; the tool island above the fold; how to read the result; limits and facts (dated); FAQ; related                                                                                                                                                                                                                                                                               | 400 to 700              | WebApplication, BreadcrumbList               |
| Guide (`/guides/*`)                      | The existing guide template with a working embed, plus a "Record with camera" CTA                                                                                                                                                                                                                                                                                                | 1,000 to 1,800          | Article, BreadcrumbList (existing)           |

- Never add FAQPage, HowTo, Review or AggregateRating schema.
- Visible FAQs are fine. Schema must always match visible content.

### 13.2 New URL inventory (titles 30 to 65 characters, descriptions 120 to 160)

| URL                            | Title                                                            | H1                                                                 | Description                                                                                                                                                        |
| ------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`                            | Free Online Teleprompter with Camera \| teleprompter.wtf         | Free online teleprompter with camera for Reels, Shorts and YouTube | Read your script right under the lens and record Reels, Shorts and YouTube videos in your browser. Free, no signup, no watermark. Videos save to your device.      |
| `/record`                      | Teleprompter Video Recorder Online \| teleprompter.wtf           | Record video with a teleprompter in your browser                   | Read your script beside the lens and record vertical or landscape video on your phone or laptop. Free, no signup, no watermark, saved to your device.              |
| `/record/instagram-reels`      | Teleprompter for Instagram Reels with Camera \| teleprompter.wtf | Teleprompter for Instagram Reels                                   | Record 9:16 Reels while your script scrolls under the front camera. WPM speed, pause markers and retakes by section. Free, no watermark, saves to your phone.      |
| `/record/youtube-shorts`       | Teleprompter for YouTube Shorts \| teleprompter.wtf              | Teleprompter for YouTube Shorts                                    | Script, record and save vertical Shorts up to 3 minutes with the words right under your lens. Free in your browser, with no app to install and no watermark.       |
| `/record/tiktok`               | Teleprompter for TikTok Videos \| teleprompter.wtf               | Teleprompter for TikTok                                            | Read your TikTok script without looking away. Record 9:16 video in the browser, keep your best take and save it to your phone. Free, no signup, no watermark.      |
| `/record/youtube`              | YouTube Teleprompter with Camera (16:9) \| teleprompter.wtf      | YouTube teleprompter for landscape videos                          | Record 16:9 YouTube videos with a teleprompter on your laptop or phone. Sections, clicker control and mirror mode for glass rigs. Free, no watermark, no upload.   |
| `/record/linkedin-video`       | Teleprompter for LinkedIn Videos \| teleprompter.wtf             | Teleprompter for LinkedIn video                                    | Record confident vertical or landscape LinkedIn videos from your phone or laptop with the script beside the lens. Free, no signup, no watermark, no upload.        |
| `/templates`                   | Video Script Templates for Reels and YouTube \| teleprompter.wtf | Video script templates                                             | Twenty fill-in-the-blank script templates for Reels, Shorts, TikTok and YouTube, each timed beat by beat. Open any template in the teleprompter and record it now. |
| `/hooks`                       | Hooks for Reels, Shorts and TikTok by Niche \| teleprompter.wtf  | Hooks for short videos                                             | Copy proven fill-in-the-blank hooks for fitness, finance, food, beauty, real estate, tech, education and small business, then record one in a single tap.          |
| `/tools/script-length-checker` | Script Length Checker for Reels and Shorts \| teleprompter.wtf   | Will your script fit? Script length checker                        | Paste a script to see its speaking time at your pace and whether it fits 15, 30, 60 or 90 seconds. It shows exactly where to cut. Free, with no signup.            |
| `/tools/caption-counter`       | Instagram Caption and Hashtag Counter \| teleprompter.wtf        | Caption, hashtag and title counter                                 | Count characters for Instagram captions and the 5-hashtag limit, YouTube titles and descriptions, and TikTok captions. See what shows before the more link.        |
| `/tools/hook-generator`        | Hook Generator for Reels and Shorts \| teleprompter.wtf          | Hook generator for short videos                                    | Pick a niche and topic to get proven fill-in-the-blank hooks for Reels, Shorts and TikTok. Template-based and instant, then record your favorite in one tap.       |

Template slugs are listed in 14.1 (title pattern: "{Template name} Template \| teleprompter.wtf"). Hook niches are in 14.2 (title pattern: "{Niche} Hooks for Reels and Shorts \| teleprompter.wtf").

New guides (M10), added to `src/content/guides.ts` with new cluster values (`short_form`, `creator`):

1. `instagram-teleprompter`: "How to use the Instagram teleprompter, and when you need more"
2. `capcut-teleprompter`: "How to use the CapCut teleprompter, plus a desktop option"
3. `how-to-film-talking-head-reels`: "How to film a talking-head Reel on your phone"
4. `how-to-batch-record-videos`: "How to batch record a week of Reels in one hour"
5. `how-to-write-a-30-second-video-script`: "How to write a 30-second video script that holds attention"
6. `teleprompter-remote-control`: "Teleprompter remote control: clickers, keyboards and foot pedals"
7. `best-camera-settings-for-reels`: "Best camera settings for Reels and Shorts in a browser"
8. `external-microphone-for-phone-video`: "Using an external microphone for phone video in the browser"

Reuse the existing illustration family by cluster (`video-creator.webp` for creator, recording and short-form; `mobile-teleprompter.webp` for phone setups; `script-pacing.webp` for writing and timing). Do not generate new raster art.

### 13.3 Homepage changes (M7)

- Title, description and H1 as in 13.2. Keep the exact phrase "online teleprompter" in the title and H1 to protect the head term.
- Above the fold at 390x844: eyebrow, H1, lead, the primary "Record a video" button, the secondary "Use the classic teleprompter" (scrolls to the editor), and trust chips. On narrow screens the hero art moves below the CTA in source order.
- Replace "Three ways to present" and the privacy-flow banner with three blocks: "How it works", "What other apps charge for, free here" (shipped features only) and "Made for Reels, Shorts and YouTube", linking to the `/record/*`, `/templates` and `/hooks` pages as they ship.
- WebApplication schema: update `featureList` to shipped features only. Keep the Offer at price 0.

### 13.4 Internal linking rules

- Every new indexable page gets at least 3 contextual inbound links from existing pages, plus a hub link.
- Each `/record/*` page links to 3 templates, 1 hooks page and 2 guides.
- Each template links to 2 related templates, 1 hooks page and 1 `/record/*` page.
- Each guide's `related` field includes at least one creator page.
- Anchor text is descriptive. Never use "click here", and never repeat the exact same keyword-stuffed anchor.

### 13.5 Technical SEO

- The sitemap filter excludes `noindexRoutes.json`. Content-lint and `seo-crawl-check` skip those routes for canonical and noindex checks, and fail if any other page is noindex.
- `/private-voice-tracking` gets a 301 in nginx. Remove it from `llms.txt`, the sitemap, internal links and the image sitemap.
- Update `llms.txt` with Studio, `/record/*`, templates, hooks and the new tools and guides.
- The RSS feed includes the new guides automatically.
- Core Web Vitals budgets for content pages (mobile Lighthouse): LCP 2.5 s or less, CLS 0.05 or less, TBT 200 ms or less, Performance 90 or more, SEO 100, Accessibility 95 or more.
- Studio JS never loads on content pages. CTAs are plain links.

### 13.6 Content quality gates (extend `scripts/content-lint.mjs` in M10)

- Minimum unique words per page type (13.1).
- Duplicate paragraphs across pages: normalize the text, build 12-word shingles, and fail when the Jaccard similarity of any two paragraphs on different pages exceeds 0.5.
- Title length 30 to 65 characters. Description length 120 to 160 characters.
- Every `/record/*`, template and hooks page contains exactly one primary Studio CTA (`data-analytics-cta`).
- The existing rules stay: no em dash, no placeholder strings, unique titles and descriptions, valid JSON-LD, no broken internal links.

### 13.7 Measurement

Google Search Console stays (the verification meta tags already exist). Every week, check impressions and clicks by cluster, new queries, and cannibalization (two URLs ranking for one query). At weeks 4, 8 and 12, re-prioritize the backlog of templates, hooks and guides by impressions.

---

## 14. Content packs

All content is human-quality, specific and original. It is written once at build time; nothing is generated at runtime. No em dashes. Validate it with unit tests: unique ids, required fields, word-count bounds, and each template example fitting its target at 140 WPM within 20%.

### 14.1 Templates (M8): 20 entries in `src/content/studio/templates.ts`

| Slug                               | Name                             | Target |
| ---------------------------------- | -------------------------------- | ------ |
| `30-second-reel-script`            | 30-second Reel script            | 30 s   |
| `3-tips-reel-script`               | 3 tips Reel                      | 40 s   |
| `myth-vs-fact-script`              | Myth vs fact                     | 30 s   |
| `story-time-script`                | Story time                       | 60 s   |
| `before-and-after-script`          | Before and after                 | 30 s   |
| `day-in-the-life-voiceover-script` | Day in the life voiceover        | 45 s   |
| `product-demo-video-script`        | Product demo                     | 60 s   |
| `ugc-ad-script`                    | UGC ad with 3 hook variants      | 30 s   |
| `self-introduction-video-script`   | Self-introduction                | 45 s   |
| `youtube-intro-script`             | YouTube intro (first 30 seconds) | 30 s   |
| `youtube-video-script-outline`     | YouTube video outline            | 10 min |
| `tutorial-how-to-script`           | Tutorial                         | 60 s   |
| `top-5-list-script`                | Top 5 list                       | 45 s   |
| `hot-take-script`                  | Hot take                         | 30 s   |
| `faq-answer-script`                | Answer a common question         | 30 s   |
| `client-result-case-study-script`  | Client result case study         | 45 s   |
| `real-estate-listing-video-script` | Real estate listing tour         | 60 s   |
| `course-launch-promo-script`       | Course or offer launch           | 45 s   |
| `event-announcement-script`        | Event announcement               | 20 s   |
| `behind-the-scenes-script`         | Behind the scenes                | 30 s   |

The quality bar: write every template to this standard.

```text
id: 30-second-reel-script
beats:
  Hook (0 to 3 s): name the viewer's problem or promise the payoff in one line.
  Context (3 to 8 s): why it matters, in one sentence.
  Value (8 to 24 s): one idea, two concrete steps.
  Close (24 to 30 s): the result plus one call to action.
body:
  # Hook
  If {your audience} keeps {common frustration}, try this.
  # Context
  Most people {common mistake}, and it costs them {cost}. [pause]
  # Value
  First, **{step one}**. It takes {time}.
  Second, {step two}, so {benefit}. [smile]
  # Close
  Do this for a week and {result}. Follow for part two.
```

### 14.2 Hooks (M8): `src/content/studio/hooks.ts`

There are 8 niches with 25 hooks each, in 5 groups of 5. Niches: `fitness`, `personal-finance`, `food`, `beauty`, `real-estate`, `tech`, `education`, `small-business`. Groups: Curiosity, Mistake, Result, Contrarian, Story.

The style bar:

- "Stop doing {habit} if you want {result}."
- "I tried {thing} for {time}. Here is what happened."
- "The {number}-minute {routine} that fixed my {problem}."
- "Nobody tells you this about {topic}."
- "You are not bad at {skill}. You were taught {wrong method}."
- "{Number} signs your {thing} is costing you money."
- "Watch this before you {decision}."
- "I wasted {amount} on {thing} so you do not have to."
- "Here is why {popular advice} is wrong for {audience}."
- "The cheapest way to {result} in {place or time}."

No duplicate patterns across niches unless they are adapted with niche-specific nouns.

### 14.3 Daily prompts (M9): 120 entries in `dailyPrompts.ts`

Shape: `{ id, title, templateId, hook, angle, niches: 'any' | string[] }`. Selection: `index = daysSinceEpoch(localDate) mod length`. Example: `{ id: 'dp-001', title: 'Your biggest beginner mistake', templateId: 'story-time-script', hook: 'The mistake I made in my first year of {topic}.', angle: 'Show the cost, then the fix.', niches: 'any' }`.

### 14.4 30-day challenge (M9): `challenge30.ts`

Thirty days, each `{ day, title, templateId, prompt }`, ordered from easy to harder: introduce yourself, one tip, a myth, a mistake, a tool you love, behind the scenes, a hot take, a case study, and so on.

### 14.5 Starter scripts (M3/M4): `starterScripts.ts`

- "Introduce yourself in 30 seconds", the default first-run script, with `{name}`, `{what you do}`, `{who you help}` and `{what to expect}` placeholders.
- One starter per preset (Reels, Shorts, TikTok, YouTube, LinkedIn).

### 14.6 Presets (M10): `presets.ts`

| Preset id         | Aspect | Target   | Safe zone      | Starter          |
| ----------------- | ------ | -------- | -------------- | ---------------- |
| `instagram-reels` | 9:16   | 30 s     | instagram      | reels starter    |
| `youtube-shorts`  | 9:16   | 60 s     | youtube_shorts | shorts starter   |
| `tiktok`          | 9:16   | 30 s     | tiktok         | tiktok starter   |
| `youtube`         | 16:9   | 0 (none) | off            | youtube intro    |
| `linkedin-video`  | 9:16   | 60 s     | off            | linkedin starter |

`/studio?preset=<id>` applies the aspect, target and safe zone to this session's settings, and opens the matching starter if the library is empty. Otherwise it opens a picker with "Use starter" or "Use my script".

---

## 15. Performance, accessibility and test gates

- **Studio performance:** the camera preview is live within 1 s of permission on a mid-range Android. The prompter scrolls at 60 fps with no layout reads inside the animation frame. No Blob is duplicated in memory. IndexedDB writes are never awaited inside the `dataavailable` handler's critical path (queue them).
- **Budgets:** see 11.10 and 13.5.
- **Accessibility:** WCAG 2.2 AA. Every control is labeled. Focus is visible. Sheets trap focus and close on Escape. The countdown and recording state are announced through `aria-live`. Color is never the only signal. Reduced motion is respected. Studio is fully keyboard operable on desktop.
- **Unit tests** (vitest, `src/**/*.test.ts`): every module in `src/domain/studio/` has tests. Coverage is at least 80% lines for `src/domain/studio`. Use `fake-indexeddb/auto` for the data layer.
- **E2E tests** (Playwright):
  - Keep the existing suites, updated.
  - Add a `media` project with `launchOptions.args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']` and `permissions: ['camera', 'microphone']` for recording tests.
  - Deterministic denial tests replace `navigator.mediaDevices.getUserMedia` via `addInitScript`.
  - Use Playwright's clock API for date-based habit tests.
  - Add a console-error canary test.
- **Manual device QA** (`docs/studio/DEVICE-QA.md`, the owner runs it before launch):
  - Devices: iPhone Safari on iOS 17, 18 and 26, both in Safari and as a Home Screen app; Android Chrome on a mid-range phone; macOS Safari and Chrome; Windows Chrome and Edge; Firefox desktop.
  - Checks: preview orientation, recorded format, plays in Photos or Gallery, uploads to Instagram as a Reel, uploads to YouTube Shorts, front mirror preview against the unmirrored file, flip camera, external mic, 4K where offered, recovery after an app switch, recovery after a killed tab, wake lock, offline Studio, install flow, transfer code, `.ics` reminder.

---

## 16. Milestones (execute in order)

Standard gate for every milestone: `npm run check && npm run test:e2e`. Extra gates are listed per milestone. Docker gates run only if Docker is available; otherwise say so in PROGRESS.md.

### M0. Baseline, archive and logs

1. Set up the branch (0.1).
2. Run `npm ci`. Run `npm run check`. Run `npx playwright install chromium` (skip if present). Run `npm run test:e2e`.
3. Record the exact pass and fail counts and any failing test names in `docs/studio/PROGRESS.md` under "Baseline". Do not fix unrelated baseline failures unless they are trivial.
4. Create `docs/studio/DECISIONS.md` seeded with D-001 to D-014 (5.3).
5. Create the archive tag on the pre-removal state and push it: `git tag archive/voice-follow-v1 origin/main && git push origin archive/voice-follow-v1`.
6. Commit: `chore(studio): record baseline, seed decision log, archive voice follow`.

### M1. Remove voice follow; manual scrolling only

Delete these files:

- `src/components/VoiceTrackingControls.tsx`, `src/workers/precisionWorker.ts`
- `src/domain/browserSpeech.ts`, `smartPace.ts`, `alignment.ts`, `followIndex.ts`, `phonetics.ts`, `modelManager.ts`, and their `.test.ts` files
- `public/audio/pcm-capture-worklet.js`, `public/test-fixtures/local-precision.wav`, `public/models/THIRD-PARTY-NOTICES.txt`
- `scripts/fetch-local-model.mjs`, `verify-local-inference.mjs`, `prepare-runtime-assets.mjs`, `prune-build.mjs`
- `docs/local-precision.md`, `docs/model-licenses.md`
- `src/pages/private-voice-tracking.astro`

Keep `src/domain/followController.ts`: `scrollController.ts` uses `nextVelocity`, and with a `null` target it is the plain base velocity. Keep `pacePlan.ts` and `scriptHighlight.ts`, since manual mode uses them.

Edit these files:

- **`Presenter.tsx`:** remove the voice imports and UI, `applyAlignment`, `handleVoiceActivity`, `updateVoiceMultiplier`, `precisionAnchorRef`, the listening and speaking state and classes, and `followingRef` usage (the pace cue uses scroll progress only). The highlight comes from scroll only.
- **`TeleprompterApp.tsx`:** remove `primeBrowserSpeechInUserGesture` and the `experience-v2-smart` block.
- **`types.ts` and `settings.ts`:** remove `VoiceMode` and `voiceMode`. `sanitizePreferences` silently drops unknown keys (old stored states keep loading). Remove `BrowserCapabilities` fields that only voice used, and update `capabilities.ts`.
- **`analytics.ts`:** remove the voice, model and fallback events and enums, and `voice_mode` from `started_teleprompter` and `left_teleprompter_early`. Remove `'voiceMode'` from `SETTING_NAMES`.
- **`productFacts.ts`:** remove `MODES` and the voice pillars. Set `POSITIONING_STATEMENT` to the line in 1.3, and `CORE_PILLARS` to the creator pillars.
- **Copy:**
  - `index.astro`: a neutral interim copy until M7. Remove the voice sections; keep the existing H1 wording minus "that follows your pace".
  - Update `features.astro`, `compatibility.astro`, `privacy.astro`, `about.astro`, `guides/index.astro`, `guides/[slug].astro` and `public/llms.txt`.
  - `src/content/guides.ts`: rewrite `voice-activated-teleprompters` and `manual-vs-voice-activated-teleprompter` as neutral category education. teleprompter.wtf uses manual WPM-based scrolling, and is described that way honestly. Remove every Smart Pace and Private Precision claim and the voice-mode presets, and fix the `related` links.
- **`package.json`:** remove `@huggingface/transformers`, the `onnxruntime-node` override, and the `assets:prepare`, `models:fetch` and `test:inference` scripts. `build` becomes `astro build`. Keep the `sharp` override only if something still depends on it.
- **`Dockerfile`:** remove the model fetch steps and `PUBLIC_GA_MEASUREMENT_ID`.
- **`nginx.conf`:** remove `/models/`. Add `location = /private-voice-tracking { return 301 https://www.teleprompter.wtf/guides/voice-activated-teleprompters; }`.
- **CI:** the docker job asserts that `/private-voice-tracking` returns 301 and `/` returns 200. Drop the model URL check and the GA build arg.
- **Tests:** delete the voice tests in `tests/advanced-features.spec.ts`, and update `seo.spec.ts`, `app.spec.ts` (headings) and `contentConsistency.test.ts`.
- **`.gitignore`, `eslint.config.js`, `tsconfig.json`:** remove the model and worklet entries.
- **`README.md` and `CHANGELOG.md`:** remove the voice sections. Add an `[Unreleased]` "Removed" entry.

Acceptance:

- `grep -rniE "smart pace|private precision|whisper|onnx|transformers|follows your pace" src public scripts tests docs README.md CONTRIBUTING.md` returns nothing (CHANGELOG history excepted).
- An e2e test wraps `getUserMedia` with a counter via `addInitScript`. Paste, Start, scroll for 2 s: zero calls.
- The Docker image builds without any model download. Record the image size before and after in PROGRESS.md.

Gate: the standard gate, plus Docker build and run, plus `curl -sI` for the 301 and the 200.

Commit: `refactor!: remove voice follow and local speech model; manual WPM scrolling only`.

### M2. Analytics reset: Umami only, always on

- Remove the GA code from `analytics.ts`: `loadGa`, `clearGaCookies`, `parseGaMeasurementId`, the `gtag` and `dataLayer` globals, and the `allow`/`deny` consent state. Remove `PUBLIC_GA_MEASUREMENT_ID` from the env, `.env.example`, the Dockerfile, compose, CI and the README.
- Delete `src/components/PrivacyChoices.tsx` and `PrivacyActions.tsx` and their mounts in `index.astro` and `privacy.astro`. Remove `allowed_usage_analytics` and `declined_usage_analytics`. Leave the `privacyConsent` field in stored state alone (ignored).
- Add `UmamiScript.astro` (12.3) to `Layout.astro`, replacing the consent bootstrap in the head script (keep `bindOpenTeleprompterCtas`).
- Implement the device id, `identify`, `page`, `error`, the queue, and the taxonomy v2 enums and schema (12.4). Keep the compile-time typing and the runtime enum validation. Replace the content-word regex filter with the key rule `^[a-z][a-z0-9_]{0,39}$` and a 40-character string limit.
- Add `PUBLIC_UMAMI_DOMAINS`, defaulting to `www.teleprompter.wtf`. Add the optional `PUBLIC_UMAMI_PROXY` (default `false`); with it, the nginx `/stats/` proxy block ships commented with instructions.
- **Tests:**
  - `package.json` `test:e2e` becomes `npm run build && playwright test` (one build). `playwright.config.ts` serves `dist` on 48171 only. Update `tests/not-found.spec.ts` to drop port 48172.
  - Replace `tests/privacy-analytics.spec.ts` with `tests/analytics.spec.ts`. Route `https://analytics.sabya.pm/script.js` to a stub that records calls on `window.__umami`. Assert the script loads on the first page view without any interaction, that `identify` receives a 22-character id, that `clicked_open_teleprompter` fires with valid props, that invalid props are dropped, and that no request goes to any Google domain.
  - Update `analytics.test.ts` for taxonomy v2.
- **Docs:**
  - Rewrite `docs/analytics.md`: taxonomy v2, identity, Umami setup, the KPIs from 12.5.
  - Rewrite `docs/growth-analytics.md` as an Umami guide (funnels, retention, journeys).
  - Update `docs/seo-metrics.md` and `docs/monetization-readiness.md`, which still reference GA4.
  - Rewrite `src/pages/privacy.astro` as short and accurate: Umami page views and product events with an anonymous device id; scripts, takes and settings stored on the device; nothing uploaded by the app.
- CSP updates (11.9).

Acceptance: a fresh visitor loads Umami on the first page view, with no banner shown. Zero Google requests. The analytics unit tests and e2e are green.

Commit: `feat(analytics)!: Umami-only product analytics with device identity and taxonomy v2`.

### M3. Studio foundation

Scope: `StudioLayout.astro`, `studio.astro`, `noindexRoutes.json` (wire it into `astro.config.ts` with `sitemap({ filter })`, content-lint and `seo-crawl-check`), the data layer (11.2, including the quick-script migration), the router and shell (9.1), Home with the first-run state (9.2), Scripts and Editor (9.3), `markup.ts`, `words.ts`, `timing.ts`, `starterScripts.ts`, homepage handoff (11.3: the "Record video" button in the full `TeleprompterApp`; until M4 it opens `#/scripts/quick`), the header "Studio" link, `bundle-budget.mjs` with `npm run budget` in `check`, and virtual pageviews.

Acceptance:

- `/studio` renders at 390x844 with no horizontal scroll.
- Create, edit, reload and persist work. Search, soft delete and restore work.
- Homepage "Record video" creates or updates the quick script and opens it.
- `/studio` is absent from the sitemap and carries `noindex,follow`. Content-lint and the crawl pass.
- `/studio` eager JS is 90 KB gzip or less. Content pages are 60 KB or less.

Tests: unit tests for markup (every syntax row in 11.6, unknown brackets, nested emphasis), words (en, hi, ja), timing (fit and section durations), the repos (`fake-indexeddb`) and the migration. E2E: create a script, reload, it persists; the homepage handoff; a console-error canary on `/`, `/studio`, one guide and one tool.

Commit: `feat(studio): app shell, local script library, editor with cue markup`.

### M4. Record core

Scope:

- M4.1 `mediaSupport.ts`, `mime.ts` and the bitrates (11.4).
- M4.2 `camera.ts`: constraints, the ladder and error mapping.
- M4.3 `PermissionPriming` and the denied, busy and insecure-context screens.
- M4.4 `inAppBrowser.ts` (user agent tokens `Instagram`, `FBAN`, `FBAV`, `FB_IAB`, `musical_ly`, `TikTok`, `BytedanceWebview`, `Line/`, `Snapchat`) and `InAppBrowserNotice` (J2).
- M4.5 The RecordScreen layout for portrait phone and desktop basics.
- M4.6 `PrompterOverlay` and `prompterScroll.ts` (11.5): WPM, fit-to-target, tap and scrub, font plus and minus, cue band, pause markers, section chips, keyboard defaults (10.5).
- M4.7 `recorder.ts`: start, stop, pause and resume, chunk persistence, recovery, interruptions, wake lock, the timeline.
- M4.8 ReviewSheet: Keep, Retake, Discard, Star, Save or Download.
- M4.9 TakesScreen, TakeScreen and StorageMeter (`storage.ts`), plus `persist()` after the first keep.
- M4.10 Analytics wiring for every Studio event that is live in this milestone.
- M4.11 The Quick settings sheet with a minimal set: camera, flip, resolution, countdown, safe zones, grid. The full settings come in M5.

Acceptance:

- With the fake device: Record shows the countdown, scroll auto-starts, Stop, review plays, Keep, the take is listed, and Download yields a file over 20 KB with an `.mp4` or `.webm` extension matching the actual MIME.
- Reloading mid-recording produces a recovered take on the next load with at least 1 s of media.
- The denial path shows the denied screen and fires `camera_failed` with `permission_blocked` (mocked).
- The in-app user agent (set through `userAgent` in a test context) shows the notice, and Record is replaced.
- `/studio` eager JS is 130 KB gzip or less.

Tests: unit tests for MIME order, the bitrate table, the constraint ladder, error mapping, the WPM to pixels conversion, marker crossing, chunk assembly order, filenames, minutes-left math and in-app detection. E2E in the `media` project as above.

Extra gate: `npx playwright test --project=media`.

Commit: `feat(studio): camera recording with lens-side prompter, takes, export and crash recovery`.

### M5. Pro settings, readiness, layouts and keys

Scope: the settings model, sanitizer and persistence (Appendix B), SettingsScreen with every section in 10.1 to 10.5, the full Quick settings sheet, `cameraControls.ts` capability mapping, device pickers with `devicechange`, mic processing modes, the full level meter, mic check, `readiness.ts` with every check in 10.6, safe zone, grid and level overlays, screen light, the landscape camera-side dock and override, the desktop two-pane layout and distance presets, the Atkinson Hyperlegible font (self-hosted, on demand, with its license), mirror text, and `keymap.ts` with "Assign key".

Acceptance:

- Changing resolution, fps, camera or mic re-acquires the stream with matching constraints (spy on `getUserMedia` arguments in e2e).
- Pro controls render only when their capabilities exist (unit tests with capability fixtures for Android-like, iOS-like and UVC-webcam-like tracks).
- Readiness chips appear for synthetic dark frames and synthetic loud audio (unit tests on the pure functions).
- Keys work, including PageDown, `b` and F5 with `preventDefault`.
- Settings survive a reload.

Commit: `feat(studio): pro camera, mic, recording and prompter settings with readiness checks`.

### M6. PWA

Scope: everything in 11.8: icons, manifest, head tags, `offline.astro`, `sw-template.js` and `build-sw.mjs` (`build` becomes `astro build && node scripts/build-sw.mjs`), registration and the update toast, the share target (service worker POST handler plus the nginx fallback), the install state machine and sheets (Android prompt, iOS steps), transfer code export and import (J13, 11.7), `persist()` on first standalone launch, and the nginx and `_headers` updates.

Acceptance:

- The manifest validates, with `id`, `start_url`, `scope`, `display`, `icons`, `shortcuts` and `share_target` asserted in e2e.
- The service worker registers on `/studio`. After `context.setOffline(true)`, reloading `/studio` renders the shell, and a never-visited content page shows `/offline`.
- The share-target handler logic is a pure function with unit tests.
- A transfer code round trip (export, then import in a fresh context) restores the scripts and the device id.

Extra gate: Docker build and run; `curl -sI /sw.js` shows `no-cache`; `curl -s /site.webmanifest` is valid JSON.

Commit: `feat(pwa): installable offline studio with share target and storage transfer`.

### M7. Launch: positioning, habit kernel, QA and the PR

Scope:

- The homepage per 13.3 and the copy deck (Appendix A).
- Header and footer navigation (8.2) and the returning-visitor sticky bar.
- Rewrite `features.astro` (Studio plus the classic presenter, shipped features only). Rewrite `compatibility.astro` (Studio support: iOS Safari 16.4+, Android Chrome, desktop Chrome, Edge and Safari, Firefox with WebM). Update `about.astro`, `privacy.astro` (Studio storage facts), `README.md`, `CONTRIBUTING.md` (new core boundaries: no AI, no servers, Umami only, local recordings), `llms.txt` and the `CHANGELOG` (`[2.0.0] - Unreleased`).
- Habit kernel: the streak counter (no freezes), the streak badge on Studio Home, `ics.ts` with Settings > Reminders and the ask-ladder step, and the save nudges.
- `docs/studio/DEVICE-QA.md` (15).
- Open the PR `codex/creator-studio` into `main`, titled "Launch: teleprompter.wtf Studio (M1 to M7)", with a summary, gate results and the QA checklist. Do not merge it.

Acceptance:

- Mobile Lighthouse on `/` meets the 13.5 budgets.
- The CTA is visible without scrolling at 390x844.
- The `.ics` output contains `RRULE:FREQ=DAILY`, a `VALARM` and floating local time. No URL is included when standalone on iOS; otherwise `/studio?utm_source=calendar&utm_medium=reminder` is included.
- Streak unit tests cover the same day, the next day, a gap, a timezone change and the DST boundaries.

Extra gates: `npm run test:seo-crawl` and `npm run test:lighthouse` against the container.

Commit: `feat(site): creator positioning, studio launch surfaces and habit kernel`.

### M8. Creator workflow

Scope:

- Templates (14.1) and hooks (14.2) content, with validation tests.
- The `/templates`, `/templates/[slug]`, `/hooks` and `/hooks/[niche]` pages (13.1, 13.2).
- In-app: a Template picker (search, filter by duration and format), a Hook picker with shuffle and insert, the Ideas inbox (with the share-target landing), Up next ordering (move up and down), the status pipeline and filters, captions fields with counters (`platformFacts.ts`), Practice mode (9.7), and Section mode.
- Section mode: a section picker on Record, takes tagged with `sectionIndex`, stop at section end, Takes grouped by section, and "Save starred takes" as one multi-file share in section order.
- Batch mode (J6).
- Send to phone and ReceiveScreen (11.7, J3) with the iOS transfer hint.

Acceptance: these e2e flows pass with the fake device:

- Template to script to kept take.
- Idea to script.
- A section recording produces takes with `sectionIndex`.
- A `#/receive/S1...` link creates a script.
- Batch over 2 scripts produces 2 kept takes and a summary.

Plus lint and SEO crawl on the new pages, and a templates and hooks pages Lighthouse sample.

Commit: `feat(studio): templates, hooks, ideas, up next, sections, batch mode and send to phone`.

### M9. Habit system

Scope:

- Daily prompts (14.3) and the Today card.
- Streak freezes, the best streak, the weekly goal and ring, and stats (videos, takes, minutes recorded, words read, average WPM).
- Badges and the celebration UI.
- Share cards (`shareCard.ts`: canvas 1080x1920, brand colors, the big number, the label, and the small `teleprompter.wtf` text; shared via Web Share files with download fallback; the share URL carries `utm_source=share_card`).
- The 30-day challenge (14.4).
- The Monday weekly recap.
- `asks.ts` (the full ladder in 4.3).
- `experiments.ts`: deterministic local assignment stored in `kv`, at most 2 live experiments, arms exposed in session data. First experiments: the priming copy, and a default countdown of 3 against 0.
- Quick rating.

Acceptance:

- Streak unit tests cover freezes, including earning, the cap of 2, auto-apply across a 2-day gap, and loss beyond the freezes.
- Weekly goal boundary tests use Monday 00:00 local time.
- Badge unlocks are idempotent.
- Ask-ladder unit tests cover cooldowns and "one per session".
- Playwright clock tests: a take on day 1 gives a streak of 1; a take on day 2 gives 2; skipping day 3 with a freeze still gives 3 on day 4.
- A share card blob is over 10 KB, and its PNG is 1080x1920.

Commit: `feat(studio): daily prompt, streaks with freezes, goals, badges, share cards and 30-day challenge`.

### M10. SEO expansion

Scope:

- `/record` and the five preset pages (13.1, 13.2, 14.6), with `/studio?preset=` handling.
- The three tools as Preact islands (`client:visible`, 15 KB gzip or less each). `script-length-checker` uses `words.ts`, `timing.ts` and `markup.ts` and highlights the cut point for each target. `caption-counter` uses `platformFacts.ts` limits with a preview cut at 125 characters. `hook-generator` is a combinatorial template fill of the niche hooks with the user's topic; label it "template-based".
- The eight guides (13.2), and "Record with camera" in the guide embeds (handoff with the authored sample).
- The internal-link rules (13.4), the hubs, `llms.txt` and the sitemap.
- The content-lint upgrades (13.6).
- Update `docs/seo-research.md` with the clusters and the ownership map (2.5).

Acceptance:

- Lint, crawl and Lighthouse (13.5) pass for `/record/instagram-reels`, `/templates/30-second-reel-script`, `/hooks/fitness`, `/tools/caption-counter` and `/guides/instagram-teleprompter`.
- Every new page has at least 3 inbound contextual links (a lint check).

Commit: `feat(seo): creator recording pages, three creator tools and eight guides`.

### M11. Pro export and control

Scope:

- `timeline.ts`: YouTube chapters (first at 00:00, at least 3 chapters, each at least 10 s; otherwise explain why chapters are unavailable) as copyable text, and an SRT export from line marks (each cue runs from when the line reached the cue band to when the next line did). Label it "Timed from your scroll, not from speech."
- `convert.ts` with lazy `mediabunny`: WebM to MP4 (H.264/AAC) when `VideoEncoder.isConfigSupported` accepts avc, with progress and cancel; otherwise an honest unsupported message. Trim start and end with the same pipeline.
- "Suggest trim": decode the audio with `AudioContext.decodeAudioData` and find the first and last 50 ms windows above -40 dBFS, plus 0.3 s padding. The user confirms.
- The operator window `#/prompter-window` via `window.open`, synced through `BroadcastChannel('tw-prompter')` (script, position, WPM, play state), with mirror modes and a fullscreen button. This is the prompter-only mode for glass rigs.
- Gamepad support (A toggles, D-pad up and down change speed, left and right move by line).
- `.docx` import (`fflate` plus `DOMParser` over `word/document.xml`, with paragraphs from `w:p` and text from `w:t`) and `.md` import.
- Print or PDF export of a script through a print stylesheet.

Acceptance: unit tests for the chapters rules, SRT formatting (`HH:MM:SS,mmm`) and docx parsing with a fixture. E2E: the operator window mirrors play and pause from the main window. Conversion runs only behind feature detection (in CI, test the unsupported path).

Commit: `feat(studio): chapters and captions export, MP4 conversion and trim, operator window, gamepad, docx import`.

### Backlog (do not build without an owner go-ahead)

- Things that need a server once traction justifies spend: push reminders, phone-as-remote over a relay, encrypted cloud backup.
- A canvas compositing pipeline: crop to 1:1 and 4:5, 9:16 from a desktop webcam, burned-in captions, and a logo overlay.
- Screen-plus-camera composite recording.
- Hindi UI and Hindi SEO pages.
- `/alternatives/*` pages, owner-verified only.
- A Play Store listing through a Trusted Web Activity.
- An opt-in "Made with teleprompter.wtf" end card.

### 16.13 Progress entry and handoff report format

```text
## M<n> <name> - <YYYY-MM-DD>
Shipped: <bullets>
Files: <key files or areas>
Gates: check <pass/fail>, unit <n passed>/<n total>, e2e <n passed>/<n total>, media <n>/<n>, budget <studio KB / max content KB>, lighthouse <scores if run>
Deviations: <what changed from the plan and why, with decision ids>
Known issues: <bullets>
Owner manual checks: <bullets>
Next: M<n+1>
```

---

## 17. Risks and mitigations

| Risk                                                                         | Impact                          | Mitigation                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Instagram's built-in teleprompter is good enough for many                    | Weak acquisition from P1        | Win on the loop (library, sections, batch, daily prompt, any platform, desktop writing); measure F2 by cluster; double down where it converts |
| iOS Safari camera and recorder quirks (orientation, memory at 4K, timeslice) | Failed takes                    | 1080p30 default, 4K warning, recovery, a device QA matrix, honest compatibility notes                                                         |
| iOS Home Screen app storage is separate from Safari                          | Lost scripts and confused users | Install early (after the first export), the transfer code, `.ics` without a link when installed                                               |
| Safari evicts storage for sites not visited in 7 days of use                 | Lost unsaved takes              | Save nudges, the unsaved badge, the storage meter, install prompt, `persist()`                                                                |
| In-app browsers block recording                                              | Broken share-card loop          | Detection, the notice, open-in-browser with the script carried in the fragment                                                                |
| Firefox records WebM only                                                    | Instagram may reject the file   | Label the format; Convert to MP4 in M11                                                                                                       |
| Ad blockers block Umami                                                      | Undercounted metrics            | The optional first-party proxy (12.3); read ratios rather than absolutes                                                                      |
| A stable device id is pseudonymous personal data in some jurisdictions       | Legal exposure                  | The owner's call (explicitly accepted); the privacy page discloses it                                                                         |
| Scaled-content risk on templates and hooks                                   | Rankings drop                   | Editorial quality gates (13.6), human-quality content, growth driven by GSC                                                                   |
| A young domain ranks slowly                                                  | Slow growth                     | Long-tail utility pages first, a strong internal-link graph, share-card and script-link loops                                                 |
| A cheaper agent drifts from the plan                                         | Rework                          | Small milestones, explicit acceptance criteria, gates, the decision log, PROGRESS entries                                                     |

---

## 18. Owner checklist and operating cadence

Before M2 ships:

- Confirm the Umami server at `analytics.sabya.pm` runs 2.18.0 or later (needed for distinct ids). Upgrade it if not.
- Decide on the first-party proxy (12.3).

Before merging the launch PR:

- Run `docs/studio/DEVICE-QA.md` on real devices.
- Upload one take each to Instagram Reels and YouTube Shorts.
- Verify every claim on `/` and `/features`.
- Build and deploy the Docker image the usual way.

After launch:

- Submit the sitemap in GSC and Bing.
- Create the Umami goals, funnels and retention report (12.5).
- Run the weekly 30-minute review (12.6).

Every 4 weeks: recalibrate the 1.4 targets, re-prioritize SEO clusters with GSC data, and choose the next backlog item from data. Do not choose from opinion.

---

## Appendix A. Copy deck (use these strings verbatim; no em dashes)

**Homepage**

- Eyebrow: "Free · No signup · No watermark"
- H1: "Free online teleprompter with camera for Reels, Shorts and YouTube"
- Lead: "Write or paste a script, then record with the words right under your lens. Redo any line, keep your best take, and save it straight to your phone. Nothing is uploaded."
- Primary CTA: "Record a video". Secondary: "Use the classic teleprompter".
- Chips: "No login", "No watermark", "1080p and 4K", "Saves to your device"
- How it works: "1. Write or paste your script." "2. Record with the words under your lens." "3. Save to your phone and post anywhere."
- Free features heading: "What other apps charge for, free here"
- Homepage FAQ, as visible Q&A:
  - "Is it really free?" Yes. No trial, no paywall, no watermark.
  - "Where is my video saved?" On your device until you save it to Photos or download it. Nothing is uploaded.
  - "Does it work on iPhone and Android?" Yes, in Safari and Chrome. Add it to your Home Screen for full-screen recording.
  - "Can I post straight to Instagram?" Save the video, then post it from Instagram, or pick Instagram in the share sheet.
  - "Does it work for landscape YouTube videos?" Yes. Switch to 16:9 on your laptop or turn your phone sideways.

**Studio**

- First run: "Record your first video in 60 seconds" / "We loaded a 30-second starter script. Edit it or paste your own." / "Record now" / "Write my own"
- Priming: "Camera and mic, please" / "Your video is recorded and saved on this device. Nothing is uploaded." / "Allow camera and mic" / "Not now"
- Denied: "Camera access is off" / "Tap the aA or lock icon next to the address, open website settings, allow Camera and Microphone, then reload." / "Try again" / "Use the teleprompter without camera"
- Busy: "Your camera is busy" / "Close other apps or tabs using the camera, then try again."
- Insecure context: "Open this page at https://www.teleprompter.wtf to use the camera."
- In-app browser (iOS): "Instagram's browser can't record video" / "Tap the three dots, then Open in browser. Your script comes with you." / "Copy link"
- In-app browser (Android): "Open in Chrome to record" / "Open in Chrome"
- Review: "Take {n}" / "Keep" / "Retake" / "Discard" / "Save video" / "Download MP4" / "Save it to Photos now. Browser storage can be cleared."
- Recovery: "We recovered a take from your last session." / "View take"
- Interruption: "Recording stopped when the app went to the background. Your take is saved."
- Marker pause: "Paused at marker. Tap to continue."
- Storage: "About {m} minutes of recording space left at {quality}." / "Not enough space for a new take. Save and delete old takes, or lower the quality."
- Private mode: "Private browsing: takes are lost when you close this tab."
- Install (Android): "Install teleprompter.wtf" / "Full screen, works offline, one tap from your home screen." / "Install" / "Not now"
- Install (iOS): "Add to your Home Screen" / "Open the Share menu, then tap Add to Home Screen. The app opens full screen and keeps your takes safer." / "We copied your scripts. In the app, tap Paste scripts." / "Show me how"
- Transfer: "Bring your scripts from Safari" / "Paste scripts" / "Scripts added: {n}"
- Streak: "{n}-day streak" / "Recorded today. See you tomorrow." / "Fresh start today. Your best streak is {best} days." / "A streak freeze kept your {n}-day streak alive."
- Weekly goal: "{done} of {goal} videos this week"
- Today: "Today's prompt" / "Write it" / "Another hook" / "Record"
- Reminder: "Daily reminder" / "Add to calendar" / "We will create a daily calendar alert at {time}. You can change it in your calendar."
- Batch: "Next up: {title}" / "Starting in {s}" / "Skip" / "Stop batch" / "Batch done: {n} videos, {mm:ss} recorded." / "Save all"
- Send to phone: "Scan with your phone camera" / "Too long for a QR code. Share or copy the link instead." / "Using the Home Screen app? Copy transfer code"
- Rating: "How did recording feel today?"
- Update: "Update ready" / "Reload"

## Appendix B. TypeScript contracts

```ts
// src/domain/studio/types.ts
export type Aspect = '9:16' | '16:9';
export type ScriptStatus = 'idea' | 'draft' | 'ready' | 'recorded' | 'posted';

export interface StudioScript {
  id: string; // randomId() or 'quick' or 'guide-<embedId>'
  title: string;
  body: string; // markup, section 11.6
  status: ScriptStatus;
  templateId: string | null;
  targetSeconds: number; // 0 means no target
  aspect: Aspect;
  caption: string;
  hashtags: string;
  youtubeTitle: string;
  youtubeDescription: string;
  order: number; // Up next order, lower first
  plannedFor: string | null; // YYYY-MM-DD local
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  lastRecordedAt: number | null;
  takeCount: number;
}

export type TakeStatus = 'recording' | 'ready' | 'recovered' | 'failed';
export interface TimelineMark {
  t: number; // ms since recording start, excluding paused time
  line: number;
  section: number;
}

export interface StudioTake {
  id: string;
  scriptId: string | null; // null for free record
  sectionIndex: number | null;
  number: number; // Take N within script (and section)
  status: TakeStatus;
  mimeType: string; // actual recorder.mimeType
  container: 'mp4' | 'webm';
  width: number;
  height: number;
  frameRate: number;
  facing: 'front' | 'back' | 'external';
  durationMs: number;
  sizeBytes: number;
  chunkCount: number;
  kept: boolean;
  starred: boolean;
  exportedAt: number | null;
  createdAt: number;
  timeline: TimelineMark[];
  trim: { startMs: number; endMs: number } | null; // M11
}

export interface TakeChunk {
  takeId: string;
  seq: number;
  blob: Blob;
}

export interface StudioIdea {
  id: string;
  text: string;
  url: string | null;
  source: 'inbox' | 'share_target';
  createdAt: number;
  convertedScriptId: string | null;
}

export type KeyAction =
  | 'toggleScroll'
  | 'faster'
  | 'slower'
  | 'lineForward'
  | 'lineBack'
  | 'sectionForward'
  | 'sectionBack'
  | 'toggleRecord'
  | 'restart';

export interface AdvancedCameraValues {
  zoom: number;
  torch: boolean;
  focusMode: string;
  focusDistance: number;
  exposureMode: string;
  exposureCompensation: number;
  exposureTime: number;
  iso: number;
  whiteBalanceMode: string;
  colorTemperature: number;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}

export interface StudioSettings {
  version: 1;
  camera: {
    deviceId: string | null;
    facing: 'user' | 'environment';
    aspect: Aspect;
    resolution: '720p' | '1080p' | '2160p';
    frameRate: 24 | 25 | 30 | 50 | 60;
    mirrorPreview: boolean;
    grid: 'off' | 'thirds';
    safeZone: 'off' | 'instagram' | 'youtube_shorts' | 'tiktok';
    level: boolean;
    screenLight: 'off' | 'soft' | 'bright';
    advanced: Record<string, Partial<AdvancedCameraValues>>; // keyed by deviceId
  };
  mic: {
    deviceId: string | null;
    processing: 'standard' | 'raw' | 'custom';
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    channelCount: 1 | 2;
    audioBitrate: 128000 | 192000 | 256000;
  };
  recording: {
    format: 'auto' | 'mp4' | 'webm';
    quality: 'standard' | 'high' | 'max';
    countdownSeconds: 0 | 3 | 5 | 10;
    autoStopAtTarget: boolean;
    autoStartScroll: boolean;
    stopAtSectionEnd: boolean;
    pauseButton: boolean;
    keepScreenAwake: boolean;
    touchLock: boolean;
  };
  prompter: {
    wpm: number; // 80..240 step 5
    fitToTarget: boolean;
    fontSizePx: number; // 16..96
    lineHeight: number; // 1.1..1.8
    widthPct: number; // 30..100
    align: 'left' | 'center';
    fontFamily: 'system' | 'readable' | 'serif';
    textColor: '#ffffff' | '#f6f0e4' | '#ffe066';
    scrimOpacity: number; // 0..0.9
    windowLines: number; // 2..12
    dock: 'auto' | 'top' | 'left' | 'right' | 'center';
    cuePosition: number; // 0.15..0.6
    cueStyle: 'band' | 'arrow' | 'line' | 'off';
    autoPauseMarkers: boolean;
    showCues: boolean;
    mirrorText: 'off' | 'horizontal' | 'vertical' | 'both';
    showElapsed: boolean;
    showRemaining: boolean;
  };
  keys: Record<KeyAction, string[]>; // KeyboardEvent.key values
  reminders: { enabled: boolean; time: string }; // 'HH:MM'
  habit: { weeklyGoal: 3 | 5 | 7; streaksEnabled: boolean; dailyPromptEnabled: boolean };
}

export interface StreakState {
  current: number;
  best: number;
  lastActiveDate: string | null; // YYYY-MM-DD local
  freezes: number; // 0..2
  freezeUsedDates: string[];
  activeDates: string[]; // capped at the last 400 days
}
```

Defaults: phone (coarse pointer, short screen edge under 600) or desktop, chosen once on first run and stored.

- **camera:** facing `user`, aspect `9:16` on phone / `16:9` on desktop, resolution `1080p`, frameRate 30, mirrorPreview true, grid `off`, safeZone `instagram` on phone / `off` on desktop, level false, screenLight `off`.
- **mic:** processing `standard` (all three toggles true), channelCount 1, audioBitrate 128000.
- **recording:** format `auto`, quality `high`, countdownSeconds 3, autoStopAtTarget false, autoStartScroll true, stopAtSectionEnd true, pauseButton true, keepScreenAwake true, touchLock false.
- **prompter:** wpm 140, fitToTarget true, fontSizePx 30 / 40, lineHeight 1.35, widthPct 92 / 46, align `left`, fontFamily `system`, textColor `#ffffff`, scrimOpacity 0.55, windowLines 4 / 6, dock `auto`, cuePosition 0.3, cueStyle `band`, autoPauseMarkers true, showCues true, mirrorText `off`, showElapsed true, showRemaining true.
- **keys:** as in 10.5.
- **reminders:** disabled, `19:00`.
- **habit:** weeklyGoal 5, streaksEnabled true, dailyPromptEnabled true.

## Appendix C. Platform facts (store in `src/content/studio/platformFacts.ts` with `verifiedOn: '2026-11-04'`)

Show the date wherever these facts appear on a page. The owner re-verifies them every quarter.

- **Instagram Reels:** vertical 9:16, 1080x1920 recommended. The maximum length varies by account and rollout (2026 sources conflict between 3 and 20 minutes), so never state a hard maximum. Common creator guidance: 15 to 90 seconds for reach (advice, not a platform rule).
- **Instagram hashtags:** up to 5 per post or Reel (Instagram announced the cap in December 2025, with a gradual rollout).
- **Instagram caption:** up to 2,200 characters. About the first 125 characters show before "more" (varies by device).
- **YouTube Shorts:** up to 3 minutes (since October 2024), vertical or square.
- **YouTube:** titles up to 100 characters, descriptions up to 5,000. Chapters need the first timestamp at 00:00, at least 3 timestamps, and at least 10 seconds per chapter.
- **TikTok:** captions up to 4,000 characters (the owner verifies this before it ships).
- **Approximate safe zones** for 1080x1920 overlays, labeled "approximate, apps change their UI":
  - Instagram Reels: top 13%, bottom 20%, right 12%, left 4%.
  - YouTube Shorts: top 10%, bottom 20%, right 15%.
  - TikTok: top 8%, bottom 20%, right 15%.
- **Browsers:** Safari and recent Chrome and Edge record MP4 with `MediaRecorder` (always feature-detect). Firefox records WebM. Web Share with files works on iOS, Android, macOS and Windows; Linux falls back to download.
- **iOS:**
  - iOS 26 opens sites added to the Home Screen as web apps by default.
  - Home Screen web apps have storage separate from Safari.
  - Safari deletes site data for sites not opened during 7 days of Safari use (Home Screen apps excepted).
  - Web push needs a Home Screen install and a server, so it is not used here.

## Appendix D. Paid feature matrix: where others gate it, and where we ship it

| Feature                                                | Where others gate or lack it (reported)                   | Ours                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------- |
| No watermark                                           | BIGVU free plan watermarks                                | Never watermark (M4)                                                 |
| 1080p and 4K                                           | BIGVU paid for 1080p; Teleprompter.com Pro for 4K         | Free, device permitting (M5)                                         |
| Mirror horizontal and vertical                         | Reported as Pro on Teleprompter.com                       | Free (classic now, Studio M5)                                        |
| Remote: Bluetooth, keyboard, foot pedal                | Paid tiers in several apps                                | Free (M5); mapping and gamepad (M11)                                 |
| Second-device or operator control                      | PromptSmart control room; Teleprompter Pro browser remote | Operator window (M11); a networked phone remote waits on the backlog |
| Rich emphasis                                          | Teleprompter for Video, Teleprompter Pro                  | Markup emphasis and highlight (M3)                                   |
| Countdown                                              | Common                                                    | M4                                                                   |
| Speed in WPM and fit-to-duration                       | Rare                                                      | M4                                                                   |
| Pause markers                                          | Rare                                                      | M4                                                                   |
| Script library                                         | Teleprompter.com cloud scripts                            | Local library (M3)                                                   |
| Document import                                        | Various                                                   | txt/md (M3/M11), docx (M11)                                          |
| Multiple takes and best take                           | BIGVU                                                     | M4                                                                   |
| Section or scene recording                             | BIGVU scenes                                              | M8                                                                   |
| External mic selection                                 | Teleprompter.com                                          | M5                                                                   |
| Pro camera controls                                    | Native apps                                               | Capability-gated (M5)                                                |
| Captions                                               | BIGVU (AI)                                                | Script-timed SRT, no AI (M11)                                        |
| Chapters                                               | Rare                                                      | M11                                                                  |
| Logo or branding overlay                               | Teleprompter for Video in-app purchase                    | Phase 3                                                              |
| Voice tracking                                         | PromptSmart, Teleprompter.com                             | Not built (by decision)                                              |
| AI scripts, background removal, eye-contact correction | BIGVU, Captions                                           | Not built (no AI)                                                    |
| Apple Watch control                                    | Teleprompter Pro                                          | Not possible on the web                                              |

## Appendix E. Kickoff prompts

### E.1 Kickoff (paste into Codex for the first session)

```text
You are the implementation engineer for teleprompter.wtf, hosted at https://www.teleprompter.wtf (repo SABYA648/Telemprompter-WTF: Astro 7 static site with Preact islands, served by Nginx in Docker).

1. Read /upgrade_prompt.md end to end before changing anything. It is the approved product plan and the single source of truth. Section 0 and sections 9 to 16 plus the appendices are binding contracts.
2. Follow section 0 exactly: work on branch codex/creator-studio (create it from origin/main, or merge origin/main into it), never push to main, never deploy, add no dependencies beyond section 0.4, no AI features, no servers or uploads, Umami as the only analytics.
3. In this session complete milestones M0, M1 and M2 from section 16, in order. For each one: implement exactly the listed scope, add the listed tests, run the gate commands, fix every failure, update docs/studio/PROGRESS.md (format 16.13) and docs/studio/DECISIONS.md, commit with the milestone's commit message, and push the branch.
4. If a gate fails because of a failure recorded in the M0 baseline, note it and continue. If you are blocked (no network, no browser binary, missing permission), stop and report exactly what is blocked and what you tried.
5. End with the handoff report: milestones completed, commit hashes, gate results with counts, deviations with decision ids, manual checks the owner must run, and the next milestone.
```

### E.2 Continue (one milestone per session from M3 onward)

```text
Continue the teleprompter.wtf Studio build. Re-read section 0 of /upgrade_prompt.md, the section 16 entry for <Mx>, every section it references, and docs/studio/PROGRESS.md plus docs/studio/DECISIONS.md. Run git fetch origin, check out codex/creator-studio and merge origin/main. Then implement <Mx> completely: scope, tests, gates, docs, commit with the given message, push. Stop after <Mx> and give the handoff report.
```

### E.3 Fix-up (when a milestone report shows gaps)

```text
Re-open <Mx> on codex/creator-studio. The report shows: <paste gaps>. Fix only these gaps against the <Mx> acceptance criteria in /upgrade_prompt.md, rerun the <Mx> gates, update PROGRESS.md, commit "fix(<area>): close <Mx> gaps", push, and report.
```
