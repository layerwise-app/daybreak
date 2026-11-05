import { type ReactNode, useId } from 'react';
import { cn } from '~/lib/utils';

/** One bento tile: a title, a line of copy, and a small live demo. */
export function Tile({
  title,
  body,
  className,
  demoClassName,
  children,
  aside
}: {
  title: string;
  body: string;
  className?: string;
  demoClassName?: string;
  children: ReactNode;
  /** Optional control shown next to the title, like a switch. */
  aside?: ReactNode;
}) {
  const id = useId();
  return (
    <article aria-labelledby={id} className={cn('tile tile-lift flex flex-col overflow-hidden', className)}>
      <div className='flex items-start gap-4 px-6 pt-6 sm:px-7 sm:pt-7'>
        <div className='min-w-0 flex-1'>
          <h3 id={id} className='text-[1.25rem] font-[650] leading-[1.15] tracking-[-0.022em] text-ink'>
            {title}
          </h3>
          <p className='mt-1.5 max-w-[34ch] text-[0.9375rem] leading-[1.45] text-ink-soft'>{body}</p>
        </div>
        {aside}
      </div>
      <div className={cn('relative flex flex-1 flex-col', demoClassName)}>{children}</div>
    </article>
  );
}
