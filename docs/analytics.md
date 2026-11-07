# Product analytics

teleprompter.wtf uses self-hosted Umami for page views and product events on every page. The script defaults to `https://analytics.sabya.pm/script.js` with the website ID and domain configured in `.env.example`. Set `PUBLIC_UMAMI_DOMAINS` for the intended host. The default domain prevents the real tracker from sending local development traffic.

On first visit the browser creates `tw.did`, a 16-byte random identifier encoded as 22 base64url characters. Each page load calls `identify` with that ID and session data: display mode, device class, first-visit ISO cohort week, take and streak buckets, and app version. The ID is pseudonymous and stored in local storage. The owner must verify Umami is version 2.18.0 or later for distinct IDs. Separate browser profiles and iOS Home Screen storage have separate IDs until the planned transfer flow is available.

The facade in `src/domain/analytics.ts` is the only direct Umami caller. It validates the event and its enum, boolean or numeric properties, rejects unknown keys and strings longer than 40 characters, and queues at most 50 calls until the script loads. It never sends script text, titles, idea text, file names or raw error messages. Studio virtual page paths are normalized so they do not contain IDs. JavaScript errors are limited to five per page load and mapped to a fixed name list.

## Taxonomy v2

The complete event and property allowlist is in `src/domain/analytics.ts`. Classic events cover presenter start, pause, resume, restart, completion and early exit; appearance and shortcuts; fullscreen, recording, compact view, import, clear, settings, pace cues, sharing, CTA clicks and the two calculators. Their properties use bounded buckets or enumerated values.

Studio events cover opening the app and camera priming, permissions and failures; starting, stopping, keeping, discarding, exporting and recovering takes; creating and editing scripts; templates, hooks and ideas; handoff and transfer; practice, settings and remote keys; prompts, streaks, goals, badges, cards, challenges and reminders; installation, ratings, storage warnings and errors; creator tools and advanced exports. Events are added to the UI as their milestones ship. No unlisted event is sent.

### Event properties

| Events                                                                  | Properties                                                                 |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `started_teleprompter`                                                  | `script_size_bucket`, `entry_context`, `script_kind`                       |
| `paused_teleprompter`, `resumed_teleprompter`, `restarted_teleprompter` | `control_source`                                                           |
| `left_teleprompter_early`                                               | `progress_bucket`, `duration_bucket`                                       |
| `started_recording`                                                     | `recording_type`, `microphone_included`                                    |
| `finished_recording`                                                    | `recording_type`, `duration_bucket`                                        |
| `saved_recording`, `discarded_recording`                                | `recording_type`                                                           |
| `recording_start_failed`                                                | `reason`                                                                   |
| `opened_picture_in_picture`                                             | `pip_mode`                                                                 |
| `imported_plain_text_script`                                            | `source_type`                                                              |
| `changed_presenter_setting`                                             | `setting`                                                                  |
| `pace_cue_shown`                                                        | `cue`                                                                      |
| `shared_teleprompter_link`                                              | `method`                                                                   |
| `clicked_open_teleprompter`, `clicked_open_studio`                      | `page_type`, optional `content_cluster`, `cta_location`                    |
| `used_speed_calculator`                                                 | `calculator_mode`                                                          |
| `opened_studio`                                                         | `entry`, `display`, `device_class`                                         |
| `granted_camera`                                                        | `ready_bucket`                                                             |
| `camera_failed`, `recording_failed`                                     | `reason`                                                                   |
| `started_take`                                                          | `aspect`, `resolution`, `fps`, `facing`, `mode`, `countdown`, `has_target` |
| `stopped_take`                                                          | `take_length_bucket`, `ended_by`, `progress_bucket`                        |
| `kept_take`                                                             | `take_number_bucket`, `take_length_bucket`, `fit`                          |
| `discarded_take`                                                        | `take_length_bucket`                                                       |
| `exported_take`                                                         | `method`, `container`, `size_bucket`                                       |
| `created_script`, `captured_idea`                                       | `source`                                                                   |
| `edited_script`                                                         | `words_bucket`                                                             |
| `used_template`                                                         | `template_id`                                                              |
| `inserted_hook`, `shuffled_hooks`                                       | `niche`                                                                    |
| `copied_hook`                                                           | `niche`, `surface`                                                         |
| `sent_to_phone`, `received_script`                                      | `method`                                                                   |
| `transferred_scripts`                                                   | `direction`                                                                |
| `completed_practice`                                                    | `progress_bucket`, `pace_bucket`                                           |
| `changed_studio_setting`                                                | `setting`, `group`                                                         |
| `used_remote_key`                                                       | `device`                                                                   |
| `extended_streak`                                                       | `streak_bucket`                                                            |
| `lost_streak`                                                           | `previous_bucket`                                                          |
| `set_weekly_goal`, `reached_weekly_goal`                                | `goal`                                                                     |
| `unlocked_badge`                                                        | `badge_id`                                                                 |
| `shared_progress_card`                                                  | `card`                                                                     |
| `shown_install_prompt`, `dismissed_install_prompt`, `installed_app`     | `platform`                                                                 |
| `rated_recording`                                                       | `score`                                                                    |
| `storage_warning`                                                       | `level`                                                                    |
| `js_error`                                                              | `area`, `name`                                                             |
| `converted_take`                                                        | `result`                                                                   |

The remaining allowlisted events carry no properties. The code contains the exact permitted values for each property.

## Owner setup and KPIs

Create Umami goals for `kept_take`, `exported_take`, `installed_app` and `completed_practice`. Set up these funnels:

1. Activation: `/studio/record` page view, `granted_camera`, `started_take`, `kept_take`, `exported_take`.
2. SEO to creator: a `/record`, `/templates`, `/hooks`, `/guides` or `/tools` page view, then `clicked_open_studio`, `opened_studio`, `kept_take`.
3. Install: `shown_install_prompt`, then `installed_app`.
4. Handoff: `sent_to_phone`, `received_script`, `kept_take`.

Use weekly retention cohorts filtered by `device_class` and `display`, journeys from `/studio/home`, and UTM reports for `pwa`, `calendar` and `share_card`. DAU is distinct visitors completing a core action on a day; MAU is the same over the trailing 30 days. DAU/MAU is average daily DAU divided by MAU. Activation is the first funnel conversion for first-week cohorts. Track camera failures divided by camera attempts, recording failures and recoveries divided by starts, and JavaScript errors per 100 sessions. Weekly Recording Creators are distinct devices with a kept take in the trailing seven days.

The optional same-origin proxy is off by default. If the owner chooses it, enable the commented Nginx block, build with `PUBLIC_UMAMI_PROXY=true`, configure Umami's client IP header if needed, and remove the external analytics origin from CSP. Do not enable it without the owner's infrastructure decision.
