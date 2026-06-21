import Link from 'next/link';
import TagLink from '@/components/blog/TagLink';
import { Project } from '@/types';
import { slugifyTag } from '@/lib/utils';

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="group flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600">
      {project.image && (
        <div className="aspect-video overflow-hidden rounded-md bg-[var(--color-bg-secondary)]">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div>
        <h3 className="font-semibold text-[var(--color-text)]">{project.title}</h3>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{project.description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {project.tags.map((tag) => (
          <TagLink key={tag} tag={tag} slug={slugifyTag(tag)} />
        ))}
      </div>
      <div className="mt-auto flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            线上 →
          </a>
        )}
        {project.github && (
          <a href={project.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            源码 →
          </a>
        )}
      </div>
    </article>
  );
}