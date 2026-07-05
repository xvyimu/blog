import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ReadingPreferences from '@/components/blog/ReadingPreferences';

describe('ReadingPreferences', () => {
  const findFontButton = (label = '标准字号') =>
    screen.findByRole('button', { name: `切换字号，当前为${label}` });

  const findWidthButton = (label = '标准栏宽') =>
    screen.findByRole('button', { name: `切换栏宽，当前为${label}` });

  beforeEach(() => {
    cleanup();
    localStorage.clear();
    // Create the target element that the component will style
    const existing = document.getElementById('article-content');
    if (!existing) {
      const el = document.createElement('div');
      el.id = 'article-content';
      el.className = 'prose';
      document.body.appendChild(el);
    }
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    const el = document.getElementById('article-content');
    if (el) el.remove();
  });

  it('renders a localized reading settings panel', async () => {
    render(<ReadingPreferences />);

    const panel = await screen.findByRole('group', { name: '阅读设置' });
    expect(panel).toHaveClass('reading-prefs--left');
    expect(panel).toHaveTextContent('阅读设置');
    expect(panel).toHaveTextContent('字号');
    expect(panel).toHaveTextContent('标准字号');
    expect(panel).toHaveTextContent('栏宽');
    expect(panel).toHaveTextContent('标准栏宽');
    expect(await findFontButton()).toBeInTheDocument();
    expect(await findWidthButton()).toBeInTheDocument();
  });

  it('mounts the fixed settings panel on document.body', async () => {
    render(<ReadingPreferences />);

    const panel = await screen.findByRole('group', { name: '阅读设置' });
    expect(panel.parentElement).toBe(document.body);
  });

  it('cycles font size: md → lg → sm → md', async () => {
    render(<ReadingPreferences />);

    // Initial: md (标准字号)
    expect(await findFontButton()).toBeInTheDocument();

    // Click: md → lg
    fireEvent.click(await findFontButton());
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换字号，当前为大字号' }),
      ).toBeInTheDocument();
    });

    // Click: lg → sm
    fireEvent.click(await findFontButton('大字号'));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换字号，当前为小字号' }),
      ).toBeInTheDocument();
    });

    // Click: sm → md
    fireEvent.click(await findFontButton('小字号'));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换字号，当前为标准字号' }),
      ).toBeInTheDocument();
    });
  });

  it('cycles width: normal → wide → narrow → normal', async () => {
    render(<ReadingPreferences />);

    // Initial: normal (标准)
    expect(await findWidthButton()).toBeInTheDocument();

    // Click: normal → wide
    fireEvent.click(await findWidthButton());
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换栏宽，当前为宽栏' }),
      ).toBeInTheDocument();
    });

    // Click: wide → narrow
    fireEvent.click(await findWidthButton('宽栏'));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换栏宽，当前为窄栏' }),
      ).toBeInTheDocument();
    });

    // Click: narrow → normal
    fireEvent.click(await findWidthButton('窄栏'));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: '切换栏宽，当前为标准栏宽' }),
      ).toBeInTheDocument();
    });
  });

  it('persists font size to localStorage', async () => {
    render(<ReadingPreferences />);

    fireEvent.click(await findFontButton());
    await waitFor(() => {
      expect(localStorage.getItem('reading-font-size')).toBe('lg');
    });
  });

  it('persists width to localStorage', async () => {
    render(<ReadingPreferences />);

    fireEvent.click(await findWidthButton());
    await waitFor(() => {
      expect(localStorage.getItem('reading-width')).toBe('wide');
    });
  });

  it('restores preferences from localStorage on mount', async () => {
    localStorage.setItem('reading-font-size', 'lg');
    localStorage.setItem('reading-width', 'narrow');

    render(<ReadingPreferences />);

    expect(await findFontButton('大字号')).toBeInTheDocument();
    expect(await findWidthButton('窄栏')).toBeInTheDocument();
  });

  it('applies CSS custom properties to target element', async () => {
    render(<ReadingPreferences />);

    // Click to change font size to lg
    fireEvent.click(await findFontButton());
    await waitFor(() => {
      const el = document.getElementById('article-content');
      expect(el?.style.getPropertyValue('--reading-font-size')).toBe('1.12rem');
    });
  });

  it('ignores invalid localStorage values', async () => {
    localStorage.setItem('reading-font-size', 'invalid');
    localStorage.setItem('reading-width', 'also-invalid');

    render(<ReadingPreferences />);

    // Should fall back to defaults
    expect(await findFontButton()).toBeInTheDocument();
    expect(await findWidthButton()).toBeInTheDocument();
  });
});
