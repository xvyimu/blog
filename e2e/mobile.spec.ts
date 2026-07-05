import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['Pixel 5'] });

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const widths = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(widths.scrollWidth).toBeLessThanOrEqual(widths.clientWidth + 1);
}

async function getFirstPostHref(page: import('@playwright/test').Page) {
  await page.goto('/blog', { waitUntil: 'domcontentloaded' });
  const firstPost = page.locator('main a[href^="/blog/"]').first();
  await expect(firstPost).toBeVisible({ timeout: 10000 });
  return firstPost.getAttribute('href');
}

test.describe('mobile critical flows', () => {
  test('keeps header navigation accessible on a mobile viewport', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(header.locator('a[href="/blog"]')).toBeVisible();
    await expect(header.locator('a[href="/links"]')).toBeVisible();
    await expect(header.locator('a[href="/projects"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('supports mobile blog search without layout overflow', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByPlaceholder(/搜索文章/);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.focus();
    await page.keyboard.type('Redis', { delay: 20 });

    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-result]').first()).toBeVisible({
      timeout: 15000,
    });
    await expectNoHorizontalOverflow(page);
  });

  test('renders article reading UI and lazy Giscus script on mobile', async ({
    page,
  }) => {
    const href = await getFirstPostHref(page);
    expect(href).toBeTruthy();

    await page.goto(href!, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('article h1')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="reading-progress"]')).toBeAttached();

    await page.getByTestId('giscus-comments').scrollIntoViewIfNeeded();
    const giscusScript = page.locator('script[src="https://giscus.app/client.js"]');
    await expect(giscusScript).toHaveCount(1, { timeout: 15000 });
    await expect(giscusScript).toHaveAttribute('data-loading', 'lazy');
    await expect(giscusScript).toHaveAttribute('crossorigin', 'anonymous');
    await expectNoHorizontalOverflow(page);
  });

  test('renders the curated links directory and new VPS entries on mobile', async ({
    page,
  }) => {
    await page.goto('/links', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('navigation', { name: '链接分类' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole('link', { name: /HostHatch/ })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Tailwind Nextjs Starter Blog/ }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
