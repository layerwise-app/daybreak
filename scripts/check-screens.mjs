#!/usr/bin/env node
/**
 * Checks that the drawn app screens line up: in every device frame with an
 * hour column (iPhone, iPad, Mac), each hour label sits on its gridline, the
 * hours are evenly spaced, each of Ana's events starts at its time, and
 * Standup (9:30) is drawn between the 09 and 10 labels. Measures the real
 * page in headless Chrome at 1440, 1024, and 390 px wide.
 *
 *   pnpm check:screens http://localhost:3000
 *   pnpm check:screens http://localhost:3000 --widths=320,768,1920
 *
 * Pass the address of a running dev server or `vite preview`. Exits with 1
 * if anything is more than 1 px out.
 */
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { sampleDay } = await import(pathToFileURL(path.join(root, 'src/content/sample-day.ts')).href);

const args = process.argv.slice(2);
const base = args.find((a) => !a.startsWith('--'));
if (!base) {
  console.log('Usage: pnpm check:screens <site address> [--widths=1440,1024,390]');
  process.exit(1);
}

const widthsArg = args.find((a) => a.startsWith('--widths='));
const WIDTHS = widthsArg ? widthsArg.slice(9).split(',').map(Number) : [1440, 1024, 390];
const TOLERANCE = 1; // px
const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const startOf = new Map(sampleDay.events.map((e) => [e.id, toMinutes(e.start)]));

/** Reads every hour column on the page: hour rows, their labels, and events. */
function measure() {
  return [...document.querySelectorAll('[data-timeline]')].map((timeline) => {
    const rows = [...timeline.querySelectorAll('[data-hour]')].map((row) => {
      const label = row.querySelector('span') ?? row;
      const box = label.getBoundingClientRect();
      return {
        hour: Number(row.dataset.hour),
        text: label.textContent.trim(),
        // The row's top border is its gridline; a bare label has none.
        // Labels centre on the line; events start at its top edge.
        lineTop: label === row ? null : row.getBoundingClientRect().top,
        line:
          label === row
            ? null
            : row.getBoundingClientRect().top + parseFloat(getComputedStyle(row).borderTopWidth) / 2,
        label: box.top + box.height / 2
      };
    });
    const events = [...timeline.querySelectorAll('[data-event]')].map((el) => ({
      id: el.dataset.event,
      top: el.getBoundingClientRect().top
    }));
    const box = timeline.getBoundingClientRect();
    return {
      name: timeline.dataset.timeline,
      frame: timeline.closest('[aria-label]')?.getAttribute('aria-label') ?? '',
      size: `${Math.round(box.width)}×${Math.round(box.height)}`,
      shown: box.width > 0 && box.height > 0,
      rows,
      events
    };
  });
}

function check(timeline) {
  const problems = [];
  const rows = [...timeline.rows].sort((a, b) => a.hour - b.hour);
  // Where each hour starts: the top of its gridline if it has one, else its label.
  const at = (row) => row.lineTop ?? row.label;

  let worst = 0;
  for (const row of rows) {
    if (row.line !== null) worst = Math.max(worst, Math.abs(row.label - row.line));
    if (row.line !== null && Math.abs(row.label - row.line) > TOLERANCE) {
      problems.push(`label ${row.text} is ${(row.label - row.line).toFixed(1)} px off its gridline`);
    }
  }
  const steps = rows.slice(1).map((row, i) => at(row) - at(rows[i]));
  const hourPx = steps.reduce((a, b) => a + b, 0) / steps.length;
  if (Math.max(...steps) - Math.min(...steps) > TOLERANCE) {
    problems.push(`hours unevenly spaced (${Math.min(...steps).toFixed(1)}–${Math.max(...steps).toFixed(1)} px)`);
  }

  const y = (minutes) => {
    const hour = Math.floor(minutes / 60);
    const row = rows.find((r) => r.hour === hour);
    const next = rows.find((r) => r.hour === hour + 1);
    if (!row || !next) return null;
    return at(row) + ((minutes % 60) / 60) * (at(next) - at(row));
  };
  for (const event of timeline.events) {
    const expected = y(startOf.get(event.id));
    if (expected === null) continue;
    worst = Math.max(worst, Math.abs(event.top - expected));
    if (Math.abs(event.top - expected) > TOLERANCE) {
      problems.push(`${event.id} starts ${(event.top - expected).toFixed(1)} px from its time`);
    }
  }

  // The known case from the design review: Standup at 9:30.
  const standup = timeline.events.find((e) => e.id === 'standup');
  const nine = rows.find((r) => r.hour === 9);
  const ten = rows.find((r) => r.hour === 10);
  if (!standup || !nine || !ten) problems.push('Standup or the 09/10 labels are missing');
  else if (!(standup.top > nine.label && standup.top < ten.label)) {
    problems.push('Standup (9:30) is not between the 09 and 10 labels');
  }
  return { problems, hourPx, worst };
}

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
let failed = false;
for (const width of WIDTHS) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(new URL('/', base).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const timelines = (await page.evaluate(measure)).filter((t) => t.shown);
  if (!timelines.length) {
    failed = true;
    console.log(`✗ ${width}px: no hour columns found`);
  }
  for (const timeline of timelines) {
    const { problems, hourPx, worst } = check(timeline);
    const name = `${width}px ${timeline.name}: ${hourPx.toFixed(1)} px per hour, furthest off ${worst.toFixed(2)} px (${timeline.frame})`;
    if (problems.length) {
      failed = true;
      console.log(`✗ ${name}\n    ${problems.join('\n    ')}`);
    } else {
      console.log(`✓ ${name}`);
    }
  }
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
