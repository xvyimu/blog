/**
 * RSS Feed 生成脚本
 * 在 next build 前运行：tsx scripts/generate-rss.ts
 *
 * 常量来源：@/lib/site
 * slug 提取：@/lib/posts (filenameToSlug)
 * frontmatter 校验：@/lib/schemas/post-frontmatter (共享 schema, 与站点一致)
 */

import fs from 'fs';
import path from 'path';
import { Feed, type Category } from 'feed';
import { parseFrontmatter } from '@/lib/parse-frontmatter';
import readingTime from 'reading-time';
import { SITE_CONFIG } from '@/lib/site';
import { filenameToSlug } from '@/lib/posts';
import {
  type PostFrontmatterParsed,
  postFrontmatterSchema,
} from '@/lib/schemas/post-frontmatter';

const POSTS_DIR = path.join(process.cwd(), 'content/blog');

type RssPost = {
  slug: string;
  frontmatter: PostFrontmatterParsed;
  content: string;
  publishedAt: Date;
  updatedAt: Date;
};

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function getFeedUpdatedAt(posts: RssPost[]): Date {
  return posts.reduce(
    (latest, post) => (post.updatedAt > latest ? post.updatedAt : latest),
    posts[0]?.updatedAt ?? new Date('1970-01-01T00:00:00.000Z'),
  );
}

function uniqueValues(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function getPostCategories(post: RssPost): Category[] {
  return uniqueValues([
    post.frontmatter.category,
    post.frontmatter.series,
    ...post.frontmatter.tags,
  ]).map((name) => ({ name }));
}

function loadRssPosts(filenames: string[]): RssPost[] {
  const posts: RssPost[] = [];

  for (const filename of filenames) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const { data, content } = parseFrontmatter(raw);

    const parsed = postFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      console.warn(`[RSS] 跳过 ${filename}: ${issues}`);
      continue;
    }

    const frontmatter = parsed.data;
    if (frontmatter.published === false) continue;

    posts.push({
      slug: filenameToSlug(filename),
      frontmatter,
      content,
      publishedAt: toUtcDate(frontmatter.date),
      updatedAt: toUtcDate(frontmatter.updatedAt ?? frontmatter.date),
    });
  }

  return posts;
}

function assertProductionSiteUrl() {
  const siteUrl = SITE_CONFIG.url;
  if (process.env.NODE_ENV !== 'production') return;
  try {
    const parsed = new URL(siteUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      throw new Error(
        `[RSS] Refusing to write production feed with localhost URL (${siteUrl}). ` +
          'Set NEXT_PUBLIC_SITE_URL=https://incca.ccwu.cc for production builds.',
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[RSS]')) throw error;
    throw new Error(`[RSS] SITE_CONFIG.url is invalid: ${siteUrl}`);
  }
}

function generateRss() {
  assertProductionSiteUrl();

  if (!fs.existsSync(POSTS_DIR)) {
    console.warn('[RSS] content/blog 目录不存在，跳过');
    return;
  }

  const filenames = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .slice(0, 20);
  const posts = loadRssPosts(filenames);
  const feedUpdatedAt = getFeedUpdatedAt(posts);

  const feed = new Feed({
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    id: SITE_CONFIG.url,
    link: SITE_CONFIG.url,
    language: 'zh-CN',
    updated: feedUpdatedAt,
    copyright: `All rights reserved ${feedUpdatedAt.getUTCFullYear()}`,
    author: { name: SITE_CONFIG.author.name, link: SITE_CONFIG.url },
    feedLinks: {
      rss: `${SITE_CONFIG.url}/feed.xml`,
      json: `${SITE_CONFIG.url}/feed.json`,
    },
  });

  for (const category of uniqueValues(
    posts.flatMap((post) =>
      getPostCategories(post).map((itemCategory) => itemCategory.name),
    ),
  )) {
    feed.addCategory(category);
  }

  for (const post of posts) {
    const categories = getPostCategories(post);

    feed.addItem({
      title: post.frontmatter.title,
      id: `${SITE_CONFIG.url}/blog/${post.slug}`,
      link: `${SITE_CONFIG.url}/blog/${post.slug}`,
      description: post.frontmatter.description,
      content: post.content,
      date: post.updatedAt,
      published: post.publishedAt,
      category: categories,
      // Custom extension: reading time as a JSON feed extension
      extensions: [
        {
          name: '_reading_time',
          objects: { readingTime: readingTime(post.content).text },
        },
      ],
    });
  }

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'feed.xml'), feed.rss2());
  fs.writeFileSync(path.join(publicDir, 'feed.json'), feed.json1());
  console.log('[RSS] feed.xml + feed.json 已生成');
}

generateRss();
