/**
 * 服务端搜索公共入口。
 * 仅供 App Router / Route Handler 使用；客户端不得导入本模块。
 */

export { searchPosts, searchPostsCached } from './engine';
export {
  checkSearchRateLimit,
  checkPreviewRateLimit,
  checkCspReportRateLimit,
  clientKeyFromRequest,
  resetSearchRateLimitForTests,
  SEARCH_RATE_LIMIT_MAX,
  PREVIEW_RATE_LIMIT_MAX,
  CSP_REPORT_RATE_LIMIT_MAX,
  SEARCH_RATE_LIMIT_WINDOW_MS,
  type RateLimitResult,
} from './rate-limit';
export { searchPublishedPosts } from './service';
export { getSearchCorpus, resetSearchCorpusForTests } from './corpus';
