'use client';

import { useEffect, useRef, useState, type AnchorHTMLAttributes } from 'react';

type PreviewData = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string | null;
  tags: string[];
};

type WikilinkPopoverProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  'data-wikilink'?: string;
};

/**
 * G3 popover: wraps <a> tags produced by remark-wikilink.
 * On hover/focus of a wikilink, fetches /api/preview/[slug] and shows a card.
 * Non-wikilink <a> tags (no data-wikilink) render as plain anchors.
 */
export default function WikilinkPopover({
  href,
  'data-wikilink': slug,
  children,
  className,
  ...rest
}: WikilinkPopoverProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  if (!slug) {
    return (
      <a href={href} className={className} {...rest}>
        {children}
      </a>
    );
  }

  const handleEnter = async () => {
    setOpen(true);
    if (preview) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/preview/${slug}`, { signal: controller.signal });
      if (res.ok) {
        setPreview(await res.json());
      }
    } catch {
      /* aborted or network error — silent */
    }
  };

  const handleLeave = () => setOpen(false);

  return (
    <a
      href={href}
      data-wikilink={slug}
      className={`wikilink ${className ?? ''}`.trim()}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      {...rest}
    >
      {children}
      {open && (
        <span className="wikilink__popover" role="tooltip">
          {preview ? (
            <>
              <span className="wikilink__popover-title">{preview.title}</span>
              <span className="wikilink__popover-date">{preview.date}</span>
              <span className="wikilink__popover-desc">{preview.description}</span>
            </>
          ) : (
            <span className="wikilink__popover-loading">加载中…</span>
          )}
        </span>
      )}
    </a>
  );
}
