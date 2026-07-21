import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { PostFull, PostMeta } from '@/types';
import { buildContentSnapshotPayload, computeContentHash } from './build';
import { resolveContentBackend } from './paths';
import { readContentSnapshot, resetContentSnapshotCacheForTests } from './read';
import { writeContentSnapshot } from './write';
import { createSnapshotPostRepository } from './snapshot-repository';
import { createLinkGraph, createLinkGraphFromSnapshot } from '@/lib/posts/link-graph';

function post(
  slug: string,
  content: string,
  overrides: Partial<PostFull> = {},
): PostFull {
  return {
    title: overrides.title ?? slug,
    description: overrides.description ?? `${slug} desc`,
    date: overrides.date ?? '2026-06-01',
    tags: overrides.tags ?? ['t'],
    published: overrides.published ?? true,
    featured: overrides.featured ?? false,
    slug,
    readingTime: overrides.readingTime ?? '1 min read',
    wordCount: overrides.wordCount ?? 10,
    excerpt: overrides.excerpt ?? 'excerpt',
    headings: overrides.headings ?? ['H'],
    searchText: overrides.searchText ?? slug,
    content,
    ...overrides,
  };
}

function toMeta(p: PostFull): PostMeta {
  const { content: _c, ...meta } = p;
  return meta;
}

const tmpDirs: string[] = [];

afterEach(() => {
  resetContentSnapshotCacheForTests();
  for (const dir of tmpDirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

describe('resolveContentBackend', () => {
  it('honors explicit CONTENT_BACKEND', () => {
    expect(resolveContentBackend({ CONTENT_BACKEND: 'fs' })).toBe('fs');
    expect(resolveContentBackend({ CONTENT_BACKEND: 'snapshot' })).toBe('snapshot');
    expect(resolveContentBackend({ CONTENT_BACKEND: 'SNAPSHOT' })).toBe('snapshot');
  });

  it('defaults production → snapshot, otherwise fs', () => {
    expect(resolveContentBackend({ NODE_ENV: 'production' })).toBe('snapshot');
    expect(resolveContentBackend({ NODE_ENV: 'development' })).toBe('fs');
    expect(resolveContentBackend({ NODE_ENV: 'test' })).toBe('fs');
    expect(resolveContentBackend({})).toBe('fs');
  });

  it('explicit env overrides production default', () => {
    expect(
      resolveContentBackend({
        NODE_ENV: 'production',
        CONTENT_BACKEND: 'fs',
      }),
    ).toBe('fs');
  });
});

describe('buildContentSnapshotPayload', () => {
  it('sorts meta, builds edges, and positions for all nodes', () => {
    const posts = [
      post('b', 'see [[a]]', { date: '2026-06-02', title: 'B' }),
      post('a', 'hello', { date: '2026-06-01', title: 'A' }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });

    expect(payload.manifest.version).toBe(1);
    expect(payload.manifest.postCount).toBe(2);
    expect(payload.manifest.builtAt).toBe('2026-07-01T00:00:00.000Z');
    expect(payload.postsMeta.map((p) => p.slug)).toEqual(['b', 'a']);
    expect(payload.postsMeta.every((p) => !('content' in p))).toBe(true);
    expect(payload.searchDocs).toEqual(payload.postsMeta);
    expect(payload.gardenGraph.edges).toEqual([{ from: 'b', to: 'a' }]);
    expect(payload.gardenGraph.nodes.map((n) => n.slug).sort()).toEqual(['a', 'b']);
    expect(Object.keys(payload.positions).sort()).toEqual(['a', 'b']);
    expect(payload.manifest.contentHash).toBe(computeContentHash(posts));
  });

  it('throws on broken wikilink (fail closed)', () => {
    expect(() =>
      buildContentSnapshotPayload([post('src', 'broken [[missing-xyz]]')]),
    ).toThrow(/\[wikilink\] broken link: src -> missing-xyz/);
  });

  it('handles empty posts', () => {
    const payload = buildContentSnapshotPayload([]);
    expect(payload.manifest.postCount).toBe(0);
    expect(payload.postsFull).toEqual([]);
    expect(payload.gardenGraph).toEqual({ nodes: [], edges: [] });
    expect(payload.positions).toEqual({});
  });

  it('is deterministic for positions given same posts', () => {
    const posts = [
      post('a', '[[b]]', { date: '2026-01-01' }),
      post('b', '[[c]]', { date: '2026-01-02' }),
      post('c', 'ok', { date: '2026-01-03' }),
    ];
    const a = buildContentSnapshotPayload(posts, {
      builtAt: 'fixed',
    });
    const b = buildContentSnapshotPayload(posts, {
      builtAt: 'fixed',
    });
    expect(a.positions).toEqual(b.positions);
    expect(a.manifest.contentHash).toBe(b.manifest.contentHash);
  });

  it('changes contentHash when body is rewritten at the same length', () => {
    const a = post('x', 'abcd', { date: '2026-06-01', title: 'Same' });
    const b = post('x', 'wxyz', { date: '2026-06-01', title: 'Same' });
    expect(a.content.length).toBe(b.content.length);
    expect(computeContentHash([a])).not.toBe(computeContentHash([b]));
  });
});

describe('write + read snapshot', () => {
  it('round-trips payload and skips write when contentHash matches', () => {
    const posts = [
      post('a', 'body', { date: '2026-06-01' }),
      post('b', 'see [[a]]', { date: '2026-06-02' }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });

    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    tmpDirs.push(cwd);

    const first = writeContentSnapshot(payload, { cwd });
    expect(first.wrote).toBe(true);

    const root = path.join(cwd, 'generated', 'content-snapshot');
    const loaded = readContentSnapshot(root);
    expect(loaded.manifest.contentHash).toBe(payload.manifest.contentHash);
    expect(loaded.postsFull.map((p) => p.slug)).toEqual(['b', 'a']);

    const second = writeContentSnapshot(
      buildContentSnapshotPayload(posts, {
        builtAt: '2099-01-01T00:00:00.000Z',
      }),
      { cwd },
    );
    expect(second.wrote).toBe(false);
    if (!second.wrote) {
      expect(second.reason).toBe('unchanged');
    }
  });

  it('throws on missing snapshot files', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-missing-'));
    tmpDirs.push(cwd);
    const root = path.join(cwd, 'generated', 'content-snapshot');
    expect(() => readContentSnapshot(root)).toThrow(/missing file/);
  });

  it('throws on version mismatch', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-ver-'));
    tmpDirs.push(cwd);
    const root = path.join(cwd, 'generated', 'content-snapshot');
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(
      path.join(root, 'manifest.json'),
      JSON.stringify({
        version: 99,
        builtAt: 'x',
        postCount: 0,
        contentHash: 'abc',
      }),
      'utf8',
    );
    expect(() => readContentSnapshot(root)).toThrow(/unsupported version/);
  });
});

describe('createSnapshotPostRepository', () => {
  it('exposes meta without content and full posts by slug', () => {
    const posts = [
      post('alpha', 'content-a', {
        date: '2026-06-10',
        featured: true,
        title: 'Alpha',
      }),
      post('beta', 'links [[alpha]]', {
        date: '2026-06-01',
        title: 'Beta',
      }),
    ];
    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-repo-'));
    tmpDirs.push(cwd);
    writeContentSnapshot(payload, { cwd });
    const root = path.join(cwd, 'generated', 'content-snapshot');

    const repo = createSnapshotPostRepository(root);
    const all = repo.getAllPosts();
    expect(all.map((p) => p.slug)).toEqual(['alpha', 'beta']);
    for (const p of all) {
      expect('content' in p).toBe(false);
    }
    expect(repo.getPostBySlug('alpha')?.content).toBe('content-a');
    expect(repo.getPostBySlug('missing')).toBeNull();
    expect(repo.getFeaturedPosts().map((p) => p.slug)).toEqual(['alpha']);
    expect(repo.getAllPostSlugs()).toEqual(['alpha', 'beta']);
  });
});

describe('link-graph snapshot parity', () => {
  it('matches fs createLinkGraph edge set and neighbors (golden)', () => {
    const posts = [
      post('a', 'see [[b]] and [[c]]', {
        date: '2026-06-01',
        title: 'A',
        tags: ['x'],
      }),
      post('b', 'back [[a]]', {
        date: '2026-06-02',
        title: 'B',
        tags: ['y'],
      }),
      post('c', 'solo', { date: '2026-06-03', title: 'C', tags: [] }),
    ];

    const content: Record<string, string> = Object.fromEntries(
      posts.map((p) => [p.slug, p.content]),
    );
    const metas = posts.map(toMeta);

    const fsGraph = createLinkGraph({
      getVisiblePosts: () => metas,
      getPostContent: (slug) => content[slug] ?? null,
    });

    const payload = buildContentSnapshotPayload(posts, {
      builtAt: '2026-07-01T00:00:00.000Z',
    });
    const metaBySlug = new Map(payload.postsMeta.map((m) => [m.slug, m]));
    const snapGraph = createLinkGraphFromSnapshot({
      metaBySlug,
      edges: payload.gardenGraph.edges,
    });

    expect(snapGraph.getGardenGraph().edges).toEqual(fsGraph.getGardenGraph().edges);
    expect(snapGraph.getGardenGraph().nodes).toEqual(fsGraph.getGardenGraph().nodes);
    expect(snapGraph.getBacklinks('a').map((p) => p.slug)).toEqual(
      fsGraph.getBacklinks('a').map((p) => p.slug),
    );
    expect(snapGraph.getNeighbors('a')).toEqual(fsGraph.getNeighbors('a'));
    expect(() => snapGraph.assertValid()).not.toThrow();
  });
});
