import type { CSSProperties, ReactNode, Ref } from 'react';
import { cn } from '~/lib/utils';

type DeviceProps = {
  /** What the screen shows, for people using a screen reader. */
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/** An iPhone drawn in CSS. Set `font-size` to scale it (19.65em wide). */
export function IPhoneFrame({ label, className, style, children, ref }: DeviceProps) {
  return (
    <div ref={ref} className={cn('device iphone', className)} style={style} role='img' aria-label={label}>
      <div className='iphone-screen'>
        <div className='iphone-island' />
        {children}
      </div>
    </div>
  );
}

/** An iPad in landscape, drawn in CSS (61em wide). */
export function IPadFrame({ label, className, style, children }: DeviceProps) {
  return (
    <div className={cn('device ipad', className)} style={style} role='img' aria-label={label}>
      <span className='ipad-camera' />
      <div className='ipad-screen'>{children}</div>
    </div>
  );
}

/** A MacBook drawn in CSS (86em wide including the base). */
export function MacFrame({ label, className, style, children }: DeviceProps) {
  return (
    <div className={cn('device mac', className)} style={style} role='img' aria-label={label}>
      <div className='mac-lid'>
        <div className='mac-screen'>
          <div className='mac-notch' />
          {children}
        </div>
      </div>
      <div className='mac-base' />
    </div>
  );
}
