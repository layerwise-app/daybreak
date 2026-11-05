import { useMemo, useState, type CSSProperties } from 'react';
import { home } from '~/content/home';
import { sampleDay } from '~/content/sample-day';
import { dayEvents, plannerInput } from '~/lib/day';
import { planDay, shufflePlan, type Plan } from '~/lib/planner';
import { formatDuration, formatRange, formatTime, toMinutes } from '~/lib/time';

const copy = home.plan;
const DAY_START = toMinutes(sampleDay.dayStart);
const DAY_END = toMinutes(sampleDay.dayEnd);
const FIRST_HOUR = Math.floor(DAY_START / 60);
const LAST_HOUR = Math.ceil(DAY_END / 60);
const HOURS = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' } as const;

/** Minutes from the top of the day column. */
const fromTop = (minutes: number) => minutes - FIRST_HOUR * 60;

export function PlanMyDay() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [seed, setSeed] = useState(1);
  const [round, setRound] = useState(0);

  const placements = useMemo(
    () => new Map(plan?.placements.map((p) => [p.todoId, p]) ?? []),
    [plan]
  );
  // Cards fly in the order of their new start time.
  const order = useMemo(
    () => new Map(plan?.placements.map((p, i) => [p.todoId, i]) ?? []),
    [plan]
  );

  const planIt = () => {
    setPlan(planDay(plannerInput));
    setRound((r) => r + 1);
  };
  const shuffle = () => {
    if (!plan) return planIt();
    const next = shufflePlan(plannerInput, plan, seed);
    setPlan(next.plan);
    setSeed(next.seed + 1);
    setRound((r) => r + 1);
  };
  const reset = () => {
    setPlan(null);
    setRound((r) => r + 1);
  };

  const first = plan?.placements[0];
  const firstTodo = first && sampleDay.todos.find((t) => t.id === first.todoId);
  const status = plan
    ? `${copy.planned} First up: ${firstTodo?.title} at ${formatTime(first!.start)}.`
    : `${sampleDay.todos.length} ${copy.unplanned}.`;

  return (
    <section id={copy.id} aria-labelledby='plan-title' className='section bg-paper-deep/70'>
      <div className='section-head grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end'>
        <div>
          <p className='eyebrow'>{copy.eyebrow}</p>
          <h2 id='plan-title' className='section-title max-w-[19ch]'>
            {copy.headline}
          </h2>
          <p className='section-lede'>{copy.body}</p>
        </div>
      </div>

      <div className='tile mx-auto max-w-[1180px] p-4 sm:p-6 lg:p-8'>
        <div className='flex flex-wrap items-center gap-3 border-b border-ink/10 pb-5'>
          <button type='button' className='btn btn-ink btn-lg' onClick={plan ? shuffle : planIt}>
            {plan ? copy.shuffleLabel : copy.planLabel}
          </button>
          {plan ? (
            <button type='button' className='btn btn-soft btn-lg' onClick={reset}>
              {copy.resetLabel}
            </button>
          ) : null}
          <p className='text-[0.9375rem] font-medium text-ink-soft sm:ml-auto' aria-live='polite'>
            {status}
          </p>
        </div>

        <div
          className='plan-board ds'
          data-planned={plan ? true : undefined}
          style={{ '--n': sampleDay.todos.length, '--h': (LAST_HOUR - FIRST_HOUR) * 60 } as CSSProperties}
        >
          <div className='plan-list-head'>
            <span>{copy.listTitle}</span>
            <span className='num'>
              {formatDuration(sampleDay.todos.reduce((s, t) => s + t.minutes, 0))}
            </span>
          </div>
          <div className='plan-day-head'>
            <span>{copy.dayTitle}</span>
            <span className='text-ink-muted'>{sampleDay.dateLabel}</span>
          </div>

          {/* Slots in the list: they stay put and show where each to-do went. */}
          <ol className='plan-slots'>
            {sampleDay.todos.map((t) => {
              const p = placements.get(t.id);
              return (
                <li key={t.id} className='plan-slot'>
                  <span className='sr-only'>
                    {t.title}, {formatDuration(t.minutes)}, {PRIORITY_LABEL[t.priority]} priority
                    {t.hint ? `, ${t.hint.toLowerCase()}` : ''}
                    {p ? `. Planned ${formatRange(p.start, p.end)}.` : '.'}
                  </span>
                  {p ? (
                    <span aria-hidden='true' className='plan-slot-ghost'>
                      <span>{t.title}</span>
                      <span className='num shrink-0'>→ {formatTime(p.start)}</span>
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <div className='plan-day' aria-hidden='true'>
            {HOURS.map((h) => (
              <div key={h} className='plan-hour' style={{ '--m': fromTop(h * 60) } as CSSProperties}>
                <span className='num'>{String(h).padStart(2, '0')}</span>
              </div>
            ))}
            <div
              className='plan-free'
              style={{ '--m': fromTop(DAY_START), '--d': DAY_END - DAY_START } as CSSProperties}
            />
            {dayEvents.map((e) => (
              <div
                key={e.id}
                className='plan-event ds-event'
                data-kind={e.kind}
                style={{ '--m': fromTop(e.start), '--d': e.end - e.start } as CSSProperties}
              >
                <span className='truncate font-[650]'>{e.title}</span>
                <span className='num ml-auto shrink-0'>{formatTime(e.start)}</span>
              </div>
            ))}
          </div>

          {/* The to-do cards themselves: one element each, flying between the list and the day. */}
          {sampleDay.todos.map((t, i) => {
            const p = placements.get(t.id);
            return (
              <div
                key={t.id}
                className='plan-card'
                aria-hidden='true'
                data-placed={p ? true : undefined}
                style={
                  {
                    '--i': i,
                    '--m': p ? fromTop(p.start) : 0,
                    '--d': t.minutes,
                    '--o': order.get(t.id) ?? i,
                    '--round': round
                  } as CSSProperties
                }
              >
                <div className='plan-card-y'>
                  <div className='plan-card-body'>
                    <i className='ds-prio' data-p={t.priority} />
                    <span className='plan-card-title'>{t.title}</span>
                    <span className='plan-card-hint'>{t.hint ?? `${PRIORITY_LABEL[t.priority]} priority`}</span>
                    <span className='plan-card-meta num'>
                      {p ? formatTime(p.start) : formatDuration(t.minutes)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
