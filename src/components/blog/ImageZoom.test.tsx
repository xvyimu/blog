import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

// Mock next/image
vi.mock('next/image', async () => {
  const { default: MockNextImage } = await import('@/test/mocks/next-image');
  return { default: MockNextImage };
});

import ImageZoom, {
  DEFAULT_HEIGHT,
  DEFAULT_QUALITY,
  DEFAULT_SIZES,
  DEFAULT_WIDTH,
} from './ImageZoom';

describe('ImageZoom', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    // Restore body overflow in case a test left it dirty
    document.body.style.overflow = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.style.overflow = '';
  });

  it('returns null when src is not provided', () => {
    const { container } = render(<ImageZoom />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the thumbnail image', () => {
    render(<ImageZoom src="/test.jpg" alt="Test image" />);
    // Thumbnail has role="button" due to component's a11y
    const thumb = screen.getByRole('button', { name: 'Test image — 点击放大' });
    expect(thumb).toBeInTheDocument();
    expect(thumb).toHaveAttribute('src', '/test.jpg');
    expect(thumb).toHaveClass('image-zoom__trigger');
    expect(thumb).toHaveAttribute('width', String(DEFAULT_WIDTH));
    expect(thumb).toHaveAttribute('height', String(DEFAULT_HEIGHT));
    expect(thumb).toHaveAttribute('loading', 'lazy');
    expect(thumb).toHaveAttribute('decoding', 'async');
    expect(thumb).toHaveAttribute('data-quality', String(DEFAULT_QUALITY));
    expect(thumb).toHaveAttribute('data-sizes', DEFAULT_SIZES);
  });

  it('honors explicit width/height/sizes/quality and priority loading', () => {
    render(
      <ImageZoom
        src="/hero.jpg"
        alt="Hero"
        width={800}
        height={400}
        sizes="100vw"
        quality={55}
        priority
      />,
    );
    const thumb = screen.getByRole('button', { name: 'Hero — 点击放大' });
    expect(thumb).toHaveAttribute('width', '800');
    expect(thumb).toHaveAttribute('height', '400');
    expect(thumb).toHaveAttribute('data-sizes', '100vw');
    expect(thumb).toHaveAttribute('data-quality', '55');
    expect(thumb).toHaveAttribute('decoding', 'async');
    // priority maps to no lazy loading attr from component path
    expect(thumb).not.toHaveAttribute('loading', 'lazy');
  });

  it('uses blurDataURL when provided', () => {
    render(
      <ImageZoom src="/test.jpg" alt="Blur" blurDataURL="data:image/webp;base64,AAAA" />,
    );
    // Mock strips blur props; ensure render still succeeds with explicit LQIP
    expect(screen.getByRole('button', { name: 'Blur — 点击放大' })).toBeInTheDocument();
  });

  it('preserves caller classes and inline thumbnail overrides', () => {
    render(
      <ImageZoom
        src="/test.jpg"
        alt="Styled"
        className="prose-image"
        style={{ objectPosition: 'top' }}
      />,
    );

    const thumb = screen.getByRole('button', { name: 'Styled — 点击放大' });
    expect(thumb).toHaveClass('image-zoom__trigger', 'prose-image');
    expect(thumb).toHaveStyle({ objectPosition: 'top' });
  });

  it('opens overlay on thumbnail click', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test');
  });

  it('closes overlay on close button click', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('关闭'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes overlay on backdrop click', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Dialog element IS the backdrop
    fireEvent.click(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when clicking overlay image', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));

    // The large image inside the overlay has role="img"
    const overlayImg = screen.getByRole('img');
    fireEvent.click(overlayImg);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes overlay on Escape key', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets body overflow hidden when open, restores on close', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    expect(document.body.style.overflow).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(screen.getByLabelText('关闭'));
    expect(document.body.style.overflow).toBe('');
  });

  it('opens on Enter key on the thumbnail', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test — 点击放大' }), {
      key: 'Enter',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens on Space key on the thumbnail', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test — 点击放大' }), {
      key: ' ',
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not open on other key presses', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Test — 点击放大' }), {
      key: 'Tab',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders large image inside overlay with fill layout', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" quality={60} />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));

    const overlayImg = screen.getByRole('img');
    expect(overlayImg).toHaveAttribute('src', '/test.jpg');
    expect(overlayImg).toHaveAttribute('data-fill', 'true');
    expect(overlayImg).toHaveAttribute('data-quality', '60');
    expect(overlayImg).toHaveAttribute('decoding', 'async');
    expect(overlayImg).toHaveClass('image-zoom__img');
  });

  it('returns focus to trigger element on close', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    const trigger = screen.getByRole('button', { name: 'Test — 点击放大' });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByLabelText('关闭'));

    expect(document.activeElement).toBe(trigger);
  });

  it('renders close button with X icon', () => {
    render(<ImageZoom src="/test.jpg" alt="Test" />);
    fireEvent.click(screen.getByRole('button', { name: 'Test — 点击放大' }));

    const closeBtn = screen.getByLabelText('关闭');
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveClass('image-zoom__close');
    expect(closeBtn).not.toHaveAttribute('style');
    expect(closeBtn.querySelector('svg')).toBeInTheDocument();
  });
});
