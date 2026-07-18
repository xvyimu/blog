import BlogList from '@/components/blog/BlogList';
import PageSection from '@/components/layout/PageSection';
import { getAllTagSlugs, getPostsByTag, getTagNameBySlug } from '@/server/content';
import { SITE_CONFIG } from '@/lib/site';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';

const {
  generateStaticParams,
  generateMetadata,
  default: TagPage,
} = createDynamicRoute<string>({
  paramKey: 'tag',
  getAllSlugs: () => getAllTagSlugs(),
  getBySlug: (tagSlug) => getTagNameBySlug(tagSlug),
  buildMetadata: (_tagName, tagSlug) =>
    buildPageMetadata({
      title: `标签：${_tagName}`,
      description: `标签「${_tagName}」下的全部文章 — ${SITE_CONFIG.name}`,
      path: `/tags/${encodeURIComponent(tagSlug)}`,
    }),
  render: (tagName) => {
    const posts = getPostsByTag(tagName);
    return (
      <PageSection
        title={`标签：${tagName}`}
        subtitle={`${posts.length} 篇文章`}
        compactHeader
      >
        <BlogList posts={posts} columns={2} />
      </PageSection>
    );
  },
});

export { generateStaticParams, generateMetadata };
export default TagPage;
