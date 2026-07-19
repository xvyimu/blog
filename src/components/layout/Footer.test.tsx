import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

import Footer from './Footer';

describe('Footer', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30'));
  });

  it('renders site name', () => {
    render(<Footer />);
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('renders current year in copyright', () => {
    render(<Footer />);
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('renders GitHub social link', () => {
    render(<Footer />);
    const ghLink = screen.getByLabelText('GitHub');
    expect(ghLink).toHaveAttribute('href', 'https://github.com/xvyimu');
    expect(ghLink).toHaveAttribute('target', '_blank');
    expect(ghLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
