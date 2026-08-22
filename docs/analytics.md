# Analytics

Usage analytics are optional and consent gated. There is no diagnostics or session-recording integration.

The default tracker is self-hosted Umami at `https://analytics.sabya.pm/script.js`, included when a valid website ID is present at build time. Optional Google Analytics 4 is included only when a valid `PUBLIC_GA_MEASUREMENT_ID` exists. Set `PUBLIC_UMAMI_WEBSITE_ID` to empty to omit Umami. Without either identifier, the output contains no analytics code at all.

No Umami or Google resource is requested until the visitor makes a single opt-in choice, which is saved in versioned browser-local state.

When GA4 is present it is configured with IP anonymization, no advertising storage, no advertising user data, no Google Signals, and no user-provided data collection.

Events pass through the typed `Analytics` abstraction in `src/domain/analytics.ts`. Direct `gtag()` or `umami.track()` calls outside that module are not allowed.

Event names are verb-first snake_case so a report row reads as a completed action.

## Event taxonomy

This is the complete event allowlist. No other event names or parameters are permitted.

| Event                           | Parameters and allowed values                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `started_teleprompter`          | `voice_mode` (`manual`, `smart_pace`, `private_precision`); `script_size_bucket` (`1_100`, `101_300`, `301_750`, `751_1500`, `1501_plus`); `entry_context` (`new_script`, `restored_script`); `script_kind` (`plain`, `production`)                                                                                          |
| `paused_teleprompter`           | `control_source` (`button`, `keyboard`)                                                                                                                                                                                                                                                                                      |
| `resumed_teleprompter`          | `control_source` (`button`, `keyboard`)                                                                                                                                                                                                                                                                                      |
| `finished_teleprompter`         | None. Fires when scroll reaches at least 95% of the script or an explicit end state.                                                                                                                                                                                                                                         |
| `left_teleprompter_early`       | `progress_bucket` (`0_25`, `25_50`, `50_75`, `75_95`, `95_100`); `duration_bucket` (`under_1m`, `1_5m`, `5_15m`, `15m_plus`); `voice_mode`                                                                                                                                                                                   |
| `restarted_teleprompter`        | `control_source` (`button`, `keyboard`)                                                                                                                                                                                                                                                                                      |
| `opened_appearance_panel`       | None                                                                                                                                                                                                                                                                                                                         |
| `opened_shortcuts_panel`        | None                                                                                                                                                                                                                                                                                                                         |
| `entered_fullscreen`            | None                                                                                                                                                                                                                                                                                                                         |
| `exited_fullscreen`             | None                                                                                                                                                                                                                                                                                                                         |
| `enabled_smart_pace`            | None                                                                                                                                                                                                                                                                                                                         |
| `smart_pace_microphone_blocked` | None                                                                                                                                                                                                                                                                                                                         |
| `smart_pace_unavailable`        | None                                                                                                                                                                                                                                                                                                                         |
| `opened_voice_tracking_panel`   | None                                                                                                                                                                                                                                                                                                                         |
| `chose_manual_scrolling`        | None                                                                                                                                                                                                                                                                                                                         |
| `started_voice_model_download`  | `model_id` (`whisper-tiny-v1`)                                                                                                                                                                                                                                                                                               |
| `finished_voice_model_download` | `model_id` (`whisper-tiny-v1`); `size_bucket` (`65_70_mb`)                                                                                                                                                                                                                                                                   |
| `failed_voice_model_download`   | None                                                                                                                                                                                                                                                                                                                         |
| `enabled_private_precision`     | None                                                                                                                                                                                                                                                                                                                         |
| `private_precision_fell_back`   | `reason` (`alignment_low`, `runtime_error`, `unsupported`, `memory`, `user_switch`)                                                                                                                                                                                                                                          |
| `removed_voice_model`           | None                                                                                                                                                                                                                                                                                                                         |
| `started_recording`             | `recording_type` (`screen`, `camera`); `microphone_included` (boolean)                                                                                                                                                                                                                                                       |
| `finished_recording`            | `recording_type`; `duration_bucket` (same buckets as `left_teleprompter_early`)                                                                                                                                                                                                                                              |
| `saved_recording`               | `recording_type`                                                                                                                                                                                                                                                                                                             |
| `discarded_recording`           | `recording_type`                                                                                                                                                                                                                                                                                                             |
| `recording_start_failed`        | `reason` (`permission_blocked`, `unavailable`)                                                                                                                                                                                                                                                                               |
| `opened_recording_panel`        | None                                                                                                                                                                                                                                                                                                                         |
| `opened_picture_in_picture`     | `pip_mode` (`document`, `video`, `popout`)                                                                                                                                                                                                                                                                                   |
| `imported_plain_text_script`    | `source_type` (`txt`)                                                                                                                                                                                                                                                                                                        |
| `cleared_script`                | None                                                                                                                                                                                                                                                                                                                         |
| `cleared_local_data`            | None                                                                                                                                                                                                                                                                                                                         |
| `changed_presenter_setting`     | `setting` (from the finite settings vocabulary)                                                                                                                                                                                                                                                                              |
| `shared_teleprompter_link`      | `method` (`native`, `clipboard`)                                                                                                                                                                                                                                                                                             |
| `clicked_open_teleprompter`     | `page_type` (`guide`, `tool`, `feature`, `listing`, `about`, `privacy`, `not_found`, `voice_docs`); optional `content_cluster` (`youtube`, `recording`, `presentation`, `zoom`, `voice_tracking`, `speed`, `speaking_time`, `getting_started`, `features`, `privacy`); `cta_location` (`inline`, `end`, `header`, `callout`) |
| `allowed_usage_analytics`       | None                                                                                                                                                                                                                                                                                                                         |
| `declined_usage_analytics`      | None. Fires only when analytics were already on, then turned off. First-visit decline sends nothing.                                                                                                                                                                                                                         |
| `used_speed_calculator`         | `calculator_mode` (`find_pace`, `find_time`). Tab changes always fire. Inputs fire once per page load.                                                                                                                                                                                                                       |
| `used_speaking_time_tool`       | None. Fires once on the first input of a page load.                                                                                                                                                                                                                                                                          |

Sitewide "open teleprompter" links use `data-analytics-cta`, `data-page-type`, and optional `data-content-cluster`. Layout binds those attributes to `clicked_open_teleprompter`.

## Privacy contract

The following never leave the browser in an analytics payload:

- Script text or any fragment of it
- Transcript or recognition fragments
- Microphone audio
- Imported script filenames or titles
- Microphone device names or labels
- Screen or window titles
- Recording filenames
- Clipboard contents
- Free-form error strings
- Local file paths
- Exact user-entered text of any kind
- URLs containing user content

## Enforcement

Two mechanisms enforce the contract in code, not by convention:

1. **Typed allowlist.** `Analytics.track` accepts only names from `ANALYTICS_EVENTS` and properties from `AnalyticsEventProperties`. An event or parameter not in the taxonomy above does not compile and cannot be emitted.
2. **Property filter.** Every payload passes through a filter that drops any key matching a content-shaped pattern (`script`, `transcript`, `recognition`, `voice`, `audio`, `filename`, `microphone`, `clipboard`, `screen_title`, `error_message`, `content`, `text`) and rejects values that are not booleans, finite numbers, or short strings. A small set of taxonomy keys (`voice_mode`, `script_size_bucket`, `script_kind`, `microphone_included`, `content_cluster`, `entry_context`, `control_source`, `calculator_mode`) is allowed by name because their values are constrained to enums or booleans. Product code prefers finite buckets over raw measurements, so even numeric values cannot describe a specific document.

## Canary tests

Playwright end-to-end tests inject known canary strings into the script editor and the voice path, then assert that those strings never appear in any application-generated outgoing URL or request body. Tests run against one build with test analytics identifiers and one without them, and assert that Umami and GA are absent before consent and absent entirely when no identifier is configured.

## GA4 custom dimensions to register manually

Event parameters do not automatically appear in GA4 reports. Registering custom dimensions is a manual step in the GA4 admin panel (Admin, then Custom definitions). Register these, all event scoped:

| Dimension            | Scope        | Required? | Notes                                                              |
| -------------------- | ------------ | --------- | ------------------------------------------------------------------ |
| `page_type`          | Event scoped | Yes       | Distinguishes guide, tool, feature, listing, and related pages     |
| `content_cluster`    | Event scoped | Optional  | Present on `clicked_open_teleprompter` when the page has a cluster |
| `cta_location`       | Event scoped | Optional  | Where the open-teleprompter control sat                            |
| `voice_mode`         | Event scoped | Yes       | Manual versus Smart Pace versus Private Precision                  |
| `entry_context`      | Event scoped | Optional  | New script versus restored script                                  |
| `script_size_bucket` | Event scoped | Optional  | Coarse script length band                                          |
| `script_kind`        | Event scoped | Optional  | Plain text versus production script                                |
| `progress_bucket`    | Event scoped | Optional  | Early-exit progress band                                           |
| `duration_bucket`    | Event scoped | Optional  | Session and recording duration band                                |
| `control_source`     | Event scoped | Optional  | Button versus keyboard                                             |
| `pip_mode`           | Event scoped | Optional  | Picture in Picture provider used                                   |
| `recording_type`     | Event scoped | Optional  | Screen versus camera                                               |
| `calculator_mode`    | Event scoped | Optional  | Speed calculator tab                                               |

Do not register custom equivalents of dimensions GA4 already provides. Landing page, source/medium, country, device category, and new versus returning users are built in and should be used directly.

## Verification checklist

Playwright tests assert that:

1. Umami and GA are absent before consent.
2. Rejecting consent loads nothing.
3. Umami and GA load only after the opt-in choice.
4. No consent UI or third-party request exists without a configured analytics identifier.
5. Script and voice canaries never occur in an application-generated outgoing URL or body.
