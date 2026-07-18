import BlogList from '@/components/blog/BlogList';
import PageSection from '@/components/layout/PageSection';
import {
  getAllCategorySlugs,
  getPostsByCategory,
  isValidCategory,
} from '@/server/content';
import { SITE_CONFIG } from '@/lib/site';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';

const {
  generateStaticParams,
  generateMetadata,
  default: CategoryPage,
} = createDynamicRoute<string>({
  paramKey: 'category',
  getAllSlugs: () => getAllCategorySlugs(),
  getBySlug: (categorySlug) => (isValidCategory(categorySlug) ? categorySlug : null),
  buildMetadata: (categoryName) =>
    buildPageMetadata({
      title: `分类：${categoryName}`,
      description: `分类「${categoryName}」下的全部文章 — ${SITE_CONFIG.name}`,
      path: `/categories/${encodeURIComponent(categoryName)}`,
    }),
  render: (categoryName) => {
    const posts = getPostsByCategory(categoryName);
    return (
      <PageSection
        title={`分类：${categoryName}`}
        subtitle={`${posts.length} 篇文章`}
        compactHeader
      >
        <BlogList posts={posts} columns={2} />
      </PageSection>
    );
  },
});

export { generateStaticParams, generateMetadata };
export default CategoryPage;
