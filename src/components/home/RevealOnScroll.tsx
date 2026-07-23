'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useInView } from '@/hooks/useInView';

interface RevealOnScrollProps {
  children: ReactNode;
  as?: 'section' | 'div';
  className?: string;
  delay?: number;
}

export default function RevealOnScroll({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  // Skip IntersectionObserver entirely when reduced motion is preferred —
  // CSS already forces full opacity via @media (prefers-reduced-motion).
  const inView = useInView(ref, {
    once: true,
    threshold: 0.08,
    rootMargin: '0px 0px -48px 0px',
    enabled: !reduced,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion: reveal immediately without transition
    if (reduced) {
      el.classList.add('is-visible');
      return;
    }

    // Reveal when the element scrolls into view
    if (inView) {
      if (delay > 0) {
        el.style.setProperty('--reveal-delay', `${delay}ms`);
      }
      el.classList.add('is-visible');
    }
  }, [reduced, inView, delay]);

  return (
    <Tag ref={ref as never} className={`reveal-on-scroll ${className}`}>
      {children}
    </Tag>
  );
}
