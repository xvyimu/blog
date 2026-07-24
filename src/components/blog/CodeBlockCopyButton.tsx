'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { useInView } from '@/hooks/useInView';

type CopyState = 'idle' | 'copied' | 'failed';

const COPY_LABELS: Record<CopyState, string> = {
  idle: '复制',
  copied: '已复制 ✓',
  failed: '复制失败',
};

/**
 * Client-only copy control for code blocks.
 * Mounts the interactive button only when near the viewport so long articles
 * do not hydrate every copy control on first paint. Reads code text from the
 * sibling <pre> inside .code-toolbar.
 */
export default function CodeBlockCopyButton({ language }: { language?: string }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(hostRef, { once: true, rootMargin: '240px' });

  return (
    <span
      ref={hostRef}
      className="copy-btn-slot"
      data-copy-ready={inView ? 'true' : 'false'}
    >
      {inView ? <CopyButton hostRef={hostRef} language={language} /> : null}
    </span>
  );
}

function copyAriaLabel(state: CopyState, language?: string): string {
  const lang = language?.trim();
  switch (state) {
    case 'copied':
      return lang ? `已复制 ${lang} 代码` : '已复制代码';
    case 'failed':
      return lang ? `复制 ${lang} 代码失败` : '复制代码失败';
    default:
      return lang ? `复制 ${lang} 代码` : '复制代码';
  }
}

function CopyButton({
  hostRef,
  language,
}: {
  hostRef: RefObject<HTMLSpanElement | null>;
  language?: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const resetCopyState = (state: CopyState) => {
    setCopyState(state);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopyState('idle'), 2000);
  };

  const handleCopy = async () => {
    const toolbar = hostRef.current?.closest('.code-toolbar');
    const codeText = toolbar?.querySelector('code')?.textContent || '';
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(codeText);
      resetCopyState('copied');
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) throw new Error('execCommand copy failed');
        resetCopyState('copied');
      } catch {
        resetCopyState('failed');
      }
    }
  };

  return (
    <button
      className={`copy-btn copy-btn--${copyState}`}
      onClick={handleCopy}
      type="button"
      title={COPY_LABELS[copyState]}
      aria-label={copyAriaLabel(copyState, language)}
      aria-live="polite"
    >
      {COPY_LABELS[copyState]}
    </button>
  );
}
