import { describe, expect, it, vi } from 'vitest';
import {
  BrowserSpeechSession,
  collectRecognitionText,
  configureSpeechRecognition,
  hasBrowserSpeechRecognition,
  primeBrowserSpeechInUserGesture,
  splitRecognitionResults,
  takePrimedSpeechRecognition,
  type BrowserSpeechRecognition,
} from './browserSpeech';

const resultList = (transcript: string, isFinal = true) => ({
  length: 1,
  0: {
    isFinal,
    length: 1,
    0: { transcript, confidence: 0.92 },
  },
});

describe('browser speech recognition', () => {
  it('collects final and interim transcripts', () => {
    const collected = collectRecognitionText({
      length: 2,
      0: {
        isFinal: true,
        length: 1,
        0: { transcript: 'welcome to the', confidence: 0.9 },
      },
      1: {
        isFinal: false,
        length: 1,
        0: { transcript: 'practical guide', confidence: 0.7 },
      },
    });
    expect(collected.text).toBe('welcome to the practical guide');
    expect(collected.isFinal).toBe(false);
    expect(collected.confidence).toBeCloseTo(0.8);
  });

  it('emits only newly committed words and the current unstable tail', () => {
    const results = {
      length: 3,
      0: { isFinal: true, length: 1, 0: { transcript: 'welcome to the', confidence: 0.9 } },
      1: { isFinal: true, length: 1, 0: { transcript: 'practical guide', confidence: 0.9 } },
      2: { isFinal: false, length: 1, 0: { transcript: 'we will start', confidence: 0.6 } },
    };

    const first = splitRecognitionResults(results, 0);
    expect(first.finalDelta).toBe('welcome to the practical guide');
    expect(first.interim).toBe('we will start');
    expect(first.finalizedIndex).toBe(2);

    // The next event must not repeat what has already been committed.
    const second = splitRecognitionResults(results, first.finalizedIndex);
    expect(second.finalDelta).toBe('');
    expect(second.interim).toBe('we will start');
    expect(second.finalizedIndex).toBe(2);
  });

  it('stops committing at the first unstable result', () => {
    const results = {
      length: 3,
      0: { isFinal: true, length: 1, 0: { transcript: 'one', confidence: 0.9 } },
      1: { isFinal: false, length: 1, 0: { transcript: 'two', confidence: 0.5 } },
      2: { isFinal: true, length: 1, 0: { transcript: 'three', confidence: 0.9 } },
    };
    const split = splitRecognitionResults(results, 0);
    expect(split.finalDelta).toBe('one');
    expect(split.interim).toBe('two three');
    expect(split.finalizedIndex).toBe(1);
  });

  it('reports when the constructor is missing', () => {
    expect(hasBrowserSpeechRecognition()).toBe(false);
  });

  it('primes recognition inside a user gesture and replays results', async () => {
    const started: BrowserSpeechRecognition[] = [];
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      processLocally = false;
      onaudioend = null;
      onaudiostart = null;
      onend: ((event: Event) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onresult:
        | ((event: {
            resultIndex: number;
            results: ReturnType<typeof resultList> & { length: number };
          }) => void)
        | null = null;
      onspeechend: ((event: Event) => void) | null = null;
      onspeechstart: ((event: Event) => void) | null = null;
      onstart: ((event: Event) => void) | null = null;
      start() {
        started.push(this as unknown as BrowserSpeechRecognition);
        this.onstart?.(new Event('start'));
        this.onresult?.({
          resultIndex: 0,
          results: resultList('welcome to the practical guide'),
        });
      }
      stop() {}
      abort() {}
    }
    vi.stubGlobal(
      'window',
      Object.assign(typeof window === 'undefined' ? globalThis : window, {
        SpeechRecognition: FakeRecognition,
      }),
    );

    primeBrowserSpeechInUserGesture();
    expect(started).toHaveLength(1);
    expect(takePrimedSpeechRecognition()?.started).toBe(true);

    const transcripts: string[] = [];
    const session = new BrowserSpeechSession({
      onTranscript: (reading) =>
        transcripts.push(`${reading.finalDelta} ${reading.interim}`.trim()),
      onPace: () => undefined,
    });
    primeBrowserSpeechInUserGesture();
    await session.start();
    expect(transcripts.some((text) => text.includes('practical guide'))).toBe(true);
    expect(started[0]?.continuous).toBe(true);
    expect(started[0]?.interimResults).toBe(true);
    expect(started[0]?.processLocally).toBe(true);
    session.stop();
    vi.unstubAllGlobals();
  });

  it('configures continuous local recognition', () => {
    const recognition = {
      continuous: false,
      interimResults: false,
      lang: '',
      maxAlternatives: 0,
      processLocally: false,
      onaudioend: null,
      onaudiostart: null,
      onend: null,
      onerror: null,
      onresult: null,
      onspeechend: null,
      onspeechstart: null,
      onstart: null,
      start() {},
      stop() {},
      abort() {},
    } satisfies BrowserSpeechRecognition;
    configureSpeechRecognition(recognition, 'en-GB');
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);
    expect(recognition.processLocally).toBe(true);
    expect(recognition.lang).toBe('en-GB');
  });
});
