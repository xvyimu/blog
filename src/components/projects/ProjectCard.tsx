import { Project } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

export default function ProjectCard({
  project,
  priority = false,
}: {
  project: Project;
  priority?: boolean;
}) {
  return (
    <article className="card card--project group">
      <Link href={`/projects/${project.id}`} className="block">
        {project.image ? (
          <div className="relative mb-4 aspect-video overflow-hidden rounded-md bg-[var(--bg-soft)]">
            <Image
              src={project.image}
              alt={project.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
            />
          </div>
        ) : (
          <div className="mb-4 flex aspect-video items-center justify-center rounded-md bg-gradient-to-br from-[var(--brand-soft)] to-[var(--bg-soft)]">
            <span className="text-2xl font-bold text-[var(--brand)] opacity-50">
              {project.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="card__top">
          <h3 className="card__name">{project.title}</h3>
        </div>
        <p className="card__desc">{project.description}</p>
      </Link>
      <div className="card__foot">
        <div className="card__tags">
          {project.tags.map((tag) => (
            <span key={tag} className="card__tag">{tag}</span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-dim)]">
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition-colors">
              线上 →
            </a>
          )}
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand)] transition-colors">
              源码 →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
