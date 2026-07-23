import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';
import { CONTENT_TRACE_INCLUDES } from './src/lib/content-dirs';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const isDev = process.env.NODE_ENV === 'development';

/*
 * T3: Subresource Integrity (SRI) for /_next/static/* assets.
 *
 * Gated behind ENABLE_SRI so merging to master never turns it on in production.
 * Flip ENABLE_SRI=1 only on a preview branch/deploy to run the ADR verification
 * checklist (docs/adr/2026-07-21-sri-over-nonce-evaluation.md). Production enable
 * is a separate, explicitly-authorized change — not a side effect of this flag.
 *
 * Next 16.2.11 type: experimental.sri is `{ algorithm?: 'sha256'|'sha384'|'sha512' }`,
 * NOT a boolean. Omit the key entirely when disabled so the experiment is inert.
 */
const sriExperiment =
  process.env.ENABLE_SRI === '1' ? ({ sri: { algorithm: 'sha384' } } as const) : {};

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
  /* React Compiler (stable in Next 16): automatic memoization, no manual useMemo needed.
     Requires babel-plugin-react-compiler (installed as devDependency). */
  reactCompiler: true,
  /* Enable View Transitions API (experimental) */
  experimental: {
    viewTransition: true,
    // Persist Turbopack's filesystem cache across dev sessions (Next 16.2).
    // Speeds up cold dev starts; no effect on production build.
    turbopackFileSystemCacheForDev: true,
    // SRI is spread in only when ENABLE_SRI=1 (see sriExperiment above).
    ...sriExperiment,
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
