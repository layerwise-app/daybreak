import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { home } from '~/content/home';
import { dayEvents } from '~/lib/day';
import { moveEvent, type Block, type Move } from '~/lib/reschedule';
import { formatRange, formatTime, toMinutes } from '~/lib/time';
import { Tile } from '../Tile';

const copy = home.features.tiles.reschedule;
const MIN = toMinutes(copy.range.start);
const MAX = toMinutes(copy.range.end);
const STEP = 15;
const OPTIONS = { min: MIN, max: MAX, step: STEP };
const HOURS = Array.from({ length: (MAX - MIN) / 60 + 1 }, (_, i) => MIN / 60 + i);

const visible = dayEvents.filter((e) => e.start >= MIN && e.end <= MAX);
const initial: Block[] = visible.map(({ id, start, end }) => ({ id, start, end }));
const byId = new Map(visible.map((e) => [e.id, e]));

function describe(id: string, start: number, moved: Move[]): string {
  const name = byId.get(id)?.title ?? id;
  const head = `${name} moved to ${formatTime(start)}.`;
  if (!moved.length) return head;
  return `${head} ${moved
    .map((m) => `${byId.get(m.id)?.title} slid ${m.to > m.from ? 'later' : 'earlier'} to ${formatTime(m.to)}`)
    .join('; ')}.`;
}

export function RescheduleTile() {
  const [blocks, setBlocks] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [note, setNote] = useState<{ text: string; key: number } | null>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const drag = useRef<{ id: string; y: number; start: number; base: Block[]; moved: boolean } | null>(null);

  const changed = useMemo(
    () => blocks.some((b, i) => b.start !== initial[i].start),
    [blocks]
  );

  const commit = (id: string, start: number, base: Block[]) => {
    const result = moveEvent(base, id, start, OPTIONS);
    setBlocks(result.blocks);
    return result;
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const block = blocks.find((b) => b.id === id)!;
    drag.current = { id, y: e.clientY, start: block.start, base: blocks, moved: false };
    setDragging(id);
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    const column = columnRef.current;
    if (!d || !column) return;
    const perMinute = column.getBoundingClientRect().height / (MAX - MIN);
    const delta = (e.clientY - d.y) / perMinute;
    if (Math.abs(e.clientY - d.y) > 3) d.moved = true;
    commit(d.id, d.start + delta, d.base);
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    if (!d || !d.moved || !columnRef.current) return;
    const perMinute = columnRef.current.getBoundingClientRect().height / (MAX - MIN);
    const result = commit(d.id, d.start + (e.clientY - d.y) / perMinute, d.base);
    const start = result.blocks.find((b) => b.id === d.id)!.start;
    if (start !== d.start) setNote({ text: describe(d.id, start, result.moved), key: Date.now() });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const step = e.key === 'ArrowUp' ? -STEP : e.key === 'ArrowDown' ? STEP : 0;
    if (!step) return;
    e.preventDefault();
    const block = blocks.find((b) => b.id === id)!;
    const result = commit(id, block.start + step, blocks);
    const start = result.blocks.find((b) => b.id === id)!.start;
    if (start !== block.start) setNote({ text: describe(id, start, result.moved), key: Date.now() });
  };

  const reset = () => {
    setBlocks(initial);
    setNote(null);
  };

  return (
    <Tile
      title={copy.title}
      body={copy.body}
      className='bento-reschedule bg-sky-soft/60'
      demoClassName='px-4 pb-4 pt-5 sm:px-6 sm:pb-6'
      aside={
        <button
          type='button'
          onClick={reset}
          disabled={!changed}
          className='btn btn-white -mr-1 -mt-1 h-11 px-4 text-[0.875rem] disabled:invisible'
        >
          Reset
        </button>
      }
    >
      <div className='reschedule-card ds flex-1 rounded-[22px] p-3 pr-4 shadow-[0_0_0_1px_rgb(28_26_23/0.06),0_10px_30px_-18px_rgb(28_26_23/0.35)]'>
        <div className='mb-2 flex items-baseline justify-between px-1'>
          <span className='text-[0.9375rem] font-[650] tracking-[-0.01em]'>Thursday</span>
          <span className='text-[0.8125rem] font-medium text-ink-muted'>Morning to mid-afternoon</span>
        </div>
        <div ref={columnRef} className='reschedule-column'>
          {HOURS.map((h, i) => (
            <div
              key={h}
              className='reschedule-hour'
              style={{ top: `${(i / (HOURS.length - 1)) * 100}%` }}
            >
              <span className='num'>{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
          {blocks.map((b) => {
            const event = byId.get(b.id)!;
            const minutes = b.end - b.start;
            return (
              <button
                key={b.id}
                type='button'
                className='reschedule-event ds-event'
                data-kind={event.kind}
                data-dragging={dragging === b.id || undefined}
                data-compact={minutes < 40 || undefined}
                style={{
                  top: `${((b.start - MIN) / (MAX - MIN)) * 100}%`,
                  height: `${(minutes / (MAX - MIN)) * 100}%`
                }}
                aria-labelledby={`${hintId}-${b.id}`}
                aria-describedby={hintId}
                onPointerDown={(e) => onPointerDown(e, b.id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(e) => onKeyDown(e, b.id)}
              >
                <span id={`${hintId}-${b.id}`} className='flex min-w-0 flex-col items-start gap-0.5 text-left'>
                  <span className='truncate text-[0.875rem] font-[650] leading-tight'>{event.title}</span>
                  <span className='num truncate text-[0.75rem] font-bold'>
                    {formatRange(b.start, b.end)}
                    {event.place ? <span className='font-sans font-medium'> · {event.place}</span> : null}
                  </span>
                </span>
                <span className='reschedule-grip' aria-hidden='true' />
              </button>
            );
          })}
        </div>
      </div>
      <p id={hintId} className='sr-only'>
        {copy.hint}
      </p>
      <p className='reschedule-note' aria-live='polite'>
        {note ? (
          <span key={note.key} className='reschedule-note-pill'>
            <span className='size-2 shrink-0 rounded-full bg-coral' aria-hidden='true' />
            {note.text}
          </span>
        ) : (
          <span className='px-1 text-ink-muted'>{copy.hint}</span>
        )}
      </p>
    </Tile>
  );
}
