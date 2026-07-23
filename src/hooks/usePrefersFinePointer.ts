'use client';

import { useEffect, useState } from 'react';

/**
 * True when the primary pointing device can hover and is fine-grained
 * (mouse / trackpad). Touch-first devices stay false so pointer-driven
 * effects can stay unmounted.
 *
 * SSR + first paint: false (safe default — no motion listeners).
 */
export function usePrefersFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(mq.matches);
    const handler = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return fine;
}
