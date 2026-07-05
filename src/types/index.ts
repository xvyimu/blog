import type { z } from 'zod';
import type { postFrontmatterSchema } from '@/lib/schemas/post-frontmatter';

/**
 * PostFrontmatter — 从 zod schema 派生 (单一来源).
 * Schema 定义在 src/lib/schemas/post-frontmatter.ts.
 */
export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingTime: string; // 由 reading-time 计算，如 "5 min read"
  wordCount: number; // 字数（中文按字符计，英文按单词计）
  excerpt: string;
  headings: string[];
  searchText: string;
}

export interface PostFull extends PostMeta {
  content: string; // 原始 MDX 正文（不含 frontmatter）
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  github?: string;
  image?: string;
  featured: boolean;
  year: number;
}

export interface LinkItem {
  title: string;
  url: string;
  description: string;
  tags?: string[];
}

export interface LinkCategory {
  id: string;
  title: string;
  description: string;
  items: LinkItem[];
}

export interface TagInfo {
  tag: string; // 原始展示名，如 "Next.js"
  slug: string; // URL slug，如 "next-js"
  count: number;
}

export interface CategoryInfo {
  name: string; // 分类名，如 "前端开发"
  slug: string; // URL slug，如 "前端开发"
  count: number; // 文章数
  tags: string[]; // 该分类包含的标签列表
}
