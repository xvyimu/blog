import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BlogList from '@/components/blog/BlogList';
import { getTagNameBySlug, getAllTagSlugs } from '@/lib/tags';
import { getPostsByTag } from '@/lib/posts';
import { SITE_CONFIG } from '@/lib/constants';
import { decodeRouteSegment } from '@/lib/utils';

export async function generateStaticParams() {
  return getAllTagSlugs().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const tagSlug = decodeRouteSegment(tag);
  const tagName = getTagNameBySlug(tag);
  return {
    title: `${tagName ?? tagSlug} | ${SITE_CONFIG.name}`,
    alternates: {
      canonical: `${SITE_CONFIG.url}/tags/${encodeURIComponent(tagSlug)}`,
    },
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
    <section className="section">
      <div className="section__inner">
        <div className="section__head" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="section__title">标签：{tagName}</h2>
            <p className="section__subtitle">{posts.length} 篇文章</p>
          </div>
        </div>
        <BlogList posts={posts} columns={2} />
      </div>
    </section>
  );
}
