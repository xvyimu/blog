import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy — sets per-request CSP headers.
 *
 * Next's App Router emits inline hydration payload scripts in production.
 * A strict CSP therefore needs a per-request nonce that is forwarded to
 * the request and response. Root layout reads x-nonce and applies it to
 * project-owned inline scripts; Next applies it to framework scripts.
 *
 * Vercel Analytics / Speed Insights load scripts from va.vercel-scripts.com
 * (debug) and same-origin /_vercel/* in production; connect stays 'self'.
 */
/** report-to 分组名 + 同源收集路径，两处 header 共用，避免改路径时脱节。 */
const CSP_REPORT_GROUP = 'csp-endpoint';
const CSP_REPORT_PATH = '/api/csp-report';

export function proxy(_request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development';
  const requestHeaders = new Headers(_request.headers);
  // Always forward pathname so RSC Header can mark active links without
  // pulling the whole chrome into a client tree (CH-PERF-006).
  requestHeaders.set('x-pathname', _request.nextUrl.pathname);

  // In dev, skip CSP — Turbopack HMR needs inline scripts and websocket
  if (isDev) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    // strict-dynamic trusts nonce-tagged scripts; allow Vercel + Giscus hosts for their loaders
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://giscus.app https://va.vercel-scripts.com`,
    // style-src keeps 'unsafe-inline' — Tailwind v4 injects inline styles
    // that are harder to nonce. Styles are lower risk than scripts for XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    // Analytics/vitals POST to same-origin /_vercel/*; Giscus API as needed
    "connect-src 'self' https://giscus.app",
    'frame-src https://giscus.app',
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
    // T3: collect-only violation reporting. report-to (Reporting API) is the
    // modern channel; report-uri is kept for browsers that ignore report-to.
    // Enforcement is unchanged — this only adds a telemetry sink, no relaxation.
    `report-uri ${CSP_REPORT_PATH}`,
    `report-to ${CSP_REPORT_GROUP}`,
  ].join('; ');

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  // Reporting-Endpoints binds the report-to group name to the same-origin sink.
  response.headers.set('Reporting-Endpoints', `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.webmanifest
     * - public assets (*.png, *.svg, *.ico, *.xml, *.webp)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:png|svg|ico|xml|webp|jpg|jpeg|gif|txt|rss)$).*)',
  ],
};
