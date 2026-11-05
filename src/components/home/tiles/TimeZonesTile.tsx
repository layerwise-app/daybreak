import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { home } from '~/content/home';
import { clamp } from '~/lib/time';
import { Tile } from '../Tile';

const copy = home.features.tiles.timeZones;
/** The strip shows 24 hours of UTC, starting at noon UTC on Ana's Thursday. */
const STRIP_START = 12;
const HOURS = 24;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function local(utcHour: number, offset: number) {
  const total = utcHour + offset;
  const day = Math.floor(total / 24);
  const hour = ((total % 24) + 24) % 24;
  return { hour, weekday: WEEKDAYS[(4 + day + 7) % 7] };
}

function fmt(hour: number) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

type Mood = 'work' | 'awake' | 'asleep';
function mood(hour: number): Mood {
  if (hour >= copy.work.from && hour < copy.work.to) return 'work';
  if (hour >= copy.awake.from && hour < copy.awake.to) return 'awake';
  return 'asleep';
}

export function TimeZonesTile() {
  // Start of the selected hour, in UTC hours from STRIP_START.
  const [at, setAt] = useState(5);
  const stripRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const utc = STRIP_START + at;
  const rows = copy.cities.map((city) => {
    const start = local(utc, city.offset);
    return { ...city, ...start, mood: mood(start.hour), endsAsleep: mood((start.hour + 1) % 24) === 'asleep' };
  });
  const asleep = rows.filter((r) => r.mood === 'asleep' || r.endsAsleep);
  const verdict = asleep.length
    ? `Too late or too early in ${asleep.map((r) => r.name).join(' and ')}`
    : 'Works for all three';

  const setFromPointer = (clientX: number) => {
    const rect = stripRef.current?.getBoundingClientRect();
    if (!rect) return;
    const hour = ((clientX - rect.left) / rect.width) * HOURS - 0.5;
    setAt(clamp(Math.round(hour * 2) / 2, 0, HOURS - 1));
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
    if (e.key === 'Home') setAt(0);
    else if (e.key === 'End') setAt(HOURS - 1);
    else if (step) setAt((a) => clamp(a + step, 0, HOURS - 1));
    else return;
    e.preventDefault();
  };

  const valueText = rows.map((r) => `${r.name} ${fmt(r.hour)} ${r.weekday}`).join(', ');

  return (
    <Tile title={copy.title} body={copy.body} className='bento-zones' demoClassName='px-6 pb-6 pt-5 sm:px-7 sm:pb-7'>
      <div className='tz'>
        <div className='tz-labels'>
          {rows.map((r) => (
            <div key={r.name} className='tz-label'>
              <span className='truncate text-[0.875rem] font-semibold text-ink-soft'>{r.name}</span>
              <span className='num text-[1.25rem] font-extrabold tracking-[-0.02em]' data-mood={r.mood}>
                {fmt(r.hour)}
                <small className='ml-1 font-sans text-[0.75rem] font-semibold text-ink-muted'>{r.weekday}</small>
              </span>
            </div>
          ))}
        </div>
        <div
          ref={stripRef}
          className='tz-strips'
          role='slider'
          tabIndex={0}
          aria-label='Meeting time'
          aria-valuemin={0}
          aria-valuemax={HOURS - 1}
          aria-valuenow={at}
          aria-valuetext={`${valueText}. ${verdict}.`}
          onPointerDown={onPointerDown}
          onPointerMove={(e) => dragging.current && setFromPointer(e.clientX)}
          onPointerUp={() => (dragging.current = false)}
          onPointerCancel={() => (dragging.current = false)}
          onKeyDown={onKeyDown}
        >
          {copy.cities.map((city) => (
            <div key={city.name} className='tz-strip' aria-hidden='true'>
              {Array.from({ length: HOURS }, (_, i) => {
                const { hour } = local(STRIP_START + i, city.offset);
                return <i key={i} data-mood={mood(hour)} data-midnight={hour === 0 || undefined} />;
              })}
            </div>
          ))}
          <div className='tz-band' style={{ left: `${(at / HOURS) * 100}%`, width: `${100 / HOURS}%` }} aria-hidden='true' />
        </div>
      </div>
      <p className='tz-verdict' data-ok={!asleep.length || undefined} aria-hidden='true'>
        <span className='size-2 rounded-full' aria-hidden='true' />
        {verdict}
      </p>
    </Tile>
  );
}
