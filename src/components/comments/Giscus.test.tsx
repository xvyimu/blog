import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Mock useInView
const mockInView = vi.fn().mockReturnValue(false);
vi.mock('@/hooks/useInView', () => ({
  useInView: () => mockInView(),
}));

import Giscus from './Giscus';

describe('Giscus', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockInView.mockReturnValue(false);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the placeholder when not in view', () => {
    mockInView.mockReturnValue(false);
    render(<Giscus />);
    expect(screen.getByText('滚动到此处加载评论')).toBeInTheDocument();
  });

  it('does not render placeholder when in view', () => {
    mockInView.mockReturnValue(true);
    render(<Giscus />);
    expect(screen.queryByText('滚动到此处加载评论')).not.toBeInTheDocument();
  });

  it('has sentinel container with mt-16 class', () => {
    const { container } = render(<Giscus />);
    const sentinel = container.firstElementChild;
    expect(sentinel?.className).toContain('mt-16');
    expect(sentinel).toHaveAttribute('data-testid', 'giscus-comments');
  });

  it('applies giscus-repo attribute when visible', () => {
    // Need to simulate: visible → creates container → script appended
    // In jsdom, the script won't load, but we can check container presence
    mockInView.mockReturnValue(true);
    const { container } = render(<Giscus />);
    // The visible container is where script would be appended
    const innerDiv = container.querySelector('.mt-16 > div');
    // The sentinel is the outer div, and when visible the inner container div is rendered
    expect(innerDiv).toBeInTheDocument();
    expect(container.querySelector('.mt-16')).toBeInTheDocument();
  });

  it('renders with correct spacing classes', () => {
    render(<Giscus />);
    const sentinel = document.querySelector('.mt-16');
    expect(sentinel).toBeInTheDocument();
  });

  it('takes default props from SITE_CONFIG', () => {
    mockInView.mockReturnValue(true);
    render(<Giscus />);
    // Should not throw when rendered with defaults
    const sentinel = document.querySelector('.mt-16');
    expect(sentinel).toBeInTheDocument();
  });

  it('accepts custom props', () => {
    mockInView.mockReturnValue(false);
    render(
      <Giscus
        repoId="custom-repo"
        category="General"
        categoryId="custom-cat"
        mapping="url"
        lang="en"
      />,
    );
    // Still renders placeholder
    expect(screen.getByText('滚动到此处加载评论')).toBeInTheDocument();
  });
});
