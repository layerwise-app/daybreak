import { siteConfig } from '~/site.config';
import { Logo } from './Logo';
import { SiteLink } from './SiteLink';

declare const __BUILD_YEAR__: number;

export function Footer() {
  return (
    <footer className='px-5 pb-10 pt-6 sm:px-8'>
      <div className='mx-auto max-w-[1180px] border-t border-ink/10 pt-10'>
        <div className='grid gap-10 md:grid-cols-[1.4fr_1fr_auto] md:items-start'>
          <div className='max-w-sm'>
            <Logo />
            <p className='mt-3 text-[0.9375rem] leading-relaxed text-ink-soft'>
              {siteConfig.tagline} Made by {siteConfig.company}, five people in{' '}
              {siteConfig.companyCity}.
            </p>
          </div>
          <nav aria-label='Footer'>
            <ul className='grid grid-cols-2 gap-x-6 sm:flex sm:flex-wrap sm:gap-x-1'>
              {[...siteConfig.footerLinks, ...siteConfig.social].map((link) => (
                <li key={link.href}>
                  <SiteLink
                    href={link.href}
                    className='flex min-h-11 items-center rounded-full text-[0.9375rem] font-medium text-ink-soft hover:text-ink sm:px-3'
                  >
                    {link.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </nav>
          <SiteLink href={siteConfig.cta.href} className='btn btn-white justify-self-start'>
            {siteConfig.cta.primary}
          </SiteLink>
        </div>
        <div className='mt-10 flex flex-col-reverse items-start gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='text-sm text-ink-muted'>
            © {__BUILD_YEAR__} {siteConfig.company}. {siteConfig.product} is coming{' '}
            {siteConfig.launch.toLowerCase()}.
          </p>
          <a
            href='https://layerwise.app'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex rounded-md'
          >
            <img
              src='https://layerwise.app/powered-by.png'
              alt='Powered by Layerwise'
              width={174}
              height={28}
              loading='lazy'
              decoding='async'
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
