import { describe, expect, it } from 'vitest';
import { sampleDay } from '~/content/sample-day';
import {
  freeGaps,
  isValidPlan,
  planDay,
  plannerInputFromDay,
  randomPlan,
  shufflePlan
} from '~/lib/planner';
import { formatTime } from '~/lib/time';

const input = plannerInputFromDay(sampleDay);
const at = (plan: ReturnType<typeof planDay>, id: string) =>
  formatTime(plan.placements.find((p) => p.todoId === id)!.start);

describe('freeGaps', () => {
  it('keeps the buffer around events', () => {
    const gaps = freeGaps(input.events, input.dayStart, input.dayEnd, 5).map(
      (g) => `${formatTime(g.start)}-${formatTime(g.end)}`
    );
    expect(gaps).toEqual([
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
  const plan = planDay(input);

  it('fits all seven to-dos', () => {
    expect(plan.unplaced).toEqual([]);
    expect(plan.placements).toHaveLength(7);
    expect(isValidPlan(input, plan)).toBe(true);
  });

  it('puts high priority first, longest first, at the earliest fit', () => {
    expect(at(plan, 'deck')).toBe('8:30');
    expect(at(plan, 'lena')).toBe('9:50');
    expect(at(plan, 'notes')).toBe('10:15');
  });

  it('respects each to-do window', () => {
    const groceries = plan.placements.find((p) => p.todoId === 'groceries')!;
    const landlord = plan.placements.find((p) => p.todoId === 'landlord')!;
    expect(groceries.start).toBeGreaterThanOrEqual(17 * 60);
    expect(landlord.end).toBeLessThanOrEqual(17 * 60);
  });

  it('is deterministic', () => {
    expect(planDay(input)).toEqual(plan);
  });

  it('reports to-dos that do not fit', () => {
    const tight = { ...input, dayEnd: 10 * 60 };
    const result = planDay(tight);
    expect(result.unplaced.length).toBeGreaterThan(0);
    expect(isValidPlan(tight, result)).toBe(true);
  });
});

describe('shuffle', () => {
  it('gives the same plan for the same seed', () => {
    expect(randomPlan(input, 7)).toEqual(randomPlan(input, 7));
  });

  it('always finds a different valid plan', () => {
    let current = planDay(input);
    let seed = 1;
    for (let i = 0; i < 25; i++) {
      const next = shufflePlan(input, current, seed);
      expect(isValidPlan(input, next.plan)).toBe(true);
      expect(next.plan.placements).toHaveLength(7);
      expect(next.plan).not.toEqual(current);
      current = next.plan;
      seed = next.seed + 1;
    }
  });
});

describe('isValidPlan', () => {
  it('rejects overlaps with events', () => {
    const plan = planDay(input);
    const broken = {
      ...plan,
      placements: plan.placements.map((p) =>
        p.todoId === 'deck' ? { ...p, start: 11 * 60, end: 11 * 60 + 45 } : p
      )
    };
    expect(isValidPlan(input, broken)).toBe(false);
  });
});
