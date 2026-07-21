import { createHash } from 'node:crypto';
import type { PostFull, PostMeta } from '@/types';
import { extractWikilinks } from '@/lib/posts/wikilink';
import { buildGardenEdges, type GardenGraph } from '@/lib/posts/link-graph';
import { layoutForceGraph } from '@/lib/posts/force-layout';
import {
  CONTENT_SNAPSHOT_VERSION,
  type ContentSnapshotPayload,
  type GardenPosition,
} from './types';

/** Match GardenExplorer defaults so SSR positions align with client layout. */
const DEFAULT_LAYOUT = {
  width: 640,
  height: 420,
  iterations: 140,
} as const;

function sortPostsByDateDesc(posts: PostFull[]): PostFull[] {
  return [...posts].sort((a, b) => {
    if (a.date < b.date) return 1;
    if (a.date > b.date) return -1;
    return a.slug.localeCompare(b.slug);
  });
}

function toMeta(post: PostFull): PostMeta {
  const { content: _content, ...meta } = post;
  return meta;
}

/**
 * Stable content fingerprint (not cryptographic integrity for security —
 * just reproducible drift detection across builds).
 * Includes full body text so equal-length MDX rewrites still change the hash.
 */
export function computeContentHash(posts: PostFull[]): string {
  const lines = sortPostsByDateDesc(posts).map((p) => {
    const bodyFp = createHash('sha256').update(p.content, 'utf8').digest('hex');
    return `${p.slug}\t${p.date}\t${p.title}\t${bodyFp}`;
  });
  return createHash('sha256').update(lines.join('\n'), 'utf8').digest('hex');
}

function assertWikilinksClosed(posts: PostFull[]): void {
  const visibleSlugs = new Set(posts.map((p) => p.slug));
  for (const post of posts) {
    for (const link of extractWikilinks(post.content)) {
      if (!visibleSlugs.has(link.slug)) {
        throw new Error(`[wikilink] broken link: ${post.slug} -> ${link.slug}`);
      }
    }
  }
}

function buildGardenGraph(posts: PostFull[]): GardenGraph {
  const edges = buildGardenEdges(posts);
  const nodes = posts
    .map((m) => ({
      slug: m.slug,
      title: m.title,
      series: m.series,
      tags: m.tags ?? [],
      category: m.category,
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return { nodes, edges };
}

function buildPositions(
  graph: GardenGraph,
  options?: { layoutWidth?: number; layoutHeight?: number },
): Record<string, GardenPosition> {
  const layout = layoutForceGraph(
    graph.nodes.map((n) => n.slug),
    graph.edges.map((e) => ({ source: e.from, target: e.to })),
    {
      width: options?.layoutWidth ?? DEFAULT_LAYOUT.width,
      height: options?.layoutHeight ?? DEFAULT_LAYOUT.height,
      iterations: DEFAULT_LAYOUT.iterations,
    },
  );
  const positions: Record<string, GardenPosition> = {};
  const sorted = [...layout.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [slug, pos] of sorted) {
    positions[slug] = { x: pos.x, y: pos.y };
  }
  return positions;
}

/**
 * Pure builder: input already-parsed **visible** PostFull[], output snapshot DTO.
 * Broken wikilinks throw with the same fail-closed message as createLinkGraph.
 */
export function buildContentSnapshotPayload(
  visiblePosts: PostFull[],
  options?: { layoutWidth?: number; layoutHeight?: number; builtAt?: string },
): ContentSnapshotPayload {
  assertWikilinksClosed(visiblePosts);

  const postsFull = sortPostsByDateDesc(visiblePosts);
  const postsMeta = postsFull.map(toMeta);
  const gardenGraph = buildGardenGraph(postsFull);
  const positions = buildPositions(gardenGraph, options);
  const contentHash = computeContentHash(postsFull);

  return {
    manifest: {
      version: CONTENT_SNAPSHOT_VERSION,
      builtAt: options?.builtAt ?? new Date().toISOString(),
      postCount: postsFull.length,
      contentHash,
    },
    postsMeta,
    postsFull,
    searchDocs: postsMeta,
    gardenGraph,
    positions,
  };
}
