import { describe, expect, it } from 'vitest';
import { sampleDay } from '~/content/sample-day';
import {
  allPlans,
  freeGaps,
  isValidPlan,
  looksDifferent,
  planDay,
  planProblems,
  plannerInputFromDay,
  shuffleOptions,
  shufflePlan,
  type Plan
} from '~/lib/planner';
import { formatTime, toMinutes } from '~/lib/time';

const input = plannerInputFromDay(sampleDay);
const canonical = planDay(input);
const plans = allPlans(input);

const at = (plan: Plan, id: string) =>
  formatTime(plan.placements.find((p) => p.todoId === id)!.start);
const describePlan = (plan: Plan) =>
  plan.placements.map((p) => `${p.todoId} ${formatTime(p.start)}`).join(', ');
const key = (plan: Plan) => describePlan(plan);

/*
 * The design review's rules, written out against the sample day on their own
 * so the planner isn't checked only by its own validator.
 */
const WORK_START = toMinutes('08:30');
const WORK_END = toMinutes('18:00');
const LAST_START = toMinutes('20:30');
const BUFFER = 5;
const EVENING_ERRANDS = new Set(['groceries', 'gift']);
const todoById = new Map(sampleDay.todos.map((t) => [t.id, t]));
const events = sampleDay.events.map((e) => ({
  id: e.id,
  start: toMinutes(e.start),
  end: toMinutes(e.end)
}));
const tooClose = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end + BUFFER && b.start < a.end + BUFFER;

function rulesBroken(plan: Plan): string[] {
  const broken: string[] = [];
  const ids = plan.placements.map((p) => p.todoId).sort();
  if (ids.join() !== [...todoById.keys()].sort().join()) broken.push('not every to-do once');
  if (plan.unplaced.length) broken.push('unplaced to-dos');

  for (const p of plan.placements) {
    const todo = todoById.get(p.todoId)!;
    const where = `${p.todoId} at ${formatTime(p.start)}`;
    if (p.end - p.start !== todo.minutes) broken.push(`${where}: wrong length`);
    // Each to-do's window, and the day.
    if (todo.after && p.start < toMinutes(todo.after)) broken.push(`${where}: before ${todo.after}`);
    if (todo.before && p.end > toMinutes(todo.before)) broken.push(`${where}: past ${todo.before}`);
    if (p.start < toMinutes(sampleDay.dayStart)) broken.push(`${where}: before the day starts`);
    // Work stays in work hours; only the errands go into the evening.
    if (todo.kind === 'work' && (p.start < WORK_START || p.end > WORK_END)) {
      broken.push(`${where}: work outside 8:30–18:00`);
    }
    if (p.end > WORK_END && !EVENING_ERRANDS.has(p.todoId)) broken.push(`${where}: in the evening`);
    if (p.start > LAST_START) broken.push(`${where}: starts after 20:30`);
    // No overlaps, buffers kept.
    for (const e of events) if (tooClose(p, e)) broken.push(`${where}: too close to ${e.id}`);
    for (const q of plan.placements) {
      if (q !== p && tooClose(p, q)) broken.push(`${where}: too close to ${q.todoId}`);
    }
  }

  // High priority first: every high to-do before every medium or low one.
  const highs = plan.placements.filter((p) => todoById.get(p.todoId)!.priority === 'high');
  const rest = plan.placements.filter((p) => todoById.get(p.todoId)!.priority !== 'high');
  for (const h of highs) {
    for (const r of rest) if (r.start <= h.start) broken.push(`${r.todoId} before high ${h.todoId}`);
  }
  return broken;
}

/** What a visitor sees change: a to-do in another free gap, or a new order within a priority. */
const gaps = freeGaps(events, toMinutes(sampleDay.dayStart), toMinutes(sampleDay.dayEnd), BUFFER);
function visibleChange(a: Plan, b: Plan): boolean {
  const gapOf = (plan: Plan, id: string) => {
    const p = plan.placements.find((x) => x.todoId === id)!;
    return gaps.findIndex((g) => p.start >= g.start && p.end <= g.end);
  };
  const orderOf = (plan: Plan, priority: string) =>
    [...plan.placements]
      .sort((x, y) => x.start - y.start)
      .filter((p) => todoById.get(p.todoId)!.priority === priority)
      .map((p) => p.todoId)
      .join();
  return (
    [...todoById.keys()].some((id) => gapOf(a, id) !== gapOf(b, id)) ||
    ['high', 'medium', 'low'].some((level) => orderOf(a, level) !== orderOf(b, level))
  );
}

describe('freeGaps', () => {
  it('keeps the buffer around events', () => {
    const list = freeGaps(input.events, input.dayStart, input.dayEnd, 5).map(
      (g) => `${formatTime(g.start)}-${formatTime(g.end)}`
    );
    expect(list).toEqual([
      '8:30-9:25',
      '9:50-10:55',
      '12:05-12:25',
      '13:35-13:55',
      '16:05-16:10',
      '17:05-18:55',
      '20:35-21:30'
    ]);
  });
});

describe('planDay', () => {
  it('fits all seven to-dos and follows every rule', () => {
    expect(canonical.unplaced).toEqual([]);
    expect(canonical.placements).toHaveLength(7);
    expect(rulesBroken(canonical)).toEqual([]);
    expect(isValidPlan(input, canonical)).toBe(true);
  });

  it('puts high priority first, longest first, at the earliest fit', () => {
    expect(describePlan(canonical)).toBe(
      'deck 8:30, lena 9:50, notes 10:15, flights 12:05, landlord 13:35, groceries 17:05, gift 17:40'
    );
  });

  it('is deterministic', () => {
    expect(planDay(plannerInputFromDay(sampleDay))).toEqual(canonical);
  });

  it('reports to-dos that do not fit', () => {
    const tight = { ...input, dayEnd: 10 * 60 };
    const result = planDay(tight);
    expect(result.unplaced.length).toBeGreaterThan(0);
    expect(isValidPlan(tight, result)).toBe(true);
  });

  it('keeps medium and low to-dos after a high one that has to go late', () => {
    // Only the 12:05 gap is left for Lena's reply, so the rest must wait.
    const late = {
      ...input,
      todos: input.todos.map((t) => (t.id === 'lena' ? { ...t, after: 12 * 60 } : t))
    };
    const plan = planDay(late);
    expect(planProblems(late, plan)).toEqual([]);
    expect(at(plan, 'lena')).toBe('12:05');
    for (const p of plan.placements) {
      if (!['deck', 'lena'].includes(p.todoId)) expect(p.start).toBeGreaterThan(12 * 60 + 5);
    }
  });
});

describe('every plan Shuffle can return', () => {
  it('is listed by allPlans, and the canonical plan is one of them', () => {
    expect(plans.length).toBeGreaterThan(20);
    expect(new Set(plans.map(key)).size).toBe(plans.length);
    expect(plans.map(key)).toContain(key(canonical));
  });

  it.each(plans.map((plan) => [describePlan(plan), plan] as const))(
    'follows every rule: %s',
    (_, plan) => {
      expect(rulesBroken(plan)).toEqual([]);
      expect(planProblems(input, plan)).toEqual([]);
    }
  );

  it('comes only from allPlans, never repeats the current plan, and always exists', () => {
    const known = new Set(plans.map(key));
    const returnable = new Set<string>();
    for (const current of [canonical, ...plans]) {
      const options = shuffleOptions(input, current);
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) {
        expect(known.has(key(option))).toBe(true);
        expect(visibleChange(current, option)).toBe(true);
        returnable.add(key(option));
      }
      // Shuffle picks one of the options, whatever the seed.
      const optionKeys = new Set(options.map(key));
      for (const seed of [0, 1, 2, 3, 99, 2 ** 31, 2 ** 32 - 1]) {
        const { plan } = shufflePlan(input, current, seed);
        expect(optionKeys.has(key(plan))).toBe(true);
      }
    }
    // Every allowed plan is reachable, and nothing else is.
    expect([...returnable].sort()).toEqual([...known].sort());
  });

  it('changes something the visitor can see, with or without the pure helper', () => {
    for (const a of plans) {
      for (const b of plans) expect(looksDifferent(input, a, b)).toBe(visibleChange(a, b));
    }
  });

  it('keeps going for many shuffles in a row', () => {
    let current = canonical;
    for (let seed = 1; seed <= 40; seed++) {
      const next = shufflePlan(input, current, seed).plan;
      expect(rulesBroken(next)).toEqual([]);
      expect(visibleChange(current, next)).toBe(true);
      current = next;
    }
  });

  it('is deterministic', () => {
    expect(shufflePlan(input, canonical, 7)).toEqual(shufflePlan(input, canonical, 7));
    expect(allPlans(plannerInputFromDay(sampleDay))).toEqual(plans);
  });
});

describe('planProblems', () => {
  const move = (plan: Plan, id: string, start: string): Plan => ({
    ...plan,
    placements: plan.placements.map((p) =>
      p.todoId === id ? { ...p, start: toMinutes(start), end: toMinutes(start) + p.end - p.start } : p
    )
  });

  it('accepts the canonical plan', () => {
    expect(planProblems(input, canonical)).toEqual([]);
  });

  it('rejects overlaps with events', () => {
    expect(isValidPlan(input, move(canonical, 'deck', '11:00'))).toBe(false);
  });

  it('rejects the plans from the design review', () => {
    // High-priority reply after climbing, after medium and low to-dos.
    expect(planProblems(input, move(canonical, 'lena', '20:35'))).toEqual(
      expect.arrayContaining([
        'lena: starts too late',
        'lena: work outside work hours',
        'notes: before high-priority lena'
      ])
    );
    expect(planProblems(input, move(canonical, 'notes', '21:00'))).toContain('notes: starts too late');
    expect(planProblems(input, move(canonical, 'flights', '18:05'))).toContain(
      'flights: work outside work hours'
    );
    expect(planProblems(input, move(canonical, 'groceries', '21:00'))).toContain(
      'groceries: starts too late'
    );
  });

  it('lets errands use the evening, up to 20:30', () => {
    expect(planProblems(input, move(canonical, 'gift', '18:30'))).toEqual([]);
  });
});
