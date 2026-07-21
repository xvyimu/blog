import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostFull } from '@/types';

const MOCK_POST: PostFull = {
  title: 'Next.js App Router 实战',
  description: '一篇关于 App Router 的文章',
  date: '2026-06-01',
  tags: ['nextjs', 'react'],
  published: true,
  featured: false,
  slug: 'nextjs-app-router',
  readingTime: '8 min read',
  wordCount: 1500,
  excerpt: '一篇关于 App Router 的文章',
  headings: [],
  searchText: 'Next.js App Router',
  category: '前端开发',
  content: '# full body MDX that must NOT leak into the preview response',
};

vi.mock('@/server/content', () => ({
  getPostBySlug: vi.fn(),
}));

import { getPostBySlug } from '@/server/content';
import { GET } from './route';

function requestFor(slug: string) {
  return new Request(`http://localhost/api/preview/${slug}`);
}

function paramsFor(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /api/preview/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns lightweight metadata for a known post', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(MOCK_POST as never);

    const res = await GET(
      requestFor('nextjs-app-router'),
      paramsFor('nextjs-app-router'),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      slug: 'nextjs-app-router',
      title: 'Next.js App Router 实战',
      description: '一篇关于 App Router 的文章',
      date: '2026-06-01',
      category: '前端开发',
      tags: ['nextjs', 'react'],
    });
    // Body MDX must never be projected into the popover payload.
    expect(body).not.toHaveProperty('content');
    expect(body).not.toHaveProperty('searchText');
    expect(body).not.toHaveProperty('headings');
    expect(res.headers.get('Cache-Control')).toBe(
      's-maxage=3600, stale-while-revalidate=86400',
    );
    expect(getPostBySlug).toHaveBeenCalledWith('nextjs-app-router');
  });

  it('returns 404 when the post is missing', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null as never);

    const res = await GET(requestFor('does-not-exist'), paramsFor('does-not-exist'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'not found' });
  });

  it('projects category as null when the post has none', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue({
      ...MOCK_POST,
      category: undefined,
    } as never);

    const res = await GET(
      requestFor('nextjs-app-router'),
      paramsFor('nextjs-app-router'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBeNull();
  });
});
