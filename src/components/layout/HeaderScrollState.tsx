'use client';

import { useEffect } from 'react';

const SCROLLED_CLASS = 'is-scrolled';
const THRESHOLD_PX = 16;

/**
 * Tiny client island: toggles `.is-scrolled` on the sticky header without
 * forcing the whole Header (nav + brand) into the client tree.
 */
export default function HeaderScrollState() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;

    let frameId: number | null = null;
    let lastScrolled = header.classList.contains(SCROLLED_CLASS);

    const apply = () => {
      frameId = null;
      const scrolled = window.scrollY > THRESHOLD_PX;
      if (scrolled === lastScrolled) return;
      lastScrolled = scrolled;
      header.classList.toggle(SCROLLED_CLASS, scrolled);
    };

    const onScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(apply);
      }
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return null;
}
