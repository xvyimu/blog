'use client';

import dynamic from 'next/dynamic';

/**
 * Defers the parallax controller chunk until after the main shell hydrates.
 * The stage DOM itself stays server-rendered; this only loads pointer/rAF code.
 */
const SiteBackdropParallax = dynamic(
  () => import('@/components/layout/SiteBackdropParallax'),
  { ssr: false },
);

export default function SiteBackdropParallaxGate() {
  return <SiteBackdropParallax />;
}
