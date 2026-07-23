import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';

// Mock next/link
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

// Mock next/navigation usePathname (MobileNav)
const mockPathname = vi.fn().mockReturnValue('/');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock ThemeToggle
vi.mock('@/components/ui/ThemeToggle', () => ({
  default: () => <button type="button" aria-label="切换主题" />,
}));

// Mock next/headers for async RSC Header
vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({
      'x-pathname': mockPathname(),
    }),
}));

import Header from './Header';
import HeaderScrollState from './HeaderScrollState';
import MobileNav from './MobileNav';

async function renderHeader() {
  const ui = await Header();
  return render(ui);
}

describe('Header (RSC shell + client islands)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the site name', async () => {
    await renderHeader();
    expect(screen.getByText('西江月')).toBeInTheDocument();
  });

  it('renders all navigation links', async () => {
    await renderHeader();
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(screen.getByText('博客')).toBeInTheDocument();
    expect(screen.getByText('花园')).toBeInTheDocument();
    expect(screen.getByText('导航')).toBeInTheDocument();
    expect(screen.getByText('分类')).toBeInTheDocument();
    expect(screen.getByText('专题')).toBeInTheDocument();
    expect(screen.getByText('作品')).toBeInTheDocument();
    expect(screen.getByText('关于')).toBeInTheDocument();
  });

  it('marks home link as active when on home page', async () => {
    mockPathname.mockReturnValue('/');
    await renderHeader();
    const homeLink = screen.getAllByText('首页')[0];
    expect(homeLink.className).toContain('header__link--active');
  });

  it('marks blog link as active when on /blog', async () => {
    mockPathname.mockReturnValue('/blog');
    await renderHeader();
    const blogLink = screen.getAllByText('博客')[0];
    expect(blogLink.className).toContain('header__link--active');
    expect(screen.getAllByText('首页')[0].className).not.toContain(
      'header__link--active',
    );
  });

  it('exposes active navigation state to assistive technology', async () => {
    mockPathname.mockReturnValue('/blog');
    await renderHeader();

    const blogLinks = screen.getAllByRole('link', { name: '博客' });
    expect(blogLinks[0]).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('link', { name: '首页' })[0]).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks blog link as active when on /blog/some-post', async () => {
    mockPathname.mockReturnValue('/blog/test-post');
    await renderHeader();
    expect(screen.getAllByText('博客')[0].className).toContain(
      'header__link--active',
    );
  });

  it('marks series link as active when on /series/some-series', async () => {
    mockPathname.mockReturnValue('/series/personal-deploy');
    await renderHeader();
    expect(screen.getAllByText('专题')[0].className).toContain(
      'header__link--active',
    );
  });

  it('does not highlight home for sub-pages', async () => {
    mockPathname.mockReturnValue('/about');
    await renderHeader();
    expect(screen.getAllByText('首页')[0].className).not.toContain(
      'header__link--active',
    );
  });

  it('renders ThemeToggle', async () => {
    await renderHeader();
    expect(screen.getByLabelText('切换主题')).toBeInTheDocument();
  });

  it('renders a search shortcut link', async () => {
    await renderHeader();
    expect(screen.getByLabelText('搜索文章')).toHaveAttribute(
      'href',
      '/blog?focus=search',
    );
  });

  it('renders mobile menu toggle button', async () => {
    await renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');
    expect(menuBtn).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    expect(menuBtn).toHaveAttribute('aria-controls', 'mobile-nav');
  });

  it('toggles mobile menu on click', async () => {
    await renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(screen.getByLabelText('关闭菜单')).toBeInTheDocument();
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('moves focus into the mobile navigation when the menu opens', async () => {
    await renderHeader();

    const trigger = screen.getByLabelText('打开菜单');
    trigger.focus();
    fireEvent.click(trigger);

    const mobileNav = await screen.findByLabelText('主导航', {
      selector: '#mobile-nav',
    });
    const firstLink = mobileNav.querySelector('a');
    expect(firstLink).toBeInstanceOf(HTMLAnchorElement);
    if (!(firstLink instanceof HTMLAnchorElement)) {
      throw new Error('Expected the mobile navigation to render a link.');
    }
    await waitFor(() => {
      expect(firstLink).toHaveFocus();
    });
  });

  it('closes mobile menu when pathname changes', async () => {
    mockPathname.mockReturnValue('/');
    const { unmount } = await renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    unmount();
    mockPathname.mockReturnValue('/blog');
    await renderHeader();
    const newMenuBtn = screen.getByLabelText('打开菜单');
    expect(newMenuBtn).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes mobile menu when backdrop is clicked', async () => {
    await renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    const backdrop = await waitFor(() => {
      const node = document.querySelector('.header__backdrop');
      expect(node).toBeInTheDocument();
      return node as Element;
    });
    fireEvent.pointerDown(backdrop);
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('closes mobile menu when Escape is pressed', async () => {
    await renderHeader();
    const menuBtn = screen.getByLabelText('打开菜单');

    fireEvent.click(menuBtn);
    expect(menuBtn).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
    });
  });

  it('renders brand link pointing to /', async () => {
    await renderHeader();
    const brandLink = screen.getByText('西江月').closest('a');
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('has proper accessible navigation label', async () => {
    await renderHeader();
    const nav = screen.getByLabelText('主导航');
    expect(nav).toBeInTheDocument();
  });
});

describe('HeaderScrollState', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '<header data-site-header class="header"></header>';
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('applies scrolled class when scrolled past threshold (rAF coalesced)', () => {
    const rafCallbacks: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    render(<HeaderScrollState />);
    const headerEl = document.querySelector('header');
    expect(headerEl?.className).not.toContain('is-scrolled');

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 20,
    });
    fireEvent.scroll(window);
    expect(rafCallbacks.length).toBeGreaterThan(0);
    rafCallbacks[rafCallbacks.length - 1](0);
    expect(headerEl?.className).toContain('is-scrolled');
  });
});

describe('MobileNav island', () => {
  beforeEach(() => {
    cleanup();
    mockPathname.mockReturnValue('/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders toggle with closed state', () => {
    render(<MobileNav />);
    expect(screen.getByLabelText('打开菜单')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
