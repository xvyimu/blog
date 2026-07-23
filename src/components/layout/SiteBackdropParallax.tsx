'use client';

import { useEffect } from 'react';
import { usePrefersFinePointer } from '@/hooks/usePrefersFinePointer';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * SiteBackdropParallax — 全站背景视差跟随 client 层.
 *
 * 通过 document.querySelector 找到 <SiteBackdropStage/> 渲染的 .site-backdrop__stage 节点,
 * 监听 window pointermove/mouseleave, 更新 --parallax-x/y CSS 变量驱动 stage transform.
 *
 * 设计取舍: 用 DOM 选择器而非 ref, 因 Stage 是 server component 无法跨 SSG/CSR 边界传 ref.
 * returns null: 不渲染 DOM, 仅副作用.
 *
 * Gate: prefers-reduced-motion 或 coarse pointer 时不挂 pointer 监听 (CH-PERF-006).
 * 客户端 JS 体积 < 1KB gzipped.
 */
export default function SiteBackdropParallax() {
  const reduced = usePrefersReducedMotion();
  const finePointer = usePrefersFinePointer();
  const motionEnabled = !reduced && finePointer;

  useEffect(() => {
    if (!motionEnabled) return;

    const stage = document.querySelector<HTMLElement>('.site-backdrop__stage');
    if (!stage) return;

    let frameId: number | null = null;
    let latestClientX = 0;
    let latestClientY = 0;

    const applyPosition = () => {
      frameId = null;
      const x = (latestClientX / window.innerWidth - 0.5) * 2;
      const y = (latestClientY / window.innerHeight - 0.5) * 2;
      stage.style.setProperty('--parallax-x', `${x * 8}px`);
      stage.style.setProperty('--parallax-y', `${y * 8}px`);
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;

      latestClientX = event.clientX;
      latestClientY = event.clientY;
      if (frameId === null) {
        frameId = window.requestAnimationFrame(applyPosition);
      }
    };

    const handleLeave = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
      stage.style.setProperty('--parallax-x', '0px');
      stage.style.setProperty('--parallax-y', '0px');
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
      stage.style.setProperty('--parallax-x', '0px');
      stage.style.setProperty('--parallax-y', '0px');
    };
  }, [motionEnabled]);

  return null;
}
