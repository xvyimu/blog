import { getAllLinkCategories } from '../src/lib/links';
import { getAllPosts } from '../src/lib/posts';
import { getAllProjects, getFeaturedProjects } from '../src/lib/projects';

type PageExpectation = {
  label: string;
  path: string;
  contentTypeIncludes: string;
  mustContain: string[];
};

type CheckFailure = {
  label: string;
  message: string;
};

const DEFAULT_ATTEMPTS = 5;
const DEFAULT_RETRY_DELAY_MS = 3000;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36';
const HOME_LINK_CATEGORY_IDS = ['ai', 'engineering-docs', 'self-hosted', 'vps'];

function readBaseUrl(): string {
  const baseUrlFlag = process.argv.find((arg) => arg.startsWith('--base-url='));
  const rawUrl =
    baseUrlFlag?.slice('--base-url='.length) ??
    process.env.PRODUCTION_CONTENT_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!rawUrl) {
    throw new Error(
      'Set NEXT_PUBLIC_SITE_URL, PRODUCTION_CONTENT_BASE_URL, or pass --base-url=https://example.com.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Production content base URL is invalid: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Production content base URL must use http(s): ${rawUrl}`);
  }

  return rawUrl.replace(/\/+$/, '');
}

function requireText(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Cannot build production content check: missing ${label}.`);
  }
  return value;
}

function buildExpectations(baseUrl: string): PageExpectation[] {
  const posts = getAllPosts();
  const projects = getAllProjects();
  const featuredProjects = getFeaturedProjects();
  const linkCategories = getAllLinkCategories();

  const homePosts = [
    ...posts.filter((post) => post.featured),
    ...posts.filter((post) => !post.featured),
  ].slice(0, 6);
  const homeLinkCategory =
    HOME_LINK_CATEGORY_IDS.map((id) =>
      linkCategories.find((category) => category.id === id),
    ).find(Boolean) ?? linkCategories[0];
  const firstLinkItem = linkCategories.find((category) => category.items.length > 0)
    ?.items[0];

  const firstPost = requireText(posts[0]?.title, 'blog post title');
  const homePost = requireText(homePosts[0]?.title, 'home article title');
  const firstProject = requireText(projects[0]?.title, 'project title');
  const homeProject = requireText(
    (featuredProjects[0] ?? projects[0])?.title,
    'home project title',
  );
  const linkCategory = requireText(homeLinkCategory?.title, 'link category title');
  const linkItem = requireText(firstLinkItem?.title, 'link item title');

  return [
    {
      label: 'home',
      path: '/',
      contentTypeIncludes: 'text/html',
      mustContain: [homePost, homeProject, linkCategory],
    },
    {
      label: 'blog',
      path: '/blog',
      contentTypeIncludes: 'text/html',
      mustContain: [firstPost],
    },
    {
      label: 'projects',
      path: '/projects',
      contentTypeIncludes: 'text/html',
      mustContain: [firstProject],
    },
    {
      label: 'links',
      path: '/links',
      contentTypeIncludes: 'text/html',
      mustContain: [linkCategory, linkItem],
    },
    {
      label: 'sitemap',
      path: '/sitemap.xml',
      contentTypeIncludes: 'xml',
      mustContain: [`${baseUrl}/blog`, `${baseUrl}/projects`, `${baseUrl}/links`],
    },
    {
      label: 'feed',
      path: '/feed.xml',
      contentTypeIncludes: 'xml',
      mustContain: [firstPost],
    },
  ];
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchTextWithRetry(url: string): Promise<{
  body: string;
  contentType: string;
  status: number;
}> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'cache-control': 'no-cache',
          'user-agent': USER_AGENT,
        },
      });
      const body = await response.text();

      if (response.ok) {
        return {
          body,
          contentType: response.headers.get('content-type') ?? '',
          status: response.status,
        };
      }

      lastError = new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < DEFAULT_ATTEMPTS) {
      await wait(DEFAULT_RETRY_DELAY_MS);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function checkPage(
  baseUrl: string,
  expectation: PageExpectation,
): Promise<CheckFailure[]> {
  const url = `${baseUrl}${expectation.path}`;
  const failures: CheckFailure[] = [];

  try {
    const response = await fetchTextWithRetry(url);

    if (!response.contentType.includes(expectation.contentTypeIncludes)) {
      failures.push({
        label: expectation.label,
        message: `Expected content-type to include "${expectation.contentTypeIncludes}", got "${response.contentType}".`,
      });
    }

    for (const text of expectation.mustContain) {
      if (!response.body.includes(text)) {
        failures.push({
          label: expectation.label,
          message: `Missing expected content "${text}" at ${url}.`,
        });
      }
    }

    console.log(
      `[production-content] ${expectation.label}: ${response.status} ${response.body.length} bytes`,
    );
  } catch (error) {
    failures.push({
      label: expectation.label,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return failures;
}

async function main(): Promise<void> {
  const baseUrl = readBaseUrl();
  const expectations = buildExpectations(baseUrl);
  const failures = (
    await Promise.all(expectations.map((expectation) => checkPage(baseUrl, expectation)))
  ).flat();

  if (failures.length === 0) {
    console.log(`[production-content] passed for ${baseUrl}`);
    return;
  }

  console.error(`[production-content] failed for ${baseUrl}:`);
  for (const failure of failures) {
    console.error(`- ${failure.label}: ${failure.message}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
