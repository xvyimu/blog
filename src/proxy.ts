import { NextRequest, NextResponse } from 'next/server';
import {
  buildProductionCsp,
  buildReportingEndpointsHeader,
  createCspNonce,
  shouldApplyCsp,
} from '@/lib/csp';

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
 *
 * Policy construction is centralized in src/lib/csp.ts so tests can lock
 * invariants (nonce, no script-src unsafe-inline, report channels) without
 * depending on NextRequest wiring.
 *
 * x-pathname (CH-PERF-006): always forwarded so RSC Header can mark active
 * links without pulling the whole chrome into a client tree. Must also be
 * set in dev (CSP skipped) so soft-nav active state still works.
 */
export function proxy(_request: NextRequest) {
  const requestHeaders = new Headers(_request.headers);
  requestHeaders.set('x-pathname', _request.nextUrl.pathname);

  // In dev, skip CSP — Turbopack HMR needs inline scripts and websocket
  if (!shouldApplyCsp()) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const nonce = createCspNonce();
  const csp = buildProductionCsp(nonce);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  // Reporting-Endpoints binds the report-to group name to the same-origin sink.
  response.headers.set('Reporting-Endpoints', buildReportingEndpointsHeader());
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
