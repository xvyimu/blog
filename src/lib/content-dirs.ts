/**
 * content-dirs.ts — 内容文件路径、部署追踪配置与分页常量
 *
 * 所有本地数据源路径集中定义，供 ContentSource 读取，并派生 Vercel 文件追踪配置。
 */

export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
  links: 'data/links.json',
} as const;

const CONTENT_TRACE_ROUTE = '/**';

const CONTENT_TRACE_ROOTS = Array.from(
  new Set(Object.values(CONTENT_DIR).map((relativePath) => relativePath.split('/')[0])),
);

export const CONTENT_TRACE_INCLUDES: Record<string, string[]> = {
  [CONTENT_TRACE_ROUTE]: CONTENT_TRACE_ROOTS.map((root) => `${root}/**/*`),
};

export const PAGE_SIZE = 12; // 博客列表每页文章数
