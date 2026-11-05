import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { siteConfig } from '~/site.config';
import { Logo } from './Logo';
import { SiteLink } from './SiteLink';

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className='sticky top-0 z-50 px-3 pt-3 sm:px-5'>
      <a
        href='#main'
        className='sr-only-focusable absolute left-4 top-4 z-50 rounded-full bg-ink px-4 py-2 text-paper'
      >
        Skip to content
      </a>
      <nav
        aria-label='Main'
        className='relative mx-auto flex h-[60px] max-w-[1180px] items-center gap-1 rounded-full bg-white pl-4 pr-2 shadow-[0_0_0_1px_rgb(28_26_23/0.06),0_8px_24px_-12px_rgb(28_26_23/0.25)] sm:pl-5'
      >
        <Link to='/' className='mr-auto flex min-h-11 items-center rounded-full' aria-label={`${siteConfig.product} home`}>
          <Logo />
        </Link>
        <ul className='hidden items-center gap-0.5 lg:flex'>
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <SiteLink
                href={item.href}
                className='flex min-h-11 items-center rounded-full px-3.5 text-[0.9375rem] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink'
              >
                {item.label}
              </SiteLink>
            </li>
          ))}
        </ul>
        <SiteLink href={siteConfig.cta.href} className='btn btn-ink ml-2 h-11 px-4 text-[0.9375rem] sm:px-5'>
          <span className='sm:hidden'>{siteConfig.cta.short}</span>
          <span className='hidden sm:inline'>{siteConfig.cta.primary}</span>
        </SiteLink>
        <button
          ref={buttonRef}
          type='button'
          className='ml-1 grid size-11 place-items-center rounded-full text-ink hover:bg-paper lg:hidden'
          aria-expanded={open}
          aria-controls={menuId}
          aria-label='Menu'
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox='0 0 24 24' className='size-6' aria-hidden='true'>
            <path
              d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 9h16M4 15h16'}
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
            />
          </svg>
        </button>

        <div
          ref={panelRef}
          id={menuId}
          hidden={!open}
          className='absolute inset-x-0 top-[calc(100%+8px)] rounded-[24px] bg-white p-2 shadow-[0_0_0_1px_rgb(28_26_23/0.06),0_24px_48px_-20px_rgb(28_26_23/0.35)] lg:hidden'
        >
          <ul>
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <SiteLink
                  href={item.href}
                  onClick={close}
                  className='flex min-h-12 items-center rounded-2xl px-4 text-[1.0625rem] font-medium hover:bg-paper'
                >
                  {item.label}
                </SiteLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
