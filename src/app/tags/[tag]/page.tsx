import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Container from '@/components/ui/Container';
import BlogList from '@/components/blog/BlogList';
import { getTagNameBySlug, getAllTagSlugs } from '@/lib/tags';
import { getPostsByTag } from '@/lib/posts';
import { SITE_CONFIG } from '@/lib/constants';

export async function generateStaticParams() {
  return getAllTagSlugs().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const tagName = getTagNameBySlug(tag);
  return {
    title: `${tagName ?? tag} | ${SITE_CONFIG.name}`,
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const tagName = getTagNameBySlug(tag);

  if (!tagName) {
    notFound();
  }

  const posts = getPostsByTag(tagName);

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-bold">标签：{tagName}</h1>
      <p className="mb-8 text-sm text-[var(--color-text-muted)]">{posts.length} 篇文章</p>
      <BlogList posts={posts} columns={2} />
    </Container>
  );
}