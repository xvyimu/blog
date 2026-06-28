import { getAllPosts } from './posts';
import { decodeRouteSegment, slugifyTag } from './utils';
import { TagInfo } from '@/types';

/** 聚合所有标签，附带文章数，按文章数降序 */
export function getAllTags(): TagInfo[] {
  const posts = getAllPosts();
  const map = new Map<string, TagInfo>(); // key: slug

  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = slugifyTag(tag);
      const existing = map.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(slug, { tag, slug, count: 1 });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/** URL slug → 原始标签名；找不到返回 null */
export function getTagNameBySlug(slug: string): string | null {
  const decodedSlug = decodeRouteSegment(slug);
  const found = getAllTags().find((t) => t.slug === decodedSlug);
  return found?.tag ?? null;
}

/** 用于 generateStaticParams */
export function getAllTagSlugs(): string[] {
  return getAllTags().map((t) => t.slug);
}
