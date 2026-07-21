import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

import WikilinkPopover from './WikilinkPopover';

const PREVIEW = {
  slug: 'nextjs-app-router',
  title: 'Next.js App Router 实战',
  date: '2026-06-01',
  description: '一篇关于 App Router 的文章',
  category: '前端开发',
  tags: ['nextjs', 'react'],
};

describe('WikilinkPopover', () => {
  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a plain anchor and never fetches when data-wikilink is absent', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    render(<WikilinkPopover href="https://example.com">外部链接</WikilinkPopover>);

    const link = screen.getByRole('link', { name: '外部链接' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    // Plain anchors carry no wikilink class hook.
    expect(link).not.toHaveClass('wikilink');

    fireEvent.mouseEnter(link);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('marks wikilinks with the wikilink class and data attribute', () => {
    vi.stubGlobal('fetch', vi.fn());

    render(
      <WikilinkPopover href="/blog/nextjs-app-router" data-wikilink="nextjs-app-router">
        App Router
      </WikilinkPopover>,
    );

    const link = screen.getByRole('link', { name: 'App Router' });
    expect(link).toHaveClass('wikilink');
    expect(link).toHaveAttribute('data-wikilink', 'nextjs-app-router');
    expect(link).toHaveAttribute('href', '/blog/nextjs-app-router');
  });

  it('fetches the preview endpoint on hover and renders the card', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => PREVIEW,
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <WikilinkPopover href="/blog/nextjs-app-router" data-wikilink="nextjs-app-router">
        App Router
      </WikilinkPopover>,
    );

    fireEvent.mouseEnter(screen.getByRole('link'));

    // Loading state shows immediately, before the fetch resolves.
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Next.js App Router 实战')).toBeInTheDocument();
    });
    expect(screen.getByText('一篇关于 App Router 的文章')).toBeInTheDocument();
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/preview/nextjs-app-router',
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('does not refetch once the preview is cached', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => PREVIEW,
    });
    vi.stubGlobal('fetch', fetchSpy);

    render(
      <WikilinkPopover href="/blog/nextjs-app-router" data-wikilink="nextjs-app-router">
        App Router
      </WikilinkPopover>,
    );

    const link = screen.getByRole('link');
    fireEvent.mouseEnter(link);
    await waitFor(() =>
      expect(screen.getByText('Next.js App Router 实战')).toBeInTheDocument(),
    );

    fireEvent.mouseLeave(link);
    fireEvent.mouseEnter(link);
    await waitFor(() =>
      expect(screen.getByText('Next.js App Router 实战')).toBeInTheDocument(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('hides the popover on mouse leave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => PREVIEW }),
    );

    render(
      <WikilinkPopover href="/blog/nextjs-app-router" data-wikilink="nextjs-app-router">
        App Router
      </WikilinkPopover>,
    );

    const link = screen.getByRole('link');
    fireEvent.mouseEnter(link);
    await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument());

    fireEvent.mouseLeave(link);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders untrusted preview text as plain text (no HTML injection)', async () => {
    const xss = '<img src=x onerror=alert(1)>';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...PREVIEW, title: xss, description: xss }),
      }),
    );

    render(
      <WikilinkPopover href="/blog/x" data-wikilink="x">
        link
      </WikilinkPopover>,
    );

    fireEvent.mouseEnter(screen.getByRole('link'));

    // React escapes the string, so it appears verbatim as text and no <img> is created.
    await waitFor(() => {
      expect(screen.getAllByText(xss).length).toBeGreaterThan(0);
    });
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.querySelector('img')).toBeNull();
  });

  it('stays silent when the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    render(
      <WikilinkPopover href="/blog/missing" data-wikilink="missing">
        missing
      </WikilinkPopover>,
    );

    fireEvent.mouseEnter(screen.getByRole('link'));

    // Loading label remains; no crash, no preview title.
    await waitFor(() => {
      expect(screen.getByText('加载中…')).toBeInTheDocument();
    });
    expect(screen.queryByText(PREVIEW.title)).not.toBeInTheDocument();
  });
});
