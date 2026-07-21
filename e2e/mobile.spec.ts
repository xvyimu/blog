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
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Mobile nav lives in a Sheet; open the menu before asserting links.
    const menuBtn = page.getByRole('button', { name: /打开菜单|关闭菜单/ });
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
    await menuBtn.click();

    const mobileNav = page.locator('#mobile-nav');
    await expect(mobileNav).toBeVisible({ timeout: 10000 });
    const firstLink = mobileNav.locator('a').first();
    await expect(firstLink).toBeFocused();
    await expect(mobileNav.locator('a[href="/blog"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(mobileNav.locator('a[href="/blog"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/links"]')).toBeVisible();
    await expect(mobileNav.locator('a[href="/projects"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('supports mobile blog search without layout overflow', async ({ page }) => {
    await page.goto('/blog', { waitUntil: 'domcontentloaded' });

    const searchInput = page.getByRole('combobox', { name: '搜索文章' });
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.ok(),
      { timeout: 15000 },
    );
    await searchInput.focus();
    await page.keyboard.type('Redis', { delay: 20 });
    await responsePromise;

    await expect(page.getByRole('listbox')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-result]').first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page).toHaveURL(/[?&]q=Redis/);
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

  test('applies the project title responsive size at runtime', async ({ page }) => {
    await page.goto('/projects/chrono-portal', { waitUntil: 'domcontentloaded' });

    const title = page.locator('.project-detail__title');
    await expect(title).toBeVisible({ timeout: 10000 });
    const sizes = await title.evaluate((element) => {
      const rootSize = Number.parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );
      return {
        actual: Number.parseFloat(getComputedStyle(element).fontSize),
        expected: Math.min(
          Math.max(2.2 * rootSize, window.innerWidth * 0.12),
          3.6 * rootSize,
        ),
      };
    });

    expect(sizes.actual).toBeCloseTo(sizes.expected, 1);
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

    const filter = page.getByRole('searchbox', { name: '筛选收藏链接' });
    await expect(filter).toBeVisible({ timeout: 10000 });
    await filter.focus();
    await page.keyboard.type('HostHatch', { delay: 20 });

    await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /HostHatch/ })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Tailwind Nextjs Starter Blog/ }),
    ).toHaveCount(0);

    await page.getByRole('button', { name: '清除链接筛选' }).click();
    await expect(filter).toHaveValue('');
    await expect(
      page.getByRole('link', { name: /Tailwind Nextjs Starter Blog/ }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
