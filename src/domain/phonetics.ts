/**
 * Phonetic keys for transcript-to-script matching.
 *
 * Speech recognition fails phonetically, not alphabetically: it writes "their" for "there",
 * "sight" for "site", and "2024" for "twenty twenty four". Character edit distance alone cannot
 * see those as near misses, so every script token and every spoken word also carries a small set
 * of phonetic keys. Two words that share a key are treated as a near match by the aligner.
 *
 * Metaphone is used rather than Soundex: Soundex preserves the first letter literally, so it never
 * collapses knight/night, phone/fone or write/right, which are exactly the collisions that matter
 * here. Metaphone still misses a handful of very common English function words whose spellings
 * diverge before the vowel (to/two, for/four), so those are covered by an explicit homophone class.
 */

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

const isVowel = (letter: string): boolean => VOWELS.has(letter);

/** Strip diacritics and anything that is not a plain latin letter. */
const normalizeLetters = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[̀-ͯ]/gu, '')
    .toLocaleLowerCase()
    .replace(/[^a-z]/gu, '');

/** Metaphone drops or rewrites several silent onsets before the main walk. */
const transformInitial = (word: string): string => {
  const opening = word.slice(0, 2);
  if (
    opening === 'kn' ||
    opening === 'gn' ||
    opening === 'pn' ||
    opening === 'ae' ||
    opening === 'wr'
  ) {
    return word.slice(1);
  }
  if (opening === 'wh') return `w${word.slice(2)}`;
  if (word.startsWith('x')) return `s${word.slice(1)}`;
  return word;
};

/**
 * Lawrence Philips' Metaphone, reduced to the rules that earn their place on English script text.
 * Returns '' for input with no latin letters.
 */
export function metaphoneKey(input: string): string {
  const cleaned = normalizeLetters(input);
  if (!cleaned) return '';
  const word = transformInitial(cleaned);

  let code = '';
  const emit = (value: string): void => {
    if (!value) return;
    // Metaphone never repeats a code back to back, which is what makes doubled letters and
    // consonant clusters collapse to the same key.
    if (code.endsWith(value)) return;
    code += value;
  };

  for (let index = 0; index < word.length; index += 1) {
    const letter = word[index] ?? '';
    const previous = word[index - 1] ?? '';
    const next = word[index + 1] ?? '';
    const afterNext = word[index + 2] ?? '';

    // Doubled letters read as one sound. 'cc' is the exception, as in "accept".
    if (letter === previous && letter !== 'c') continue;

    switch (letter) {
      case 'a':
      case 'e':
      case 'i':
      case 'o':
      case 'u':
        if (index === 0) emit(letter.toUpperCase());
        break;
      case 'b':
        // Silent in a final "mb", as in "climb".
        if (!(index === word.length - 1 && previous === 'm')) emit('B');
        break;
      case 'c':
        if (next === 'i' && afterNext === 'a') emit('X');
        else if (next === 'h') emit('X');
        else if (next === 'i' || next === 'e' || next === 'y') emit('S');
        else emit('K');
        break;
      case 'd':
        if (next === 'g' && (afterNext === 'e' || afterNext === 'y' || afterNext === 'i')) {
          emit('J');
          index += 2;
        } else {
          emit('T');
        }
        break;
      case 'g':
        // Silent in "gh" when the h closes the syllable, and in "gn"/"gned".
        if (next === 'h' && !isVowel(afterNext)) break;
        if (next === 'n') break;
        if (next === 'i' || next === 'e' || next === 'y') emit('J');
        else emit('K');
        break;
      case 'h':
        // The preceding letter already emitted the digraph sound in ch/sh/ph/th/gh/wh.
        if (
          previous === 'c' ||
          previous === 's' ||
          previous === 'p' ||
          previous === 't' ||
          previous === 'g' ||
          previous === 'w'
        ) {
          break;
        }
        if (isVowel(previous) && !isVowel(next)) break;
        emit('H');
        break;
      case 'k':
        if (previous !== 'c') emit('K');
        break;
      case 'p':
        emit(next === 'h' ? 'F' : 'P');
        break;
      case 'q':
        emit('K');
        break;
      case 's':
        if (next === 'h') emit('X');
        else if (next === 'i' && (afterNext === 'o' || afterNext === 'a')) emit('X');
        else emit('S');
        break;
      case 't':
        if (next === 'i' && (afterNext === 'o' || afterNext === 'a')) emit('X');
        else if (next === 'h') emit('0');
        else if (next === 'c' && afterNext === 'h') break;
        else emit('T');
        break;
      case 'v':
        emit('F');
        break;
      case 'w':
      case 'y':
        if (isVowel(next)) emit(letter.toUpperCase());
        break;
      case 'x':
        emit('KS');
        break;
      case 'z':
        emit('S');
        break;
      case 'f':
      case 'j':
      case 'l':
      case 'm':
      case 'n':
      case 'r':
        emit(letter.toUpperCase());
        break;
      default:
        break;
    }
  }

  return code;
}

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const;

const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
] as const;

const belowHundred = (value: number): string => {
  if (value < 20) return ONES[value] ?? '';
  const tens = TENS[Math.floor(value / 10)] ?? '';
  const remainder = value % 10;
  return remainder ? `${tens} ${ONES[remainder] ?? ''}` : tens;
};

const belowThousand = (value: number): string => {
  if (value < 100) return belowHundred(value);
  const hundreds = `${ONES[Math.floor(value / 100)] ?? ''} hundred`;
  const remainder = value % 100;
  return remainder ? `${hundreds} ${belowHundred(remainder)}` : hundreds;
};

/** Spell a number the way a presenter reads it aloud. Supports 0 to 999,999. */
export function numberToWords(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  const whole = Math.floor(value);
  if (whole > 999_999) return '';
  if (whole < 1000) return belowThousand(whole);
  const thousands = `${belowThousand(Math.floor(whole / 1000))} thousand`;
  const remainder = whole % 1000;
  return remainder ? `${thousands} ${belowThousand(remainder)}` : thousands;
}

/**
 * The paired reading a speaker gives a year: 2024 is "twenty twenty four", not
 * "two thousand twenty four". Returns null outside the range where that reading is natural.
 */
export function yearToWords(value: number): string | null {
  if (!Number.isInteger(value) || value < 1100 || value > 2999) return null;
  const high = Math.floor(value / 100);
  const low = value % 100;
  if (low === 0) return `${belowHundred(high)} hundred`;
  if (low < 10) return `${belowHundred(high)} oh ${belowHundred(low)}`;
  return `${belowHundred(high)} ${belowHundred(low)}`;
}

const ORDINAL_ONES: Record<number, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  5: 'fifth',
  8: 'eighth',
  9: 'ninth',
  12: 'twelfth',
};

const ordinalToWords = (value: number): string => {
  const direct = ORDINAL_ONES[value];
  if (direct) return direct;
  const words = numberToWords(value);
  if (!words) return '';
  const parts = words.split(' ');
  const last = parts[parts.length - 1] ?? '';
  const lastValue = ONES.indexOf(last as (typeof ONES)[number]);
  const lastOrdinal =
    ORDINAL_ONES[lastValue] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  parts[parts.length - 1] = lastOrdinal;
  return parts.join(' ');
};

/**
 * Very common English homophones whose spellings diverge before the first vowel, which is exactly
 * where Metaphone keeps them apart. Each entry maps a word to a shared class id.
 */
const HOMOPHONE_GROUPS: readonly (readonly string[])[] = [
  ['to', 'two', 'too'],
  ['for', 'four', 'fore'],
  ['by', 'buy', 'bye'],
  ['no', 'know'],
  ['one', 'won'],
  ['hear', 'here'],
  ['new', 'knew'],
  ['son', 'sun'],
  ['week', 'weak'],
  ['wait', 'weight'],
  ['way', 'weigh'],
  ['whole', 'hole'],
  ['see', 'sea'],
  ['eight', 'ate'],
  ['our', 'hour'],
  ['in', 'inn'],
  ['its', 'it'],
  ['be', 'bee'],
  ['sale', 'sail'],
  ['made', 'maid'],
  ['plain', 'plane'],
  ['role', 'roll'],
  ['stair', 'stare'],
  ['their', 'there', 'theyre'],
  ['your', 'youre'],
  ['were', 'where', 'wear'],
];

const HOMOPHONE_CLASSES = new Map<string, string>(
  HOMOPHONE_GROUPS.flatMap((group, index) => group.map((word) => [word, `H${index}`] as const)),
);

/** Shared class id for a very common homophone, or null when the word is not in a group. */
export function homophoneClass(word: string): string | null {
  return HOMOPHONE_CLASSES.get(normalizeLetters(word)) ?? null;
}

const SYMBOL_WORDS: Record<string, string> = {
  '%': 'percent',
  $: 'dollars',
  '&': 'and',
  '+': 'plus',
  '=': 'equals',
  '@': 'at',
  '#': 'number',
};

/**
 * The plausible ways one written token gets said out loud. A year yields both readings, an ordinal
 * yields its word form, and everything else yields itself.
 */
export function spokenForms(rawWord: string): string[] {
  const raw = rawWord.trim();
  if (!raw) return [];

  const symbol = SYMBOL_WORDS[raw];
  if (symbol) return [symbol];

  const compact = raw.toLocaleLowerCase().replace(/[’']/gu, '');

  const ordinal = /^(\d+)(st|nd|rd|th)$/u.exec(compact);
  if (ordinal) {
    const value = Number(ordinal[1]);
    const words = ordinalToWords(value);
    return words ? [words] : [compact];
  }

  if (/^\d+$/u.test(compact)) {
    const value = Number(compact);
    const forms: string[] = [];
    const plain = numberToWords(value);
    if (plain) forms.push(plain);
    const year = yearToWords(value);
    if (year && year !== plain) forms.push(year);
    return forms.length ? forms : [compact];
  }

  return [compact];
}

/**
 * Keys that assert two tokens are the same spoken word.
 *
 * Deliberately narrow: one key per complete spoken form, plus a homophone class. "25" and "5" do
 * not share a key here, because a script that bothers to say 25 means 25.
 */
export function phoneticKeys(rawWord: string): string[] {
  const forms = spokenForms(rawWord);
  if (!forms.length) return [];

  const keys = new Set<string>();
  for (const form of forms) {
    const key = metaphoneKey(form.replace(/\s+/gu, ''));
    if (key) keys.add(key);
    const shared = homophoneClass(form);
    if (shared) keys.add(shared);
  }

  if (!keys.size) {
    // Digits with no spellable reading still need a stable key so they can be matched literally.
    const fallback = forms[0]?.replace(/\s+/gu, '') ?? '';
    if (fallback) keys.add(fallback);
  }

  return [...keys];
}

/**
 * Keys that propose where a token might be. Broader than {@link phoneticKeys}: a written "2024" is
 * spoken as three separate words, so each constituent is indexed too, or nothing the speaker says
 * could ever nominate that position.
 *
 * These keys are for retrieval only. Using them to score a match would make 25 look like 5.
 */
export function indexKeys(rawWord: string): string[] {
  const keys = new Set(phoneticKeys(rawWord));
  for (const form of spokenForms(rawWord)) {
    const parts = form.split(/\s+/u).filter(Boolean);
    if (parts.length < 2) continue;
    for (const part of parts) {
      const partKey = metaphoneKey(part);
      if (partKey) keys.add(partKey);
    }
  }
  return [...keys];
}

/** True when two written tokens could plausibly be the same spoken word. */
export function sharesPhoneticKey(left: string, right: string): boolean {
  const leftKeys = phoneticKeys(left);
  if (!leftKeys.length) return false;
  const rightKeys = new Set(phoneticKeys(right));
  return leftKeys.some((key) => rightKeys.has(key));
}
