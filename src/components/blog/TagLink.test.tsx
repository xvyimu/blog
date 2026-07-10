import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TagLink from './TagLink';

describe('TagLink', () => {
  it('renders tag text', () => {
    render(<TagLink tag="React" slug="react" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('links to correct tag page', () => {
    render(<TagLink tag="TypeScript" slug="typescript" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tags/typescript');
  });

  it('handles multi-word tag slugs', () => {
    render(<TagLink tag="Machine Learning" slug="machine-learning" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/tags/machine-learning');
  });

  it('encodes non-ASCII tag slugs as URL segments', () => {
    render(<TagLink tag="性能优化" slug="性能优化" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/tags/${encodeURIComponent('性能优化')}`);
  });
});
