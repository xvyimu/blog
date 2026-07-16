'use client';

import { useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/lib/utils';

export default function MagneticCard({
  children,
  as: Tag = 'article',
  className = '',
  strength = 4,
  spotlightSize = 320,
}: {
  children: ReactNode;
  as?: 'article' | 'div' | 'section' | 'li';
  className?: string;
  strength?: number;
  spotlightSize?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const frameIdRef = useRef<number | null>(null);
  const latestRef = useRef({ clientX: 0, clientY: 0 });

  useEffect(() => {
    return () => {
      if (frameIdRef.current !== null) {
        window.cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, []);

  const applyPosition = () => {
    frameIdRef.current = null;
    const el = ref.current;
    if (!el || reduced) return;

    const { clientX, clientY } = latestRef.current;
    const rect = el.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const x = localX / rect.width - 0.5;
    const y = localY / rect.height - 0.5;

    el.style.transform = `perspective(720px) rotateY(${x * strength}deg) rotateX(${
      -y * strength
    }deg) translateY(-3px)`;
    el.style.setProperty('--glow-x', `${(x + 0.5) * 100}%`);
    el.style.setProperty('--glow-y', `${(y + 0.5) * 100}%`);
    el.style.setProperty('--spotlight-x', `${localX}px`);
    el.style.setProperty('--spotlight-y', `${localY}px`);
    el.style.setProperty('--spotlight-size', `${spotlightSize}px`);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch' || reduced) return;

    latestRef.current = { clientX: event.clientX, clientY: event.clientY };
    if (frameIdRef.current === null) {
      frameIdRef.current = window.requestAnimationFrame(applyPosition);
    }
  };

  const handleLeave = () => {
    if (frameIdRef.current !== null) {
      window.cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
    el.style.removeProperty('--glow-x');
    el.style.removeProperty('--glow-y');
    el.style.removeProperty('--spotlight-x');
    el.style.removeProperty('--spotlight-y');
    el.style.removeProperty('--spotlight-size');
  };

  return (
    <Tag
      ref={ref as never}
      className={cn('magnetic-card', className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handleLeave}
    >
      {children}
    </Tag>
  );
}
