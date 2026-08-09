import { describe, expect, it } from 'vitest';
import { VoicePaceAnalyzer } from './smartPace';

const calibrate = (analyzer: VoicePaceAnalyzer, rms = 0.004): number => {
  let at = 0;
  for (; at <= 1600; at += 50) analyzer.process(rms, at);
  return at;
};

describe('Smart Pace signal analysis', () => {
  it('calibrates against quiet room noise', () => {
    const analyzer = new VoicePaceAnalyzer(1000);
    expect(analyzer.process(0.004, 0).state).toBe('calibrating');
    expect(analyzer.process(0.005, 900).state).toBe('calibrating');
    expect(analyzer.process(0.004, 1100).noiseFloor).toBeLessThan(0.01);
  });

  it('recognizes sustained speech but ignores one transient', () => {
    const analyzer = new VoicePaceAnalyzer();
    let at = calibrate(analyzer);
    expect(analyzer.process(0.12, at).speechActive).toBe(false);
    at += 50;
    expect(analyzer.process(0.004, at).speechActive).toBe(false);
    at += 50;
    analyzer.process(0.08, at);
    at += 50;
    const speech = analyzer.process(0.08, at);
    expect(speech.speechActive).toBe(true);
    expect(speech.state).toBe('listening');
  });

  it('slows smoothly, pauses after sustained silence, and resumes', () => {
    const analyzer = new VoicePaceAnalyzer();
    let at = calibrate(analyzer);
    for (let index = 0; index < 20; index += 1) {
      at += 50;
      analyzer.process(0.07, at);
    }
    const speaking = analyzer.process(0.07, at + 50);
    expect(speaking.multiplier).toBeGreaterThan(0.55);
    let quiet = speaking;
    for (let index = 0; index < 100; index += 1) {
      at += 50;
      quiet = analyzer.process(0.003, at);
    }
    expect(quiet.state).toBe('paused');
    expect(quiet.multiplier).toBe(0);
    analyzer.process(0.08, at + 50);
    const resumed = analyzer.process(0.08, at + 100);
    expect(resumed.state).toBe('listening');
    expect(resumed.multiplier).toBeGreaterThan(0);
  });

  it('adapts within bounded multipliers for slow, fast, and noisy patterns', () => {
    const slow = new VoicePaceAnalyzer();
    const fast = new VoicePaceAnalyzer();
    let at = calibrate(slow, 0.01);
    calibrate(fast, 0.004);
    let slowReading = slow.process(0.05, at);
    let fastReading = fast.process(0.08, at);
    for (let index = 0; index < 50; index += 1) {
      at += 50;
      slowReading = slow.process(index % 4 === 0 ? 0.05 : 0.011, at);
      fastReading = fast.process(index % 8 === 0 ? 0.004 : 0.08, at);
    }
    expect(fastReading.multiplier).toBeGreaterThan(slowReading.multiplier);
    expect(fastReading.multiplier).toBeLessThanOrEqual(1.35);
    expect(slowReading.multiplier).toBeGreaterThanOrEqual(0);
  });
});
