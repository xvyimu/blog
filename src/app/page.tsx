import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { getFeaturedProjects } from '@/lib/projects';
import { SITE_CONFIG } from '@/lib/constants';
import { organizationSchema, websiteSchema, toJsonLd } from '@/lib/jsonld';
import BlogList from '@/components/blog/BlogList';
import ProjectCard from '@/components/projects/ProjectCard';
import ParticleCanvas from '@/components/ui/ParticleCanvas';

export default function HomePage() {
  const allPosts = getAllPosts();
  const latestPosts = allPosts.slice(0, 4);
  const featuredProjects = getFeaturedProjects();

  const orgLd = toJsonLd(organizationSchema());
  const siteLd = toJsonLd(websiteSchema());

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteLd }} />
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__bg" aria-hidden="true">
          <ParticleCanvas />
          <div className="hero__blob hero__blob--1" />
          <div className="hero__blob hero__blob--2" />
          <div className="hero__grid" />
        </div>

        <div className="hero__inner">
          <h1 className="hero__name">{SITE_CONFIG.name}</h1>
          <p className="hero__tagline">{SITE_CONFIG.description}</p>

          <div className="hero__cta">
            <Link href="/blog" className="btn btn--primary">
              精选文章
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/about" className="btn btn--ghost">
              关于本站
            </Link>
          </div>

          <div className="hero__stats">
            <div className="stat-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span className="stat-pill__value">{allPosts.length}</span>
              <span className="stat-pill__label">技术文章</span>
            </div>
            <div className="stat-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="stat-pill__value">{featuredProjects.length}</span>
              <span className="stat-pill__label">开源项目</span>
            </div>
            <div className="stat-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" />
              </svg>
              <span className="stat-pill__label">开源爱好者</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 最新文章 ── */}
      {latestPosts.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__head">
              <div>
                <span className="section__eyebrow">Blog</span>
                <h2 className="section__title">最新文章</h2>
                <p className="section__subtitle">记录踩过的坑、想清楚的道理</p>
              </div>
              <div className="section__action">
                <Link href="/blog" className="section__link">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <BlogList posts={latestPosts} columns={2} />
          </div>
        </section>
      )}

      {/* ── 精选作品 ── */}
      {featuredProjects.length > 0 && (
        <section className="section">
          <div className="section__inner">
            <div className="section__head">
              <div>
                <span className="section__eyebrow">Projects</span>
                <h2 className="section__title">精选作品</h2>
                <p className="section__subtitle">一些有趣的开源项目和工具</p>
              </div>
              <div className="section__action">
                <Link href="/projects" className="section__link">
                  查看全部
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="cards cards--2">
              {featuredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index === 0} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
