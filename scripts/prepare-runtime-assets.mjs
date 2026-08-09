import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(root, 'node_modules/onnxruntime-web/dist');
const destinationDirectory = resolve(root, 'public/models/runtime');
const files = [
  {
    name: 'ort-wasm-simd-threaded.jsep.mjs',
    size: 44484,
    sha256: '08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9',
  },
  {
    name: 'ort-wasm-simd-threaded.jsep.wasm',
    size: 21596019,
    sha256: 'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
  },
];

await mkdir(destinationDirectory, { recursive: true });
for (const staleFile of [
  'transformers.web.min.js',
  'ort-wasm-simd-threaded.asyncify.mjs',
  'ort-wasm-simd-threaded.asyncify.wasm',
]) {
  await rm(resolve(destinationDirectory, staleFile), { force: true });
}
for (const file of files) {
  const source = resolve(sourceDirectory, file.name);
  if ((await stat(source)).size !== file.size)
    throw new Error(`Unexpected runtime size for ${file.name}`);
  if (
    createHash('sha256')
      .update(await readFile(source))
      .digest('hex') !== file.sha256
  ) {
    throw new Error(`Runtime checksum mismatch for ${file.name}`);
  }
  await copyFile(source, resolve(destinationDirectory, file.name));
}

console.log(`Verified ${files.length} browser runtime files in ${destinationDirectory}`);
