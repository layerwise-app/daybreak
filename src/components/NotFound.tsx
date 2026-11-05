import { Link } from '@tanstack/react-router';
import { IPhoneFrame } from '~/components/devices/Devices';
import { ScreenSlot } from '~/components/screens/ScreenSlot';
import { TodayScreen } from '~/components/screens/TodayScreen';
import { PageShell } from '~/components/site/PageShell';
import { SiteLink } from '~/components/site/SiteLink';
import { DEMO_NOW } from '~/lib/day';
import { siteConfig } from '~/site.config';

/** The 404 page: the phone shows an empty day. */
export function NotFound() {
  return (
    <PageShell>
      <section className='px-5 pb-20 pt-12 sm:px-8 sm:pt-20'>
        <div className='mx-auto grid max-w-[1100px] items-center gap-12 lg:grid-cols-[1fr_auto]'>
          <div className='text-center lg:text-left'>
            <p className='eyebrow num'>404</p>
            <h1 className='display mx-auto mt-3 max-w-[12ch] text-[clamp(2.75rem,7vw,4.75rem)] lg:mx-0'>
              Nothing planned here.
            </h1>
            <p className='mx-auto mt-6 max-w-[30rem] text-[1.125rem] leading-relaxed text-ink-soft lg:mx-0'>
              This page isn’t on anyone’s calendar. It may have moved, or the link has a typo.
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-3 lg:justify-start'>
              <Link to='/' className='btn btn-ink btn-lg'>
                Back to the home page
              </Link>
              <SiteLink href={siteConfig.cta.href} className='btn btn-soft btn-lg'>
                {siteConfig.cta.primary}
              </SiteLink>
            </div>
          </div>
          <div className='notfound-sky mx-auto'>
            <IPhoneFrame label='Daybreak on iPhone showing an empty day' className='notfound-phone'>
              <ScreenSlot id='not-found' sizes='280px' priority>
                <TodayScreen
                  now={DEMO_NOW}
                  events={[]}
                  todos={[]}
                  empty={{ title: 'Nothing on today', body: 'Not even this page. Enjoy the free time.' }}
                />
              </ScreenSlot>
            </IPhoneFrame>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
