import { readdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(root, process.env.TELEPROMPTER_OUT_DIR || 'dist');
const runtime = resolve(outputDirectory, 'models/runtime/ort-wasm-simd-threaded.jsep.wasm');

if ((await stat(runtime)).size !== 21_596_019) {
  throw new Error('The verified standalone ONNX runtime is missing from the build');
}

const assetDirectory = resolve(outputDirectory, '_astro');
const duplicateNames = (await readdir(assetDirectory)).filter((name) =>
  /^ort-wasm.*\.wasm$/.test(name),
);
for (const name of duplicateNames) await rm(resolve(assetDirectory, name));

console.log(`Removed ${duplicateNames.length} duplicate ONNX runtime asset(s)`);
