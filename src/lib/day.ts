/**
 * Ana's day, ready for the drawn screens: times as minutes, and the canonical
 * plan from the planner so every screen shows the same placements.
 */
import { sampleDay, type DayEvent, type Todo } from '~/content/sample-day';
import { planDay, plannerInputFromDay } from '~/lib/planner';
import { toMinutes } from '~/lib/time';

export type TimedEvent = Omit<DayEvent, 'start' | 'end'> & { start: number; end: number };
export type TimedTodo = Todo & { start: number | null; end: number | null };

export const plannerInput = plannerInputFromDay(sampleDay);
export const canonicalPlan = planDay(plannerInput);

export const dayEvents: TimedEvent[] = sampleDay.events.map((e) => ({
  ...e,
  start: toMinutes(e.start),
  end: toMinutes(e.end)
}));

export const dayTodos: TimedTodo[] = sampleDay.todos.map((t) => {
  const placement = canonicalPlan.placements.find((p) => p.todoId === t.id);
  return { ...t, start: placement?.start ?? null, end: placement?.end ?? null };
});

/** The moment the static screens show: a late Thursday morning. */
export const DEMO_NOW = toMinutes('10:48');

/** The hero plays the day between these times. */
export const HERO_START = toMinutes('07:00');
export const HERO_END = toMinutes('22:00');
/** Reduced motion and the end of the phone autoplay show midday. */
export const HERO_MIDDAY = toMinutes('12:45');

/** When the hero snaps each to-do into its gap: a while before it starts. */
export function snapTime(todo: TimedTodo, index: number): number {
  if (todo.start === null) return Infinity;
  return Math.max(HERO_START + 12 + index * 9, todo.start - 80);
}

/** Next event after `now`, for widgets and the menu bar. */
export function nextEvent(now: number): TimedEvent | undefined {
  return dayEvents.find((e) => e.end > now);
}
