/**
 * search/ — 前后端共享搜索契约。
 *
 *   options.ts  — Fuse 权重与查询限制
 *   types.ts    — API 与客户端共用的 wire 类型
 *   project.ts  — PostMeta → SearchResultItem 纯投影
 *
 * 服务端引擎与限流实现位于 `@/server/search`，本目录不得重导出。
 */
export {
  FUSE_SEARCH_OPTIONS,
  SEARCH_RESULT_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_LIMIT,
} from './options';
export type {
  SearchHit,
  SearchMatch,
  SearchResponse,
  SearchResultItem,
  SearchErrorBody,
  SearchErrorState,
} from './types';
export { toSearchResultItem, toSearchResultMatches } from './project';
