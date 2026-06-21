import Link from 'next/link';
import Container from '@/components/ui/Container';
import BlogList from '@/components/blog/BlogList';
import ProjectCard from '@/components/projects/ProjectCard';
import { getAllPosts, getFeaturedPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';
import { SITE_CONFIG } from '@/lib/constants';

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 6);
  const featuredPosts = getFeaturedPosts();
  const featuredProjects = getFeaturedProjects();

  return (
    <Container className="py-12 sm:py-16">
      {/* Hero */}
      <section className="mb-16">
        <div className="flex flex-col items-start gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{SITE_CONFIG.author.name}</h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {SITE_CONFIG.description}
          </p>
          <div className="flex gap-4 text-sm text-[var(--color-text-muted)]">
            {SITE_CONFIG.social.github && (
              <a href={SITE_CONFIG.social.github} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                GitHub ↗
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Featured posts */}
      {featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="mb-6 text-xl font-semibold">📌 置顶</h2>
          <BlogList posts={featuredPosts} columns={1} />
        </section>
      )}

      {/* Latest posts */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">最新文章</h2>
          <Link href="/blog" className="text-sm text-[var(--color-text-secondary)] hover:text-primary transition-colors">
            查看全部 →
          </Link>
        </div>
        <BlogList posts={latestPosts} columns={2} />
      </section>

      {/* Featured projects */}
      {featuredProjects.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">精选作品</h2>
            <Link href="/projects" className="text-sm text-[var(--color-text-secondary)] hover:text-primary transition-colors">
              查看全部 →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}