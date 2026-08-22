# Analytics

Usage analytics are optional and consent gated. There is no diagnostics or session-recording integration.

The default tracker is self-hosted Umami at `https://analytics.sabya.pm/script.js`, included when a valid website ID is present at build time. Optional Google Analytics 4 is included only when a valid `PUBLIC_GA_MEASUREMENT_ID` exists. Set `PUBLIC_UMAMI_WEBSITE_ID` to empty to omit Umami. Without either identifier, the output contains no analytics code at all.

No Umami or Google resource is requested until the visitor makes a single opt-in choice, which is saved in versioned browser-local state.

When GA4 is present it is configured with IP anonymization, no advertising storage, no advertising user data, no Google Signals, and no user-provided data collection.

Events pass through the typed `Analytics` abstraction in `src/domain/analytics.ts`. Direct `gtag()` or `umami.track()` calls outside that module are not allowed.

## Event taxonomy

This is the complete event allowlist. No other event names or parameters are permitted.

| Event                                 | Parameters and allowed values                                                                                                                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `teleprompter_start`                  | `voice_mode` (`manual`, `smart_pace`, `private_precision`); `script_size_bucket` (`1_100`, `101_300`, `301_750`, `751_1500`, `1501_plus`); `entry_context` (`new_script`, `restored_script`)                                     |
| `teleprompter_pause`                  | None                                                                                                                                                                                                                             |
| `teleprompter_resume`                 | None                                                                                                                                                                                                                             |
| `teleprompter_complete`               | None. Fires when scroll reaches at least 95% of the script or an explicit end state.                                                                                                                                             |
| `teleprompter_exit`                   | `progress_bucket` (`0_25`, `25_50`, `50_75`, `75_95`, `95_100`); `duration_bucket` (`under_1m`, `1_5m`, `5_15m`, `15m_plus`); `voice_mode`                                                                                       |
| `smart_pace_enable`                   | `result` (`started`, `mic_blocked`, `unavailable`)                                                                                                                                                                               |
| `private_precision_download_start`    | `model_id` (`whisper-tiny-v1`)                                                                                                                                                                                                   |
| `private_precision_download_complete` | `model_id` (`whisper-tiny-v1`); `size_bucket` (`65_70_mb`)                                                                                                                                                                       |
| `private_precision_enable`            | None                                                                                                                                                                                                                             |
| `private_precision_fallback`          | `reason` (`alignment_low`, `runtime_error`, `unsupported`, `memory`, `user_switch`)                                                                                                                                              |
| `record_start`                        | `recording_type` (`screen`, `camera`); `microphone_included` (boolean)                                                                                                                                                           |
| `record_complete`                     | `recording_type`; `duration_bucket` (same buckets as `teleprompter_exit`)                                                                                                                                                        |
| `record_save`                         | `recording_type`                                                                                                                                                                                                                 |
| `pip_open`                            | `pip_mode` (`document`, `video`, `popout`)                                                                                                                                                                                       |
| `share_tool`                          | `method` (`native`, `clipboard`)                                                                                                                                                                                                 |
| `script_import`                       | `source_type` (`txt`)                                                                                                                                                                                                            |
| `script_clear`                        | None                                                                                                                                                                                                                             |
| `setting_change`                      | `setting` (from the finite settings vocabulary)                                                                                                                                                                                  |
| `use_teleprompter_cta`                | `page_type` (`guide`, `tool`, `feature`); optional `content_cluster` (`youtube`, `recording`, `presentation`, `zoom`, `voice_tracking`, `speed`, `speaking_time`, `getting_started`); `cta_location` (`inline`, `end`, `header`) |

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

1. **Typed allowlist.** The `Analytics` module exposes one typed method per event. An event or parameter not in the taxonomy above does not compile and cannot be emitted.
2. **Property filter.** Every payload passes through a filter that drops any key matching a content-shaped pattern (`script`, `transcript`, `recognition`, `voice`, `audio`, `filename`, `microphone`, `clipboard`, `screen_title`, `error_message`, `content`, `text`) and rejects values that are not booleans, finite numbers, or short strings. Product code prefers finite buckets over raw measurements, so even numeric values cannot describe a specific document.

## Canary tests

Playwright end-to-end tests inject known canary strings into the script editor and the voice path, then assert that those strings never appear in any application-generated outgoing URL or request body. Tests run against one build with test analytics identifiers and one without them, and assert that Umami and GA are absent before consent and absent entirely when no identifier is configured.

## GA4 custom dimensions to register manually

Event parameters do not automatically appear in GA4 reports. Registering custom dimensions is a manual step in the GA4 admin panel (Admin, then Custom definitions). Register these, all event scoped:

| Dimension            | Scope        | Required? | Notes                                             |
| -------------------- | ------------ | --------- | ------------------------------------------------- |
| `page_type`          | Event scoped | Yes       | Distinguishes guide, tool, and feature pages      |
| `content_cluster`    | Event scoped | Optional  | Present only on `use_teleprompter_cta`            |
| `voice_mode`         | Event scoped | Yes       | Manual versus Smart Pace versus Private Precision |
| `entry_context`      | Event scoped | Optional  | New script versus restored script                 |
| `script_size_bucket` | Event scoped | Optional  | Coarse script length band                         |
| `progress_bucket`    | Event scoped | Optional  | Exit progress band                                |
| `duration_bucket`    | Event scoped | Optional  | Session and recording duration band               |
| `pip_mode`           | Event scoped | Optional  | Picture in Picture provider used                  |
| `recording_type`     | Event scoped | Optional  | Screen versus camera                              |

Do not register custom equivalents of dimensions GA4 already provides. Landing page, source/medium, country, device category, and new versus returning users are built in and should be used directly.

## Verification checklist

Playwright tests assert that:

1. Umami and GA are absent before consent.
2. Rejecting consent loads nothing.
3. Umami and GA load only after the opt-in choice.
4. No consent UI or third-party request exists without a configured analytics identifier.
5. Script and voice canaries never occur in an application-generated outgoing URL or body.
