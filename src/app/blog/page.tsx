import type { Metadata } from 'next';
import Link from 'next/link';
import BlogList from '@/components/blog/BlogList';
import SearchBar from '@/components/blog/SearchBar';
import Pagination from '@/components/blog/Pagination';
import PageSection from '@/components/layout/PageSection';
import { getPaginatedPosts } from '@/server/content';
import { PAGE_SIZE } from '@/lib/content-dirs';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '博客',
  description: '浏览全部文章 — 涵盖云原生、全栈开发、自动化、数据库、DevOps 等工程实践。',
  path: '/blog',
});

type BlogPageSearchParams = {
  page?: string | string[];
};

function parsePageParam(rawPage: BlogPageSearchParams['page']): number {
  const value = Array.isArray(rawPage) ? rawPage[0] : rawPage;
  if (!value) return 1;
  const page = Number(value);
  return Number.isFinite(page) ? page : 1;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<BlogPageSearchParams>;
} = {}) {
  const requestedPage = parsePageParam((await searchParams)?.page);
  // Search uses GET /api/search — do not embed the full PostMeta index in the RSC payload.
  const { posts, totalPages, currentPage, totalPosts } = getPaginatedPosts(
    requestedPage,
    PAGE_SIZE,
  );

  return (
    <PageSection
      eyebrow="Blog"
      title="博客"
      subtitle={totalPages > 0 ? `共 ${totalPosts} 篇` : ''}
      action={
        <div className="section__action-group">
          <Link href="/categories" className="section__link">
            按分类
          </Link>
          <Link href="/series" className="section__link">
            看专题
          </Link>
        </div>
      }
    >
      <SearchBar />
      <BlogList posts={posts} columns={2} />
      <Pagination currentPage={currentPage} totalPages={totalPages} />
    </PageSection>
  );
}
