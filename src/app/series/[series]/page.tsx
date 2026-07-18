import Link from 'next/link';
import PageSection from '@/components/layout/PageSection';
import { getAllSeriesSlugs, getSeriesBySlug } from '@/server/content';
import { SITE_CONFIG } from '@/lib/site';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';
import { formatDate } from '@/lib/utils';
import type { SeriesInfo } from '@/lib/series';

const {
  generateStaticParams,
  generateMetadata,
  default: SeriesDetailPage,
} = createDynamicRoute<SeriesInfo>({
  paramKey: 'series',
  getAllSlugs: () => getAllSeriesSlugs(),
  getBySlug: (seriesSlug) => getSeriesBySlug(seriesSlug),
  buildMetadata: (series) =>
    buildPageMetadata({
      title: `专题：${series.name}`,
      description: `专题「${series.name}」共 ${series.count} 篇文章 — ${SITE_CONFIG.name}`,
      path: `/series/${encodeURIComponent(series.slug)}`,
    }),
  render: (series) => (
    <PageSection
      eyebrow="Series"
      title={`专题：${series.name}`}
      subtitle={`${series.count} 篇文章 · ${formatDate(series.startDate)} - ${formatDate(
        series.endDate,
      )}`}
      compactHeader
    >
      <ol className="archive-list">
        {series.posts.map((post, index) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="archive-list__item archive-list__item--series"
            >
              <span className="archive-list__index">{index + 1}</span>
              <span className="min-w-0">
                <span className="archive-list__title">{post.title}</span>
                <span className="archive-list__desc">{post.description}</span>
              </span>
              <span className="archive-list__date">{formatDate(post.date)}</span>
            </Link>
          </li>
        ))}
      </ol>
    </PageSection>
  ),
});

export { generateStaticParams, generateMetadata };
export default SeriesDetailPage;
