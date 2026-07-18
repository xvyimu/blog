import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import type { PostFull } from '@/types';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/components/blog/MdxContent', () => ({
  default: ({ source }: { source: string }) => (
    <div data-testid="mdx-content">{source.slice(0, 24)}</div>
  ),
}));

vi.mock('@/components/blog/TableOfContents', () => ({
  default: () => <nav aria-label="目录" />,
}));

vi.mock('@/components/blog/ReadingProgress', () => ({
  default: () => <div data-testid="reading-progress" />,
}));

vi.mock('@/components/blog/ReadingPreferences', () => ({
  default: () => <div data-testid="reading-preferences" />,
}));

vi.mock('@/components/comments/Giscus', () => ({
  default: () => <div data-testid="comments" />,
}));

vi.mock('next/headers', () => ({
  headers: async () => new Headers([['x-nonce', 'test-nonce']]),
}));

import BlogPostPage, { generateMetadata } from '@/app/blog/[slug]/page';

const emptyTagPost: PostFull = {
  title: 'Metadata badges without tags',
  description: 'A post with category and series but no tags.',
  date: '2026-07-03',
  tags: [],
  category: 'Custom Notes',
  series: 'Series A',
  seriesOrder: 1,
  published: true,
  featured: false,
  slug: 'metadata-badges-without-tags',
  readingTime: '1 min read',
  wordCount: 12,
  excerpt: 'excerpt',
  headings: [],
  searchText: 'metadata badges without tags',
  content: '# Body',
};

describe('BlogPostPage', () => {
  it('returns metadata title without duplicating the site name', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'docker-deploy-guide' }),
    });

    expect(metadata.title).toBe('Docker 容器部署实战：从零搭建 Node.js 应用');
  });

  it('renders the reading path for a series post', async () => {
    const jsx = await BlogPostPage({
      params: Promise.resolve({ slug: 'docker-deploy-guide' }),
    });
    render(jsx);

    const section = screen.getByRole('region', { name: '专题阅读路径' });
    expect(within(section).getByText('个人服务部署路线')).toBeInTheDocument();
    expect(within(section).getByText('第 2 / 5 篇')).toHaveAttribute(
      'data-slot',
      'badge',
    );
    expect(within(section).getByText('当前阅读')).toBeInTheDocument();
    expect(
      within(section).getByRole('link', { name: /VPS 初始化安全与运维配置清单/ }),
    ).toHaveAttribute('href', '/blog/vps-initial-setup');
    expect(
      within(section).getByText('Docker 容器部署实战：从零搭建 Node.js 应用'),
    ).toBeInTheDocument();
  });

  it('does not render a reading path for standalone posts', async () => {
    const jsx = await BlogPostPage({
      params: Promise.resolve({ slug: 'go-cli-tool' }),
    });
    render(jsx);

    expect(
      screen.queryByRole('region', { name: '专题阅读路径' }),
    ).not.toBeInTheDocument();
  });

  it('renders related posts from shared series and tags', async () => {
    const jsx = await BlogPostPage({
      params: Promise.resolve({ slug: 'docker-deploy-guide' }),
    });
    render(jsx);

    const section = screen.getByRole('region', { name: '相关文章' });
    expect(
      within(section).getByRole('link', { name: /Nginx 反向代理与负载均衡实战/ }),
    ).toHaveAttribute('href', '/blog/nginx-reverse-proxy');
    expect(within(section).getByText('Nginx')).toHaveAttribute('data-slot', 'badge');
    expect(
      within(section).getByRole('link', { name: /VPS 初始化安全与运维配置清单/ }),
    ).toHaveAttribute('href', '/blog/vps-initial-setup');
  });

  it('renders series and category badges when a post has no tags', async () => {
    vi.resetModules();
    vi.doMock('@/server/content', () => ({
      getAllPostSlugs: () => [emptyTagPost.slug],
      getPostBySlug: (slug: string) => (slug === emptyTagPost.slug ? emptyTagPost : null),
      getAdjacentPosts: () => ({ prev: null, next: null }),
      getRelatedPosts: () => [],
      getSeriesPosts: () => [],
    }));

    const { default: MockedBlogPostPage } = await import('@/app/blog/[slug]/page');
    const jsx = await MockedBlogPostPage({
      params: Promise.resolve({ slug: emptyTagPost.slug }),
    });
    render(jsx);

    expect(screen.getByText('Series A')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Custom Notes' })).toHaveAttribute(
      'href',
      '/categories/Custom%20Notes',
    );

    vi.doUnmock('@/server/content');
    vi.resetModules();
  });
});
