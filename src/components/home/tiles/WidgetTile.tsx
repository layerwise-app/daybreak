import { useState } from 'react';
import { home } from '~/content/home';
import { sampleDay } from '~/content/sample-day';
import { DEMO_NOW, dayEvents, dayTodos, nextEvent } from '~/lib/day';
import { formatTime } from '~/lib/time';
import { Tile } from '../Tile';

const copy = home.features.tiles.widgets;
const SIZES = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' }
] as const;
type Size = (typeof SIZES)[number]['id'];

const next = nextEvent(DEMO_NOW)!;
const minutesUntil = next.start - DEMO_NOW;
const upcoming = [
  ...dayEvents.map((e) => ({ id: e.id, title: e.title, start: e.start, kind: e.kind as string })),
  ...dayTodos
    .filter((t) => t.start !== null)
    .map((t) => ({ id: t.id, title: t.title, start: t.start!, kind: 'todo' }))
]
  .filter((item) => item.start >= DEMO_NOW)
  .sort((a, b) => a.start - b.start);

export function WidgetTile() {
  const [size, setSize] = useState<Size>('medium');

  return (
    <Tile title={copy.title} body={copy.body} className='bento-widgets' demoClassName='px-4 pb-4 pt-5 sm:px-6 sm:pb-6'>
      <div role='radiogroup' aria-label='Widget size' className='segmented self-start'>
        {SIZES.map((s) => (
          <button
            key={s.id}
            type='button'
            role='radio'
            aria-checked={size === s.id}
            onClick={() => setSize(s.id)}
            onKeyDown={(e) => {
              const i = SIZES.findIndex((x) => x.id === size);
              const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
              if (!step) return;
              e.preventDefault();
              const nextSize = SIZES[(i + step + SIZES.length) % SIZES.length];
              setSize(nextSize.id);
              (e.currentTarget.parentElement?.children[SIZES.indexOf(nextSize)] as HTMLElement)?.focus();
            }}
            tabIndex={size === s.id ? 0 : -1}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className='widget-wall'>
        <div className='widget ds' data-size={size} aria-live='polite' aria-label={`${size} widget`}>
          <div className='widget-layer' data-for='small'>
            <span className='widget-kicker'>Next</span>
            <span className='widget-title'>{next.title}</span>
            <span className='num widget-time'>{formatTime(next.start)}</span>
            <span className='widget-sub'>in {minutesUntil} min · {next.place}</span>
          </div>
          <div className='widget-layer widget-medium' data-for='medium'>
            <div className='flex min-w-0 flex-col'>
              <span className='widget-kicker'>Next · in {minutesUntil} min</span>
              <span className='widget-title'>{next.title}</span>
              <span className='num widget-time'>{formatTime(next.start)}</span>
            </div>
            <ul className='widget-list'>
              {upcoming.slice(1, 4).map((item) => (
                <li key={item.id} data-kind={item.kind}>
                  <span className='num'>{formatTime(item.start)}</span>
                  <span className='truncate'>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className='widget-layer' data-for='large'>
            <div className='flex items-baseline justify-between'>
              <span className='widget-title !text-[1.05em]'>{sampleDay.weekday}</span>
              <span className='widget-kicker'>{upcoming.length} more today</span>
            </div>
            <ul className='widget-list widget-list-large'>
              {upcoming.slice(0, 7).map((item) => (
                <li key={item.id} data-kind={item.kind}>
                  <span className='num'>{formatTime(item.start)}</span>
                  <span className='truncate'>{item.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Tile>
  );
}
