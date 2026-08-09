import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  Analytics,
  durationBucket,
  filterSafeProperties,
  isAllowedAnalyticsEvent,
  progressBucket,
  scriptSizeBucket,
  validateEventProperties,
  voiceModeParam,
} from './analytics';

describe('analytics abstraction', () => {
  it('allows only the documented event taxonomy', () => {
    for (const event of ANALYTICS_EVENTS) expect(isAllowedAnalyticsEvent(event)).toBe(true);
    expect(isAllowedAnalyticsEvent('script_content')).toBe(false);
    expect(isAllowedAnalyticsEvent('page_view_with_text')).toBe(false);
    expect(isAllowedAnalyticsEvent('fullscreen_enter')).toBe(false);
    expect(isAllowedAnalyticsEvent('record_stop')).toBe(false);
    expect(isAllowedAnalyticsEvent('record_download')).toBe(false);
    expect(isAllowedAnalyticsEvent('voice_mode_change')).toBe(false);
  });

  it('documents the final taxonomy', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'teleprompter_start',
      'teleprompter_pause',
      'teleprompter_resume',
      'teleprompter_complete',
      'teleprompter_exit',
      'smart_pace_enable',
      'private_precision_download_start',
      'private_precision_download_complete',
      'private_precision_enable',
      'private_precision_fallback',
      'record_start',
      'record_complete',
      'record_save',
      'pip_open',
      'share_tool',
      'script_import',
      'script_clear',
      'setting_change',
      'use_teleprompter_cta',
    ]);
  });

  it('remains unavailable without a valid measurement ID', () => {
    expect(new Analytics('').available).toBe(false);
    expect(new Analytics('not-a-ga-id').available).toBe(false);
    expect(new Analytics('G-TEST123').available).toBe(true);
  });

  it('drops user-content-shaped properties', () => {
    expect(
      filterSafeProperties({
        voice_mode: 'manual',
        entry_context: 'restored_script',
        success: true,
        script: 'private words',
        transcript_fragment: 'private words',
        voice: 'raw audio marker',
        filename: 'recording.webm',
        error_message: 'raw browser error',
        clipboard: 'copied text',
        free_text: 'looks like a safe key but is not taxonomy',
      }),
    ).toEqual({ voice_mode: 'manual', entry_context: 'restored_script', success: true });
  });

  it('drops malformed keys and arbitrary or oversized values', () => {
    expect(
      filterSafeProperties({
        'Bad Key': 'x',
        method: 'native',
        freeform: 'a'.repeat(80),
        spaced: 'too   many   spaces',
        count: Number.POSITIVE_INFINITY,
      }),
    ).toEqual({ method: 'native' });
  });

  it('keeps only schema-approved properties with enum values', () => {
    expect(
      validateEventProperties('teleprompter_start', {
        voice_mode: 'smart_pace',
        script_size_bucket: '301_750',
        entry_context: 'restored_script',
        speed: 5,
      }),
    ).toEqual({
      voice_mode: 'smart_pace',
      script_size_bucket: '301_750',
      entry_context: 'restored_script',
    });
    expect(
      validateEventProperties('teleprompter_start', {
        voice_mode: 'shouty',
        script_size_bucket: '301_750',
        entry_context: 'restored_script',
      }),
    ).toEqual({ script_size_bucket: '301_750', entry_context: 'restored_script' });
    expect(
      validateEventProperties('record_start', {
        recording_type: 'screen',
        microphone_included: true,
      }),
    ).toEqual({ recording_type: 'screen', microphone_included: true });
    expect(
      validateEventProperties('record_start', {
        recording_type: 'screen',
        microphone_included: 'yes',
      }),
    ).toEqual({ recording_type: 'screen' });
    expect(validateEventProperties('teleprompter_complete', { sneaky: 'value' })).toEqual({});
  });

  it('buckets script sizes at the documented boundaries', () => {
    expect(scriptSizeBucket(0)).toBe('1_100');
    expect(scriptSizeBucket(100)).toBe('1_100');
    expect(scriptSizeBucket(101)).toBe('101_300');
    expect(scriptSizeBucket(300)).toBe('101_300');
    expect(scriptSizeBucket(301)).toBe('301_750');
    expect(scriptSizeBucket(750)).toBe('301_750');
    expect(scriptSizeBucket(751)).toBe('751_1500');
    expect(scriptSizeBucket(1500)).toBe('751_1500');
    expect(scriptSizeBucket(1501)).toBe('1501_plus');
  });

  it('buckets progress at the documented boundaries', () => {
    expect(progressBucket(0)).toBe('0_25');
    expect(progressBucket(0.24)).toBe('0_25');
    expect(progressBucket(0.25)).toBe('25_50');
    expect(progressBucket(0.5)).toBe('50_75');
    expect(progressBucket(0.75)).toBe('75_95');
    expect(progressBucket(0.94)).toBe('75_95');
    expect(progressBucket(0.95)).toBe('95_100');
    expect(progressBucket(1)).toBe('95_100');
    expect(progressBucket(Number.NaN)).toBe('0_25');
  });

  it('buckets durations at the documented boundaries', () => {
    expect(durationBucket(0)).toBe('under_1m');
    expect(durationBucket(59)).toBe('under_1m');
    expect(durationBucket(60)).toBe('1_5m');
    expect(durationBucket(299)).toBe('1_5m');
    expect(durationBucket(300)).toBe('5_15m');
    expect(durationBucket(899)).toBe('5_15m');
    expect(durationBucket(900)).toBe('15m_plus');
  });

  it('maps internal voice modes to analytics voice_mode values', () => {
    expect(voiceModeParam('manual')).toBe('manual');
    expect(voiceModeParam('smart')).toBe('smart_pace');
    expect(voiceModeParam('precision')).toBe('private_precision');
  });
});
