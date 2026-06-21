import Link from 'next/link';
import Container from '@/components/ui/Container';
import BlogList from '@/components/blog/BlogList';
import { getAllPosts, getPaginatedPosts } from '@/lib/posts';
import { PAGE_SIZE } from '@/lib/constants';

export default function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = 1; // 首页只展示第一页，后续通过 searchParams 分页
  const { posts, totalPages, currentPage } = getPaginatedPosts(page, PAGE_SIZE);

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold">博客</h1>
      <BlogList posts={posts} columns={2} />

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={p === 1 ? '/blog' : `/blog?page=${p}`}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors ${
                p === currentPage
                  ? 'bg-primary text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </Container>
  );
}