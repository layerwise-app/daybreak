import { home } from '~/content/home';
import { AppearanceTile } from './tiles/AppearanceTile';
import { FocusTile } from './tiles/FocusTile';
import { HabitsTile } from './tiles/HabitsTile';
import { MenuBarTile } from './tiles/MenuBarTile';
import { QuickAddTile } from './tiles/QuickAddTile';
import { RescheduleTile } from './tiles/RescheduleTile';
import { TimeZonesTile } from './tiles/TimeZonesTile';
import { WidgetTile } from './tiles/WidgetTile';

export function Bento() {
  const content = home.features;
  return (
    <section id={content.id} aria-labelledby='features-title' className='section'>
      <div className='section-head'>
        <p className='eyebrow'>{content.eyebrow}</p>
        <h2 id='features-title' className='section-title max-w-[17ch]'>
          {content.headline}
        </h2>
        <p className='section-lede'>{content.intro}</p>
      </div>
      <div className='bento'>
        <RescheduleTile />
        <QuickAddTile />
        <FocusTile />
        <WidgetTile />
        <AppearanceTile />
        <TimeZonesTile />
        <HabitsTile />
        <MenuBarTile />
      </div>
    </section>
  );
}
