// news-image-20261125 entry (Node 22, standard library only).
// The front page is the entry.png beside this file; the program copies
// it to /output/entry.png, byte for byte, so both grader runs agree.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const dest = join(outDir, 'entry.png');
const src = new URL('./entry.png', import.meta.url);
const srcBytes = statSync(src).size;

// The entry is a PNG: refuse to ship anything else if the file ever
// gets replaced by mistake (the gate tells PNG and JPEG apart by
// their first bytes).
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!readFileSync(src).subarray(0, 8).equals(PNG_MAGIC)) {
  throw new Error('entry.png is not a PNG file');
}

// The bounty requires a 1024x1024 front page: parse the IHDR chunk
// (length, type, width, height) and refuse anything of a different size.
const ihdr = readFileSync(src).subarray(8, 33);
if (ihdr.length < 25 || ihdr.subarray(4, 8).toString('latin1') !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk');
}
const width = ihdr.readUInt32BE(8);
const height = ihdr.readUInt32BE(12);
if (width !== 1024 || height !== 1024) {
  throw new Error(`entry.png is ${width}x${height}, expected 1024x1024`);
}
copyFileSync(src, dest);

// Read the copy back and compare it byte for byte with the source, so
// a truncated or corrupted write is caught here instead of shipping a
// different image to one of the two grader runs.
const srcData = readFileSync(src);
const destData = readFileSync(dest);
if (!destData.equals(srcData)) {
  throw new Error('copied entry.png differs from the source');
}

// The gate takes at most 1 MiB: fail loudly instead of shipping a
// too-large image.
const bytes = statSync(dest).size;
if (bytes !== srcBytes) {
  throw new Error(`copied ${bytes} bytes but source is ${srcBytes}`);
}
if (bytes > 1048576) {
  throw new Error(`entry.png is ${bytes} bytes, over the 1 MiB limit`);
}
console.log(`wrote ${dest} (${bytes} bytes)`);
