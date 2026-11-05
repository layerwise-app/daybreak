import { siteConfig } from '~/site.config';

/**
 * Daybreak's mark: a sun clearing the horizon, drawn as the app's
 * current-time line, with one timeline row below. Same artwork as
 * `public/logo.svg`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 64 64' className={className} aria-hidden='true'>
      <rect width='64' height='64' rx='17' fill={siteConfig.colors.ink} />
      <path d='M17 36a15 15 0 0 1 30 0Z' fill={siteConfig.colors.butter} />
      <path d='M10.5 42.5h43' stroke={siteConfig.colors.coral} strokeWidth='4' strokeLinecap='round' />
      <circle cx='11' cy='42.5' r='5' fill={siteConfig.colors.coral} />
      <path d='M22 51h20' stroke={siteConfig.colors.paper} strokeOpacity='.35' strokeWidth='3.5' strokeLinecap='round' />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark className='size-8 shrink-0' />
      <span className='text-[1.125rem] font-[650] tracking-[-0.03em]'>{siteConfig.product}</span>
    </span>
  );
}
