/**
 * Pure validators shared by the content tests. They return a list of problem
 * strings, so an empty list means the entry is valid.
 */
import {
  collectStrings,
  countWhitespaceWords,
  countWords,
  spokenText,
  spokenWordCount,
  targetBand,
} from './measure';
import type { CreatorGuide, StudioTemplate } from './types';

export const EM_DASH = '\u2014';
export const EN_DASH = '\u2013';

export function dashProblems(label: string, value: unknown): string[] {
  const problems: string[] = [];
  for (const text of collectStrings(value)) {
    if (text.includes(EM_DASH)) problems.push(`${label}: em dash in "${text.slice(0, 50)}"`);
    if (text.includes(EN_DASH)) problems.push(`${label}: en dash in "${text.slice(0, 50)}"`);
  }
  return problems;
}

export function headings(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('# '))
    .map((line) => line.slice(2).trim());
}

export function pageWordCount(value: unknown): number {
  return collectStrings(value).reduce((sum, text) => sum + countWords(text), 0);
}

export function validateTemplate(t: StudioTemplate): string[] {
  const p: string[] = [];
  const at = (msg: string) => p.push(`${t.id}: ${msg}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.id)) at('id is not a kebab-case slug');
  const expectedTitle = `${t.name} Template | teleprompter.wtf`;
  if (t.seoTitle !== expectedTitle) at(`seoTitle should be "${expectedTitle}"`);
  if (t.seoTitle.length < 30 || t.seoTitle.length > 65)
    at(`seoTitle length ${t.seoTitle.length} outside 30..65`);
  if (t.seoDescription.length < 120 || t.seoDescription.length > 160)
    at(`seoDescription length ${t.seoDescription.length} outside 120..160`);
  if (!t.h1 || !t.summary) at('missing h1 or summary');
  if (t.whenToUse.length < 1) at('missing whenToUse');
  if (t.tips.length < 4 || t.tips.length > 6) at(`tips count ${t.tips.length} outside 4..6`);
  if (t.faq.length !== 3) at(`faq count ${t.faq.length} should be 3`);
  if (t.examples.length !== 2) at('needs exactly 2 examples');
  if (t.related.templates.length !== 2) at('needs exactly 2 related templates');
  if (t.related.templates.includes(t.id)) at('related templates include itself');

  // Beats are contiguous and cover the target.
  if (t.targetSeconds > 0) {
    let cursor = 0;
    for (const beat of t.beats) {
      if (beat.startSeconds !== cursor)
        at(`beat "${beat.label}" starts at ${beat.startSeconds}, expected ${cursor}`);
      if (beat.endSeconds <= beat.startSeconds) at(`beat "${beat.label}" has no duration`);
      cursor = beat.endSeconds;
    }
    if (cursor !== t.targetSeconds) at(`beats end at ${cursor}, target is ${t.targetSeconds}`);
  }
  if (t.beats.length < 3) at('needs at least 3 beats');

  // Template and examples use the same sections as the beats.
  const beatLabels = t.beats.map((b) => b.label);
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  if (!same(headings(t.body), beatLabels))
    at(
      `body headings [${headings(t.body).join(', ')}] differ from beats [${beatLabels.join(', ')}]`,
    );
  if (!/\{[^}]+\}/.test(t.body)) at('body has no {placeholder}');

  for (const [i, ex] of t.examples.entries()) {
    const tag = `example ${i + 1}`;
    if (/\{[^}]*\}/.test(ex.body)) at(`${tag} has an unfilled placeholder`);
    if (!same(headings(ex.body), beatLabels)) at(`${tag} headings differ from beats`);
    if (t.targetSeconds > 0) {
      const [lo, hi] = targetBand(t.targetSeconds);
      const seg = spokenWordCount(ex.body);
      const ws = countWhitespaceWords(spokenText(ex.body));
      if (seg < lo || seg > hi) at(`${tag} has ${seg} spoken words, needs ${lo}..${hi}`);
      if (ws < lo || ws > hi) at(`${tag} has ${ws} whitespace words, needs ${lo}..${hi}`);
    }
  }
  if (t.examples[0].body === t.examples[1].body) at('examples are identical');

  // Page length (13.1): 400 to 800 unique words. The 10 minute outline has
  // two examples of roughly 1,300 words each, so it only gets the minimum.
  const words = pageWordCount(t);
  if (words < 400) at(`page has ${words} words, needs at least 400`);
  if (t.targetSeconds <= 120 && words > 800) at(`page has ${words} words, needs at most 800`);

  p.push(...dashProblems(t.id, t));
  return p;
}

export const CREATOR_GUIDE_SLUGS = [
  'instagram-teleprompter',
  'capcut-teleprompter',
  'how-to-film-talking-head-reels',
  'how-to-batch-record-videos',
  'how-to-write-a-30-second-video-script',
  'teleprompter-remote-control',
  'best-camera-settings-for-reels',
  'external-microphone-for-phone-video',
];

export function validateGuide(g: CreatorGuide, knownGuideSlugs: Set<string>): string[] {
  const p: string[] = [];
  const at = (msg: string) => p.push(`${g.slug}: ${msg}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(g.slug)) at('slug is not kebab-case');
  if (g.description.length < 120 || g.description.length > 160)
    at(`description length ${g.description.length} outside 120..160`);
  if (g.updated !== '2026-11-04') at('updated should be 2026-11-04');
  if (g.sections.length < 5 || g.sections.length > 8)
    at(`sections ${g.sections.length} outside 5..8`);
  const words = pageWordCount([g.intro, g.sections]);
  if (words < 1000 || words > 1800) at(`${words} words, needs 1000..1800`);
  if (g.related.length < 3) at('needs at least 3 related guides');
  for (const slug of g.related) {
    if (slug === g.slug) at('related includes itself');
    if (!knownGuideSlugs.has(slug)) at(`related slug "${slug}" does not exist`);
  }
  if (!g.related.some((slug) => CREATOR_GUIDE_SLUGS.includes(slug)))
    at('related needs at least one creator guide');
  if (!g.relatedPages.some((page) => page.href.startsWith('/record')))
    at('relatedPages needs at least one /record page');
  for (const page of g.relatedPages) {
    if (!/^\/(record|templates|hooks|tools|studio)/.test(page.href))
      at(`relatedPages href ${page.href}`);
    if (/click here/i.test(page.label)) at('anchor text "click here"');
  }
  if (!g.illustration?.src.startsWith('/illustrations/guides/')) at('missing illustration');
  if (!g.illustration?.alt) at('missing illustration alt');
  if (!g.embed || countWords(g.embed.sampleScript) < 20) at('missing or short embed sampleScript');
  p.push(...dashProblems(g.slug, g));
  return p;
}
