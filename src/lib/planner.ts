/**
 * The "Plan my day" planner. Deterministic: the same input (and seed) always
 * gives the same plan. It fits to-dos into the free time between events,
 * highest priority first, longest first within a priority, each at the
 * earliest start that respects its window and the buffer around everything
 * else. `shufflePlan` finds a different plan that is still valid.
 */
import { type Minutes, overlaps, toMinutes } from '~/lib/time';

export type Priority = 'high' | 'medium' | 'low';

export type PlannerEvent = { id: string; start: Minutes; end: Minutes };
export type PlannerTodo = {
  id: string;
  minutes: number;
  priority: Priority;
  after?: Minutes;
  before?: Minutes;
};

export type PlannerInput = {
  events: PlannerEvent[];
  todos: PlannerTodo[];
  dayStart: Minutes;
  dayEnd: Minutes;
  /** Minutes kept free around events and between to-dos. */
  buffer: number;
};

export type Placement = { todoId: string; start: Minutes; end: Minutes };
export type Plan = { placements: Placement[]; unplaced: string[] };
export type Gap = { start: Minutes; end: Minutes };

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Builds planner input from the `HH:MM` strings in `src/content/sample-day.ts`. */
export function plannerInputFromDay(day: {
  events: { id: string; start: string; end: string }[];
  todos: {
    id: string;
    minutes: number;
    priority: Priority;
    after?: string;
    before?: string;
  }[];
  dayStart: string;
  dayEnd: string;
  buffer: number;
}): PlannerInput {
  return {
    events: day.events.map((e) => ({
      id: e.id,
      start: toMinutes(e.start),
      end: toMinutes(e.end)
    })),
    todos: day.todos.map((t) => ({
      id: t.id,
      minutes: t.minutes,
      priority: t.priority,
      after: t.after ? toMinutes(t.after) : undefined,
      before: t.before ? toMinutes(t.before) : undefined
    })),
    dayStart: toMinutes(day.dayStart),
    dayEnd: toMinutes(day.dayEnd),
    buffer: day.buffer
  };
}

/** Free time between `dayStart` and `dayEnd`, with `buffer` kept around each busy block. */
export function freeGaps(
  busy: { start: Minutes; end: Minutes }[],
  dayStart: Minutes,
  dayEnd: Minutes,
  buffer: number
): Gap[] {
  const blocks = busy
    .map((b) => ({ start: b.start - buffer, end: b.end + buffer }))
    .sort((a, b) => a.start - b.start);
  const gaps: Gap[] = [];
  let cursor = dayStart;
  for (const block of blocks) {
    if (block.start > cursor) gaps.push({ start: cursor, end: Math.min(block.start, dayEnd) });
    cursor = Math.max(cursor, block.end);
    if (cursor >= dayEnd) break;
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd });
  return gaps.filter((g) => g.end > g.start);
}

/** Every start where `todo` fits right at the beginning of a free gap. */
function candidateStarts(
  todo: PlannerTodo,
  input: PlannerInput,
  placed: Placement[]
): Minutes[] {
  const busy = [...input.events, ...placed];
  const lo = Math.max(input.dayStart, todo.after ?? -Infinity);
  const hi = Math.min(input.dayEnd, todo.before ?? Infinity);
  const starts: Minutes[] = [];
  for (const gap of freeGaps(busy, input.dayStart, input.dayEnd, input.buffer)) {
    const start = Math.max(gap.start, lo);
    const end = Math.min(gap.end, hi);
    if (end - start >= todo.minutes) starts.push(start);
  }
  return starts;
}

function byPriority(a: PlannerTodo, b: PlannerTodo): number {
  return (
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    b.minutes - a.minutes ||
    a.id.localeCompare(b.id)
  );
}

function sortPlacements(placements: Placement[]): Placement[] {
  return [...placements].sort((a, b) => a.start - b.start);
}

/** The canonical plan: priority first, then duration, earliest fit. */
export function planDay(input: PlannerInput): Plan {
  const placements: Placement[] = [];
  const unplaced: string[] = [];
  for (const todo of [...input.todos].sort(byPriority)) {
    const [start] = candidateStarts(todo, input, placements);
    if (start === undefined) unplaced.push(todo.id);
    else placements.push({ todoId: todo.id, start, end: start + todo.minutes });
  }
  return { placements: sortPlacements(placements), unplaced };
}

/** Small seeded PRNG (mulberry32), so a seed always gives the same plan. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A random valid plan for `seed`: to-dos still go highest priority first, but
 * each picks any gap it fits in. Backtracks so every to-do gets a slot when
 * one exists. Returns `null` if no full plan was found.
 */
export function randomPlan(input: PlannerInput, seed: number): Plan | null {
  const random = seededRandom(seed);
  // Shuffle within each priority so the order still honours priority.
  const todos = [...input.todos]
    .map((todo) => ({ todo, key: random() }))
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.todo.priority] - PRIORITY_RANK[b.todo.priority] || a.key - b.key
    )
    .map(({ todo }) => todo);

  let steps = 0;
  const place = (index: number, placed: Placement[]): Placement[] | null => {
    if (index === todos.length) return placed;
    if (++steps > 5000) return null;
    const todo = todos[index];
    const starts = candidateStarts(todo, input, placed)
      .map((start) => ({ start, key: random() }))
      .sort((a, b) => a.key - b.key);
    for (const { start } of starts) {
      const result = place(index + 1, [
        ...placed,
        { todoId: todo.id, start, end: start + todo.minutes }
      ]);
      if (result) return result;
    }
    return null;
  };

  const placements = place(0, []);
  return placements ? { placements: sortPlacements(placements), unplaced: [] } : null;
}

function samePlan(a: Plan, b: Plan): boolean {
  if (a.placements.length !== b.placements.length) return false;
  const starts = new Map(a.placements.map((p) => [p.todoId, p.start]));
  return b.placements.every((p) => starts.get(p.todoId) === p.start);
}

/** A valid plan that differs from `current`, trying seeds from `seed` upwards. */
export function shufflePlan(
  input: PlannerInput,
  current: Plan,
  seed: number
): { plan: Plan; seed: number } {
  for (let s = seed; s < seed + 200; s++) {
    const plan = randomPlan(input, s);
    if (plan && !samePlan(plan, current)) return { plan, seed: s };
  }
  return { plan: current, seed };
}

/** Checks a plan: inside the day, inside each window, no overlaps, buffer kept. */
export function isValidPlan(input: PlannerInput, plan: Plan): boolean {
  const todos = new Map(input.todos.map((t) => [t.id, t]));
  const padded = (b: { start: number; end: number }) => ({
    start: b.start - input.buffer,
    end: b.end + input.buffer
  });
  return plan.placements.every((p, i) => {
    const todo = todos.get(p.todoId);
    if (!todo || p.end - p.start !== todo.minutes) return false;
    if (p.start < input.dayStart || p.end > input.dayEnd) return false;
    if (todo.after !== undefined && p.start < todo.after) return false;
    if (todo.before !== undefined && p.end > todo.before) return false;
    if (input.events.some((e) => overlaps(p, padded(e)))) return false;
    return plan.placements.every((q, j) => i === j || !overlaps(p, padded(q)));
  });
}
