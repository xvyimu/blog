import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostMeta } from '@/types';

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
import { searchPublishedPosts } from './service';

describe('searchPublishedPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAllPosts).mockReturnValue(MOCK_POSTS);
  });

  it('reads posts from content facade and returns public projected hits', () => {
    const hits = searchPublishedPosts('Redis', 5);

    expect(getAllPosts).toHaveBeenCalledTimes(1);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].item.slug).toBe('redis-caching-strategies');
    expect((hits[0].item as Record<string, unknown>).searchText).toBeUndefined();
    expect((hits[0].item as Record<string, unknown>).headings).toBeUndefined();
  });

  it('propagates content facade failures to the caller', () => {
    vi.mocked(getAllPosts).mockImplementation(() => {
      throw new Error('D:\\private\\content\\broken.mdx');
    });

    expect(() => searchPublishedPosts('Redis')).toThrow(
      'D:\\private\\content\\broken.mdx',
    );
  });
});
