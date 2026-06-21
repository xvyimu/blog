'use client';

import { useEffect, useState } from 'react';

type Theme = 'system' | 'light' | 'dark';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) setTheme(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const isDark =
      theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);

    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }

    // Sync giscus theme
    const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: isDark ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }, [theme, mounted]);

  const cycle: Theme[] = ['system', 'light', 'dark'];
  const labels: Record<Theme, string> = { system: '🌓', light: '☀️', dark: '🌙' };
  const nextIndex = (cycle.indexOf(theme) + 1) % cycle.length;

  return (
    <button
      type="button"
      onClick={() => setTheme(cycle[nextIndex])}
      className="rounded-md p-1.5 text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
      aria-label={`当前: ${theme}, 切换到: ${cycle[nextIndex]}`}
    >
      {mounted ? labels[theme] : ' '}
    </button>
  );
}