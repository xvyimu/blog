import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { PostFrontmatter, PostMeta, PostFull } from '@/types';
import { assertRequiredFields } from './utils';
import { CONTENT_DIR } from './constants';

const POSTS_DIR = path.join(process.cwd(), CONTENT_DIR.blog);
const REQUIRED_FIELDS = ['title', 'description', 'date'];

/** 文件名 → slug：去掉 YYYY-MM-DD- 前缀和 .mdx 后缀 */
function filenameToSlug(filename: string): string {
  return filename
    .replace(/^\d{4}-\d{2}-\d{2}-/, '')
    .replace(/\.mdx$/, '');
}

/** 读取并解析单篇文章（含 frontmatter 校验） */
function readPostFile(filename: string): PostFull {
  const filePath = path.join(POSTS_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  assertRequiredFields(data, REQUIRED_FIELDS, filePath);

  const frontmatter: PostFrontmatter = {
    title: data.title,
    description: data.description,
    date: data.date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    published: data.published !== false, // 缺省 = true
    featured: data.featured === true,    // 缺省 = false
    image: data.image,
  };

  return {
    ...frontmatter,
    slug: filenameToSlug(filename),
    readingTime: readingTime(content).text,
    content,
  };
}

/** 是否应该在当前环境展示（生产环境过滤草稿） */
function isVisible(post: PostFrontmatter): boolean {
  if (process.env.NODE_ENV === 'production') {
    return post.published !== false;
  }
  return true; // 开发环境默认显示草稿
}

let _cache: PostFull[] | null = null;

/** 获取全部文章（按日期倒序），带内存缓存避免重复读盘 */
export function getAllPosts(): PostMeta[] {
  if (!_cache) {
    if (!fs.existsSync(POSTS_DIR)) {
      console.warn(`[posts.ts] 内容目录不存在: ${POSTS_DIR}`);
      _cache = [];
    } else {
      const filenames = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
      _cache = filenames.map(readPostFile);
    }
  }

  return _cache
    .filter(isVisible)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(({ content, ...meta }) => meta); // 列表场景不需要正文
}

/** 获取置顶文章（首页用） */
export function getFeaturedPosts(): PostMeta[] {
  return getAllPosts().filter((p) => p.featured);
}

/** 根据 slug 获取单篇完整文章（含正文），找不到返回 null */
export function getPostBySlug(slug: string): PostFull | null {
  if (!_cache) getAllPosts(); // 触发缓存填充
  const post = _cache?.find((p) => p.slug === slug && isVisible(p));
  return post ?? null;
}

/** 用于 generateStaticParams */
export function getAllPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** 按标签筛选 */
export function getPostsByTag(tagName: string): PostMeta[] {
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tagName.toLowerCase())
  );
}

/** 上一篇/下一篇（按日期相邻） */
export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const all = getAllPosts(); // 已按日期倒序
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: all[index + 1] ?? null,
    next: all[index - 1] ?? null,
  };
}

/** 分页 */
export function getPaginatedPosts(page: number, pageSize: number) {
  const all = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    posts: all.slice(start, start + pageSize),
    currentPage: safePage,
    totalPages,
    totalPosts: all.length,
  };
}