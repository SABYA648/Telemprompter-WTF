# teleprompter.wtf — UI / UX Experience Plan

**Status:** Execution blueprint (v1)  
**Scope:** Feel, first experience, editor → presenter flow, mobile, and progressive disclosure. Not SEO, not monetization, not new voice models.  
**North star:** *Arrive. Paste. Speak. Leave.*

---

## 0. Design thesis

A teleprompter is not a website. It is a **performance instrument**.

The moment someone lands here, they are already late for something: a YouTube take, a Reel, a webinar, a pitch. They do not want to learn a product. They want text to move at the speed of their mouth.

Everything else — Smart Pace, Private Precision, recording, PiP, guides, SEO pages — is either **invisible until needed**, or **below the first successful present**.

### The product in one sentence

> Open the page. Your script is already waiting for paste. One obvious action starts the scroll. The stage goes dark. Words rise. Controls get out of the way.

### What “great” feels like

| Moment | Feeling |
| --- | --- |
| Land | “This *is* the teleprompter.” Not a landing page that happens to contain one. |
| Empty editor | A quiet, large, inviting surface. Paste is the only job. |
| Paste | Instant confirmation. Word count appears. Start becomes inevitable. |
| Start | Full-screen stage in under a second. No second guessing. |
| Speak | Text is the hero. Controls fade. Listening feels calm, not “AI.” |
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

---

## 2. Experience principles (non-negotiable)

1. **Tool before story.** The first screen is the instrument. Marketing copy never displaces paste + start.
2. **One verb at a time.** Empty → Paste. Pasted → Start. Presenting → Speak. Advanced → Ask.
3. **Brand is the stage name.** `teleprompter.wtf` is the hero identity; SEO phrases live in `<title>` / meta / below-fold, not as the visual H1 competing with the editor.
4. **Paste is a first-class action.** Not an implied browser gesture.
5. **Presenter is cinema, not dashboard.** Text dominant. Controls ephemeral. Settings in a drawer, not a cockpit.
6. **Mobile is a first-class stage.** Same three steps; larger targets; sticky Start; no horizontal button soup.
7. **Progressive disclosure stays ruthless.** Smart Pace may be default *behavior*, but its UI stays calm. Precision, record, PiP never greet a first-time user.
8. **Motion is presence, not decoration.** 2–3 intentional transitions: enter stage, fade chrome, listening pulse.
9. **SEO is infrastructure, not UX.** Keep routes and metadata; never let them shape the first 5 seconds.
10. **Honesty over magic.** If mic permission is needed, say it in one line at the moment of ask — never as homepage theater.

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

- Full-viewport dark stage.
- Brief settle (≤400ms), then scroll begins (existing behavior, refined).
- Top: brand whisper + exit.
- Bottom: Play · Speed · Mic (if Smart) — everything else behind **More**.

### Scene D — Speak

- Chrome auto-hides.
- Focus guide + live word highlight only while listening.
- Tap anywhere / space = pause. Obvious.

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
- On Start with Smart Pace default: request mic **after** presenter opens (or with a one-tap Listen control) so Start never feels like a permission wall. Prefer: enter stage in Manual scroll immediately, then a calm “Follow my voice” chip — *or* keep auto-listen but with crystal-clear copy. **Decision for execution:** Stage opens instantly; voice starts only after explicit **Listen** on first session, remember preference after. This makes the first success path zero-permission.

> Product call (locked for this plan): **First present = Manual scroll that just works.** Smart Pace is one tap away (“Follow my voice”). Returning users who already enabled listen keep their preference. This fixes “I just want to start” without abandoning the voice thesis.

### 5.6 Presenter chrome hierarchy

**Always reachable**

- Exit  
- Play / Pause  
- Speed − / +  
- Progress (thin, non-interactive chrome)

**One tap away (More / drawer)**

- Font size, line height, width, focus position  
- Mirror / flip  
- Fullscreen  
- Voice mode details  
- Recording  
- Picture in Picture  
- Shortcuts list  

**Mobile layout**

```
[ Exit ]                    [ 42% · 1:12 left ]
───────────────────────────────────────────────
                 SCRIPT
───────────────────────────────────────────────
[  Listen  ]  [  − Speed +  ]  [  ❙❙ / ▶  ]  [ More ]
```

- Minimum 44×44 touch targets.  
- No horizontal scrolling of peer controls.  
- Safe-area insets respected.

### 5.7 Voice UX (after first success)

- **Listen** toggle with clear states: Off / Calibrating / Listening / Paused with you.  
- Smart Pace copy: “Matches your rhythm. No transcript.”  
- Precision: still explicit download + Beta labeling.  
- Failure: fall back silently to Manual scroll; one-line status, never a blocking error page.

### 5.8 Below-fold content (SEO without poison)

- Keep educational sections, but they start **after** a clear break below the instrument.
- Reduce card-like feature grids; prefer short linear sections (one job each).
- Optional: collapse to a single “How voice following works” link for first-time visual calm; expand for crawlers via static HTML (still in DOM for SEO).

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
| Listen | `Follow my voice` |
| Listening | `Listening` |
| Exit | `Edit script` or `Exit` |

SEO title/description remain keyword-rich in `<head>` only.

---

## 8. What we will *not* do in this UX pass

- Accounts, sync, templates, AI writing.
- Redesigning guide article layouts (except shared tokens if needed).
- Changing Whisper / Smart Pace algorithms (UI around them only).
- Adding onboarding carousels, coach marks tours, or paywalls.
- Purple glow “AI” aesthetics, pill forests, stat strips in the hero.

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

### Phase 2 — Presenter calm

**Goal:** Stage feels inevitable; mobile dock is usable.

- [ ] Re-hierarchy presenter controls: primary dock + More sheet.
- [ ] First-session voice: Manual until user taps Follow my voice; persist preference.
- [ ] Refine enter-stage / chrome-hide motion.
- [ ] Listening state as quiet status, not a panel explosion.
- [ ] Mobile safe-area + 44px targets; no equal-weight button row.
- [ ] Tests: control hierarchy, voice opt-in, visual regression updates.

### Phase 3 — Visual system (Quiet Stage)

**Goal:** Look like a performance tool, not a cream blog.

- [ ] New color tokens + typography (display + script stacks).
- [ ] Remove card-heavy editor chrome; editor as dominant surface.
- [ ] Atmosphere background (gradient/spotlight), still fast and accessible.
- [ ] Update theme-color, OG feel if needed, screenshots.
- [ ] A11y: contrast, focus rings, reduced-motion paths.

### Phase 4 — Content gravity & SEO coexistence

**Goal:** SEO stays; first experience stays clean.

- [ ] Push feature education below a hard visual break; simplify card grids.
- [ ] Ensure crawler-facing headings/content remain complete in HTML.
- [ ] Smoke: Lighthouse + existing SEO Playwright suite still green.
- [ ] Update README screenshots + short UX note in product case study.

### Phase 5 — Hardening

- [ ] Device smoke: iOS Safari paste + present, Android Chrome, desktop.
- [ ] Clipboard permission matrix documented in `docs/device-smoke-test.md`.
- [ ] Analytics events for activation funnel unchanged in spirit (`teleprompter_start` rises).

---

## 10. Success criteria

### Qualitative (dogfood)

- A stranger can present without explanation.
- You never need to say “paste in the box then scroll to find Start” again.
- On a phone, Start is obvious with one thumb.
- Presenter does not feel like a settings app.

### Quantitative (once analytics opted-in exists)

| Signal | Intent |
| --- | --- |
| `teleprompter_start` / session | Activation up |
| Time-to-start (if added later, privacy-safe bucket) | Down |
| `teleprompter_exit` at low progress | Down |
| Voice start as secondary action rate | Healthy opt-in, not forced |

### Acceptance checks before calling UX “done”

1. Empty home: Paste + Start are the only strong actions.  
2. Smart Paste works or degrades with clear native instructions.  
3. First Start never blocked on mic.  
4. Mobile presenter: 4 primary controls max on screen.  
5. SEO suite still passes.  
6. Manual mode still works offline.

---

## 11. Component-level change map

| Area | Likely files |
| --- | --- |
| Home composition | `src/pages/index.astro`, `src/styles/global.css` |
| Editor / Paste / Start | `src/components/TeleprompterApp.tsx` |
| Presenter dock / More | `src/components/Presenter.tsx`, `SettingControls.tsx`, `VoiceTrackingControls.tsx` |
| Voice first-run | `src/domain/settings.ts`, `localState.ts`, `TeleprompterApp` / `Presenter` |
| Tokens / type | `src/styles/global.css`, `Layout.astro` (theme-color, fonts) |
| Tests | `tests/app.spec.ts`, `tests/tools-responsive-a11y.spec.ts`, `tests/visual.spec.ts`, new paste specs |

---

## 12. Design references (feel, not clone)

- **Apple Keynote presenter** — text is the product; chrome vanishes.  
- **Notion empty page** — enormous invitation to put content in.  
- **Halide / ProCamera** — serious tool UI; controls earn their place.  
- **Teleprompter hardware** — black stage, high contrast, nothing cute.

We are not designing a SaaS marketing site that embeds a widget. We are designing **the widget as the site**.

---

## 13. Immediate next step

Execute **Phase 1** on a feature branch: home restructuring, Smart Paste, Start clarity, mobile sticky CTA, tests.

Phases 2–5 follow in sequence on the same UX initiative unless split for review.

---

*This document is the source of truth for the UI/UX rebuild. Product principles in `docs/product-case-study.md` still hold; where they conflict with first-run friction (e.g. Smart Pace as default listen), this plan’s first-success rule wins until activation is healthy.*
