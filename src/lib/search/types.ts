/** 公开搜索结果卡片：不含 searchText、完整 headings 或正文统计。 */
export type SearchResultItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category?: string;
  series?: string;
  featured?: boolean;
  excerpt: string;
};

/**
 * 命中字段的高亮索引；仅保留可展示字段的 match。
 * title/tags/category/series 在服务端投影后可省略 value（用 item 同名字段）。
 */
export type SearchMatch = {
  key?: string;
  value?: string;
  indices: readonly [number, number][];
};

/** 单条搜索命中：公开卡片 + 过滤后的 match + 可选分数。 */
export type SearchHit = {
  item: SearchResultItem;
  matches: readonly SearchMatch[];
  score?: number;
};

/**
 * 成功响应 body。
 * count 是应用 limit 后的实际返回条数，不是未截断总匹配数。
 */
export type SearchResponse = {
  query: string;
  results: SearchHit[];
  count: number;
  source: 'server';
};

/**
 * 错误响应 body。
 * BAD_REQUEST 供客户端分类保留，当前 Route Handler 不主动返回该 code。
 */
export type SearchErrorBody = {
  error: string;
  code: 'QUERY_TOO_LONG' | 'RATE_LIMITED' | 'BAD_REQUEST' | 'SERVER_ERROR';
};

/** 客户端错误状态机：与 SearchErrorBody.code 及网络失败对应。 */
export type SearchErrorState =
  'bad_request' | 'network' | 'query_too_long' | 'rate_limited' | 'server';
