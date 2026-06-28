const DEFAULT_DEV_SITE_URL = 'http://localhost:3000';

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
};

export function resolveSiteUrl(
  env: SiteUrlEnv = process.env,
): string {
  const rawUrl = env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'NEXT_PUBLIC_SITE_URL is required in production for canonical URLs, RSS, sitemap, and JSON-LD.',
      );
    }
    return DEFAULT_DEV_SITE_URL;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL.');
  }

  return rawUrl.replace(/\/+$/, '');
}

export const SITE_CONFIG = {
  name: '西江月',
  description: '云原生 · 全栈 · 自动化',
  url: resolveSiteUrl(),
  author: {
    name: '雨天狂奔',
  },
  social: {
    github: 'https://github.com/yuanjia1314',
    twitter: '',
    email: '',
  },
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO ?? 'xvyimu/blog',
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? 'R_kgDOTBAmxA',
    category: 'Announcements',
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? 'DIC_kwDOTBAmxM4C_mwW',
    mapping: 'pathname' as const,
    reactionsEnabled: '1',
    inputPosition: 'bottom' as const,
    lang: 'zh-CN',
  },
} as const;

/** 标签 → 分类映射（用于自动推断文章分类） */
export const TAG_TO_CATEGORY: Record<string, string> = {
  // 前端开发
  'Next.js': '前端开发',
  'React': '前端开发',
  'TypeScript': '前端开发',
  '前端': '前端开发',
  '全栈': '前端开发',
  '类型系统': '前端开发',
  '性能优化': '前端开发',
  'Core Web Vitals': '前端开发',
  'Lighthouse': '前端开发',
  // 后端开发
  'Node.js': '后端开发',
  'Go': '后端开发',
  '后端': '后端开发',
  'CLI': '后端开发',
  '工具': '后端开发',
  // 数据库
  'PostgreSQL': '数据库',
  'Redis': '数据库',
  '数据库': '数据库',
  '缓存': '数据库',
  'Supabase': '数据库',
  // DevOps
  'Docker': 'DevOps',
  '部署': 'DevOps',
  '容器': 'DevOps',
  'Nginx': 'DevOps',
  'Linux': 'DevOps',
  '运维': 'DevOps',
  'VPS': 'DevOps',
  '安全': 'DevOps',
  '监控': 'DevOps',
  // CI/CD
  'CI/CD': 'CI/CD',
  'GitHub Actions': 'CI/CD',
  'Git': 'CI/CD',
  'DevOps': 'CI/CD',
  '自动化': 'CI/CD',
  // 云服务
  'Cloudflare': '云服务',
  'Workers': '云服务',
  'Serverless': '云服务',
  '无服务器': '云服务',
};

export const CONTENT_DIR = {
  blog: 'content/blog',
  about: 'content/about.mdx',
  projects: 'data/projects.json',
} as const;

export const PAGE_SIZE = 12; // 博客列表每页文章数
