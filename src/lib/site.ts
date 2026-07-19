/**
 * site.ts — 站点全局配置
 *
 * 站点名称、描述、URL、作者、社交链接、评论系统。
 * 所有 env-aware 逻辑也在此处（resolveSiteUrl）。
 */

const DEFAULT_DEV_SITE_URL = 'http://localhost:3000';

type SiteUrlEnv = {
  NEXT_PUBLIC_SITE_URL?: string;
  NODE_ENV?: string;
};

export function resolveSiteUrl(env: SiteUrlEnv = process.env): string {
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
    github: 'https://github.com/xvyimu',
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
