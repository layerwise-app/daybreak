import type { CSSProperties } from 'react';

/** The small tick inside a done check circle. */
export function Check({ style }: { style?: CSSProperties }) {
  return (
    <svg viewBox='0 0 12 12' fill='none' aria-hidden='true' style={style}>
      <path d='M2.5 6.3 5 8.6l4.6-5.2' stroke='currentColor' strokeWidth='1.9' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

/** The three window buttons on a Mac window. */
export function WindowDots() {
  return (
    <span className='ds-dots' aria-hidden='true'>
      <i />
      <i />
      <i />
    </span>
  );
}
