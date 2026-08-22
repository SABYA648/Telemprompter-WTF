import { describe, expect, it } from 'vitest';
import { TOTAL_FIRST_USE_BYTES } from './modelManager';
import { MODES, PRIVACY_BOUNDARY, PRODUCT_NAME, POSITIONING_STATEMENT } from './productFacts';

describe('productFacts', () => {
  it('defines the 3 distinct presentation modes', () => {
    expect(Object.keys(MODES)).toEqual(['manual', 'smart', 'precision']);
  });

  it('maintains strict mode property invariants', () => {
    // Manual
    expect(MODES.manual.transcribesSpeech).toBe(false);
    expect(MODES.manual.requiresMicrophone).toBe(false);
    expect(MODES.manual.downloadBytes).toBe(0);

    // Smart Pace: Signal analysis only, no transcription, no download
    expect(MODES.smart.transcribesSpeech).toBe(false);
    expect(MODES.smart.requiresMicrophone).toBe(true);
    expect(MODES.smart.downloadBytes).toBe(0);

    // Private Precision: On-device transcription, optional ~67 MB download
    expect(MODES.precision.transcribesSpeech).toBe(true);
    expect(MODES.precision.requiresMicrophone).toBe(true);
    expect(MODES.precision.downloadBytes).toBe(TOTAL_FIRST_USE_BYTES);
  });

  it('matches the exact first-use byte total from modelManager', () => {
    expect(MODES.precision.downloadBytes).toBe(66_874_154);
  });

  it('defines comprehensive privacy boundaries', () => {
    expect(PRIVACY_BOUNDARY.scriptStorage).toContain('localStorage');
    expect(PRIVACY_BOUNDARY.microphoneAudio).toContain('never uploaded');
    expect(PRIVACY_BOUNDARY.recognitionFragments).toContain('discarded');
    expect(PRIVACY_BOUNDARY.recordings).toContain('MediaRecorder');
    expect(PRIVACY_BOUNDARY.analytics).toContain('consent-gated');
  });

  it('exposes valid product metadata', () => {
    expect(PRODUCT_NAME).toBe('teleprompter.wtf');
    expect(POSITIONING_STATEMENT).toContain(
      'follows your pace while your script and voice stay on your device',
    );
  });
});
