import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Container from '@/components/ui/Container';
import MdxContent from '@/components/blog/MdxContent';
import TableOfContents from '@/components/blog/TableOfContents';
import TagLink from '@/components/blog/TagLink';
import { getPostBySlug, getAllPostSlugs, getAdjacentPosts } from '@/lib/posts';
import { formatDate, slugifyTag } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/constants';
import Link from 'next/link';

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | ${SITE_CONFIG.name}`,
    description: post.description,
    keywords: post.tags.join(', '),
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      images: post.image ? [{ url: post.image }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);

  return (
    <Container className="py-12 sm:py-16">
      <div className="lg:flex lg:gap-12">
        {/* Article */}
        <article className="min-w-0 flex-1 mx-auto max-w-prose">
          <header className="mb-10">
            <h1 className="text-3xl font-bold leading-tight">{post.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>{post.readingTime}</span>
            </div>
            {post.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <TagLink key={tag} tag={tag} slug={slugifyTag(tag)} />
                ))}
              </div>
            )}
          </header>

          <MdxContent source={post.content} />

          <nav className="mt-16 flex items-center justify-between border-t border-zinc-200 pt-8 dark:border-zinc-700">
            <div>
              {prev && (
                <Link href={`/blog/${prev.slug}`} className="group text-sm">
                  <span className="text-[var(--color-text-muted)]">← 上一篇</span>
                  <p className="mt-1 text-[var(--color-text)] group-hover:text-primary transition-colors">
                    {prev.title}
                  </p>
                </Link>
              )}
            </div>
            <div className="text-right">
              {next && (
                <Link href={`/blog/${next.slug}`} className="group text-sm">
                  <span className="text-[var(--color-text-muted)]">下一篇 →</span>
                  <p className="mt-1 text-[var(--color-text)] group-hover:text-primary transition-colors">
                    {next.title}
                  </p>
                </Link>
              )}
            </div>
          </nav>
        </article>

        {/* TOC sidebar — 桌面端显示 */}
        <aside className="hidden lg:block w-56 shrink-0">
          <TableOfContents />
        </aside>
      </div>
    </Container>
  );
}