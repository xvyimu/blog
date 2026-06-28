import { getAllPosts } from './posts';
import { TAG_TO_CATEGORY } from './constants';
import { CategoryInfo } from '@/types';
import { decodeRouteSegment } from './utils';

/** 从文章标签推断分类 */
export function inferCategory(tags: string[]): string | null {
  for (const tag of tags) {
    const category = TAG_TO_CATEGORY[tag];
    if (category) return category;
  }
  return null;
}

/** 聚合所有分类，附带文章数和覆盖标签，按文章数降序 */
export function getAllCategories(): CategoryInfo[] {
  const posts = getAllPosts();
  const map = new Map<string, { count: number; tags: Set<string> }>();

  for (const post of posts) {
    const category = inferCategory(post.tags);
    if (!category) continue;

    const existing = map.get(category);
    if (existing) {
      existing.count += 1;
      for (const tag of post.tags) {
        if (TAG_TO_CATEGORY[tag] === category) {
          existing.tags.add(tag);
        }
      }
    } else {
      const catTags = new Set(
        post.tags.filter((t) => TAG_TO_CATEGORY[t] === category)
      );
      map.set(category, { count: 1, tags: catTags });
    }
  }

  return Array.from(map.entries())
    .map(([name, { count, tags }]) => ({
      name,
      slug: name,       // 中文 URL 友好，Next.js 自动 encodeURI
      count,
      tags: Array.from(tags).sort(),
    }))
    .sort((a, b) => b.count - a.count);
}

/** 按分类筛选文章 */
export function getPostsByCategory(categoryName: string) {
  const decodedCategoryName = decodeRouteSegment(categoryName);
  return getAllPosts().filter((post) => {
    const inferred = inferCategory(post.tags);
    return inferred === decodedCategoryName;
  });
}

/** 检查分类是否存在 */
export function isValidCategory(categoryName: string): boolean {
  const decodedCategoryName = decodeRouteSegment(categoryName);
  return getAllCategories().some((c) => c.slug === decodedCategoryName);
}

/** 用于 generateStaticParams */
export function getAllCategorySlugs(): string[] {
  return getAllCategories().map((c) => c.slug);
}
