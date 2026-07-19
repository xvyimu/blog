import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { getAllSeries } from '@/lib/series';

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

import SeriesPage from './page';

describe('SeriesPage', () => {
  it('renders the page title', () => {
    render(<SeriesPage />);
    expect(screen.getByRole('heading', { name: '专题' })).toBeInTheDocument();
  });

  it('renders all series cards', () => {
    render(<SeriesPage />);

    for (const series of getAllSeries()) {
      expect(screen.getByText(series.name)).toBeInTheDocument();
      expect(screen.getByText(`${series.count} 篇`)).toBeInTheDocument();
    }
  });

  it('lists every post in a series, not a truncated preview', () => {
    render(<SeriesPage />);

    for (const series of getAllSeries()) {
      for (const post of series.posts) {
        expect(screen.getByText(post.title)).toBeInTheDocument();
      }
    }
  });

  it('links to series detail pages', () => {
    render(<SeriesPage />);

    for (const series of getAllSeries()) {
      const link = screen.getByText(series.name).closest('a');
      expect(link).toHaveAttribute('href', `/series/${encodeURIComponent(series.slug)}`);
    }
  });
});
