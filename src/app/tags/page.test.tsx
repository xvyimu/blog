import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { getAllTags } from '@/lib/tags';

// Mock next/link
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

import TagsPage from '@/app/tags/page';

describe('TagsPage', () => {
  beforeEach(() => cleanup());

  it('renders the page title', () => {
    render(<TagsPage />);
    expect(screen.getByText('标签')).toBeInTheDocument();
  });

  it('displays total tag count in subtitle', () => {
    render(<TagsPage />);
    const tags = getAllTags();
    expect(screen.getByText(new RegExp(`${tags.length} 个标签`))).toBeInTheDocument();
  });

  it('renders all tag names as links', () => {
    render(<TagsPage />);
    const tags = getAllTags();

    for (const tag of tags) {
      const links = screen.getAllByText(tag.tag);
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it('renders tag count badges', () => {
    render(<TagsPage />);
    const tags = getAllTags();

    for (const tag of tags) {
      // Count appears in both desktop and mobile views
      const counts = screen.getAllByText(tag.count.toString());
      expect(counts.length).toBeGreaterThan(0);
      expect(counts[0]).toHaveAttribute('data-slot', 'badge');
    }
  });

  it('links to correct tag slug URLs', () => {
    render(<TagsPage />);
    const tags = getAllTags();

    for (const tag of tags) {
      const link = screen.getAllByText(tag.tag)[0].closest('a');
      expect(link).toHaveAttribute('href', `/tags/${encodeURIComponent(tag.slug)}`);
    }
  });
});
