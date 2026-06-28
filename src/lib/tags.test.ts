import { describe, it, expect } from 'vitest';
import { getAllTags, getTagNameBySlug, getAllTagSlugs } from '@/lib/tags';

describe('getAllTags', () => {
  it('returns an array of TagInfo', () => {
    const tags = getAllTags();
    expect(Array.isArray(tags)).toBe(true);
    for (const t of tags) {
      expect(t.tag).toBeTruthy();
      expect(t.slug).toBeTruthy();
      expect(t.count).toBeGreaterThan(0);
    }
  });

  it('is sorted by count descending', () => {
    const tags = getAllTags();
    for (let i = 1; i < tags.length; i++) {
      expect(tags[i - 1].count).toBeGreaterThanOrEqual(tags[i].count);
    }
  });

  it('has unique slugs', () => {
    const tags = getAllTags();
    const slugs = tags.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('getTagNameBySlug', () => {
  it('resolves a known slug to its original tag name', () => {
    const tags = getAllTags();
    if (tags.length > 0) {
      const tagName = getTagNameBySlug(tags[0].slug);
      expect(tagName).toBe(tags[0].tag);
    }
  });

  it('resolves URL-encoded Chinese slugs', () => {
    expect(getTagNameBySlug(encodeURIComponent('后端'))).toBe('后端');
  });

  it('returns null for an unknown slug', () => {
    expect(getTagNameBySlug('this-tag-does-not-exist')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getTagNameBySlug('')).toBeNull();
  });
});

describe('getAllTagSlugs', () => {
  it('returns all tag slugs', () => {
    const tags = getAllTags();
    const slugs = getAllTagSlugs();
    expect(slugs.length).toBe(tags.length);
    expect(slugs.every((s) => typeof s === 'string')).toBe(true);
  });
});
