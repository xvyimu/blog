import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';

// next/link → plain anchor (nodes navigate via window.location, but panels use Link)
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

// Force the force-directed layout path (not the reduced-motion list fallback).
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => false,
}));

import GardenExplorer from './GardenExplorer';
import type { GardenGraph } from '@/lib/posts/link-graph';

// a—b connected, c isolated. Hovering `a` keeps a+b lit and dims c.
const graph: GardenGraph = {
  nodes: [
    { slug: 'a', title: 'Node A', tags: ['x'] },
    { slug: 'b', title: 'Node B', tags: ['x'] },
    { slug: 'c', title: 'Node C', tags: ['y'] },
  ],
  edges: [{ from: 'a', to: 'b' }],
};

// The bottom note list also renders <a>Node X</a>, so role/text queries are
// ambiguous. Target the SVG circles directly by their aria-label.
const circleByLabel = (container: HTMLElement, title: string): SVGCircleElement => {
  const el = container.querySelector<SVGCircleElement>(`circle[aria-label="${title}"]`);
  if (!el) throw new Error(`circle for "${title}" not found`);
  return el;
};

describe('GardenExplorer hover neighbor highlight', () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('renders force-layout circles once positions are computed', async () => {
    const { container } = render(<GardenExplorer graph={graph} />);
    await waitFor(() =>
      expect(container.querySelector('circle[aria-label="Node A"]')).not.toBeNull(),
    );
    expect(circleByLabel(container, 'Node B')).toBeInTheDocument();
    expect(circleByLabel(container, 'Node C')).toBeInTheDocument();
  });

  it('dims non-neighbor nodes when hovering a node', async () => {
    const { container } = render(<GardenExplorer graph={graph} />);
    await waitFor(() =>
      expect(container.querySelector('circle[aria-label="Node A"]')).not.toBeNull(),
    );

    fireEvent.mouseEnter(circleByLabel(container, 'Node A'));

    // A (active) and B (neighbor) stay lit; C (unconnected) is dimmed.
    expect(circleByLabel(container, 'Node A')).not.toHaveClass(
      'garden-explorer__node--dim',
    );
    expect(circleByLabel(container, 'Node B')).not.toHaveClass(
      'garden-explorer__node--dim',
    );
    expect(circleByLabel(container, 'Node C')).toHaveClass('garden-explorer__node--dim');
  });

  it('clears highlight on mouse leave', async () => {
    const { container } = render(<GardenExplorer graph={graph} />);
    await waitFor(() =>
      expect(container.querySelector('circle[aria-label="Node A"]')).not.toBeNull(),
    );

    fireEvent.mouseEnter(circleByLabel(container, 'Node A'));
    expect(circleByLabel(container, 'Node C')).toHaveClass('garden-explorer__node--dim');

    fireEvent.mouseLeave(circleByLabel(container, 'Node A'));
    expect(circleByLabel(container, 'Node C')).not.toHaveClass(
      'garden-explorer__node--dim',
    );
  });
});
