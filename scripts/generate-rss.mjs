/**
 * RSS Feed 生成脚本
 * 在 next build 前运行：node scripts/generate-rss.mjs
 */

import fs from 'fs';
import path from 'path';
import { Feed } from 'feed';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const SITE_NAME = '西江月的博客';
const SITE_DESC = '写代码，偶尔写写东西。';
const AUTHOR = { name: '西江月', link: 'https://github.com/yuanjia1314' };

const POSTS_DIR = path.join(process.cwd(), 'content/blog');

function generateRss() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.warn('[RSS] content/blog 目录不存在，跳过');
    return;
  }

  const feed = new Feed({
    title: SITE_NAME,
    description: SITE_DESC,
    id: SITE_URL,
    link: SITE_URL,
    language: 'zh-CN',
    updated: new Date(),
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    author: AUTHOR,
  });

  const filenames = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .reverse()
    .slice(0, 20);

  for (const filename of filenames) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), 'utf-8');
    const { data, content } = matter(raw);

    if (data.published === false) continue;

    const slug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx$/, '');

    feed.addItem({
      title: data.title,
      id: `${SITE_URL}/blog/${slug}`,
      link: `${SITE_URL}/blog/${slug}`,
      description: data.description,
      content,
      date: new Date(data.date),
      readingTime: readingTime(content).text,
    });
  }

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'feed.xml'), feed.rss2());
  fs.writeFileSync(path.join(publicDir, 'feed.json'), feed.json1());
  console.log('[RSS] feed.xml + feed.json 已生成');
}

generateRss();