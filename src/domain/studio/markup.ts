import { compileScriptGuide } from '../scriptGuide';
import { countWords } from './words';

export type MarkupToken =
  | { type: 'section'; value: string }
  | { type: 'text' | 'emphasis' | 'highlight' | 'placeholder'; value: string }
  | { type: 'cue' | 'pause'; value: string }
  | { type: 'note'; value: string }
  | { type: 'paragraphBreak' };
export interface ScriptSection {
  title: string;
  spokenOffset: number;
  spokenText: string;
}
export interface MarkupResult {
  tokens: MarkupToken[];
  spokenText: string;
  spokenWordCount: number;
  sections: ScriptSection[];
}

const CUES = new Set(['breathe', 'smile', 'look up', 'slow', 'fast', 'cut']);
function inline(value: string, tokens: MarkupToken[], spoken: string[]): void {
  const re =
    /(\*\*[^*]+\*\*|==[^=]+==|\{[^}]+\}|\[(?:pause|breathe|smile|look up|slow|fast|cut|b-roll:[^\]]*|note:[^\]]*)\])/gi;
  let at = 0;
  for (const match of value.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > at) {
      const text = value.slice(at, index);
      tokens.push({ type: 'text', value: text });
      spoken.push(text);
    }
    const raw = match[0];
    if (raw.startsWith('**')) {
      const inner = raw.slice(2, -2);
      let position = 0;
      for (const highlight of inner.matchAll(/==([^=]+)==/g)) {
        const index = highlight.index ?? 0;
        if (index > position) {
          const text = inner.slice(position, index);
          tokens.push({ type: 'emphasis', value: text });
          spoken.push(text);
        }
        const text = highlight[1] ?? '';
        tokens.push({ type: 'highlight', value: text });
        spoken.push(text);
        position = index + highlight[0].length;
      }
      if (position < inner.length) {
        const text = inner.slice(position);
        tokens.push({ type: 'emphasis', value: text });
        spoken.push(text);
      }
    } else if (raw.startsWith('==')) {
      const text = raw.slice(2, -2);
      tokens.push({ type: 'highlight', value: text });
      spoken.push(text);
    } else if (raw.startsWith('{')) {
      const text = raw.slice(1, -1);
      tokens.push({ type: 'placeholder', value: text });
      spoken.push(text);
    } else {
      const cue = raw.slice(1, -1).toLowerCase();
      if (cue === 'pause') tokens.push({ type: 'pause', value: cue });
      else if (CUES.has(cue)) tokens.push({ type: 'cue', value: cue });
      else tokens.push({ type: 'note', value: cue });
    }
    at = index + raw.length;
  }
  if (at < value.length) {
    const text = value.slice(at);
    tokens.push({ type: 'text', value: text });
    spoken.push(text);
  }
}

export function parseMarkup(input: string): MarkupResult {
  const guided = compileScriptGuide(input, 140);
  const value = guided.kind === 'guided' ? guided.spokenText : input;
  const tokens: MarkupToken[] = [],
    spoken: string[] = [],
    sections: ScriptSection[] = [];
  let current: ScriptSection | undefined;
  for (const line of value.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*\/\//.test(line)) {
      tokens.push({ type: 'note', value: line.replace(/^\s*\/\//, '').trim() });
      continue;
    }
    const heading = line.match(/^#\s+(.+)/);
    if (heading) {
      current = {
        title: heading[1] ?? '',
        spokenOffset: countWords(spoken.join(' ')),
        spokenText: '',
      };
      sections.push(current);
      tokens.push({ type: 'section', value: current.title });
      continue;
    }
    if (!line.trim()) {
      tokens.push({ type: 'paragraphBreak' });
      continue;
    }
    const before = spoken.length;
    inline(line, tokens, spoken);
    if (current)
      current.spokenText += `${before === spoken.length ? '' : ' '}${spoken.slice(before).join(' ')}`;
  }
  const spokenText = spoken.join(' ').replace(/\s+/g, ' ').trim();
  return { tokens, spokenText, spokenWordCount: countWords(spokenText), sections };
}
