import { describe, expect, it } from 'vitest';
import { moveEvent } from '~/lib/reschedule';
import { overlaps } from '~/lib/time';

const options = { min: 9 * 60, max: 15 * 60, step: 15 };
const blocks = [
  { id: 'standup', start: 570, end: 585 },
  { id: 'review', start: 660, end: 720 },
  { id: 'lunch', start: 750, end: 810 }
];

function noOverlaps(list: typeof blocks) {
  return list.every((a, i) => list.every((b, j) => i === j || !overlaps(a, b)));
}

describe('moveEvent', () => {
  it('moves without touching anything when the time is free', () => {
    const { blocks: next, moved } = moveEvent(blocks, 'standup', 600, options);
    expect(next.find((b) => b.id === 'standup')).toMatchObject({ start: 600, end: 615 });
    expect(moved).toEqual([]);
  });

  it('slides an overlapped event later and says so', () => {
    const { blocks: next, moved } = moveEvent(blocks, 'review', 720, options);
    expect(next.find((b) => b.id === 'review')).toMatchObject({ start: 720, end: 780 });
    expect(moved).toEqual([{ id: 'lunch', from: 750, to: 780 }]);
    expect(noOverlaps(next)).toBe(true);
  });

  it('slides an event earlier when it sits before the dragged one', () => {
    const { blocks: next, moved } = moveEvent(blocks, 'lunch', 690, options);
    expect(moved.find((m) => m.id === 'review')?.to).toBeLessThan(660);
    expect(noOverlaps(next)).toBe(true);
  });

  it('snaps and clamps to the visible hours', () => {
    const { blocks: next } = moveEvent(blocks, 'lunch', 2000, options);
    expect(next.find((b) => b.id === 'lunch')).toMatchObject({ start: 840, end: 900 });
    expect(moveEvent(blocks, 'standup', 577, options).blocks[0].start).toBe(570);
  });

  it('never leaves overlaps, wherever an event is dropped', () => {
    for (const id of ['standup', 'review', 'lunch']) {
      for (let start = 540; start <= 900; start += 15) {
        expect(noOverlaps(moveEvent(blocks, id, start, options).blocks)).toBe(true);
      }
    }
  });
});
