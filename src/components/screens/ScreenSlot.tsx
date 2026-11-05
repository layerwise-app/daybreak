import { type ReactNode, useEffect, useRef } from 'react';
import { screens, type ScreenId } from '~/content/screens';
import { useActive } from '~/hooks/use-motion';
import { getImage } from '~/lib/images';
import { Picture } from '~/components/Picture';

/**
 * One app screen inside a device frame. Shows the drawn React screen
 * (`children`) unless `src/content/screens.ts` sets an image or video for
 * this slot.
 */
export function ScreenSlot({
  id,
  sizes = '400px',
  priority = false,
  children
}: {
  id: ScreenId;
  /** How wide the screen renders, for picking an image size. */
  sizes?: string;
  /** Load the image right away, for a screen in the first view. */
  priority?: boolean;
  children: ReactNode;
}) {
  const media = screens[id];
  if (!media) return <>{children}</>;
  if (media.type === 'image') {
    return <Picture name={media.image} alt={media.alt} sizes={sizes} priority={priority} className='block size-full' />;
  }
  return <ScreenVideo src={media.src} poster={media.poster} alt={media.alt} />;
}

function ScreenVideo({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const active = useActive(ref);
  // Play only while on screen and the tab is visible.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (active && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void video.play().catch(() => {});
    } else video.pause();
  }, [active]);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster ? getImage(poster).src : undefined}
      aria-label={alt}
      muted
      loop
      playsInline
      preload='metadata'
      className='block size-full object-cover'
    />
  );
}
