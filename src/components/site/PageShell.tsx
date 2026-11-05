import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/** Header, main content, and footer for every page. */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id='main'>{children}</main>
      <Footer />
    </>
  );
}

/** A short text page like Privacy or Terms. */
export function TextPage({
  eyebrow,
  title,
  updated,
  children
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <article className='px-5 pb-24 pt-16 sm:px-8 sm:pt-24'>
        <div className='mx-auto max-w-[44rem]'>
          <p className='eyebrow'>{eyebrow}</p>
          <h1 className='display mt-3 text-[clamp(2.75rem,7vw,4.5rem)]'>{title}</h1>
          <p className='mt-5 text-[0.9375rem] font-medium text-ink-muted'>Last updated {updated}</p>
          <div className='prose-page mt-10'>{children}</div>
        </div>
      </article>
    </PageShell>
  );
}
