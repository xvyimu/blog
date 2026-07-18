import type { PostMeta } from '@/types';
import type { SearchMatch, SearchResultItem } from './types';

const DISPLAY_MATCH_KEYS = new Set([
  'title',
  'description',
  'excerpt',
  'tags',
  'category',
  'series',
]);

/**
 * 将 PostMeta 投影为 wire 安全的搜索卡片。
 * 丢弃 searchText、headings、wordCount 等内部索引字段。
 */
export function toSearchResultItem(post: PostMeta): SearchResultItem {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    category: post.category,
    series: post.series,
    featured: post.featured,
    excerpt: post.excerpt,
  };
}

/**
 * 过滤 match 元数据，仅保留公开卡片字段上的高亮。
 * 防止 headings/searchText 等索引键出现在 API 响应中。
 */
export function toSearchResultMatches(
  matches: readonly SearchMatch[] = [],
): SearchMatch[] {
  return matches
    .filter((match) => match.key && DISPLAY_MATCH_KEYS.has(match.key))
    .map((match) => ({
      key: match.key,
      value: match.value,
      indices: match.indices,
    }));
}
