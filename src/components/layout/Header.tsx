import NavLink from './NavLink';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { SITE_CONFIG } from '@/lib/constants';

export default function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-700">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink href="/">{SITE_CONFIG.name}</NavLink>
        <div className="flex items-center gap-6 text-sm">
          <nav className="flex items-center gap-6">
            <NavLink href="/blog">博客</NavLink>
            <NavLink href="/projects">作品集</NavLink>
            <NavLink href="/about">关于</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}