# Teleprompter.wtf illustration generation notes

Generated on 2026-08-23 with OpenAI's built-in image-generation workflow. The homepage hero was generated first and used only as the visual style reference for the other eight original scenes. No external, branded, or copyrighted image was used as an input.

## Shared direction

- Premium 2D editorial illustration rather than photorealism or generic 3D SaaS art.
- Crisp geometric silhouettes, gentle paper-cut depth, subtle grain, restrained gradients, and a crop-safe organic frame.
- Existing Teleprompter.wtf cream `#f4efe5`, ink `#171713`, and coral `#e4492e`, supported by deep indigo, periwinkle, pale blue, and amber.
- Calm twilight studio lighting with an approachable, privacy-conscious product mood.
- No readable text, numbers, logo, watermark, branded device, celebrity, fake browser UI, or copied composition.
- Blank script ribbons and abstract line marks communicate prompting without baking page copy into raster assets.

## Scene prompts

1. **teleprompter-hero** - A recognizable camera and physical teleprompter glass receive flowing blank script ribbons through a luminous reading portal; balanced for a split homepage hero.
2. **lost-script-404** - One blank script card drifts away from the cue path while a ready teleprompter and warm stage light make the missing-page state useful rather than alarming.
3. **video-creator** - A creator presents to a camera-mounted teleprompter with abstract section-by-section edit tiles in a compact studio.
4. **speech-stage** - A speaker at a lectern uses twin teleprompter glass panels in front of a softly suggested audience.
5. **remote-meeting** - A speaker reads from a narrow camera-adjacent column during a generic remote meeting with unlabeled participant tiles.
6. **mobile-teleprompter** - An unbranded phone is securely mounted near a small camera while a speaker maintains natural eye contact.
7. **mirrored-glass** - A label-free educational view shows a tablet reflecting blank script lines through 45-degree beam-splitter glass toward a speaker while the camera sees through it.
8. **script-pacing** - Short and long blank script cards follow a curved timing path with glowing beats and breathing gaps into the focus window.
9. **teleprompter-og** - A bold extra-wide social composition combines speaker, flowing blank script, teleprompter glass, and camera lens inside a 1200x630-safe area.

## Deterministic exports

PNG masters are retained in `design/illustrations/masters`. Public WebP derivatives were stripped, converted to sRGB, resized with centre crop where required, and encoded with ImageMagick WebP method 6 at quality 80–82. Dimensions, byte counts, SHA-256 hashes, alt text, loading policy, and page mapping live in `public/illustrations/manifest.json`.
