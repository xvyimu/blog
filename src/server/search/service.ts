import { SEARCH_RESULT_LIMIT, type SearchHit } from '@/lib/search';
import { getSearchCorpus } from './corpus';
import { searchPostsCached } from './engine';

/**
 * 搜索已发布文章的服务端用例。
 * 语料来自 getSearchCorpus（snapshot 只读 search-docs；fs 走 content facade），
 * 再调用缓存 Fuse 引擎。内容读取或引擎异常原样向上抛出，由 Route Handler 映射为安全 500。
 * @param query 原始查询字符串
 * @param limit 返回条数上限，默认共享 SEARCH_RESULT_LIMIT
 * @returns 公开投影后的 SearchHit 列表
 */
export function searchPublishedPosts(
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const posts = getSearchCorpus();
  return searchPostsCached(posts, query, limit);
}
