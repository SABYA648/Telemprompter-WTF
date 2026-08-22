import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = resolve(root, 'public/illustrations/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const failures = [];
const ids = new Set();
const paths = new Set();

function dimensions(buffer, path) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${path}: expected PNG or WebP`);
  }

  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    const payload = 20;
    if (!buffer.subarray(payload + 3, payload + 6).equals(Buffer.from([157, 1, 42]))) {
      throw new Error(`${path}: invalid VP8 frame header`);
    }
    return {
      width: buffer.readUInt16LE(payload + 6) & 0x3fff,
      height: buffer.readUInt16LE(payload + 8) & 0x3fff,
    };
  }
  if (chunk === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  throw new Error(`${path}: unsupported WebP chunk ${chunk}`);
}

function fail(condition, message) {
  if (condition) failures.push(message);
}

for (const asset of manifest.assets ?? []) {
  fail(ids.has(asset.id), `${asset.id}: duplicate id`);
  fail(paths.has(asset.path), `${asset.id}: duplicate public path`);
  ids.add(asset.id);
  paths.add(asset.path);

  const publicFile = resolve(root, 'public', asset.path.replace(/^\//, ''));
  const masterFile = resolve(root, asset.master);
  try {
    const [publicBuffer, publicStats, masterBuffer] = await Promise.all([
      readFile(publicFile),
      stat(publicFile),
      readFile(masterFile),
    ]);
    const actualHash = createHash('sha256').update(publicBuffer).digest('hex');
    const publicDimensions = dimensions(publicBuffer, asset.path);
    const masterDimensions = dimensions(masterBuffer, asset.master);

    fail(
      publicStats.size !== asset.bytes,
      `${asset.id}: expected ${asset.bytes} bytes, got ${publicStats.size}`,
    );
    fail(actualHash !== asset.sha256, `${asset.id}: SHA-256 mismatch`);
    fail(
      publicDimensions.width !== asset.width || publicDimensions.height !== asset.height,
      `${asset.id}: expected ${asset.width}x${asset.height}, got ${publicDimensions.width}x${publicDimensions.height}`,
    );
    fail(publicStats.size > 100_000, `${asset.id}: public derivative exceeds 100 KB`);
    fail(
      masterDimensions.width < asset.width || masterDimensions.height < asset.height,
      `${asset.id}: master is smaller than derivative`,
    );
    fail(asset.master.startsWith('public/'), `${asset.id}: master must not ship from public`);
    fail(!asset.decorative && !asset.alt, `${asset.id}: meaningful image needs alt text`);
    fail(asset.decorative && asset.alt, `${asset.id}: decorative image must have empty alt text`);
  } catch (error) {
    failures.push(`${asset.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

fail(ids.size !== 9, `expected 9 assets, found ${ids.size}`);
fail(!ids.has('teleprompter-hero'), 'missing homepage hero');
fail(!ids.has('lost-script-404'), 'missing useful 404 scene');
fail(!ids.has('teleprompter-og'), 'missing social-sharing image');

if (failures.length) {
  console.error(
    `Illustration verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
  );
  process.exit(1);
}

console.log(`Illustration verification passed for ${ids.size} assets.`);
