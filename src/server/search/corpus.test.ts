import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PostMeta } from '@/types';
import {
  CONTENT_SNAPSHOT_FILES,
  getContentSnapshotRoot,
} from '@/lib/content-snapshot/paths';
import path from 'node:path';
import fs from 'node:fs';

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

vi.mock('@/lib/content-snapshot/paths', async () => {
  const actual = await vi.importActual<typeof import('@/lib/content-snapshot/paths')>(
    '@/lib/content-snapshot/paths',
  );
  return {
    ...actual,
    resolveContentBackend: vi.fn(() => 'fs' as const),
  };
});

import { getAllPosts } from '@/server/content';
import { resolveContentBackend } from '@/lib/content-snapshot/paths';
import { getSearchCorpus, resetSearchCorpusForTests } from './corpus';

describe('getSearchCorpus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSearchCorpusForTests();
    vi.mocked(getAllPosts).mockReturnValue(MOCK_POSTS);
    vi.mocked(resolveContentBackend).mockReturnValue('fs');
  });

  afterEach(() => {
    resetSearchCorpusForTests();
  });

  it('uses content facade when backend is fs', () => {
    const corpus = getSearchCorpus();
    expect(getAllPosts).toHaveBeenCalledTimes(1);
    expect(corpus).toBe(MOCK_POSTS);
  });

  it('reads only search-docs.json when backend is snapshot (no full posts load)', () => {
    vi.mocked(resolveContentBackend).mockReturnValue('snapshot');
    const root = getContentSnapshotRoot();
    const docsPath = path.join(root, CONTENT_SNAPSHOT_FILES.searchDocs);
    expect(fs.existsSync(docsPath)).toBe(true);

    const corpus = getSearchCorpus();
    expect(getAllPosts).not.toHaveBeenCalled();
    expect(Array.isArray(corpus)).toBe(true);
    expect(corpus.length).toBeGreaterThan(0);
    expect(corpus[0]).toHaveProperty('slug');
    expect(corpus[0]).toHaveProperty('searchText');

    // second call reuses process-local cache
    const again = getSearchCorpus();
    expect(again).toBe(corpus);
  });
});
