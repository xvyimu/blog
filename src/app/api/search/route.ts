import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts';
import {
  searchPostsCached,
  SEARCH_MAX_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_RESULT_LIMIT,
  checkSearchRateLimit,
  clientKeyFromRequest,
  type SearchResponse,
  type SearchErrorBody,
} from '@/lib/search';

/** Explicit Node runtime — Fuse + fs-backed posts are not edge-targeted. */
export const runtime = 'nodejs';

/**
 * GET /api/search?q=&limit=
 *
 * Server-side Fuse over the same PostMeta index as the blog list.
 * Wire payload is SearchResultItem (projected — no searchText).
 *
 * Rate limit is origin best-effort (process Map). CDN-cached 200s do not count.
 * See rate-limit.ts and docs/API.md.
 */
export async function GET(request: Request) {
  const key = clientKeyFromRequest(request);
  const limitState = checkSearchRateLimit(key);
  if (!limitState.ok) {
    const body: SearchErrorBody = {
      error: 'rate limit exceeded',
      code: 'RATE_LIMITED',
    };
    return NextResponse.json(body, {
      status: 429,
      headers: {
        'Retry-After': String(
          Math.max(1, Math.ceil((limitState.resetMs - Date.now()) / 1000)),
        ),
        'X-RateLimit-Remaining': '0',
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q') ?? '';
  const q = rawQ.trim();

  if (q.length > SEARCH_MAX_QUERY_LENGTH) {
    const body: SearchErrorBody = {
      error: `query exceeds ${SEARCH_MAX_QUERY_LENGTH} characters`,
      code: 'QUERY_TOO_LONG',
    };
    return NextResponse.json(body, { status: 400 });
  }

  const rawLimit = Number(searchParams.get('limit') ?? SEARCH_RESULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), SEARCH_MAX_LIMIT)
    : SEARCH_RESULT_LIMIT;

  if (!q) {
    const empty: SearchResponse = {
      query: '',
      results: [],
      count: 0,
      source: 'server',
    };
    return NextResponse.json(empty, {
      headers: cacheHeaders(),
    });
  }

  const posts = getAllPosts();
  const results = searchPostsCached(posts, q, limit);
  const body: SearchResponse = {
    query: q,
    results,
    count: results.length,
    source: 'server',
  };

  return NextResponse.json(body, {
    headers: cacheHeaders(),
  });
}

function cacheHeaders(): Record<string, string> {
  // Content is build-time MDX; short CDN cache is safe and cuts cold latency.
  // Note: cached responses bypass the process-local rate limiter (by design).
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  };
}
