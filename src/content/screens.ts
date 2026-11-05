/**
 * Swap a drawn app screen for your own screenshot or video. Each key is one
 * screen slot; leave it out to keep the drawn screen.
 *
 * 1. `pnpm add-images path/to/screenshot.png` (writes WebP sizes and adds
 *    the image to `src/content/images.json` under its file name).
 * 2. Add an entry here, for example:
 *      'hero-today': { type: 'image', image: 'screenshot', alt: 'Daybreak Today view' }
 *    or, for a video in `public/`:
 *      'devices-mac': { type: 'video', src: '/videos/week.mp4', poster: 'week-poster', alt: '…' }
 */

export type ScreenId =
  | 'hero-today'
  | 'devices-iphone'
  | 'devices-ipad'
  | 'devices-mac'
  | 'not-found';

export type ScreenMedia =
  | { type: 'image'; image: string; alt: string }
  | { type: 'video'; src: string; poster?: string; alt: string };

export const screens: Partial<Record<ScreenId, ScreenMedia>> = {};
