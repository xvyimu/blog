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

/** match.value 可省略的字段：UI 用 item 对应字段 + indices 高亮。 */
const VALUELESS_MATCH_KEYS = new Set(['title', 'tags', 'category', 'series']);

/**
 * 将 PostMeta 投影为 wire 安全的搜索卡片。
 * 丢弃 searchText、headings、wordCount 等内部索引字段；
 * 省略空的可选字段与 featured:false，减小 JSON 体积。
 */
export function toSearchResultItem(post: PostMeta): SearchResultItem {
  const item: SearchResultItem = {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    excerpt: post.excerpt,
  };
  if (post.category) item.category = post.category;
  if (post.series) item.series = post.series;
  if (post.featured) item.featured = true;
  return item;
}

/**
 * 过滤 match 元数据，仅保留公开卡片字段上的高亮。
 * 防止 headings/searchText 等索引键出现在 API 响应中。
 *
 * 传入 item 时进一步瘦身：
 * - description/excerpt 只保留与 UI 展示文案（excerpt || description）一致的一条；
 * - title/tags/category/series 省略重复的 value（客户端用 item 字段）。
 * 不传 item 时保持完整 value，兼容客户端嵌入索引路径。
 */
export function toSearchResultMatches(
  matches: readonly SearchMatch[] = [],
  item?: SearchResultItem,
): SearchMatch[] {
  const visible = matches.filter(
    (match) => match.key && DISPLAY_MATCH_KEYS.has(match.key),
  );

  if (!item) {
    return visible.map((match) => ({
      key: match.key,
      value: match.value,
      indices: match.indices,
    }));
  }

  const descriptionText = item.excerpt || item.description;

  return visible
    .filter((match) => {
      if (match.key === 'description' || match.key === 'excerpt') {
        return match.value === descriptionText;
      }
      return true;
    })
    .map((match) => {
      if (match.key && VALUELESS_MATCH_KEYS.has(match.key)) {
        return {
          key: match.key,
          indices: match.indices,
        };
      }
      return {
        key: match.key,
        value: match.value,
        indices: match.indices,
      };
    });
}
