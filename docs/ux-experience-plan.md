# teleprompter.wtf — UI / UX Experience Plan

**Status:** Execution blueprint (v1.1)  
**Scope:** Feel, first experience, editor → presenter flow, mobile, progressive disclosure, and the **Smart Pace reliability moat** (including an optional self-hosted STT path with hard anti-abuse). Not SEO strategy, not monetization ads.  
**North star:** *Arrive. Paste. Speak. It follows. Leave.*

---

## 0. Design thesis

A teleprompter is not a website. It is a **performance instrument**.

The moment someone lands here, they are already late for something: a YouTube take, a Reel, a webinar, a pitch. They do not want to learn a product. They want text to move at the speed of their mouth.

**Smart Pace is the moat.** Competitors can clone a scroll box. The defensible feeling is: *it keeps up with me without drama.* That means Smart Pace is default, visible as calm confidence (not a settings science project), and **reliable as hell** — not demoted to an advanced toggle to paper over flakiness.

Private Precision, recording, PiP, guides, and SEO pages stay progressive: invisible until needed, or below first successful present. Smart Pace is not in that bucket. Smart Pace *is* the product promise behind “follows your voice.”

### The product in one sentence

> Open the page. Paste. Start. The stage goes dark, words rise, and the scroll follows your speaking — every time it can, with graceful fallback when it cannot.

### What “great” feels like

| Moment | Feeling |
| --- | --- |
| Land | “This *is* the teleprompter.” Not a landing page that happens to contain one. |
| Empty editor | A quiet, large, inviting surface. Paste is the only job. |
| Paste | Instant confirmation. Word count appears. Start becomes inevitable. |
| Start | Full-screen stage in under a second. Mic ask is part of *following you*, not a wall before the tool exists. |
| Speak | Text is the hero. Scroll matches rhythm. Controls fade. Listening feels calm, not “AI.” |
| Glitch | If mic dies or STT blips, scroll never lurches; Manual cadence holds; one quiet status line. |
| Adjust | Touch or key changes speed/size without hunting menus. |
| Leave | Exit restores the script, unchanged. Ready for take two. |
| Mobile | Same verb sequence. Thumb-reachable Start. Presenter usable one-handed. |

---

## 1. Diagnosis of the current experience

Grounded in the present `index` + `TeleprompterApp` + `Presenter` + `global.css`:

### What is already right

- Local-first privacy story is strong and honest.
- Manual mode has no hard dependency on mic/model/network.
- Presenter auto-hides chrome; keyboard shortcuts exist.
- Progressive disclosure of Precision / recording / PiP is architecturally correct.

### What is broken as *feeling*

1. **The first viewport is a marketing page, not a tool.**  
   SEO H1 (“Free online teleprompter that follows your voice”) overpowers the brand. Support copy + trust line + editor heading (“Ready when you are”) + eyebrow (“Your script”) all compete. The user does not get one clear composition.

2. **There is no “come in and paste” ritual.**  
   Clipboard paste works as browser default, but there is no Smart Paste: no Paste button, no auto-offer when clipboard looks like a script, no empty-state that teaches the one gesture. On mobile Safari especially, paste is not discoverable.

3. **Start is buried in chrome.**  
   Primary CTA sits under meta rows (save status, WPM). Disabled state with no explanation. On mobile, privacy launcher + secondary text buttons crowd the critical path.

4. **Visual language reads like a blog, not a stage.**  
   Cream paper (`#f4efe5`), terracotta accent, Inter — a familiar “AI product” look that does not say *performance*. Brand wordmark is nav-scale, not hero-scale.

5. **Presenter power is hidden behind clutter on small screens.**  
   Bottom control strip becomes a horizontal scroll of equal-weight buttons. Play / speed / exit do not win hierarchy. Voice panel adds cognitive load before the first scroll.

6. **SEO / education content sits in the same scroll as activation.**  
   “How it helps,” six feature cards, guide links — fine for SEO, fatal when they push the tool out of the first experience. Content must live *after* first success, or on separate routes.

7. **Returning users and new users get the same noisy shell.**  
   Restored scripts should feel like “continue,” empty state should feel like “begin.” Today both get the same essay of UI.

8. **Smart Pace is the moat but not yet “reliable as fuck.”**  
   Defaulting to it is correct product instinct; RMS-only cadence will still feel flaky in real rooms. Reliability engineering (and optional session-bound hosted STT) is part of the UX plan, not a later backlog item.
---

## 2. Experience principles (non-negotiable)

1. **Tool before story.** The first screen is the instrument. Marketing copy never displaces paste + start.
2. **One verb at a time.** Empty → Paste. Pasted → Start. Presenting → Speak. Advanced → Ask.
3. **Brand is the stage name.** `teleprompter.wtf` is the hero identity; SEO phrases live in `<title>` / meta / below-fold, not as the visual H1 competing with the editor.
4. **Paste is a first-class action.** Not an implied browser gesture.
5. **Presenter is cinema, not dashboard.** Text dominant. Controls ephemeral. Settings in a drawer, not a cockpit.
6. **Mobile is a first-class stage.** Same three steps; larger targets; sticky Start; no horizontal button soup.
7. **Smart Pace is the moat — ship it default and make it trustworthy.** UI stays calm; reliability work is mandatory, not optional polish. Private Precision / record / PiP never greet a first-time user.
8. **Never punish a denied mic.** Manual scroll must still feel like a finished product. Denial is a branch, not a failure of the whole app.
9. **Motion is presence, not decoration.** 2–3 intentional transitions: enter stage, fade chrome, listening pulse.
10. **SEO is infrastructure, not UX.** Keep routes and metadata; never let them shape the first 5 seconds.
11. **Honesty over magic.** Mic permission and any server STT are explained in one line at the moment of ask — never as homepage theater.
12. **No free public STT API.** If a self-hosted recognizer exists, it serves *active teleprompter sessions only*, with abuse controls that assume scrapers will try.

---

## 3. The ideal journey (storyboard)

### Scene A — Arrival (0–2s)

```
┌─────────────────────────────────────────────────────────┐
│  teleprompter.wtf                              Guides   │  ← quiet chrome
│                                                         │
│                         Paste                           │
│                                                         │
│     ┌─────────────────────────────────────────────┐     │
│     │                                             │     │
│     │   Paste your script                         │     │  ← the product
│     │   or tap Paste from clipboard               │     │
│     │                                             │     │
│     └─────────────────────────────────────────────┘     │
│                                                         │
│              [ Paste ]        Start (dim)               │
│                                                         │
│         No login · Stays on this device                 │
└─────────────────────────────────────────────────────────┘
```

- Visual H1 is **not** the SEO sentence. Brand + one short line: “Paste. Present. Done.”
- Editor owns ≥60% of the first viewport on desktop; nearly full viewport on mobile.
- No feature grid, no guide carousel, no stats strip above the fold.

### Scene B — Paste (2–5s)

User taps **Paste** or Cmd/Ctrl+V / long-press paste.

1. Script fills the surface immediately.
2. Soft confirmation: “Script ready · 412 words · ~3:05”
3. **Start** lights up (accent, full width on mobile).
4. Optional one-line nudge only if voice mode is Smart: “Will ask for mic when you start.” — dismissible, never a modal.

### Scene C — Start (instant)

- Full-viewport dark stage immediately (script is already scrolling on base cadence).
- Smart Pace arms in parallel: brief, honest mic prompt *on the stage* (“Allow mic so scroll can follow you”).
- If granted → short calibrate → Listening. If denied / unavailable → stay on Manual with one quiet line and a retry control. **The take never waits on permission.**
- Top: brand whisper + exit.
- Bottom: Play · Speed · Listening status — everything else behind **More**.

### Scene D — Speak

- Chrome auto-hides.
- Focus guide + live word highlight while listening.
- Scroll tracks speech energy (local Smart Pace) and, when enabled/available, position from precision alignment (local Whisper and/or session-bound hosted STT).
- Tap anywhere / space = pause. Obvious.
- Any recognition miss → hold or ease; never teleport the script.

### Scene E — After take

- Exit → back to editor with script intact.
- Subtle “Again” affordance = Start still primary.
- Below the fold (or after first session): how-it-works + guides for SEO/education.

### Scene F — Mobile beside camera / YouTube

- Start → fullscreen / landscape hint if portrait and tall script.
- Compact controls; PiP / pop-out under More when capable.
- No expectation that recording works everywhere; never block present for it.

---

## 4. Information architecture (product surface)

### Primary surface: `/` = the instrument

| Zone | Role | Rules |
| --- | --- | --- |
| Header | Brand + escape hatches | Features / Guides / Tools de-emphasized; never compete with Start |
| Stage zero | Empty or restored script | One job: get text in |
| Action bar | Paste / Start / secondary | Start is the only filled primary |
| Trust line | One quiet sentence | Privacy, not feature marketing |
| Below fold | Education + SEO | Only after the tool; can lazy-render |

### Secondary surfaces (keep, do not invade home)

- `/features`, `/guides/*`, `/tools/*`, `/privacy`, `/private-voice-tracking`
- These serve SEO and depth. Home links down, not up into the hero.

### Modes inside the instrument

1. **Edit** — paste / type / import  
2. **Present** — fullscreen stage  
3. **Tune** — settings drawer inside Present  
4. **Enhance** — voice / record / PiP, all opt-in panels  

Never show Edit + Present chrome + marketing simultaneously.

---

## 5. Detailed UI specification

### 5.1 Visual direction

**Concept name:** *Quiet Stage*

| Token | Direction | Why |
| --- | --- | --- |
| Atmosphere | Soft graphite → deep charcoal wash with a warm spotlight behind the editor; not flat cream | Stage, not stationery |
| Brand | Large wordmark treatment on home; accent on `.wtf` only | Brand test: remove nav and it still reads as this product |
| Type | Expressive display for brand/line; highly readable grotesque for script (avoid Inter/Roboto/Arial defaults) | Distinctive + legible at teleprompter sizes |
| Accent | Single decisive action color (not purple, not generic terracotta-on-cream) | Start / listening only |
| Radius | Restraint; editor is a surface, not a floating card with heavy shadow | Cards only when interaction needs a container |
| Presenter | Near-black, warm off-white text (keep), calmer control typography | Already closest to right |

Motion (ship 2–3):

1. **Enter stage** — editor dissolves / presenter fades up.  
2. **Chrome retreat** — controls ease out after idle.  
3. **Listening breath** — subtle focus-line or live-word pulse while mic is active (no glow fest).

### 5.2 Empty state (new user)

- Giant editable region, placeholder as instruction not marketing.
- Primary row: **Paste from clipboard** | Start (disabled with aria reason).
- Secondary, visually quieter: Import TXT · Demo script (optional, short) · Clear (hidden when empty).
- If clipboard permission API unavailable: Paste button focuses textarea and shows “Press Ctrl+V / long-press → Paste”.

### 5.3 Smart Paste (must-work feature)

Smart Paste is a **product feature**, not a nice-to-have:

| Step | Behavior |
| --- | --- |
| Detect | On focus / visibility, if `navigator.clipboard.readText` is allowed and text looks like a script (≥ ~20 chars, not a URL-only string), show a non-blocking chip: “Paste 240 words from clipboard?” |
| Act | Button **Paste** always visible on empty state; one tap reads clipboard, writes script, focuses Start |
| Fallback | If clipboard blocked: instruct native paste; still accept `paste` events and drag-drop of `.txt` |
| Safety | Confirm before replacing a non-empty script |
| Feedback | Toast/status: “Pasted · N words” |
| Analytics | Existing vocabulary only (`script_import` with a safe source type, or extend allowlist carefully) — never clipboard contents |

### 5.4 Restored script state

- Skip empty-state theater.
- Heading becomes functional: word count + duration.
- Start is enabled immediately.
- Small line: “Restored on this device” (already exists; keep, quiet).

### 5.5 Start CTA

- Always the heaviest visual element in the action row.
- Mobile: full-width, sticky above the home indicator when script is non-empty.
- Disabled reason when empty: “Paste a script to start” (visible, not only `disabled`).
- On Start: **enter the stage immediately** on base scroll. Smart Pace (default) requests the mic *after* the presenter is visible, with one-line purpose copy — never a homepage permission wall, never a dead screen waiting on Allow.

> **Product call (locked, v1.1):** Smart Pace remains the default voice mode and the product moat. Reliability is a first-class workstream (local signal quality + optional session-bound hosted STT). Manual is the resilient fallback when mic is denied or tracking fails — not the marketing default. First Start is never blocked on permission; listening arms on-stage.

### 5.6 Presenter chrome hierarchy

**Always reachable**

- Exit  
- Play / Pause  
- Speed − / +  
- Progress (thin, non-interactive chrome)  
- Listening status (compact): Calibrating / Listening / Paused with you / Mic blocked · Retry  

**One tap away (More / drawer)**

- Font size, line height, width, focus position  
- Mirror / flip  
- Fullscreen  
- Voice depth: Smart Pace details, Private Precision download, hosted assist (if enabled for the deploy)  
- Recording  
- Picture in Picture  
- Shortcuts list  

**Mobile layout**

```
[ Exit ]                    [ 42% · 1:12 left ]
───────────────────────────────────────────────
                 SCRIPT
───────────────────────────────────────────────
[ Listening ]  [  − Speed +  ]  [  ❙❙ / ▶  ]  [ More ]
```

- Listening slot shows state, not a buried settings link. Tap opens a thin sheet only if needed (retry / switch Manual / Precision).
- Minimum 44×44 touch targets.  
- No horizontal scrolling of peer controls.  
- Safe-area insets respected.

### 5.7 Voice UX (moat surface)

- Default mode: **Smart Pace on**.
- States, always honest: Off · Requesting · Calibrating · Listening · Paused with you · Denied · Unavailable · Error.
- Copy: “Follows your rhythm. Stays on this device.” (hosted assist, if active for a session, gets its own one-line disclosure — see §5.9).
- Private Precision: still explicit ~67 MB download + Beta labeling; still runs *with* Smart Pace underneath.
- Failure contract: **scroll never stops being usable.** Fall back Smart Pace → Manual. One-line status, never a blocking error page.
- Reliability is UX: users should not need to “learn” voice tracking. It either tracks or quietly doesn’t.

### 5.8 Below-fold content (SEO without poison)

- Keep educational sections, but they start **after** a clear break below the instrument.
- Reduce card-like feature grids; prefer short linear sections (one job each).
- Optional: collapse to a single “How voice following works” link for first-time visual calm; expand for crawlers via static HTML (still in DOM for SEO).

### 5.9 Smart Pace reliability + optional self-hosted STT

This section is in scope because flaky following kills the moat. UI polish without reliability is cosplay.

#### Tier model (keep all three honest)

| Tier | What it does | Network | User cost |
| --- | --- | --- | --- |
| **A. Local Smart Pace** (default always-on attempt) | Web Audio RMS / VAD-ish cadence: speak → scroll, pause → ease. No transcript. | None after page load | Mic permission |
| **B. Local Private Precision** (opt-in) | On-device Whisper Tiny + script alignment | Model download once (~67 MB), then local | Explicit download + mic |
| **C. Session Hosted Assist** (optional deploy) | Small self-hosted STT for hard cases (noise, accents, weak devices) feeding the *same* alignment path | Short audio windows only, during an active present session | Mic + clear disclosure; no account |

Tier A must become **reliable as fuck** on its own merits. Tier C is a force multiplier where local physics fail — not a replacement that turns the product into “upload your voice to the cloud by default.”

#### Tier A hardening (ship regardless of hosted STT)

Current `VoicePaceAnalyzer` is a solid skeleton (calibrate → threshold → multiplier). Reliability work:

1. **Better VAD:** dual features (RMS + spectral flatness / zero-crossing or lightweight WebAudio Analyser bands), not RMS alone; reduce false scroll on AC hum, keyboard clacks, camera taps.
2. **Adaptive noise floor** that survives HVAC and sudden room changes without 1.5s full recal every time.
3. **Speaker-relative dynamics:** normalize to recent speech peaks so soft talkers aren’t stuck paused.
4. **Script-aware gating (no STT):** optional use of expected phoneme/energy envelope from script length + WPM — not recognition, just “should still be speaking” priors to damp runaway scroll.
5. **Hysteresis & anti-lurch:** stronger smoothing when starting/stopping; hard caps on multiplier jerk.
6. **Device profiles:** iOS background/audio interruption recovery; Bluetooth headset path; auto-retry AudioContext after suspend.
7. **Calibration UX:** 1–1.5s “Hold quiet…” only when needed; skip if recent successful calibrate in-session.
8. **Golden fixtures + dogfood matrix:** recorded rooms (quiet, cafe-ish, fan), soft/loud speakers; unit + integration tests beyond the current median/threshold checks.
9. **Visible confidence without panic:** Listening pulse only when speechActive; otherwise still.

Acceptance for Tier A: in a normal quiet room with a laptop mic, speak / pause / speak again and scroll visibly tracks without manual speed babysitting. Denial path remains clean Manual.

#### Tier C — small self-hosted STT (in bounds)

**When:** Tier A is insufficient for a measurable share of sessions (accents, noise, mobile Safari quirks) and Tier B’s 67 MB / WASM cost is too high for “just work.”

**What it is:** A tiny inference service (e.g. faster-whisper tiny/base, whisper.cpp server, or equivalent) that accepts **short PCM windows** from an **already-started presenter session**, returns ephemeral text fragments for the existing script-alignment code, then discards audio + text. Smart Pace remains the continuous cadence layer.

**What it is not:**

- A public `/transcribe` API for the internet
- A general speech-to-text SaaS
- A path that uploads full scripts by default (prefer client-side alignment; if server alignment is ever needed, send bounded script windows + hash, never a script archive)
- A silent cloud default that contradicts the privacy homepage story

**Disclosure UX:** If Hosted Assist is enabled for the deployment and engaged for a session: one calm line — “Enhanced following uses a short private session on our servers. Audio is not stored.” Off by default per-install until product decides; if used to rescue reliability, prefer **auto within session after local struggle** only with prior consent toggle, or an explicit “Enhance following” control. Exact default is an ops/product flag; the UX contract is **no surprise uploads**.

#### Anti-scraper / anti-abuse (mandatory if Tier C exists)

Assume bots will hit anything that looks like free STT. Design the endpoint as **useless to scrapers**:

| Control | Rule |
| --- | --- |
| **Session binding** | Mint a short-lived present-session token only after Start in the real app origin (and after mic grant). Token is tied to origin, time, and a nonce. No token → 401. |
| **Not a general API** | Path is internal to the app client. No docs marketing it as STT. Response schema is alignment-oriented (or opaque fragments), not a developer transcription API. |
| **Payload limits** | Max window length (e.g. 3–6s), max bytes/request, max sample rate, mono only. Reject oversized / wrong content-type. |
| **Rate limits** | Per IP + per session token: tight RPS and daily caps. Global concurrency cap on GPU/CPU workers. |
| **Cost fuse** | Kill switch + budget alarm. When saturated, fail closed to Tier A (Smart Pace) — never queue into multi-minute backlog. |
| **WAF / bot signals** | Cloudflare (or equivalent) bot score, optional Turnstile when abuse spikes; block datacenter ASNs for the STT route if needed. |
| **CORS / Origin** | Strict allowlist to `teleprompter.wtf` (and preview origins). No `*`. |
| **No persistence** | Audio and transcripts never written to disk/object storage; process memory only; structured logs without content. |
| **No script exfil** | Do not require full script upload. Client aligns locally when possible. |
| **Auth shape without accounts** | Signed session JWT/HMAC from a lightweight edge function is enough — still no user accounts. Rotate keys. |
| **Abuse tests** | Load test with parallel unauthed and authed flood; confirm 401/429 and that Manual/Smart Pace still present. |

**Ops note:** Hosted STT is a **deploy option** (Docker sidecar / separate service), not a requirement for the static site to boot. Open-source default can ship Tier A + B only; hosted Tier C is for the production property that can afford GPU/CPU and abuse ops.

#### Privacy contract update (when Tier C is on)

- Local-first remains the default story for scripts and for Tier A/B.
- Tier C is an explicit, bounded exception: ephemeral audio windows, no retention, no training use, no adtech.
- Privacy page + in-presenter disclosure must match reality. Analytics still never get transcript text.
---

## 6. Mobile-specific plan

| Issue | Fix |
| --- | --- |
| Keyboard covers Start | Sticky action bar; `visualViewport` aware padding |
| Fat-finger secondary actions | Move Import / Share / Clear into overflow `···` |
| Presenter control soup | 4-slot dock + More sheet |
| Accidental nav while presenting | Existing inert background; ensure header not tappable |
| Paste discovery | Persistent Paste button + empty-state instructions |
| Landscape recording / YouTube | Soft banner once: “Rotate for a wider read” — dismissible |
| Privacy banner vs CTA | Privacy never covers Start (partially addressed; keep as regression test) |

---

## 7. Microcopy system

Voice: short, calm, adult. No hype. No emoji.

| Place | Copy |
| --- | --- |
| Brand line | `Paste. Present. Done.` |
| Empty placeholder | `Paste your script here` |
| Paste button | `Paste` |
| Start | `Start` |
| Start disabled hint | `Paste a script to start` |
| Trust | `No login. Script stays on this device.` |
| Mic ask (on stage) | `Allow mic so scroll can follow you` |
| Listening | `Listening` |
| Calibrating | `Hold quiet…` |
| Mic blocked | `Mic blocked · Continue without following` |
| Retry mic | `Try following again` |
| Hosted assist (if on) | `Enhanced following — audio not stored` |
| Exit | `Edit script` or `Exit` |

SEO title/description remain keyword-rich in `<head>` only.

---

## 8. What we will *not* do in this pass

- Accounts, sync, templates, AI writing assist.
- Redesigning guide article layouts (except shared tokens if needed).
- Onboarding carousels, coach marks tours, or paywalls.
- Purple glow “AI” aesthetics, pill forests, stat strips in the hero.
- Publishing a general-purpose public STT API or accepting arbitrary long-form uploads.
- Silent cloud transcription without disclosure.
- Demoting Smart Pace to “advanced” to hide reliability debt.

---

## 9. Execution plan (implementation phases)

This is the plan to execute in code, in order. Each phase should be shippable alone.

### Phase 1 — First-run clarity (highest leverage)

**Goal:** Land → understand → paste → start in under 15 seconds.

- [ ] Restructure home hero: brand + one line + instrument; demote SEO H1 to visually secondary or relocate keyword phrase to support/`<title>` only while keeping an accessible heading structure.
- [ ] Empty-state redesign: large editor, Paste primary, Start with disabled hint.
- [ ] Implement Smart Paste (button + optional clipboard chip + replace confirm + paste event handling).
- [ ] Sticky mobile action bar for Start when script present.
- [ ] Microcopy pass on editor shell (kill competing headlines).
- [ ] Tests: paste button path, empty disabled Start, restored script Start enabled.

### Phase 2 — Presenter calm + Smart Pace as default moat UX

**Goal:** Stage feels inevitable; Smart Pace arms on-stage without blocking; mobile dock is usable.

- [ ] Re-hierarchy presenter controls: primary dock + More sheet; Listening status in the dock.
- [ ] Keep Smart Pace as default; mic prompt after presenter visible; denied → clean Manual + retry.
- [ ] Refine enter-stage / chrome-hide / listening-breath motion.
- [ ] Listening state as quiet status, not a panel explosion.
- [ ] Mobile safe-area + 44px targets; no equal-weight button row.
- [ ] Tests: control hierarchy, mic grant/deny paths, visual regression updates.

### Phase 3 — Smart Pace reliability (moat engineering)

**Goal:** Local following is trustworthy in real rooms.

- [ ] Harden `VoicePaceAnalyzer` / `LocalAudioSession` (better VAD features, anti-lurch, interruption recovery).
- [ ] Fixture corpus + expanded unit/integration tests for speak/pause/speak and noisy floors.
- [ ] Device smoke matrix for Smart Pace (iOS / Android / desktop) with pass/fail bar in `docs/device-smoke-test.md`.
- [ ] Instrumentation: privacy-safe voice health events only (e.g. `private_precision_fallback`-style reasons already in taxonomy — extend carefully, never audio/transcript).

### Phase 4 — Visual system (Quiet Stage)

**Goal:** Look like a performance tool, not a cream blog.

- [ ] New color tokens + typography (display + script stacks).
- [ ] Remove card-heavy editor chrome; editor as dominant surface.
- [ ] Atmosphere background (gradient/spotlight), still fast and accessible.
- [ ] Update theme-color, OG feel if needed, screenshots.
- [ ] A11y: contrast, focus rings, reduced-motion paths.

### Phase 5 — Content gravity & SEO coexistence

**Goal:** SEO stays; first experience stays clean.

- [ ] Push feature education below a hard visual break; simplify card grids; keep voice-follow story accurate (Smart Pace = moat).
- [ ] Ensure crawler-facing headings/content remain complete in HTML.
- [ ] Smoke: Lighthouse + existing SEO Playwright suite still green.
- [ ] Update README screenshots + short UX note in product case study.

### Phase 6 — Optional session-hosted STT (production moat extender)

**Goal:** Small self-hosted STT that helps real presenters and is worthless to scrapers.

- [ ] Design session-token mint + STT sidecar (faster-whisper / whisper.cpp or equivalent).
- [ ] Client: short PCM windows → ephemeral fragments → existing alignment; Smart Pace always underneath.
- [ ] Abuse layer: origin allowlist, rate limits, payload caps, concurrency fuse, fail-closed to Tier A, bot challenges on spike.
- [ ] Privacy page + in-UI disclosure; zero retention; no content logs.
- [ ] Chaos/abuse tests: unauthed flood, oversize payloads, saturation → product still presents.
- [ ] Feature-flag so OSS/static default can omit the sidecar.

### Phase 7 — Hardening

- [ ] Full device smoke: paste + present + Smart Pace + deny path.
- [ ] Clipboard permission matrix documented.
- [ ] Activation funnel: `teleprompter_start` up; voice mode mix healthy for Smart Pace; low-progress exits down.

---

## 10. Success criteria

### Qualitative (dogfood)

- A stranger can present without explanation.
- You never need to say “paste in the box then scroll to find Start” again.
- On a phone, Start is obvious with one thumb.
- Presenter does not feel like a settings app.
- Speaking and pausing visibly drives the scroll in a normal room without babysitting speed.
- Denying the mic still yields a usable take.

### Quantitative (once analytics opted-in exists)

| Signal | Intent |
| --- | --- |
| `teleprompter_start` / session | Activation up |
| Time-to-start (if added later, privacy-safe bucket) | Down |
| `teleprompter_exit` at low progress | Down |
| Smart Pace share of starts | Dominant default, not abandoned |
| Voice fallback / error reasons | Diagnosable; trending down after Phase 3 |
| Hosted STT (if on): authed success vs 401/429 ratio | Humans served; scrapers starved |

### Acceptance checks before calling this initiative “done”

1. Empty home: Paste + Start are the only strong actions.  
2. Smart Paste works or degrades with clear native instructions.  
3. Start always opens the stage; mic ask happens on-stage; deny ≠ dead end.  
4. Smart Pace is default and passes the quiet-room dogfood bar.  
5. Mobile presenter: ≤4 primary dock slots.  
6. SEO suite still passes.  
7. Manual mode still works offline.  
8. If hosted STT ships: unauthed and abusive traffic cannot use it as free transcription.

---

## 11. Component-level change map

| Area | Likely files |
| --- | --- |
| Home composition | `src/pages/index.astro`, `src/styles/global.css` |
| Editor / Paste / Start | `src/components/TeleprompterApp.tsx` |
| Presenter dock / More | `src/components/Presenter.tsx`, `SettingControls.tsx`, `VoiceTrackingControls.tsx` |
| Smart Pace core | `src/domain/smartPace.ts`, `smartPace.test.ts`, audio worklet |
| Alignment shared by B/C | `src/domain/alignment.ts`, `scriptHighlight.ts` |
| Hosted STT (optional) | new service under `services/` or sibling image; edge token mint; thin client module |
| Privacy copy | `src/pages/privacy.astro`, presenter disclosure |
| Tokens / type | `src/styles/global.css`, `Layout.astro` (theme-color, fonts) |
| Tests | `tests/app.spec.ts`, `tests/advanced-features.spec.ts`, `tests/visual.spec.ts`, abuse/load scripts for STT |

---

## 12. Design references (feel, not clone)

- **Apple Keynote presenter** — text is the product; chrome vanishes.  
- **Notion empty page** — enormous invitation to put content in.  
- **Halide / ProCamera** — serious tool UI; controls earn their place.  
- **Teleprompter hardware** — black stage, high contrast, nothing cute.

We are not designing a SaaS marketing site that embeds a widget. We are designing **the widget as the site**.

---

## 13. Immediate next step

Execute **Phase 1** (first-run clarity), then **Phase 2** (moat UX on-stage) and **Phase 3** (Smart Pace reliability) before visual cosmetics. Hosted STT (Phase 6) only after Tier A has a real reliability baseline and abuse design is written into the service, not bolted on later.

---

*This document is the source of truth for the UI/UX rebuild and the Smart Pace moat reliability track. Product principles in `docs/product-case-study.md` still hold. Where first-run friction meets the moat: **Start is never blocked**, but **Smart Pace stays the default** and we pay down reliability instead of hiding the feature. Hosted STT is an optional, session-bound, anti-abuse-hardened extender — never a public scraper candy bowl.*