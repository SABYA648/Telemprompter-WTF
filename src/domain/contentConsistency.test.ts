import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODES } from './productFacts';

const root = resolve(__dirname, '../..');

const read = (relPath: string): string => readFileSync(resolve(root, relPath), 'utf8');

describe('Public Content Consistency against Product Facts', () => {
  const llms = read('public/llms.txt');
  const indexAstro = read('src/pages/index.astro');
  const featuresAstro = read('src/pages/features.astro');
  const privacyAstro = read('src/pages/privacy.astro');
  const privateVoiceAstro = read('src/pages/private-voice-tracking.astro');
  const compatibilityAstro = read('src/pages/compatibility.astro');
  const readme = read('README.md');

  it('verifies Smart Pace is never claimed to perform transcription or use a speech server', () => {
    const documents = [
      { name: 'llms.txt', content: llms },
      { name: 'index.astro', content: indexAstro },
      { name: 'features.astro', content: featuresAstro },
      { name: 'privacy.astro', content: privacyAstro },
      { name: 'private-voice-tracking.astro', content: privateVoiceAstro },
      { name: 'compatibility.astro', content: compatibilityAstro },
      { name: 'README.md', content: readme },
    ];

    for (const doc of documents) {
      // Must not claim Smart Pace transcribes or uses speech recognition / speech to text
      expect(doc.content).not.toMatch(
        /Smart Pace (?:transcribes|uses speech-to-text|runs speech recognition)/i,
      );
    }
  });

  it('verifies Private Precision model size is accurately cited as ~67 MB or 66,874,154 bytes', () => {
    expect(llms).toContain('67 MB');
    expect(indexAstro).toContain('67 MB');
    expect(featuresAstro).toContain('67 MB');
    expect(privacyAstro).toContain('67 MB');
    expect(privateVoiceAstro).toContain('67 MB');
  });

  it('verifies all 3 modes (Manual, Smart Pace, Private Precision) are named in core pages', () => {
    for (const mode of [MODES.manual.name, MODES.smart.name, MODES.precision.name]) {
      expect(indexAstro).toContain(mode);
      expect(featuresAstro).toContain(mode);
      expect(privacyAstro).toContain(mode);
      expect(privateVoiceAstro).toContain(mode);
      expect(compatibilityAstro).toContain(mode);
    }
  });
});
