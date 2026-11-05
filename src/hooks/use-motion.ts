import { type RefObject, useEffect, useState, useSyncExternalStore } from 'react';

function subscribeQuery(query: string) {
  return (onChange: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  };
}

/** A media query that is `serverValue` during server rendering and hydration. */
export function useMediaQuery(query: string, serverValue = false): boolean {
  return useSyncExternalStore(
    subscribeQuery(query),
    () => window.matchMedia(query).matches,
    () => serverValue
  );
}

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/** False while the tab is hidden. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== 'hidden',
    () => true
  );
}

/** True while the element is on screen (with a small margin). */
export function useInView(ref: RefObject<Element | null>, rootMargin = '80px'): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

/** On screen and the tab is visible: the condition for running animation. */
export function useActive(ref: RefObject<Element | null>): boolean {
  const inView = useInView(ref);
  const visible = usePageVisible();
  return inView && visible;
}
