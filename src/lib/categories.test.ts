import { describe, it, expect } from 'vitest';
import { getAllCategories, getPostsByCategory, isValidCategory, getAllCategorySlugs, inferCategory } from '@/lib/categories';

describe('inferCategory', () => {
  it('infers frontend category from related tags', () => {
    expect(inferCategory(['Next.js', 'React'])).toBe('前端开发');
    expect(inferCategory(['TypeScript', '类型系统'])).toBe('前端开发');
    expect(inferCategory(['性能优化', 'Core Web Vitals'])).toBe('前端开发');
  });

  it('infers database category from related tags', () => {
    expect(inferCategory(['PostgreSQL'])).toBe('数据库');
    expect(inferCategory(['Redis', '缓存'])).toBe('数据库');
  });

  it('infers DevOps category from related tags', () => {
    expect(inferCategory(['Docker', '部署'])).toBe('DevOps');
    expect(inferCategory(['Nginx', 'Linux'])).toBe('DevOps');
  });

  it('infers CI/CD category', () => {
    expect(inferCategory(['CI/CD', 'GitHub Actions'])).toBe('CI/CD');
    expect(inferCategory(['Git', '自动化'])).toBe('CI/CD');
  });

  it('infers cloud service category', () => {
    expect(inferCategory(['Cloudflare', 'Workers'])).toBe('云服务');
    expect(inferCategory(['Serverless', '无服务器'])).toBe('云服务');
  });

  it('returns null for unknown tags', () => {
    expect(inferCategory(['未知标签', 'nonexistent'])).toBeNull();
  });

  it('returns null for empty tags array', () => {
    expect(inferCategory([])).toBeNull();
  });

  it('returns the first matching category when tags span multiple categories', () => {
    // inferCategory returns first match; Postgres tag appears before 后端
    expect(inferCategory(['PostgreSQL', '数据库', '后端'])).toBe('数据库');
  });
});

describe('getAllCategories', () => {
  it('returns an array of CategoryInfo', () => {
    const cats = getAllCategories();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.name).toBeTruthy();
      expect(c.slug).toBeTruthy();
      expect(c.count).toBeGreaterThan(0);
      expect(Array.isArray(c.tags)).toBe(true);
    }
  });

  it('is sorted by count descending', () => {
    const cats = getAllCategories();
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i - 1].count).toBeGreaterThanOrEqual(cats[i].count);
    }
  });

  it('has unique names', () => {
    const cats = getAllCategories();
    const names = cats.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every category has at least one tag', () => {
    const cats = getAllCategories();
    for (const c of cats) {
      expect(c.tags.length).toBeGreaterThan(0);
    }
  });
});

describe('getPostsByCategory', () => {
  it('returns posts for a known category', () => {
    const posts = getPostsByCategory('前端开发');
    expect(posts.length).toBeGreaterThan(0);
    for (const p of posts) {
      // 确保每篇文章至少有一个标签映射到该分类
      const inferred = inferCategory(p.tags);
      expect(inferred).toBe('前端开发');
    }
  });

  it('returns posts for DevOps category', () => {
    const posts = getPostsByCategory('DevOps');
    expect(posts.length).toBeGreaterThan(0);
  });

  it('returns posts for 数据库 category', () => {
    const posts = getPostsByCategory('数据库');
    expect(posts.length).toBeGreaterThan(0);
  });

  it('returns posts for URL-encoded Chinese category names', () => {
    const posts = getPostsByCategory(encodeURIComponent('数据库'));
    expect(posts.length).toBeGreaterThan(0);
  });

  it('returns empty array for non-existent category', () => {
    const posts = getPostsByCategory('不存在的分类');
    expect(posts).toEqual([]);
  });
});

describe('isValidCategory', () => {
  it('returns true for existing categories', () => {
    const cats = getAllCategories();
    for (const c of cats) {
      expect(isValidCategory(c.slug)).toBe(true);
    }
  });

  it('returns true for URL-encoded Chinese category names', () => {
    expect(isValidCategory(encodeURIComponent('前端开发'))).toBe(true);
  });

  it('returns false for non-existent category', () => {
    expect(isValidCategory('不存在的分类')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidCategory('')).toBe(false);
  });
});

describe('getAllCategorySlugs', () => {
  it('returns all category slugs', () => {
    const cats = getAllCategories();
    const slugs = getAllCategorySlugs();
    expect(slugs.length).toBe(cats.length);
    expect(slugs.every((s) => typeof s === 'string')).toBe(true);
  });

  it('slugs match category names', () => {
    const cats = getAllCategories();
    const slugs = getAllCategorySlugs();
    for (const c of cats) {
      expect(slugs).toContain(c.name);
    }
  });
});
