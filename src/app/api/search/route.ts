import { NextResponse } from 'next/server';
import {
  SEARCH_MAX_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_RESULT_LIMIT,
  type SearchResponse,
  type SearchErrorBody,
} from '@/lib/search';
import {
  checkSearchRateLimit,
  clientKeyFromRequest,
  searchPublishedPosts,
} from '@/server/search';

/** 显式 Node runtime：Fuse 与基于 fs 的内容读取不面向 edge。 */
export const runtime = 'nodejs';

/**
 * GET /api/search?q=&limit=
 *
 * 服务端用例：参数校验与 HTTP 映射；搜索与限流委托 `@/server/search`。
 * 限流在 query 校验之前执行；内容异常映射为无泄露 500。
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

  try {
    const results = searchPublishedPosts(q, limit);
    const body: SearchResponse = {
      query: q,
      results,
      count: results.length,
      source: 'server',
    };

    return NextResponse.json(body, {
      headers: cacheHeaders(),
    });
  } catch (error) {
    // 只记录错误类别，绝不向客户端暴露路径或内容。
    console.error(
      '[search] internal failure',
      error instanceof Error ? error.name : typeof error,
    );
    const body: SearchErrorBody = {
      error: 'search unavailable',
      code: 'SERVER_ERROR',
    };
    return NextResponse.json(body, {
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

/** 成功响应缓存头：短 CDN 缓存降低冷启动；缓存命中不计入进程限流。 */
function cacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  };
}
