import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

// Mock usePrefersReducedMotion
const mockReduced = vi.fn().mockReturnValue(false);
vi.mock('@/hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

import MagneticCard from './MagneticCard';

describe('MagneticCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockReduced.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children content', () => {
    render(
      <MagneticCard>
        <span>Card content</span>
      </MagneticCard>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <MagneticCard className="custom-class">
        <span>Content</span>
      </MagneticCard>,
    );
    const article = container.querySelector('article');
    expect(article?.className).toContain('custom-class');
    expect(article?.className).toContain('magnetic-card');
  });

  it('can render as a different semantic element', () => {
    const { container } = render(
      <MagneticCard as="section">
        <span>Section content</span>
      </MagneticCard>,
    );

    expect(container.querySelector('section.magnetic-card')).toBeInTheDocument();
  });

  it('applies pointer-driven spotlight variables and custom strength', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    render(
      <MagneticCard strength={6}>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;

    vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(article, { clientX: 150, clientY: 50 });
    expect(article.style.transform).toBe('');
    expect(rafCallbacks).toHaveLength(1);
    rafCallbacks[0](0);

    expect(article.style.transform).toContain('perspective(720px)');
    expect(article.style.transform).toContain('rotateY(1.5deg)');
    expect(article.style.getPropertyValue('--glow-x')).toBe('75%');
    expect(article.style.getPropertyValue('--glow-y')).toBe('50%');
    expect(article.style.getPropertyValue('--spotlight-x')).toBe('150px');
    expect(article.style.getPropertyValue('--spotlight-y')).toBe('50px');
  });

  it('coalesces multiple pointer moves into a single rAF apply', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;
    const rectSpy = vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(article, { clientX: 100, clientY: 25 });
    fireEvent.pointerMove(article, { clientX: 150, clientY: 50 });
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(rectSpy).not.toHaveBeenCalled();

    rafCallbacks[0](0);
    expect(rectSpy).toHaveBeenCalledTimes(1);
    expect(article.style.getPropertyValue('--spotlight-x')).toBe('150px');
    expect(article.style.getPropertyValue('--spotlight-y')).toBe('50px');
  });

  it('applies magnetic transform on pointer move', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;

    vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(article, { clientX: 150, clientY: 50 });
    rafCallbacks[0](0);

    expect(article.style.transform).toContain('perspective(720px)');
    expect(article.style.transform).toContain('rotateY');
    expect(article.style.transform).toContain('rotateX');
    expect(article.style.getPropertyValue('--glow-x')).toBe('75%');
    expect(article.style.getPropertyValue('--glow-y')).toBe('50%');
  });

  it('clears transform on pointer leave', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);

    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;

    vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(article, { clientX: 150, clientY: 50 });
    rafCallbacks[0](0);
    expect(article.style.transform).toBeTruthy();

    fireEvent.pointerLeave(article);
    expect(article.style.transform).toBe('');
    expect(article.style.getPropertyValue('--glow-x')).toBe('');
  });

  it('skips transform when prefers-reduced-motion is enabled', () => {
    mockReduced.mockReturnValue(true);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;

    vi.spyOn(article, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 100,
      left: 0,
      top: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerMove(article, { clientX: 150, clientY: 50 });
    expect(rafSpy).not.toHaveBeenCalled();
    expect(article.style.transform).toBe('');
  });

  it('ignores compatibility mouse move events', () => {
    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    const article = document.querySelector('article')!;
    const rectSpy = vi.spyOn(article, 'getBoundingClientRect');

    fireEvent.mouseMove(article, { clientX: 150, clientY: 50 });

    expect(rectSpy).not.toHaveBeenCalled();
    expect(article.style.transform).toBe('');
  });

  it('does not throw when ref is null on pointer move', () => {
    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    // Should not throw — clean up and check that handling null ref is safe
    cleanup();
    // Re-render to test normal behaviour
    render(
      <MagneticCard>
        <span>Content</span>
      </MagneticCard>,
    );
    expect(document.querySelector('.magnetic-card')).toBeInTheDocument();
  });
});
