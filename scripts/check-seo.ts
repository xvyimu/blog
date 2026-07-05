import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { parseFrontmatter as parseFrontmatterType } from '../src/lib/parse-frontmatter';
import type { postFrontmatterSchema as postFrontmatterSchemaType } from '../src/lib/schemas/post-frontmatter';
import type {
  buildPostSearchText as buildPostSearchTextType,
  extractPostHeadings as extractPostHeadingsType,
  filenameToSlug as filenameToSlugType,
  getAllPosts as getAllPostsType,
} from '../src/lib/posts';
import type { getAllCategories as getAllCategoriesType } from '../src/lib/categories';
import type { getAllProjects as getAllProjectsType } from '../src/lib/projects';
import type { getAllSeries as getAllSeriesType } from '../src/lib/series';
import type { getAllTags as getAllTagsType } from '../src/lib/tags';
import type sitemapType from '../src/app/sitemap';

type Issue = {
  file?: string;
  message: string;
};

type CheckContext = {
  contentDir: { blog: string; projects: string };
  siteUrl: string;
  parseFrontmatter: typeof parseFrontmatterType;
  postFrontmatterSchema: typeof postFrontmatterSchemaType;
  filenameToSlug: typeof filenameToSlugType;
  extractPostHeadings: typeof extractPostHeadingsType;
  buildPostSearchText: typeof buildPostSearchTextType;
  getAllPosts: typeof getAllPostsType;
  getAllCategories: typeof getAllCategoriesType;
  getAllProjects: typeof getAllProjectsType;
  getAllSeries: typeof getAllSeriesType;
  getAllTags: typeof getAllTagsType;
  sitemap: typeof sitemapType;
};

const issues: Issue[] = [];
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

function addIssue(message: string, file?: string): void {
  issues.push({ file, message });
}

function publicPathExists(publicPath: string): boolean {
  const normalized = publicPath.split(/[?#]/, 1)[0];
  if (!normalized.startsWith('/')) return false;
  return existsSync(path.join(publicDir, normalized));
}

function slugifyHeading(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function compareDateStrings(a: string, b: string): number {
  return a.localeCompare(b);
}

function checkAbsoluteUrl(rawUrl: string, context: string, siteOrigin: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    addIssue(`${context} is not an absolute URL: ${rawUrl}`);
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    addIssue(`${context} must use http(s): ${rawUrl}`);
  }

  if (url.origin !== siteOrigin) {
    addIssue(`${context} must use SITE_CONFIG.url origin (${siteOrigin}): ${rawUrl}`);
  }

  if (url.href.includes('localhost')) {
    addIssue(`${context} must not contain localhost: ${rawUrl}`);
  }
}

function checkMdxReferences(content: string, file: string): void {
  const markdownLinks = content.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
  for (const match of markdownLinks) {
    const target = match[1];
    if (!target || target.startsWith('#') || target.startsWith('mailto:')) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;

    if (target.startsWith('/')) {
      const cleanTarget = target.split(/[?#]/, 1)[0];
      if (
        cleanTarget.startsWith('/blog/') ||
        cleanTarget.startsWith('/tags/') ||
        cleanTarget.startsWith('/categories/')
      ) {
        continue;
      }
      if (!publicPathExists(cleanTarget)) {
        addIssue(`Referenced public path does not exist: ${target}`, file);
      }
    }
  }
}

function checkPostFrontmatter(ctx: CheckContext): void {
  const blogDir = path.join(rootDir, ctx.contentDir.blog);
  if (!existsSync(blogDir)) {
    addIssue(`Blog directory does not exist: ${ctx.contentDir.blog}`);
    return;
  }

  const seenSlugs = new Set<string>();
  const seenTitles = new Map<string, string>();
  const tagCasing = new Map<string, string>();
  const filenames = readdirSync(blogDir).filter((filename) => filename.endsWith('.mdx'));

  for (const filename of filenames) {
    const file = path.join(ctx.contentDir.blog, filename).replace(/\\/g, '/');
    const raw = readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data, content } = ctx.parseFrontmatter(raw);
    const slug = ctx.filenameToSlug(filename);

    if (seenSlugs.has(slug)) {
      addIssue(`Duplicate blog slug: ${slug}`, file);
    }
    seenSlugs.add(slug);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      addIssue(`Blog slug should use lowercase kebab-case ASCII: ${slug}`, file);
    }

    // 共享 schema 校验 — 替换原 9 个 if 分支 (title/description/date/updatedAt/tags 等)
    const parsed = ctx.postFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        addIssue(
          `Frontmatter ${issue.path.join('.') || '(root)'}: ${issue.message}`,
          file,
        );
      }
      // schema 校验失败时, 跳过后续依赖字段的检查
      continue;
    }
    const fm = parsed.data;

    // SEO-specific 检查 (不在 schema 范围内, 保留手动实现)

    // updatedAt 不能早于 date
    if (
      typeof fm.updatedAt === 'string' &&
      compareDateStrings(fm.updatedAt, fm.date) < 0
    ) {
      addIssue(
        `Frontmatter updatedAt must not be earlier than date: ${fm.updatedAt} < ${fm.date}`,
        file,
      );
    }

    // 标题去重 (大小写不敏感)
    const normalizedTitle = fm.title.trim().toLowerCase();
    const existingFile = seenTitles.get(normalizedTitle);
    if (existingFile) {
      addIssue(`Duplicate blog title also used in ${existingFile}`, file);
    } else {
      seenTitles.set(normalizedTitle, file);
    }

    // 标签大小写一致性 (跨文章)
    for (const tag of fm.tags) {
      const normalizedTag = tag.trim().toLowerCase();
      const existingTag = tagCasing.get(normalizedTag);
      if (existingTag && existingTag !== tag) {
        addIssue(
          `Tag casing is inconsistent: "${tag}" also appears as "${existingTag}"`,
          file,
        );
      } else {
        tagCasing.set(normalizedTag, tag);
      }
    }

    // description 长度 (SEO 建议)
    if (fm.description.trim().length < 20) {
      addIssue(
        'Frontmatter description should be at least 20 characters for search snippets',
        file,
      );
    }

    // image 路径存在性
    if (
      typeof fm.image === 'string' &&
      fm.image.startsWith('/') &&
      !publicPathExists(fm.image)
    ) {
      addIssue(`Frontmatter image does not exist: ${fm.image}`, file);
    }

    // 标题 anchor 唯一性
    const headings = ctx.extractPostHeadings(content);
    const headingIds = new Set<string>();
    for (const heading of headings) {
      const headingId = slugifyHeading(heading);
      if (!headingId) {
        addIssue(`Heading cannot produce a stable anchor: ${heading}`, file);
        continue;
      }
      if (headingIds.has(headingId)) {
        addIssue(`Duplicate heading anchor in article: #${headingId}`, file);
      }
      headingIds.add(headingId);
    }

    // 搜索文本长度
    const searchText = ctx.buildPostSearchText(
      {
        title: fm.title,
        description: fm.description,
        tags: fm.tags,
        category: fm.category,
        series: fm.series,
      },
      content,
    );
    if (searchText.length < 80) {
      addIssue('Generated search text is too short to support useful discovery', file);
    }

    checkMdxReferences(content, file);
  }
}

function checkProjects(ctx: CheckContext): void {
  const seenIds = new Set<string>();

  for (const project of ctx.getAllProjects()) {
    if (seenIds.has(project.id)) {
      addIssue(`Duplicate project id: ${project.id}`, ctx.contentDir.projects);
    }
    seenIds.add(project.id);

    if (
      project.image &&
      project.image.startsWith('/') &&
      !publicPathExists(project.image)
    ) {
      addIssue(`Project image does not exist: ${project.image}`, ctx.contentDir.projects);
    }
  }
}

function checkSitemapCoverage(ctx: CheckContext): void {
  const siteOrigin = new URL(ctx.siteUrl).origin;
  const entries = ctx.sitemap();
  const urls = new Set(entries.map((entry) => entry.url));

  for (const entry of entries) {
    checkAbsoluteUrl(entry.url, 'Sitemap URL', siteOrigin);
  }

  const expectedUrls = [
    ctx.siteUrl,
    `${ctx.siteUrl}/blog`,
    `${ctx.siteUrl}/categories`,
    `${ctx.siteUrl}/links`,
    `${ctx.siteUrl}/projects`,
    `${ctx.siteUrl}/tags`,
    `${ctx.siteUrl}/series`,
    `${ctx.siteUrl}/about`,
    ...ctx.getAllPosts().map((post) => `${ctx.siteUrl}/blog/${post.slug}`),
    ...ctx.getAllProjects().map((project) => `${ctx.siteUrl}/projects/${project.id}`),
    ...ctx.getAllTags().map((tag) => `${ctx.siteUrl}/tags/${tag.slug}`),
    ...ctx
      .getAllSeries()
      .map((series) => `${ctx.siteUrl}/series/${encodeURIComponent(series.slug)}`),
    ...ctx
      .getAllCategories()
      .map(
        (category) => `${ctx.siteUrl}/categories/${encodeURIComponent(category.slug)}`,
      ),
  ];

  for (const url of expectedUrls) {
    if (!urls.has(url)) {
      addIssue(`Sitemap is missing expected URL: ${url}`);
    }
  }
}

async function main(): Promise<void> {
  process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

  const [
    frontmatterModule,
    schemaModule,
    siteModule,
    contentDirsModule,
    postsModule,
    categoriesModule,
    projectsModule,
    seriesModule,
    tagsModule,
    sitemapModule,
  ] = await Promise.all([
    import('../src/lib/parse-frontmatter'),
    import('../src/lib/schemas/post-frontmatter'),
    import('../src/lib/site'),
    import('../src/lib/content-dirs'),
    import('../src/lib/posts'),
    import('../src/lib/categories'),
    import('../src/lib/projects'),
    import('../src/lib/series'),
    import('../src/lib/tags'),
    import('../src/app/sitemap'),
  ]);

  const ctx: CheckContext = {
    contentDir: contentDirsModule.CONTENT_DIR,
    siteUrl: siteModule.SITE_CONFIG.url,
    parseFrontmatter: frontmatterModule.parseFrontmatter,
    postFrontmatterSchema: schemaModule.postFrontmatterSchema,
    filenameToSlug: postsModule.filenameToSlug,
    extractPostHeadings: postsModule.extractPostHeadings,
    buildPostSearchText: postsModule.buildPostSearchText,
    getAllPosts: postsModule.getAllPosts,
    getAllCategories: categoriesModule.getAllCategories,
    getAllProjects: projectsModule.getAllProjects,
    getAllSeries: seriesModule.getAllSeries,
    getAllTags: tagsModule.getAllTags,
    sitemap: sitemapModule.default,
  };

  checkPostFrontmatter(ctx);
  checkProjects(ctx);
  checkSitemapCoverage(ctx);

  if (issues.length === 0) {
    console.log('SEO/content check passed.');
    return;
  }

  console.error(`SEO/content check failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue.file ? `${issue.file}: ` : ''}${issue.message}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
