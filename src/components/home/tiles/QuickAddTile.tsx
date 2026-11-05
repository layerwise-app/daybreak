import { useEffect, useId, useRef, useState } from 'react';
import { home } from '~/content/home';
import { sampleDay } from '~/content/sample-day';
import { useInView, useReducedMotion } from '~/hooks/use-motion';
import { formatDate, parseQuickAdd, relativeDay, type TokenKind } from '~/lib/quick-add';
import { formatRange } from '~/lib/time';
import { Tile } from '../Tile';

const copy = home.features.tiles.quickAdd;
const TODAY = sampleDay.date;
const KIND_LABEL: Record<TokenKind, string> = {
  date: 'Day',
  time: 'Time',
  duration: 'Length',
  place: 'Place'
};

export function QuickAddTile() {
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const touched = useRef(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const inView = useInView(rootRef, '-20% 0px');
  const reduced = useReducedMotion();

  const parsed = parseQuickAdd(text, TODAY);
  const hasEvent = parsed.title !== '' || parsed.start !== null;

  const typeForMe = () => {
    touched.current = true;
    setAdded(null);
    if (reduced) {
      setText(copy.example);
      return;
    }
    setText('');
    setTyping(true);
  };

  // The first time the tile scrolls into view, type the example.
  useEffect(() => {
    if (!inView || touched.current) return;
    touched.current = true;
    const start = window.setTimeout(() => {
      if (reduced) setText(copy.example);
      else setTyping(true);
    }, 250);
    return () => window.clearTimeout(start);
  }, [inView, reduced]);

  useEffect(() => {
    if (!typing || !inView || text.length >= copy.example.length) return;
    const next = copy.example.slice(0, text.length + 1);
    const pause = /\s/.test(copy.example[text.length]) ? 90 : 38 + ((text.length * 17) % 30);
    const timer = window.setTimeout(() => setText(next), pause);
    return () => window.clearTimeout(timer);
  }, [typing, text, inView]);

  // Keep the highlight layer lined up with the input when it scrolls.
  const syncScroll = (el: HTMLInputElement) => {
    if (mirrorRef.current) mirrorRef.current.style.transform = `translateX(${-el.scrollLeft}px)`;
  };

  const marks: { text: string; kind?: TokenKind }[] = [];
  let cursor = 0;
  for (const token of parsed.tokens) {
    if (token.start > cursor) marks.push({ text: text.slice(cursor, token.start) });
    marks.push({ text: text.slice(token.start, token.end), kind: token.kind });
    cursor = token.end;
  }
  if (cursor < text.length) marks.push({ text: text.slice(cursor) });

  const when =
    parsed.start !== null && parsed.end !== null
      ? `${formatDate(parsed.date)} · ${formatRange(parsed.start, parsed.end)}`
      : `${formatDate(parsed.date)} · all day`;

  return (
    <Tile title={copy.title} body={copy.body} className='bento-quick' demoClassName='gap-4 px-6 pb-6 pt-5 sm:px-7 sm:pb-7'>
      <div className='contents'>
        <form
          ref={rootRef}
          className='quick-field'
          onSubmit={(e) => {
            e.preventDefault();
            if (hasEvent) setAdded(relativeDay(parsed.date, TODAY));
          }}
        >
          <label htmlFor={inputId} className='sr-only'>
            Quick add an event
          </label>
          <div className='quick-input-wrap'>
            <div className='quick-mirror' aria-hidden='true'>
              <div ref={mirrorRef}>
                {marks.map((m, i) => (
                  <span key={i} data-kind={m.kind}>
                    {m.text}
                  </span>
                ))}
              </div>
            </div>
            <input
              id={inputId}
              className='quick-input'
              value={text}
              placeholder={copy.placeholder}
              autoComplete='off'
              spellCheck={false}
              onChange={(e) => {
                touched.current = true;
                setTyping(false);
                setAdded(null);
                setText(e.target.value);
                syncScroll(e.target);
              }}
              onScroll={(e) => syncScroll(e.currentTarget)}
              onSelect={(e) => syncScroll(e.currentTarget)}
            />
          </div>
          <button type='submit' className='btn btn-ink h-11 px-5 text-[0.9375rem]' disabled={!hasEvent}>
            {copy.addLabel}
          </button>
        </form>

        <div className='flex min-h-8 flex-wrap items-center gap-1.5' aria-live='polite'>
          {parsed.tokens.length ? (
            parsed.tokens.map((t, i) => (
              <span key={`${t.kind}-${i}`} className='quick-token' data-kind={t.kind}>
                <b>{KIND_LABEL[t.kind]}</b> {t.text}
              </span>
            ))
          ) : (
            <button
              type='button'
              className='text-[0.875rem] font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink'
              onClick={typeForMe}
            >
              {copy.typeForMe}
            </button>
          )}
        </div>

        <div className='quick-card ds' data-ready={hasEvent || undefined} data-added={added ? true : undefined}>
          <div className='ds-event quick-event' data-kind='social'>
            <div className='min-w-0'>
              <div className='truncate text-[1rem] font-[650] tracking-[-0.01em]'>
                {parsed.title || 'New event'}
              </div>
              <div className='num mt-0.5 truncate text-[0.8125rem] font-bold'>{when}</div>
              <div className='mt-0.5 truncate text-[0.8125rem] font-medium'>
                {parsed.place ?? 'No place yet'}
              </div>
            </div>
          </div>
          <span className='quick-added' aria-live='polite'>
            {added ? `Added · ${added}` : ''}
          </span>
        </div>
      </div>
    </Tile>
  );
}
