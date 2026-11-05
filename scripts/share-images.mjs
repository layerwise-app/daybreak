#!/usr/bin/env node
/**
 * Renders a 1200×630 share image for each page into `public/og/`, in the
 * site's style, with headless Chrome (Playwright, `channel: 'chrome'`).
 *
 *   pnpm share-images
 *
 * Titles come from `PAGES` below; colors, fonts, and Ana's day come from
 * `src/site.config.ts` and `src/content/sample-day.ts`. Run it again after
 * changing a page title or the palette.
 */
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { siteConfig } = await import(pathToFileURL(path.join(root, 'src/site.config.ts')).href);
const { sampleDay } = await import(pathToFileURL(path.join(root, 'src/content/sample-day.ts')).href);
const { home } = await import(pathToFileURL(path.join(root, 'src/content/home.ts')).href);

/** One image per page: `file` is written to `public/og/`. */
const PAGES = [
  { file: 'home.png', eyebrow: home.hero.eyebrow, title: home.hero.headline, phone: 'day' },
  { file: 'privacy.png', eyebrow: 'Privacy', title: 'Your day is yours.', phone: 'day' },
  { file: 'terms.png', eyebrow: 'Terms', title: 'The fine print, kept short.', phone: 'day' },
  { file: '404.png', eyebrow: '404', title: 'Nothing planned here.', phone: 'empty' }
];

const c = siteConfig.colors;
const font = async (file) =>
  `data:font/woff2;base64,${(await readFile(path.join(root, 'node_modules/@fontsource-variable', file))).toString('base64')}`;
const sans = await font('bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2');
const numerals = await font('nunito/files/nunito-latin-wght-normal.woff2');
const logo = await readFile(path.join(root, 'public/logo.svg'), 'utf8').catch(() => '');

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const KIND = {
  work: ['#e2f0fb', '#3d9ad8', '#154566'],
  social: ['#ffe7d9', '#f07f4f', '#78310f'],
  health: ['#fff0c4', '#e2a91a', '#654600'],
  focus: ['#efebe4', '#1c1a17', '#1c1a17']
};
const START = 8.5 * 60;
const HOUR = 46;
const y = (m) => ((m - START) / 60) * HOUR;

function phone(kind) {
  const events =
    kind === 'empty'
      ? ''
      : sampleDay.events
          .map((e) => {
            const [bg, bar, fg] = KIND[e.kind];
            const top = y(toMin(e.start));
            const h = Math.max(22, ((toMin(e.end) - toMin(e.start)) / 60) * HOUR);
            return `<div class="ev" style="top:${top}px;height:${h}px;background:${bg};color:${fg};--bar:${bar}"><b>${e.title}</b><span>${e.start.replace(/^0/, '')}</span></div>`;
          })
          .join('');
  const hours = Array.from({ length: 12 }, (_, i) => `<div class="hr" style="top:${y((9 + i) * 60)}px"><span>${String(9 + i).padStart(2, '0')}</span></div>`).join('');
  const body =
    kind === 'empty'
      ? `<div class="empty"><div class="sun"></div><b>Nothing on today</b><span>Not even this page.</span></div>`
      : `<div class="tl">${hours}${events}<div class="now" style="top:${y(toMin('10:48'))}px"><i>10:48</i></div></div>`;
  return `<div class="phone"><div class="screen"><div class="island"></div><div class="status">10:48</div><div class="head"><b>${sampleDay.weekday}</b><span>${sampleDay.dateLabel}</span></div>${body}</div></div>`;
}

function html(page) {
  return `<!doctype html><html><head><style>
@font-face{font-family:Sans;src:url(${sans}) format('woff2');font-weight:200 800}
@font-face{font-family:Num;src:url(${numerals}) format('woff2');font-weight:200 1000}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;background:${c.paper};font-family:Sans;color:${c.ink};font-optical-sizing:auto}
.wrap{display:grid;grid-template-columns:640px 1fr;height:100%;padding:56px 56px 0 72px;gap:24px}
.brand{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:650;letter-spacing:-.03em}
.brand svg{width:48px;height:48px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;margin-top:92px;padding:8px 16px;border-radius:99px;background:#fff;box-shadow:0 0 0 1px rgb(28 26 23/.06);font-size:20px;font-weight:600;color:${c.inkSoft}}
.eyebrow i{width:10px;height:10px;border-radius:50%;background:${c.coral}}
h1{margin-top:26px;font-size:76px;line-height:.98;font-weight:650;letter-spacing:-.04em;text-wrap:balance}
.foot{position:absolute;left:72px;bottom:48px;font-size:20px;font-weight:500;color:${c.inkMuted}}
.sky{position:relative;margin-bottom:-40px;border-radius:40px 40px 0 0;overflow:hidden;background:linear-gradient(180deg,#a6d3f3 0%,#cde6f7 55%,#fff0d6 100%)}
.phone{position:absolute;left:50%;top:44px;width:300px;height:640px;margin-left:-150px;padding:8px;border-radius:50px;background:linear-gradient(150deg,#3a3732,#1c1a17 40%,#2a2825);box-shadow:0 30px 60px -24px rgb(28 26 23/.45)}
.screen{position:relative;height:100%;border-radius:42px;overflow:hidden;background:#fffdf9}
.island{position:absolute;top:10px;left:50%;width:94px;height:28px;margin-left:-47px;border-radius:16px;background:#0b0a09}
.status{padding:14px 0 0 30px;font-family:Num;font-weight:800;font-size:15px}
.head{padding:26px 20px 0}.head b{display:block;font-size:28px;letter-spacing:-.035em}.head span{font-size:13px;color:${c.inkMuted}}
.tl{position:absolute;inset:118px 0 0}
.hr{position:absolute;left:0;right:0;border-top:1px solid rgb(28 26 23/.07)}.hr span{position:absolute;left:14px;top:-0.5px;transform:translateY(-50%);line-height:1;background:#fffdf9;padding-right:4px;font-family:Num;font-weight:700;font-size:10px;color:#9a9287}
.ev{position:absolute;left:46px;right:12px;display:flex;justify-content:space-between;gap:6px;padding:4px 8px 4px 12px;border-radius:9px;font-size:12px;overflow:hidden}
.ev::before{content:'';position:absolute;left:5px;top:4px;bottom:4px;width:3px;border-radius:3px;background:var(--bar)}
.ev b{font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ev span{font-family:Num;font-weight:700;opacity:.8}
.now{position:absolute;left:40px;right:6px;border-top:2px solid #e4502a}
.now i{position:absolute;left:-36px;top:-9px;padding:1px 5px;border-radius:6px;background:#e4502a;color:#fff;font:800 10px Num}
.empty{position:absolute;inset:130px 20px 0;display:grid;place-content:center;justify-items:center;gap:6px;padding-bottom:120px}
.empty b{font-size:17px}.empty span{font-size:13px;color:${c.inkMuted}}
.sun{width:64px;height:32px;margin-bottom:12px;border-radius:64px 64px 0 0;background:${c.butter};box-shadow:0 2px 0 0 rgb(28 26 23/.3)}
</style></head><body><div class="wrap"><div>
<div class="brand">${logo}<span>${siteConfig.product}</span></div>
<div class="eyebrow"><i></i>${page.eyebrow}</div>
<h1>${page.title}</h1>
<div class="foot">${siteConfig.platforms.join(' · ')} · ${siteConfig.launch}</div>
</div><div class="sky">${phone(page.phone)}</div></div></body></html>`;
}

const outDir = path.join(root, 'public', 'og');
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const pageHandle = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const page of PAGES) {
  await pageHandle.setContent(html(page), { waitUntil: 'load' });
  await pageHandle.evaluate(() => document.fonts.ready);
  await pageHandle.screenshot({ path: path.join(outDir, page.file), type: 'png' });
  console.log(`✓ public/og/${page.file}`);
}
await browser.close();
