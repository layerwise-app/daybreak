/**
 * Moving an event in the "Drag to reschedule" tile. The dragged event takes
 * its new time; anything it now overlaps slides out of the way (later if it
 * started after the dragged event, earlier otherwise), and the result says
 * what moved so the tile can tell the visitor.
 */
import { type Minutes, clamp, overlaps } from '~/lib/time';

export type Block = { id: string; start: Minutes; end: Minutes };
export type Move = { id: string; from: Minutes; to: Minutes };

export type MoveOptions = {
  /** Earliest and latest minute any event may occupy. */
  min: Minutes;
  max: Minutes;
  /** Times snap to this many minutes. */
  step: number;
};

export function snap(minutes: Minutes, step: number): Minutes {
  return Math.round(minutes / step) * step;
}

/** Places `block` at the free start closest to `preferred`, or `null`. */
function nearestFree(
  block: Block,
  preferred: Minutes,
  fixed: Block[],
  { min, max, step }: MoveOptions,
  direction: 1 | -1
): Minutes | null {
  const length = block.end - block.start;
  const fits = (start: Minutes) =>
    start >= min &&
    start + length <= max &&
    fixed.every((f) => !overlaps({ start, end: start + length }, f));
  // Look in the preferred direction first, then the other.
  for (const dir of [direction, -direction as 1 | -1]) {
    for (let start = preferred; start >= min && start + length <= max; start += dir * step) {
      if (fits(start)) return start;
    }
  }
  return null;
}

export function moveEvent(
  blocks: Block[],
  id: string,
  requestedStart: Minutes,
  options: MoveOptions
): { blocks: Block[]; moved: Move[] } {
  const target = blocks.find((b) => b.id === id);
  if (!target) return { blocks, moved: [] };
  const length = target.end - target.start;
  const start = clamp(snap(requestedStart, options.step), options.min, options.max - length);
  const dragged: Block = { id, start, end: start + length };
  const center = start + length / 2;

  const fixed: Block[] = [dragged];
  const result = new Map<string, Block>([[id, dragged]]);
  const others = blocks
    .filter((b) => b.id !== id)
    // Settle the events nearest the dragged one first.
    .sort(
      (a, b) =>
        Math.abs(a.start + (a.end - a.start) / 2 - center) -
        Math.abs(b.start + (b.end - b.start) / 2 - center)
    );

  for (const block of others) {
    if (fixed.every((f) => !overlaps(block, f))) {
      fixed.push(block);
      result.set(block.id, block);
      continue;
    }
    const direction = block.start + (block.end - block.start) / 2 >= center ? 1 : -1;
    const preferred =
      direction === 1
        ? Math.max(block.start, dragged.end)
        : Math.min(block.start, dragged.start - (block.end - block.start));
    const free = nearestFree(block, snap(preferred, options.step), fixed, options, direction);
    const placed = free === null ? block : { ...block, start: free, end: free + (block.end - block.start) };
    fixed.push(placed);
    result.set(block.id, placed);
  }

  const next = blocks.map((b) => result.get(b.id) ?? b);
  const moved = next
    .filter((b) => b.id !== id)
    .map((b) => ({ id: b.id, from: blocks.find((o) => o.id === b.id)!.start, to: b.start }))
    .filter((m) => m.from !== m.to);
  return { blocks: next, moved };
}
