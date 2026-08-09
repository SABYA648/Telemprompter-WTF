import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const revision = 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7';
const repository = 'onnx-community/whisper-tiny';
const modelDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../public/models/whisper-tiny-v1',
);
const files = [
  ['added_tokens.json', 34604, '9715fd2243b6f06a5858b5e32950d2853f73dd5bc201aafcf76f5082a2d8acd1'],
  ['config.json', 2243, '46aeea0a406afbeb563fc8e59ca10609203df4299af6a83f73752fef369efd2d'],
  [
    'generation_config.json',
    3772,
    'f5c67e5a4f7102f8cb4d058bc95da276bbc19eeec997267c3bb0f25ef68facd1',
  ],
  ['merges.txt', 493869, '2df2990a395e35e8dfbc7511e08c12d56018d8d04691e0133e5d63b21e154dc6'],
  ['normalizer.json', 52666, 'bf1c507dc8724ca9cf9903640dacfb69dae2f00edee4f21ceba106a7392f26dd'],
  [
    'preprocessor_config.json',
    339,
    'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d',
  ],
  [
    'special_tokens_map.json',
    2194,
    'e67ae3a0aaa99abcd9f187138e12db1f65c16a14761c50ef10eef2c174a7a691',
  ],
  ['tokenizer.json', 2480466, '27fc476bfe7f17299480be2273fc0608e4d5a99aba2ab5dec5374b4482d1a566'],
  [
    'tokenizer_config.json',
    282683,
    '2a4c4281cf9f51ac6ccc406fdc711a087afe6530f671fa7b80953edc498275ce',
  ],
  ['vocab.json', 1036584, '50d6a919f0a0601d56a04eb583c780d18553aa388254ba3158eb6a00f13e2c1a'],
  [
    'onnx/encoder_model_quantized.onnx',
    10124990,
    '2af4a414ca47aa30f61246017e5fe82b0a8d229281d1255ba666a2a7f6b84d19',
  ],
  [
    'onnx/decoder_model_merged_quantized.onnx',
    30719241,
    '25e807a962b6349356d0ea5d0dfe530b7e5bf0e2a484aeca0359d03143faddd3',
  ],
];

const checksum = async (path) =>
  createHash('sha256')
    .update(await readFile(path))
    .digest('hex');

for (const [file, size, expectedChecksum] of files) {
  const destination = resolve(modelDirectory, file);
  try {
    const existing = await stat(destination);
    if (existing.size === size && (await checksum(destination)) === expectedChecksum) continue;
  } catch {
    // Download below.
  }
  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.download`;
  const url = `https://huggingface.co/${repository}/resolve/${revision}/${file}`;
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Model download failed for ${file}: ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length !== size) throw new Error(`Unexpected size for ${file}`);
  const actualChecksum = createHash('sha256').update(data).digest('hex');
  if (actualChecksum !== expectedChecksum) throw new Error(`Checksum mismatch for ${file}`);
  await writeFile(temporary, data);
  await rm(destination, { force: true });
  await rename(temporary, destination);
}

await writeFile(
  resolve(modelDirectory, 'model-info.json'),
  `${JSON.stringify(
    {
      id: 'whisper-tiny-v1',
      source: `https://huggingface.co/${repository}/tree/${revision}`,
      revision,
      files: files.map(([file, size, sha256]) => ({ file, size, sha256 })),
      totalBytes: files.reduce((total, [, size]) => total + size, 0),
    },
    null,
    2,
  )}\n`,
);

console.log(`Verified ${files.length} model files in ${modelDirectory}`);
