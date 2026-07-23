import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import type { PostMeta } from '@/types';
import {
  FUSE_SEARCH_OPTIONS,
  SEARCH_RESULT_LIMIT,
  toSearchResultItem,
  toSearchResultMatches,
  type SearchHit,
  type SearchMatch,
} from '@/lib/search';

function toHits(results: FuseResult<PostMeta>[]): SearchHit[] {
  return results.map((result) => {
    const item = toSearchResultItem(result.item);
    const matches = toSearchResultMatches((result.matches ?? []) as SearchMatch[], item);
    const hit: SearchHit = { item, matches };
    if (typeof result.score === 'number') {
      // 固定小数位，避免超长 IEEE 尾数膨胀响应
      hit.score = Number(result.score.toFixed(6));
    }
    return hit;
  });
}

/**
 * 对内存中的文章摘要执行一次 Fuse 搜索。
 * @param posts 已发布文章摘要；空数组直接返回空命中
 * @param query 原始查询字符串，内部会 trim
 * @param limit 返回条数上限，默认共享 SEARCH_RESULT_LIMIT
 * @returns 投影后的公开 SearchHit 列表，不含 searchText 等内部字段
 */
export function searchPosts(
  posts: PostMeta[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const q = query.trim();
  if (!q || posts.length === 0) return [];

  const fuse = new Fuse(posts, FUSE_SEARCH_OPTIONS);
  return toHits(fuse.search(q, { limit }));
}

/**
 * 按 PostMeta[] 数组引用缓存 Fuse 实例。
 * getAllPosts() 在生产返回稳定缓存引用，因此相同数组可复用索引；
 * 投影发生在搜索之后，WeakMap 的 key 始终是完整 PostMeta[]。
 */
const fuseByPosts = new WeakMap<PostMeta[], Fuse<PostMeta>>();

/**
 * 带引用缓存的服务端搜索入口。
 * @param posts 稳定数组引用会命中 WeakMap 缓存；新引用会重建 Fuse
 * @param query 原始查询字符串，内部会 trim
 * @param limit 返回条数上限
 * @returns 与 searchPosts 相同的公开投影命中
 */
export function searchPostsCached(
  posts: PostMeta[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const q = query.trim();
  if (!q || posts.length === 0) return [];

  let fuse = fuseByPosts.get(posts);
  if (!fuse) {
    fuse = new Fuse(posts, FUSE_SEARCH_OPTIONS);
    fuseByPosts.set(posts, fuse);
  }

  return toHits(fuse.search(q, { limit }));
}
