import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllLinkCategories } from '@/lib/links';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
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
    for (const cat of getAllLinkCategories()) {
      expect(screen.getAllByText(cat.title).length).toBeGreaterThan(0);
    }
  });

  it('renders category navigation, counts, and item hosts', () => {
    render(<LinksPage />);
    const categories = getAllLinkCategories();
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const firstHost = new URL(categories[0].items[0].url).hostname.replace(/^www\./, '');

    expect(screen.getByRole('navigation', { name: '链接分类' })).toBeInTheDocument();
    expect(
      screen.getAllByText(`${categories[0].items.length} 个站点`).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(String(totalItems))).toBeInTheDocument();
    expect(screen.getByText(firstHost)).toBeInTheDocument();
  });

  it('renders all link items', () => {
    render(<LinksPage />);
    for (const cat of getAllLinkCategories()) {
      for (const item of cat.items) {
        expect(screen.getAllByText(item.title).length).toBeGreaterThan(0);
      }
    }
  });

  it('renders link descriptions', () => {
    render(<LinksPage />);
    for (const cat of getAllLinkCategories()) {
      for (const item of cat.items) {
        expect(screen.getByText(item.description)).toBeInTheDocument();
      }
    }
  });

  it('renders external links with target="_blank"', () => {
    render(<LinksPage />);
    const allLinks = document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]');
    const totalItems = getAllLinkCategories().reduce(
      (sum, cat) => sum + cat.items.length,
      0,
    );
    expect(allLinks.length).toBe(totalItems);
  });

  it('keeps curated links unique and free of tracking parameters', () => {
    const categories = getAllLinkCategories();
    const urls = categories.flatMap((cat) => cat.items.map((item) => item.url));
    const trackingParamPattern = /[?&](aff|ref|referral|utm_[^=]+|coupon|partner)=/i;
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);

    expect(categories.length).toBeGreaterThanOrEqual(9);
    expect(totalItems).toBeGreaterThanOrEqual(111);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toEqual(
      expect.arrayContaining([expect.stringMatching(trackingParamPattern)]),
    );
  });

  it('includes the engineering docs, self-hosted, and VPS collections', () => {
    expect(getAllLinkCategories().some((cat) => cat.id === 'engineering-docs')).toBe(
      true,
    );
    expect(getAllLinkCategories().some((cat) => cat.id === 'self-hosted')).toBe(true);
    expect(getAllLinkCategories().some((cat) => cat.id === 'vps')).toBe(true);
  });

  it('keeps the curated self-hosted and reliability links available', () => {
    const linksByTitle = new Map(
      getAllLinkCategories()
        .flatMap((cat) => cat.items)
        .map((item) => [item.title, item.url]),
    );

    expect(linksByTitle.get('Google SRE Books')).toBe('https://sre.google/books/');
    expect(linksByTitle.get('The Twelve-Factor App')).toBe('https://12factor.net/');
    expect(linksByTitle.get('Coolify')).toBe('https://coolify.io/');
    expect(linksByTitle.get('Uptime Kuma')).toBe('https://uptime.kuma.pet/');
    expect(linksByTitle.get('PageSpeed Insights')).toBe('https://pagespeed.web.dev/');
    expect(linksByTitle.get('SSL Labs')).toBe('https://www.ssllabs.com/ssltest/');
  });

  it('keeps expanded VPS official websites available without affiliate links', () => {
    const linksByTitle = new Map(
      getAllLinkCategories()
        .flatMap((cat) => cat.items)
        .map((item) => [item.title, item.url]),
    );

    expect(linksByTitle.get('HostHatch')).toBe('https://hosthatch.com/');
    expect(linksByTitle.get('GreenCloudVPS')).toBe('https://greencloudvps.com/');
    expect(linksByTitle.get('BuyVM')).toBe('https://buyvm.net/');
    expect(linksByTitle.get('HostDare')).toBe('https://www.hostdare.com/');
  });
});
