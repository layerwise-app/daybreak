import { sampleDay } from '~/content/sample-day';
import { DEMO_NOW, dayEvents, dayTodos } from '~/lib/day';
import { formatTime } from '~/lib/time';
import { Check } from './bits';

const START = 8 * 60;
const END = 21 * 60;
const HOUR = 2.85;
const y = (m: number) => ((m - START) / 60) * HOUR;

/** iPad: the to-do list beside the day, at a late Thursday morning. */
export function IPadDayScreen() {
  return (
    <div className='ds ds-split' style={{ gridTemplateColumns: '17em 1fr' }}>
      <aside className='ds-sidebar' style={{ padding: '2.4em 1em 1em' }}>
        <div style={{ fontSize: '1.55em', fontWeight: 700, letterSpacing: '-0.03em' }}>To-dos</div>
        <div style={{ marginTop: '0.25em', fontSize: '0.78em', color: 'var(--ds-muted)' }}>
          All {dayTodos.length} have a time today
        </div>
        <div style={{ marginTop: '1.2em' }}>
          {dayTodos.map((t) => (
            <div key={t.id} className='ds-list-row' data-done={(t.end ?? 0) <= DEMO_NOW || undefined}>
              <span className='ds-check'>
                <Check />
              </span>
              <span className='ds-row-title'>{t.title}</span>
              <span className='ds-row-time'>{t.start !== null ? formatTime(t.start) : ''}</span>
            </div>
          ))}
        </div>
        <div className='ds-side-title' style={{ marginTop: '1.6em', padding: '0 0.6em' }}>
          Calendars
        </div>
        {[
          ['Studio', 'var(--ev-work-bar)'],
          ['Friends', 'var(--ev-social-bar)'],
          ['Health', 'var(--ev-health-bar)']
        ].map(([name, color]) => (
          <div key={name} className='ds-list-row'>
            <span style={{ width: '0.7em', height: '0.7em', borderRadius: '50%', background: color }} />
            <span className='ds-row-title' style={{ fontWeight: 500 }}>
              {name}
            </span>
          </div>
        ))}
      </aside>
      <main style={{ position: 'relative', padding: '2.4em 1.4em 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5em' }}>
          <span style={{ fontSize: '1.55em', fontWeight: 700, letterSpacing: '-0.03em' }}>{sampleDay.weekday}</span>
          <span style={{ fontSize: '0.9em', color: 'var(--ds-muted)' }}>{sampleDay.dateLabel}</span>
        </div>
        <div data-timeline='ipad-day' style={{ position: 'relative', marginTop: '1.3em', height: `${y(END)}em`, fontSize: '1em' }}>
          {Array.from({ length: (END - START) / 60 + 1 }, (_, i) => (
            <div key={i} className='ds-hour' data-hour={8 + i} style={{ top: `${i * HOUR}em` }}>
              <span style={{ left: 0 }}>{String(8 + i).padStart(2, '0')}</span>
            </div>
          ))}
          {dayEvents.map((e) => (
            <div
              key={e.id}
              className='ds-block ds-event'
              data-event={e.id}
              data-kind={e.kind}
              data-state={DEMO_NOW >= e.end ? 'past' : DEMO_NOW >= e.start ? 'now' : 'next'}
              data-compact={e.end - e.start < 50 || undefined}
              style={{ top: `${y(e.start)}em`, height: `${((e.end - e.start) / 60) * HOUR}em`, left: '2.6em', right: '0' }}
            >
              <div className='ds-block-text'>
                <span className='ds-block-title'>{e.title}</span>
                <span className='ds-block-meta'>
                  <span className='ds-num'>{formatTime(e.start)}</span>
                  {e.place ? ` · ${e.place}` : ''}
                </span>
              </div>
            </div>
          ))}
          {dayTodos.map((t) =>
            t.start === null || t.end === null ? null : (
              <div
                key={t.id}
                className='ds-block ds-todo'
                data-compact
                data-done={t.end <= DEMO_NOW || undefined}
                style={{ top: `${y(t.start)}em`, height: `${(t.minutes / 60) * HOUR}em`, left: '2.6em', right: '0' }}
              >
                <span className='ds-check'>
                  <Check />
                </span>
                <span className='ds-block-title'>{t.title}</span>
                <span className='ds-dur'>{t.minutes}m</span>
              </div>
            )
          )}
          <div className='ds-now' style={{ top: `${y(DEMO_NOW)}em`, left: '2.2em', right: 0 }}>
            <span style={{ left: '-2.6em' }}>{formatTime(DEMO_NOW)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
