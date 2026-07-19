import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

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

import HomeCtaSection from './HomeCtaSection';

describe('HomeCtaSection', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the signature title', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText('留一间安静的工作室')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText(/持续整理实践、工具和项目样本/)).toBeInTheDocument();
  });

  it('renders about link', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText('关于我').closest('a')).toHaveAttribute('href', '/about');
  });

  it('renders GitHub link with correct href', () => {
    render(<HomeCtaSection />);
    const ghLink = screen.getByText('GitHub').closest('a');
    expect(ghLink).toHaveAttribute('href', 'https://github.com/xvyimu');
    expect(ghLink).toHaveAttribute('target', '_blank');
  });

  it('renders RSS link', () => {
    render(<HomeCtaSection />);
    expect(screen.getByText('RSS').closest('a')).toHaveAttribute('href', '/feed.xml');
  });

  it('has accessible heading', () => {
    render(<HomeCtaSection />);
    expect(screen.getByLabelText('留一间安静的工作室')).toBeInTheDocument();
  });
});
