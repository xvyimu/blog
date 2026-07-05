import type { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/posts';
import { getAllTags } from '@/lib/tags';
import { getAllCategories } from '@/lib/categories';
import { getAllProjects } from '@/lib/projects';
import { getAllSeries } from '@/lib/series';
import { SITE_CONFIG } from '@/lib/site';

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function projectYearToDate(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

function getLatestDate(dates: Date[], fallback: Date): Date {
  return dates.reduce((latest, date) => (date > latest ? date : latest), fallback);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.url;
  const posts = getAllPosts();
  const projects = getAllProjects();
  const seriesList = getAllSeries();
  const postModifiedDates = posts.map((post) => toUtcDate(post.updatedAt ?? post.date));
  const projectModifiedDates = projects.map((project) => projectYearToDate(project.year));
  const latestPostModifiedAt = getLatestDate(
    postModifiedDates,
    new Date('1970-01-01T00:00:00.000Z'),
  );
  const latestProjectModifiedAt = getLatestDate(
    projectModifiedDates,
    latestPostModifiedAt,
  );
  const latestSiteModifiedAt = getLatestDate(
    [...postModifiedDates, ...projectModifiedDates],
    latestPostModifiedAt,
  );

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestSiteModifiedAt,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: latestPostModifiedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: latestPostModifiedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: latestProjectModifiedAt,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/links`,
      lastModified: latestSiteModifiedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: latestPostModifiedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/series`,
      lastModified: latestPostModifiedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: latestSiteModifiedAt,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: toUtcDate(post.updatedAt ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: projectYearToDate(project.year),
    changeFrequency: 'monthly' as const,
    priority: project.featured ? 0.7 : 0.6,
  }));

  const tagPages: MetadataRoute.Sitemap = getAllTags().map((tag) => ({
    url: `${baseUrl}/tags/${tag.slug}`,
    lastModified: latestPostModifiedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  const categoryPages: MetadataRoute.Sitemap = getAllCategories().map((cat) => ({
    url: `${baseUrl}/categories/${encodeURIComponent(cat.slug)}`,
    lastModified: latestPostModifiedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const seriesPages: MetadataRoute.Sitemap = seriesList.map((series) => ({
    url: `${baseUrl}/series/${encodeURIComponent(series.slug)}`,
    lastModified: latestPostModifiedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [
    ...staticPages,
    ...postPages,
    ...projectPages,
    ...tagPages,
    ...categoryPages,
    ...seriesPages,
  ];
}
