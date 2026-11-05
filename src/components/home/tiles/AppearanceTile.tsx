import { useState } from 'react';
import { IPhoneFrame } from '~/components/devices/Devices';
import { TodayScreen } from '~/components/screens/TodayScreen';
import { home } from '~/content/home';
import { DEMO_NOW, dayEvents, dayTodos } from '~/lib/day';
import { Tile } from '../Tile';

const copy = home.features.tiles.appearance;

export function AppearanceTile() {
  const [dark, setDark] = useState(false);

  return (
    <Tile
      title={copy.title}
      body={copy.body}
      className='bento-appearance'
      demoClassName='appearance-stage'
      aside={
        <div className='flex shrink-0 items-center gap-2.5'>
          <span aria-hidden='true' className='text-[0.875rem] font-semibold text-ink-soft'>
            Dark
          </span>
          <button
            type='button'
            role='switch'
            aria-checked={dark}
            aria-label={copy.switchLabel}
            className='switch'
            onClick={() => setDark((d) => !d)}
          />
        </div>
      }
    >
      <div className='appearance-phone' data-dark={dark || undefined}>
        <IPhoneFrame label={`Daybreak in ${dark ? 'dark' : 'light'} appearance`}>
          <TodayScreen now={DEMO_NOW} events={dayEvents} todos={dayTodos} theme={dark ? 'dark' : 'light'} />
        </IPhoneFrame>
      </div>
    </Tile>
  );
}
