import { describe, expect, it } from 'vitest';
import { ScriptAlignmentEngine } from './alignment';
import {
  compileScriptGuide,
  parseRoleLabel,
  parseTimecodeSeconds,
  sectionAtSpokenOffset,
  structureScore,
} from './scriptGuide';

export const SHIPROOM_SAMPLE = `## 0:00–0:04 — Hook

**VISUAL**
Fast cuts:
- Screenshot
- Red circle drawn around a broken button
- Slack message: “Can you move this a little?”
- Developer manually typing a long prompt into an AI coding agent

**VOICEOVER**

Your AI can fix the bug in seconds.

Explaining the bug still takes five minutes.

**ON SCREEN**

**AI made coding faster.
Feedback is still stuck in screenshots.**

---

## 0:04–0:08 — Introduce Shiproom

**VISUAL**

Terminal opens.

\`\`\`bash
npx shiproom live
\`\`\`

Shiproom generates the private review URL.

**VOICEOVER**

So I built Shiproom.

One command turns your local app into a reviewable link.

**ON SCREEN**

\`npx shiproom live\`

---

## 0:08–0:18 — Reviewer Experience

**VISUAL**

Open the Shiproom link.

Reviewer clicks directly on a broken UI element.

Annotates it.

Types:

> This button overlaps the pricing card on mobile.

Hits **Submit**.

**VOICEOVER**

Your reviewer opens the actual product, clicks exactly what's wrong, annotates it, and leaves a comment.

No screenshot archaeology.

No twenty-message Slack thread.

---

## 0:18–0:28 — The Payoff

**VISUAL**

Cut to Shiproom console.

Open that feedback item.

Rapidly highlight:

- Route
- Exact element
- Accessible name
- Selector
- Viewport
- Browser
- Screenshot
- Failed network requests

Then show **Copy Markdown / JSON**.

**VOICEOVER**

Shiproom captures the context your coding agent actually needs.

The route. The element. The viewport. Browser. Screenshot. Even failed requests.

**ON SCREEN**

**Feedback → Agent-ready context**

---

## 0:28–0:35 — Close the Loop

**VISUAL**

Paste/export feedback into Cursor, Claude Code, or Codex.

Agent begins fixing the issue.

Quick cut back to the corrected UI.

**VOICEOVER**

Then hand the whole thing to Cursor, Claude Code, or Codex.

Instead of describing the problem...

just give the agent the problem.

---

## 0:35–0:40 — CTA

**VISUAL**

Clean Shiproom logo.

Terminal underneath:

\`\`\`bash
npx shiproom live
\`\`\`

Then:

**shiproom.live**

**VOICEOVER**

Shiproom.

Visual feedback for people who build with agents.

Try it free.

**ON SCREEN**

**Stop describing bugs. Ship them.**

\`npx shiproom live\`

**shiproom.live**
`;

describe('production script guide', () => {
  it('does not treat ordinary prose as a guided script', () => {
    const prose =
      'A visual explanation helps every listener follow the argument without extra screenshots.';
    expect(structureScore(prose)).toBeLessThan(4);
    expect(compileScriptGuide(prose).kind).toBe('plain');
    expect(compileScriptGuide(prose).spokenText).toContain('visual explanation');
  });

  it('parses role labels and timecodes', () => {
    expect(parseRoleLabel('**VOICEOVER**')).toBe('speak');
    expect(parseRoleLabel('ON SCREEN')).toBe('screen');
    expect(parseRoleLabel('Visual')).toBe('visual');
    expect(parseTimecodeSeconds('0:18')).toBe(18);
    expect(parseTimecodeSeconds('1:02:03')).toBe(3723);
  });

  it('compiles the Shiproom sample into spoken VO plus hidden cues', () => {
    const guide = compileScriptGuide(SHIPROOM_SAMPLE, 130);
    expect(guide.kind).toBe('guided');
    expect(guide.sections).toHaveLength(6);
    expect(guide.sections.map((section) => section.title)).toEqual([
      'Hook',
      'Introduce Shiproom',
      'Reviewer Experience',
      'The Payoff',
      'Close the Loop',
      'CTA',
    ]);
    expect(guide.spokenText).toContain('Your AI can fix the bug in seconds.');
    expect(guide.spokenText).toContain('So I built Shiproom.');
    expect(guide.spokenText).not.toMatch(/Fast cuts/i);
    expect(guide.spokenText).not.toMatch(/Slack message/i);
    expect(guide.spokenText).not.toContain('npx shiproom live');
    expect(guide.spokenText.toLowerCase()).not.toContain('voiceover');
    expect(guide.spokenWordCount).toBeLessThan(countApprox(SHIPROOM_SAMPLE) / 2);
    expect(guide.sections[0]?.beats.some((beat) => beat.role === 'visual')).toBe(true);
    expect(guide.sections[0]?.beats.some((beat) => beat.role === 'speak')).toBe(true);
  });

  it('aligns speech to VO and ignores visual-only phrases', () => {
    const guide = compileScriptGuide(SHIPROOM_SAMPLE);
    const engine = new ScriptAlignmentEngine(guide.spokenText);
    const spoken = engine.align('your AI can fix the bug in seconds explaining the bug');
    expect(spoken.movement).not.toBe('hold');
    const visual = engine.align('red circle drawn around a broken button slack message');
    expect(visual.movement).toBe('hold');
    const later = engine.align('so I built Shiproom one command turns your local app');
    expect(later.tokenIndex).toBeGreaterThan(spoken.tokenIndex);
  });

  it('resolves the active beat from a spoken caret', () => {
    const guide = compileScriptGuide(SHIPROOM_SAMPLE);
    const shiproomAt = guide.spokenText.indexOf('So I built Shiproom');
    const section = sectionAtSpokenOffset(guide, shiproomAt);
    expect(section?.title).toBe('Introduce Shiproom');
    expect(section?.timecodeLabel).toBe('0:04-0:08');
  });
});

const countApprox = (value: string): number => value.trim().split(/\s+/).length;
