import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';

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

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    fill: _fill,
    priority: _priority,
    sizes: _sizes,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={String(src)} alt={alt ?? ''} {...props} />
  ),
}));

vi.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers([['x-nonce', 'test-nonce']]),
}));

import HomePage from '@/app/page';

describe('HomePage', () => {
  beforeEach(() => cleanup());

  async function renderHomePage() {
    render(await HomePage());
  }

  it('renders the Paper Gallery hero', async () => {
    await renderHomePage();
    expect(screen.getByText('Paper Gallery')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('renders the homepage paper container', async () => {
    await renderHomePage();
    expect(document.querySelector('.home-paper')).toBeInTheDocument();
  });

  it('renders hero CTA links', async () => {
    await renderHomePage();
    const heroActions = document.querySelector('.editorial-hero__actions');
    expect(heroActions!.querySelector('a[href="/blog"]')).toHaveTextContent('进入文章');
    expect(heroActions!.querySelector('a[href="/links"]')).toHaveTextContent('打开收藏');
  });

  it('renders entry index and reading path sections', async () => {
    await renderHomePage();

    expect(screen.getByText('从这里进入')).toBeInTheDocument();
    expect(screen.getByText('浏览文章')).toBeInTheDocument();
    expect(screen.getAllByText('打开导航').length).toBeGreaterThan(0);
    expect(screen.getByText('查看作品')).toBeInTheDocument();
    expect(screen.getByText('阅读路径')).toBeInTheDocument();
    expect(screen.getByText('个人服务部署路线')).toBeInTheDocument();
    expect(screen.getByText('Web 性能与体验')).toBeInTheDocument();
    expect(screen.getByText('数据层实践')).toBeInTheDocument();
    expect(screen.getByText('TypeScript 与全栈')).toBeInTheDocument();
  });

  it('uses encoded links for non-ASCII reading path routes', async () => {
    await renderHomePage();

    expect(screen.getByText('Web 性能与体验').closest('a')).toHaveAttribute(
      'href',
      `/tags/${encodeURIComponent('性能优化')}`,
    );
    expect(screen.getByText('数据层实践').closest('a')).toHaveAttribute(
      'href',
      `/categories/${encodeURIComponent('数据库')}`,
    );
  });

  it('renders recent posts section with selected posts', async () => {
    await renderHomePage();
    const allPosts = getAllPosts();

    expect(screen.getByText('最近整理')).toBeInTheDocument();

    const renderedTitles = [
      ...allPosts.filter((post) => post.featured),
      ...allPosts.filter((post) => !post.featured),
    ]
      .slice(0, 6)
      .map((p) => p.title);
    for (const title of renderedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('renders curated links preview', async () => {
    await renderHomePage();

    expect(screen.getByText('个人收藏入口')).toBeInTheDocument();
    expect(screen.getByText('AI 工具')).toBeInTheDocument();
    expect(screen.getByText('技术文档与工程实践')).toBeInTheDocument();
    expect(screen.getByText('自托管与可观测性')).toBeInTheDocument();
    expect(screen.getByText('VPS 与主机商')).toBeInTheDocument();
    expect(screen.getByText('BandwagonHost')).toBeInTheDocument();
  });

  it('renders featured projects section', async () => {
    await renderHomePage();
    const featured = getFeaturedProjects();

    if (featured.length > 0) {
      expect(screen.getByText('项目样本')).toBeInTheDocument();
      for (const project of featured) {
        expect(screen.getByText(project.title)).toBeInTheDocument();
      }
    }
  });

  it('displays post count in hero stats', async () => {
    await renderHomePage();
    const allPosts = getAllPosts();
    expect(screen.getByText(allPosts.length.toString())).toBeInTheDocument();
  });
});
