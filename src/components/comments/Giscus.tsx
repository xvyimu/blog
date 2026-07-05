'use client';

import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/lib/site';
import { useInView } from '@/hooks/useInView';

interface GiscusProps {
  repoId?: string;
  category?: string;
  categoryId?: string;
  mapping?: 'pathname' | 'url' | 'title' | 'og:title';
  reactionsEnabled?: '1' | '0';
  inputPosition?: 'top' | 'bottom';
  lang?: string;
}

const giscusDefaults = SITE_CONFIG.giscus;

export default function Giscus({
  repoId = giscusDefaults.repoId,
  category = giscusDefaults.category,
  categoryId = giscusDefaults.categoryId,
  mapping = giscusDefaults.mapping,
  reactionsEnabled = giscusDefaults.reactionsEnabled,
  inputPosition = giscusDefaults.inputPosition,
  lang = giscusDefaults.lang,
}: GiscusProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visible = useInView(sentinelRef, { once: true, rootMargin: '200px' });

  // Load Giscus script when visible
  useEffect(() => {
    if (!visible) return;
    const container = containerRef.current;
    if (!container) return;

    // Avoid double-loading
    if (container.querySelector('script')) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';

    const attrs: Record<string, string> = {
      'data-repo': SITE_CONFIG.giscus.repo,
      'data-repo-id': repoId,
      'data-category': category,
      'data-category-id': categoryId,
      'data-mapping': mapping,
      'data-reactions-enabled': reactionsEnabled,
      'data-emit-metadata': '0',
      'data-input-position': inputPosition,
      'data-theme': 'preferred_color_scheme',
      'data-lang': lang,
      'data-loading': 'lazy',
    };

    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });

    container.appendChild(script);
  }, [
    visible,
    repoId,
    category,
    categoryId,
    mapping,
    reactionsEnabled,
    inputPosition,
    lang,
  ]);

  // Sync theme with giscus when site theme changes
  useEffect(() => {
    if (!visible) return;

    const sendTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const giscusTheme = isDark ? 'dark' : 'light';
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          { giscus: { setConfig: { theme: giscusTheme } } },
          'https://giscus.app',
        );
      }
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class') {
          sendTheme();
          break;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    const sendThemeWhenReady = () => {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
      if (iframe) {
        // Clean up load listener on unmount — { once: true } only fires once,
        // but if component unmounts before load event, listener leaks.
        const onLoad = () => sendTheme();
        iframe.addEventListener('load', onLoad);
        sendTheme();
        return () => {
          iframe.removeEventListener('load', onLoad);
        };
      } else {
        const bodyObserver = new MutationObserver(() => {
          const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
          if (iframe) {
            bodyObserver.disconnect();
            const onLoad = () => sendTheme();
            iframe.addEventListener('load', onLoad);
            sendTheme();
          }
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
        const timeout = setTimeout(() => bodyObserver.disconnect(), 10000);
        return () => {
          clearTimeout(timeout);
          bodyObserver.disconnect();
        };
      }
    };

    const cleanupReady = sendThemeWhenReady();

    return () => {
      observer.disconnect();
      cleanupReady?.();
    };
  }, [visible]);

  return (
    <div ref={sentinelRef} className="mt-16" data-testid="giscus-comments">
      {visible && <div ref={containerRef} />}
      {!visible && (
        <div
          className="flex items-center justify-center py-12 text-[var(--text-dim)] text-sm"
          data-testid="giscus-placeholder"
        >
          滚动到此处加载评论
        </div>
      )}
    </div>
  );
}
