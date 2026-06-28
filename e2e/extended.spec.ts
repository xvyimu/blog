import { test, expect } from '@playwright/test';

test.describe('作品详情页', () => {
  test('从作品集进入作品详情', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    // Wait for project cards to render
    await expect(page.locator('a[href*="/projects/"]').first()).toBeVisible({ timeout: 10000 });
    // Find a project detail link (not /projects itself)
    const projectLink = page.locator('a[href*="/projects/"]').first();
    const href = await projectLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('/projects');
    expect(href).toMatch(/\/projects\/[^/]+$/);

    await projectLink.click();
    await expect(page).toHaveURL(/\/projects\/[^/]+$/);

    // Should have a title (h1)
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('作品详情页显示内容', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('a[href*="/projects/"]').first()).toBeVisible({ timeout: 10000 });
    const projectLink = page.locator('a[href*="/projects/"]').first();
    const href = await projectLink.getAttribute('href');
    expect(href).toMatch(/\/projects\/[^/]+$/);

    await projectLink.click();

    // Page body should have meaningful content
    await expect(page.locator('body')).toBeVisible();
    // Should have some text content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('标签详情页', () => {
  test('标签详情页显示相关文章', async ({ page }) => {
    await page.goto('/tags');
    await page.waitForLoadState('domcontentloaded');

    // Click the first tag link
    const tagLink = page.locator('a[href*="/tags/"]').first();
    await expect(tagLink).toBeVisible({ timeout: 10000 });
    const href = await tagLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('/tags');
    expect(href).toMatch(/\/tags\/[^/]+$/);

    await tagLink.click();
    await expect(page).toHaveURL(/\/tags\/[^/]+$/);

    // Should display the tag name as heading
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });

    // Should have at least one blog post link
    const blogLinks = page.locator('a[href*="/blog/"]');
    const count = await blogLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('中文标签 URL 编码后仍显示相关文章', async ({ page }) => {
    await page.goto(`/tags/${encodeURIComponent('后端')}`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: '标签：后端' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible();
  });
});

test.describe('分类详情页', () => {
  test('中文分类 URL 编码后仍显示相关文章', async ({ page }) => {
    await page.goto(`/categories/${encodeURIComponent('前端开发')}`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: '分类：前端开发' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible();
  });
});

test.describe('关于页面', () => {
  test('渲染 MDX 内容', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');

    // Use exact match — "关于" also matches "关于西江月" as substring
    await expect(page.getByRole('heading', { name: '关于', exact: true })).toBeVisible({ timeout: 10000 });

    // Should have meaningful content (not just empty page)
    const bodyText = await page.locator('main, article, body').first().textContent();
    expect(bodyText?.trim().length).toBeGreaterThan(50);
  });
});

test.describe('RSS Feed', () => {
  test('feed.xml 可访问且为有效 XML', async ({ page }) => {
    const response = await page.goto('/feed.xml');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('xml');

    // Should contain RSS elements
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('<rss');
    expect(bodyText).toContain('<item');
  });

  test('feed.json 可访问且为有效 JSON', async ({ page }) => {
    const response = await page.goto('/feed.json');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('json');

    // Parse and validate JSON structure
    const bodyText = await page.locator('body').textContent();
    const feed = JSON.parse(bodyText ?? '{}');
    expect(feed.version).toBeDefined();
    expect(Array.isArray(feed.items)).toBeTruthy();
    expect(feed.items.length).toBeGreaterThan(0);
  });
});

test.describe('Sitemap', () => {
  test('sitemap.xml 可访问且包含 URL', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'] ?? '';
    expect(contentType).toContain('xml');

    // Should contain urlset and url entries
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('<urlset');
    expect(bodyText).toContain('<loc>');

    // Should contain blog URLs
    expect(bodyText).toContain('/blog/');
  });
});

test.describe('robots.txt', () => {
  test('robots.txt 可访问', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);

    const bodyText = await page.locator('body').textContent() ?? '';
    // Next.js generates "User-Agent" (capital A)
    expect(bodyText.toLowerCase()).toContain('user-agent');
    expect(bodyText.toLowerCase()).toContain('allow');
  });
});
