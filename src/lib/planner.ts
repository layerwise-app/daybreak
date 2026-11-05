/**
 * The "Plan my day" planner. Deterministic and rule-based: the same input (and
 * seed) always gives the same plan.
 *
 * Every plan follows the same rules, which `planProblems` checks:
 * - each to-do sits in free time, with `buffer` minutes kept around events and
 *   between to-dos, and inside its own window (`after`, `before`);
 * - work to-dos start and finish inside work hours; personal ones may also use
 *   the evening, and nothing starts after `lastStart`;
 * - every high-priority to-do comes before every medium or low one.
 *
 * `planDay` gives the canonical plan: highest priority first, longest first
 * within a priority, each at its earliest fit. `allPlans` lists every plan the
 * rules allow (to-dos packed from the start of the free gap they take), and
 * `shufflePlan` picks one of them that looks different from the current plan.
 */
import { type Minutes, overlaps, toMinutes } from '~/lib/time';

export type Priority = 'high' | 'medium' | 'low';
/** Work stays inside work hours; personal to-dos may also use the evening. */
export type TodoKind = 'work' | 'personal';

export type PlannerEvent = { id: string; start: Minutes; end: Minutes };
export type PlannerTodo = {
  id: string;
  minutes: number;
  priority: Priority;
  kind: TodoKind;
  after?: Minutes;
  before?: Minutes;
};

export type PlannerInput = {
  events: PlannerEvent[];
  todos: PlannerTodo[];
  dayStart: Minutes;
  dayEnd: Minutes;
  /** Work to-dos start and finish inside these hours. */
  workStart: Minutes;
  workEnd: Minutes;
  /** No to-do starts later than this. */
  lastStart: Minutes;
  /** Minutes kept free around events and between to-dos. */
  buffer: number;
};

export type Placement = { todoId: string; start: Minutes; end: Minutes };
export type Plan = { placements: Placement[]; unplaced: string[] };
export type Gap = { start: Minutes; end: Minutes };

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Builds planner input from the `HH:MM` strings in `src/content/sample-day.ts`. */
export function plannerInputFromDay(day: {
  events: { id: string; start: string; end: string }[];
  todos: {
    id: string;
    minutes: number;
    priority: Priority;
    kind: TodoKind;
    after?: string;
    before?: string;
  }[];
  dayStart: string;
  dayEnd: string;
  workHours: { start: string; end: string };
  lastStart: string;
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
      kind: t.kind,
      after: t.after ? toMinutes(t.after) : undefined,
      before: t.before ? toMinutes(t.before) : undefined
    })),
    dayStart: toMinutes(day.dayStart),
    dayEnd: toMinutes(day.dayEnd),
    workStart: toMinutes(day.workHours.start),
    workEnd: toMinutes(day.workHours.end),
    lastStart: toMinutes(day.lastStart),
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

/** The free gaps between events: the slots a to-do can take. */
export function eventGaps(input: PlannerInput): Gap[] {
  return freeGaps(input.events, input.dayStart, input.dayEnd, input.buffer);
}

/** The earliest and latest start the rules allow for `todo`, ignoring other to-dos. */
export function startWindow(
  todo: PlannerTodo,
  input: PlannerInput
): { earliest: Minutes; latest: Minutes } {
  const work = todo.kind === 'work';
  const earliest = Math.max(
    input.dayStart,
    todo.after ?? -Infinity,
    work ? input.workStart : -Infinity
  );
  const finishBy = Math.min(input.dayEnd, todo.before ?? Infinity, work ? input.workEnd : Infinity);
  return { earliest, latest: Math.min(input.lastStart, finishBy - todo.minutes) };
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

/** Medium and low to-dos start after every high one, with the buffer kept. */
function afterHighs(input: PlannerInput, placed: Placement[]): Minutes {
  const high = new Set(input.todos.filter((t) => t.priority === 'high').map((t) => t.id));
  return Math.max(
    -Infinity,
    ...placed.filter((p) => high.has(p.todoId)).map((p) => p.end + input.buffer)
  );
}

/** The canonical plan: priority first, then duration, each at its earliest fit. */
export function planDay(input: PlannerInput): Plan {
  const placements: Placement[] = [];
  const unplaced: string[] = [];
  for (const todo of [...input.todos].sort(byPriority)) {
    const window = startWindow(todo, input);
    const floor = todo.priority === 'high' ? -Infinity : afterHighs(input, placements);
    const busy = [...input.events, ...placements];
    const gap = freeGaps(busy, input.dayStart, input.dayEnd, input.buffer).find((g) => {
      const start = Math.max(g.start, window.earliest, floor);
      return start <= window.latest && start + todo.minutes <= g.end;
    });
    if (!gap) {
      unplaced.push(todo.id);
      continue;
    }
    const start = Math.max(gap.start, window.earliest, floor);
    placements.push({ todoId: todo.id, start, end: start + todo.minutes });
  }
  return { placements: sortPlacements(placements), unplaced };
}

/**
 * Places `sequence` in `gap` in order, each to-do at its earliest allowed
 * start after the one before. `null` if one doesn't fit.
 */
function packGap(gap: Gap, sequence: PlannerTodo[], input: PlannerInput): Placement[] | null {
  const placements: Placement[] = [];
  let cursor = gap.start;
  for (const todo of sequence) {
    const window = startWindow(todo, input);
    const start = Math.max(cursor, window.earliest);
    const end = start + todo.minutes;
    if (start > window.latest || end > gap.end) return null;
    placements.push({ todoId: todo.id, start, end });
    cursor = end + input.buffer;
  }
  return placements;
}

const planCache = new WeakMap<PlannerInput, Plan[]>();

/**
 * Every plan the rules allow, with all to-dos placed: each to-do takes a free
 * gap and a turn within it, and is packed from the start of the gap. The order
 * is deterministic. Results are cached per input object.
 */
export function allPlans(input: PlannerInput): Plan[] {
  const cached = planCache.get(input);
  if (cached) return cached;

  const gaps = eventGaps(input);
  const todos = [...input.todos].sort(byPriority);
  const sequences: PlannerTodo[][] = gaps.map(() => []);
  const plans: Plan[] = [];

  // Where the latest high-priority to-do sits, so others go after it.
  const lastHigh = () => {
    for (let g = gaps.length - 1; g >= 0; g--) {
      for (let i = sequences[g].length - 1; i >= 0; i--) {
        if (sequences[g][i].priority === 'high') return { gap: g, index: i };
      }
    }
    return { gap: -1, index: -1 };
  };

  const visit = (next: number) => {
    if (next === todos.length) {
      const placements = gaps.flatMap((gap, g) => packGap(gap, sequences[g], input) ?? []);
      const plan = { placements: sortPlacements(placements), unplaced: [] };
      if (planProblems(input, plan).length === 0) plans.push(plan);
      return;
    }
    const todo = todos[next];
    const high = todo.priority === 'high' ? { gap: -1, index: -1 } : lastHigh();
    for (let g = Math.max(0, high.gap); g < gaps.length; g++) {
      const sequence = sequences[g];
      const first = g === high.gap ? high.index + 1 : 0;
      for (let at = first; at <= sequence.length; at++) {
        sequence.splice(at, 0, todo);
        if (packGap(gaps[g], sequence, input)) visit(next + 1);
        sequence.splice(at, 1);
      }
    }
  };

  visit(0);
  planCache.set(input, plans);
  return plans;
}

/**
 * What a visitor can see change between two plans: which free gap each to-do
 * takes, and the order of to-dos within each priority.
 */
function planShape(input: PlannerInput, plan: Plan) {
  const gaps = eventGaps(input);
  const priority = new Map(input.todos.map((t) => [t.id, t.priority]));
  const sorted = sortPlacements(plan.placements);
  return {
    gapOf: new Map(
      sorted.map((p) => [p.todoId, gaps.findIndex((g) => p.start >= g.start && p.end <= g.end)])
    ),
    order: PRIORITIES.map((level) =>
      sorted
        .filter((p) => priority.get(p.todoId) === level)
        .map((p) => p.todoId)
        .join(' ')
    )
  };
}

/** True when some to-do takes a different gap, or a priority's order changes. */
export function looksDifferent(input: PlannerInput, a: Plan, b: Plan): boolean {
  const x = planShape(input, a);
  const y = planShape(input, b);
  if (x.order.some((order, i) => order !== y.order[i])) return true;
  return [...x.gapOf].some(([id, gap]) => y.gapOf.get(id) !== gap) || x.gapOf.size !== y.gapOf.size;
}

/** Every plan Shuffle may pick from `current`: all allowed plans that look different. */
export function shuffleOptions(input: PlannerInput, current: Plan): Plan[] {
  return allPlans(input).filter((plan) => looksDifferent(input, plan, current));
}

/** Small seeded PRNG (mulberry32), so a seed always gives the same pick. */
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
 * Another plan that follows every rule and looks different from `current`,
 * picked by `seed`. Returns `current` only if no other plan exists.
 */
export function shufflePlan(
  input: PlannerInput,
  current: Plan,
  seed: number
): { plan: Plan; seed: number } {
  const options = shuffleOptions(input, current);
  if (!options.length) return { plan: current, seed };
  const pick = Math.floor(seededRandom(seed)() * options.length);
  return { plan: options[pick], seed };
}

/**
 * Every rule a plan breaks, in words; empty when the plan is fine. Checks the
 * day's bounds, each to-do's window, work hours, the last start, overlaps and
 * buffers, and high priority first.
 */
export function planProblems(input: PlannerInput, plan: Plan): string[] {
  const problems: string[] = [];
  const todos = new Map(input.todos.map((t) => [t.id, t]));
  const padded = (b: { start: number; end: number }) => ({
    start: b.start - input.buffer,
    end: b.end + input.buffer
  });
  const seen = new Set<string>();

  plan.placements.forEach((p, i) => {
    const todo = todos.get(p.todoId);
    if (!todo) return problems.push(`${p.todoId}: not a to-do`);
    if (seen.has(p.todoId)) problems.push(`${p.todoId}: placed twice`);
    seen.add(p.todoId);
    if (p.end - p.start !== todo.minutes) problems.push(`${p.todoId}: wrong length`);
    if (p.start < input.dayStart || p.end > input.dayEnd) problems.push(`${p.todoId}: outside the day`);
    if (p.start > input.lastStart) problems.push(`${p.todoId}: starts too late`);
    if (todo.after !== undefined && p.start < todo.after) problems.push(`${p.todoId}: before its window`);
    if (todo.before !== undefined && p.end > todo.before) problems.push(`${p.todoId}: after its window`);
    if (todo.kind === 'work' && (p.start < input.workStart || p.end > input.workEnd)) {
      problems.push(`${p.todoId}: work outside work hours`);
    }
    for (const e of input.events) {
      if (overlaps(p, padded(e))) problems.push(`${p.todoId}: too close to ${e.id}`);
    }
    plan.placements.forEach((q, j) => {
      if (j > i && overlaps(p, padded(q))) problems.push(`${p.todoId}: too close to ${q.todoId}`);
    });
  });

  const priorityOf = (id: string) => todos.get(id)?.priority;
  for (const high of plan.placements.filter((p) => priorityOf(p.todoId) === 'high')) {
    for (const other of plan.placements.filter((p) => priorityOf(p.todoId) !== 'high')) {
      if (other.start < high.start) problems.push(`${other.todoId}: before high-priority ${high.todoId}`);
    }
  }
  return problems;
}

/** True when a plan breaks none of the rules in `planProblems`. */
export function isValidPlan(input: PlannerInput, plan: Plan): boolean {
  return planProblems(input, plan).length === 0;
}
