import { useState } from 'react';
import { home } from '~/content/home';
import { Tile } from '../Tile';

const copy = home.features.tiles.habits;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Days in a row up to today (or yesterday, if today isn't done yet). */
function streak(done: boolean[], today: number): number {
  let i = done[today] ? today : today - 1;
  let count = 0;
  while (i >= 0 && done[i]) {
    count++;
    i--;
  }
  return count;
}

export function HabitsTile() {
  const [habits, setHabits] = useState(() => copy.habits.map((h) => ({ ...h, done: [...h.done] })));

  const toggle = (habit: number, day: number) =>
    setHabits((list) =>
      list.map((h, i) => (i === habit ? { ...h, done: h.done.map((d, j) => (j === day ? !d : d)) } : h))
    );

  return (
    <Tile title={copy.title} body={copy.body} className='bento-habits' demoClassName='px-6 pb-6 pt-5 sm:px-7 sm:pb-7'>
      <div className='habits'>
        <div className='habits-days' aria-hidden='true'>
          <span />
          {copy.days.map((d, i) => (
            <span key={i} data-today={i === copy.todayIndex || undefined}>
              {d}
            </span>
          ))}
        </div>
        {habits.map((h, hi) => {
          const count = streak(h.done, copy.todayIndex);
          return (
            <div key={h.name} className='habit-row' role='group' aria-label={h.name}>
              <span className='habit-name'>
                <b>{h.name}</b>
                <span className='habit-streak num' data-hot={count >= 3 || undefined} aria-live='polite'>
                  {count ? `${count}-day streak` : 'No streak yet'}
                </span>
              </span>
              {h.done.map((done, di) => {
                const future = di > copy.todayIndex;
                return (
                  <button
                    key={di}
                    type='button'
                    className='habit-dot'
                    aria-pressed={done}
                    aria-label={`${DAY_NAMES[di]}${di === copy.todayIndex ? ' (today)' : ''}`}
                    disabled={future}
                    data-today={di === copy.todayIndex || undefined}
                    onClick={() => toggle(hi, di)}
                  >
                    <span />
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </Tile>
  );
}
