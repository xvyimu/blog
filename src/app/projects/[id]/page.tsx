import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import MetaBadge from '@/components/ui/MetaBadge';
import { getAllProjectIds, getProjectById } from '@/server/content';
import { buildPageMetadata } from '@/lib/metadata';
import { createDynamicRoute } from '@/lib/route-adapter';
import { imageBlurProps } from '@/lib/image-blur-data';
import type { Project } from '@/types';

const {
  generateStaticParams,
  generateMetadata,
  default: ProjectDetailPage,
} = createDynamicRoute<Project>({
  paramKey: 'id',
  getAllSlugs: () => getAllProjectIds(),
  getBySlug: (id) => getProjectById(id),
  buildMetadata: (project) =>
    buildPageMetadata({
      title: project.title,
      description: project.description,
      path: `/projects/${project.id}`,
      image: project.image,
    }),
  render: (project) => <ProjectDetailContent project={project} />,
});

export { generateStaticParams, generateMetadata };
export default ProjectDetailPage;

function ProjectDetailContent({ project }: { project: Project }) {
  return (
    <section className="section">
      <div className="section__inner">
        <div className="project-detail">
          <Link href="/projects" className="project-detail__back">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回作品集
          </Link>

          <header className="project-detail__header">
            <h1 className="project-detail__title">{project.title}</h1>
            <div className="project-detail__meta">
              <span className="project-detail__year">{project.year}</span>
              {project.tags.map((tag) => (
                <MetaBadge key={tag} className="project-detail__tag">
                  {tag}
                </MetaBadge>
              ))}
            </div>
          </header>

          {project.image && (
            <div className="project-detail__image">
              <Image
                src={project.image}
                alt={project.title}
                fill
                className="object-cover"
                sizes="(max-width: 720px) 100vw, 720px"
                priority
                {...imageBlurProps(project.image)}
              />
            </div>
          )}

          <p className="project-detail__desc">{project.description}</p>

          <div className="project-detail__actions">
            {project.url && (
              <Button asChild size="cta">
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  线上访问
                </a>
              </Button>
            )}
            {project.github && (
              <Button asChild size="cta" variant="outline">
                <a href={project.github} target="_blank" rel="noopener noreferrer">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
                  </svg>
                  查看源码
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
