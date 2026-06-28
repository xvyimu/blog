import { describe, expect, it } from 'vitest';
import { resolveSiteUrl } from '@/lib/constants';

describe('resolveSiteUrl', () => {
  it('uses NEXT_PUBLIC_SITE_URL when provided', () => {
    expect(resolveSiteUrl({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
    })).toBe('https://example.com');
  });

  it('trims trailing slashes from NEXT_PUBLIC_SITE_URL', () => {
    expect(resolveSiteUrl({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'https://example.com///',
    })).toBe('https://example.com');
  });

  it('falls back to localhost outside production', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3000');
  });

  it('throws in production when NEXT_PUBLIC_SITE_URL is missing', () => {
    expect(() => resolveSiteUrl({ NODE_ENV: 'production' })).toThrow(
      'NEXT_PUBLIC_SITE_URL is required',
    );
  });

  it('throws when NEXT_PUBLIC_SITE_URL is not an absolute http(s) URL', () => {
    expect(() => resolveSiteUrl({
      NODE_ENV: 'production',
      NEXT_PUBLIC_SITE_URL: 'example.com',
    })).toThrow('absolute http(s) URL');
  });
});
