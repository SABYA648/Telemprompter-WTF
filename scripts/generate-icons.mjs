import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));
const background = '#090a09';
const output = (name) => new URL(`../public/icons/${name}.png`, import.meta.url).pathname;
for (const size of [192, 512]) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(output(`icon-${size}`));
}
// 20% safe padding on each side, so the mark survives every launcher mask.
const inset = Math.round(512 * 0.2);
const mark = await sharp(svg)
  .resize(512 - inset * 2, 512 - inset * 2)
  .png()
  .toBuffer();
const maskable = await sharp({ create: { width: 512, height: 512, channels: 3, background } })
  .composite([{ input: mark, left: inset, top: inset }])
  .png()
  .toBuffer();
await sharp(maskable).removeAlpha().png().toFile(output('maskable-512'));
// iOS paints transparent pixels black, so the touch icon must have no alpha channel.
await sharp(svg)
  .resize(180, 180)
  .flatten({ background })
  .removeAlpha()
  .png()
  .toFile(output('apple-touch-icon'));
