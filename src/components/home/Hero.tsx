import { useCallback, useEffect, useRef, useState } from 'react';
import { IPhoneFrame } from '~/components/devices/Devices';
import { ScreenSlot } from '~/components/screens/ScreenSlot';
import { TodayScreen } from '~/components/screens/TodayScreen';
import { SiteLink } from '~/components/site/SiteLink';
import { home } from '~/content/home';
import { sampleDay } from '~/content/sample-day';
import { useActive, useMediaQuery, useReducedMotion } from '~/hooks/use-motion';
import {
  HERO_END,
  HERO_MIDDAY,
  HERO_START,
  dayEvents,
  dayTodos,
  snapTime
} from '~/lib/day';
import { clamp, formatTime } from '~/lib/time';
import { siteConfig } from '~/site.config';

/** Sky colours through the day; neighbouring layers crossfade. */
const SKY = [
  { at: '07:00', top: '#f2b29c', mid: '#f9cfb4', bottom: '#ffe8c2' },
  { at: '09:30', top: '#a6d3f3', mid: '#cde6f7', bottom: '#fff0d6' },
  { at: '13:00', top: '#86c3ef', mid: '#b9ddf6', bottom: '#e8f4fc' },
  { at: '17:00', top: '#93bde3', mid: '#d6dde6', bottom: '#ffdcb8' },
  { at: '19:15', top: '#4f6c9c', mid: '#e7987a', bottom: '#ffc97f' },
  { at: '22:00', top: '#18223a', mid: '#36405e', bottom: '#9b5c4c' }
].map((s) => ({ ...s, minutes: Number(s.at.slice(0, 2)) * 60 + Number(s.at.slice(3)) }));

const TICKS = [7, 10, 13, 16, 19, 22];
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function Hero() {
  const content = home.hero;
  const trackRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  // Matches the CSS that makes the hero tall and sticky.
  const scrollMode = desktop && !reduced;
  const active = useActive(skyRef);
  const [time, setNow] = useState(HERO_START);
  const [autoplay, setAutoplay] = useState(true);
  const [scrubbed, setScrubbed] = useState(false);
  const elapsed = useRef(0);
  // Reduced motion shows the finished midday state until the visitor scrubs.
  const now = reduced && !scrubbed ? HERO_MIDDAY : time;

  // Desktop: scrolling through the hero plays the day from 7:00 to 22:00.
  useEffect(() => {
    if (!scrollMode) return;
    const raf = { id: 0 };
    const update = () => {
      raf.id = 0;
      const track = trackRef.current;
      if (!track) return;
      const distance = track.offsetHeight - window.innerHeight;
      const progress = clamp(-track.getBoundingClientRect().top / Math.max(distance, 1), 0, 1);
      setNow(HERO_START + progress * (HERO_END - HERO_START));
    };
    const onScroll = () => {
      if (!raf.id) raf.id = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf.id);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [scrollMode]);

  // Phones and tablets: play once on load, from 7:00 to midday. Pauses while
  // off screen or the tab is hidden, and stops as soon as the visitor scrubs.
  useEffect(() => {
    if (scrollMode || reduced || !autoplay || !active) return;
    const duration = 5600;
    const raf = { id: 0, start: 0 };
    const tick = (ts: number) => {
      if (!raf.start) raf.start = ts - elapsed.current;
      elapsed.current = ts - raf.start;
      const t = clamp(elapsed.current / duration, 0, 1);
      setNow(HERO_START + ease(t) * (HERO_MIDDAY - HERO_START));
      if (t < 1) raf.id = requestAnimationFrame(tick);
      else setAutoplay(false);
    };
    const begin = () => {
      raf.id = requestAnimationFrame(tick);
    };
    const delay = window.setTimeout(begin, elapsed.current ? 0 : 600);
    return () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(raf.id);
    };
  }, [scrollMode, reduced, autoplay, active]);

  const scrub = useCallback(
    (minutes: number) => {
      if (scrollMode && trackRef.current) {
        // On desktop the scrubber moves the page, which moves the day.
        const track = trackRef.current;
        const distance = track.offsetHeight - window.innerHeight;
        const top = track.getBoundingClientRect().top + window.scrollY;
        const progress = (minutes - HERO_START) / (HERO_END - HERO_START);
        window.scrollTo({ top: top + progress * distance, behavior: 'instant' });
      } else {
        setAutoplay(false);
        setScrubbed(true);
        setNow(minutes);
      }
    },
    [scrollMode]
  );

  const progress = (now - HERO_START) / (HERO_END - HERO_START);

  return (
    <section aria-labelledby='hero-title' className='hero'>
      <div ref={trackRef} className='hero-track'>
        <div className='hero-stage'>
          <div className='mx-auto grid w-full max-w-[1240px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12'>
            <div className='hero-copy text-center lg:text-left'>
              <p className='inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[0.875rem] font-semibold text-ink-soft shadow-[0_0_0_1px_rgb(28_26_23/0.06)]'>
                <span className='size-2 rounded-full bg-coral' aria-hidden='true' />
                {content.eyebrow}
              </p>
              <h1
                id='hero-title'
                className='display mx-auto mt-5 max-w-[11ch] text-[clamp(2.9rem,10.5vw,3.6rem)] lg:mx-0 lg:text-[clamp(3.6rem,5.6vw,5.4rem)]'
              >
                {content.headline}
              </h1>
              <p className='mx-auto mt-6 max-w-[34rem] text-[1.125rem] leading-[1.55] text-ink-soft lg:mx-0 lg:text-[1.25rem]'>
                {content.subhead}
              </p>
              <div className='mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start'>
                <SiteLink href={siteConfig.cta.href} className='btn btn-ink btn-lg'>
                  {siteConfig.cta.primary}
                </SiteLink>
                <a href={content.secondary.href} className='btn btn-soft btn-lg'>
                  {content.secondary.label}
                </a>
              </div>
              <p className='mt-6 text-[0.9375rem] font-medium text-ink-muted'>
                {content.platforms} · {siteConfig.launch}
              </p>
            </div>

            <div ref={skyRef} className='sky-panel'>
              <div className='sky-layers' aria-hidden='true'>
                {SKY.map((layer, i) => {
                  const prev = SKY[i - 1];
                  const opacity = prev
                    ? clamp((now - prev.minutes) / (layer.minutes - prev.minutes), 0, 1)
                    : 1;
                  return (
                    <div
                      key={layer.at}
                      style={{
                        opacity,
                        background: `linear-gradient(180deg, ${layer.top} 0%, ${layer.mid} 58%, ${layer.bottom} 100%)`
                      }}
                    />
                  );
                })}
              </div>
              <IPhoneFrame label={content.phoneLabel} className='hero-phone'>
                <ScreenSlot id='hero-today' sizes='300px' priority>
                  <TodayScreen
                    now={now}
                    events={dayEvents}
                    todos={dayTodos}
                    isPlaced={(todo, i) => now >= snapTime(todo, i)}
                  />
                </ScreenSlot>
              </IPhoneFrame>

              <div className='hero-scrubber'>
                <div className='flex min-w-[4.5rem] flex-col leading-none'>
                  <span className='text-[0.75rem] font-semibold text-ink-muted'>
                    {sampleDay.weekday.slice(0, 3)}
                  </span>
                  <span className='num mt-1 text-[1.5rem] font-extrabold tracking-[-0.02em]'>
                    {formatTime(now, { pad: true })}
                  </span>
                </div>
                <div className='relative flex-1'>
                  <input
                    type='range'
                    className='day-range'
                    min={HERO_START}
                    max={HERO_END}
                    step={5}
                    value={Math.round(now / 5) * 5}
                    aria-label={content.scrubberLabel}
                    aria-valuetext={formatTime(now)}
                    onChange={(e) => scrub(Number(e.target.value))}
                    style={{ '--fill': `${progress * 100}%` } as React.CSSProperties}
                  />
                  <div className='day-range-ticks' aria-hidden='true'>
                    {TICKS.map((h) => (
                      <span key={h} className='num'>
                        {String(h).padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className='hero-hint'>
                {content.scrollHint}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
