import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostMeta } from '@/types';
import { resetSearchRateLimitForTests, SEARCH_RATE_LIMIT_MAX } from '@/server/search';

const MOCK_POSTS: PostMeta[] = [
  {
    title: 'Redis Caching Strategies',
    description: 'Deep dive into Redis caching patterns',
    date: '2026-06-20',
    tags: ['Redis', '后端'],
    published: true,
    featured: false,
    slug: 'redis-caching-strategies',
    readingTime: '8 min read',
    wordCount: 2000,
    excerpt: 'Deep dive into Redis caching patterns',
    headings: ['Cache Aside', 'Invalidation'],
    searchText: 'Redis Caching Strategies Cache Aside Invalidation backend cache',
  },
];

vi.mock('@/server/content', () => ({
  getAllPosts: vi.fn(() => MOCK_POSTS),
}));

import { getAllPosts } from '@/server/content';
import { GET } from './route';

function requestFor(path: string, headers?: HeadersInit) {
  return new Request(`http://localhost${path}`, { headers });
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllPosts).mockReturnValue(MOCK_POSTS);
    resetSearchRateLimitForTests();
  });

  it('returns empty results for blank q', async () => {
    const res = await GET(requestFor('/api/search?q='));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ query: '', results: [], count: 0, source: 'server' });
  });

  it('returns ranked projected hits for a matching query', async () => {
    const res = await GET(requestFor('/api/search?q=Redis'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('server');
    expect(body.count).toBeGreaterThan(0);
    expect(body.results[0].item.slug).toBe('redis-caching-strategies');
    expect(body.results[0].item.searchText).toBeUndefined();
    expect(body.results[0].item.headings).toBeUndefined();
    const cacheControl = res.headers.get('Cache-Control') ?? '';
    expect(cacheControl).toContain('s-maxage=60');
    expect(cacheControl).toContain('max-age=0');
    expect(cacheControl).toContain('stale-while-revalidate=300');
    expect(res.headers.get('X-RateLimit-Remaining')).toBeNull();
  });

  it('does not expose hidden index fields in match payloads', async () => {
    const res = await GET(requestFor('/api/search?q=Invalidation'));
    expect(res.status).toBe(200);
    const body = await res.json();
    const matchKeys = body.results.flatMap(
      (result: { matches: Array<{ key?: string }> }) =>
        result.matches.map((match) => match.key),
    );
    expect(matchKeys).not.toEqual(expect.arrayContaining(['headings', 'searchText']));
  });

  it('rejects oversized queries with structured error', async () => {
    const q = 'x'.repeat(101);
    const res = await GET(requestFor(`/api/search?q=${q}`));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('QUERY_TOO_LONG');
  });

  it('clamps limit to SEARCH_MAX_LIMIT', async () => {
    const res = await GET(requestFor('/api/search?q=Redis&limit=999'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBeLessThanOrEqual(20);
  });

  it('returns 429 after the rate window is exhausted', async () => {
    const headers = { 'x-vercel-forwarded-for': '203.0.113.9' };
    for (let i = 0; i < SEARCH_RATE_LIMIT_MAX; i++) {
      const res = await GET(requestFor('/api/search?q=Redis', headers));
      expect(res.status).toBe(200);
    }
    const blocked = await GET(requestFor('/api/search?q=Redis', headers));
    expect(blocked.status).toBe(429);
    const body = await blocked.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('returns a no-store structured 500 without leaking internal details', async () => {
    vi.mocked(getAllPosts).mockImplementation(() => {
      throw new Error('D:\\private\\content\\broken.mdx');
    });

    const res = await GET(requestFor('/api/search?q=Redis'));
    expect(res.status).toBe(500);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const body = await res.json();
    expect(body).toEqual({
      error: 'search unavailable',
      code: 'SERVER_ERROR',
    });
    expect(JSON.stringify(body)).not.toContain('private');
  });
});
