import { z } from 'zod';
import type { LinkCategory } from '@/types';
import { CONTENT_DIR } from './content-dirs';
import type { ContentSource } from './content-source';
import { filesystemSource } from './content-source';
import { createJsonContentRepository } from './json-content-repository';

/**
 * links 模块 — 读取 + 校验 data/links.json.
 *
 * 通过 createLinksRepository(source) 注入 ContentSource, 测试可传 in-memory source.
 * 默认实例 linksRepository 使用 filesystemSource.
 */

function hasTrackingOrAffiliateParam(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  return Array.from(parsedUrl.searchParams.keys()).some((key) => {
    const normalizedKey = key.toLowerCase();
    return (
      normalizedKey.startsWith('utm_') ||
      ['aff', 'ref', 'referral', 'coupon', 'partner'].includes(normalizedKey)
    );
  });
}

function isHttpUrl(url: string): boolean {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return false;
  }

  return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
}

function isIsoDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function normalizeLinkUrl(url: string): string {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return url;
  }

  parsedUrl.hash = '';
  parsedUrl.protocol = parsedUrl.protocol.toLowerCase();
  parsedUrl.hostname = parsedUrl.hostname.toLowerCase();

  if (parsedUrl.pathname !== '/') {
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');
  }

  return parsedUrl.toString();
}

const LinkItemSchema = z.object({
  title: z.string(),
  url: z
    .string()
    .url()
    .refine(isHttpUrl, {
      message: 'Link URLs must use http:// or https://',
    })
    .refine((url) => !hasTrackingOrAffiliateParam(url), {
      message: 'Link URLs must not contain affiliate or tracking parameters',
    }),
  description: z.string(),
  tags: z.array(z.string().trim().min(1)).max(6).optional(),
  official: z.boolean().optional(),
  priority: z.enum(['primary', 'reference', 'watchlist']).optional(),
  useCase: z.string().trim().min(4).max(120).optional(),
  lastChecked: z
    .string()
    .refine(isIsoDateString, {
      message: 'lastChecked must use YYYY-MM-DD',
    })
    .optional(),
});

const LinkCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.array(LinkItemSchema),
});

export function parseLinks(raw: unknown): LinkCategory[] {
  return z.array(LinkCategorySchema).parse(raw);
}

export type LinkAssetIssue = {
  path: string;
  message: string;
};

export function getLinkAssetIssues(categories: LinkCategory[]): LinkAssetIssue[] {
  const issues: LinkAssetIssue[] = [];
  const seenCategoryIds = new Set<string>();
  const seenUrls = new Map<string, string>();

  for (const category of categories) {
    const categoryPath = `links.${category.id}`;

    if (seenCategoryIds.has(category.id)) {
      issues.push({
        path: categoryPath,
        message: `Duplicate link category id: ${category.id}`,
      });
    } else {
      seenCategoryIds.add(category.id);
    }

    if (category.items.length === 0) {
      issues.push({
        path: categoryPath,
        message: 'Link category must contain at least one item',
      });
    }

    for (const item of category.items) {
      const itemPath = `${categoryPath}.${item.title}`;
      if (!isHttpUrl(item.url)) {
        issues.push({
          path: itemPath,
          message: `Link URL must use http:// or https://: ${item.url}`,
        });
      }

      if (hasTrackingOrAffiliateParam(item.url)) {
        issues.push({
          path: itemPath,
          message: `Link URL must not contain affiliate or tracking parameters: ${item.url}`,
        });
      }

      const normalizedUrl = normalizeLinkUrl(item.url);
      const existingTitle = seenUrls.get(normalizedUrl);
      if (existingTitle) {
        issues.push({
          path: itemPath,
          message: `Duplicate link URL also used by "${existingTitle}": ${normalizedUrl}`,
        });
      } else {
        seenUrls.set(normalizedUrl, item.title);
      }
    }
  }

  return issues;
}

export interface LinksRepository {
  /** 获取全部链接分类 (含缓存) */
  getAllCategories(): LinkCategory[];
  /** 根据 id 查找单个分类 */
  getCategoryById(id: string): LinkCategory | null;
}

export function createLinksRepository(source: ContentSource): LinksRepository {
  const content = createJsonContentRepository<LinkCategory[]>({
    source,
    path: CONTENT_DIR.links,
    label: 'links',
    // Production: fail-fast on missing/corrupt JSON (CI check-seo is the other gate).
    // Tests inject in-memory sources and rely on default NODE_ENV !== production → lenient,
    // or pass mode explicitly via createJsonContentRepository options when needed.
    fallback: () => [],
    parse: parseLinks,
  });

  function getAllCategories(): LinkCategory[] {
    return content.getAll();
  }

  function getCategoryById(id: string): LinkCategory | null {
    return getAllCategories().find((c) => c.id === id) ?? null;
  }

  return { getAllCategories, getCategoryById };
}

/** 默认 LinksRepository 实例 (基于 filesystemSource). */
export const linksRepository = createLinksRepository(filesystemSource);

/**
 * 向后兼容便捷函数 — 委托给默认 linksRepository.
 * app/ 调用方可逐步迁移到 linksRepository.getAllCategories() 等.
 */
export function getAllLinkCategories(): LinkCategory[] {
  return linksRepository.getAllCategories();
}

export function getLinkCategoryById(id: string): LinkCategory | null {
  return linksRepository.getCategoryById(id);
}
