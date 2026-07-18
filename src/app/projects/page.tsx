import type { Metadata } from 'next';
import EmptyState from '@/components/layout/EmptyState';
import PageSection from '@/components/layout/PageSection';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllProjects } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: '作品集',
  description: '一些有趣的开源项目和工具 — 涵盖 CLI、Web 应用、开发者工具等。',
  path: '/projects',
});

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <PageSection eyebrow="Projects" title="作品集" subtitle="一些有趣的开源项目和工具">
      {projects.length === 0 ? (
        <EmptyState title="暂无作品" description="项目样本发布后会显示在这里。" />
      ) : (
        <div className="cards cards--3">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} priority={index < 2} />
          ))}
        </div>
      )}
    </PageSection>
  );
}
