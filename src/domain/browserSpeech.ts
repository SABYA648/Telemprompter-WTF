import type { PaceReading } from './smartPace';

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

export interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike | undefined;
}

export interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

export interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  processLocally: boolean;
  onaudioend: ((event: Event) => void) | null;
  onaudiostart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export interface TranscriptReading {
  text: string;
  confidence: number;
  isFinal: boolean;
}

interface BrowserSpeechOptions {
  onTranscript: (reading: TranscriptReading) => void;
  onPace: (reading: PaceReading) => void;
  lang?: string;
}

interface PrimedSpeech {
  recognition: BrowserSpeechRecognition;
  started: boolean;
  denied: boolean;
  unavailable: boolean;
  results: BrowserSpeechRecognitionEvent[];
}

const FATAL_SPEECH_ERRORS = new Set([
  'audio-capture',
  'network',
  'not-allowed',
  'service-not-allowed',
  'language-not-supported',
]);

let primedSpeech: PrimedSpeech | null = null;

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const speechWindow = window as Window & SpeechWindow;
  const Constructor =
    speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
  if (!Constructor) return null;
  // Playwright's bundled Chromium exposes a native SpeechRecognition that crashes the
  // renderer on start(). Tests inject a named mock class; real visitors are not webdriver.
  if (typeof navigator !== 'undefined' && navigator.webdriver) {
    const name = Constructor.name;
    if (name === 'SpeechRecognition' || name === 'webkitSpeechRecognition' || name === '') {
      return null;
    }
  }
  return Constructor;
}

export function hasBrowserSpeechRecognition(): boolean {
  return Boolean(getSpeechRecognitionConstructor());
}

export function collectRecognitionText(
  results: SpeechRecognitionResultListLike,
  fromIndex = 0,
): { text: string; confidence: number; isFinal: boolean } {
  const parts: string[] = [];
  let confidence = 0;
  let confidenceCount = 0;
  let isFinal = true;
  const start = Math.max(0, Math.min(fromIndex, results.length));
  for (let index = start; index < results.length; index += 1) {
    const result = results[index];
    const alternative = result?.[0];
    if (!alternative?.transcript) continue;
    parts.push(alternative.transcript);
    if (Number.isFinite(alternative.confidence) && alternative.confidence > 0) {
      confidence += alternative.confidence;
      confidenceCount += 1;
    }
    if (result && !result.isFinal) isFinal = false;
  }
  return {
    text: parts.join(' ').replace(/\s+/g, ' ').trim(),
    confidence: confidenceCount ? confidence / confidenceCount : 1,
    isFinal,
  };
}

export function configureSpeechRecognition(
  recognition: BrowserSpeechRecognition,
  lang = defaultSpeechLang(),
): void {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = lang;
  try {
    recognition.processLocally = true;
  } catch {
    // Older implementations reject unknown properties; browser-default STT still works.
  }
}

export function defaultSpeechLang(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  const language = navigator.language;
  if (language) return language;
  try {
    return document.documentElement.lang || 'en-US';
  } catch {
    return 'en-US';
  }
}

/** Must run inside the Start click so SpeechRecognition keeps user activation. */
export function primeBrowserSpeechInUserGesture(): void {
  const Constructor = getSpeechRecognitionConstructor();
  if (!Constructor) return;
  primedSpeech?.recognition.abort();
  const recognition = new Constructor();
  configureSpeechRecognition(recognition);
  const primed: PrimedSpeech = {
    recognition,
    started: false,
    denied: false,
    unavailable: false,
    results: [],
  };
  recognition.onstart = () => {
    primed.started = true;
  };
  recognition.onerror = (event) => {
    if (
      recognition.processLocally &&
      (event.error === 'language-not-supported' || event.error === 'service-not-allowed')
    ) {
      recognition.processLocally = false;
      try {
        recognition.start();
        return;
      } catch {
        primed.unavailable = true;
        return;
      }
    }
    if (event.error === 'not-allowed') primed.denied = true;
    if (FATAL_SPEECH_ERRORS.has(event.error)) primed.unavailable = event.error !== 'not-allowed';
  };
  recognition.onresult = (event) => {
    primed.results.push(event);
  };
  try {
    recognition.start();
    primedSpeech = primed;
  } catch {
    primedSpeech = null;
  }
}

export function takePrimedSpeechRecognition(): PrimedSpeech | null {
  const primed = primedSpeech;
  primedSpeech = null;
  return primed;
}

export function clearPrimedSpeechRecognition(): void {
  primedSpeech?.recognition.abort();
  primedSpeech = null;
}

const listeningPace = (speechActive: boolean): PaceReading => ({
  state: speechActive ? 'listening' : 'paused',
  multiplier: 0,
  speechActive,
  noiseFloor: 0,
});

export class BrowserSpeechSession {
  private readonly options: BrowserSpeechOptions;
  private recognition: BrowserSpeechRecognition | null = null;
  private stopped = true;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: BrowserSpeechOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    this.stop();
    const Constructor = getSpeechRecognitionConstructor();
    const primed = takePrimedSpeechRecognition();
    if (primed?.denied) throw new DOMException('blocked', 'NotAllowedError');
    if (!Constructor && !primed) throw new Error('speech-recognition-unavailable');

    this.stopped = false;
    this.recognition = primed?.recognition ?? (Constructor ? new Constructor() : null);
    if (!this.recognition) throw new Error('speech-recognition-unavailable');
    const recognition = this.recognition;
    if (!primed) configureSpeechRecognition(recognition);
    const started = this.attach(recognition, primed);

    if (!primed) {
      try {
        recognition.start();
      } catch (error) {
        this.stop();
        throw error;
      }
    }

    await started;
    if (!primed?.results.length) {
      this.options.onPace({ ...listeningPace(false), state: 'listening' });
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.restartTimer !== null) clearTimeout(this.restartTimer);
    this.restartTimer = null;
    const recognition = this.recognition;
    this.recognition = null;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.onstart = null;
    recognition.onspeechstart = null;
    recognition.onspeechend = null;
    try {
      recognition.abort();
    } catch {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    }
  }

  private attach(
    recognition: BrowserSpeechRecognition,
    primed: PrimedSpeech | null,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      const succeed = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        this.stop();
        reject(error);
      };

      recognition.onstart = () => succeed();
      recognition.onspeechstart = () => this.options.onPace(listeningPace(true));
      recognition.onspeechend = () => this.options.onPace(listeningPace(false));
      recognition.onresult = (event) => {
        succeed();
        this.options.onPace(listeningPace(true));
        const collected = collectRecognitionText(event.results);
        if (!collected.text) return;
        this.options.onTranscript(collected);
      };
      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        if (
          recognition.processLocally &&
          (event.error === 'language-not-supported' || event.error === 'service-not-allowed')
        ) {
          recognition.processLocally = false;
          try {
            recognition.start();
            return;
          } catch {
            // Fall through to failure.
          }
        }
        if (event.error === 'not-allowed') {
          fail(new DOMException('blocked', 'NotAllowedError'));
          return;
        }
        if (FATAL_SPEECH_ERRORS.has(event.error)) {
          fail(new Error('speech-recognition-unavailable'));
        }
      };
      recognition.onend = () => {
        if (this.stopped) return;
        this.restartTimer = setTimeout(() => {
          if (this.stopped || !this.recognition) return;
          try {
            this.recognition.start();
          } catch {
            if (!settled) fail(new Error('speech-recognition-unavailable'));
          }
        }, 160);
      };

      if (primed?.denied) {
        fail(new DOMException('blocked', 'NotAllowedError'));
        return;
      }
      if (primed?.unavailable) {
        fail(new Error('speech-recognition-unavailable'));
        return;
      }
      if (primed?.started) succeed();
      for (const event of primed?.results ?? []) recognition.onresult?.(event);

      globalThis.setTimeout(
        () => {
          if (settled || this.stopped) return;
          fail(new Error('speech-recognition-unavailable'));
        },
        primed ? 800 : 1200,
      );
    });
  }
}

export function speechErrorState(error: unknown): 'denied' | 'unavailable' | 'error' {
  if (
    error instanceof DOMException &&
    (error.name === 'NotAllowedError' || error.name === 'SecurityError')
  ) {
    return 'denied';
  }
  if (error instanceof Error && error.message.includes('unavailable')) return 'unavailable';
  return 'error';
}
