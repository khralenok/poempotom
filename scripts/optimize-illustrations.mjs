import { readdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { optimize } from 'svgo';
import config from '../svgo.config.mjs';

const sources = new URL('../assets/illustrations/', import.meta.url);
const output = new URL('../public/img/', import.meta.url);
let originalBytes = 0;
let optimizedBytes = 0;
let originalGzip = 0;
let optimizedGzip = 0;

for (const name of (await readdir(sources)).filter(name => name.endsWith('.svg')).sort()) {
  const original = await readFile(new URL(name, sources), 'utf8');
  const candidate = optimize(original, { ...config, path: name }).data;
  const result = Buffer.byteLength(candidate) < Buffer.byteLength(original) ? candidate : original;
  await writeFile(new URL(name, output), result);
  originalBytes += Buffer.byteLength(original);
  optimizedBytes += Buffer.byteLength(result);
  originalGzip += gzipSync(original).length;
  optimizedGzip += gzipSync(result).length;
}

const report = (label, before, after) => console.log(
  `${label}: ${before.toLocaleString('en')} → ${after.toLocaleString('en')} bytes (${((1 - after / before) * 100).toFixed(1)}% smaller)`,
);
report('SVG', originalBytes, optimizedBytes);
report('With gzip', originalGzip, optimizedGzip);
