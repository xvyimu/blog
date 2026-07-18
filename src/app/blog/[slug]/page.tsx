import MdxContent from '@/components/blog/MdxContent';
import TableOfContents from '@/components/blog/TableOfContents';
import ReadingProgress from '@/components/blog/ReadingProgress';
import ReadingPreferences from '@/components/blog/ReadingPreferences';
import ArticleHeader from '@/components/blog/ArticleHeader';
import ArticleJsonLd from '@/components/blog/ArticleJsonLd';
import ArticleNav from '@/components/blog/ArticleNav';
import ArticleRelated from '@/components/blog/ArticleRelated';
import ArticleSeriesPath from '@/components/blog/ArticleSeriesPath';
import {
  getAllPostSlugs,
  getPostBySlug,
  getAdjacentPosts,
  getRelatedPosts,
  getSeriesPosts,
} from '@/server/content';
import { inferCategory } from '@/lib/category-rules';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';
import Giscus from '@/components/comments/Giscus';
import type { PostFull } from '@/types';
import { getCspNonce } from '@/lib/csp';

const {
  generateStaticParams,
  generateMetadata,
  default: BlogPostPage,
} = createDynamicRoute<PostFull>({
  paramKey: 'slug',
  getAllSlugs: () => getAllPostSlugs(),
  getBySlug: (slug) => getPostBySlug(slug),
  buildMetadata: (post) => ({
    ...buildPageMetadata({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      type: 'article',
      image: post.image,
      publishedTime: post.date,
      modifiedTime: post.updatedAt ?? post.date,
    }),
    keywords: post.tags.join(', '),
  }),
  render: (post) => BlogPostContent({ post }),
});

export { generateStaticParams, generateMetadata };
export default BlogPostPage;

async function BlogPostContent({ post }: { post: PostFull }) {
  const slug = post.slug;
  const { prev, next } = getAdjacentPosts(slug);
  const relatedPosts = getRelatedPosts(slug);
  const seriesPosts = getSeriesPosts(slug);
  const category = post.category ?? inferCategory(post.tags);
  const nonce = await getCspNonce();

  return (
    <>
      <ArticleJsonLd post={post} nonce={nonce} />
      <ReadingProgress />
      <ReadingPreferences targetId="article-content" />
      <section className="section">
        <div className="section__inner">
          <div className="article-layout">
            {/* Article */}
            <article className="article-shell">
              <ArticleHeader post={post} category={category ?? undefined} />
              <TableOfContents variant="mobile" />

              <div id="article-content">
                <MdxContent source={post.content} />
              </div>

              <ArticleSeriesPath post={post} posts={seriesPosts} />

              <Giscus />

              <ArticleRelated posts={relatedPosts} />

              <ArticleNav prev={prev} next={next} />
            </article>

            {/* TOC sidebar — 桌面端显示 */}
            <aside className="article-aside">
              <TableOfContents />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
