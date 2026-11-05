import { useEffect, useId, useRef, useState } from 'react';
import { LogoMark } from '~/components/site/Logo';
import { home } from '~/content/home';
import { DEMO_NOW, dayEvents, dayTodos, nextEvent } from '~/lib/day';
import { formatRange, formatTime } from '~/lib/time';
import { Tile } from '../Tile';

const copy = home.features.tiles.menuBar;
const next = nextEvent(DEMO_NOW)!;
const later = dayEvents.filter((e) => e.start > next.start).slice(0, 3);
const todosLeft = dayTodos.filter((t) => t.start !== null && t.start >= DEMO_NOW);
const minutes = next.start - DEMO_NOW;

export function MenuBarTile() {
  const [open, setOpen] = useState(true);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuRef.current?.contains(document.activeElement)) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Tile title={copy.title} body={copy.body} className='bento-menubar' demoClassName='menubar-stage'>
      <div className='menubar-desktop'>
        <div className='menubar'>
          {/* Menus that don't fit wrap onto a hidden second line, never half-cut. */}
          <div className='flex h-[2.1em] min-w-0 flex-wrap gap-x-[1.1em] overflow-hidden leading-[2.1em]'>
            {copy.menus.map((m, i) => (
              <span key={m} className={i === 0 ? 'font-bold' : undefined}>
                {m}
              </span>
            ))}
          </div>
          <div className='flex items-center gap-[0.9em]'>
            <button
              ref={buttonRef}
              type='button'
              className='menubar-extra'
              aria-expanded={open}
              aria-controls={menuId}
              onClick={() => setOpen((o) => !o)}
            >
              <LogoMark className='size-[1.2em] rounded-[0.3em]' />
              <span>
                {next.title} · <span className='num'>{minutes}m</span>
              </span>
            </button>
            <span className='num max-sm:hidden' aria-hidden='true'>
              {copy.clock}
            </span>
          </div>
        </div>

        <div ref={menuRef} id={menuId} className='menubar-menu' hidden={!open}>
          <div className='menubar-next ds' data-theme='light'>
            <span className='text-[0.75em] font-semibold text-ink-muted'>Next · in {minutes} min</span>
            <div className='ds-event mt-[0.35em] rounded-[0.6em]' data-kind={next.kind}>
              <div className='py-[0.15em]'>
                <div className='text-[0.95em] font-[650]'>{next.title}</div>
                <div className='num text-[0.8em] font-bold'>
                  {formatRange(next.start, next.end)}
                  {next.place ? <span className='font-sans font-medium'> · {next.place}</span> : null}
                </div>
              </div>
            </div>
          </div>
          <div className='menubar-section'>
            <span className='menubar-heading'>Later today</span>
            <ul>
              {later.map((e) => (
                <li key={e.id}>
                  <span className='num'>{formatTime(e.start)}</span>
                  <span className='truncate'>{e.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className='menubar-section'>
            <span className='menubar-heading'>To-dos still to do · {todosLeft.length}</span>
            <ul>
              {todosLeft.slice(0, 1).map((t) => (
                <li key={t.id}>
                  <span className='num'>{formatTime(t.start!)}</span>
                  <span className='truncate'>{t.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <button type='button' className='menubar-open' onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </Tile>
  );
}
