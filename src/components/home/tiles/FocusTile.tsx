import { useEffect, useRef, useState } from 'react';
import { home } from '~/content/home';
import { useActive } from '~/hooks/use-motion';
import { Tile } from '../Tile';

const copy = home.features.tiles.focus;
const TOTAL = copy.minutes * 60 * 1000;
const R = 52;
const C = 2 * Math.PI * R;

type Timer =
  | { status: 'idle' }
  | { status: 'running'; endsAt: number }
  | { status: 'paused'; remaining: number }
  | { status: 'done' };

function remainingOf(timer: Timer, now: number): number {
  if (timer.status === 'running') return Math.max(0, timer.endsAt - now);
  if (timer.status === 'paused') return timer.remaining;
  return timer.status === 'done' ? 0 : TOTAL;
}

export function FocusTile() {
  const [timer, setTimer] = useState<Timer>({ status: 'idle' });
  const [now, setNow] = useState(0);
  const ringRef = useRef<HTMLDivElement>(null);
  const active = useActive(ringRef);

  // Redraw while running and visible; time is kept from timestamps, so it
  // stays right while paused off screen.
  useEffect(() => {
    if (timer.status !== 'running' || !active) return;
    let frame = 0;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= timer.endsAt) setTimer({ status: 'done' });
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timer, active]);

  const remaining = remainingOf(timer, now);
  const fraction = remaining / TOTAL;
  const seconds = Math.ceil(remaining / 1000);
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const secondAngle = ((remaining % 60000) / 60000) * 360;

  const start = () => {
    const t = Date.now();
    setNow(t);
    setTimer({ status: 'running', endsAt: t + remaining });
  };
  const pause = () => setTimer({ status: 'paused', remaining });
  const reset = () => setTimer({ status: 'idle' });

  const running = timer.status === 'running';
  const status =
    timer.status === 'running'
      ? 'Focusing. Notifications are waiting.'
      : timer.status === 'paused'
        ? 'Paused.'
        : timer.status === 'done'
          ? 'Block done. Nice work.'
          : `${copy.minutes} minutes on ${copy.label.toLowerCase()}.`;

  return (
    <Tile title={copy.title} body={copy.body} className='bento-focus' demoClassName='px-6 pb-6 pt-4 sm:px-7 sm:pb-7'>
      <div className='flex flex-1 items-center gap-6'>
        <div ref={ringRef} className='focus-ring' data-running={running || undefined}>
          <svg viewBox='0 0 120 120' aria-hidden='true'>
            <circle cx='60' cy='60' r={R} className='focus-track' />
            <circle
              cx='60'
              cy='60'
              r={R}
              className='focus-progress'
              strokeDasharray={C}
              strokeDashoffset={C * (1 - fraction)}
            />
            <g style={{ transform: `rotate(${-secondAngle}deg)`, transformOrigin: '60px 60px' }}>
              <circle cx='60' cy={60 - R} r='4.2' className='focus-dot' />
            </g>
          </svg>
          <div className='focus-time'>
            <span className='num' role='timer' aria-label={`${label} left`}>
              {label}
            </span>
            <small>{copy.label}</small>
          </div>
        </div>
        <div className='flex min-w-0 flex-col gap-2'>
          <button
            type='button'
            className='btn btn-ink w-[7.5rem]'
            onClick={running ? pause : start}
            disabled={timer.status === 'done'}
          >
            {running ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'}
          </button>
          <button
            type='button'
            className='btn btn-soft w-[7.5rem]'
            onClick={reset}
            disabled={timer.status === 'idle'}
          >
            Reset
          </button>
          <p className='mt-1 max-w-[12rem] text-[0.8125rem] leading-snug text-ink-muted' aria-live='polite'>
            {status}
          </p>
        </div>
      </div>
    </Tile>
  );
}
