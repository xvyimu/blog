export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;          // YYYY-MM-DD
  tags: string[];
  published: boolean;
  featured: boolean;
  image?: string;
}

export interface PostMeta extends PostFrontmatter {
  slug: string;
  readingTime: string;   // 由 reading-time 计算，如 "5 min read"
}

export interface PostFull extends PostMeta {
  content: string;       // 原始 MDX 正文（不含 frontmatter）
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  github?: string;
  image: string;
  featured: boolean;
  year: number;
  longDescription?: boolean; // true 时表示存在 content/projects/[id].mdx
}

export interface TagInfo {
  tag: string;   // 原始展示名，如 "Next.js"
  slug: string;  // URL slug，如 "next-js"
  count: number;
}
