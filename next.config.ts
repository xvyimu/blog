import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { CONTENT_TRACE_INCLUDES } from './src/lib/content-dirs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV === 'development';

// Fail fast if production URL is missing — SEO metadata, OG images,
// canonical URLs, RSS, sitemap, and JSON-LD must not point to localhost.
if (!isDev && !process.env.NEXT_PUBLIC_SITE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SITE_URL is required for production builds. Set it in Vercel project settings or .env.production.',
  );
}

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // HSTS: force HTTPS for 1 year, include subdomains
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  // CSP is set dynamically per-request in src/proxy.ts
];

const nextConfig: NextConfig = {
  /* Enable View Transitions API (experimental) */
  experimental: {
    viewTransition: true,
  },
  /*
   * The content repositories read local MDX/JSON files with fs at request time.
   * Vercel's serverless file tracing cannot infer those dynamic paths, so keep
   * them in every route bundle explicitly.
   */
  outputFileTracingIncludes: CONTENT_TRACE_INCLUDES,
  /* Security headers */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  /* Image optimization: all images are local — no remote patterns needed.
     If remote images are added in the future, add specific hostnames here. */
  images: {
    remotePatterns: [],
  },
};

export default withBundleAnalyzer(nextConfig);
