import type { ImgHTMLAttributes } from 'react';

/**
 * Shared next/image mock for unit tests.
 * Strips next-only props so React does not warn on <img>.
 * Sets data-fill when fill is used (layout tests).
 */
export default function MockNextImage({
  src,
  alt,
  fill,
  priority: _priority,
  preload: _preload,
  sizes: _sizes,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  loader: _loader,
  quality: _quality,
  unoptimized: _unoptimized,
  onLoadingComplete: _onLoadingComplete,
  fetchPriority,
  loading,
  decoding,
  width,
  height,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  preload?: boolean;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  quality?: number;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={String(src ?? '')}
      alt={alt ?? ''}
      data-fill={fill ? 'true' : undefined}
      data-preload={_preload ? 'true' : undefined}
      data-sizes={_sizes}
      data-quality={_quality != null ? String(_quality) : undefined}
      fetchPriority={fetchPriority}
      loading={loading}
      decoding={decoding}
      width={width}
      height={height}
      {...props}
    />
  );
}
