import Container from '@/components/ui/Container';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllProjects } from '@/lib/projects';

export default function ProjectsPage() {
  const projects = getAllProjects();

  return (
    <Container className="py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-bold">作品集</h1>
      {projects.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">暂无作品</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Container>
  );
}