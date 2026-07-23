'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MAIN_NAV_ITEMS, isNavItemActive } from '@/lib/navigation';

/**
 * Mobile-only nav island (Sheet + pathname close). Desktop nav stays RSC.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileFirstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          size="icon-toolbar"
          variant="ghost"
          className="header__mobile-toggle"
          aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          title={mobileOpen ? '关闭菜单' : '打开菜单'}
        >
          {mobileOpen ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="top"
        id="mobile-nav"
        aria-label="主导航"
        overlayClassName={`header__backdrop${mobileOpen ? ' is-open' : ''}`}
        className={`header__nav header__nav--sheet${mobileOpen ? ' is-open' : ''}`}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          mobileFirstLinkRef.current?.focus();
        }}
      >
        <SheetTitle className="sr-only">站点导航</SheetTitle>
        <SheetDescription className="sr-only">移动端主导航菜单</SheetDescription>
        {MAIN_NAV_ITEMS.map((item, index) => {
          const isActive = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`header__link ${isActive ? 'header__link--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setMobileOpen(false)}
              ref={index === 0 ? mobileFirstLinkRef : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </SheetContent>
    </Sheet>
  );
}
