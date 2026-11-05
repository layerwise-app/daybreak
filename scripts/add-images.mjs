#!/usr/bin/env node
/**
 * Prepares images for the site.
 *
 *   pnpm add-images path/to/photo.png [more files…] [--name my-name]
 *
 * For each source image it writes 800, 1600, and 2880 px wide WebP versions
 * to `public/images/`, and records the dimensions and a tiny blurred
 * placeholder in `src/content/images.json` under the file's name (or
 * `--name`). GIFs are copied untouched. SVG files are rejected.
 * Images are never enlarged: a smaller source keeps its own width.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'images');
const manifestPath = path.join(root, 'src', 'content', 'images.json');
const WIDTHS = [800, 1600, 2880];
const ACCEPTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.gif', '.heic', '.heif']);

function slug(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function parseArgs(argv) {
  const files = [];
  let name;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--name') name = argv[++i];
    else if (argv[i].startsWith('--name=')) name = argv[i].slice(7);
    else files.push(argv[i]);
  }
  if (name && files.length > 1) throw new Error('--name works with one file at a time.');
  return { files, name };
}

async function blurPlaceholder(input) {
  const buffer = await sharp(input, { animated: false })
    .resize(16, 16, { fit: 'inside' })
    .blur(1.2)
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function processFile(file, forcedName) {
  const source = path.resolve(file);
  const ext = path.extname(source).toLowerCase();
  if (ext === '.svg') {
    throw new Error(`${file}: SVG isn’t supported. Export it as PNG first, or put it in public/ and use it directly.`);
  }
  if (!ACCEPTED.has(ext)) throw new Error(`${file}: unsupported file type "${ext}".`);

  const name = slug(forcedName ?? path.basename(source, ext));
  if (!name) throw new Error(`${file}: couldn’t make a name from the file name; pass --name.`);
  const meta = await sharp(source).metadata();
  if (meta.format === 'svg') throw new Error(`${file}: SVG isn’t supported.`);
  const blur = await blurPlaceholder(source);

  if (ext === '.gif') {
    // GIFs stay exactly as they are, animation included.
    const target = `${name}.gif`;
    await copyFile(source, path.join(outDir, target));
    const width = meta.width;
    const height = meta.pageHeight ?? meta.height;
    return [name, { src: `/images/${target}`, width, height, blur, srcset: [{ src: `/images/${target}`, width }] }];
  }

  // 800, 1600, and 2880 px wide; a narrower source stops at its own width.
  const sourceWidth = meta.autoOrient?.width ?? meta.width;
  const widths = WIDTHS.filter((w) => w < sourceWidth);
  if (widths.length < WIDTHS.length) widths.push(sourceWidth);
  const srcset = [];
  let height;
  for (const w of widths) {
    const target = `${name}-${w}.webp`;
    const info = await sharp(source)
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(outDir, target));
    srcset.push({ src: `/images/${target}`, width: info.width });
    height = info.height;
  }
  const largest = srcset.at(-1);
  return [name, { src: largest.src, width: largest.width, height, blur, srcset }];
}

async function main() {
  const { files, name } = parseArgs(process.argv.slice(2));
  if (!files.length) {
    console.log('Usage: pnpm add-images <image> [more images…] [--name name]');
    process.exit(1);
  }
  await mkdir(outDir, { recursive: true });
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
  let failed = false;
  for (const file of files) {
    try {
      const [key, entry] = await processFile(file, name);
      manifest[key] = entry;
      console.log(`✓ ${file} → "${key}" (${entry.width}×${entry.height}, ${entry.srcset.length} file${entry.srcset.length > 1 ? 's' : ''})`);
    } catch (error) {
      failed = true;
      console.error(`✗ ${error.message}`);
    }
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`);
  if (failed) process.exit(1);
}

await main();
