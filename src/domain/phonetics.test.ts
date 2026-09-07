import { describe, expect, it } from 'vitest';
import {
  homophoneClass,
  metaphoneKey,
  numberToWords,
  phoneticKeys,
  sharesPhoneticKey,
  spokenForms,
  yearToWords,
} from './phonetics';

describe('metaphoneKey', () => {
  it('collapses homophones that differ only in spelling', () => {
    expect(metaphoneKey('their')).toBe(metaphoneKey('there'));
    expect(metaphoneKey('knight')).toBe(metaphoneKey('night'));
    expect(metaphoneKey('write')).toBe(metaphoneKey('right'));
    expect(metaphoneKey('phone')).toBe(metaphoneKey('fone'));
    expect(metaphoneKey('sight')).toBe(metaphoneKey('site'));
  });

  it('collapses British and American spellings', () => {
    expect(metaphoneKey('recognise')).toBe(metaphoneKey('recognize'));
    expect(metaphoneKey('organise')).toBe(metaphoneKey('organize'));
  });

  it('keeps genuinely different words apart', () => {
    expect(metaphoneKey('cat')).not.toBe(metaphoneKey('dog'));
    expect(metaphoneKey('lanterns')).not.toBe(metaphoneKey('cameras'));
    expect(metaphoneKey('opening')).not.toBe(metaphoneKey('closing'));
  });

  it('ignores case, diacritics and punctuation', () => {
    expect(metaphoneKey('Café')).toBe(metaphoneKey('cafe'));
    expect(metaphoneKey("don't")).toBe(metaphoneKey('dont'));
  });

  it('returns an empty key for input with no letters', () => {
    expect(metaphoneKey('')).toBe('');
    expect(metaphoneKey('1234')).toBe('');
    expect(metaphoneKey('   ')).toBe('');
  });
});

describe('homophone classes', () => {
  it('covers pairs that Metaphone alone keeps apart', () => {
    expect(sharesPhoneticKey('to', 'two')).toBe(true);
    expect(sharesPhoneticKey('to', 'too')).toBe(true);
    expect(sharesPhoneticKey('for', 'four')).toBe(true);
    expect(sharesPhoneticKey('no', 'know')).toBe(true);
    expect(sharesPhoneticKey('one', 'won')).toBe(true);
  });

  it('does not invent a class for unrelated words', () => {
    expect(homophoneClass('lanterns')).toBeNull();
    expect(sharesPhoneticKey('opening', 'closing')).toBe(false);
  });
});

describe('numberToWords', () => {
  it('spells numbers the way they are read aloud', () => {
    expect(numberToWords(0)).toBe('zero');
    expect(numberToWords(7)).toBe('seven');
    expect(numberToWords(19)).toBe('nineteen');
    expect(numberToWords(24)).toBe('twenty four');
    expect(numberToWords(100)).toBe('one hundred');
    expect(numberToWords(342)).toBe('three hundred forty two');
    expect(numberToWords(2024)).toBe('two thousand twenty four');
    expect(numberToWords(15_000)).toBe('fifteen thousand');
  });

  it('rejects values outside the supported range', () => {
    expect(numberToWords(-1)).toBe('');
    expect(numberToWords(1_000_000)).toBe('');
    expect(numberToWords(Number.NaN)).toBe('');
  });
});

describe('yearToWords', () => {
  it('gives the paired reading a speaker actually uses', () => {
    expect(yearToWords(2024)).toBe('twenty twenty four');
    expect(yearToWords(1999)).toBe('nineteen ninety nine');
    expect(yearToWords(1900)).toBe('nineteen hundred');
    expect(yearToWords(2005)).toBe('twenty oh five');
  });

  it('returns null where the paired reading is unnatural', () => {
    expect(yearToWords(500)).toBeNull();
    expect(yearToWords(3200)).toBeNull();
  });
});

describe('spokenForms and phoneticKeys', () => {
  it('offers both readings of a year', () => {
    expect(spokenForms('2024')).toEqual(['two thousand twenty four', 'twenty twenty four']);
    expect(phoneticKeys('2024')).toContain(metaphoneKey('twentytwentyfour'));
    expect(phoneticKeys('2024')).toContain(metaphoneKey('twothousandtwentyfour'));
  });

  it('matches a spelled-out year against its digits', () => {
    const spoken = phoneticKeys('twentytwentyfour');
    const written = new Set(phoneticKeys('2024'));
    expect(spoken.some((key) => written.has(key))).toBe(true);
  });

  it('expands ordinals', () => {
    expect(spokenForms('1st')).toEqual(['first']);
    expect(spokenForms('3rd')).toEqual(['third']);
    expect(spokenForms('20th')).toEqual(['twentieth']);
  });

  it('expands symbols that get read as words', () => {
    expect(spokenForms('%')).toEqual(['percent']);
    expect(spokenForms('&')).toEqual(['and']);
  });

  it('always yields at least one key for a real token', () => {
    for (const word of ['welcome', 'to', '2024', '1st', 'rhythm', 'queue']) {
      expect(phoneticKeys(word).length).toBeGreaterThan(0);
    }
  });

  it('yields nothing for empty input', () => {
    expect(phoneticKeys('')).toEqual([]);
    expect(spokenForms('   ')).toEqual([]);
  });
});
