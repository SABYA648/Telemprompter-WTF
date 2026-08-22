import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_EVENTS,
  Analytics,
  durationBucket,
  filterSafeProperties,
  isAllowedAnalyticsEvent,
  parseUmamiScriptSrc,
  parseUmamiWebsiteId,
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

  it('rejects the retired event names', () => {
    for (const event of [
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
    ]) {
      expect(isAllowedAnalyticsEvent(event)).toBe(false);
    }
  });

  it('documents the final taxonomy', () => {
    expect(ANALYTICS_EVENTS).toEqual([
      'started_teleprompter',
      'paused_teleprompter',
      'resumed_teleprompter',
      'finished_teleprompter',
      'left_teleprompter_early',
      'restarted_teleprompter',
      'opened_appearance_panel',
      'opened_shortcuts_panel',
      'entered_fullscreen',
      'exited_fullscreen',
      'enabled_smart_pace',
      'smart_pace_microphone_blocked',
      'smart_pace_unavailable',
      'opened_voice_tracking_panel',
      'chose_manual_scrolling',
      'started_voice_model_download',
      'finished_voice_model_download',
      'failed_voice_model_download',
      'enabled_private_precision',
      'private_precision_fell_back',
      'removed_voice_model',
      'started_recording',
      'finished_recording',
      'saved_recording',
      'discarded_recording',
      'recording_start_failed',
      'opened_recording_panel',
      'opened_picture_in_picture',
      'imported_plain_text_script',
      'cleared_script',
      'cleared_local_data',
      'changed_presenter_setting',
      'shared_teleprompter_link',
      'clicked_open_teleprompter',
      'allowed_usage_analytics',
      'declined_usage_analytics',
      'used_speed_calculator',
      'used_speaking_time_tool',
    ]);
  });

  it('remains unavailable without a valid measurement ID', () => {
    expect(new Analytics('').available).toBe(false);
    expect(new Analytics('not-a-ga-id').available).toBe(false);
    expect(new Analytics('G-TEST123').available).toBe(true);
    expect(new Analytics('', 'c5952a2b-b192-46fe-8a3d-04ad673ffd6d').available).toBe(true);
    expect(new Analytics('', 'not-a-uuid').available).toBe(false);
    expect(
      new Analytics('', 'c5952a2b-b192-46fe-8a3d-04ad673ffd6d', 'https://evil.example/script.js')
        .available,
    ).toBe(false);
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
      validateEventProperties('started_teleprompter', {
        voice_mode: 'smart_pace',
        script_size_bucket: '301_750',
        entry_context: 'restored_script',
        script_kind: 'plain',
        speed: 5,
      }),
    ).toEqual({
      voice_mode: 'smart_pace',
      script_size_bucket: '301_750',
      entry_context: 'restored_script',
      script_kind: 'plain',
    });
    expect(
      validateEventProperties('started_teleprompter', {
        voice_mode: 'shouty',
        script_size_bucket: '301_750',
        entry_context: 'restored_script',
        script_kind: 'plain',
      }),
    ).toEqual({
      script_size_bucket: '301_750',
      entry_context: 'restored_script',
      script_kind: 'plain',
    });
    expect(
      validateEventProperties('started_recording', {
        recording_type: 'screen',
        microphone_included: true,
      }),
    ).toEqual({ recording_type: 'screen', microphone_included: true });
    expect(
      validateEventProperties('started_recording', {
        recording_type: 'screen',
        microphone_included: 'yes',
      }),
    ).toEqual({ recording_type: 'screen' });
    expect(validateEventProperties('finished_teleprompter', { sneaky: 'value' })).toEqual({});
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

  it('accepts only the self-hosted Umami script origin', () => {
    expect(parseUmamiWebsiteId('c5952a2b-b192-46fe-8a3d-04ad673ffd6d')).toBe(
      'c5952a2b-b192-46fe-8a3d-04ad673ffd6d',
    );
    expect(parseUmamiWebsiteId('C5952A2B-B192-46FE-8A3D-04AD673FFD6D')).toBe(
      'c5952a2b-b192-46fe-8a3d-04ad673ffd6d',
    );
    expect(parseUmamiScriptSrc('')).toBe('https://analytics.sabya.pm/script.js');
    expect(parseUmamiScriptSrc('https://analytics.sabya.pm/script.js')).toBe(
      'https://analytics.sabya.pm/script.js',
    );
    expect(parseUmamiScriptSrc('https://analytics.sabya.pm/script.js?steal=1')).toBe('');
    expect(parseUmamiScriptSrc('https://example.com/script.js')).toBe('');
  });
});
