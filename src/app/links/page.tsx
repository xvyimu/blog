import type { Metadata } from 'next';
import { LinksDirectory } from '@/components/links/LinksDirectory';
import PageSection from '@/components/layout/PageSection';
import { getAllLinkCategories } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '导航',
  description: '精选技术文档、VPS 官网、开发工具和趣味小站 — 工程师的阅读收藏夹。',
  path: '/links',
});

export default function LinksPage() {
  const linkCategories = getAllLinkCategories();

  return (
    <PageSection
      eyebrow="Links"
      title="导航"
      subtitle="精选技术文档、VPS 官网、开发工具和趣味小站"
    >
      <LinksDirectory categories={linkCategories} />
    </PageSection>
  );
}
