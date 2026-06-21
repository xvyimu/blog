'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`transition-colors hover:text-primary ${
        isActive ? 'text-primary font-semibold' : 'text-[var(--color-text-secondary)]'
      }`}
    >
      {children}
    </Link>
  );
}