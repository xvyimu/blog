import type { IFuseOptions } from 'fuse.js';
import type { PostMeta } from '@/types';

/**
 * 共享 Fuse 配置：客户端嵌入索引、服务端引擎与测试共用同一套权重。
 * title 权重最高；searchText/headings 仅用于索引，不会出现在 wire item。
 */
export const FUSE_SEARCH_OPTIONS: IFuseOptions<PostMeta> = {
  keys: [
    { name: 'title', weight: 0.36 },
    { name: 'description', weight: 0.22 },
    { name: 'excerpt', weight: 0.22 },
    { name: 'tags', weight: 0.16 },
    { name: 'category', weight: 0.1 },
    { name: 'series', weight: 0.08 },
    { name: 'headings', weight: 0.05 },
    { name: 'searchText', weight: 0.03 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

/** 默认返回结果条数。 */
export const SEARCH_RESULT_LIMIT = 10;
/** 查询字符串最大长度（trim 后）。 */
export const SEARCH_MAX_QUERY_LENGTH = 100;
/** limit 参数允许的上限。 */
export const SEARCH_MAX_LIMIT = 20;
