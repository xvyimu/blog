import type { Metadata } from 'next';
import Link from 'next/link';
import ArchiveCard from '@/components/layout/ArchiveCard';
import EmptyState from '@/components/layout/EmptyState';
import PageSection from '@/components/layout/PageSection';
import { getAllCategories } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '分类',
  description: '按领域浏览文章 — 前端、后端、数据库、DevOps、CI/CD、云服务等。',
  path: '/categories',
});

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <PageSection
      eyebrow="Categories"
      title="分类"
      subtitle={`${categories.length} 个分类 · 按领域浏览文章`}
      action={
        <Link href="/blog" className="section__link">
          全部文章
        </Link>
      }
    >
      {categories.length === 0 ? (
        <EmptyState title="暂无分类" description="发布文章后会自动生成分类索引。" />
      ) : (
        <div className="archive-grid archive-grid--3">
          {categories.map((cat) => (
            <ArchiveCard
              key={cat.slug}
              href={`/categories/${encodeURIComponent(cat.slug)}`}
              title={cat.name}
              countLabel={`${cat.count} 篇`}
              tags={cat.tags}
            />
          ))}
        </div>
      )}
    </PageSection>
  );
}
