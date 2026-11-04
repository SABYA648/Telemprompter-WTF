# Device smoke test

Manual launch checks per platform. Automated tests use deterministic browser mocks for permissions and media capture; mocks are not real operating-system permission flows. **Every row below requires manual device verification.**

Run each check on a production build served over HTTPS (permissions and capture APIs behave differently on insecure origins).

| Platform        | Manual presenter | Fullscreen | Recording | Picture in Picture | Orientation | Save behavior |
| --------------- | ---------------- | ---------- | --------- | ------------------ | ----------- | ------------- |
| Chrome macOS    |                  |            |           |                    |             |               |
| Chrome Windows  |                  |            |           |                    |             |               |
| Safari macOS    |                  |            |           |                    |             |               |
| Safari iPhone   |                  |            |           |                    |             |               |
| Chrome Android  |                  |            |           |                    |             |               |
| Edge Windows    |                  |            |           |                    |             |               |
| Firefox desktop |                  |            |           |                    |             |               |

Fill each cell with Pass, Fail (with notes), or N/A (capability absent, verify the fallback instead).

## What each column means

- **Manual presenter:** paste a script, start, pause, resume, restart, change speed, verify remaining-time estimate. Must work everywhere with no permissions.
- **Fullscreen:** enter and exit fullscreen from the presenter, including the browser-specific button behavior.
- **Recording:** screen and camera where supported; confirm the actual saved container/codec (WebM or MP4 depending on the browser) and that no upload occurs.
- **Picture in Picture:** Document Picture in Picture where supported, otherwise the video or pop-out fallback. The pop-out is not guaranteed to stay on top.
- **Orientation:** rotate phone and tablet form factors; confirm layout, controls, and scroll behavior survive rotation.
- **Save behavior:** confirm script autosave survives refresh, TXT import works, recordings save locally, and clearing browser storage removes persisted data.

## Why this is manual
