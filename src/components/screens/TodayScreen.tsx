import { sampleDay, sampleUser } from '~/content/sample-day';
import { HERO_END, HERO_START, type TimedEvent, type TimedTodo } from '~/lib/day';
import { formatDuration, formatTime } from '~/lib/time';
import { StatusBar } from './StatusBar';
import { Check } from './bits';

/** Em per hour on the Today timeline. */
const HOUR = 3.8;
const PAD = 0.8;
/** Timeline height visible above the to-do tray, in em. */
const VISIBLE = 22.4;

const WEEK = [
  { d: 'M', n: 8, dot: true },
  { d: 'T', n: 9, dot: true },
  { d: 'W', n: 10, dot: false },
  { d: 'T', n: 11, today: true },
  { d: 'F', n: 12, dot: true },
  { d: 'S', n: 13, dot: false },
  { d: 'S', n: 14, dot: true }
];

export type TodayScreenProps = {
  /** Minutes since midnight: moves the now line and the status bar clock. */
  now: number;
  events: TimedEvent[];
  todos: TimedTodo[];
  /** Which to-dos have snapped into the timeline. Defaults to all planned. */
  isPlaced?: (todo: TimedTodo, index: number) => boolean;
  theme?: 'light' | 'dark';
  /** Shown instead of a timeline when the day is empty. */
  empty?: { title: string; body: string };
};

export function TodayScreen({
  now,
  events,
  todos,
  isPlaced = (t) => t.start !== null,
  theme = 'light',
  empty
}: TodayScreenProps) {
  const span = ((HERO_END - HERO_START) / 60) * HOUR;
  const maxOffset = span + PAD * 2 - VISIBLE;
  const progress = Math.min(1, Math.max(0, (now - HERO_START) / (HERO_END - HERO_START)));
  const offset = progress * maxOffset;
  const nowY = PAD + progress * span;
  const y = (minutes: number) => PAD + ((minutes - HERO_START) / 60) * HOUR;

  const placed = todos.map((t, i) => isPlaced(t, i));
  const waiting = todos.filter((_, i) => !placed[i]);
  const waitingMinutes = waiting.reduce((sum, t) => sum + t.minutes, 0);
  // Position of each waiting to-do in the tray's stack.
  const deck = placed.map((p, i) => (p ? -1 : placed.slice(0, i).filter((q) => !q).length));

  return (
    <div className='ds ds-today' data-theme={theme}>
      <StatusBar time={formatTime(now)} />
      <div className='ds-today-head'>
        <div>
          <div className='ds-today-title'>{sampleDay.weekday}</div>
          <div className='ds-today-date'>{sampleDay.dateLabel}</div>
        </div>
        <div className='ds-avatar'>
          <span>{sampleUser.initials}</span>
        </div>
      </div>
      <div className='ds-week'>
        {WEEK.map((w) => (
          <div
            key={w.n}
            className='ds-week-day'
            data-today={w.today || undefined}
            data-dot={(!empty && w.dot) || undefined}
          >
            <b>{w.d}</b>
            <span>{w.n}</span>
          </div>
        ))}
      </div>

      {empty ? (
        <div className='ds-empty'>
          <svg className='ds-empty-art' viewBox='0 0 80 80' aria-hidden='true'>
            <circle cx='40' cy='50' r='22' fill='#ffd977' />
            <rect x='4' y='50' width='72' height='26' fill='var(--ds-bg)' />
            <path d='M10 50h60' stroke='currentColor' strokeOpacity='.35' strokeWidth='2.5' strokeLinecap='round' />
            <path d='M24 60h32M32 68h16' stroke='currentColor' strokeOpacity='.18' strokeWidth='2.5' strokeLinecap='round' />
          </svg>
          <b>{empty.title}</b>
          <span>{empty.body}</span>
        </div>
      ) : (
        <div className='ds-timeline'>
          <div
            className='ds-timeline-inner'
            data-timeline='iphone-today'
            style={{ height: `${span + PAD * 2}em`, transform: `translateY(${-offset}em)` }}
          >
            {Array.from({ length: (HERO_END - HERO_START) / 60 + 1 }, (_, i) => (
              <div key={i} className='ds-hour' data-hour={7 + i} style={{ top: `${PAD + i * HOUR}em` }}>
                <span>{String(7 + i).padStart(2, '0')}</span>
              </div>
            ))}

            {events.map((e) => {
              const state = now >= e.end ? 'past' : now >= e.start ? 'now' : 'next';
              const minutes = e.end - e.start;
              return (
                <div
                  key={e.id}
                  className='ds-block ds-event'
                  data-event={e.id}
                  data-kind={e.kind}
                  data-state={state}
                  data-compact={minutes < 40 || undefined}
                  style={{ top: `${y(e.start)}em`, height: `${(minutes / 60) * HOUR}em` }}
                >
                  <div className='ds-block-text'>
                    <span className='ds-block-title'>{e.title}</span>
                    <span className='ds-block-meta'>
                      <span className='ds-num'>{formatTime(e.start)}</span>
                      {e.place ? ` · ${e.place}` : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {todos.map((t, i) =>
              t.start === null || t.end === null ? null : (
                <div
                  key={t.id}
                  className='ds-block ds-todo'
                  data-placed={placed[i]}
                  data-done={(placed[i] && now >= t.end) || undefined}
                  data-compact
                  style={{ top: `${y(t.start)}em`, height: `${(t.minutes / 60) * HOUR}em` }}
                >
                  <span className='ds-check'>
                    <Check />
                  </span>
                  <span className='ds-block-title'>{t.title}</span>
                  <span className='ds-dur'>{t.minutes}m</span>
                </div>
              )
            )}

            <div className='ds-now' style={{ transform: `translateY(${nowY}em)` }}>
              <span>{formatTime(now)}</span>
            </div>
          </div>
        </div>
      )}

      {!empty && (
        <div className='ds-tray'>
          <div className='ds-tray-handle' />
          <div className='ds-tray-head'>
            <b>To fit today</b>
            <span>
              {waiting.length
                ? `${waiting.length} left · ${formatDuration(waitingMinutes)}`
                : `${todos.length} of ${todos.length} planned`}
            </span>
          </div>
          <div className='ds-deck'>
            {todos.map((t, i) => {
              const index = deck[i];
              return (
                <div
                  key={t.id}
                  className='ds-chip'
                  data-gone={placed[i] || undefined}
                  style={{
                    translate: placed[i] ? '0 -1.6em' : `0 ${Math.min(index, 2) * 2.35}em`,
                    zIndex: 10 - Math.max(index, 0)
                  }}
                >
                  <i className='ds-prio' data-p={t.priority} />
                  <span className='ds-chip-title'>{t.title}</span>
                  <span className='ds-dur'>{formatDuration(t.minutes)}</span>
                </div>
              );
            })}
            <div className='ds-all-done' data-show={waiting.length === 0 || undefined}>
              <span className='ds-check' style={{ background: 'var(--ds-fg)', boxShadow: 'none' }}>
                <Check style={{ opacity: 1, color: 'var(--ds-bg)' }} />
              </span>
              Every to-do has a time
            </div>
          </div>
        </div>
      )}
      <div className='ds-home-bar' />
    </div>
  );
}
