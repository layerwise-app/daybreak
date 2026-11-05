import { IPadFrame, IPhoneFrame, MacFrame } from '~/components/devices/Devices';
import { IPadDayScreen } from '~/components/screens/IPadDayScreen';
import { MacWeekScreen } from '~/components/screens/MacWeekScreen';
import { ScreenSlot } from '~/components/screens/ScreenSlot';
import { TodayScreen } from '~/components/screens/TodayScreen';
import { home } from '~/content/home';
import { DEMO_NOW, dayEvents, dayTodos } from '~/lib/day';

export function Everywhere() {
  const content = home.devices;
  return (
    <section id={content.id} aria-labelledby='devices-title' className='section overflow-hidden'>
      <div className='section-head text-center'>
        <p className='eyebrow'>{content.eyebrow}</p>
        <h2 id='devices-title' className='section-title mx-auto'>
          {content.headline}
        </h2>
        <p className='section-lede mx-auto'>{content.body}</p>
      </div>

      <div className='devices-stage'>
        <div className='devices-sky' aria-hidden='true' />
        <MacFrame label={`Daybreak on Mac. ${content.captions.mac}`} className='devices-mac'>
          <ScreenSlot id='devices-mac' sizes='(min-width: 1024px) 700px, 92vw'>
            <MacWeekScreen />
          </ScreenSlot>
        </MacFrame>
        <IPadFrame label={`Daybreak on iPad. ${content.captions.ipad}`} className='devices-ipad'>
          <ScreenSlot id='devices-ipad' sizes='(min-width: 1024px) 440px, 58vw'>
            <IPadDayScreen />
          </ScreenSlot>
        </IPadFrame>
        <IPhoneFrame label={`Daybreak on iPhone. ${content.captions.iphone}`} className='devices-iphone'>
          <ScreenSlot id='devices-iphone' sizes='(min-width: 1024px) 160px, 26vw'>
            <TodayScreen now={DEMO_NOW} events={dayEvents} todos={dayTodos} />
          </ScreenSlot>
        </IPhoneFrame>
      </div>

      <ul className='mx-auto mt-10 grid max-w-[1000px] gap-4 text-center text-[0.9375rem] text-ink-soft sm:grid-cols-3'>
        <li>{content.captions.ipad}</li>
        <li>{content.captions.mac}</li>
        <li>{content.captions.iphone}</li>
      </ul>
    </section>
  );
}
