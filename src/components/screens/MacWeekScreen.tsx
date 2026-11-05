import { sampleWeek } from '~/content/sample-day';
import { DEMO_NOW, dayEvents, dayTodos } from '~/lib/day';
import { formatTime, toMinutes } from '~/lib/time';
import { WindowDots } from './bits';

const START = 8 * 60;
const END = 21 * 60;
const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => START / 60 + i);
/**
 * Positions on the time grid, as a share of its height. Labels, gridlines,
 * events, and the now line all use these, so they line up at every size and
 * whatever font size each element has.
 */
const at = (minutes: number) => `${((minutes - START) / (END - START)) * 100}%`;
const length = (minutes: number) => `${(minutes / (END - START)) * 100}%`;
const MONTH = Array.from({ length: 35 }, (_, i) => i - 0); // March 2027 starts on a Monday

/** Mac: the whole week in one window. Thursday is Ana's sample day. */
export function MacWeekScreen() {
  const week = sampleWeek.map((d) =>
    d.label === 'Thu'
      ? { ...d, events: dayEvents.map((e) => ({ ...e, startM: e.start, endM: e.end })) }
      : { ...d, events: d.events.map((e) => ({ ...e, startM: toMinutes(e.start), endM: toMinutes(e.end) })) }
  );

  return (
    <div className='ds' style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f1e8dc' }}>
      <div
        style={{
          display: 'flex',
          height: '1.55em',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1em',
          fontSize: '0.78em',
          fontWeight: 500,
          background: 'rgb(255 253 249 / 0.7)'
        }}
      >
        <span style={{ display: 'flex', gap: '1.1em' }}>
          <b>Daybreak</b>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Window</span>
        </span>
        <span className='ds-num' style={{ fontWeight: 700 }}>
          Thu {formatTime(DEMO_NOW)}
        </span>
      </div>
      <div
        style={{
          flex: 1,
          margin: '0.9em 1.2em 0',
          display: 'grid',
          gridTemplateColumns: '12.5em 1fr',
          overflow: 'hidden',
          borderRadius: '0.9em 0.9em 0 0',
          background: 'var(--ds-bg)',
          boxShadow: '0 0 0 0.06em rgb(28 26 23 / 0.12), 0 1em 2em -1em rgb(28 26 23 / 0.4)'
        }}
      >
        <aside className='ds-sidebar' style={{ padding: '0.9em 0.8em' }}>
          <WindowDots />
          <div style={{ marginTop: '1.4em', fontSize: '0.8em', fontWeight: 700 }}>March 2027</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '0.2em',
              marginTop: '0.6em',
              fontSize: '0.62em',
              textAlign: 'center'
            }}
          >
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <b key={i} style={{ color: 'var(--ds-muted)' }}>
                {d}
              </b>
            ))}
            {MONTH.map((i) => {
              const day = i + 1;
              const isToday = day === 11;
              const inWeek = day >= 8 && day <= 14;
              return (
                <span
                  key={i}
                  className='ds-num'
                  style={{
                    padding: '0.25em 0',
                    borderRadius: '0.4em',
                    fontWeight: 700,
                    color: day > 31 ? 'transparent' : isToday ? 'var(--ds-select-fg)' : undefined,
                    background: isToday ? 'var(--ds-select)' : inWeek ? 'rgb(28 26 23 / 0.06)' : undefined
                  }}
                >
                  {day}
                </span>
              );
            })}
          </div>
          <div className='ds-side-title' style={{ marginTop: '1.6em', fontSize: '0.62em' }}>
            Today’s to-dos
          </div>
          <div style={{ marginTop: '0.4em', fontSize: '0.86em' }}>
            {dayTodos.slice(0, 5).map((t) => (
              <div key={t.id} className='ds-list-row' style={{ padding: '0.3em 0.2em' }}>
                <span className='ds-check' />
                <span className='ds-row-title' style={{ fontWeight: 550 }}>
                  {t.title}
                </span>
              </div>
            ))}
          </div>
        </aside>
        <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75em 1.1em',
              borderBottom: '1px solid var(--ds-line)'
            }}
          >
            <span style={{ fontSize: '1.15em', fontWeight: 700, letterSpacing: '-0.02em' }}>Week of 8 March</span>
            <span
              style={{
                display: 'flex',
                padding: '0.2em',
                borderRadius: '0.6em',
                background: 'rgb(28 26 23 / 0.06)',
                fontSize: '0.66em',
                fontWeight: 600
              }}
            >
              {['Day', 'Week', 'Month'].map((v) => (
                <span
                  key={v}
                  style={{
                    padding: '0.25em 0.9em',
                    borderRadius: '0.45em',
                    background: v === 'Week' ? '#fff' : undefined,
                    boxShadow: v === 'Week' ? '0 0.05em 0.2em rgb(28 26 23 / 0.2)' : undefined
                  }}
                >
                  {v}
                </span>
              ))}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2.4em repeat(7, 1fr)', padding: '0.5em 0.8em 0 0.4em' }}>
            <span />
            {week.map((d) => (
              <span
                key={d.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.35em',
                  padding: '0 0.4em 0.4em',
                  fontSize: '0.7em',
                  fontWeight: 600,
                  color: d.label === 'Thu' ? 'var(--ds-now-text)' : 'var(--ds-muted)'
                }}
              >
                {d.label}
                <b className='ds-num' style={{ fontSize: '1.35em', color: d.label === 'Thu' ? 'var(--ds-now-text)' : 'var(--ds-fg)' }}>
                  {d.date}
                </b>
              </span>
            ))}
          </div>
          {/* Room above 08 and below 21 for their labels; the grid fills the rest. */}
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <div
              data-timeline='mac-week'
              style={{
                position: 'absolute',
                inset: '0.7em 0.8em 0.8em 0.4em',
                display: 'grid',
                gridTemplateColumns: '2.4em repeat(7, 1fr)',
                gridTemplateRows: '1fr'
              }}
            >
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className='ds-hour'
                  data-hour={hour}
                  style={{ top: at(hour * 60), left: '2.4em', right: 0 }}
                >
                  <span style={{ left: 'auto', right: '100%', paddingRight: '0.55em', fontSize: '0.56em', background: 'none' }}>
                    {String(hour).padStart(2, '0')}
                  </span>
                </div>
              ))}
              <span />
              {week.map((d) => (
                <div
                  key={d.label}
                  style={{
                    position: 'relative',
                    borderLeft: '1px solid var(--ds-line)',
                    background: d.label === 'Thu' ? 'rgb(255 217 119 / 0.08)' : undefined
                  }}
                >
                  {d.events.map((e) => (
                    <div
                      key={e.title + e.start}
                      className='ds-block ds-event'
                      data-event={d.label === 'Thu' && 'id' in e ? String(e.id) : undefined}
                      data-kind={e.kind}
                      data-compact={e.endM - e.startM < 50 || undefined}
                      style={{
                        top: at(e.startM),
                        height: length(e.endM - e.startM),
                        left: '0.15em',
                        right: '0.2em',
                        minHeight: '1em',
                        fontSize: '0.86em',
                        borderRadius: '0.4em'
                      }}
                    >
                      <div className='ds-block-text'>
                        <span className='ds-block-title'>{e.title}</span>
                      </div>
                    </div>
                  ))}
                  {d.label === 'Thu' &&
                    dayTodos.map((t) =>
                      t.start === null ? null : (
                        <div
                          key={t.id}
                          className='ds-block ds-todo'
                          style={{
                            top: at(t.start),
                            height: length(t.minutes),
                            left: '0.15em',
                            right: '0.2em',
                            minHeight: '0.8em',
                            fontSize: '0.86em',
                            borderRadius: '0.35em',
                            padding: '0 0.35em'
                          }}
                        >
                          <span className='ds-block-title' style={{ fontSize: '0.62em' }}>
                            {t.title}
                          </span>
                        </div>
                      )
                    )}
                  {d.label === 'Thu' && <div className='ds-now' style={{ top: at(DEMO_NOW), left: 0, right: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
