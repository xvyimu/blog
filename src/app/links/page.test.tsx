import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { linkCategories } from '@/lib/links';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: { href: string; children: React.ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import LinksPage from '@/app/links/page';

describe('LinksPage', () => {
  beforeEach(() => cleanup());

  it('renders the page title', () => {
    render(<LinksPage />);
    expect(screen.getByText('导航')).toBeInTheDocument();
  });

  it('renders all category titles', () => {
    render(<LinksPage />);
    for (const cat of linkCategories) {
      expect(screen.getByText(cat.title)).toBeInTheDocument();
    }
  });

  it('renders all link items', () => {
    render(<LinksPage />);
    for (const cat of linkCategories) {
      for (const item of cat.items) {
        expect(screen.getByText(item.title)).toBeInTheDocument();
      }
    }
  });

  it('renders link descriptions', () => {
    render(<LinksPage />);
    for (const cat of linkCategories) {
      for (const item of cat.items) {
        expect(screen.getByText(item.description)).toBeInTheDocument();
      }
    }
  });

  it('renders external links with target="_blank"', () => {
    render(<LinksPage />);
    const allLinks = document.querySelectorAll<HTMLAnchorElement>(
      'a[target="_blank"]',
    );
    const totalItems = linkCategories.reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    );
    expect(allLinks.length).toBe(totalItems);
  });

  it('keeps curated links unique and free of tracking parameters', () => {
    const urls = linkCategories.flatMap((cat) =>
      cat.items.map((item) => item.url),
    );
    const trackingParamPattern =
      /[?&](aff|ref|referral|utm_[^=]+|coupon|partner)=/i;

    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toEqual(
      expect.arrayContaining([expect.stringMatching(trackingParamPattern)]),
    );
  });

  it('includes the engineering docs and VPS collections', () => {
    expect(linkCategories.some((cat) => cat.id === 'engineering-docs')).toBe(
      true,
    );
    expect(linkCategories.some((cat) => cat.id === 'vps')).toBe(true);
  });
});
