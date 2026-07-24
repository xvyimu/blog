'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { blurDataFor } from '@/lib/image-blur-data';

interface ImageZoomProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Explicit width from MDX/HTML; falls back to content default. */
  width?: number | string;
  /** Explicit height from MDX/HTML; falls back to content default. */
  height?: number | string;
  /** Responsive sizes hint for next/image. */
  sizes?: string;
  /** Eager-load when true (hero/above-fold only). Default: lazy. */
  priority?: boolean;
  /** next/image encoder quality (1–100). Default: DEFAULT_QUALITY. */
  quality?: number;
  /** Optional LQIP; when set, next/image uses blur placeholder on the thumb. */
  blurDataURL?: string;
}

/** Stable intrinsic defaults when MDX omits width/height (CLS guard). */
export const DEFAULT_WIDTH = 1200;
export const DEFAULT_HEIGHT = 630;
/** Article column ~720px; full-bleed on small screens. */
export const DEFAULT_SIZES = '(max-width: 768px) 100vw, min(720px, 92vw)';
/**
 * Content images are not LCP candidates (lazy by default). Cap encoder quality
 * so WebP/AVIF stay lighter than raw PNG/JPEG without visible prose degradation.
 */
export const DEFAULT_QUALITY = 70;

function parsePositiveDim(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value);
  }
  if (typeof value === 'string') {
    const n = Number.parseFloat(value);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

/**
 * ImageZoom — 文章内图片点击放大查看。
 * 点击图片时弹出全屏遮罩，显示大图，支持 ESC 关闭、点击遮罩关闭、关闭按钮。
 *
 * 可访问性：
 * - role="dialog" + aria-modal="true"
 * - 打开时焦点移入对话框，关闭时返回触发元素
 * - Tab/Shift+Tab 焦点循环（focus trap）
 * - 可见关闭按钮（aria-label="关闭"）
 *
 * 使用 next/image 优化图片加载。优先消费 MDX 上的 width/height；
 * 未知尺寸时用稳定默认值 + CSS height:auto，避免无尺寸 CLS。
 */
export default function ImageZoom({
  src,
  alt,
  className,
  style,
  width,
  height,
  sizes,
  priority = false,
  quality = DEFAULT_QUALITY,
  blurDataURL,
}: ImageZoomProps) {
  const [zoomed, setZoomed] = useState(false);
  const triggerRef = useRef<HTMLImageElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => setZoomed(true), []);
  const close = useCallback(() => setZoomed(false), []);

  useEffect(() => {
    if (!zoomed) return;
    const trigger = triggerRef.current; // Capture ref value for cleanup

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      // Focus trap: Tab cycles within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    // Move focus into dialog on open
    requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      // Return focus to trigger element on close
      trigger?.focus();
    };
  }, [zoomed, close]);

  if (!src) return null;

  const resolvedWidth = parsePositiveDim(width) ?? DEFAULT_WIDTH;
  const resolvedHeight = parsePositiveDim(height) ?? DEFAULT_HEIGHT;
  const resolvedBlur = blurDataURL ?? blurDataFor(src);
  const resolvedSizes = sizes ?? DEFAULT_SIZES;
  const resolvedQuality =
    typeof quality === 'number' && Number.isFinite(quality) && quality > 0
      ? Math.min(100, Math.round(quality))
      : DEFAULT_QUALITY;

  return (
    <>
      <Image
        ref={triggerRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt={alt ?? ''}
        width={resolvedWidth}
        height={resolvedHeight}
        sizes={resolvedSizes}
        quality={resolvedQuality}
        decoding="async"
        loading={priority ? undefined : 'lazy'}
        priority={priority}
        onClick={open}
        className={cn('image-zoom__trigger', className)}
        style={style}
        tabIndex={0}
        role="button"
        aria-label={alt ? `${alt} — 点击放大` : '点击放大图片'}
        placeholder={resolvedBlur ? 'blur' : undefined}
        blurDataURL={resolvedBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        }}
      />
      {zoomed && (
        <div
          ref={dialogRef}
          className="image-zoom-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={alt || '图片预览'}
          tabIndex={-1}
        >
          <button
            ref={closeBtnRef}
            type="button"
            className="image-zoom__close"
            onClick={close}
            aria-label="关闭"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={src}
            alt={alt ?? ''}
            fill
            className="image-zoom__img"
            onClick={(e) => e.stopPropagation()}
            sizes="92vw"
            quality={resolvedQuality}
            decoding="async"
            priority
          />
        </div>
      )}
    </>
  );
}
