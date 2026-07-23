import Link from 'next/link';
import { headers } from 'next/headers';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SITE_CONFIG } from '@/lib/site';
import { MAIN_NAV_ITEMS, isNavItemActive } from '@/lib/navigation';
import HeaderScrollState from '@/components/layout/HeaderScrollState';
import MobileNav from '@/components/layout/MobileNav';

/**
 * Header shell is a Server Component (CH-PERF-006).
 * Client islands:
 *  - HeaderScrollState — rAF scroll class toggle
 *  - ThemeToggle — theme cycle
 *  - MobileNav — Sheet + usePathname
 * Desktop nav + brand render as RSC HTML (no client hydration for those nodes).
 */
export default async function Header() {
  const headerList = await headers();
  // proxy.ts stamps x-pathname on every request (incl. RSC soft nav).
  const pathname = headerList.get('x-pathname') ?? '/';

  return (
    <header className="header" data-site-header>
      <HeaderScrollState />
      <div className="header__inner">
        <Link href="/" className="header__brand">
          <span className="header__logo">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </span>
          <span className="header__name">{SITE_CONFIG.name}</span>
        </Link>

        <nav className="header__nav header__nav--desktop" aria-label="主导航">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`header__link ${isActive ? 'header__link--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="header__actions">
          <Button
            asChild
            size="icon-toolbar"
            variant="ghost"
            className="header__search-link"
          >
            <Link href="/blog?focus=search" aria-label="搜索文章" title="搜索文章">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </Link>
          </Button>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
