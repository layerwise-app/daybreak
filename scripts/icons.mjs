#!/usr/bin/env node
/**
 * Regenerates the logo PNG and every favicon from `public/logo.svg`.
 *
 *   pnpm icons
 *
 * Writes public/logo.png (1024×1024), favicon.ico (16, 32, 48),
 * favicon-16x16.png, favicon-32x32.png, favicon.png, apple-touch-icon.png
 * (180, on a solid background), and android-chrome-192x192.png and
 * android-chrome-512x512.png. A new project made from this template uses
 * android-chrome-512x512.png as its avatar.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (file) => path.join(root, 'public', file);
const svg = await readFile(pub('logo.svg'));
// The logo's background colour fills the corners of the Apple touch icon.
const background = /<rect[^>]*fill="(#[0-9a-f]{3,8})"/i.exec(svg.toString())?.[1] ?? '#000000';

const png = (size) => sharp(svg, { density: Math.max(72, (size / 64) * 72 * 2) }).resize(size, size).png();

await png(1024).toFile(pub('logo.png'));
await png(16).toFile(pub('favicon-16x16.png'));
await png(32).toFile(pub('favicon-32x32.png'));
await png(512).toFile(pub('favicon.png'));
await png(192).toFile(pub('android-chrome-192x192.png'));
await png(512).toFile(pub('android-chrome-512x512.png'));
await sharp({ create: { width: 180, height: 180, channels: 4, background } })
  .composite([{ input: await png(180).toBuffer() }])
  .png()
  .toFile(pub('apple-touch-icon.png'));

// favicon.ico holding 16, 32, and 48 px PNGs.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(s).toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + i * 16;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile(pub('favicon.ico'), Buffer.concat([header, ...images]));
console.log('✓ logo.png and favicons written to public/');
